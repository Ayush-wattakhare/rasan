# Deployment (Vercel + Supabase)

Rasan deploys as a Next.js 16 app on Vercel, backed by a Supabase project (Postgres + PostGIS,
Auth, Storage, Realtime). Vercel settings come from `vercel.json` (`npm install`, `npm run build`,
framework `nextjs`, global security headers).

Related: [Database setup](../database/SETUP.md) · [Launch checklist](LAUNCH_CHECKLIST.md) ·
[Security audit plan](../audit/2026-10-security-cleanup/PLAN.md)

## 1. Before you deploy this code

The October 2026 security cleanup changed how the app talks to the database. Full notes:
[PLAN.md §5 — Deploy notes](../audit/2026-10-security-cleanup/PLAN.md#5-deploy-notes-for-whoever-owns-the-database).
In short:

1. Apply `003_security_hardening.sql` **before** deploying (see §3). The code depends on its
   column grants, `payouts` table, `request_payout()` and new `orders`/`subscriptions` columns.
2. Never set `ENABLE_DEV_TOOLS` in production.
3. Delete or reset any old demo accounts that exist in production — their passwords were once
   committed to the repo (PLAN.md lists the addresses).
4. Confirm the `update_delivery_partner_stats` trigger (migration 001) exists — it is now the
   only place rider earnings are credited.
5. Configure all three Razorpay variables, or checkout offers Cash on Delivery only.
6. Review vendors that are active without admin approval and riders that are verified with
   seeded earnings; they may come from removed routes.

## 2. Environment variables

Set these in Vercel → Project → Settings → Environment Variables. There is no `.env.example`.

| Variable | Production | Preview | Local | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | required | required | required | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required | required | required | |
| `SUPABASE_SERVICE_ROLE_KEY` | required | required | required | Server only. Never expose. |
| `RAZORPAY_KEY_ID` | required for online pay | test key | test key | Server. Falls back to `NEXT_PUBLIC_RAZORPAY_KEY_ID`. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | required for online pay | test key | test key | Used by the browser checkout. |
| `RAZORPAY_KEY_SECRET` | required for online pay | test key | test key | Server only. |
| `RAZORPAY_WEBHOOK_SECRET` | required | optional | optional | Webhook returns 401 without it. |
| `STRIPE_SECRET_KEY` | optional | optional | optional | Enables the Stripe provider. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | optional | optional | |
| `NEXT_PUBLIC_APP_URL` | site URL | preview URL | `http://localhost:3000` | |
| `NEXT_PUBLIC_API_URL` | optional | optional | optional | |
| `ENABLE_DEV_TOOLS` | **never** | optional | optional | `true` enables `/admin/setup`, seed data, order simulator. |
| `ADMIN_SETUP_SECRET` | not set | if dev tools on | if dev tools on | Required by `admin/setup` and `admin/create-demo-users`. |

Notes:
- `lib/dev-tools.ts` also refuses dev tools when `VERCEL_ENV=production` (or `NODE_ENV=production`
  outside Vercel), but do not rely on that — leave `ENABLE_DEV_TOOLS` unset in production.
- Without Razorpay keys, checkout offers Cash on Delivery only. Orders are never marked paid
  without a verified payment.
- Use live keys only in Production; use Razorpay/Stripe test keys in Preview and local.

## 3. Database migrations

Apply in order (Supabase SQL Editor, or `supabase db push` with the CLI linked to the project):

| Order | File | Purpose |
|---|---|---|
| 1 | `001_initial_schema.sql` | 11 tables, RLS, triggers (incl. `update_delivery_partner_stats`) |
| 2 | `002_fix_order_rls.sql` | Order RLS fixes |
| 2 | `002_notifications_triggers.sql` | Notification triggers |
| 3 | `003_security_hardening.sql` | Column grants, vendor/review rules, role → `app_metadata` sync, `payouts` + `request_payout()`, new columns |

`003` has not been applied to any environment yet. Apply it to each database **before** the
code from this branch is deployed against it. Enable PostGIS first if it is not on
(`CREATE EXTENSION IF NOT EXISTS postgis;`). Details: [Database setup](../database/SETUP.md),
[Schema](../database/SCHEMA.md), [Security model](../database/SECURITY.md).

## 4. Razorpay webhook

1. Razorpay Dashboard → Settings → Webhooks → Add.
2. URL: `https://<your-domain>/api/payments/webhook`
3. Event: `payment.captured` (the only event the handler acts on; others are acknowledged).
4. Set a secret and put the same value in `RAZORPAY_WEBHOOK_SECRET`.

The handler verifies `x-razorpay-signature` (HMAC-SHA256), matches the order by
`payment_order_id`, checks the captured amount equals the order total, and only updates orders
still awaiting payment, so replays are safe. Stripe has no webhook route; Stripe payments are
confirmed through `POST /api/payments/verify`.

## 5. Storage buckets

| Bucket | Used by | Setup |
|---|---|---|
| `meal-images` | `POST /api/upload/image` (folders `meals`, `vendors`, `avatars`, `reviews`) | Created automatically on first upload (public, images only, 5 MB). |
| `profiles` | `POST /api/profile/avatar`, `lib/services/profile-service.ts` (path `avatars/…`) | **Create manually** as a public bucket, with a storage policy that lets authenticated users upload/delete under `avatars/`. Uploads use the user's session, not the service role. |

## 6. Realtime

Enable replication for the tables the client subscribes to: `orders`, `notifications`,
`delivery_partners` (live rider location), `profiles` (admin partner-application listener).

## 7. Deploy

1. Push to the branch Vercel builds (by default Production = `main`, Preview = other branches).
2. Vercel runs `npm install` and `npm run build`. Run `npm run lint`, `npm run type-check`
   and `npm test` locally or in CI first.
3. Add the custom domain under Project → Domains if needed, then set `NEXT_PUBLIC_APP_URL`.

## 8. Post-deploy checks

- [ ] Home, `/meals`, a meal page and `/vendors` load.
- [ ] Register, log in, log out; each role lands on its own home and cannot open other roles' pages.
- [ ] Place a Cash on Delivery order; it starts `confirmed`.
- [ ] Place an online order with a small live payment; it moves from `pending` to paid
      (check Razorpay Dashboard → Webhooks shows a 2xx delivery).
- [ ] Kitchen moves the order to `ready`, rider claims it and delivers with the customer's OTP.
- [ ] Image upload (meal) and avatar upload work.
- [ ] `/admin/setup`, `/admin/seed-data` and `/dev/order-simulator` are unavailable.
- [ ] No errors in Vercel function logs or Supabase logs.

## 9. Rollback

- **App:** Vercel → Deployments → pick the last good deployment → *Promote to Production*.
- **Database:** migrations are not auto-reversible. Code from before this branch wrote some
  columns that 003 no longer grants to users, so rolling the app back past this branch after
  applying 003 may break those writes. Prefer fixing forward; otherwise restore from a
  Supabase backup (daily backups / point-in-time recovery depend on your plan).
- **Payments:** if the webhook is failing, Razorpay retries deliveries; fix the secret/URL and
  resend from the Razorpay Dashboard.
