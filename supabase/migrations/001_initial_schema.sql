-- HomelyEats Platform - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Complete database schema with PostGIS extension, tables, indexes, and functions

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'delivery', 'admin');

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'wallet');

CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'completed');

CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TYPE vehicle_type AS ENUM ('bike', 'scooter', 'car');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT[],
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  operating_hours JSONB NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  bank_details JSONB,
  documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  meal_type meal_type NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2),
  image_url TEXT,
  ingredients TEXT[],
  allergens TEXT[],
  nutritional_info JSONB,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  stock INTEGER,
  preparation_time INTEGER NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Partners table
CREATE TABLE delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  vehicle_number TEXT NOT NULL,
  license_number TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT, 4326),
  rating NUMERIC(3, 2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  earnings JSONB DEFAULT '{"today": 0, "this_week": 0, "this_month": 0, "total": 0}'::jsonb,
  documents JSONB,
  bank_details JSONB,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  delivery_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  payment_id TEXT,
  delivery_address JSONB NOT NULL,
  delivery_instructions TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  tracking_updates JSONB DEFAULT '[]'::jsonb,
  rating JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  meal_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  delivery_days TEXT[],
  delivery_time TIME NOT NULL,
  address JSONB NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  status subscription_status DEFAULT 'active',
  payment_status payment_status DEFAULT 'pending',
  auto_renew BOOLEAN DEFAULT false,
  deliveries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order', 'delivery', 'payment', 'promotion', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meal_id, user_id, order_id)
);

-- Group Orders table
CREATE TABLE group_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  participants JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'ordered')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan Pricing table
CREATE TABLE plan_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  meal_type TEXT NOT NULL,
  days_per_week INTEGER NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  final_price NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Vendors indexes
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);

