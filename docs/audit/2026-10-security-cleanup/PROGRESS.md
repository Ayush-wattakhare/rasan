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
| 6 | Orders & payments | ⬜ | |
| 7 | Delivery | ⬜ | |
| 8 | Vendor / catalog / subscriptions / uploads | ⬜ | |
| 9 | Tests | ⬜ | |
| 10 | Docs reorganisation | ⬜ | |
| 11 | Final verification | ⬜ | |

## Findings tracker

| Group | IDs | Status |
|---|---|---|
| A. Database | A1–A7 | ✅ (migration written, not applied) |
| B. Auth & roles | B1–B5 | ✅ |
| C. Dev / debug | C1–C7 | ✅ |
| D. Admin | D1–D4 | ✅ |
| E. Orders & payments | E1–E9 | ⬜ |
| F. Delivery | F1–F6 | ⬜ |
| G. Vendor etc. | G1–G11 | ⬜ |
| H. Consistency & docs | H1 ✅ · H2 ⬜ |
| I. Pages / browser bypass | I5–I6 ✅ · I1–I4 ⬜ |

## Verification log

| When | Step | tsc | eslint errors | jest | build |
|---|---|---|---|---|---|
| 2026-10-10 | Baseline (`main` @ 3518b27) | ✅ 0 | 0 (766 warnings) | 45/45 | ✅ |

## Log

- **2026-10-10** — Branch created. Dependencies installed. Baseline recorded. Full audit of
  87 API routes + RLS policies done (3 parallel read-only passes). Plan written.
