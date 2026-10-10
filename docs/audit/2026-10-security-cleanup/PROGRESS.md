# Security Audit & Cleanup — Progress

Plan: [PLAN.md](./PLAN.md) · Branch: `fix/security-audit-cleanup`

Status legend: ⬜ todo · 🔄 in progress · ✅ done · ⏭️ skipped (reason given)

## Commits

| # | Commit | Status | Notes |
|---|---|---|---|
| 0 | Plan + progress docs | ✅ | `7001d46` |
| 1 | Migration 003 (written, not applied) | ✅ | `8ca9922`. DB types updated. |
| 2 | Shared auth guards | ✅ | `0fac0db` |
| 3 | Auth / role / callback fixes | ✅ | `f8d0e9b`. Middleware + root layout use app_metadata → profiles. create-profile bound to session / fresh signup. Callback redirect sanitised. become-* use normal sign-up, vendors start inactive, admins can't self-demote. |
| 4 | Remove debug routes, lock dev tools | ✅ | `d427949`. Deleted 9 API routes, 7 debug pages, `scratch/`, dead components. `vendor/check-status` kept as read-only. Seeding / demo users / simulator / admin setup now need `ENABLE_DEV_TOOLS` (+ admin or `ADMIN_SETUP_SECRET`). Login form no longer auto-creates demo users. |
| 5 | Admin route checks | ✅ | `6ef6621`. All 14 admin routes now guarded (12 `requireAdmin` / profiles role, 2 setup-secret). Broadcast target and role values validated; admins can't drop their own admin role. Admin user actions go through the API. |
| 6 | Orders & payments | ✅ | `955435b`. New `POST /api/orders` prices orders from DB meals (shared `lib/pricing`); checkout uses it and never marks orders paid. Shared `transitionOrder()` (ownership + allowed transitions + payment + OTP + conditional update). Payments bound to the gateway order id stored on the order; timing-safe signatures; idempotent webhook with amount check. Cancel refunds only paid orders. Late compensation uses real delivery time, once per order. Group finalize validates quantities and runs once. |
| 7 | Delivery | ✅ | `a4ede72`. Rider status route uses `transitionOrder()` (assignment + OTP, 5 attempts / 15 min). Shared `claimOrderForPartner()` for both accept routes (verified rider, ready + unassigned, paid or COD, race-safe). Rider feed (API + dashboard page) shows only own active + ready orders, no OTPs, customer contact only when assigned. Payouts via `request_payout()` with balance check, recorded as pending. Live location limited to rider / admin / customer being delivered to. Pages no longer auto-create verified riders. |
| 8 | Vendor / catalog / subscriptions / uploads | ✅ | `64e9c5f`, grant compatibility in `74913b1`. Vendor status routes use `transitionOrder()`; vendor order feed strips OTP. Subscriptions priced server-side (from the checkout order, or plan table), dates bounded, one per order (`subscriptions.order_id` added to migration 003); PUT allow-listed. Broadcast fallback removed. Reviews only for own delivered orders, rating goes to the order's kitchen. Meal PATCH allow-listed, no self-set ratings, public listing shows available meals only. Community feed: owner-only chef posts, subscriber/owner-only reads, no demo vendor IDs. Uploads: JPEG/PNG/WebP(/GIF), type-derived extension, fixed folders, no overwrite. Vendor pages no longer auto-create vendors; payouts page uses the 7% constant and subtracts requested payouts. Subscriptions page no longer extends expired plans. |
| 9 | Tests | ✅ | `04f8619`. 6 new suites, 65 new tests: role map / app_metadata-only roles, safe redirects, order transitions, order + subscription pricing, payment signatures + OTP (incl. no fallback, PIN stripping), dev-tools + setup-secret guards. Total 110 tests pass. |
| 10 | Docs reorganisation | ✅ | `7d07145` (read-side gap fixes found while documenting: `2003a7e`). Root now holds only README / AGENTS / CLAUDE. 34 old docs removed (17 stale progress logs, the rest merged). New `docs/` tree: getting-started, development, architecture, database, operations, audit. README rewritten (7% commission, real env vars, migration warning). All relative links checked. |
| 11 | Final verification | ✅ | tsc, eslint, jest and a clean `next build` all pass (see below). |

## Findings tracker

| Group | IDs | Status |
|---|---|---|
| A. Database | A1–A7 | ✅ (migration written, not applied) |
| B. Auth & roles | B1–B5 | ✅ |
| C. Dev / debug | C1–C7 | ✅ |
| D. Admin | D1–D4 | ✅ |
| E. Orders & payments | E1–E9 | ✅ |
| F. Delivery | F1–F6 | ✅ |
| G. Vendor etc. | G1–G11 | ✅ |
| H. Consistency & docs | H1–H2 ✅ |
| I. Pages / browser bypass | I1–I6 ✅ |

