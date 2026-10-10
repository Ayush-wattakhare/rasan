# Database setup (Supabase)

How to stand up a Supabase project for Rasan: create the project, enable PostGIS, apply the
migrations, configure storage and auth, and regenerate TypeScript types.

Related: [Schema](SCHEMA.md) · [Security model](SECURITY.md) ·
[Quick start](../getting-started/QUICK_START.md) · [Deployment](../operations/DEPLOYMENT.md)

## 1. Create the project

1. In the [Supabase dashboard](https://supabase.com/dashboard), create a new project. Save the
   database password.
2. Go to **Project Settings → API** and copy the Project URL, the `anon` key and the
   `service_role` key.
3. Add them to `.env.local` in the repo root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server only, never expose
   ```

   The service role key bypasses RLS. Only server code (`createServiceClient()` in
   `lib/supabase/server.ts`) may use it.

## 2. Enable PostGIS

Vendor and rider locations are `GEOGRAPHY(POINT, 4326)` columns, so PostGIS must be on before
migration 001 runs.

- Dashboard: **Database → Extensions → postgis → Enable**, or
- SQL Editor: `CREATE EXTENSION IF NOT EXISTS postgis;`

Migration 001 also runs `CREATE EXTENSION IF NOT EXISTS` for `postgis` and `uuid-ossp`.

## 3. Apply the migrations, in order

| # | File | What it does |
|---|------|--------------|
| 1 | `supabase/migrations/001_initial_schema.sql` | Enums, 11 tables, indexes, functions, triggers, RLS policies |
| 2 | `supabase/migrations/002_fix_order_rls.sql` | Customer UPDATE policy on `orders` (dropped again by 003) |
| 3 | `supabase/migrations/002_notifications_triggers.sql` | Notification triggers on order insert / status change |
| 4 | `supabase/migrations/003_security_hardening.sql` | Column-level grants, role → `app_metadata` sync, vendor activation guard, `payouts` table, `request_payout()`, new columns |

**003 is required by the current code** and has not been applied to any environment yet. Apply
it before deploying this branch (see
[PLAN.md §5](../audit/2026-10-security-cleanup/PLAN.md#5-deploy-notes-for-whoever-owns-the-database)).
Without it, routes that read or write `orders.payment_order_id`, `orders.compensated_at`,
`subscriptions.order_id` or call `request_payout` will fail.

**Option A: SQL Editor.** Open each file, paste the full contents into a new query and run it.
Run them one at a time in the order above.

**Option B: Supabase CLI.**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

> The two `002_*` files share a version prefix. If `db push` refuses to apply both, run the
> second one from the SQL Editor (or rename it locally to a unique prefix before pushing).

### Verify

```sql
SELECT PostGIS_Version();

-- 12 tables expected after 003 (11 from 001 + payouts)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- RLS must be on for every table
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Functions from 001 and 003
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name;

-- Triggers on orders (vendor stats, rider earnings, notifications, order number)
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.orders'::regclass AND NOT tgisinternal;
```

Make sure `update_delivery_partner_stats_trigger` exists: it is the only thing that credits
rider earnings. To check that 003's grants are working, see [SECURITY.md](SECURITY.md#how-to-verify).

## 4. Seed data (optional)

`supabase/seed_data.sql` inserts categories, `plan_pricing` rows, and sample vendors, meals and
delivery partners.

1. Sign up a few users through the app (they get `profiles` rows).
2. Get their IDs: `SELECT id, email FROM auth.users;`
3. Replace every `'user-uuid-*'` placeholder in `seed_data.sql` with a real ID.
4. Run it in the SQL Editor. It runs as the `postgres` role, so it is not limited by RLS or
   column grants.

Categories and plan pricing can be inserted on their own without any user IDs.

When dev tools are on, an admin can also seed sample data from `/admin/seed-data`
(`POST /api/admin/seed-data`; see [API: dev tools](../architecture/API.md#dev-tools)).

## 5. Storage buckets

| Bucket | Used by | Setup |
|--------|---------|-------|
| `meal-images` | `POST /api/upload/image` (folders `meals`, `vendors`, `avatars`, `reviews`) | Created automatically as a public bucket on first upload (service role) |
| `profiles` | `POST /api/profile/avatar` (path `avatars/<user>-<ts>.<ext>`), `lib/services/profile-service.ts` | **Create manually.** Public read. The avatar route uploads with the user's session, so add a storage policy that lets `authenticated` users insert (and delete) objects in this bucket |

Both routes accept image files up to 5 MB, and the file extension comes from the MIME type.

## 6. Auth settings

| Setting | Where | Recommendation |
|---------|-------|----------------|
| Email confirmations | **Authentication → Providers → Email → Confirm email** | Turn on for production. Partner sign-ups (`/become-vendor`, `/become-delivery-partner` when logged out) use the normal `signUp` flow, so this setting decides whether a new account must confirm its email first. `supabase/config.toml` sets `enable_confirmations = false` for local development only |
| Site URL / redirect URLs | **Authentication → URL Configuration** | Set Site URL to `NEXT_PUBLIC_APP_URL`. Allow `<app-url>/api/auth/callback`, which exchanges the PKCE code (password reset uses `?next=/reset-password`) |

Roles: `profiles.role` is the source of truth. Migration 003's trigger copies it into
`auth.users.raw_app_meta_data.role`, which the request proxy reads. `user_metadata` is never
trusted. To make someone an admin, update `profiles.role` from the SQL Editor (or use the
dev-tools setup page locally). The new role reaches the user's JWT when their session token
refreshes or they sign in again. Route-group layouts and API guards read `profiles` directly, so
they see the change straight away.

## 7. Generate TypeScript types

`types/database.types.ts` holds the generated schema types. `lib/supabase/types.ts` re-exports
helpers from it. Regenerate them after any schema change:

```bash
npx supabase gen types typescript --linked > types/database.types.ts
# or: npx supabase gen types typescript --project-id <ref> > types/database.types.ts
```

Then run `npm run type-check`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `type "geography" does not exist` | Enable PostGIS (step 2) and re-run 001 |
| `column ... payment_order_id does not exist` / `function request_payout does not exist` | Migration 003 has not been applied |
| `permission denied for table ...` from the browser | Expected for columns users may not write after 003. Do the write through a server route ([SECURITY.md](SECURITY.md)) |
| Avatar upload fails | Create the `profiles` bucket and its storage policies (step 5) |
| App can't connect | Check `.env.local`, then restart `npm run dev` |
