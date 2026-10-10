# Testing

Rasan uses Jest for unit and component tests and Playwright for end-to-end tests. The second half of this page is a manual QA checklist for each role.

## Running tests

| Command | What it does |
|---|---|
| `npm test` | Run all Jest suites once |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with a coverage report (the config sets a global 70% threshold) |
| `npm run test:e2e` | Playwright, headless |
| `npm run test:e2e:ui` / `npm run test:e2e:headed` | Playwright with the UI runner / a visible browser |
| `npm run test:all` | Jest, then Playwright |
| `npx jest __tests__/lib/pricing` | Run a single folder or file |

Playwright starts `npm run dev` itself (`webServer` in `playwright.config.ts`) and targets `http://localhost:3000`, unless `PLAYWRIGHT_TEST_BASE_URL` is set. The e2e tests need a working `.env.local` (see [Quick Start](../getting-started/QUICK_START.md)). Install the browsers once with `npx playwright install`.

## Where tests live

| Location | Runner | Notes |
|---|---|---|
| `__tests__/lib/**` | Jest | Pure logic: auth, pricing, payments, transitions, utils |
| `__tests__/components/**` | Jest + Testing Library (jsdom) | Component rendering |
| `__tests__/utils/` | none | Shared helpers (`test-utils.tsx`). Jest ignores this folder, so test files placed here do not run |
| `e2e/*.spec.ts` | Playwright | Browser flows |

Config files are `jest.config.js` (uses `next/jest` and the `@/` alias), `jest.setup.js` and `playwright.config.ts`.

## What is covered

Jest currently runs 10 suites with 109 tests.

| Suite | Covers |
|---|---|
| `lib/auth/roles.test.ts` | `roleFromAppMetadata` (ignores `user_metadata`), `isUserRole`, `isProtectedPath`, `canAccessPath` |
| `lib/utils/safe-redirect.test.ts` | Open-redirect protection for `redirectTo` |
| `lib/utils/order-transitions.test.ts` | Status normalisation and which actor may move an order to which status |
| `lib/pricing/pricing.test.ts` | Item pricing (one-time, weekly 20% off, monthly 30% off), cart totals, subscription pricing |
| `lib/payments/order-payment.test.ts` | Razorpay signature checks and delivery OTP helpers |
| `lib/dev-tools.test.ts` | `devToolsEnabled` (never in production) and `setupSecretGuard` |
| `lib/utils/order-calculations.pbt.test.ts` | Property-based checks of order total math |
| `lib/utils/format.test.ts` | Currency, phone, distance, order number and rating formatting |
| `components/ui/button.test.tsx`, `components/meal-card.test.tsx` | Basic component rendering |

| E2E spec | Covers |
|---|---|
| `e2e/auth.spec.ts` | Login, register and forgot-password pages render; empty login form shows validation; navigation between them |
| `e2e/homepage.spec.ts` | Homepage, navigation, hero, footer, links to meals/vendors, mobile viewport |
| `e2e/meal-browsing.spec.ts` | Meals list, search, filters, meal detail navigation |

Not yet automated: API route handlers, checkout and payment, rider and vendor flows, RLS. Cover these with the manual checklist below.

### Writing tests

- Put pure logic in `lib/` and test it there first. Pricing, transitions and guards are the highest-value targets.
- Name files `*.test.ts(x)` under `__tests__/`, mirroring the source path.
- E2E specs go in `e2e/` as `*.spec.ts`.

## Manual QA checklist

