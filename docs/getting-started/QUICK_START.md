# Quick Start

Get Rasan running locally. For the full documentation index see [docs/README.md](../README.md).

> **Next.js 16:** this project runs Next.js 16.2, which has breaking changes from earlier versions (see `AGENTS.md`). Check `node_modules/next/dist/docs/` before relying on older Next.js knowledge. For example, request middleware lives in `proxy.ts`, not `middleware.ts`.

## Prerequisites

- Node.js 20+ and npm
- A Supabase project (Postgres with PostGIS)
- Git
- Optional: Razorpay and/or Stripe test-mode keys

## 1. Install

```bash
git clone <repo-url> rasan
cd rasan
npm install
```

## 2. Environment variables

The repo has no `.env.example`, so create `.env.local` in the project root yourself:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server only, never expose

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_API_URL=http://localhost:3000/api   # optional

# Payments (optional locally)
RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Dev tools (local/preview only, never production)
# ENABLE_DEV_TOOLS=true
# ADMIN_SETUP_SECRET=some-long-random-string
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | From Supabase: Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side only |
| `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | No | Without them, checkout offers Cash on Delivery only |
| `RAZORPAY_WEBHOOK_SECRET` | No | Verifies `/api/payments/webhook` |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Secondary payment provider |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for redirects and links |
| `NEXT_PUBLIC_API_URL` | No | Optional override |
| `ENABLE_DEV_TOOLS`, `ADMIN_SETUP_SECRET` | No | See [Dev tools](#dev-tools) |

Orders are never marked paid without a verified payment, whether or not payment keys are set.

## 3. Database

Apply the migrations in `supabase/migrations/` in order (001, 002, 003) and enable PostGIS. Step-by-step instructions are in [Database setup](../database/SETUP.md).

`003_security_hardening.sql` is required. The current code depends on its column grants, the `payouts` table and `request_payout()`.

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000, then register an account at `/register`.

## Project structure

```
rasan/
├── app/
│   ├── (auth)/          login, register, forgot/reset password
│   ├── (customer)/      dashboard, orders, subscriptions, profile
│   ├── (vendor)/        vendor-dashboard, menu-management, vendor-orders, analytics, payouts, ...
│   ├── (delivery)/      delivery-dashboard, available-orders, active-deliveries, earnings, ...
│   ├── (admin)/         admin-dashboard, user/vendor/delivery management, live-ops, settlements, ...
│   ├── admin/           dev tools hub, setup, seed-data (dev tools only)
│   ├── dev/             order-simulator (dev tools only)
│   ├── api/             route handlers (each authenticates itself)
│   └── meals, vendors, cart, checkout, group-order, become-vendor, ...  public pages
├── components/          feature components + ui/ primitives (Radix-based)
├── lib/
│   ├── auth/            roles.ts (route map), guards.ts (API guards)
│   ├── supabase/        browser/server clients, middleware session logic
│   ├── pricing/         server-side order and subscription pricing
│   ├── orders/          status transition enforcement
│   ├── payments/ payouts/ delivery/   payment verification, payout requests, rider feed
│   ├── services/ hooks/ contexts/     data services, React hooks, cart context
│   └── utils/           constants, formatting, OTP, rate limiting, validation, ...
├── types/               shared types + generated database.types.ts
├── supabase/            migrations, seed_data.sql, config.toml
├── __tests__/           Jest unit/component tests
├── e2e/                 Playwright specs
└── proxy.ts             Next 16 request proxy (session refresh + page role checks)
```

`proxy.ts` does not run on `/api` routes. Every API route checks auth itself with `lib/auth/guards.ts`.

## Common commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier write / check |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` / `npm run test:watch` / `npm run test:coverage` | Jest |
| `npm run test:e2e` (`:ui`, `:headed`) | Playwright |
| `npm run test:all` | Jest then Playwright |
| `supabase db push` | Apply migrations to a linked project |
| `supabase gen types typescript --linked > types/database.types.ts` | Regenerate DB types |

See [Testing](../development/TESTING.md) and [Contributing](../development/CONTRIBUTING.md).

## Roles

| Role | Home | How to get it |
|---|---|---|
| `customer` | `/dashboard` | Default on registration |
| `vendor` | `/vendor-dashboard` | Apply via `/become-vendor` (or `/register?role=vendor`). The vendor starts inactive until an admin approves it |
| `delivery` | `/delivery-dashboard` | Apply via `/become-delivery-partner` (or `/register?role=delivery`). The rider starts unverified until an admin approves them |
| `admin` | `/admin-dashboard` | Created with the dev tools setup page, or by setting `profiles.role` in the database |

The role is read from Supabase auth `app_metadata.role`, which a DB trigger keeps in sync with `profiles.role` and which falls back to the `profiles` table. `user_metadata` is never trusted. The page-to-role map is in `lib/auth/roles.ts`. Route-group layouts re-check the role on the server.

## Dev tools

Dev and demo tooling only exists when `ENABLE_DEV_TOOLS=true` and the deployment is not production (`VERCEL_ENV=production` always disables it). Otherwise these routes return 404.

| Route | Access |
|---|---|
| `/admin` | Tools hub |
| `/admin/setup` | Needs `ADMIN_SETUP_SECRET`. Creates the first admin and can create demo users |
| `/admin/seed-data` | Admin only. Seeds sample data |
| `/dev/order-simulator` | Admin only. Steps an order through its lifecycle |
| `POST /api/admin/setup`, `POST /api/admin/create-demo-users` | `x-admin-secret: $ADMIN_SETUP_SECRET` header |
| `/api/admin/seed-data`, `/api/dev/simulate-lifecycle` | Admin session |

To bootstrap locally:

1. Set `ENABLE_DEV_TOOLS=true` and `ADMIN_SETUP_SECRET`.
2. Restart the dev server.
3. Open `/admin/setup` and create your admin.

Never set these variables in production.

## Troubleshooting

| Problem | Fix |
|---|---|
| Supabase client errors | Check `.env.local` values, then restart `npm run dev` |
| `permission denied for column ...` | Expected when a client writes a protected column (migration 003). Do the write through the proper API route |
| PostGIS functions missing | `CREATE EXTENSION IF NOT EXISTS postgis;` |
| Stale build | `rm -rf .next && npm run build` |
| Port 3000 busy | `PORT=3001 npm run dev` |
| Checkout shows only Cash on Delivery | Razorpay keys are not set |
