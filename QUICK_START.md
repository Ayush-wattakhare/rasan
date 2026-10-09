# 🚀 Quick Start Guide - Rasan Platform

Get the Rasan platform running locally in under 10 minutes!

---

## Prerequisites

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm, yarn, or pnpm** package manager
- **Supabase account** ([Sign up free](https://supabase.com))
- **Git** installed

---

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/Rasan.git
cd Rasan

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

---

## Step 2: Set Up Supabase (3 minutes)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** Rasan-dev
   - **Database Password:** (save this!)
   - **Region:** Choose closest to you
4. Click "Create new project"
5. Wait for project to be ready (~2 minutes)

### Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" first)

---

## Step 3: Configure Environment (1 minute)

Create `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Razorpay (Test Mode - Optional for now)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_test_secret

# Stripe (Test Mode - Optional for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

**Note:** Payment keys are optional for initial setup. You can add them later.

---

## Step 4: Set Up Database (2 minutes)

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run**
6. Repeat for:
   - `002_functions_triggers.sql`
   - `003_rls_policies.sql`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Enable PostGIS Extension

In SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## Step 5: Run the App (1 minute)

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**🎉 You should see the Rasan home page!**

---

## Step 6: Create Your First User

1. Click **Sign Up** in the header
2. Fill in the registration form:
   - **Name:** Your name
   - **Email:** your@email.com
   - **Password:** (min 6 characters)
   - **Role:** Customer (or any role you want to test)
3. Click **Create Account**
4. Check your email for verification link (check spam folder)
5. Click the verification link
6. You're logged in! 🎉

---

## 🧪 Test the Platform

### As a Customer:
1. Browse meals at `/meals`
2. Add items to cart
3. Go to checkout
4. (Payment will fail without real keys - that's expected!)

### As a Vendor:
1. Register with "Vendor" role
2. Go to `/vendor-dashboard`
3. Add meals in `/menu-management`
4. View orders in `/vendor-orders`

### As a Delivery Partner:
1. Register with "Delivery Partner" role
2. Go to `/delivery-dashboard`
3. View available orders
4. Accept deliveries

### As an Admin:
1. Register with "Admin" role
2. Go to `/admin-dashboard`
3. View system stats
4. Manage users

---

## 📝 Add Sample Data (Optional)

To test with sample data, run these SQL queries in Supabase SQL Editor:

### Add Sample Categories
```sql
INSERT INTO categories (name, slug, icon, is_active) VALUES
('North Indian', 'north-indian', '🍛', true),
('South Indian', 'south-indian', '🥘', true),
('Chinese', 'chinese', '🥡', true),
('Italian', 'italian', '🍝', true),
('Desserts', 'desserts', '🍰', true);
```

### Add Sample Vendor
```sql
-- First, get your user ID
SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Then insert vendor (replace USER_ID with your actual ID)
INSERT INTO vendors (
  user_id,
  business_name,
  cuisine,
  address,
  location,
  phone,
  is_active,
  is_verified,
  rating
) VALUES (
  'USER_ID',
  'Tasty Bites',
  ARRAY['North Indian', 'Chinese'],
  '123 Main Street, City',
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326),
  '+1234567890',
  true,
  true,
  4.5
);
```

### Add Sample Meals
```sql
-- Get vendor ID
SELECT id FROM vendors WHERE business_name = 'Tasty Bites';

-- Insert meals (replace VENDOR_ID)
INSERT INTO meals (
  vendor_id,
  name,
  description,
  price,
  category,
  meal_type,
  is_veg,
  is_available,
  rating
) VALUES
(
  'VENDOR_ID',
  'Butter Chicken',
  'Creamy tomato-based curry with tender chicken',
  299.00,
  'North Indian',
  'lunch',
  false,
  true,
  4.7
),
(
  'VENDOR_ID',
  'Paneer Tikka',
  'Grilled cottage cheese with spices',
  249.00,
  'North Indian',
  'lunch',
  true,
  true,
  4.5
);
```

---

## 🔧 Common Issues

### Issue: "Supabase client error"
**Solution:** Check your `.env.local` file has correct Supabase credentials

### Issue: "Database connection failed"
**Solution:** Make sure you ran all migration files in order

### Issue: "PostGIS functions not found"
**Solution:** Enable PostGIS extension:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: "Build fails"
**Solution:** 
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Use different port
PORT=3001 npm run dev
```

---

## 📚 Next Steps

### Learn the Codebase
1. Read [README.md](./README.md) - Project overview
2. Read [DESIGN_SYSTEM_GUIDE.md](./DESIGN_SYSTEM_GUIDE.md) - UI patterns
3. Explore the code structure

### Start Development
1. Pick a feature to work on
2. Create a new branch
3. Make your changes
4. Test locally
5. Submit a pull request

### Deploy to Production
1. Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Set up Vercel account
3. Deploy your app
4. Configure production environment

---

## 🎓 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types

# Database
supabase db push         # Push migrations
supabase db pull         # Pull schema changes
supabase db reset        # Reset database

# Testing (when implemented)
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Coverage report
```

---

## 📖 Documentation

- **[README.md](./README.md)** - Main documentation
- **[DESIGN_SYSTEM_GUIDE.md](./DESIGN_SYSTEM_GUIDE.md)** - UI/UX guidelines
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[PERFORMANCE_OPTIMIZATION_GUIDE.md](./PERFORMANCE_OPTIMIZATION_GUIDE.md)** - Performance tips
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing scenarios
- **[PHASE3_IMPLEMENTATION_COMPLETE.md](./PHASE3_IMPLEMENTATION_COMPLETE.md)** - Phase 3 summary
- **[PHASE4_COMPLETE_SUMMARY.md](./PHASE4_COMPLETE_SUMMARY.md)** - Phase 4 summary

---

## 🆘 Need Help?

- **Issues:** [GitHub Issues](https://github.com/yourusername/Rasan/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/Rasan/discussions)
- **Email:** support@Rasan.com
- **Discord:** [Join our community](https://discord.gg/Rasan)

---

## ✅ Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] PostGIS extension enabled
- [ ] Development server running
- [ ] First user created
- [ ] Sample data added (optional)

---

**Ready to build something amazing? Let's go! 🚀**
