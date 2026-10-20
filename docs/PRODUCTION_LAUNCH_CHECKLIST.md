# Rasan Production Launch & Pre-Flight Checklist

This checklist guides you through the final configuration steps to launch Rasan live on Vercel with Supabase, Razorpay, and your custom domain.

---

## 🗄️ Step 1: Apply all migrations in Supabase SQL Editor

Apply every file in `supabase/migrations/` in order (001 → 008). Migration 004 (`phone_verified`) is required by 006, and 008 must run **before** deploying the code that uses it (refunds, stock reservation, order expiry, payouts). Check what is applied with:

```sql
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') AS m004,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_approved') AS m006,
  to_regprocedure('nearby_kitchens(double precision,double precision,double precision)') IS NOT NULL AS m007,
  to_regprocedure('reserve_order_stock(uuid)') IS NOT NULL AS m008;
```

The original instructions for 005 follow. Ensure the admin persistence tables from Migration 005 are created in your Supabase production database:

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select your Rasan production project.
3. Navigate to the **SQL Editor** tab on the left sidebar.
4. Open the migration file: `supabase/migrations/005_startup_launch_admin_persistence.sql`.
5. Copy the entire file content and paste it into the Supabase SQL Editor.
6. Click **Run** (or `Ctrl + Enter`).
7. **Verification:** Navigate to the **Table Editor** and verify that the following tables exist:
   - ✅ `support_tickets`
   - ✅ `refunds_ledger`
   - ✅ `broadcast_announcements`
   - ✅ `payouts` (contains columns `utr_number`, `settled_at`, `bank_reference`)

---

## 💳 Step 2: Configure Razorpay Webhooks (Works with `.vercel.app`)

You do **not** need a custom domain yet. You can use your active Vercel domain (`https://rasan-pi.vercel.app`):

1. Log into your **[Razorpay Dashboard](https://dashboard.razorpay.com/)**.
2. Switch to **Live Mode** (or stay in **Test Mode** for staging testing).
3. Go to **Settings** → **Webhooks** → Click **+ Add New Webhook**.
4. **Webhook URL:**
   ```text
   https://rasan-pi.vercel.app/api/payments/webhook
   ```
   _(When you connect `rasan.in` later, simply update this URL to `https://rasan.in/api/payments/webhook`)_.
5. **Secret:** Generate or enter a secure random secret (e.g. `rasan_whsec_7793b82a`).  
   _(Copy this secret — you will paste it into your Vercel environment variables as `RAZORPAY_WEBHOOK_SECRET`)_.
6. **Active Events (Check these boxes):**
   - ☑️ `payment.captured`
   - ☑️ `order.paid`
   - ☑️ `payment.failed`
   - ☑️ `refund.processed`
   - ☑️ `refund.failed`
7. Click **Save Webhook**.

---

## ⚙️ Step 3: Set Vercel Production Environment Variables

1. Go to your **[Vercel Dashboard](https://vercel.com/)** → Select the **Rasan** project.
2. Click **Settings** → **Environment Variables**.
3. Ensure the following production keys are present for **Production** and **Preview**:

| Variable Name                   | Value / Description                                                | Required?    |
| ------------------------------- | ------------------------------------------------------------------ | ------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase Project URL (`https://xyz.supabase.co`)              | **Required** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Public Key                                      | **Required** |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your Supabase Service Role Secret Key                              | **Required** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`   | `rzp_test_...` (for testing) or `rzp_live_...` (for live payments) | **Required** |
| `RAZORPAY_KEY_SECRET`           | Your Razorpay API Key Secret                                       | **Required** |
| `RAZORPAY_WEBHOOK_SECRET`       | The Webhook Secret created in Step 2                               | **Required** |
| `NEXT_PUBLIC_APP_URL`           | `https://rasan-pi.vercel.app` (or your custom domain)              | **Required** |
| `CRON_SECRET`                   | Long random string; Vercel Cron uses it for `/api/cron/expire-orders` | **Required** |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Shared rate limits across instances (OTP / PIN / geocode)       | _Recommended_ |
| `NEXT_PUBLIC_UPI_PAYEE_VPA`     | Rasan's UPI ID for rider QR collection (QR hidden if empty)        | _Optional_   |
| `FAST2SMS_API_KEY`              | Optional: Your Fast2SMS API Key (defaults to mock log if empty)    | _Optional_   |
| `TWILIO_ACCOUNT_SID`            | Optional: Twilio SID for global SMS                                | _Optional_   |

4. After updating environment variables, go to the **Deployments** tab and click **Redeploy** on your latest commit to apply them.

---

## 🌐 Step 4: Map Your Custom Domain (e.g. `rasan.in`) on Vercel

When you purchase your domain name from Namecheap, GoDaddy, or Cloudflare:

1. In your **Vercel Project** → **Settings** → **Domains**.
2. Type your domain (e.g. `rasan.in` and `www.rasan.in`) and click **Add**.
3. Vercel will display the exact DNS records to configure at your domain registrar:
   - **Apex Domain (`rasan.in`):**
     - **Type:** `A`
     - **Name / Host:** `@`
     - **Value:** `76.76.21.21`
   - **Subdomain (`www.rasan.in`):**
     - **Type:** `CNAME`
     - **Name / Host:** `www`
     - **Value:** `cname.vercel-dns.com`
4. Once DNS propagates (typically 5 to 30 minutes), Vercel automatically provisions a free, auto-renewing **Let's Encrypt SSL certificate**.

---

## 🏁 Step 5: Pre-Flight Sanity Test Run

Before inviting real customers:

1. **Customer Order Test:** Place an order on `/meals` → select a lunch break slot → choose Online Payment.
2. **Kitchen Chime Verification:** Keep the vendor dashboard open on another tab or device; confirm that the browser audio chime rings and the new order appears without refreshing.
3. **Delivery Partner Test:** Open `/delivery-dashboard`, toggle duty status to **Online**, and verify that the GPS indicator turns green ("GPS LIVE").
4. **Payment Verification:** Verify in your Razorpay dashboard that the payment status is marked `Captured` and order status advances to `confirmed`.
