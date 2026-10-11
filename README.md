# 🍲 Rasan — Hyperlocal Food Delivery Platform

Rasan connects customers with local home chefs and kitchens for home-cooked meals and tiffin subscriptions. It is built for India and modelled on Swiggy and Zomato.

**Stack:** Next.js 16 · React 19 · TypeScript · Supabase (Postgres + PostGIS) · Tailwind CSS v4 · Razorpay / Stripe

---

## Features

### 🛍️ Customer
| Feature | Description |
|---|---|
| Browse & search | Filter meals by type, dietary preference and category |
| Cart & checkout | Single-kitchen cart; prices are recomputed on the server; pay online (Razorpay) or Cash on Delivery |
| Live order tracking | Status timeline and a doorstep OTP handover |
| Tiffin subscriptions | Weekly / monthly plans with skip, pause, swap and address changes |
| Group orders | Shared cart sessions with invite links |
| Reviews | Rate delivered orders |

### 👨‍🍳 Vendor / Home Chef
| Feature | Description |
|---|---|
| Onboarding | Apply at `/become-vendor`; kitchens go live after admin approval |
| Menu management | Meals with nutrition info, allergens and stock |
| Order queue | Real-time feed with an audio alert for new orders |
| Subscriber broadcasts | Menus and announcements for active subscribers |
| Payouts | Earnings overview and payout requests (7% platform commission) |

### 🛵 Delivery Partner
| Feature | Description |
|---|---|
| Onboarding | Apply at `/become-delivery-partner`; verified by an admin |
| Dispatch | Claim ready orders, bundled by kitchen and area |
| Handover | Customer's 4-digit OTP required to mark an order delivered |
| Earnings & payouts | Delivery earnings and payout requests |

### 🛡️ Admin
| Feature | Description |
|---|---|
| Mission control | Platform analytics |
| Users & partners | Manage users; approve, reject or suspend vendors and riders |
| Live ops | Reassign or cancel orders, broadcasts, support tickets, refunds, settlements |

---

## Getting started

```bash
git clone https://github.com/Ayush-wattakhare/rasan.git
cd rasan
npm install
# create .env.local (see the Quick Start for the variables)
npm run dev
```

Full setup, including the database and environment variables, is in **[docs/getting-started/QUICK_START.md](docs/getting-started/QUICK_START.md)**.

> ⚠️ **Database migration required.** `supabase/migrations/003_security_hardening.sql` must be applied before deploying the current code. See [docs/operations/DEPLOYMENT.md](docs/operations/DEPLOYMENT.md).

---

## Documentation

Everything lives in [`docs/`](docs/README.md):

| Area | Docs |
|---|---|
| Getting started | [Quick Start](docs/getting-started/QUICK_START.md) |
| Development | [Testing](docs/development/TESTING.md) · [Contributing](docs/development/CONTRIBUTING.md) |
| Architecture | [API reference](docs/architecture/API.md) · [Design system](docs/architecture/DESIGN_SYSTEM.md) |
| Database | [Setup](docs/database/SETUP.md) · [Schema](docs/database/SCHEMA.md) · [Security & RLS](docs/database/SECURITY.md) |
| Operations | [Deployment](docs/operations/DEPLOYMENT.md) · [Launch checklist](docs/operations/LAUNCH_CHECKLIST.md) · [Performance](docs/operations/PERFORMANCE.md) |
| Audits | [October 2026 security audit](docs/audit/2026-10-security-cleanup/PLAN.md) |

---

## Project structure

```
rasan/
├── app/
│   ├── (auth)/ (customer)/ (vendor)/ (delivery)/ (admin)/   # role-scoped pages
│   ├── api/                 # route handlers (each authenticates itself)
│   ├── meals/ vendors/ cart/ checkout/ group-order/         # shared pages
│   ├── admin/ dev/          # local dev tools (ENABLE_DEV_TOOLS only)
│   └── layout.tsx
├── components/              # feature-scoped React components
├── lib/
│   ├── auth/                # role map, API guards, partner applications
│   ├── orders/              # order status transitions
│   ├── payments/ payouts/   # payment verification, payout requests
│   ├── pricing/             # cart / order / subscription pricing (shared client + server)
│   ├── supabase/            # browser, server and middleware clients
│   ├── services/ hooks/ contexts/ utils/
├── proxy.ts                 # Next 16 request middleware (session + role routing)
├── types/                   # app types + generated database types
├── supabase/migrations/     # SQL migrations (001 → 003)
├── __tests__/               # Jest unit tests
└── e2e/                     # Playwright tests
```

---

## Scripts

```bash
npm run dev            # development server
npm run build          # production build
npm run start          # serve the production build
npm run lint           # ESLint
npm run type-check     # TypeScript, no emit
npm run format         # Prettier
npm run test           # Jest unit tests
npm run test:e2e       # Playwright end-to-end tests
```

---

## Security at a glance

- Roles come from the `profiles` table and service-controlled `app_metadata`, never from user-editable metadata.
- Row Level Security plus column-level grants: users cannot write roles, order status, payment status, totals, earnings or verification flags.
- Prices, totals and payment status are decided on the server. Payments are bound to the gateway order created for that order.
- Delivery OTPs are random, rate-limited and never sent to riders or kitchens.

Details: [docs/database/SECURITY.md](docs/database/SECURITY.md) and the [security audit](docs/audit/2026-10-security-cleanup/PLAN.md).

---

## License

Private and proprietary. All rights reserved © 2026 Rasan.

Built by [Ayush Wattakhare](https://github.com/Ayush-wattakhare).
