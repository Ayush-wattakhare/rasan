# Rasan Supabase Setup - Quick Start

This guide provides step-by-step instructions to set up the complete database for the Rasan platform.

## ✅ What's Included

The database schema includes:
- **11 tables**: profiles, vendors, meals, orders, delivery_partners, subscriptions, notifications, categories, reviews, group_orders, plan_pricing
- **7 enums**: user_role, order_status, payment_status, payment_method, subscription_status, meal_type, vehicle_type
- **PostGIS extension**: For geospatial queries (nearby vendors, distance calculations)
- **4 database functions**: nearby_vendors, assign_delivery_partner, calculate_delivery_fee, and automatic triggers
- **Complete RLS policies**: Row-level security for all tables
- **Performance indexes**: Including spatial GIST indexes for location queries

## 🚀 Setup Steps

### Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: Rasan
   - **Database Password**: (choose a strong password - save it!)
   - **Region**: Select closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get Your Credentials (2 minutes)

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJ...` (long string)
   - **service_role key**: `eyJ...` (keep this secret!)

3. Create/update `.env.local` in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Step 3: Enable PostGIS Extension (1 minute)

**Option A: Via Dashboard (Recommended)**
1. Go to **Database** → **Extensions**
2. Search for "postgis"
3. Click **Enable** next to PostGIS
4. Wait for confirmation

**Option B: Via SQL Editor**
1. Go to **SQL Editor**
2. Run: `CREATE EXTENSION IF NOT EXISTS "postgis";`

### Step 4: Run Database Migration (3 minutes)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the **entire contents** of the file
5. Paste into the SQL editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for completion - you should see "Success. No rows returned"

### Step 5: Verify Setup (2 minutes)

1. Go to **Table Editor** in your dashboard
2. You should see all 11 tables:
   - ✅ profiles
   - ✅ vendors
   - ✅ meals
   - ✅ orders
   - ✅ delivery_partners
   - ✅ subscriptions
   - ✅ notifications
   - ✅ categories
   - ✅ reviews
   - ✅ group_orders
   - ✅ plan_pricing

3. Test PostGIS is working:
   - Go to **SQL Editor**
   - Run: `SELECT PostGIS_Version();`
   - You should see a version number (e.g., "3.3.2")

### Step 6: Configure Storage Buckets (Optional - 3 minutes)

For image uploads:

1. Go to **Storage** in your dashboard
2. Create these buckets:
   - **meals** - For meal images
   - **avatars** - For user profile pictures
   - **documents** - For vendor/delivery documents

3. For each bucket:
   - Click the bucket name
   - Go to **Policies**
   - Add policy: "Public read access"
     - Policy name: `Public read`
     - Allowed operation: `SELECT`
     - Policy definition: `true`

### Step 7: Add Seed Data (Optional - 5 minutes)

To add sample data for testing:

1. Go to **SQL Editor**
2. Open `supabase/seed_data.sql`
3. **IMPORTANT**: First create test users through your app's signup
4. Get user IDs: Run `SELECT id, email FROM auth.users;`
5. Replace all `'user-uuid-*'` placeholders in seed_data.sql with actual IDs
6. Run the modified seed data SQL

## 🎉 You're Done!

Your database is now fully set up and ready to use!

## 📚 Next Steps

1. **Test the connection**: Run your Next.js app and try signing up
2. **Review the schema**: Check `SCHEMA_REFERENCE.md` for detailed table documentation
3. **Explore functions**: Test the geospatial functions with sample queries
4. **Set up authentication**: Configure Supabase Auth in your Next.js app

## 🧪 Quick Tests

Run these in SQL Editor to verify everything works:

```sql
-- Test 1: Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check PostGIS is working
SELECT PostGIS_Version();

-- Test 3: Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test 4: Test nearby vendors function (will return empty until you add vendors)
SELECT * FROM nearby_vendors(19.0760, 72.8777, 10);

-- Test 5: Test delivery fee calculation
SELECT calculate_delivery_fee(19.0760, 72.8777, 19.0800, 72.8800);
```

## 🔧 Troubleshooting

### PostGIS Extension Error
- Ensure you're on a plan that supports PostGIS (free tier should work)
- Try enabling via SQL Editor instead of dashboard
- Contact Supabase support if unavailable

### Migration Fails
- Check the error message carefully
- Ensure PostGIS is enabled first
- Try running the migration in smaller sections
- Verify you have the correct permissions

### RLS Policies Not Working
- Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check policy definitions in the migration file
- Test with different user roles

### Can't Connect from Next.js
- Verify environment variables are correct
- Check that `.env.local` is in your project root
- Restart your Next.js dev server after adding env vars
- Ensure you're using the correct Supabase client (client vs server)

## 📖 Documentation Files

- **README.md** - Detailed setup guide with explanations
- **SCHEMA_REFERENCE.md** - Complete database schema documentation
- **seed_data.sql** - Sample data for testing
- **001_initial_schema.sql** - The main migration file

## 🆘 Need Help?

1. Check the Supabase dashboard logs (Database → Logs)
2. Review the migration file for syntax errors
3. Consult the design document at `.kiro/specs/Rasan-platform/design.md`
4. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)

## ⚡ Pro Tips

- **Backup**: Supabase automatically backs up your database
- **Migrations**: Keep all schema changes in migration files
- **Testing**: Use the SQL Editor to test queries before implementing
- **Monitoring**: Check the Database → Logs section regularly
- **Performance**: Monitor query performance in the Database → Query Performance section

---

**Estimated Total Setup Time**: 15-20 minutes

**Status**: ✅ Ready for development
