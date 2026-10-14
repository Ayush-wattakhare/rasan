# Rasan 100% Launch Readiness Master Plan (5-Pillar Roadmap)

**Document Version:** 1.0.0  
**Target Date:** October 2026 Launch  
**Goal:** Transition Rasan from 88% MVP Readiness to 100% Production Launch Day Readiness.

---

## 🏛️ Architecture & Pillar Overview

```
                      ┌────────────────────────────────────────┐
                      │    RASAN 100% PRODUCTION READINESS     │
                      └────────────────────────────────────────┘
                                          │
       ┌───────────────┬──────────────────┼─────────────────┬────────────────┐
       ▼               ▼                  ▼                 ▼                ▼
   Pillar 1:       Pillar 2:          Pillar 3:         Pillar 4:        Pillar 5:
 Kitchen Chime   Payment Gateway    Rider GPS Fleet    SMS / WhatsApp   Production Ops
  & Realtime       & Webhooks          Streaming         Alerting         & Pre-flight
```

---

## 🔔 Pillar 1: Kitchen Realtime Chime & Live Order Queue

### Objective

Ensure home chefs never miss an order during peak lunch and dinner hours by adding realtime web audio chimes and reactive order cards.

### Tasks & Technical Specifications

1. **Web Audio Synthesizer Hook (`useKitchenChime`):**
   - Create a zero-dependency audio synthesizer using the native browser `AudioContext`.
   - Generates a pleasant two-tone brass chime (880Hz -> 1320Hz) without needing external `.mp3` files that could fail to load or get blocked by CORS.
   - User interaction unlock: Initialize audio context on first click/dashboard load to satisfy browser autoplay policies.
   - Mute/Unmute state persisted in `localStorage`.
2. **Supabase Realtime Order Listener (`useVendorOrdersRealtime`):**
   - Subscribe to Postgres changes on the `orders` table filtered by `vendor_id`.
   - On `INSERT` or `UPDATE` where status transitions to `confirmed` / `preparing`, trigger audio chime and visual pulse notification.
3. **Vendor Dashboard Visual Cue:**
   - Add a glowing "New Order Alert" badge and high-priority banner at the top of `/vendor-dashboard` and `/vendor-orders`.

---

## 💳 Pillar 2: Payment Gateway & Financial Audit (Razorpay Live & Webhooks)

### Objective

Guarantee 100% financial integrity, zero lost payments, and safe transition from sandbox to live UPI/cards.

### Tasks & Technical Specifications

1. **Webhook Idempotency & Signature Hardening:**
   - In `app/api/payments/webhook/route.ts`, verify `x-razorpay-signature` against raw request body using HMAC SHA256.
   - Implement idempotency check: before updating order state to `paid`, check if `payment_status === 'paid'` to avoid duplicate processing.
   - Record payment reference in `refunds_ledger` and `payouts` where appropriate.
2. **Live Environment Configuration Matrix:**
   - Provide explicit configuration docs for production keys:
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Live key (`rzp_live_...`)
     - `RAZORPAY_KEY_SECRET`: Live secret
     - `RAZORPAY_WEBHOOK_SECRET`: Configured secret from Razorpay Dashboard
3. **Admin Payment Health Check:**
   - In `app/api/admin/system/health/route.ts`, verify gateway connectivity and configuration status without exposing secret values.

---

## 🛵 Pillar 3: Realtime Rider GPS Location Streaming

### Objective

Give customers live, animated map tracking of their delivery partner from kitchen pickup to doorstep delivery.

### Tasks & Technical Specifications

1. **Battery-Efficient Rider GPS Tracker Hook (`useRiderLocationTracker`):**
   - Location streaming via `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.
   - Throttled sync: Send coordinates to backend every 10–12 seconds, or if displacement exceeds 20 meters.
   - Active state gating: Only stream when rider is `is_online === true` AND has an active assigned sortie (`order.status IN ('out_for_delivery', 'picked_up')`).
2. **Location Ingestion Route (`POST /api/delivery/location`):**
   - Updates `delivery_partners.current_location` with PostGIS point `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.
   - Updates `delivery_partners.updated_at` for stale heartbeat detection.
3. **Customer Live Tracking UI:**
   - Updates the rider marker on customer order tracking screen in real time.

---

## 📲 Pillar 4: SMS & WhatsApp Transactional Notification Gateway

### Objective

Deliver instant, reliable SMS or WhatsApp updates to customers and delivery personnel even when the browser tab is closed.

### Tasks & Technical Specifications

1. **Pluggable Transactional Notification Service (`lib/notifications/transactional.ts`):**
   - Multi-provider architecture with fallback:
     - Support Fast2SMS / MSG91 / Twilio for India SMS.
     - Support WhatsApp Business Cloud API / Gupshup for WhatsApp messaging.
     - Fallback to database notifications when external SMS keys are not configured.
2. **Key Notification Milestones:**
   - **Order Placed & Confirmed:** To Customer with estimated lunch break delivery time.
   - **Order Ready for Pickup:** To Assigned Delivery Partner with kitchen address.
   - **Out for Delivery:** To Customer with rider name and live tracking link.
   - **Delivered:** To Customer requesting review and receipt link.

---

## 🚀 Pillar 5: Production Operations & Pre-Flight Checklist

### Objective

Ensure deployment infrastructure, database migrations, security rules, and performance checks are zero-defect before accepting customers.

### Checklist

1. **Supabase Production Migrations:**
   - [x] `001_initial_schema.sql` (Tables & PostGIS extensions)
   - [x] `002_rls_policies.sql` (Row Level Security)
   - [x] `003_security_hardening.sql` (Column level revokes on bank/docs)
   - [x] `004_fix_permissions.sql` (Service role grants)
   - [x] `005_startup_launch_admin_persistence.sql` (Tickets, refunds, broadcasts)
2. **Codebase Quality & Automated Test Gates:**
   - [x] `npm run type-check` (0 errors)
   - [x] `npm test` (117/117 unit and integration tests passing)
   - [x] `npm run build` (Static and dynamic App Router compilation)
   - [x] `npx prettier --check` (All files formatted)
3. **Environment Variables Verification:**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] `SUPABASE_SERVICE_ROLE_KEY`
   - [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Live)
   - [ ] `RAZORPAY_KEY_SECRET` (Live)
   - [ ] `RAZORPAY_WEBHOOK_SECRET`
   - [ ] `NEXT_PUBLIC_APP_URL` (Custom domain with SSL)

---

## 📅 Execution Roadmap & Order of Implementation

|    Step    | Milestone                                           | Affected Files                                                         | Estimated Duration  |
| :--------: | :-------------------------------------------------- | :--------------------------------------------------------------------- | :-----------------: |
| **Step 1** | **Kitchen Realtime Chime & Alerting**               | `lib/utils/audio-chime.ts`, `components/vendor/vendor-orders-view.tsx` | Next immediate step |
| **Step 2** | **Payment Gateway Idempotency & Webhook Hardening** | `app/api/payments/webhook/route.ts`, `lib/payments/razorpay.ts`        |       Step 2        |
| **Step 3** | **Rider Realtime GPS Location Streaming**           | `hooks/use-rider-location.ts`, `app/api/delivery/location/route.ts`    |       Step 3        |
| **Step 4** | **Pluggable SMS & WhatsApp Notification Service**   | `lib/notifications/transactional.ts`, `app/api/orders/create/route.ts` |       Step 4        |
| **Step 5** | **Pre-Flight Verification & Launch Runbook**        | `docs/LAUNCH_RUNBOOK.md`, `npm test`, `npm run build`                  |     Final Step      |
