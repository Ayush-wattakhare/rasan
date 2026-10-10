# Security Audit & Cleanup — Plan

| | |
|---|---|
| **Branch** | `fix/security-audit-cleanup` (from `main` @ `3518b27`) |
| **Started** | 2026-10-10 |
| **Delivery** | One branch, one PR, multiple focused commits |
| **Progress log** | [PROGRESS.md](./PROGRESS.md) |

## 1. Scope

An initial review found 5 issues (role taken from user-editable metadata, unauthenticated
dev/debug routes, incomplete middleware route lists, stale docs, leftover demo/fix code).
A full end-to-end audit of all 87 API routes and every RLS policy was then run. It found
the problems below. This plan covers **all** of them.

### Database rule

The live Supabase project belongs to a separate deployment that we have no access to.
**We only write migrations — we never apply them.** All database fixes go into
`supabase/migrations/003_security_hardening.sql`. Whoever owns the database must apply it
**before** deploying this branch, because some route fixes depend on the new columns and
functions it adds (see §5).

### Defaults chosen (open questions not yet answered)

| Question | Default used | Why |
|---|---|---|
| Commission rate: 7% (code) or 25% (README)? | Code is truth: **7%**. Docs updated to match. | Code is what charges users. Easy to change in `lib/utils/constants.ts`. |
| Keep demo accounts / order simulator? | **Keep seeding + simulator, locked** behind admin login + `ENABLE_DEV_TOOLS=true` + non-production. **Delete** pure debug/"fix" routes. | Reversible; nothing a demo relies on is lost. |

## 2. Audit findings (summary)

The full audit reviewed every API route, every RLS policy, and the pages and browser code that
write to the database. Detailed findings (file locations and impact) are kept out of this public
repository until the fixes are deployed. Reviewers can get them privately from the author.

| Group | Area | Findings | Highest severity |
|---|---|---|---|
| A | Database permissions (RLS / column grants) | 7 | Critical |
| B | Auth, roles and account creation | 5 | High |
| C | Dev / debug / "fix" routes and leftover demo code | 7 | Critical |
| D | Admin routes missing admin checks | 4 | High |
| E | Orders and payments | 9 | Critical |
| F | Delivery (assignment, handover PIN, payouts, location) | 6 | Critical |
| G | Vendor, catalog, subscriptions, uploads | 11 | Critical |
| H | Consistency and documentation | 2 | Low |
| I | Pages and browser code bypassing the API | 6 | Critical |

Common themes:

- Trusting the client for identity, prices, totals and statuses.
- Missing ownership checks on server routes that use the service role.
- RLS policies that check row ownership but not which columns change.
- Debug and demo shortcuts that were reachable in production.

## 3. Approach

### Shared building blocks (written once, reused)

- `lib/auth/guards.ts` — `getAuthContext()` (user + role from `profiles`), `requireUser()`,
  `requireRole(...roles)`, `requireAdmin()`, returning a typed result or a ready
  `NextResponse` error. Replaces ~40 hand-rolled copies.
- `lib/auth/roles.ts` — single role → routes map + `resolveRole()` (app_metadata → profiles,
  never user_metadata). Used by middleware.
