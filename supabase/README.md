# Rasan Supabase Setup Guide

This directory contains the Supabase configuration and migrations for the Rasan platform.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Rasan (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click "Create new project" and wait for provisioning (2-3 minutes)

### Step 2: Obtain Credentials

Once your project is created:

1. Go to **Project Settings** → **API**
2. Copy the following credentials:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

3. Update your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Step 3: Enable PostGIS Extension

The PostGIS extension is required for geospatial queries (finding nearby vendors, calculating distances).

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to **Database** → **Extensions** in your Supabase dashboard
2. Search for "postgis"
3. Click "Enable" next to PostGIS
4. Wait for the extension to be enabled

**Option B: Via SQL Editor**
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```

### Step 4: Run Database Migration

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the migration
6. Verify success - you should see "Success. No rows returned"

**Option B: Via Supabase CLI**
1. Link your local project to Supabase:
   ```bash
   supabase link --project-ref your-project-ref
   ```
2. Run the migration:
   ```bash
   supabase db push
   ```

### Step 5: Verify Database Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see all tables created:
   - profiles
   - vendors
   - meals
   - orders
   - delivery_partners
   - subscriptions
   - notifications
   - categories
   - reviews
   - group_orders
   - plan_pricing

3. Check that PostGIS is working:
   - Go to **SQL Editor**
   - Run: `SELECT PostGIS_Version();`
   - You should see the PostGIS version number

### Step 6: Configure Storage (Optional)

For image uploads (meal images, profile avatars):

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:
   - **meals** - For meal images
   - **avatars** - For user profile pictures
   - **documents** - For vendor/delivery partner documents

3. Set bucket policies:
   - Make `meals` and `avatars` public for read access
   - Restrict write access to authenticated users

## Database Schema Overview

### Core Tables

- **profiles**: User accounts (extends Supabase auth.users)
- **vendors**: Restaurant/vendor information with geospatial location
- **meals**: Food items with pricing, availability, and nutritional info
- **orders**: Customer orders with payment and delivery tracking
- **delivery_partners**: Delivery personnel with real-time location
- **subscriptions**: Recurring meal delivery plans
- **notifications**: In-app notifications
- **categories**: Meal categories for filtering
- **reviews**: Customer ratings and reviews
- **group_orders**: Collaborative orders with multiple participants
- **plan_pricing**: Subscription plan configurations

### Key Features

1. **PostGIS Integration**: Geospatial queries for nearby vendors and delivery assignment
2. **Row Level Security (RLS)**: Automatic data access control based on user roles
3. **Automatic Triggers**: 
   - Auto-generate order numbers
   - Update timestamps
   - Calculate ratings
   - Update statistics
4. **Database Functions**:
   - `nearby_vendors()` - Find vendors within radius
   - `assign_delivery_partner()` - Smart delivery assignment
   - `calculate_delivery_fee()` - Distance-based fee calculation

## Testing the Setup

Run these SQL queries in the SQL Editor to verify everything works:

```sql
-- Test 1: Check PostGIS is working
SELECT PostGIS_Version();

-- Test 2: Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 3: Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test 4: Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

## Troubleshooting

### PostGIS Extension Error
If you get an error enabling PostGIS:
- Ensure you're on a paid plan or the free tier with PostGIS support
- Contact Supabase support if the extension is not available

### Migration Fails
If the migration fails:
1. Check the error message in the SQL Editor
2. Ensure PostGIS is enabled first
3. Try running the migration in smaller chunks
4. Check that you have the correct permissions

### RLS Policies Not Working
If users can access data they shouldn't:
1. Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Check policy definitions in the migration file
3. Test with different user roles

## Next Steps

After completing the database setup:

1. ✅ Configure environment variables in `.env.local`
2. ✅ Set up Supabase Storage buckets
3. ✅ Test authentication flow
4. ✅ Create test data for development
5. ✅ Proceed with Task 3: Database Functions and Triggers (if needed)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

## Support

For issues with this setup:
1. Check the Supabase dashboard logs
2. Review the migration file for syntax errors
3. Consult the Rasan design document
4. Contact the development team
