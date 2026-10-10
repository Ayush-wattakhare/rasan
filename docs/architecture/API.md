# API reference

Route handlers under `app/api/**/route.ts` (Next.js 16 App Router). This page lists only routes
that exist in the code. When this page and the code disagree, the handler is right.

Related: [Database security model](../database/SECURITY.md) · [Schema](../database/SCHEMA.md) ·
[Security audit plan](../audit/2026-10-security-cleanup/PLAN.md)

## Conventions

| Topic | Rule |
|-------|------|
| Auth | Supabase session **cookies** (`@supabase/ssr`), sent automatically by the browser. No bearer header. The request proxy (`proxy.ts`) does **not** run on `/api`, so every route authenticates itself |
| Guards | `lib/auth/guards.ts`: `requireUser()` (signed in and not suspended), `requireRole(...roles)`, `requireAdmin()`. Role comes from `profiles.role`, never `user_metadata`. Some older routes do the same check inline with `auth.getUser()` + a `profiles` lookup. Those don't block suspended users |
| Privileged writes | Done with the service role after the auth check. The browser can't set prices, totals, statuses, payment state, roles or earnings ([SECURITY.md](../database/SECURITY.md)) |
| Errors | JSON `{ "error": "..." }`. `400` bad input · `401` not signed in · `403` wrong role / not owner / suspended · `404` · `409` state conflict (wrong status, already taken, insufficient balance) · `429` too many OTP attempts · `500` |
| Response shape | Not uniform. Some routes return the row, others `{ success, data }` or `{ success, <name> }` |
| Order statuses | `ready_for_pickup` is accepted as an alias for `ready` |

"Who" column: **Public** = no auth. **User** = any signed-in user. **Owner** = the record must
belong to the caller. **Role** = `profiles.role` check.

## Auth & profile

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| GET | `/api/auth/callback` | Public | `?code`, `?next` | Exchanges the PKCE code for a session, then redirects to `next` (same-origin relative paths only, via `safeRedirectPath`) |
| POST | `/api/auth/create-profile` | Session user, or a just-signed-up user | `userId, email, name, phone?, role?`, vendor fields (`businessName, businessDesc, address, cuisines, fssai, gst`), rider fields (`vehicleType, vehicleNumber, licenseNumber`) | Uses the session user when there is one. Without a session, `userId` must match an auth user with the same email created in the last 15 min. `admin` is rejected. Vendor/rider sign-ups get `is_verified=false` and an inactive vendor / unverified rider record. 409 if the profile already exists |
| POST | `/api/auth/logout` | Any | none | Signs out and clears `sb-*` cookies |
| GET | `/api/profile` | User | none | Own profile |
| PUT | `/api/profile` | User | `name?, phone?, address?` | `address` needs `street, city, state, zip_code, coordinates{lat,lng}`. Role and verification can't be changed here |
| POST | `/api/profile/avatar` | User | multipart `file` | JPEG/PNG/WebP ≤ 5 MB → `profiles` bucket, updates `avatar_url` |

## Partner applications

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| POST | `/api/become-vendor` | User, or signed-out applicant with `email` + `password` | `businessName, address` (required), `phone, description, cuisine, fssai, gst, bankAccount, ifsc, fullName` | Signed out: creates the account with the normal `signUp` flow (email confirmation rules apply). Admins can't apply. Creates the vendor with `is_active=false`, sets `profiles.role='vendor'`, `is_verified=false`. Waits for admin approval |
| POST | `/api/become-delivery-partner` | Same as above | `vehicleType, vehicleNumber, licenseNumber, age, bloodGroup, emergencyContact, aadharNumber, bankAccountNumber, ifscCode, fullName` | Creates `delivery_partners` with `is_verified=false`, sets role `delivery` |
| POST | `/api/delivery-partners` | User | `vehicle_type, vehicle_number, license_number` (required), `documents, bank_details` | Direct insert with the user session (RLS + column grants). Earnings and verification use DB defaults |
| GET | `/api/delivery-partners` | User | none | Caller's rider record, read through RLS (see the [SECURITY.md](../database/SECURITY.md#known-gaps) note on unverified riders) |
| GET | `/api/vendor/check-status` | User | none | Read-only. Caller's latest vendor record or `null`. Never creates one |