-- Meals indexes
CREATE INDEX idx_meals_vendor_id ON meals(vendor_id);
CREATE INDEX idx_meals_category ON meals(category);
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_is_available ON meals(is_available);
CREATE INDEX idx_meals_price ON meals(price);

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_delivery_partner_id ON orders(delivery_partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Delivery Partners indexes
CREATE INDEX idx_delivery_partners_user_id ON delivery_partners(user_id);
CREATE INDEX idx_delivery_partners_is_online ON delivery_partners(is_online);
CREATE INDEX idx_delivery_partners_is_verified ON delivery_partners(is_verified);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_vendor_id ON subscriptions(vendor_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_start_date ON subscriptions(start_date);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Categories indexes
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Reviews indexes
CREATE INDEX idx_reviews_meal_id ON reviews(meal_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);

-- Group Orders indexes
CREATE INDEX idx_group_orders_host_id ON group_orders(host_id);
CREATE INDEX idx_group_orders_vendor_id ON group_orders(vendor_id);
CREATE INDEX idx_group_orders_status ON group_orders(status);

-- Plan Pricing indexes
CREATE INDEX idx_plan_pricing_is_active ON plan_pricing(is_active);

-- ============================================================================
-- SPATIAL INDEXES (GIST) FOR GEOSPATIAL QUERIES
-- ============================================================================

-- Spatial index for vendors location
CREATE INDEX idx_vendors_location ON vendors USING GIST(location);

-- Spatial index for delivery partners location
CREATE INDEX idx_delivery_partners_location ON delivery_partners USING GIST(current_location);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_partners_updated_at
  BEFORE UPDATE ON delivery_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_orders_updated_at
  BEFORE UPDATE ON group_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_pricing_updated_at
  BEFORE UPDATE ON plan_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
BEGIN
  new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to find nearby vendors using PostGIS
CREATE OR REPLACE FUNCTION nearby_vendors(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  cuisine TEXT[],
  rating NUMERIC,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.business_name,
    v.cuisine,
    v.rating,
    ST_Distance(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM vendors v
  WHERE 
    v.is_active = true AND
    ST_DWithin(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to assign nearest delivery partner
CREATE OR REPLACE FUNCTION assign_delivery_partner(p_order_id UUID)
RETURNS UUID AS $$
DECLARE
  v_vendor_location GEOGRAPHY;
  v_delivery_partner_id UUID;
BEGIN
  -- Get vendor location for the order
  SELECT v.location
  INTO v_vendor_location
  FROM orders o
  JOIN vendors v ON o.vendor_id = v.id
  WHERE o.id = p_order_id;
  
  -- Find nearest available delivery partner
  SELECT dp.id
  INTO v_delivery_partner_id
  FROM delivery_partners dp
  WHERE 
    dp.is_online = true AND
    dp.is_verified = true AND
    dp.current_location IS NOT NULL AND
    dp.id NOT IN (
      SELECT delivery_partner_id 
      FROM orders 
      WHERE status IN ('picked_up', 'out_for_delivery')
      AND delivery_partner_id IS NOT NULL
    )
  ORDER BY ST_Distance(dp.current_location, v_vendor_location)
  LIMIT 1;
  
  -- Update order with assigned delivery partner
  IF v_delivery_partner_id IS NOT NULL THEN
    UPDATE orders
    SET delivery_partner_id = v_delivery_partner_id
    WHERE id = p_order_id;
  END IF;
  
  RETURN v_delivery_partner_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate delivery fee based on distance
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
  vendor_lat FLOAT,
  vendor_lng FLOAT,
  delivery_lat FLOAT,
  delivery_lng FLOAT
)
RETURNS NUMERIC AS $$
DECLARE
  distance_km FLOAT;
  base_fee NUMERIC := 20.00;
  per_km_fee NUMERIC := 5.00;
  total_fee NUMERIC;
BEGIN
  -- Calculate distance using PostGIS
  distance_km := ST_Distance(
    ST_SetSRID(ST_MakePoint(vendor_lng, vendor_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(delivery_lng, delivery_lat), 4326)::geography
  ) / 1000;
  
  -- Calculate fee: base fee + distance-based fee
  total_fee := base_fee + (distance_km * per_km_fee);
  
  -- Round to 2 decimal places
  RETURN ROUND(total_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update meal rating when review is added/updated
CREATE OR REPLACE FUNCTION update_meal_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE meals
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE meal_id = NEW.meal_id
  )
  WHERE id = NEW.meal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_meal_rating();

-- Function to update vendor stats when order is delivered
CREATE OR REPLACE FUNCTION update_vendor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE vendors
    SET 
      total_orders = total_orders + 1,
      rating = (
        SELECT COALESCE(AVG((rating->>'food')::numeric), 0)
        FROM orders
        WHERE vendor_id = NEW.vendor_id AND rating IS NOT NULL
      )
    WHERE id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_stats_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_vendor_stats();

-- Function to update delivery partner stats when order is delivered
CREATE OR REPLACE FUNCTION update_delivery_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE delivery_partners
    SET 
      total_deliveries = total_deliveries + 1,
      earnings = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              earnings,
              '{today}',
              to_jsonb((earnings->>'today')::numeric + NEW.delivery_fee)
            ),
            '{this_week}',
            to_jsonb((earnings->>'this_week')::numeric + NEW.delivery_fee)
          ),
          '{this_month}',
          to_jsonb((earnings->>'this_month')::numeric + NEW.delivery_fee)
        ),
        '{total}',
        to_jsonb((earnings->>'total')::numeric + NEW.delivery_fee)
      ),
      rating = (
        SELECT COALESCE(AVG((rating->>'delivery')::numeric), 0)
        FROM orders
        WHERE delivery_partner_id = NEW.delivery_partner_id AND rating IS NOT NULL
      )
    WHERE id = NEW.delivery_partner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_partner_stats_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_delivery_partner_stats();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pricing ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view active profiles"
  ON profiles FOR SELECT
  USING (is_active = true);

-- Vendors RLS policies
CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can update their own data"
  ON vendors FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can insert their own data"
  ON vendors FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Meals RLS policies
CREATE POLICY "Anyone can view available meals"
  ON meals FOR SELECT
  USING (is_available = true);

CREATE POLICY "Vendors can manage their own meals"
  ON meals FOR ALL
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Orders RLS policies
CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view their orders"
  ON orders FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Delivery partners can view assigned orders"
  ON orders FOR SELECT
  USING (
    delivery_partner_id IN (SELECT id FROM delivery_partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update order status"
  ON orders FOR UPDATE
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Delivery partners can update delivery status"
  ON orders FOR UPDATE
  USING (
    delivery_partner_id IN (SELECT id FROM delivery_partners WHERE user_id = auth.uid())
  );

-- Delivery Partners RLS policies
CREATE POLICY "Anyone can view verified delivery partners"
  ON delivery_partners FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Delivery partners can update their own data"
  ON delivery_partners FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Delivery partners can insert their own data"
  ON delivery_partners FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Subscriptions RLS policies
CREATE POLICY "Customers can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view their subscriptions"
  ON subscriptions FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (customer_id = auth.uid());

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Categories RLS policies
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Reviews RLS policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their orders"
  ON reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid());

-- Group Orders RLS policies
CREATE POLICY "Participants can view group orders"
  ON group_orders FOR SELECT
  USING (
    host_id = auth.uid() OR
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements(participants)->>'user_id'
    )
  );

CREATE POLICY "Host can create group orders"
  ON group_orders FOR INSERT
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host can update group orders"
  ON group_orders FOR UPDATE
  USING (host_id = auth.uid());

-- Plan Pricing RLS policies
CREATE POLICY "Anyone can view active plans"
  ON plan_pricing FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE vendors IS 'Vendor/restaurant information with geospatial location';
COMMENT ON TABLE meals IS 'Food items offered by vendors';
COMMENT ON TABLE orders IS 'Customer orders with payment and delivery tracking';
COMMENT ON TABLE delivery_partners IS 'Delivery personnel with real-time location tracking';
COMMENT ON TABLE subscriptions IS 'Recurring meal delivery subscriptions';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE categories IS 'Meal categories for filtering';
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for meals';
COMMENT ON TABLE group_orders IS 'Collaborative orders with multiple participants';
COMMENT ON TABLE plan_pricing IS 'Subscription plan pricing configurations';

COMMENT ON FUNCTION nearby_vendors IS 'Find vendors within specified radius using PostGIS';
COMMENT ON FUNCTION assign_delivery_partner IS 'Assign nearest available delivery partner to an order';
COMMENT ON FUNCTION calculate_delivery_fee IS 'Calculate delivery fee based on distance';
COMMENT ON FUNCTION update_meal_rating IS 'Automatically update meal rating when reviews change';
COMMENT ON FUNCTION update_vendor_stats IS 'Update vendor statistics when orders are delivered';
COMMENT ON FUNCTION update_delivery_partner_stats IS 'Update delivery partner earnings and stats';
