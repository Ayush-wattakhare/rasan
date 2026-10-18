-- Rasan Platform - Security & data-integrity hardening, round 2
-- Migration: 006_hardening_v2.sql
--
-- Safe to re-run (IF EXISTS / IF NOT EXISTS / CREATE OR REPLACE everywhere).
-- Apply on staging first. A rollback section is at the bottom (commented out).
--
-- Fix IDs refer to the fix plan v2 (A1..A14, D9).
--
-- Context: every browser write already goes through API routes that use the
-- service role, so removing direct table permissions from `authenticated`
-- below does not break any screen. The service role is unaffected by
-- GRANT/REVOKE and by RLS.

-- ---------------------------------------------------------------------------
-- D9. New subscription status for plans awaiting payment.
--     ALTER TYPE ... ADD VALUE cannot run inside the transaction that later uses
--     the value, so it runs on its own before BEGIN.
-- ---------------------------------------------------------------------------
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending_payment';

BEGIN;

-- ---------------------------------------------------------------------------
-- A1. orders.rating: validated, written only through the API.
--     A browser could write {food:'x'}; the stats triggers then failed every
--     later "delivered" update for that kitchen / rider.
-- ---------------------------------------------------------------------------

-- Returns the score (1..5) for a rating key, or NULL if missing / not a valid number.
CREATE OR REPLACE FUNCTION rating_score(p_rating JSONB, p_key TEXT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rating IS NULL OR jsonb_typeof(p_rating) <> 'object' THEN NULL
    WHEN jsonb_typeof(p_rating -> p_key) <> 'number' THEN NULL
    WHEN (p_rating ->> p_key)::numeric BETWEEN 1 AND 5 THEN (p_rating ->> p_key)::numeric
    ELSE NULL
  END;
$$;

-- Clean rows that would violate the new constraint.
UPDATE orders
SET rating = NULL
WHERE rating IS NOT NULL
  AND (
    jsonb_typeof(rating) <> 'object'
    OR (rating ? 'food' AND rating_score(rating, 'food') IS NULL)
    OR (rating ? 'delivery' AND rating_score(rating, 'delivery') IS NULL)
  );

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_rating_valid;
ALTER TABLE orders ADD CONSTRAINT orders_rating_valid CHECK (
  rating IS NULL OR (
    jsonb_typeof(rating) = 'object'
    AND (NOT rating ? 'food' OR rating_score(rating, 'food') IS NOT NULL)
    AND (NOT rating ? 'delivery' OR rating_score(rating, 'delivery') IS NOT NULL)
  )
);

REVOKE UPDATE ON orders FROM anon, authenticated;
DROP POLICY IF EXISTS "Customers can rate their own delivered orders" ON orders;

-- Stats triggers: tolerate bad values instead of failing the whole update.
CREATE OR REPLACE FUNCTION update_vendor_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Kitchen rating comes from the reviews table only (update_vendor_rating_from_reviews);
  -- this trigger just counts delivered orders.
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    UPDATE vendors
    SET total_orders = COALESCE(total_orders, 0) + 1
    WHERE id = NEW.vendor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee NUMERIC := COALESCE(NEW.delivery_fee, 0);
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

-- ---------------------------------------------------------------------------
-- A12. Recalculate the rider's average as soon as a delivery rating is written,
--      not only on the next delivery. (Kitchen ratings: reviews table, A13.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalc_order_party_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating IS NOT DISTINCT FROM OLD.rating THEN
    RETURN NEW;
  END IF;

  IF NEW.delivery_partner_id IS NOT NULL THEN
    UPDATE delivery_partners
    SET rating = (
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

DROP TRIGGER IF EXISTS recalc_order_party_ratings_trigger ON orders;
CREATE TRIGGER recalc_order_party_ratings_trigger
  AFTER UPDATE OF rating ON orders
  FOR EACH ROW EXECUTE FUNCTION recalc_order_party_ratings();

-- ---------------------------------------------------------------------------
-- A13. Meal rating: also on DELETE, and recompute the old meal if a review moves.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_meal_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.meal_id IS NOT NULL THEN
    UPDATE meals
    SET rating = (SELECT COALESCE(ROUND(AVG(r.rating), 2), 0) FROM reviews r WHERE r.meal_id = NEW.meal_id)
    WHERE id = NEW.meal_id;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.meal_id IS NOT NULL
     AND (TG_OP = 'DELETE' OR OLD.meal_id IS DISTINCT FROM NEW.meal_id) THEN
    UPDATE meals
    SET rating = (SELECT COALESCE(ROUND(AVG(r.rating), 2), 0) FROM reviews r WHERE r.meal_id = OLD.meal_id)
    WHERE id = OLD.meal_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_meal_rating_trigger ON reviews;
CREATE TRIGGER update_meal_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_meal_rating();

-- Vendor rating from reviews (replaces the racy recompute in /api/reviews).
CREATE OR REPLACE FUNCTION update_vendor_rating_from_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor UUID;
BEGIN
  SELECT m.vendor_id INTO v_vendor FROM meals m WHERE m.id = COALESCE(NEW.meal_id, OLD.meal_id);
  IF v_vendor IS NOT NULL THEN
    UPDATE vendors
    SET rating = (
      SELECT COALESCE(ROUND(AVG(r.rating), 2), 0)
      FROM reviews r JOIN meals m ON m.id = r.meal_id
      WHERE m.vendor_id = v_vendor
    )
    WHERE id = v_vendor;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_vendor_rating_from_reviews_trigger ON reviews;
CREATE TRIGGER update_vendor_rating_from_reviews_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating_from_reviews();

-- ---------------------------------------------------------------------------
-- A2. subscriptions: no direct writes from the browser (schedule rules live in the API).
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON subscriptions FROM anon, authenticated;
DROP POLICY IF EXISTS "Customers can update their own subscriptions" ON subscriptions;

-- Pause bookkeeping for D12.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paused_at DATE;

-- ---------------------------------------------------------------------------
-- A3. Phone-only sign-ups have no email.
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
-- Empty strings were used as "no email"; normalise so UNIQUE allows many.
UPDATE profiles SET email = NULL WHERE email = '';

-- ---------------------------------------------------------------------------
-- A8. profiles: phone is changed only through the API (which resets phone_verified).
--     Uniqueness applies to verified numbers only, so nobody can block someone
--     else's phone sign-up by typing their number into a profile.
-- ---------------------------------------------------------------------------
UPDATE profiles SET phone = NULL WHERE phone = '';

REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (name, avatar_url, address, updated_at) ON profiles TO authenticated;

DROP INDEX IF EXISTS profiles_phone_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_verified_phone_unique_idx
  ON profiles (phone)
  WHERE phone IS NOT NULL AND phone_verified;

-- ---------------------------------------------------------------------------
-- A5. Vendor approval is its own flag (profiles.is_verified is shared with the
--     rider role, so an approved rider could open an unapproved kitchen).
-- ---------------------------------------------------------------------------
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Backfill: live kitchens, and kitchens of currently-verified vendor accounts.
UPDATE vendors v
SET is_approved = true
WHERE v.is_approved = false
  AND (
    v.is_active IS TRUE
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = v.user_id AND p.role = 'vendor' AND p.is_verified IS TRUE
    )
  );

CREATE OR REPLACE FUNCTION guard_vendor_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_end_user_request()
     AND NEW.is_active IS TRUE
     AND COALESCE(OLD.is_active, false) IS FALSE
     AND NEW.is_approved IS NOT TRUE THEN
    RAISE EXCEPTION 'Vendor must be approved by an admin before going live'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- A6. meals visible only for active kitchens; meal & vendor rows written via API only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view available meals" ON meals;
CREATE POLICY "Anyone can view available meals"
  ON meals FOR SELECT
  USING (
    is_available = true
    AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = meals.vendor_id AND v.is_active IS TRUE)
  );

REVOKE INSERT, UPDATE, DELETE ON meals FROM anon, authenticated;
REVOKE INSERT ON vendors FROM anon, authenticated;
DROP POLICY IF EXISTS "Vendors can insert their own data" ON vendors;

-- ---------------------------------------------------------------------------
-- A7. reviews: API only; a review must be for a meal in the reviewer's delivered order.
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON reviews FROM anon, authenticated;

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
        AND o.items @> jsonb_build_array(jsonb_build_object('meal_id', meal_id::text))
    )
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