## Catalog (meals, vendors, reviews)

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| GET | `/api/meals` | Public | `?vendor_id` | With `vendor_id`: that kitchen's meals (the owner sees unavailable ones too). Without it: available meals from active vendors |
| POST | `/api/meals` | Owner vendor | `vendor_id, name, category, meal_type, price, preparation_time` (required), `description, discount_price, image_url, ingredients, allergens, nutritional_info, is_veg, is_available, stock` | `vendor_id` must belong to the caller |
| PATCH | `/api/meals/[id]` | Owner vendor | any of the editable meal fields | Allow-listed fields only. Numbers must be ≥ 0 |
| DELETE | `/api/meals/[id]` | Owner vendor | none | |
| GET | `/api/meals/[id]/reviews` | Public | none | Reviews for a meal with reviewer name and avatar only (profiles themselves are private) |
| GET | `/api/vendors` | Public | `?latitude&longitude&radiusKm` (nearby, default 10 km) or `?cuisineType&search&page&limit` | `lib/services/vendor-service.ts` |
| GET | `/api/vendors/[id]` | Public | none | |
| GET | `/api/vendors/[id]/community-feed` | Public (optional session) | none | "Kitchen Circle". Messages are returned only to active subscribers and the kitchen owner |
| POST | `/api/vendors/[id]/community-feed` | User: kitchen owner or active subscriber | `message` | Stored as a `system` notification with `data.is_community_message` |
| POST | `/api/reviews` | User, customer of the order | `orderId, rating` (integer 1–5), `comment?` | Order must be the caller's and `delivered`. Recomputes the vendor rating |

