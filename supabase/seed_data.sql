-- HomelyEats Platform - Seed Data for Testing
-- This file contains sample data for development and testing purposes
-- Run this AFTER the initial schema migration (001_initial_schema.sql)

-- ============================================================================
-- IMPORTANT: Update these UUIDs with actual user IDs from your auth.users table
-- ============================================================================
-- After creating users through the app, replace these placeholder UUIDs
-- with actual user IDs from: SELECT id, email FROM auth.users;

-- ============================================================================
-- SAMPLE CATEGORIES
-- ============================================================================

INSERT INTO categories (name, description, is_active) VALUES
  ('Indian', 'Traditional Indian cuisine', true),
  ('Chinese', 'Chinese and Indo-Chinese dishes', true),
  ('Italian', 'Italian pasta, pizza, and more', true),
  ('Fast Food', 'Quick bites and snacks', true),
  ('Healthy', 'Nutritious and healthy meals', true),
  ('Desserts', 'Sweet treats and desserts', true),
  ('Beverages', 'Drinks and refreshments', true);

-- ============================================================================
-- SAMPLE PLAN PRICING
-- ============================================================================

INSERT INTO plan_pricing (plan_type, meal_type, days_per_week, base_price, discount_percentage, final_price, is_active) VALUES
  -- Daily plans
  ('daily', 'breakfast', 7, 1400.00, 10, 1260.00, true),
  ('daily', 'lunch', 7, 2100.00, 10, 1890.00, true),
  ('daily', 'dinner', 7, 2100.00, 10, 1890.00, true),
  ('daily', 'all', 7, 4900.00, 15, 4165.00, true),
  
  -- Weekly plans (5 days)
  ('weekly', 'breakfast', 5, 1000.00, 10, 900.00, true),
  ('weekly', 'lunch', 5, 1500.00, 10, 1350.00, true),
  ('weekly', 'dinner', 5, 1500.00, 10, 1350.00, true),
  ('weekly', 'all', 5, 3500.00, 15, 2975.00, true),
  
  -- Monthly plans
  ('monthly', 'breakfast', 30, 6000.00, 20, 4800.00, true),
  ('monthly', 'lunch', 30, 9000.00, 20, 7200.00, true),
  ('monthly', 'dinner', 30, 9000.00, 20, 7200.00, true),
  ('monthly', 'all', 30, 21000.00, 25, 15750.00, true);

-- ============================================================================
-- SAMPLE VENDORS
-- ============================================================================
-- Note: Replace 'user-uuid-1', 'user-uuid-2', etc. with actual user IDs

-- Vendor 1: Mumbai Spice Kitchen
INSERT INTO vendors (
  user_id,
  business_name,
  description,
  cuisine,
  location,
  address,
  phone,
  email,
  operating_hours,
  rating,
  is_active
) VALUES (
  'user-uuid-vendor-1', -- Replace with actual vendor user ID
  'Mumbai Spice Kitchen',
  'Authentic Mumbai street food and traditional Indian cuisine',
  ARRAY['Indian', 'Street Food', 'Vegetarian'],
  ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography, -- Mumbai coordinates
  '123 MG Road, Andheri West, Mumbai, Maharashtra 400053',
  '+91-9876543210',
  'contact@mumbaispice.com',
  '{
    "monday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "tuesday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "wednesday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "thursday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "friday": {"is_open": true, "open_time": "09:00", "close_time": "23:00"},
    "saturday": {"is_open": true, "open_time": "09:00", "close_time": "23:00"},
    "sunday": {"is_open": true, "open_time": "10:00", "close_time": "22:00"}
  }'::jsonb,
  4.5,
  true
);

-- Vendor 2: Dragon Wok
INSERT INTO vendors (
  user_id,
  business_name,
  description,
  cuisine,
  location,
  address,
  phone,
  email,
  operating_hours,
  rating,
  is_active
) VALUES (
  'user-uuid-vendor-2', -- Replace with actual vendor user ID
  'Dragon Wok',
  'Delicious Chinese and Indo-Chinese fusion',
  ARRAY['Chinese', 'Asian', 'Indo-Chinese'],
  ST_SetSRID(ST_MakePoint(72.8800, 19.0800), 4326)::geography,
  '456 Link Road, Bandra West, Mumbai, Maharashtra 400050',
  '+91-9876543211',
  'hello@dragonwok.com',
  '{
    "monday": {"is_open": true, "open_time": "11:00", "close_time": "23:00"},
    "tuesday": {"is_open": true, "open_time": "11:00", "close_time": "23:00"},
    "wednesday": {"is_open": true, "open_time": "11:00", "close_time": "23:00"},
    "thursday": {"is_open": true, "open_time": "11:00", "close_time": "23:00"},
    "friday": {"is_open": true, "open_time": "11:00", "close_time": "00:00"},
    "saturday": {"is_open": true, "open_time": "11:00", "close_time": "00:00"},
    "sunday": {"is_open": true, "open_time": "11:00", "close_time": "23:00"}
  }'::jsonb,
  4.3,
  true
);

