# Contributing

How we work on Rasan: setup, conventions and the security rules every change must follow.

## Before you start

- Set up locally with the [Quick Start](../getting-started/QUICK_START.md).
- **Next.js 16:** `AGENTS.md` warns that this Next.js version has breaking changes to APIs, conventions and file structure. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code, and heed deprecation notices. For example, request middleware is `proxy.ts` (exporting `proxy()`), and it does not run on `/api` routes.

## Branches and commits

| Prefix | Use |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | No behaviour change |
| `test/` | Tests only |
| `chore/` | Tooling, dependencies |

Commits and PR titles use [Conventional Commits](https://www.conventionalcommits.org/), with an optional scope such as `feat:`, `fix(orders):`, `docs:`, `refactor:`, `test:` or `chore:`. Keep commits focused, and write the subject in the imperative ("enforce rider assignment", not "enforced").

Branch from `main`, rebase on it before opening a PR, and open the PR against `main`.

## Code style

- **Prettier** (`.prettierrc`): semicolons, single quotes, 2-space indent, trailing commas (`es5`), 100-column width, Tailwind class sorting via `prettier-plugin-tailwindcss`.
- **ESLint** (`eslint.config.mjs`): `eslint-config-next` core-web-vitals + TypeScript. Prefix intentionally unused variables with `_`. Avoid `any` (the linter warns on it).
- TypeScript everywhere. Shared types go in `types/`, and generated DB types in `types/database.types.ts`.
- Function components with hooks. Use the primitives in `components/ui/` before adding new ones (see [Design system](../architecture/DESIGN_SYSTEM.md)).
- Name files in kebab-case (`order-card.tsx`), components in PascalCase, constants in `UPPER_SNAKE_CASE` (money constants live in `lib/utils/constants.ts`).
- Put business logic in `lib/` (pricing, transitions, payments, payouts) so it can be unit tested, and keep route handlers thin.

Run before pushing:

```bash
npm run format:check && npm run lint && npm run type-check && npm test
```

## Security rules

These rules came out of the [October 2026 security audit](../audit/2026-10-security-cleanup/PLAN.md). Every new or changed API route must follow them. See also [Database security](../database/SECURITY.md) and the [API reference](../architecture/API.md).

1. **Authenticate every API route with `lib/auth/guards.ts`.** `proxy.ts` does not cover `/api`.
   ```ts
   const auth = await requireRole('vendor'); // or requireUser() / requireAdmin()
   if (!auth.ok) return auth.response;
   ```
   Read the role from the guard result. It comes from `profiles` and app metadata, never `user_metadata`. Page access rules live only in `lib/auth/roles.ts`.
2. **Never trust client-supplied prices, totals, status, payment state or ids.**
   - Price orders on the server from meal prices with `lib/pricing/order-pricing.ts`.
   - Derive the acting vendor or rider from the signed-in user. Do not take `vendor_id`, `delivery_partner_id`, `customer_id` or `user_id` from the body.
   - Check ownership of every record you read or write (the order belongs to this vendor, the rider is assigned, and so on).
   - Mark an order paid only after verified payment (`lib/payments/order-payment.ts`, webhook signature).
3. **Allow-list updatable fields.** Copy known fields out of the request body explicitly. Never spread the request body into `.update()` or `.insert()`. Validate input with Zod where practical.
4. **Use conditional updates for state transitions.** Check the transition with `canTransition()` (`lib/utils/order-transitions.ts`) and apply it through `lib/orders/transition.ts`. The update filters on the expected current status (`.eq('status', from)`), so two concurrent requests cannot both succeed. Do the same for claims, for example a rider claiming a `ready` order. Money moves such as payouts go through atomic DB functions like `request_payout()`. Never use read-then-write balance checks in JS.
5. **Never send the delivery OTP to riders or vendors.** The OTP is generated server-side when the order is created and is shown only to the customer. Riders submit it, and the server verifies it (`lib/utils/delivery-otp-server.ts`, rate-limited). Strip it from any order payload returned to a vendor or rider with `withoutDeliveryOtp()` (`lib/utils/delivery-otp.ts`).
6. **Use the service-role client sparingly.** `createServiceClient()` bypasses RLS. Use it only after the guard and ownership checks have passed, and never in client code.
7. **Gate dev and demo tooling.** Anything that seeds data, creates users or simulates orders must call `devToolsGuard()` / `setupSecretGuard()` from `lib/dev-tools.ts`. Do not add debug endpoints, hard-coded credentials or "fix my record" routes.
8. **Put every DB change in a new migration.** Add the next numbered file in `supabase/migrations/` (e.g. `004_*.sql`). Never edit an already-applied migration. Keep RLS and column grants consistent with migration 003: users must not be able to write role, status, payment, totals, earnings or verification columns. Regenerate `types/database.types.ts` after schema changes.
9. **Validate redirects.** Use `lib/utils/safe-redirect.ts` for any user-supplied `redirectTo`.

## Tests

Add or update tests with your change. Pure logic in `lib/` gets a Jest test under `__tests__/`, and user-facing flows get a Playwright spec in `e2e/` where feasible. Run the relevant part of the manual checklist. See [Testing](./TESTING.md).

## Pull requests

PR checklist:

- [ ] Format, lint, type-check and tests pass
- [ ] New or changed API routes follow the security rules above
- [ ] DB changes are in a new migration, with the type file regenerated
- [ ] Docs updated if behaviour, env vars or routes changed (see [docs/README.md](../README.md))
- [ ] No `console.log` debugging, commented-out code, secrets or demo credentials

The PR description should cover what changed and why, how it was tested, and screenshots for UI changes. At least one approving review is needed before merging to `main`.

## Reporting bugs

Open an issue that includes steps to reproduce, the expected and actual behaviour, the browser and OS, and the affected role. Report security issues privately to the maintainers. Do not open a public issue for them.
