# Security Audit & Cleanup — Progress

Plan: [PLAN.md](./PLAN.md) · Branch: `fix/security-audit-cleanup`

Status legend: ⬜ todo · 🔄 in progress · ✅ done · ⏭️ skipped (reason given)

## Commits

| # | Commit | Status | Notes |
|---|---|---|---|
| 0 | Plan + progress docs | ✅ | |
| 1 | Migration 003 (written, not applied) | ✅ | `ad6b1e1`. DB types updated. |
| 2 | Shared auth guards | ✅ | `fc74ba7` |
| 3 | Auth / role / callback fixes | ✅ | Middleware + root layout use app_metadata → profiles. create-profile bound to session / fresh signup. Callback redirect sanitised. become-* use normal sign-up, vendors start inactive, admins can't self-demote. |
| 4 | Remove debug routes, lock dev tools | ✅ | Deleted 9 API routes, 7 debug pages, `scratch/`, dead components. `vendor/check-status` kept as read-only. Seeding / demo users / simulator / admin setup now need `ENABLE_DEV_TOOLS` (+ admin or `ADMIN_SETUP_SECRET`). Login form no longer auto-creates demo users. |
| 5 | Admin route checks | ✅ | All 14 admin routes now guarded (12 `requireAdmin` / profiles role, 2 setup-secret). Broadcast target and role values validated; admins can't drop their own admin role. Admin user actions go through the API. |
| 6 | Orders & payments | ✅ | New `POST /api/orders` prices orders from DB meals (shared `lib/pricing`); checkout uses it and never marks orders paid. Shared `transitionOrder()` (ownership + allowed transitions + payment + OTP + conditional update). Payments bound to the gateway order id stored on the order; timing-safe signatures; idempotent webhook with amount check. Cancel refunds only paid orders. Late compensation uses real delivery time, once per order. Group finalize validates quantities and runs once. |
| 7 | Delivery | ✅ | Rider status route uses `transitionOrder()` (assignment + OTP, 5 attempts / 15 min). Shared `claimOrderForPartner()` for both accept routes (verified rider, ready + unassigned, paid or COD, race-safe). Rider feed (API + dashboard page) shows only own active + ready orders, no OTPs, customer contact only when assigned. Payouts via `request_payout()` with balance check, recorded as pending. Live location limited to rider / admin / customer being delivered to. Pages no longer auto-create verified riders. |
| 8 | Vendor / catalog / subscriptions / uploads | ✅ | Vendor status routes use `transitionOrder()`; vendor order feed strips OTP. Subscriptions priced server-side (from the checkout order, or plan table), dates bounded, one per order (`subscriptions.order_id` added to migration 003); PUT allow-listed. Broadcast fallback removed. Reviews only for own delivered orders, rating goes to the order's kitchen. Meal PATCH allow-listed, no self-set ratings, public listing shows available meals only. Community feed: owner-only chef posts, subscriber/owner-only reads, no demo vendor IDs. Uploads: JPEG/PNG/WebP(/GIF), type-derived extension, fixed folders, no overwrite. Vendor pages no longer auto-create vendors; payouts page uses the 7% constant and subtracts requested payouts. Subscriptions page no longer extends expired plans. |
| 9 | Tests | ✅ | 6 new suites, 64 new tests: role map / app_metadata-only roles, safe redirects, order transitions, order + subscription pricing, payment signatures + OTP (incl. no fallback, PIN stripping), dev-tools + setup-secret guards. Total 109 tests pass. |
| 10 | Docs reorganisation | ⬜ | |
| 11 | Final verification | ⬜ | |

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
| H. Consistency & docs | H1 ✅ · H2 ⬜ |
| I. Pages / browser bypass | I1–I6 ✅ |

## Verification log

| When | Step | tsc | eslint errors | jest | build |
|---|---|---|---|---|---|
| 2026-10-10 | Baseline (`main` @ 3518b27) | ✅ 0 | 0 (766 warnings) | 45/45 | ✅ |

## Log

- **2026-10-10** — Branch created. Dependencies installed. Baseline recorded. Full audit of
  87 API routes + RLS policies done (3 parallel read-only passes). Plan written.