-- Vendor 3: Healthy Bites
INSERT INTO vendors (
  user_id,
  business_name,
  description,
  cuisine,
  location,
  address,
  phone,
  email,
  operating_hours,
  rating,
  is_active
) VALUES (
  'user-uuid-vendor-3', -- Replace with actual vendor user ID
  'Healthy Bites',
  'Nutritious meals for health-conscious foodies',
  ARRAY['Healthy', 'Salads', 'Smoothies'],
  ST_SetSRID(ST_MakePoint(72.8700, 19.0700), 4326)::geography,
  '789 Juhu Tara Road, Juhu, Mumbai, Maharashtra 400049',
  '+91-9876543212',
  'info@healthybites.com',
  '{
    "monday": {"is_open": true, "open_time": "08:00", "close_time": "21:00"},
    "tuesday": {"is_open": true, "open_time": "08:00", "close_time": "21:00"},
    "wednesday": {"is_open": true, "open_time": "08:00", "close_time": "21:00"},
    "thursday": {"is_open": true, "open_time": "08:00", "close_time": "21:00"},
    "friday": {"is_open": true, "open_time": "08:00", "close_time": "21:00"},
    "saturday": {"is_open": true, "open_time": "08:00", "close_time": "21:00"},
    "sunday": {"is_open": false, "open_time": null, "close_time": null}
  }'::jsonb,
  4.7,
  true
);

-- ============================================================================
-- SAMPLE MEALS
-- ============================================================================
-- Note: Get vendor IDs from: SELECT id, business_name FROM vendors;

-- Meals for Mumbai Spice Kitchen
INSERT INTO meals (
  vendor_id,
  name,
  description,
  category,
  meal_type,
  price,
  discount_price,
  ingredients,
  allergens,
  nutritional_info,
  is_veg,
  is_available,
  stock,
  preparation_time,
  rating
) VALUES
  (
    (SELECT id FROM vendors WHERE business_name = 'Mumbai Spice Kitchen'),
    'Paneer Butter Masala',
    'Creamy tomato-based curry with soft paneer cubes',
    'Indian',
    'lunch',
    280.00,
    250.00,
    ARRAY['Paneer', 'Tomatoes', 'Cream', 'Butter', 'Spices'],
    ARRAY['Dairy'],
    '{"calories": 450, "protein": 18, "carbs": 25, "fat": 32}'::jsonb,
    true,
    true,
    50,
    25,
    4.6
  ),
  (
    (SELECT id FROM vendors WHERE business_name = 'Mumbai Spice Kitchen'),
    'Chicken Biryani',
    'Aromatic basmati rice with tender chicken pieces',
    'Indian',
    'lunch',
    320.00,
    NULL,
    ARRAY['Chicken', 'Basmati Rice', 'Spices', 'Yogurt', 'Onions'],
    ARRAY['Dairy'],
    '{"calories": 650, "protein": 35, "carbs": 75, "fat": 22}'::jsonb,
    false,
    true,
    30,
    35,
    4.8
  ),
  (
    (SELECT id FROM vendors WHERE business_name = 'Mumbai Spice Kitchen'),
    'Masala Dosa',
    'Crispy rice crepe with spiced potato filling',
    'Indian',
    'breakfast',
    120.00,
    100.00,
    ARRAY['Rice', 'Lentils', 'Potatoes', 'Spices'],
    ARRAY[],
    '{"calories": 350, "protein": 8, "carbs": 55, "fat": 12}'::jsonb,
    true,
    true,
    100,
    15,
    4.5
  );

