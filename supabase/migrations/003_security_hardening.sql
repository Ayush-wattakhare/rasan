-- Rasan Platform - Security hardening
-- Description: Locks privileged columns against direct writes with the public anon key,
--              syncs profiles.role into auth app_metadata, and adds the payout ledger
--              plus the columns the hardened API routes rely on.
--
-- IMPORTANT: Apply this migration BEFORE deploying the application code that ships with it.
--            See docs/audit/2026-10-security-cleanup/PLAN.md §5.
--
-- Background: Supabase grants table-level INSERT/UPDATE to the `anon` and `authenticated`
-- roles by default, and the original RLS UPDATE policies only check row ownership. That let
-- any signed-in user run, from the browser, e.g.
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', me)
--   supabase.from('orders').update({ payment_status: 'paid' }).eq('id', myOrder)
-- Column-level grants below restrict *which* columns end users may write. Server routes use
-- the service role and are unaffected.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Helper: true when the current request comes from an end user (anon key / user JWT)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_end_user_request()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.role(), '') IN ('anon', 'authenticated');
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles: users may edit only their own contact fields
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (name, phone, avatar_url, address, updated_at) ON profiles TO authenticated;

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. Keep auth app_metadata.role in sync with profiles.role
--    app_metadata cannot be edited by users (unlike user_metadata), so the
--    middleware can trust it without a database round trip.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_profile_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                          || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION sync_profile_role_to_auth() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_profile_role_to_auth_trigger ON profiles;
CREATE TRIGGER sync_profile_role_to_auth_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_role_to_auth();

-- One-time backfill for existing users
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object('role', p.role::text)
FROM profiles p
WHERE p.id = u.id;

-- ---------------------------------------------------------------------------
-- 3. vendors: owners edit storefront fields; activation requires admin approval
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON vendors FROM anon, authenticated;
GRANT INSERT (user_id, business_name, description, cuisine, location, address, phone, email,
              operating_hours, documents)
  ON vendors TO authenticated;
GRANT UPDATE (business_name, description, cuisine, location, address, phone, email,
              operating_hours, bank_details, documents, is_active, updated_at)
  ON vendors TO authenticated;

DROP POLICY IF EXISTS "Vendors can update their own data" ON vendors;
CREATE POLICY "Vendors can update their own data"
  ON vendors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can insert their own data" ON vendors;
CREATE POLICY "Vendors can insert their own data"
  ON vendors FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_active = false);

-- A vendor may open/close their own kitchen only after an admin has verified them.
CREATE OR REPLACE FUNCTION guard_vendor_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_end_user_request()
     AND NEW.is_active IS TRUE
     AND COALESCE(OLD.is_active, false) IS FALSE
     AND NOT EXISTS (
       SELECT 1 FROM profiles WHERE id = NEW.user_id AND is_verified IS TRUE
     ) THEN
    RAISE EXCEPTION 'Vendor must be verified by an admin before going live'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_vendor_activation_trigger ON vendors;
CREATE TRIGGER guard_vendor_activation_trigger
  BEFORE UPDATE OF is_active ON vendors
  FOR EACH ROW EXECUTE FUNCTION guard_vendor_activation();

-- ---------------------------------------------------------------------------
-- 4. delivery_partners: riders edit availability/vehicle only; never earnings or verification
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON delivery_partners FROM anon, authenticated;
GRANT INSERT (user_id, vehicle_type, vehicle_number, license_number, documents, bank_details)
  ON delivery_partners TO authenticated;
GRANT UPDATE (is_online, current_location, vehicle_type, vehicle_number, license_number,
              documents, bank_details, updated_at)
  ON delivery_partners TO authenticated;

DROP POLICY IF EXISTS "Delivery partners can update their own data" ON delivery_partners;
CREATE POLICY "Delivery partners can update their own data"
  ON delivery_partners FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. orders: created and transitioned by server routes only.
--    Customers may only attach a rating to their own order.
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS compensated_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_orders_payment_order_id ON orders(payment_order_id);

REVOKE INSERT, UPDATE ON orders FROM anon, authenticated;
GRANT UPDATE (rating, updated_at) ON orders TO authenticated;

DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Vendors can update order status" ON orders;
DROP POLICY IF EXISTS "Delivery partners can update delivery status" ON orders;
DROP POLICY IF EXISTS "Customers can update their own orders" ON orders;
CREATE POLICY "Customers can rate their own delivered orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid() AND status = 'delivered')
  WITH CHECK (customer_id = auth.uid() AND status = 'delivered');

-- ---------------------------------------------------------------------------
-- 6. subscriptions: created by server routes; customers manage schedule fields only
-- ---------------------------------------------------------------------------
-- One subscription per checkout order (set when created from checkout).
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_order_id ON subscriptions(order_id)
  WHERE order_id IS NOT NULL;

REVOKE INSERT, UPDATE ON subscriptions FROM anon, authenticated;
GRANT UPDATE (status, deliveries, address, delivery_time, delivery_days, auto_renew, updated_at)
  ON subscriptions TO authenticated;

DROP POLICY IF EXISTS "Customers can create subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Customers can update their own subscriptions" ON subscriptions;
CREATE POLICY "Customers can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- End users may pause/resume/cancel, but never revive a cancelled or completed plan.
CREATE OR REPLACE FUNCTION guard_subscription_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_end_user_request() AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('cancelled', 'completed') THEN
      RAISE EXCEPTION 'Subscription is % and cannot be changed', OLD.status
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status NOT IN ('active', 'paused', 'cancelled') THEN
      RAISE EXCEPTION 'Invalid subscription status %', NEW.status
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_subscription_status_trigger ON subscriptions;
CREATE TRIGGER guard_subscription_status_trigger
  BEFORE UPDATE OF status ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION guard_subscription_status();

-- ---------------------------------------------------------------------------
-- 7. reviews: only for the reviewer's own delivered order
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create reviews for their orders" ON reviews;
CREATE POLICY "Users can create reviews for their orders"
  ON reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND o.customer_id = auth.uid()
        AND o.status = 'delivered'
    )
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. Payout ledger + atomic payout request
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payee_type TEXT NOT NULL CHECK (payee_type IN ('vendor', 'delivery')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('upi', 'bank')),
  destination JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON payouts FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
CREATE POLICY "Users can view their own payouts"
  ON payouts FOR SELECT
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atomically checks the balance and records a pending payout.
--   delivery: deducts from delivery_partners.earnings.total (row locked)
--   vendor:   balance = delivered order totals * (1 - commission) - non-rejected payouts
-- Callable by the service role only (the API route authenticates the user first).
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
      SET earnings = jsonb_set(earnings, '{total}', to_jsonb(v_balance - p_amount))
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

    SELECT
      COALESCE((SELECT SUM(total) FROM orders
                WHERE vendor_id = v_vendor_id AND status = 'delivered'), 0)
        * (1 - p_commission_rate)
      - COALESCE((SELECT SUM(amount) FROM payouts
                  WHERE user_id = p_user_id AND payee_type = 'vendor'
                    AND status <> 'rejected'), 0)
      INTO v_balance;

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

COMMIT;
