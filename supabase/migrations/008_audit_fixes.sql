-- Rasan Platform - Fixes from the 19 Oct 2026 audit
-- Migration: 008_audit_fixes.sql
--
-- Apply after 006 and 007. Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE).
-- Deploy order: run this migration FIRST, then deploy the app code that uses it.
--
--   1. Refund tracking (real Razorpay refunds)        refunds_ledger + orders.refunded_amount
--   2. Webhook event de-duplication                    payment_events
--   3. Stock reservation                               reserve_order_stock / release_order_stock
--   4. Expiry of abandoned online checkouts            expire_unpaid_orders
--   5. Rider fee kept separate from the customer bill  orders.rider_fee (+ trigger / view)
--   6. Payouts: honest vendor balance, reject/settle   request_payout / reject_payout / settle_payout
--   7. City waitlist                                   city_waitlist

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Refunds
-- ---------------------------------------------------------------------------
ALTER TABLE refunds_ledger ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE refunds_ledger ADD COLUMN IF NOT EXISTS gateway_refund_id TEXT;
ALTER TABLE refunds_ledger ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE refunds_ledger ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_ledger_gateway_refund_id
  ON refunds_ledger (gateway_refund_id) WHERE gateway_refund_id IS NOT NULL;

-- Money returned to the customer so far (partial refunds add up; never above total).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Gateway order ids identify exactly one order (webhook lookup). Only created when
-- the existing data has no duplicates, so this migration never fails on old rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM orders WHERE payment_order_id IS NOT NULL
    GROUP BY payment_order_id HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_order_id_unique
      ON orders (payment_order_id) WHERE payment_order_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped unique index on orders.payment_order_id: duplicates exist';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Webhook events already processed (Razorpay retries with the same event id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_events (
  event_id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON payment_events FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Stock: reserved when the order is created, released when it is cancelled