-- Meals for Dragon Wok
INSERT INTO meals (
  vendor_id,
  name,
  description,
  category,
  meal_type,
  price,
  ingredients,
  allergens,
  nutritional_info,
  is_veg,
  is_available,
  stock,
  preparation_time,
  rating
) VALUES
  (
    (SELECT id FROM vendors WHERE business_name = 'Dragon Wok'),
    'Veg Hakka Noodles',
    'Stir-fried noodles with fresh vegetables',
    'Chinese',
    'lunch',
    180.00,
    ARRAY['Noodles', 'Cabbage', 'Carrots', 'Bell Peppers', 'Soy Sauce'],
    ARRAY['Gluten', 'Soy'],
    '{"calories": 400, "protein": 12, "carbs": 60, "fat": 14}'::jsonb,
    true,
    true,
    40,
    20,
    4.4
  ),
  (
    (SELECT id FROM vendors WHERE business_name = 'Dragon Wok'),
    'Chicken Manchurian',
    'Crispy chicken in spicy Indo-Chinese sauce',
    'Chinese',
    'dinner',
    260.00,
    ARRAY['Chicken', 'Cornflour', 'Soy Sauce', 'Ginger', 'Garlic'],
    ARRAY['Gluten', 'Soy'],
    '{"calories": 520, "protein": 28, "carbs": 35, "fat": 28}'::jsonb,
    false,
    true,
    25,
    25,
    4.6
  );

-- Meals for Healthy Bites
INSERT INTO meals (
  vendor_id,
  name,
  description,
  category,
  meal_type,
  price,
  ingredients,
  allergens,
  nutritional_info,
  is_veg,
  is_available,
  preparation_time,
  rating
) VALUES
  (
    (SELECT id FROM vendors WHERE business_name = 'Healthy Bites'),
    'Quinoa Buddha Bowl',
    'Nutritious bowl with quinoa, roasted vegetables, and tahini dressing',
    'Healthy',
    'lunch',
    350.00,
    ARRAY['Quinoa', 'Broccoli', 'Sweet Potato', 'Chickpeas', 'Tahini'],
    ARRAY['Sesame'],
    '{"calories": 420, "protein": 16, "carbs": 52, "fat": 18}'::jsonb,
    true,
    true,
    NULL,
    20,
    4.8
  ),
  (
    (SELECT id FROM vendors WHERE business_name = 'Healthy Bites'),
    'Green Smoothie Bowl',
    'Refreshing smoothie bowl with fresh fruits and granola',
    'Healthy',
    'breakfast',
    220.00,
    ARRAY['Spinach', 'Banana', 'Mango', 'Almond Milk', 'Granola'],
    ARRAY['Nuts'],
    '{"calories": 280, "protein": 8, "carbs": 48, "fat": 8}'::jsonb,
    true,
    true,
    NULL,
    10,
    4.7
  );

-- ============================================================================
-- SAMPLE DELIVERY PARTNERS
-- ============================================================================
-- Note: Replace with actual delivery partner user IDs

INSERT INTO delivery_partners (
  user_id,
  vehicle_type,
  vehicle_number,
  license_number,
  is_online,
  current_location,
  rating,
  is_verified
) VALUES
  (
    'user-uuid-delivery-1', -- Replace with actual delivery partner user ID
    'bike',
    'MH-02-AB-1234',
    'DL1234567890',
    false,
    ST_SetSRID(ST_MakePoint(72.8750, 19.0750), 4326)::geography,
    4.5,
    true
  ),
  (
    'user-uuid-delivery-2', -- Replace with actual delivery partner user ID
    'scooter',
    'MH-02-CD-5678',
    'DL0987654321',
    false,
    ST_SetSRID(ST_MakePoint(72.8780, 19.0780), 4326)::geography,
    4.7,
    true
  );

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================

-- Test nearby vendors function (Mumbai coordinates)
-- SELECT * FROM nearby_vendors(19.0760, 72.8777, 5);

-- Test delivery fee calculation
-- SELECT calculate_delivery_fee(19.0760, 72.8777, 19.0800, 72.8800);

-- View all meals with vendor info
-- SELECT m.name, m.price, v.business_name, v.cuisine
-- FROM meals m
-- JOIN vendors v ON m.vendor_id = v.id
-- WHERE m.is_available = true;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Before running this seed data:
--    - Complete the initial schema migration (001_initial_schema.sql)
--    - Create test users through your application's signup flow
--    - Update all 'user-uuid-*' placeholders with actual user IDs

-- 2. To get actual user IDs after signup:
--    SELECT id, email, raw_user_meta_data->>'name' as name
--    FROM auth.users;

-- 3. To clear seed data and start fresh:
--    DELETE FROM reviews;
--    DELETE FROM orders;
--    DELETE FROM meals;
--    DELETE FROM delivery_partners;
--    DELETE FROM vendors;
--    DELETE FROM subscriptions;
--    DELETE FROM notifications;
--    DELETE FROM group_orders;
--    DELETE FROM plan_pricing;
--    DELETE FROM categories;

-- 4. Remember to also create corresponding profile entries:
--    INSERT INTO profiles (id, email, name, role)
--    VALUES ('user-uuid', 'email@example.com', 'Name', 'vendor');
