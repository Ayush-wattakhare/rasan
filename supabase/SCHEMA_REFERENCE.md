# Rasan Database Schema Reference

Quick reference guide for the Rasan database schema.

## Table of Contents
- [Enums](#enums)
- [Tables](#tables)
- [Functions](#functions)
- [Indexes](#indexes)
- [RLS Policies](#rls-policies)

## Enums

### user_role
```sql
'customer' | 'vendor' | 'delivery' | 'admin'
```

### order_status
```sql
'pending' | 'confirmed' | 'preparing' | 'ready' | 
'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled'
```

### payment_status
```sql
'pending' | 'paid' | 'failed' | 'refunded'
```

### payment_method
```sql
'cash' | 'card' | 'upi' | 'wallet'
```

### subscription_status
```sql
'active' | 'paused' | 'cancelled' | 'completed'
```

### meal_type
```sql
'breakfast' | 'lunch' | 'dinner' | 'snack'
```

### vehicle_type
```sql
'bike' | 'scooter' | 'car'
```

## Tables

### profiles
Extends Supabase auth.users with additional user information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users(id) |
| email | TEXT | User email (unique) |
| name | TEXT | User full name |
| phone | TEXT | Contact phone number |
| role | user_role | User role (customer/vendor/delivery/admin) |
| avatar_url | TEXT | Profile picture URL |
| address | JSONB | User address with coordinates |
| is_active | BOOLEAN | Account active status |
| is_verified | BOOLEAN | Verification status |
| created_at | TIMESTAMPTZ | Account creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### vendors
Restaurant/vendor information with geospatial location.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| business_name | TEXT | Vendor business name |
| description | TEXT | Business description |
| cuisine | TEXT[] | Array of cuisine types |
| location | GEOGRAPHY(POINT) | Geospatial location (PostGIS) |
| address | TEXT | Full address string |
| phone | TEXT | Business phone |
| email | TEXT | Business email |
| operating_hours | JSONB | Weekly operating schedule |
| rating | NUMERIC(3,2) | Average rating (0-5) |
| total_orders | INTEGER | Total orders fulfilled |
| is_active | BOOLEAN | Vendor active status |
| bank_details | JSONB | Bank account information |
| documents | JSONB | Business documents |
| created_at | TIMESTAMPTZ | Registration timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### meals
Food items offered by vendors.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vendor_id | UUID | References vendors(id) |
| name | TEXT | Meal name |
| description | TEXT | Meal description |
| category | TEXT | Meal category |
| meal_type | meal_type | Breakfast/lunch/dinner/snack |
| price | NUMERIC(10,2) | Regular price |
| discount_price | NUMERIC(10,2) | Discounted price (optional) |
| image_url | TEXT | Meal image URL |
| ingredients | TEXT[] | List of ingredients |
| allergens | TEXT[] | Allergen information |
| nutritional_info | JSONB | Calories, protein, carbs, fat |
| is_veg | BOOLEAN | Vegetarian flag |
| is_available | BOOLEAN | Currently available |
| stock | INTEGER | Available quantity (optional) |
| preparation_time | INTEGER | Prep time in minutes |
| rating | NUMERIC(3,2) | Average rating |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### orders
Customer orders with payment and delivery tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_number | TEXT | Unique order number (auto-generated) |
| customer_id | UUID | References profiles(id) |
| vendor_id | UUID | References vendors(id) |
| delivery_partner_id | UUID | References delivery_partners(id) |
| items | JSONB | Array of order items |
| subtotal | NUMERIC(10,2) | Items subtotal |
| delivery_fee | NUMERIC(10,2) | Delivery charge |
| tax | NUMERIC(10,2) | Tax amount |
| discount | NUMERIC(10,2) | Discount amount |
| total | NUMERIC(10,2) | Final total |
| status | order_status | Current order status |
| payment_status | payment_status | Payment status |
| payment_method | payment_method | Payment method used |
| payment_id | TEXT | Payment gateway transaction ID |
| delivery_address | JSONB | Delivery address with coordinates |
| delivery_instructions | TEXT | Special delivery instructions |
| estimated_delivery_time | TIMESTAMPTZ | Estimated delivery time |
| actual_delivery_time | TIMESTAMPTZ | Actual delivery time |
| tracking_updates | JSONB | Array of status updates |
| rating | JSONB | Food and delivery ratings |
| created_at | TIMESTAMPTZ | Order creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### delivery_partners
Delivery personnel with real-time location tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| vehicle_type | vehicle_type | Vehicle type |
| vehicle_number | TEXT | Vehicle registration number |
| license_number | TEXT | Driving license number |
| is_online | BOOLEAN | Currently online/available |
| current_location | GEOGRAPHY(POINT) | Real-time location (PostGIS) |
| rating | NUMERIC(3,2) | Average rating |
| total_deliveries | INTEGER | Total deliveries completed |
| earnings | JSONB | Earnings breakdown (today/week/month/total) |
| documents | JSONB | License, RC, insurance documents |
| bank_details | JSONB | Bank account information |
| is_verified | BOOLEAN | Verification status |
| created_at | TIMESTAMPTZ | Registration timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### subscriptions
Recurring meal delivery subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | References profiles(id) |
| vendor_id | UUID | References vendors(id) |
| plan_type | TEXT | daily/weekly/monthly |
| meal_type | TEXT | Meal type or 'all' |
| start_date | DATE | Subscription start date |
| end_date | DATE | Subscription end date |
| delivery_days | TEXT[] | Days of week for delivery |
| delivery_time | TIME | Preferred delivery time |
| address | JSONB | Delivery address |
| price | NUMERIC(10,2) | Subscription price |
| status | subscription_status | Current status |
| payment_status | payment_status | Payment status |
| auto_renew | BOOLEAN | Auto-renewal flag |
| deliveries | JSONB | Scheduled deliveries array |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### notifications
In-app notifications for users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles(id) |
| type | TEXT | order/delivery/payment/promotion/system |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| data | JSONB | Additional data payload |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMPTZ | Creation timestamp |

### categories
Meal categories for filtering.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Category name (unique) |
| description | TEXT | Category description |
| image_url | TEXT | Category image |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### reviews
Customer reviews and ratings for meals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| meal_id | UUID | References meals(id) |
| user_id | UUID | References profiles(id) |
| order_id | UUID | References orders(id) |
| rating | INTEGER | Rating (1-5) |
| comment | TEXT | Review text |
| images | TEXT[] | Review images |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique constraint**: (meal_id, user_id, order_id)

### group_orders
Collaborative orders with multiple participants.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| group_id | TEXT | Unique shareable group ID |
| host_id | UUID | References profiles(id) - group creator |
| vendor_id | UUID | References vendors(id) |
| participants | JSONB | Array of participants with items |
| status | TEXT | open/closed/ordered |
| expires_at | TIMESTAMPTZ | Group order expiration time |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### plan_pricing
Subscription plan pricing configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| plan_type | TEXT | daily/weekly/monthly |
| meal_type | TEXT | Meal type |
| days_per_week | INTEGER | Number of delivery days |
| base_price | NUMERIC(10,2) | Base price |
| discount_percentage | NUMERIC(5,2) | Discount percentage |
| final_price | NUMERIC(10,2) | Final price after discount |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Functions

### nearby_vendors(user_lat, user_lng, radius_km)
Find vendors within specified radius using PostGIS.

**Parameters:**
- `user_lat` (FLOAT): User latitude
- `user_lng` (FLOAT): User longitude  
- `radius_km` (FLOAT): Search radius in kilometers (default: 10)

**Returns:** Table with vendor details and distance

**Example:**
```sql
SELECT * FROM nearby_vendors(19.0760, 72.8777, 5);
```

### assign_delivery_partner(p_order_id)
Assign nearest available delivery partner to an order.

**Parameters:**
- `p_order_id` (UUID): Order ID

**Returns:** UUID of assigned delivery partner or NULL

**Example:**
```sql
SELECT assign_delivery_partner('order-uuid-here');
```

### calculate_delivery_fee(vendor_lat, vendor_lng, delivery_lat, delivery_lng)
Calculate delivery fee based on distance.

**Parameters:**
- `vendor_lat` (FLOAT): Vendor latitude
- `vendor_lng` (FLOAT): Vendor longitude
- `delivery_lat` (FLOAT): Delivery latitude
- `delivery_lng` (FLOAT): Delivery longitude

**Returns:** NUMERIC delivery fee

**Formula:** Base fee (₹20) + (distance_km × ₹5)

**Example:**
```sql
SELECT calculate_delivery_fee(19.0760, 72.8777, 19.0800, 72.8800);
```

### Automatic Trigger Functions

- **update_updated_at_column()**: Updates `updated_at` timestamp on row update
- **set_order_number()**: Auto-generates unique order number on insert
- **update_meal_rating()**: Recalculates meal rating when reviews change
- **update_vendor_stats()**: Updates vendor stats when order is delivered
- **update_delivery_partner_stats()**: Updates delivery partner earnings and stats

## Indexes

### Standard Indexes
- All foreign keys are indexed
- Status columns are indexed for filtering
- Timestamp columns are indexed for sorting
- Email and phone columns are indexed for lookups

### Spatial Indexes (GIST)
- `vendors.location` - For nearby vendor queries
- `delivery_partners.current_location` - For delivery assignment

### Composite Indexes
- `orders(customer_id, created_at)` - For customer order history
- `meals(vendor_id, is_available)` - For vendor menu queries

## RLS Policies

### profiles
- Users can view their own profile
- Users can update their own profile
- Anyone can view active profiles

### vendors
- Anyone can view active vendors
- Vendors can manage their own data

### meals
- Anyone can view available meals
- Vendors can manage their own meals

### orders
- Customers can view their own orders
- Vendors can view orders for their restaurant
- Delivery partners can view assigned orders
- Each role can update orders based on their permissions

### delivery_partners
- Anyone can view verified delivery partners
- Delivery partners can manage their own data

### subscriptions
- Customers can view and manage their own subscriptions
- Vendors can view subscriptions for their restaurant

### notifications
- Users can view and update their own notifications

### categories
- Anyone can view active categories

### reviews
- Anyone can view reviews
- Users can create and update their own reviews

### group_orders
- Participants can view group orders they're part of
- Host can create and update group orders

### plan_pricing
- Anyone can view active plans

## Common Queries

### Find nearby vendors
```sql
SELECT * FROM nearby_vendors(19.0760, 72.8777, 10);
```

### Get vendor with meals
```sql
SELECT v.*, json_agg(m.*) as meals
FROM vendors v
LEFT JOIN meals m ON v.id = m.vendor_id
WHERE v.id = 'vendor-uuid'
GROUP BY v.id;
```

### Get order with full details
```sql
SELECT 
  o.*,
  p.name as customer_name,
  v.business_name as vendor_name,
  dp.vehicle_number as delivery_vehicle
FROM orders o
JOIN profiles p ON o.customer_id = p.id
JOIN vendors v ON o.vendor_id = v.id
LEFT JOIN delivery_partners dp ON o.delivery_partner_id = dp.id
WHERE o.id = 'order-uuid';
```

### Calculate distance between two points
```sql
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography,
  ST_SetSRID(ST_MakePoint(72.8800, 19.0800), 4326)::geography
) / 1000 as distance_km;
```

### Get active subscriptions with upcoming deliveries
```sql
SELECT *
FROM subscriptions
WHERE status = 'active'
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE;
```

## JSONB Structure Examples

### address (profiles, subscriptions, orders)
```json
{
  "street": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "zip_code": "400001",
  "coordinates": {
    "lat": 19.0760,
    "lng": 72.8777
  }
}
```

### operating_hours (vendors)
```json
{
  "monday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
  "tuesday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
  "wednesday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
  "thursday": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
  "friday": {"is_open": true, "open_time": "09:00", "close_time": "23:00"},
  "saturday": {"is_open": true, "open_time": "09:00", "close_time": "23:00"},
  "sunday": {"is_open": false, "open_time": null, "close_time": null}
}
```

### items (orders)
```json
[
  {
    "meal_id": "uuid",
    "name": "Paneer Butter Masala",
    "quantity": 2,
    "price": 250.00,
    "customizations": ["Extra spicy", "No onions"]
  }
]
```

### earnings (delivery_partners)
```json
{
  "today": 450.00,
  "this_week": 2800.00,
  "this_month": 12500.00,
  "total": 45000.00
}
```

### rating (orders)
```json
{
  "food": 5,
  "delivery": 4,
  "comment": "Great food, slightly delayed delivery"
}
```

### nutritional_info (meals)
```json
{
  "calories": 450,
  "protein": 18,
  "carbs": 25,
  "fat": 32
}
```
