# Pre-launch Checklist

Work through this before opening Rasan to real users. Steps are explained in
[DEPLOYMENT.md](DEPLOYMENT.md); background on the security fixes is in the
[audit plan](../audit/2026-10-security-cleanup/PLAN.md).

## Code

- [ ] `npm run lint`, `npm run type-check`, `npm run build` pass.
- [ ] `npm test` and `npm run test:e2e` pass (see [Testing](../development/TESTING.md)).

## Database

- [ ] Migrations `001`, both `002`s and `003_security_hardening.sql` applied to production, in order.
- [ ] RLS enabled on every public table; column grants from 003 in place.
- [ ] `update_delivery_partner_stats` trigger exists.
- [ ] `profiles` storage bucket and its avatar upload policy created; `meal-images` exists or can be auto-created.
- [ ] Realtime enabled for `orders`, `notifications`, `delivery_partners`, `profiles`.
- [ ] Backups / point-in-time recovery enabled on the Supabase plan.

## Security

- [ ] `ENABLE_DEV_TOOLS` and `ADMIN_SETUP_SECRET` are **not** set in Production.
- [ ] `/admin/setup`, `/admin/seed-data`, `/dev/order-simulator` are unreachable in production.
- [ ] Old demo accounts (listed in PLAN.md §5) deleted or passwords changed.
- [ ] At least one real admin account exists; its role is set in `profiles.role` and synced to `app_metadata`.
- [ ] Vendors active without admin approval and riders verified with seeded earnings reviewed.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and payment secrets exist only as server-side env vars.
- [ ] Security headers from `vercel.json` present on responses (check with `curl -I`).
- [ ] Each role can only reach its own pages and APIs (customer, vendor, delivery, admin).

## Payments

- [ ] Live `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` set.
- [ ] Razorpay webhook → `/api/payments/webhook` (`payment.captured`), secret in `RAZORPAY_WEBHOOK_SECRET`.
- [ ] One small live payment marks the order paid; webhook delivery shows 2xx.
- [ ] Cancellation refund rules checked (100% before preparing, 50% while preparing, 0% after; only if paid).
- [ ] Platform commission (7%) and fees (platform ₹2, delivery ₹0) match what you intend to charge.
- [ ] Payout process agreed: requests land as `pending` in `payouts`; someone must transfer money and settle them.
- [ ] Stripe keys set only if Stripe is offered.

## Operations and monitoring

- [ ] Vercel function logs and Supabase logs reviewed after a test order.
- [ ] Someone is responsible for approving vendor and rider applications (`admin/partners/verify`).
- [ ] Error alerting chosen and configured (no error-tracking SDK is installed yet).
- [ ] Uptime check on the home page and one API route (e.g. `GET /api/meals`).
- [ ] Rollback steps in [DEPLOYMENT.md §9](DEPLOYMENT.md#9-rollback) understood.

## Content and legal

Pages that exist in `app/`:

- [ ] `/terms-of-service` reviewed
- [ ] `/privacy-policy` reviewed
- [ ] `/refund-policy` matches the cancellation/refund rules above
- [ ] `/cookie-policy` reviewed
- [ ] `/about`, `/contact`, `/partner-support` have correct contact details
- [ ] `/careers` and `/blog` either have real content or are hidden
- [ ] Real vendors, meals and categories in place (no seed data in production)
