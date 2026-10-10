# Database schema

Reference for the `public` schema after migrations 001, 002 and 003. The migration files in
`supabase/migrations/` are authoritative. Generated types live in `types/database.types.ts`.

Related: [Setup](SETUP.md) · [Security model](SECURITY.md) · [API](../architecture/API.md)

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `customer`, `vendor`, `delivery`, `admin` |
| `order_status` | `pending`, `confirmed`, `preparing`, `ready`, `picked_up`, `out_for_delivery`, `delivered`, `cancelled` |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` |
| `payment_method` | `cash`, `card`, `upi`, `wallet` |
| `subscription_status` | `active`, `paused`, `cancelled`, `completed` |
| `meal_type` | `breakfast`, `lunch`, `dinner`, `snack` |
| `vehicle_type` | `bike`, `scooter`, `car` |

The UI uses `ready_for_pickup` for the database value `ready`. The API normalizes it
(`lib/utils/order-transitions.ts`).

## Tables

Every table has `id UUID` as its primary key (`uuid_generate_v4()`, except `profiles`) and
`created_at TIMESTAMPTZ`. All of them except `notifications` also have `updated_at`, kept current
by a trigger.

### profiles

One row per auth user (`id` → `auth.users.id`, cascade delete).

| Column | Type | Notes |
|--------|------|-------|
| email | TEXT | unique, not null |
| name | TEXT | not null |
| phone | TEXT | |
| role | user_role | default `customer`. Synced to `auth.users.raw_app_meta_data.role` (003) |
| avatar_url | TEXT | |
| address | JSONB | `{street, city, state, zip_code, coordinates: {lat, lng}}` |
| is_active | BOOLEAN | default true. `false` = suspended (API guards return 403) |
| is_verified | BOOLEAN | default false. Admin approval for vendors and riders |

### vendors

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID → profiles | cascade |
| business_name | TEXT | not null |
| description | TEXT | |
| cuisine | TEXT[] | |
| location | GEOGRAPHY(POINT, 4326) | not null, GIST index |
| address, phone, email | TEXT | not null |
| operating_hours | JSONB | not null. Also holds `daily_capacity` and `is_sold_out` (`/api/vendor/capacity`) |
| rating | NUMERIC(3,2) | default 0 |
| total_orders | INTEGER | default 0. Incremented by trigger on delivery |
| is_active | BOOLEAN | default `false` (003). Only an admin can make a vendor live for the first time (003) |
| bank_details, documents | JSONB | |

### meals

| Column | Type | Notes |
|--------|------|-------|
| vendor_id | UUID → vendors | cascade |
| name, category | TEXT | not null |
| description | TEXT | |
| meal_type | meal_type | not null |
| price | NUMERIC(10,2) | not null. The server prices orders from this column |
| discount_price | NUMERIC(10,2) | |
| image_url | TEXT | |
| ingredients, allergens | TEXT[] | |
| nutritional_info | JSONB | |
| is_veg, is_available | BOOLEAN | default true |
| stock | INTEGER | null = unlimited. Checked at order time |
| preparation_time | INTEGER | minutes, not null |
| rating | NUMERIC(3,2) | maintained by `update_meal_rating` |

### delivery_partners

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID → profiles | cascade |
| vehicle_type | vehicle_type | not null |
| vehicle_number, license_number | TEXT | not null |
| is_online | BOOLEAN | default false |
| current_location | GEOGRAPHY(POINT, 4326) | GIST index |
| rating | NUMERIC(3,2) | |
| total_deliveries | INTEGER | trigger-maintained |
| earnings | JSONB | `{today, this_week, this_month, total}`. Credited by trigger. `total` is reduced by `request_payout` |
| documents, bank_details | JSONB | |
| is_verified | BOOLEAN | default false. Admin approval. Unverified riders can't claim orders |

### orders

| Column | Type | Notes |
|--------|------|-------|
| order_number | TEXT | unique. Auto `ORD-YYYYMMDD-NNNN` if empty |
| customer_id | UUID → profiles | set null |
| vendor_id | UUID → vendors | set null |
| delivery_partner_id | UUID → delivery_partners | set null |
| items | JSONB | priced line items (`meal_id, name, quantity, price, subscription_type, delivery_days, delivery_time, discount_percentage`) |
| subtotal, delivery_fee, tax, total | NUMERIC(10,2) | not null. Computed server-side. `tax` holds the platform fee. `delivery_fee` is raised to at least ₹35 on delivery |
| discount | NUMERIC(10,2) | default 0 |
| status | order_status | default `pending`. Cash orders are created `confirmed` |
| payment_status | payment_status | default `pending` |
| payment_method | payment_method | not null |
| payment_id | TEXT | gateway payment id, set when verified |
| **payment_order_id** | TEXT | *(003)* Razorpay order id / Stripe PaymentIntent id the payment must match. Indexed |
| delivery_address | JSONB | not null. The handover PIN is **not** stored here (see `order_handover_codes`) |
| delivery_instructions | TEXT | |
| estimated_delivery_time, actual_delivery_time | TIMESTAMPTZ | |
| tracking_updates | JSONB | array of `{status, timestamp, message}` |
| rating | JSONB | `{food, delivery, comment?}`. The only column customers may write directly |
| **compensated_at** | TIMESTAMPTZ | *(003)* set once when late-delivery compensation is issued |

### subscriptions

| Column | Type | Notes |
|--------|------|-------|
| customer_id | UUID → profiles | cascade |
| vendor_id | UUID → vendors | cascade |
| **order_id** | UUID → orders | *(003)* set null on delete. Unique when not null (one subscription per checkout order) |
| plan_type | TEXT | `daily` / `weekly` / `monthly` |
| meal_type | TEXT | |
| start_date, end_date | DATE | |
| delivery_days | TEXT[] | lowercase weekday names |
| delivery_time | TIME | |
| address | JSONB | |
| price | NUMERIC(10,2) | set by the server |
| status | subscription_status | default `active` |
| payment_status | payment_status | default `pending` |
| auto_renew | BOOLEAN | |
| deliveries | JSONB | schedule array `{date, status: scheduled/skipped/delivered, order_id, ...}` |

### payouts *(003)*

Payout requests from vendors and riders. They are records only: no money moves automatically.

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID → profiles | not null, cascade, indexed |
| payee_type | TEXT | `vendor` / `delivery` |
| amount | NUMERIC(10,2) | `> 0` |
| method | TEXT | `upi` / `bank` |
| destination | JSONB | UPI id or bank account fields |
| status | TEXT | `pending` (default) / `processing` / `completed` / `rejected` |
| reference | TEXT | unique, `PAY-XXXXXXXXXXXX` |

### order_handover_codes *(003)*

The 4-digit delivery PIN for each order, created by the order routes. Readable only by the
ordering customer (customer queries embed `handover:order_handover_codes(code)`). Riders submit it
and the server compares it with the service role. Existing codes are moved here from
`orders.delivery_address` by the migration.

| Column | Type | Notes |
|--------|------|-------|
| order_id | UUID → orders | primary key, cascade |
| code | TEXT | 4 digits |
| created_at | TIMESTAMPTZ | |

### Other tables

| Table | Key columns |
|-------|-------------|
| `notifications` | `user_id` → profiles, `type` (`order`, `delivery`, `payment`, `promotion`, `system`), `title`, `message`, `data` JSONB, `is_read`. Vendor "Kitchen Circle" messages and menu broadcasts are also stored here (`type = 'system'`, `data.is_community_message`) |
| `categories` | `name` (unique), `description`, `image_url`, `is_active` |
| `reviews` | `meal_id`, `user_id`, `order_id`, `rating` 1–5, `comment`, `images` TEXT[]. Unique `(meal_id, user_id, order_id)` |
| `group_orders` | `group_id` (unique share code), `host_id`, `vendor_id`, `participants` JSONB `[{user_id, items, contribution}]`, `status` (`open`/`closed`/`ordered`), `expires_at` |
| `plan_pricing` | `plan_type`, `meal_type`, `days_per_week`, `base_price`, `discount_percentage`, `final_price`, `is_active` |

## Functions

| Function | Migration | Purpose |
|----------|-----------|---------|
| `update_updated_at_column()` | 001 | Trigger function that sets `updated_at = NOW()` |
| `generate_order_number()` / `set_order_number()` | 001 | Generates `ORD-YYYYMMDD-NNNN` on insert when `order_number` is empty |
| `nearby_vendors(lat, lng, radius_km = 10)` | 001 | Active vendors within the radius, sorted by `distance_km` |
| `assign_delivery_partner(order_id)` | 001 | Assigns the nearest online, verified, free rider. Not called by the current app (riders claim orders) |
| `calculate_delivery_fee(...)` | 001 | ₹20 + ₹5/km. **Not used**: checkout uses `lib/pricing/order-pricing.ts` |
| `update_meal_rating()` | 001 | Recomputes `meals.rating` from reviews |
| `update_vendor_stats()` | 001 | On transition to `delivered`: `total_orders + 1` and recomputes `rating` from `orders.rating->food` |
| `update_delivery_partner_stats()` | 001 | On transition to `delivered`: `total_deliveries + 1`, adds `NEW.delivery_fee` to every `earnings` bucket, recomputes `rating` from `orders.rating->delivery`. **The only place rider earnings are credited** |
| `notify_order_status_change()` | 002 | Customer notification per status change, plus vendor notification when a rider is assigned or picks up |
| `notify_new_order()` | 002 | Vendor notification on new order |
| `is_admin()` | 003 | `SECURITY DEFINER`. True when the caller's profile role is `admin`; used by read policies on `profiles`, `vendors`, `delivery_partners` |
| `is_end_user_request()` | 003 | True when `auth.role()` is `anon` or `authenticated` (not the service role) |
| `sync_profile_role_to_auth()` | 003 | `SECURITY DEFINER`. Copies `profiles.role` into `auth.users.raw_app_meta_data.role`. Not executable by end users |
| `guard_vendor_activation()` | 003 | Blocks an end user from switching a vendor from inactive to active unless the owner's profile is `is_verified` |
| `guard_subscription_status()` | 003 | End users can't change a `cancelled`/`completed` subscription, and can only set `active`/`paused`/`cancelled` |
| `request_payout(user_id, payee_type, amount, method, destination, commission_rate)` | 003 | `SECURITY DEFINER`, **service role only**. Locks the payee row, checks the balance and inserts a `pending` payout (see below) |

### request_payout balance rules

| Payee | Available balance | Effect |
|-------|-------------------|--------|
| `delivery` | `delivery_partners.earnings.total` (row locked) | Deducts the amount from `earnings.total` |
| `vendor` | `SUM(delivered orders.total) × (1 − commission) − SUM(non-rejected vendor payouts)` | No balance column changes. The payout row itself reduces future balance |

It raises `Insufficient balance` / `Invalid amount` (SQLSTATE `22023`), or `... not found`
(`P0002`). The API passes `RASAN_COMMISSION_RATE` (0.07) from `lib/utils/constants.ts`.

## Triggers

| Trigger | Table / event | Function |
|---------|---------------|----------|
| `update_<table>_updated_at` | BEFORE UPDATE on every table with `updated_at` (incl. `payouts`) | `update_updated_at_column` |
| `set_order_number_trigger` | BEFORE INSERT on orders | `set_order_number` |
| `update_meal_rating_trigger` | AFTER INSERT/UPDATE on reviews | `update_meal_rating` |
| `update_vendor_stats_trigger` | AFTER UPDATE on orders | `update_vendor_stats` |
| `update_delivery_partner_stats_trigger` | AFTER UPDATE on orders | `update_delivery_partner_stats` |
| `tr_order_status_notification` | AFTER UPDATE OF status, delivery_partner_id on orders | `notify_order_status_change` |
| `tr_new_order_notification` | AFTER INSERT on orders | `notify_new_order` |
| `sync_profile_role_to_auth_trigger` | AFTER INSERT OR UPDATE OF role on profiles | `sync_profile_role_to_auth` |
| `guard_vendor_activation_trigger` | BEFORE UPDATE OF is_active on vendors | `guard_vendor_activation` |
| `guard_subscription_status_trigger` | BEFORE UPDATE OF status on subscriptions | `guard_subscription_status` |

## Indexes

Every foreign key and common filter column has a B-tree index: `profiles(email, role)`,
`meals(vendor_id, category, meal_type, is_available, price)`, `orders(customer_id, vendor_id,
delivery_partner_id, status, payment_status, created_at DESC, payment_order_id)`,
`subscriptions(customer_id, vendor_id, status, start_date, end_date)` and the unique partial
index on `order_id`, `notifications(user_id, is_read, created_at DESC)`, `payouts(user_id)`, and
so on. `vendors.location` and `delivery_partners.current_location` have GIST indexes.