- `lib/utils/safe-redirect.ts` — same-origin relative path check.
- `lib/utils/order-transitions.ts` — allowed status transitions per actor.
- `lib/dev-tools.ts` — `devToolsEnabled()` = `ENABLE_DEV_TOOLS==='true'` and
  `VERCEL_ENV!=='production'` and `NODE_ENV!=='production'` (NODE_ENV is `production` on
  Vercel previews too, so it can't be used alone).

### Principles

1. **The server is the source of truth for money.** Prices, totals, payout balances and
   payment status are computed or verified on the server only.
2. **Database is the last line of defence.** Column-level grants stop users from writing
   privileged columns even with the public anon key.
3. **Allow-list, never spread.** No `.update(body)` / `...body` into the database.
4. **Conditional updates** (`.eq('status', expected)`) for every state transition, to stop
   replays and races.
5. Delete what is pure debug code; lock what has demo value.

## 4. Commit plan (single branch → single PR)

| # | Commit | Fixes |
|---|---|---|
| 0 | `docs(audit): add security audit plan and progress log` | — |
| 1 | `feat(db): add 003 security hardening migration (not applied)` | A1–A7, plus columns/functions for E5, E8, F4, G5 and the `profiles.role → app_metadata` sync trigger |
| 2 | `feat(auth): add shared auth guards and role resolution` | building blocks |
| 3 | `fix(auth): stop trusting user_metadata role, secure profile creation and callback` | B1–B5, H1 |
| 4 | `chore(dev): remove debug/fix routes and lock dev tools` | C1–C7 |
| 5 | `fix(admin): require admin on all admin routes` | D1–D4 |
| 6 | `fix(orders): server-side pricing, status authz, payment verification` | E1–E9, I1 |
| 7 | `fix(delivery): enforce assignment, OTP and payout balance checks` | F1–F6, I2 |
| 8 | `fix(vendor): enforce ownership on orders, broadcasts, meals, payouts, reviews, subscriptions, uploads` | G1–G11, I3–I6 |
| 9 | `test: cover guards, redirects, transitions and pricing` | regression tests |
| 10 | `docs: reorganise docs into docs/, remove stale reports, fix facts` | H2 |
| 11 | `docs(audit): final progress update` | — |

### Migration 003 contents

- **profiles**: revoke UPDATE from `authenticated`/`anon`; grant UPDATE on
  `name, phone, avatar_url, address` only.
- **profiles → auth sync**: `SECURITY DEFINER` trigger copies `profiles.role` into
  `auth.users.raw_app_meta_data.role` on insert/update; one-time backfill.
- **orders**: revoke INSERT/UPDATE from `authenticated` except UPDATE on `rating`; all
  creation/transitions go through server routes. Add `payment_order_id`, `compensated_at`.
- **vendors**: grant UPDATE only on profile fields; INSERT only with `is_active=false`,
  zero rating/orders.
- **delivery_partners**: grant UPDATE only on `is_online, current_location, vehicle_*`;
  INSERT only unverified with zero earnings.
- **subscriptions**: revoke INSERT; grant UPDATE only on schedule/address fields
  (`status, deliveries, address, delivery_time, auto_renew`) plus trigger forbidding
  reviving cancelled/expired subscriptions.
- **reviews**: INSERT requires own, delivered order.
- **payouts** table + `request_payout()` function (service-role only): atomic balance check
  and deduction for vendors and delivery partners.

## 5. Deploy notes (for whoever owns the database)

1. Apply `003_security_hardening.sql` **before** deploying this branch.
2. Set `ENABLE_DEV_TOOLS` only on local/dev environments. Never in production.
3. Set `ADMIN_SETUP_SECRET` wherever `admin/setup` should work (it is now required).
4. If the demo accounts created by the old demo-user route exist in production, delete them or
   change their passwords. Their credentials were in the repository.
5. Rider earnings are credited only by the `update_delivery_partner_stats` trigger from
   migration 001 (the routes used to credit them a second time). Make sure that trigger
   exists in the target database.
6. Online payments need `RAZORPAY_KEY_ID`/`NEXT_PUBLIC_RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Without them checkout offers cash
   only — orders are never marked paid without a verified payment.
7. Review vendors that are `is_active=true` without admin approval and partners that are
   `is_verified=true` with seeded earnings (₹34,500) — these may have been created by the
   removed routes.

## 6. Verification

Each commit: `tsc --noEmit` + `eslint` (no new errors) + `jest`. Final: `next build`.

Baseline on `main` (2026-10-10): tsc 0 errors · eslint 0 errors / 766 warnings ·
jest 4 suites / 45 tests pass · `next build` pass.

Not possible here: running migration 003 against a database (no access). It is written to
be idempotent where practical and reviewed by hand.
