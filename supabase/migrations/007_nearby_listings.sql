-- Rasan Platform - Location-aware listings
-- Migration: 007_nearby_listings.sql
--
-- Listing pages (home, /meals, /vendors) only show kitchens that can deliver to
-- the customer's location. Safe to re-run. Apply after 006.

BEGIN;

-- Sign-up / admin flows insert placeholder points into the NOT NULL
-- vendors.location column until a chef pins their kitchen. Those kitchens have
-- no real location and must never appear "near" anyone.
CREATE OR REPLACE FUNCTION is_placeholder_vendor_location(p_location GEOGRAPHY)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_location IS NULL
      OR ST_DWithin(p_location, ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography, 1)  -- Mumbai centre
      OR ST_DWithin(p_location, ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326)::geography, 1); -- Pune centre
$$;

-- ---------------------------------------------------------------------------
-- Active kitchens within `radius_km` of the customer, nearest first.
-- SECURITY INVOKER: only rows/columns the caller may already read (migration
-- 003 grants these vendor columns to anon/authenticated).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION nearby_kitchens(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  description TEXT,
  cuisine TEXT[],
  address TEXT,
  rating NUMERIC,
  total_orders INTEGER,
  operating_hours JSONB,
  distance_km FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.id,
    v.business_name,
    v.description,
    v.cuisine,
    v.address,
    v.rating,
    v.total_orders,
    v.operating_hours,
    ST_Distance(v.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000 AS distance_km
  FROM vendors v
  WHERE v.is_active = true
    AND NOT is_placeholder_vendor_location(v.location)
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      LEAST(GREATEST(radius_km, 0), 50) * 1000
    )
  ORDER BY distance_km
  LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION nearby_kitchens(FLOAT, FLOAT, FLOAT) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Delivered-order counts per meal over the last `days` days.
-- SECURITY DEFINER because end users cannot read other people's orders; it
-- returns only aggregate counts, never order rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION meal_order_counts(meal_ids UUID[], days INTEGER DEFAULT 30)
RETURNS TABLE (meal_id UUID, order_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (item ->> 'meal_id')::uuid AS meal_id,
         SUM(GREATEST(COALESCE((item ->> 'quantity')::int, 1), 1))::bigint AS order_count
  FROM orders o
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END
  ) AS item
  WHERE o.status = 'delivered'
    AND o.created_at >= NOW() - make_interval(days => LEAST(GREATEST(days, 1), 365))
    AND (item ->> 'meal_id') ~* '^[0-9a-f-]{36}$'
    AND (item ->> 'meal_id')::uuid = ANY (meal_ids[1:500])
  GROUP BY 1;
$$;

REVOKE EXECUTE ON FUNCTION meal_order_counts(UUID[], INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION meal_order_counts(UUID[], INTEGER) TO anon, authenticated, service_role;

COMMIT;

-- Rollback:
-- DROP FUNCTION IF EXISTS meal_order_counts(UUID[], INTEGER);
-- DROP FUNCTION IF EXISTS nearby_kitchens(FLOAT, FLOAT, FLOAT);
-- DROP FUNCTION IF EXISTS is_placeholder_vendor_location(GEOGRAPHY);