-- ---------------------------------------------------------------------------
-- A9. support_tickets: end users may only submit the descriptive fields; the rest
--     (status, priority, amounts, identity, order total) is set by the database.
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON support_tickets FROM anon, authenticated;
GRANT INSERT (user_id, category, subject, description, order_id) ON support_tickets TO authenticated;

CREATE OR REPLACE FUNCTION guard_support_ticket_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles;
BEGIN
  IF NOT is_end_user_request() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot file a ticket for another user' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF v_profile.id IS NULL OR v_profile.role::text NOT IN ('customer', 'vendor', 'delivery') THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = '42501';
  END IF;

  IF NEW.order_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = NEW.order_id
      AND (
        o.customer_id = auth.uid()
        OR o.vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
        OR o.delivery_partner_id IN (SELECT id FROM delivery_partners WHERE user_id = auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = '42501';
  END IF;

  NEW.ticket_number := 'TKT-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10));
  NEW.user_role := v_profile.role::text;
  NEW.user_name := COALESCE(v_profile.name, 'User');
  NEW.user_email := COALESCE(v_profile.email, '');
  NEW.user_phone := v_profile.phone;
  NEW.order_total := (SELECT total FROM orders WHERE id = NEW.order_id);
  NEW.status := 'open';
  NEW.priority := 'medium';
  NEW.resolution_notes := NULL;
  NEW.refund_amount := 0;
  NEW.compensation_amount := 0;
  NEW.subject := left(NEW.subject, 200);
  NEW.description := left(NEW.description, 4000);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_support_ticket_insert_trigger ON support_tickets;
CREATE TRIGGER guard_support_ticket_insert_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION guard_support_ticket_insert();

-- ---------------------------------------------------------------------------
-- A10. Payouts are written by the service role only (grants were revoked in 003,
--      so this admin policy never had an effect).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;
CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  USING (is_admin());
COMMENT ON TABLE payouts IS
  'Written only by the service role (request_payout RPC and admin settlement API).';

-- ---------------------------------------------------------------------------
-- A11. Rider earnings by period, computed in IST from delivered orders.
--      earnings.total on delivery_partners stays the withdrawable balance.
--      security_invoker: callers only see rows RLS lets them see (their own orders).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW delivery_partner_earnings_v
WITH (security_invoker = true) AS
SELECT
  o.delivery_partner_id,
  COALESCE(SUM(o.delivery_fee) FILTER (
    WHERE (o.actual_delivery_time AT TIME ZONE 'Asia/Kolkata')::date
          = (NOW() AT TIME ZONE 'Asia/Kolkata')::date), 0) AS today,
  COALESCE(SUM(o.delivery_fee) FILTER (
    WHERE (o.actual_delivery_time AT TIME ZONE 'Asia/Kolkata')::date
          >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')::date), 0) AS this_week,
  COALESCE(SUM(o.delivery_fee) FILTER (
    WHERE (o.actual_delivery_time AT TIME ZONE 'Asia/Kolkata')::date
          >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Kolkata')::date), 0) AS this_month,
  COALESCE(SUM(o.delivery_fee), 0) AS lifetime,
  COUNT(*) AS deliveries
FROM orders o
WHERE o.status = 'delivered' AND o.delivery_partner_id IS NOT NULL
GROUP BY o.delivery_partner_id;

REVOKE ALL ON delivery_partner_earnings_v FROM anon;
GRANT SELECT ON delivery_partner_earnings_v TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- A14. Order numbers from a sequence (4 random digits collided at ~120 orders/day).
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'ORD-' || to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-'
         || lpad((nextval('order_number_seq') % 1000000)::text, 6, '0');
$$;

-- Notification triggers insert into a table users cannot write: run as owner.
ALTER FUNCTION notify_new_order() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION notify_order_status_change() SECURITY DEFINER SET search_path = public;

-- Users may only flip is_read on their own notifications (not rewrite the text).
REVOKE INSERT, UPDATE, DELETE ON notifications FROM anon, authenticated;
GRANT UPDATE (is_read) ON notifications TO authenticated;

COMMIT;

-- ===========================================================================
-- ROLLBACK (manual; run only if this migration must be reverted)
-- ===========================================================================
-- BEGIN;
-- GRANT UPDATE (rating, updated_at) ON orders TO authenticated;
-- CREATE POLICY "Customers can rate their own delivered orders" ON orders FOR UPDATE
--   USING (customer_id = auth.uid() AND status = 'delivered')
--   WITH CHECK (customer_id = auth.uid() AND status = 'delivered');
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_rating_valid;
-- DROP TRIGGER IF EXISTS recalc_order_party_ratings_trigger ON orders;
-- DROP TRIGGER IF EXISTS update_vendor_rating_from_reviews_trigger ON reviews;
-- GRANT UPDATE (status, deliveries, address, delivery_time, delivery_days, auto_renew, updated_at)
--   ON subscriptions TO authenticated;
-- GRANT UPDATE (name, phone, avatar_url, address, updated_at) ON profiles TO authenticated;
-- DROP INDEX IF EXISTS profiles_verified_phone_unique_idx;
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx ON profiles (phone) WHERE phone IS NOT NULL;
-- GRANT INSERT (user_id, business_name, description, cuisine, location, address, phone, email,
--               operating_hours, documents) ON vendors TO authenticated;
-- DROP TRIGGER IF EXISTS guard_support_ticket_insert_trigger ON support_tickets;
-- GRANT INSERT ON support_tickets TO authenticated;
-- DROP VIEW IF EXISTS delivery_partner_earnings_v;
-- GRANT UPDATE ON notifications TO authenticated;
-- COMMIT;
-- (profiles.email NOT NULL, vendors.is_approved and the 'pending_payment' enum value
--  are left in place: they are additive and reverting them could lose data.)
