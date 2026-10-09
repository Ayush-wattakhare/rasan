# Security Audit & Cleanup — Progress

Plan: [PLAN.md](./PLAN.md) · Branch: `fix/security-audit-cleanup`

Status legend: ⬜ todo · 🔄 in progress · ✅ done · ⏭️ skipped (reason given)

## Commits

| # | Commit | Status | Notes |
|---|---|---|---|
| 0 | Plan + progress docs | ✅ | |
| 1 | Migration 003 (written, not applied) | ⬜ | |
| 2 | Shared auth guards | ⬜ | |
| 3 | Auth / role / callback fixes | ⬜ | |
| 4 | Remove debug routes, lock dev tools | ⬜ | |
| 5 | Admin route checks | ⬜ | |
| 6 | Orders & payments | ⬜ | |
| 7 | Delivery | ⬜ | |
| 8 | Vendor / catalog / subscriptions / uploads | ⬜ | |
| 9 | Tests | ⬜ | |
| 10 | Docs reorganisation | ⬜ | |
| 11 | Final verification | ⬜ | |

## Findings tracker

| Group | IDs | Status |
|---|---|---|
| A. Database | A1–A7 | ⬜ |
| B. Auth & roles | B1–B5 | ⬜ |
| C. Dev / debug | C1–C7 | ⬜ |
| D. Admin | D1–D4 | ⬜ |
| E. Orders & payments | E1–E9 | ⬜ |
| F. Delivery | F1–F6 | ⬜ |
| G. Vendor etc. | G1–G11 | ⬜ |
| H. Consistency & docs | H1–H2 | ⬜ |
| I. Pages / browser bypass | I1–I6 | ⬜ |

## Verification log

| When | Step | tsc | eslint errors | jest | build |
|---|---|---|---|---|---|
| 2026-10-10 | Baseline (`main` @ 3518b27) | ✅ 0 | 0 (766 warnings) | 45/45 | ✅ |

## Log

- **2026-10-10** — Branch created. Dependencies installed. Baseline recorded. Full audit of
  87 API routes + RLS policies done (3 parallel read-only passes). Plan written.
