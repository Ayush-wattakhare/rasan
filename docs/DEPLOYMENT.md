# Deployment Guide

This guide covers deploying the Rasan platform to production using Vercel and Supabase.

## Prerequisites

- GitHub account
- Vercel account
- Supabase account (production project)
- Razorpay account (production credentials)
- Stripe account (optional, production credentials)
- Custom domain (optional)

## Table of Contents

1. [Supabase Production Setup](#supabase-production-setup)
2. [Vercel Deployment](#vercel-deployment)
3. [Environment Variables](#environment-variables)
4. [Database Migrations](#database-migrations)
5. [Payment Gateway Configuration](#payment-gateway-configuration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)

---

## Supabase Production Setup

### 1. Create Production Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and region (select closest to your users)
4. Set a strong database password
5. Wait for project to be provisioned

### 2. Enable PostGIS Extension

```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### 3. Run Database Migrations

Execute migrations in order:

1. **Initial Schema** (`001_initial_schema.sql`)
   - Creates all tables, enums, and indexes
   - Sets up spatial indexes for location-based queries

2. **Functions and Triggers** (`002_functions_triggers.sql`)
   - Creates database functions
   - Sets up triggers for automated updates

3. **RLS Policies** (`003_rls_policies.sql`)
   - Enables Row Level Security
   - Creates security policies for all tables

### 4. Configure Storage Buckets

Create the following storage buckets:

```sql
-- Meal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true);

-- Profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Vendor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false);

-- Delivery partner documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-documents', 'delivery-documents', false);
```

Set storage policies:

```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow vendors to upload meal images
CREATE POLICY "Vendors can upload meal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meal-images');
```

### 5. Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates
4. Set up OAuth providers (optional):
   - Google
   - Facebook
   - Apple

### 6. Set Up Realtime

1. Go to Database > Replication
2. Enable replication for:
   - `orders` table
   - `notifications` table
   - `delivery_partners` table (for location updates)

---

## Vercel Deployment

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 3. Configure Build Settings

**Environment Variables** (see next section)

**Build & Development Settings:**
- Node.js Version: 18.x or higher
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`

### 4. Deploy

Click "Deploy" and wait for the build to complete.

---

## Environment Variables

Add these in Vercel Dashboard > Settings > Environment Variables:

### Required Variables

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Razorpay (Production)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_production_secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Optional Variables

```env
# Stripe (if using)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

**Important:** Set environment variables for all environments (Production, Preview, Development)

---

## Database Migrations

### Running Migrations

**Option 1: Supabase Dashboard**
1. Go to SQL Editor
2. Copy migration file content
3. Execute SQL

**Option 2: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Verify Migrations

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## Payment Gateway Configuration

### Razorpay Setup

1. **Create Production Account**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
   - Complete KYC verification
   - Get production API keys

2. **Configure Webhooks**
   - URL: `https://your-domain.com/api/webhooks/razorpay`
   - Events to subscribe:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `refund.created`

3. **Test Integration**
   ```bash
   curl -X POST https://your-domain.com/api/payments/create-order \
     -H "Content-Type: application/json" \
     -d '{"order_id":"test","amount":100,"currency":"INR"}'
   ```

### Stripe Setup (Optional)

1. **Create Production Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Complete verification
   - Get production API keys

2. **Configure Webhooks**
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check homepage loads
curl https://your-domain.com

# Check API health
curl https://your-domain.com/api/health

# Check database connection
curl https://your-domain.com/api/meals
```

### 2. Authentication Flow

- [ ] Register new user
- [ ] Login with credentials
- [ ] Password reset flow
- [ ] OAuth login (if configured)

### 3. Core Features

- [ ] Browse meals
- [ ] Add to cart
- [ ] Place order
- [ ] Payment processing
- [ ] Order tracking
- [ ] Real-time updates

### 4. Role-Specific Features

**Vendor:**
- [ ] Create meal
- [ ] Update order status
- [ ] View analytics

**Delivery Partner:**
- [ ] Accept order
- [ ] Update location
- [ ] Complete delivery

**Admin:**
- [ ] View users
- [ ] Platform analytics
- [ ] User management

### 5. Performance Tests

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# Check Core Web Vitals
# Use PageSpeed Insights: https://pagespeed.web.dev/
```

### 6. Security Checks

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] RLS policies active
- [ ] API rate limiting working
- [ ] CORS configured correctly

---

## Monitoring and Logging

### Set Up Sentry (Recommended)

1. **Create Sentry Project**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. **Configure Sentry**
   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 1.0,
     environment: process.env.NODE_ENV,
   });
   ```

3. **Add to Vercel**
   - Set `NEXT_PUBLIC_SENTRY_DSN` environment variable

### Vercel Analytics

1. Go to Vercel Dashboard > Analytics
2. Enable Web Analytics
3. Enable Speed Insights

### Supabase Logs

- Monitor database logs in Supabase Dashboard
- Set up log drains for external services
- Configure alerts for errors

---

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to Project Settings > Domains
2. Add your domain
3. Configure DNS records:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 2. SSL Certificate

- Vercel automatically provisions SSL certificates
- Wait for DNS propagation (up to 48 hours)
- Verify HTTPS works

### 3. Update Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Backup Strategy

### Database Backups

1. **Supabase Automatic Backups**
   - Daily backups (retained for 7 days on Pro plan)
   - Point-in-time recovery available

2. **Manual Backups**
   ```bash
   # Using pg_dump
   pg_dump -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -F c \
     -f backup_$(date +%Y%m%d).dump
   ```

### Storage Backups

- Configure S3 bucket for storage backups
- Set up automated backup scripts
- Test restore procedures regularly

---

## Scaling Considerations

### Database

- Monitor connection pool usage
- Add read replicas if needed
- Optimize slow queries
- Consider database indexes

### Application

- Vercel automatically scales
- Monitor function execution times
- Optimize API routes
- Implement caching strategies

### Storage

- Use CDN for static assets
- Optimize image sizes
- Implement lazy loading

---

## Troubleshooting

### Build Failures

**Issue:** Build fails on Vercel

**Solutions:**
- Check build logs in Vercel Dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript types are correct
- Check environment variables are set

### Database Connection Issues

**Issue:** Cannot connect to Supabase

**Solutions:**
- Verify Supabase URL and keys
- Check RLS policies
- Ensure service role key is used for server-side operations
- Check connection pooling settings

### Payment Integration Issues

**Issue:** Payments failing

**Solutions:**
- Verify API keys are production keys
- Check webhook URLs are correct
- Verify webhook signatures
- Check payment gateway dashboard for errors

### Real-time Not Working

**Issue:** Real-time updates not received

**Solutions:**
- Verify Realtime is enabled in Supabase
- Check replication settings
- Verify client subscription code
- Check browser console for errors

---

## Rollback Procedure

If deployment fails:

1. **Revert to Previous Deployment**
   - Go to Vercel Dashboard > Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **Database Rollback**
   - Restore from backup if needed
   - Revert migrations if necessary

3. **Notify Users**
   - Update status page
   - Send notification if needed

---

## Support

For deployment support:
- Email: devops@Rasan.com
- Slack: #deployment-support

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