## Verification log

| When | Step | tsc | eslint errors | jest | build |
|---|---|---|---|---|---|
| 2026-10-10 | Baseline (`main` @ 3518b27) | ✅ 0 | 0 (766 warnings) | 45/45 | ✅ |
| 2026-10-10 | Final (branch head) | ✅ 0 | 0 (730 warnings) | 110/110 | ✅ |

## Log

- **2026-10-10** — Branch created. Dependencies installed. Baseline recorded. Full audit of
  87 API routes + RLS policies done (3 parallel read-only passes). Plan written.
- **2026-10-10** — All commits done. A read-side review during the docs pass found more gaps
  (read-access gaps, a missing RPC, silently failing notification inserts and unchecked live-ops actions). These were
  fixed and folded into migration 003. Final verification green.

## Functional verification (2026-10-10)

Checks that the hardening doesn't break the product:

| Check | Result |
|---|---|
| Migrations 001 → 003 on Postgres 16 (Supabase roles/auth emulated, PostGIS stubbed), seeded like an existing DB, 003 applied twice | ✅ applies cleanly, re-runnable |
| 71 permission/behaviour checks as anon, customer, vendor, rider, admin, service role (`supabase/tests/run-migration-tests.sh`) | ✅ 71/71 |
| Production build smoke test, logged out: public pages, protected-page redirects, API 401s, dev tools 404, removed routes 404, open-redirect blocked, unsigned webhook rejected | ✅ |
| Three read-only regression reviews (customer / vendor & rider / admin & auth) tracing UI → API → DB | Findings fixed (below) |

Found and fixed during this pass:
- Logged-out visitors couldn't read vendors/meals (`is_admin()` not executable by `anon`).
- 002 notification triggers referenced a non-existent column, breaking order inserts and rider pickups on a DB built from the migrations.
- In-flight orders would have had no handover PIN after the migration (riders stuck at handover).
- Rider earnings page / dashboard offered balances the payout check would refuse (and a fake ₹1,450 fallback).
- Abandoned unpaid online orders showed in the kitchen's list with a Confirm button that always failed.
- Already-live kitchens couldn't reopen after closing (now grandfathered as verified).
- Delivery PIN flickered off the tracking page on realtime updates.
- Declining a partner application suspended the whole account.
- Re-registering an old unconfirmed email couldn't create a profile.
- Cancel modal claimed a refund for unpaid orders; tracker marked them refunded.
- Rider dashboard kept failed accepts as active until the next poll; application modals didn't tell users to confirm their email.
- Dev-tool pages returned 200 instead of 404; `/api/admin/users` validated before checking admin.
- Pre-existing, also fixed: admins couldn't read orders/subscriptions (zero dashboard stats), review form sent the wrong field, `?redirect=` login links, subscription dialog end date silently ignored.

Not testable here: logged-in flows against a live Supabase (no project access, no Docker). Run the
manual QA checklist in docs/development/TESTING.md on a staging project after applying 003.

## Not done / follow-ups

Out of scope for this branch, or need a decision or database access:

| Item | Why it's open |
|---|---|
| Apply migration 003 | No access to the live database (by design). Must be applied before deploying. See PLAN §5 |
| Real refunds / settlements / support tickets | `admin/refunds`, `admin/settlements`, `admin/support/tickets` and broadcast history are in-memory mocks; settlements ignore the `payouts` table |
| Payout processing | Payout requests are recorded as `pending`; nothing pays them out or marks them completed |
| Shared rate limiting | OTP attempt limit is in-memory (per serverless instance) |
| `profiles` storage bucket | Avatar upload targets a `profiles` bucket that no migration creates (see docs/database/SETUP.md) |
| Group orders | Non-host participants can't join (RLS); finalize uses its own ₹50 delivery / 5% tax pricing |
| Admin live ops | Order list reads the vendor endpoint and the reassign modal calls a GET that doesn't exist (pre-existing) |
| Checkout without Razorpay keys | Online payment is refused (cash only); if only the public key is set, the order is created but payment start fails |
| Column grants on `meals`, `reviews`, `group_orders`, `subscriptions.deliveries` | Owners can still edit any column of their own rows directly |
| Commission rate | Code uses 7% everywhere now; confirm that's the intended business rate |
| Lint warnings | 730 pre-existing warnings (mostly `any` / unused vars); 0 errors |
