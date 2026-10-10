# Database security model

How the database limits what end users can read and write after migration
`003_security_hardening.sql`, which writes must go through server routes, and how to check it.

Related: [Schema](SCHEMA.md) · [Setup](SETUP.md) · [API](../architecture/API.md) ·
[Security audit plan](../audit/2026-10-security-cleanup/PLAN.md)

## Model in one paragraph

The browser talks to Supabase with the public `anon` key and the user's JWT (Postgres roles
`anon` / `authenticated`). Two layers protect the data. **RLS policies** decide *which rows* a
user may touch. **Column-level grants** (added in 003) decide *which columns* a user may insert or
update. Anything privileged (prices, totals, order and payment status, roles, verification,
earnings, payouts) can't be written with the anon key at all. Server route handlers do those
writes with the service role (`createServiceClient()`), which bypasses both layers, after
authenticating the caller themselves (`lib/auth/guards.ts`). The request proxy (`proxy.ts`) does
not run on `/api`, so each route checks auth on its own.

## Column-level write grants (003)

On these tables 003 revokes table-wide `INSERT`/`UPDATE` from `anon` and `authenticated`, then
grants back only the columns below to `authenticated`. `anon` can't write any of them.

| Table | INSERT columns | UPDATE columns | Never writable by users |
|-------|----------------|----------------|-------------------------|
| `profiles` | none | `name`, `phone`, `avatar_url`, `address`, `updated_at` | `role`, `email`, `is_active`, `is_verified` |
| `vendors` | `user_id`, `business_name`, `description`, `cuisine`, `location`, `address`, `phone`, `email`, `operating_hours`, `documents` | same storefront fields + `bank_details`, `is_active`, `updated_at` | `rating`, `total_orders`. `is_active` false → true needs a verified owner (trigger) |
| `delivery_partners` | `user_id`, `vehicle_type`, `vehicle_number`, `license_number`, `documents`, `bank_details` | `is_online`, `current_location`, vehicle/licence fields, `documents`, `bank_details`, `updated_at` | `is_verified`, `earnings`, `rating`, `total_deliveries` |
| `orders` | none | `rating`, `updated_at` | everything else (items, totals, status, payment fields, rider) |
| `subscriptions` | none | `status`, `deliveries`, `address`, `delivery_time`, `delivery_days`, `auto_renew`, `updated_at` | `price`, `payment_status`, `plan_type`, `start_date`, `end_date`, `vendor_id`, `order_id`. `status` is limited by a trigger |
| `payouts` | none (INSERT/UPDATE/DELETE revoked) | none | all |
| `order_handover_codes` | none | none | all (created by the order routes) |

### Column-level read grant

`vendors` is publicly listable, but 003 grants `SELECT` to `anon` / `authenticated` only on
`id, user_id, business_name, description, cuisine, location, address, phone, email,
operating_hours, rating, total_orders, is_active, created_at, updated_at`. **`bank_details` and
`documents` can't be read with the anon key**, even by the owner. User-scoped queries must list
columns (`PUBLIC_VENDOR_COLUMNS` in `lib/supabase/public-columns.ts`) instead of `select('*')`.
Server routes read those columns with the service role.

The other tables (`meals`, `notifications`, `reviews`, `group_orders`, `categories`,
`plan_pricing`) keep Supabase's default table grants. On those, RLS alone decides access.

## RLS policies after 003

RLS is enabled on all 13 tables. Policies have no `TO` clause, so a policy that doesn't check
`auth.uid()` also applies to anonymous visitors.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | own row; admins (`is_admin()`) | none | own row | none |
| `vendors` | rows with `is_active = true`; own rows; admins (public columns only, see above) | own `user_id` and `is_active = false` | own rows | none |
| `meals` | `is_available = true`; owner vendor (all) | owner vendor | owner vendor | owner vendor |
| `delivery_partners` | own row; admins | own `user_id` | own row | none |
| `orders` | customer, owning vendor, assigned rider | none | customer, only while `status = 'delivered'` (rating) | none |
| `subscriptions` | customer; owning vendor | none | customer | none |
| `notifications` | own | none | own | none |
| `categories` | `is_active = true` | none | none | none |
| `reviews` | everyone | own `user_id` and own **delivered** order | own | none |
| `group_orders` | host or listed participant | host | host | none |
| `plan_pricing` | `is_active = true` | none | none | none |
| `payouts` | own | none | none | none |
| `order_handover_codes` | the ordering customer only | none | none | none |

`is_admin()` is a `SECURITY DEFINER` helper so policies on `profiles` can check the caller's role
without recursing. Riders' live location is served by `GET /api/delivery-partners/[id]/location`
only to the rider, admins and the customer currently being delivered to. Reviewer names come from
`GET /api/meals/[id]/reviews` (name and avatar only).

Guard triggers (003) only act on end-user requests (`is_end_user_request()`). The service role
is exempt.

| Trigger | Rule |
|---------|------|
| `guard_vendor_activation` | A vendor can't go from inactive to active unless `profiles.is_verified` is true for the owner (SQLSTATE `42501`) |
| `guard_subscription_status` | `cancelled` / `completed` subscriptions can't change. New status must be `active`, `paused` or `cancelled` |
| `sync_profile_role_to_auth` | Not a guard, but it keeps `auth.users.raw_app_meta_data.role` equal to `profiles.role`. Users can't edit `app_metadata` |