## Orders

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| POST | `/api/orders` | User | `items[]: {meal_id, quantity (1–50), subscription_type: one-time\|weekly\|monthly, delivery_days[], delivery_time}` (≤ 50 items), `payment_method: cash\|card\|upi\|wallet`, `delivery_address` (object), `delivery_instructions?` | **Server-side pricing** from `meals.price` via `lib/pricing/order-pricing.ts` (platform fee ₹2, delivery ₹0, weekly −20%, monthly −30%). All items from one active kitchen. Checks availability and stock (409 lists `unavailableItems`). **Cash → `confirmed`, online → `pending`** until payment is verified. `payment_status` always starts `pending`. Creates the 4-digit **delivery OTP** in `order_handover_codes` (readable only by this customer). Returns 201 + order |
| GET | `/api/orders` | User | `?status&limit (≤100)&offset` | Caller's orders as customer |
| GET | `/api/orders/[id]` | Owner customer | none | |
| PATCH | `/api/orders/[id]` | Owner customer | `rating: {food, delivery (1–5), comment?}` | Only for delivered orders. Sending `payment_status` returns 400 |
| PUT / PATCH / POST | `/api/orders/[id]/status` | Role vendor / delivery / admin, and must own the order | `status`, `otp?`, `payment_status?` | Goes through `transitionOrder` (below). `payment_status: 'paid'` is accepted only from the assigned rider of a **cash** order once it's picked up (cash collected). Customers get 403 |
| POST | `/api/orders/[id]/cancel` | Owner customer or admin | none | Customers can cancel only while `pending`/`confirmed`. Admins can cancel any non-delivered order. Refund % by status: 100% before preparing, 50% preparing, 0% after. **Only if actually paid.** Sets `payment_status='refunded'` when a refund applies (no gateway refund call). Conditional update, 409 on race |
| POST | `/api/orders/[id]/late-compensation` | Owner customer | none | Delivered orders only. Eligible if delivered more than 15 min after the estimate (or 35 min after ordering when there's no estimate). 15% of total, **once per order** (`compensated_at`). Sends a notification. No credit balance is stored |

### Status transitions (`lib/orders/transition.ts`)

Allowed changes per actor come from `lib/utils/order-transitions.ts`:

| Actor | Allowed |
|-------|---------|
| vendor (own kitchen) | `pending → confirmed/cancelled`, `confirmed → preparing/cancelled`, `preparing → ready` |
| delivery (assigned rider) | `ready → picked_up`, `picked_up → out_for_delivery`, `out_for_delivery → delivered` |
| admin | any forward step, and `cancelled` from any non-final status |

Every transition goes through these rules:

- Unpaid online orders can't move forward (409 "awaiting payment"). They can only be cancelled.
- `delivered` by a rider requires the customer's **OTP**: 5 attempts per rider and order per 15 min (429).
- The update is conditional on the current status, so replays and races get 409.
- On `delivered`: sets `actual_delivery_time`, marks cash orders paid, and raises
  `delivery_fee` to at least ₹35. The `update_delivery_partner_stats` trigger then credits that
  amount to the rider.
- The OTP lives in `order_handover_codes`, readable only by the ordering customer; kitchens and riders never receive it.

## Payments

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| POST | `/api/payments/create-order` | Owner customer | `orderId, provider: razorpay\|stripe` | Amount always comes from `orders.total`, and any amount in the body is ignored. Stores the Razorpay order id / Stripe PaymentIntent id in `orders.payment_order_id` (**payment binding**). 500 if the provider isn't configured |
| POST | `/api/payments/verify` | Owner customer | `orderId, paymentId, provider`. Razorpay also needs `razorpayOrderId, signature` | Razorpay: `razorpayOrderId` must equal `payment_order_id`, and HMAC-SHA256 of `order_id\|payment_id` is compared in constant time. Stripe: the PaymentIntent must match `payment_order_id`, `metadata.order_id` and amount, and have status `succeeded`. Idempotent if the webhook already recorded the same payment |
| POST | `/api/payments/webhook` | Razorpay (signed) | raw body + `x-razorpay-signature` | HMAC with `RAZORPAY_WEBHOOK_SECRET` (401/403 on failure). On `payment.captured`, finds the order by `payment_order_id`, checks the full amount, then marks it paid. Only orders still awaiting payment change |

Without Razorpay keys, checkout offers cash only. Orders are never marked paid without a
verified payment.

## Subscriptions

All routes require a signed-in user and **ownership** (`customer_id = caller`).

| Method | Path | Request | Notes |
|--------|------|---------|-------|
| POST | `/api/subscriptions` | `meal_type, start_date (YYYY-MM-DD, today −1 … +30 days), delivery_days[], delivery_time, address, auto_renew?`, plus **either** `order_id` (from checkout) **or** `plan_type + vendor_id` | Price, payment status and end date are set by the server. With `order_id`: price and payment status come from the order (which must contain a weekly/monthly item), one subscription per order (409). Standalone: price from `lib/pricing/subscription-pricing.ts`, `payment_status='pending'`. Vendor must be active. Generates the `deliveries` schedule |
| GET | `/api/subscriptions` | none | Caller's subscriptions with vendor info |
| GET | `/api/subscriptions/[id]` | none | |
| PUT | `/api/subscriptions/[id]` | `delivery_time?, auto_renew?, address?` | Schedule preferences only |
| POST | `/api/subscriptions/[id]/pause` | none | `active → paused` |
| POST | `/api/subscriptions/[id]/resume` | none | `paused → active`. Fails if past `end_date` |
| POST | `/api/subscriptions/[id]/cancel` | none | Any non-cancelled → `cancelled` |
| POST | `/api/subscriptions/[id]/skip-day` | `date, reason?` | Active only. Not in the past. Same-day cutoff 8:00 AM IST (lunch) / 3:00 PM IST (dinner). Marks the day skipped and appends a replacement day, extending `end_date` (service role) |
| POST | `/api/subscriptions/[id]/unskip-day` | `date` | Restores a skipped day to `scheduled` |
| POST | `/api/subscriptions/[id]/swap-meal` | `date, mealTitle, dietaryNotes?` | Active only. Customizes one scheduled delivery |
| POST | `/api/subscriptions/[id]/change-delivery-address` | `date, address` | Only for a `scheduled` delivery |

## Group orders

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| POST | `/api/group-orders` | User (becomes host) | `vendor_id, expires_at` | Random `group_id` share code |
| GET | `/api/group-orders/[id]` | User (RLS: host or participant) | none | |
| PUT | `/api/group-orders/[id]` | User | `items[], contribution` | Adds or updates the caller as a participant while open and not expired. Uses the user session, so RLS applies (only the host can update) |
| POST | `/api/group-orders/[id]/finalize` | Host | none | Prices items from `meals` (same kitchen, available), claims the group (`open → ordered`) once, and creates a **cash** order (status `pending`, ₹50 delivery, 5% tax) with an OTP. Notifies participants |

## Notifications & uploads

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| GET | `/api/notifications` | User | none | Latest 50 of the caller's |
| POST | `/api/notifications` | Role admin | `type, title, message, target ('all') or user_id` | Inserts with the service role after the admin check |
| PUT / POST | `/api/notifications/[id]/read` | Owner | none | |
| PUT / POST | `/api/notifications/read-all` | User | none | |
| POST | `/api/upload/image` | User | multipart `file`, `folder` ∈ `meals, vendors, avatars, reviews` | JPEG/PNG/WebP/GIF ≤ 5 MB → `meal-images` bucket (auto-created). Path `<folder>/<user>_<ts>.<ext>`. Extension comes from the MIME type |

## Vendor

`requireRole('vendor')` unless noted. Every route works only on the **caller's own** kitchen.

| Method | Path | Request | Notes |
|--------|------|---------|-------|
| GET | `/api/vendor/orders` | none | Signed-in user. Orders for the caller's kitchen, **OTP stripped** |
| PATCH / POST | `/api/vendor/orders` | `orderId, status` | `transitionOrder` as vendor |
| POST | `/api/vendor/update-order-status` | `orderId, status` | Same as above |
| GET / PUT | `/api/vendor/capacity` | PUT: `dailyCapacity?, isSoldOut?` | Signed-in user with a vendor record. Stored in `operating_hours`. GET also returns portions booked today |
| GET / POST | `/api/vendor/bank-details` | POST: `bankDetails` (merged) | Signed-in user with a vendor record |
| GET | `/api/vendor/broadcast` | none | Active subscribers (falls back to subscription items in orders), the tomorrow's-menu post, Kitchen Circle messages |
| POST | `/api/vendor/broadcast` | `action: update_menu` + `menu.items[]` · `send_message` + `message` · `update_tiffin_status` (acknowledged only, not stored) | |
| POST | `/api/vendor/payouts/withdraw` | `amount (≥ ₹50, 2 dp), method: upi\|bank`, `upiId` or `bankDetails{account_number, ifsc_code, account_holder_name, bank_name?}` | Calls `request_payout` (atomic balance check: delivered totals × (1 − 7%) − earlier payouts). Records a **pending** payout. Nothing is transferred. 409 on insufficient balance |

## Delivery

| Method | Path | Who | Request | Notes |
|--------|------|-----|---------|-------|
| GET | `/api/delivery/orders` | Role delivery | none | Rider feed: own active deliveries + ready, unassigned orders (none for unverified riders). Customer contact only on own orders. OTP never included |
| POST | `/api/delivery/accept-order` | Role delivery, verified | `orderId` or `orderIds[]` (≤ 5) | Claims `ready`, unassigned, paid-or-cash orders and moves them to `picked_up`. The rider is always the caller. Conditional update, so only one rider wins |
| POST | `/api/delivery-partners/orders/[id]/accept` | Role delivery, verified | none | Single-order version of the above |
| POST | `/api/delivery/update-order-status` | Role delivery, assigned | `orderId, status ∈ picked_up\|out_for_delivery\|delivered, otp?` | `delivered` requires the customer's OTP (rate limited) |
| POST | `/api/delivery/toggle-online` | User, own record | `deliveryPartnerId, isOnline` | User session, filtered by `user_id` |
| PUT | `/api/delivery-partners/[id]/status` | Owner rider | `is_online` | |
| POST | `/api/delivery/update-location` | User, own record | `deliveryPartnerId, latitude, longitude` | Writes `current_location` (WKT) |
| GET | `/api/delivery-partners/[id]/location` | Rider themself, admin, or a customer whose order this rider is carrying (`picked_up`/`out_for_delivery`) | none | Returns `lat/lng` |
| PUT | `/api/delivery-partners/[id]/location` | Owner rider, online | `lat, lng` | Updates `current_location` on the rider's own row and broadcasts to customers with active deliveries |
| GET | `/api/delivery/stats` | User with rider record | none | Today / week / month deliveries and earnings |
| GET / POST | `/api/delivery/bank-details` | User with rider record | POST: `bankDetails` (merged) | |
| POST | `/api/delivery/payouts/withdraw` | Role delivery | same body as the vendor payout | `request_payout` deducts from `earnings.total`. Pending record only |

## Admin

All admin routes require `profiles.role = 'admin'` (`requireAdmin()` or an inline check).

| Method | Path | Request | Notes |
|--------|------|---------|-------|
| GET | `/api/admin/analytics` | `?date_from&date_to` | Aggregates orders, profiles, vendors and riders. Queries with the **user session**, so RLS applies: there's no admin SELECT policy, so counts only cover rows the admin can see (e.g. no other customers' orders) |
| GET / POST | `/api/admin/broadcasts` | POST: `title, message, target? (all\|customer\|vendor\|delivery), priority?` | Writes `system` notifications for the target users (first 50). The broadcast history list is **in memory** (resets on restart) |
| GET | `/api/admin/partners/pending` | none | Vendors and riders whose profile isn't verified |
| POST | `/api/admin/partners/verify` | `userId` (or `partnerId`), `role: vendor\|delivery`, `action: accept\|…`, `reason?` | Accept: profile `is_verified` + `is_active`, vendor `is_active` / rider `is_verified`. Anything else **rejects and deactivates the profile** (suspends the account). Notifies the user |
| POST | `/api/admin/users` | `email, password, name, role: vendor\|delivery`, partner fields | Creates a confirmed auth user + profile + partner record |
| PUT / PATCH | `/api/admin/users/[id]/status` | `is_active?, is_verified?, role?` | Admins can't remove their own admin role. `is_active` is mirrored to `vendors`, `is_verified` to `delivery_partners` |
| POST | `/api/admin/live-ops/cancel` | `orderId, reason?, refundCustomer?, refundAmount?, faultAttribution?` | Cancels any order unconditionally (no transition check, `payment_status` unchanged). Notifies the customer |
| POST | `/api/admin/live-ops/reassign` | `orderId, targetRiderId, reason?` | Sets `delivery_partner_id`. Doesn't check that the rider is verified or online |
| GET / POST | `/api/admin/refunds` | POST: `amount` + recipient/order fields | **In-memory mock** ledger. Sends a notification only. No gateway refund, no DB record |
| GET / POST | `/api/admin/settlements` | POST: `settlementId, customUtr?, notes?` | **In-memory mock** data. Doesn't read the `payouts` table |
| GET / POST / PATCH | `/api/admin/support/tickets` | filters / ticket fields / `ticketId, status, …` | **In-memory mock** tickets |