Run this on a local or preview environment with migration 003 applied. To create test accounts, register normally, or use the dev tools (`/admin/setup`, see [Quick Start](../getting-started/QUICK_START.md#dev-tools)). Use Razorpay test keys to exercise online payment. Without them, only Cash on Delivery is available.

### Auth and access

- [ ] Register as a customer. You land on `/dashboard`.
- [ ] Log out, then open `/orders`. You are redirected to `/login?redirectTo=/orders`, and logging in returns you to `/orders`.
- [ ] A `redirectTo` pointing at another site (e.g. `//evil.com`) is ignored.
- [ ] Each role is kept to its own pages. For example, a customer opening `/vendor-dashboard` or `/admin-dashboard` is redirected.
- [ ] Forgot/reset password works end to end.
- [ ] Editing `user_metadata.role` in the browser does not change access.

### Customer

- [ ] Browse `/meals` and `/vendors`. Search, filters and meal detail pages work.
- [ ] Add items to the cart. The cart rejects a mix of vendors.
- [ ] At checkout, totals show a ₹2 platform fee and ₹0 delivery fee. Weekly plans are 20% off (price × delivery days) and monthly plans 30% off (× days × 4).
- [ ] Place a **Cash on Delivery** order. It is created as `confirmed`.
- [ ] Place an **online** order. It stays `pending` until Razorpay payment is verified, then becomes paid.
- [ ] Tamper with the price or total in the request to `POST /api/orders`. The server ignores it and prices the order from meal prices.
- [ ] The order tracker shows the 4-digit **delivery OTP** to the customer only.
- [ ] Cancel from the order page. The refund is 100% before `preparing`, 50% while `preparing`, 0% after, and nothing if the order was never paid.
- [ ] Reviews are only possible for your own delivered orders.
- [ ] Subscriptions: create, pause, resume, skip/unskip a day, swap a meal, change address, cancel.
- [ ] Group order: create, share the link, others join and add items, host finalizes.
- [ ] Notifications appear, and mark-read / mark-all-read work.

### Vendor

- [ ] Apply via `/become-vendor`. The vendor is created **inactive**. Its dashboard shows a pending state, and no vendor record is auto-created anywhere else.
- [ ] After admin approval, the vendor is active and its meals are visible.
- [ ] Menu management: create, edit and toggle availability, only for your own meals. Image upload works.
- [ ] Vendor orders: move orders `pending → confirmed → preparing → ready` only. A vendor may cancel before `preparing`. Other transitions and other vendors' orders are rejected.
- [ ] The vendor never sees the delivery OTP.
- [ ] Payouts: a withdrawal request is recorded as `pending`, and requests above the available balance are rejected. No money moves automatically.
- [ ] Capacity, bank details, subscriber broadcast and analytics pages load and save for your own vendor only.

### Delivery partner

- [ ] Apply via `/become-delivery-partner`. The rider is **unverified** until an admin approves them.
- [ ] Toggle online, and location updates are sent.
- [ ] `ready` orders appear in available orders. Claiming one sets it to `picked_up`, and a second rider cannot claim the same order.
- [ ] Move the order to `out_for_delivery`. Riders can only update orders assigned to them.
- [ ] Mark delivered: the customer's 4-digit OTP is required. A wrong OTP is rejected, and you are locked out after 5 attempts in 15 minutes.
- [ ] The rider never receives the OTP in any API response or UI.
- [ ] After delivery, earnings increase by the order's delivery fee (minimum ₹35).
- [ ] Payout requests are `pending` and limited to the available balance.

### Admin

- [ ] Admin pages load: dashboard, user/vendor/delivery management, live ops, settlements, refunds ledger, broadcasts, support.
- [ ] Pending vendor and rider applications show up. Approving one activates the vendor or verifies the rider, and rejecting keeps it inactive.
- [ ] Suspending a user blocks their API access (403 "Account is suspended").
- [ ] Live ops: cancel and reassign orders.
- [ ] Non-admins get 403 from every `/api/admin/*` route.
- [ ] With `ENABLE_DEV_TOOLS` unset, `/admin/setup`, `/admin/seed-data`, `/dev/order-simulator` and their APIs return 404.

### General

- [ ] Layout works at mobile (375px), tablet and desktop widths.
- [ ] Keyboard navigation and visible focus work on forms, dialogs and cart.
- [ ] Network and form errors show friendly messages, and payment failure leaves the order unpaid.
- [ ] Realtime order status updates appear without a reload.

For security-specific checks and the background on these rules, see [Database security](../database/SECURITY.md) and the [October 2026 security audit](../audit/2026-10-security-cleanup/PLAN.md).