--    or expires. meals.stock NULL means "unlimited".
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION reserve_order_stock(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items JSONB;
  v_reserved BOOLEAN;
  r RECORD;
  v_stock INTEGER;
BEGIN
  SELECT items, stock_reserved INTO v_items, v_reserved
  FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_reserved THEN
    RETURN true;
  END IF;

  FOR r IN
    SELECT (i ->> 'meal_id')::uuid AS meal_id,
           SUM(GREATEST(COALESCE((i ->> 'quantity')::int, 1), 1))::int AS qty
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_items) = 'array' THEN v_items ELSE '[]'::jsonb END) AS i
    WHERE (i ->> 'meal_id') ~* '^[0-9a-f-]{36}$'
    GROUP BY 1
    ORDER BY 1 -- fixed lock order: no deadlocks between concurrent checkouts
  LOOP
    SELECT stock INTO v_stock FROM meals WHERE id = r.meal_id FOR UPDATE;
    IF v_stock IS NOT NULL THEN
      IF v_stock < r.qty THEN
        RAISE EXCEPTION 'OUT_OF_STOCK:%', r.meal_id USING ERRCODE = 'P0001';
      END IF;
      UPDATE meals SET stock = stock - r.qty WHERE id = r.meal_id;
    END IF;
  END LOOP;

  UPDATE orders SET stock_reserved = true WHERE id = p_order_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION release_order_stock(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items JSONB;
  r RECORD;
BEGIN
  -- Only the first caller releases (cancel, expiry and admin cancel can race).
  UPDATE orders SET stock_reserved = false
  WHERE id = p_order_id AND stock_reserved
  RETURNING items INTO v_items;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  FOR r IN
    SELECT (i ->> 'meal_id')::uuid AS meal_id,
           SUM(GREATEST(COALESCE((i ->> 'quantity')::int, 1), 1))::int AS qty
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_items) = 'array' THEN v_items ELSE '[]'::jsonb END) AS i
    WHERE (i ->> 'meal_id') ~* '^[0-9a-f-]{36}$'
    GROUP BY 1
    ORDER BY 1
  LOOP
    UPDATE meals SET stock = stock + r.qty WHERE id = r.meal_id AND stock IS NOT NULL;
  END LOOP;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION reserve_order_stock(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_order_stock(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_order_stock(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION release_order_stock(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Abandoned online checkouts: cancel unpaid online orders after p_minutes,
--    give their stock back and cancel the plan that was waiting on them.
--    A payment that still arrives later is refunded by the webhook.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_unpaid_orders(p_minutes INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids UUID[];
  v_id UUID;
BEGIN
  WITH expired AS (
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW(),
        tracking_updates = COALESCE(tracking_updates, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'status', 'cancelled',
            'timestamp', NOW(),
            'message', 'Payment was not completed in time. The order was cancelled automatically.'
          )
        )
    WHERE payment_method <> 'cash'
      AND status = 'pending'
      AND payment_status IN ('pending', 'failed')
      AND created_at < NOW() - make_interval(mins => GREATEST(p_minutes, 10))
    RETURNING id
  )
  SELECT COALESCE(array_agg(id), '{}') INTO v_ids FROM expired;

  FOREACH v_id IN ARRAY v_ids LOOP
    PERFORM release_order_stock(v_id);
  END LOOP;

  UPDATE subscriptions
  SET status = 'cancelled', updated_at = NOW()
  WHERE order_id = ANY (v_ids) AND status = 'pending_payment';

  RETURN COALESCE(array_length(v_ids, 1), 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION expire_unpaid_orders(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION expire_unpaid_orders(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. What the rider earns for a delivery. Kept apart from delivery_fee (what the
--    customer paid) so order totals stay consistent with what was charged.
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_fee NUMERIC(10, 2);

CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee NUMERIC := COALESCE(NEW.rider_fee, NEW.delivery_fee, 0);
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered')
     AND NEW.delivery_partner_id IS NOT NULL THEN
    UPDATE delivery_partners
    SET
      total_deliveries = COALESCE(total_deliveries, 0) + 1,
      earnings = COALESCE(earnings, '{}'::jsonb)
        || jsonb_build_object(
             'today',      COALESCE((earnings ->> 'today')::numeric, 0) + v_fee,
             'this_week',  COALESCE((earnings ->> 'this_week')::numeric, 0) + v_fee,
             'this_month', COALESCE((earnings ->> 'this_month')::numeric, 0) + v_fee,
             'total',      COALESCE((earnings ->> 'total')::numeric, 0) + v_fee
           ),
      rating = (
        SELECT COALESCE(ROUND(AVG(rating_score(o.rating, 'delivery')), 2), 0)
        FROM orders o
        WHERE o.delivery_partner_id = NEW.delivery_partner_id
          AND rating_score(o.rating, 'delivery') IS NOT NULL
      )
    WHERE id = NEW.delivery_partner_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW delivery_partner_earnings_v
WITH (security_invoker = true) AS
SELECT
  o.delivery_partner_id,
  COALESCE(SUM(COALESCE(o.rider_fee, o.delivery_fee, 0)) FILTER (
    WHERE (o.actual_delivery_time AT TIME ZONE 'Asia/Kolkata')::date
          = (NOW() AT TIME ZONE 'Asia/Kolkata')::date), 0) AS today,
  COALESCE(SUM(COALESCE(o.rider_fee, o.delivery_fee, 0)) FILTER (
    WHERE (o.actual_delivery_time AT TIME ZONE 'Asia/Kolkata')::date
          >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')::date), 0) AS this_week,
  COALESCE(SUM(COALESCE(o.rider_fee, o.delivery_fee, 0)) FILTER (
    WHERE (o.actual_delivery_time AT TIME ZONE 'Asia/Kolkata')::date
          >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Kolkata')::date), 0) AS this_month,
  COALESCE(SUM(COALESCE(o.rider_fee, o.delivery_fee, 0)), 0) AS lifetime,
  COUNT(*) AS deliveries
FROM orders o
WHERE o.status = 'delivered' AND o.delivery_partner_id IS NOT NULL
GROUP BY o.delivery_partner_id;

REVOKE ALL ON delivery_partner_earnings_v FROM anon;
GRANT SELECT ON delivery_partner_earnings_v TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Payouts
--    Vendor balance = food value (subtotal, not the platform fee) of delivered,
--    non-refunded orders, minus commission, minus payouts not rejected.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vendor_available_balance(p_user_id UUID, p_commission_rate NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT SUM(GREATEST(COALESCE(o.subtotal, 0) - COALESCE(o.refunded_amount, 0), 0))
      FROM orders o
      JOIN vendors v ON v.id = o.vendor_id
      WHERE v.user_id = p_user_id
        AND o.status = 'delivered'
        AND o.payment_status <> 'refunded'
    ), 0) * (1 - p_commission_rate)
    - COALESCE((
      SELECT SUM(amount) FROM payouts
      WHERE user_id = p_user_id AND payee_type = 'vendor' AND status <> 'rejected'
    ), 0);
$$;

-- Service role only: it takes any user id, so end users must not call it directly.
REVOKE EXECUTE ON FUNCTION vendor_available_balance(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION vendor_available_balance(UUID, NUMERIC) TO service_role;

CREATE OR REPLACE FUNCTION request_payout(
  p_user_id UUID,
  p_payee_type TEXT,
  p_amount NUMERIC,
  p_method TEXT,
  p_destination JSONB,
  p_commission_rate NUMERIC
)
RETURNS payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
  v_vendor_id UUID;
  v_partner_id UUID;
  v_payout payouts;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount' USING ERRCODE = '22023';
  END IF;

  IF p_payee_type = 'delivery' THEN
    SELECT id, COALESCE((earnings->>'total')::numeric, 0)
      INTO v_partner_id, v_balance
      FROM delivery_partners
      WHERE user_id = p_user_id
      FOR UPDATE;

    IF v_partner_id IS NULL THEN
      RAISE EXCEPTION 'Delivery partner not found' USING ERRCODE = 'P0002';
    END IF;
    IF v_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance' USING ERRCODE = '22023';
    END IF;

    UPDATE delivery_partners
      SET earnings = jsonb_set(COALESCE(earnings, '{}'::jsonb), '{total}', to_jsonb(v_balance - p_amount))
      WHERE id = v_partner_id;

  ELSIF p_payee_type = 'vendor' THEN
    SELECT id INTO v_vendor_id
      FROM vendors
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE;

    IF v_vendor_id IS NULL THEN
      RAISE EXCEPTION 'Vendor not found' USING ERRCODE = 'P0002';
    END IF;

    v_balance := vendor_available_balance(p_user_id, p_commission_rate);
    IF v_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance' USING ERRCODE = '22023';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid payee type' USING ERRCODE = '22023';
  END IF;

  INSERT INTO payouts (user_id, payee_type, amount, method, destination, reference)
  VALUES (
    p_user_id,
    p_payee_type,
    p_amount,
    p_method,
    COALESCE(p_destination, '{}'::jsonb),
    'PAY-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 12))
  )
  RETURNING * INTO v_payout;

  RETURN v_payout;
END;
$$;

REVOKE EXECUTE ON FUNCTION request_payout(UUID, TEXT, NUMERIC, TEXT, JSONB, NUMERIC)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION request_payout(UUID, TEXT, NUMERIC, TEXT, JSONB, NUMERIC)
  TO service_role;

-- Marks a pending payout as paid. Only once; a rejected payout can never be settled.
CREATE OR REPLACE FUNCTION settle_payout(p_payout_id UUID, p_utr TEXT, p_notes TEXT)
RETURNS payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout payouts;
BEGIN
  IF p_utr IS NULL OR length(trim(p_utr)) < 6 THEN
    RAISE EXCEPTION 'A bank / UPI reference (UTR) is required' USING ERRCODE = '22023';
  END IF;

  UPDATE payouts
  SET status = 'completed',
      utr_number = trim(p_utr),
      notes = NULLIF(trim(COALESCE(p_notes, '')), ''),
      settled_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payout_id AND status IN ('pending', 'processing')
  RETURNING * INTO v_payout;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout is not awaiting settlement' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_payout;
END;
$$;

-- Rejects a pending payout and gives the money back to the payee's balance.
CREATE OR REPLACE FUNCTION reject_payout(p_payout_id UUID, p_reason TEXT)
RETURNS payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout payouts;
BEGIN
  UPDATE payouts
  SET status = 'rejected',
      notes = NULLIF(trim(COALESCE(p_reason, '')), ''),
      updated_at = NOW()
  WHERE id = p_payout_id AND status IN ('pending', 'processing')
  RETURNING * INTO v_payout;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout is not awaiting settlement' USING ERRCODE = 'P0001';
  END IF;

  -- Vendor balances are computed (rejected payouts don't count); rider balances are stored.
  IF v_payout.payee_type = 'delivery' THEN
    UPDATE delivery_partners
    SET earnings = jsonb_set(
          COALESCE(earnings, '{}'::jsonb),
          '{total}',
          to_jsonb(COALESCE((earnings ->> 'total')::numeric, 0) + v_payout.amount)
        )
    WHERE user_id = v_payout.user_id;
  END IF;

  RETURN v_payout;
END;
$$;

REVOKE EXECUTE ON FUNCTION settle_payout(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION reject_payout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION settle_payout(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reject_payout(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 7. "Not in your city yet" waitlist (written by the API with the service role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS city_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 254),
  city TEXT NOT NULL DEFAULT '' CHECK (length(city) <= 120),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_city_waitlist_email_city
  ON city_waitlist (lower(email), lower(city));
ALTER TABLE city_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON city_waitlist FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins can view the waitlist" ON city_waitlist;
CREATE POLICY "Admins can view the waitlist"
  ON city_waitlist FOR SELECT
  USING (is_admin());
GRANT SELECT ON city_waitlist TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Rider rows are created by the application flow (service role) only.
--    The browser could insert its own delivery_partners row with any
--    documents / bank details and skip the review notification.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Delivery partners can insert their own data" ON delivery_partners;
REVOKE INSERT ON delivery_partners FROM anon, authenticated;

COMMIT;

-- ===========================================================================
-- ROLLBACK (manual)
-- ===========================================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS reject_payout(UUID, TEXT);
-- DROP FUNCTION IF EXISTS settle_payout(UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS expire_unpaid_orders(INTEGER);
-- DROP FUNCTION IF EXISTS release_order_stock(UUID);
-- DROP FUNCTION IF EXISTS reserve_order_stock(UUID);
-- DROP TABLE IF EXISTS payment_events;
-- DROP TABLE IF EXISTS city_waitlist;
-- (request_payout / update_delivery_partner_stats / delivery_partner_earnings_v:
--  re-run their definitions from 003 / 006. Added columns are left in place.)
-- COMMIT;