## Dev tools

These exist for local and preview environments. `lib/dev-tools.ts` gates them:

| Gate | Rule |
|------|------|
| `devToolsGuard()` | Returns **404** unless `ENABLE_DEV_TOOLS=true`. Always off when `VERCEL_ENV=production`, and off when `NODE_ENV=production` without `VERCEL_ENV` (e.g. a local `next start`) |
| `setupSecretGuard()` | `devToolsGuard()` **and** header `x-admin-secret` equal to `ADMIN_SETUP_SECRET` (constant-time compare). 403 if the secret isn't configured, 401 if wrong |

Never set `ENABLE_DEV_TOOLS` in production.

| Method | Path | Gate | Notes |
|--------|------|------|-------|
| POST | `/api/admin/setup` | `setupSecretGuard` | Body `email, password, name`. Creates a confirmed admin user + profile. Used by `/admin/setup` |
| POST | `/api/admin/create-demo-users` | `setupSecretGuard` | Creates or resets one demo account per role, plus a vendor and a rider record for them |
| POST | `/api/admin/seed-data` | `devToolsGuard` + admin | Inserts a sample vendor and meals. Used by `/admin/seed-data` |
| GET / POST | `/api/dev/simulate-lifecycle` | `devToolsGuard` + admin | In-memory order lifecycle simulator for `/dev/order-simulator` (`action: start_or_reset`, …). Doesn't write orders |
