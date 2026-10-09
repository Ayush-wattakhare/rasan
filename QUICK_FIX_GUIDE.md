# Quick Fix Guide - Rasan Platform Issues

## Current Issues

### 1. ✅ FIXED: Column Name Mismatch
- **Issue**: Code was using `is_vegetarian` but database column is `is_veg`
- **Status**: Fixed in `lib/services/meal-service.ts`
- **No action needed**

### 2. ⚠️ CRITICAL: Vendor Record Missing
- **Issue**: Vendor record for `sample.vendor@rasan.com` doesn't exist
- **Impact**: 
  - Vendor dashboard shows error
  - Meals don't show in customer dashboard (join fails)
  - Cannot add/manage meals properly
- **Root Cause**: PostGIS geometry format cannot be created via JavaScript client

## How to Fix

### Step 1: Check Current Status
1. Navigate to: `http://localhost:3001/admin/status`
2. This will show you:
   - Whether vendor record exists
   - Whether meals exist
   - Whether the join query works

### Step 2: Fix Vendor Record (SQL Required)
1. Navigate to: `http://localhost:3001/admin/fix-vendor`
2. Click "Copy" to copy the SQL query
3. Go to your Supabase Dashboard → SQL Editor
4. Paste and run the query
5. Return to `/admin/status` and click "Refresh Status"

### Step 3: Verify Everything Works
1. Go to `/vendor-dashboard` - should load without errors
2. Go to `/dashboard` (customer) - should show meals including "rajma chaval"
3. Go to `/meals` - should show all available meals

## The SQL Query (for reference)

```sql
-- Step 1: Delete any existing vendor record for this user
DELETE FROM vendors WHERE user_id = '39736e0c-1ab5-485a-94db-d812fa4a77f9';

-- Step 2: Insert new vendor record with proper PostGIS geometry
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
  total_orders, 
  is_active
)
VALUES (
  '39736e0c-1ab5-485a-94db-d812fa4a77f9',
  'Mama''s Kitchen',
  'Authentic home-cooked Indian meals made with love',
  ARRAY['Indian', 'North Indian', 'Vegetarian']::text[],
  ST_Point(72.8777, 19.0760),
  'Mumbai, Maharashtra, India',
  '+919876543210',
  'sample.vendor@rasan.com',
  '{"monday":{"open":"09:00","close":"21:00","closed":false},"tuesday":{"open":"09:00","close":"21:00","closed":false},"wednesday":{"open":"09:00","close":"21:00","closed":false},"thursday":{"open":"09:00","close":"21:00","closed":false},"friday":{"open":"09:00","close":"21:00","closed":false},"saturday":{"open":"09:00","close":"21:00","closed":false},"sunday":{"open":"09:00","close":"21:00","closed":false}}'::jsonb,
  4.5,
  150,
  true
);
```

## Why JavaScript Can't Create Vendor Records

The `location` field in the `vendors` table uses PostGIS `geometry(Point, 4326)` type. This requires the `ST_Point()` function which is only available in SQL, not through the JavaScript client.

**Attempted formats that failed:**
- `{ lat: 19.0760, lng: 72.8777 }` ❌
- `POINT(72.8777 19.0760)` ❌
- `{ type: 'Point', coordinates: [72.8777, 19.0760] }` ❌

**Only working format:**
- `ST_Point(72.8777, 19.0760)` ✅ (SQL only)

## Diagnostic Tools Created

1. **`/admin`** - Admin dashboard with links to all tools
2. **`/admin/status`** - Real-time system status check
3. **`/admin/fix-vendor`** - SQL query with copy button
4. **`/api/debug/check-meals`** - API endpoint for diagnostics

## Account Credentials

- **Vendor**: `sample.vendor@rasan.com` / `vendor123`
- **Customer**: Any registered user
- **Admin**: `admin@rasan.com` / `admin123`
- **Delivery**: `delivery@rasan.com` / `delivery123`

## Next Steps After Fix

1. ✅ Vendor dashboard should load
2. ✅ Meals should appear in customer dashboard
3. ✅ "rajma chaval" meal should be visible
4. ✅ Can add more meals from vendor dashboard
5. ✅ Browse meals page should work

## Need Help?

If issues persist after running the SQL:
1. Check `/admin/status` for detailed diagnostics
2. Check browser console for errors
3. Check Supabase logs for RLS policy issues