## Writes that must go through server routes

The anon key can't do these. Use the route (service role) listed.

| Write | Route |
|-------|-------|
| Create profile / pick role at sign-up | `POST /api/auth/create-profile` (admin role rejected) |
| Apply as vendor / rider (creates inactive / unverified record, sets role) | `POST /api/become-vendor`, `POST /api/become-delivery-partner` |
| Approve / reject partners, change role, suspend | `POST /api/admin/partners/verify`, `PATCH /api/admin/users/[id]/status` |
| Create order (server pricing, OTP) | `POST /api/orders`, `POST /api/group-orders/[id]/finalize` |
| Order status transitions | `/api/orders/[id]/status`, `/api/vendor/update-order-status`, `/api/vendor/orders`, `/api/delivery/update-order-status`, `/api/delivery/accept-order`, `/api/delivery-partners/orders/[id]/accept` |
| Cancel order / refund status | `POST /api/orders/[id]/cancel`, `POST /api/admin/live-ops/cancel` |
| Mark paid | `POST /api/payments/verify`, `POST /api/payments/webhook` (cash: rider via `/api/orders/[id]/status`) |
| Bind gateway order | `POST /api/payments/create-order` (`orders.payment_order_id`) |
| Late compensation | `POST /api/orders/[id]/late-compensation` (`orders.compensated_at`) |
| Create subscription | `POST /api/subscriptions` |
| Extend subscription (`end_date`) | `POST /api/subscriptions/[id]/skip-day` |
| Payout request | `POST /api/vendor/payouts/withdraw`, `POST /api/delivery/payouts/withdraw` (`request_payout`) |
| Bank details | `POST /api/vendor/bank-details`, `POST /api/delivery/bank-details` |
| Insert notifications | Server routes / DB triggers only (no INSERT policy) |
| Categories, plan pricing | SQL Editor / service role only |

Rider earnings are credited only by the `update_delivery_partner_stats` trigger on the
transition to `delivered`. No route adds earnings.

## Known gaps

Open issues after 003:

| Gap | Effect |
|-----|--------|
| `meals`, `reviews`, `notifications`, `group_orders` | No column grants: owners can update any column of their own rows (for example a vendor's meal `rating`, or a group host's `participants`). Server routes re-check what matters (prices are always read from `meals.price`) |
| `subscriptions.deliveries` | Customer-writable JSON, so per-delivery `status` / address overrides can be edited directly |
| OTP attempt limit | `lib/utils/rate-limit.ts` is in-memory, so on serverless it's per instance. Use a shared store (e.g. Redis / a table) for a hard limit |
| Two `002_` migrations | `002_fix_order_rls.sql` and `002_notifications_triggers.sql` share a prefix. Apply both before 003 |

## How to verify

Run these in the SQL Editor (it runs as `postgres`). Each block impersonates an end user inside
a transaction and rolls back. Replace `<user-uuid>` with a real `auth.users.id` (ideally a
customer). A failing statement aborts its block, so run the blocks one at a time.

**Impersonation preamble** (start each block with this):

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"<user-uuid>","role":"authenticated"}', true);
```

**1. Users can't change their role.** Expected: `permission denied for table profiles`.

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
ROLLBACK;
```

**2. Users can still edit contact fields.** Expected: `UPDATE 1`.

```sql
UPDATE profiles SET phone = '9999999999' WHERE id = '<user-uuid>';
ROLLBACK;
```

**3. Users can't mark orders paid.** Expected: `permission denied for table orders`.

```sql
UPDATE orders SET payment_status = 'paid' WHERE customer_id = '<user-uuid>';
ROLLBACK;
```

**4. Users can't insert orders.** Expected: `permission denied for table orders`.

```sql
INSERT INTO orders (customer_id, items, subtotal, delivery_fee, tax, total, payment_method, delivery_address)
VALUES ('<user-uuid>', '[]', 1, 0, 0, 1, 'cash', '{}');
ROLLBACK;
```

**5. Riders can't edit earnings or verify themselves.** Expected: permission denied.

```sql
UPDATE delivery_partners SET earnings = '{"total": 100000}', is_verified = true
WHERE user_id = '<user-uuid>';
ROLLBACK;
```

**6. Users can't call `request_payout`.** Expected: `permission denied for function request_payout`.

```sql
SELECT request_payout('<user-uuid>', 'delivery', 100, 'upi', '{}', 0.07);
ROLLBACK;
```

**7. Users can't revive a cancelled subscription.** Expected:
`Subscription is cancelled and cannot be changed`, or `UPDATE 0` if the user has none.

```sql
UPDATE subscriptions SET status = 'active'
WHERE customer_id = '<user-uuid>' AND status = 'cancelled';
ROLLBACK;
```

**Inspect the grants directly:**

```sql
-- Column grants for end users (should match the table above)
SELECT table_name, privilege_type, grantee, string_agg(column_name, ', ' ORDER BY column_name)
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE')
  AND table_name IN ('profiles','vendors','delivery_partners','orders','subscriptions','payouts')
GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;

-- Policies per table
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;
```

From the app side, you can test the same thing with the anon key in the browser console, for
example `supabase.from('profiles').update({ role: 'admin' }).eq('id', me)`. It must return a
permission error.
