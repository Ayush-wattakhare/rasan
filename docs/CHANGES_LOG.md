# Project Changes & Implementation Log

This document maintains a dated, chronological record of all features, fixes, architectural plans, and code changes in the Rasan platform.

### [2026-10-17] - Geo-Fencing Freshness Guard, 10 KM Delivery Radius & City Unavailability Screen

- **Date & Time:** 2026-10-17 02:09 IST
- **Objective:** Implement hyper-local delivery radius enforcement so Rasan only serves nearby customers (students & working professionals within 10 km), ensuring food arrives piping hot. Show a "not in your city yet" screen for out-of-city visitors.
- **Implementation Plan:**
  1. Add `MAX_DELIVERY_RADIUS_KM = 10` constant and `haversineDistanceKm()` utility to `lib/utils/constants.ts`.
  2. Add client-side freshness guard in `checkout-form.tsx` that fetches vendor kitchen GPS and blocks checkout if distance > 10 km.
  3. Add server-side freshness guard in `app/api/orders/route.ts` (protects against API bypass).
  4. Create `app/api/vendors/[id]/location/route.ts` lightweight endpoint returning only vendor lat/lng for distance calculation.
  5. Create `components/location/city-unavailable.tsx` — branded screen for out-of-city visitors with waitlist email signup.
- **Files Modified / Created:**
  - `lib/utils/constants.ts` - Added `MAX_DELIVERY_RADIUS_KM`, `haversineDistanceKm()`.
  - `components/checkout/checkout-form.tsx` - Client-side 10 km guard + freshness banner in UI.
  - `app/api/orders/route.ts` - Server-side distance validation with `DELIVERY_TOO_FAR` error code.
  - `app/api/vendors/[id]/location/route.ts` - New micro-endpoint returning vendor kitchen lat/lng.
  - `components/location/city-unavailable.tsx` - New "Coming soon to your city" component with waitlist.
  - `docs/CHANGES_LOG.md` - Updated with this entry.
- **Status:** Completed
- **Verification / Testing:** `npm run build` — ✅ Exit code 0, compiled cleanly. TypeScript passed 0 errors.

---

### [2026-10-15] - Payment Webhook Idempotency, Transactional SMS/WhatsApp Gateway & Production Runbook


- **Date & Time:** 2026-10-15 00:58 IST
- **Objective:** Complete Pillar 2 (Razorpay webhook idempotency, duplicate retry protection, payment.failed handling), Pillar 4 (pluggable transactional SMS & WhatsApp messaging service with zero-cost mock fallback), and Pillar 5 (production launch pre-flight runbook for Migration 005 and custom domain mapping).
- **Implementation Plan:**
  1. Harden `app/api/payments/webhook/route.ts` with explicit idempotency check (`order.payment_status === 'paid'` returns 200 immediately), support `order.paid` and `payment.failed`, and dispatch customer notifications.
  2. Implement `lib/notifications/transactional.ts` supporting Fast2SMS, MSG91, Twilio, Meta WhatsApp Cloud API, and graceful fallback logging.
  3. Create `docs/PRODUCTION_LAUNCH_CHECKLIST.md` with step-by-step instructions for Migration 005 execution in Supabase, Razorpay webhook configuration, Vercel environment variables, and custom domain DNS records.
  4. Document environment variables in `.env.example`.
- **Files Modified / Created:**
  - `app/api/payments/webhook/route.ts` - Hardened with idempotency check, payment.failed handler, and notification trigger.
  - `lib/notifications/transactional.ts` - Pluggable SMS & WhatsApp transactional notification service.
  - `.env.example` - Documented RAZORPAY_WEBHOOK_SECRET and transactional provider keys.
  - `docs/PRODUCTION_LAUNCH_CHECKLIST.md` - Production launch checklist and runbook.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed (Local Only - Not Pushed as requested)
- **Verification / Testing:**
  - TypeScript Compilation: `npm run type-check` (`tsc --noEmit`) passed with 0 errors.
  - Test Suite: `npm test` (`jest`) passed 10/10 test suites (117/117 unit/integration tests).
  - Code Formatting: All modified files formatted with Prettier.

---

### [2026-10-15] - Master 100% Launch Roadmap & Final Pre-flight Architecture

- **Date & Time:** 2026-10-15 00:32 IST
- **Objective:** Establish the comprehensive 5-pillar execution roadmap to bring Rasan from 88% readiness to 100% production launch readiness across payments, kitchen audio notifications, rider GPS tracking, SMS/WhatsApp gateways, and production pre-flight checks.
- **Implementation Plan:**
  1. Pillar 1: Kitchen Realtime Chime & Live Order Queue (`lib/utils/audio-chime.ts` Web Audio API synthesizer, Supabase realtime order listener).
  2. Pillar 2: Payment Gateway & Webhook Hardening (Razorpay signature verification, payment capture idempotency).
  3. Pillar 3: Realtime Rider GPS Location Streaming (`navigator.geolocation.watchPosition` throttled sync to PostGIS point).
  4. Pillar 4: Pluggable SMS & WhatsApp Notification Service (`lib/notifications/transactional.ts` supporting Fast2SMS, MSG91, Twilio).
  5. Pillar 5: Production Pre-Flight Verification & Launch Runbook.
- **Files Modified / Created:**
  - `lib/utils/audio-chime.ts` - Zero-asset Web Audio API dual-tone brass chime generator with persistence.
  - `components/vendor/audio-order-alert.tsx` - Supabase Realtime channel subscription on orders with auto-refresh and mute toggle.
  - `app/(vendor)/vendor-dashboard/page.tsx` - Mounted realtime audio order alert on vendor operations dashboard.
  - `lib/hooks/use-rider-location.ts` - Battery-efficient throttled rider GPS tracker with Haversine distance threshold.
  - `components/delivery/location-tracker.tsx` - Enabled automatic hardware GPS tracking when rider duty status is online.
  - `docs/LAUNCH_ROADMAP_100_PERCENT.md` - Master 5-pillar launch roadmap.
  - `docs/CHANGES_LOG.md` - Recorded plan and completed steps.
- **Status:** Completed
- **Verification / Testing:**
  - TypeScript Compilation: `npm run type-check` (`tsc --noEmit`) passed with 0 errors.
  - Test Suite: `npm test` (`jest`) passed 10/10 test suites (117/117 unit/integration tests).
  - Code Formatting: All modified files formatted and verified with Prettier.

---

### [2026-10-14] - Delivery Rider Management Overhaul: Delete Rider API & Decline Fix

- **Date & Time:** 2026-10-14 23:44 IST
- **Objective:** Fix rider decline button not updating UI in Delivery Registry, add dedicated "Delete Rider" API endpoint and confirmation action, and filter out declined/blocked riders from the Pending Applications tab.
- **Implementation Plan:**
  1. Create `DELETE /api/admin/delivery-partners/[id]` API route to remove delivery partners from registry and reset profile role to `customer`.
  2. Enhance `components/admin/verification-actions.tsx`: support `partnerId` prop for delivery partners, add "Delete Rider" action with confirmation dialog, and ensure decline/block updates UI correctly.
  3. Update `components/admin/delivery-table.tsx` to pass `partnerId={partner.id}` and `role="delivery"`.
  4. Fix query in `app/(admin)/delivery-management/page.tsx`: select `documents` and `profile.is_active`; exclude declined or blocked riders from the "Pending Applications" tab (`?verified=false`).
- **Files Modified / Created:**
  - `app/api/admin/delivery-partners/[id]/route.ts` - New DELETE endpoint for delivery partners with order cascade handling, profile role demotion, and notifications.
  - `app/api/admin/partners/verify/route.ts` - Resolved target partner by either ID or user ID, ensured profile role demotion to customer on decline, and unified notifications.
  - `components/admin/verification-actions.tsx` - Added `partnerId` and `applicationStatus` props, Delete Rider option in dropdown, dynamic confirmation dialog, and contextual button visibility.
  - `components/admin/delivery-table.tsx` - Passed `partnerId` and `applicationStatus` to `VerificationActions`, and added DECLINED and BLOCKED status badge styling.
  - `components/admin/vendor-table.tsx` - Passed `applicationStatus` to `VerificationActions` and rendered DECLINED and BLOCKED badges consistently.
  - `app/(admin)/delivery-management/page.tsx` - Selected `documents` and `profile.is_active`, and filtered out declined/blocked applicants from the "Pending Applications" tab (`?verified=false`).
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - TypeScript Compilation: `npm run type-check` (`tsc --noEmit`) passed with 0 errors.
  - Test Suite: `npm test` (`jest`) passed 10/10 test suites (117/117 unit/integration tests).
  - Code Formatting: All modified files formatted and verified with Prettier.

---

### [2026-10-14] - Vendor Registry Overhaul: Delete Vendor API, Block Action & Pending Filter Fix

- **Date & Time:** 2026-10-14 22:38 IST
- **Objective:** Fix inability to decline, deactivate, or block vendors from the Vendor Registry table, add dedicated "Delete Vendor" action with confirmation dialog, and filter out declined/blocked vendors from the Pending Approvals tab.
- **Implementation Plan:**
  1. Create `DELETE /api/admin/vendors/[id]` API route to delete vendor records with cascade and reset profile role to `customer`.
  2. Enhance `components/admin/verification-actions.tsx`: add `vendorId` prop, add "Block Partner" action, add "Delete Vendor" with confirmation dialog, and fix deactivation toggle for pending applicants.
  3. Update `components/admin/vendor-table.tsx` to pass `vendorId={vendor.id}` and `role="vendor"`.
  4. Fix query in `app/(admin)/vendor-management/page.tsx`: select `documents` and `profile.is_active`; exclude declined or blocked applicants from the "Pending Approvals" tab so declined vendors immediately vanish.
- **Files Modified / Created:**
  - `app/api/admin/vendors/[id]/route.ts` - New DELETE endpoint for vendors.
  - `components/admin/verification-actions.tsx` - Added Delete Vendor, Block Partner, and confirmation modal.
  - `components/admin/vendor-table.tsx` - Pass vendorId and role.
  - `app/(admin)/vendor-management/page.tsx` - Switched to `createServiceClient()` to resolve Postgres column-level permission denied error on `documents`, and filtered out declined/blocked applicants from pending approvals.
  - `app/(admin)/delivery-management/page.tsx` - Switched to `createServiceClient()` for consistent admin permissions.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - TypeScript Compilation: `npm run type-check` passed with 0 errors (`tsc --noEmit` code 0).
  - Test Suite: `npm test` passed 10/10 test suites (117/117 unit/integration tests).
  - Code Formatting: All modified files formatted and verified with Prettier.

---

### [2026-10-14] - Global Route Integrity Audit & Delivery Verification Bug Fix

- **Date & Time:** 2026-10-14 22:30 IST
- **Objective:** Exhaustive codebase audit for broken routes, dynamic links, and API fetches. Discovered and resolved role mismatch bug in `VerificationActions` where delivery partner verification was hardcoded as vendor.
- **Implementation Plan:**
  1. Scan all 168 internal links/navigations and 103 API fetch calls (literal and template dynamic paths) against actual existing Next.js App Router pages and route handlers.
  2. Audit Next.js 16 `params` and `searchParams` promise handling across all server components and route handlers.
  3. Audit Supabase queries against valid Postgres database tables.
  4. Fix discovered defect in `VerificationActions`: pass dynamic role prop (`role="delivery"`, `role="vendor"`, `role={user.role}`) so rider approvals/declines update `delivery_partners` instead of failing with vendor table mismatches.
- **Files Modified / Created:**
  - `components/admin/verification-actions.tsx` - Added dynamic `role` prop with role-aware dispatch to `/api/admin/partners/verify` or `/api/admin/users/[id]/status`.
  - `components/admin/delivery-table.tsx` - Passed `role="delivery"` to `VerificationActions`.
  - `components/admin/user-table.tsx` - Passed `role={user.role}` to `VerificationActions`.
  - `app/(admin)/admin-dashboard/users/[id]/page.tsx` - Passed `role={targetProfile.role}` to `VerificationActions`.
  - `docs/CHANGES_LOG.md` - Recorded audit and bug fix.
- **Status:** Completed
- **Verification / Testing:**
  - Route Scan: 168/168 links matched valid pages, 103/103 API endpoints matched valid route handlers. 0 broken routes detected.
  - TypeScript: `npm run type-check` passed with 0 errors (`tsc --noEmit` code 0).
  - Test Suite: `npm test` passed 10/10 test suites (117/117 unit/integration tests).
  - Code Formatting: Prettier check clean on all files.

---

### [2026-10-14] - Partner Onboarding Flow Overhaul: Block Option & Non-Intrusive Notification

- **Date & Time:** 2026-10-14 21:18 IST
- **Objective:** Fix recurring Super Chef modal popup bug on decline, add account blocking option, and replace intrusive modal auto-popup with a non-blocking notification badge and click-to-review application drawer.
- **Implementation Plan:**
  1. Root cause remediation in `/api/admin/partners/verify`: persist `application_status: 'declined'` or `'blocked'` in `documents` JSONB, demote unapproved applicants or deactivate blocked profiles (`is_active: false`).
  2. Implement `block` action in `/api/admin/partners/verify` to permanently ban partner accounts and stop all future requests.
  3. Update `/api/admin/partners/pending`: filter out inactive/blocked profiles and previously declined/blocked applications so they never reappear in the pending queue.
  4. Redesign `components/admin/partner-application-listener.tsx`: remove forced popup on initial load; render a sleek, high-visibility floating notification pill (`New Application Received (N) - Review Applications`); open modal only upon deliberate admin click.
  5. Enhance review dialog with multi-application browsing (pagination), applicant details, and 3 explicit actions: Accept & Activate, Decline (with feedback), and Block Partner.
- **Files Modified / Created:**
  - `app/api/admin/partners/verify/route.ts` - Added `block` action, merged audit status into `documents` JSONB, demoted declined profiles to `customer`, and handled suspension.
  - `app/api/admin/partners/pending/route.ts` - Filtered out inactive/blocked profiles and previously declined/blocked applications.
  - `app/api/admin/users/[id]/status/route.ts` - Added synchronization of `application_status: 'declined'` to `vendors` and `delivery_partners` documents.
  - `types/index.ts` - Expanded `VendorDocuments` and `DeliveryDocuments` interfaces with optional application status and audit fields.
  - `components/admin/partner-application-listener.tsx` - Replaced intrusive modal auto-popup with a floating notification pill (`New Application Received (N)`), pagination between multiple applications, and 3 explicit actions (Accept & Activate, Decline with feedback, and Block Partner).
  - `components/admin/verification-actions.tsx` - Routed registry table accept/decline actions through the unified `/api/admin/partners/verify` endpoint.
  - `docs/CHANGES_LOG.md` - Recorded task changes and verification.
- **Status:** Completed (PR #11 created)
- **Pull Request:** [PR #11: feat: startup launch master plan, admin persistence, and partner onboarding overhaul](https://github.com/Ayush-wattakhare/rasan/pull/11)
- **Verification / Testing:**
  - TypeScript Compilation: `npm run type-check` passed with 0 errors (`tsc --noEmit` code 0).
  - Unit/Integration Tests: `npm test` passed 10/10 test suites (117/117 unit/integration tests passed in 23.6s).
  - Production Build: `npm run build` completed with code 0 (all 99 dynamic and static routes compiled cleanly).

---

### [2026-10-14] - Startup Launch Master Plan & Admin Database Persistence

- **Date & Time:** 2026-10-14 20:25 IST
- **Objective:** Deep architectural audit, master solution plan, and migration implementation to bring Rasan from 85% MVP to 100% startup launch readiness. Eliminate volatile in-memory arrays in Admin APIs (`support_tickets`, `refunds`, `settlements`, `broadcasts`) by creating database migration 005, linking settlements directly to the atomic `payouts` table, and updating Database TypeScript interfaces.
- **Implementation Plan:**
  1. Audit entire codebase, build pipeline, test coverage, and security boundaries.
  2. Formulate comprehensive launch readiness report and master solution architecture plan.
  3. Create Migration `005_support_refunds_broadcasts.sql` (`support_tickets`, `refunds_ledger`, `broadcast_announcements`, and `payouts` settlement columns).
  4. Update `types/database.types.ts` with complete type definitions for new and enhanced tables.
  5. Refactor Admin API routes (`tickets`, `refunds`, `settlements`, `broadcasts`) to perform persistent Supabase database operations with resilient fallbacks.
  6. Update database documentation in `docs/database/SETUP.md`.
- **Files Modified / Created:**
  - `supabase/migrations/005_support_refunds_broadcasts.sql` - Created migration for support tickets, refunds ledger, broadcast announcements, and payout settlement enhancements.
  - `types/database.types.ts` - Added type definitions for `support_tickets`, `refunds_ledger`, `broadcast_announcements`, and enhanced `payouts`.
  - `app/api/admin/support/tickets/route.ts` - Refactored to query and insert into `support_tickets` in Supabase with fallback.
  - `app/api/admin/refunds/route.ts` - Refactored to query and insert into `refunds_ledger` in Supabase with fallback.
  - `app/api/admin/settlements/route.ts` - Refactored to read from `payouts` table and record UTR settlements in Supabase with fallback.
  - `app/api/admin/broadcasts/route.ts` - Refactored to persist announcements to `broadcast_announcements` and batch dispatch notifications with fallback.
  - `docs/database/SETUP.md` - Documented migrations 004 and 005.
  - `startup_readiness_audit_report.md` - Technical audit report artifact.
  - `startup_launch_master_plan.md` - Master solution architecture plan artifact.
  - `docs/CHANGES_LOG.md` - Recorded task changes and verification.
- **Status:** Completed
- **Verification / Testing:**
  - TypeScript Compilation: `npm run type-check` passed with 0 errors (`tsc --noEmit` code 0).
  - Test Suite: `npm test` passed 10/10 test suites (117/117 unit/integration tests passed in 21.9s).
  - Production Build: `npm run build` completed with code 0 (all 99 dynamic and static routes compiled and optimized cleanly).
  - Live Database Verification: Direct automated test against live Supabase project confirmed `support_tickets`, `refunds_ledger`, `broadcast_announcements`, and `payouts` tables are active and accessible.

---

### [2026-10-14] - Broken Routes Resolution & Production Stability Hardening

- **Date & Time:** 2026-10-14 01:10 IST
- **Objective:** Fix broken routes (/sitemap, /accessibility, /users), correct PostgREST relation alias mismatch in vendor management, secure the unauthenticated /admin route, add self-healing profile fallback in checkout, and guard meal details against null vendor.
- **Implementation Plan:**
  1. Create `app/accessibility/page.tsx` and `app/sitemap/page.tsx` to eliminate 404s from global footer links.
  2. Fix navigation target in `components/admin/user-filters.tsx` from `/users` to `/user-management`.
  3. Fix alias filter in `app/(admin)/vendor-management/page.tsx` from `profiles.is_verified` to `profile.is_verified`.
  4. Secure `app/admin/page.tsx` with server-side authentication redirect to `/admin-dashboard`.
  5. Add self-healing profile creation in `app/checkout/page.tsx` to prevent checkout bounce for newly registered users.
  6. Add optional chaining in `components/meals/meal-details.tsx` to guard against null vendor data.
- **Files Modified / Created:**
  - `app/accessibility/page.tsx` - Created accessibility info page.
  - `app/sitemap/page.tsx` - Created platform sitemap page.
  - `components/admin/user-filters.tsx` - Updated navigation to `/user-management`.
  - `app/(admin)/vendor-management/page.tsx` - Fixed PostgREST filter alias.
  - `app/admin/page.tsx` - Added server-side auth guard redirecting to `/admin-dashboard`.
  - `app/checkout/page.tsx` - Added self-healing profile fallback for checkout.
  - `components/meals/meal-details.tsx` - Guarded vendor link with optional chaining.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - Route Scans: Automated regex audit scripts confirmed 0 invalid hrefs, 0 invalid router pushes, and 0 invalid fetch endpoints across the entire codebase.
  - TypeScript Compilation: `npx tsc --noEmit` passed with 0 errors.
  - Test Suite: `npm test` passed 10/10 test suites (117/117 unit tests passed).
  - Production Build: `npm run build` completed with code 0 (all 98 static/dynamic routes compiled).

---

### [2026-10-13] - Pre-Push Bug Fixes & Production Risk Remediation

- **Date & Time:** 2026-10-13 22:05 IST
- **Objective:** Fix 2 confirmed bugs (Skip-day invalid extension date loop guard and Admin user search filter injection) and 3 production risks (standardize admin verification guard, guard JSON request parsing against malformed payloads, document rate limiting strategy) before pushing to main branch.
- **Implementation Plan:**
  1. Fix Bug 1 in `app/api/subscriptions/[id]/skip-day/route.ts`: guard `found` flag after the 14-day loop to prevent writing corrupted extension dates, and safely wrap `request.json()`.
  2. Fix Bug 2 in `app/(admin)/user-management/page.tsx`: sanitize `search` param to prevent PostgREST `.or()` injection.
  3. Fix Risk 3 in `app/api/admin/partners/verify/route.ts`: replace manual auth with `requireAdmin()` to respect suspended account status.
  4. Fix Risk 4 across target API routes (`skip-day`, `partners/verify`, `users/[id]/status`, `orders`): wrap `request.json()` with `.catch(() => ({}))`.
  5. Document Risk 5 in `lib/utils/rate-limit.ts` for future Redis scaling.
- **Files Modified / Created:**
  - `app/api/subscriptions/[id]/skip-day/route.ts` - Guarded `found` flag and protected JSON parsing.
  - `app/(admin)/user-management/page.tsx` - Sanitized search string against PostgREST injection.
  - `app/api/admin/partners/verify/route.ts` - Replaced manual auth check with `requireAdmin()` and protected JSON parsing.
  - `app/api/admin/users/[id]/status/route.ts` - Protected JSON parsing.
  - `app/api/orders/route.ts` - Protected JSON parsing.
  - `lib/utils/rate-limit.ts` - Added Redis scaling architectural documentation.
  - `docs/CHANGES_LOG.md` - Added implementation log entry.
- **Status:** Completed
- **Verification / Testing:**
  - TypeScript Compilation: `npx tsc --noEmit` passed with 0 errors.
  - Test Suite: `npm test` passed 10/10 test suites (117/117 unit tests passed).
  - Production Build: `npm run build` completed with code 0 (all 96 routes compiled and static pages generated).

---

### [2026-10-13] - Fix Customer Dashboard Blank View & Profile Settings Access for Google OAuth Users

- **Date & Time:** 2026-10-13 02:15 IST
- **Objective:** Fix the issue where logging in via Google OAuth caused the Customer Dashboard middle section to render blank and prevented navigation to Profile Settings (`/profile`).
- **Root Cause:**
  1. `app/api/auth/callback/route.ts` attempted to insert `phone_verified: false` into `profiles` during OAuth signup. Because `phone_verified` does not exist in the remote Supabase `profiles` table schema, PostgREST returned error `PGRST204`, silently preventing profile creation.
  2. Because the user had no row in `profiles`, `app/(customer)/layout.tsx` and `app/(customer)/profile/page.tsx` called `redirect('/login')` whenever the user loaded `/dashboard` or `/profile`, aborting customer page rendering while the root layout header remained visible.
- **Implementation Plan:**
  1. Fix `app/api/auth/callback/route.ts`: remove reference to non-existent `phone_verified` column, use `.upsert({ onConflict: 'id' })`, and save `avatar_url` from Google metadata.
  2. Remove non-existent `phone_verified` insertion from `app/api/auth/create-profile/route.ts`.
  3. Add self-healing logic to `app/(customer)/layout.tsx`: automatically create the customer profile row if an authenticated user lands on the customer route without one, and redirect non-customer roles (`vendor`, `delivery`, `admin`) to their respective dashboards.
  4. Harden `app/(customer)/dashboard/page.tsx`: use `.maybeSingle()` and wrap data queries (`customerSub`, `topMeals`) in fallback blocks so query hiccups never cause a blank screen.
  5. Harden `app/(customer)/profile/page.tsx`: use `.maybeSingle()` with self-healing profile generation.
  6. Backfill missing profile records in the Supabase database for existing OAuth users (`ayushgit10@gmail.com` and `ayushx189@gmail.com`).
- **Files Modified / Created:**
  - `app/api/auth/callback/route.ts` - Fixed profile upsert for OAuth users without invalid columns.
  - `app/api/auth/create-profile/route.ts` - Removed reference to non-existent `phone_verified` column.
  - `app/(customer)/layout.tsx` - Added profile self-healing and role-based routing.
  - `app/(customer)/dashboard/page.tsx` - Replaced `.single()` with `.maybeSingle()`, added query fallbacks and safe name extraction.
  - `app/(customer)/profile/page.tsx` - Replaced `.single()` with `.maybeSingle()` and self-healing profile fallback.
  - `docs/CHANGES_LOG.md` - Added documentation entry.
- **Status:** Completed
- **Verification / Testing:**
  - Database verification: Upserted profile records directly for `ayushgit10@gmail.com` and `ayushx189@gmail.com`.
  - Typecheck: `npx tsc --noEmit` passed with 0 errors.
  - Test suites: `npm test` passed 10/10 test suites (117/117 unit tests).
  - Production build: `npm run build` passed with exit code 0 (all 96 static/dynamic routes compiled).

---

### [2026-10-13] - Production Authentication Hardening: Purged Mock OTPs & Secured Google + Email/Mobile Auth

- **Date & Time:** 2026-10-13 00:37 IST
- **Objective:** Eliminate security risks and protect the deployed production application by purging all mock/trial OTP endpoints (`123456`) and backdoor logic. Securely configure 1-tap Google (Gmail) OAuth alongside standard bcrypt-encrypted Email authentication and capture mobile numbers as verified delivery contact info without paid SMS gateway dependencies.
- **Implementation Plan:**
  1. Purge all mock authentication files: deleted `app/api/auth/phone/` and `components/auth/phone-otp-form.tsx`.
  2. Restore strict security checks in `app/api/auth/create-profile/route.ts` to prevent any unverified account creation.
  3. Overhaul `components/auth/register-form.tsx` for customers with 1-tap Google Sign-up, Full Name, Email Address, Mobile Number (stored in `profiles.phone` for delivery coordination with `+91` validation), and encrypted Password.
  4. Harden `components/auth/login-form.tsx` with 1-tap Google Sign-In and standard secure Email + Password login, with role-based dashboard redirects.
  5. Run compilation typecheck (`npx tsc --noEmit`), execute complete Jest test suite (`npm test`), and verify pages visually in the browser.
- **Files Modified / Created / Deleted:**
  - `app/api/auth/phone/route.ts` - Deleted (removed mock OTP endpoint).
  - `components/auth/phone-otp-form.tsx` - Deleted (removed simulated test OTP banner & form).
  - `components/auth/register-form.tsx` - Added Google Sign-up and clean customer mobile contact registration.
  - `components/auth/login-form.tsx` - Hardened production login with Google and Email + Password.
  - `app/(auth)/register/page.tsx` - Updated to render production `RegisterForm`.
  - `app/api/auth/create-profile/route.ts` - Hardened signup verification checks.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - `npx tsc --noEmit`: 0 TypeScript compilation errors.
  - `npm test`: 10/10 test suites passed, 117/117 unit tests passed with 0 failures.
  - Browser verification: Captured clean screenshots of `/register` and `/login` confirming zero mock banners and seamless layout.

---

### [2026-10-13] - Google (Gmail) OAuth & Zero-Cost Phone Auth (Twilio-Free Mode)

- **Date & Time:** 2026-10-13 00:26 IST
- **Objective:** Eliminate expensive Twilio SMS dependency by adding free 1-tap Google (Gmail) OAuth on registration and login, coupled with an intelligent zero-cost phone authentication server route supporting dev test mode (`123456`) and auto-provisioned sessions.
- **Implementation Plan:**
  1. Create reusable `GoogleSignInButton` component (`components/auth/google-sign-in-button.tsx`) with light and dark mode variants, Google brand icon, and direct Supabase OAuth integration.
  2. Update auth callback route (`app/api/auth/callback/route.ts`) to auto-provision `customer` profiles in `public.profiles` for new Google sign-ups and route users to their role-specific dashboards.
  3. Create dedicated zero-cost phone auth server route (`app/api/auth/phone/route.ts`) that bypasses external paid SMS gateways with simulated test OTP (`123456`), auto-confirms new users via service role client, and establishes client sessions via magic link tokens.
  4. Overhaul `components/auth/phone-otp-form.tsx` and `components/auth/login-form.tsx` with prominent Google Sign-in buttons, test OTP banners with 1-click Auto-fill, and dual Mobile OTP / Email tabs.
  5. Verify end-to-end in browser via subagent and validate typecheck (`npx tsc --noEmit`) and unit tests (`npm test`).
- **Files Modified / Created:**
  - `components/auth/google-sign-in-button.tsx` - Created Google OAuth button.
  - `app/api/auth/callback/route.ts` - Auto-provisioned profiles for new OAuth users.
  - `app/api/auth/phone/route.ts` - Created zero-cost phone auth handler without Twilio.
  - `components/auth/phone-otp-form.tsx` - Added Google button and dev test OTP mode with 1-click auto-fill.
  - `components/auth/login-form.tsx` - Added Google button and integrated Mobile OTP + Email login.
  - `docs/CHANGES_LOG.md` - Added documentation entry.
- **Status:** Completed
- **Verification / Testing:**
  - `npx tsc --noEmit`: 0 TypeScript errors.
  - `npm test`: 10/10 test suites passed (117/117 tests).
  - Browser subagent verified live OTP send, auto-fill, and transition to account setup.

---

### [2026-10-12] - Mobile Number OTP Authentication & Customer Registration Redesign

- **Date & Time:** 2026-10-12 23:25 IST
- **Objective:** Redesign customer registration into an industry-standard, mobile-first OTP flow (Swiggy / Zomato pattern) with phone verification before password setup, while adding a dual Mobile OTP / Email tab switcher to the login experience.
- **Implementation Plan:**
  1. Add database migration (`supabase/migrations/004_phone_auth.sql`) introducing `phone_verified` boolean and unique partial index on `phone` for fast lookups.
  2. Create 3-step phone OTP registration component (`components/auth/phone-otp-form.tsx`): Phone entry with validation, 6-digit OTP verification with countdown timer & resend, and account details setup (Name, optional Email, Password).
  3. Route customer signups on `/register` to the phone-first OTP flow while retaining multi-step onboarding for vendor and delivery partner roles.
  4. Redesign login screen (`components/auth/login-form.tsx`) with segmented tab switcher: Mobile OTP login (default) alongside Email + Password login.
  5. Update `app/api/auth/create-profile/route.ts` and database TypeScript types (`types/database.types.ts`) to support phone-only registrations with optional email and `phone_verified` tracking.
  6. Verify type safety (`npx tsc --noEmit`) and run full regression test suite (`npm test`).
- **Files Modified / Created:**
  - `supabase/migrations/004_phone_auth.sql` - Added `phone_verified` column and index on `phone`.
  - `components/auth/phone-otp-form.tsx` - Created 3-step phone OTP customer registration form.
  - `app/(auth)/register/page.tsx` - Routed customer registrations to `PhoneOtpForm`.
  - `components/auth/login-form.tsx` - Added Phone OTP tab as primary login method with Email tab fallback.
  - `app/api/auth/create-profile/route.ts` - Made email optional and added `phoneVerified` handling.
  - `types/database.types.ts` - Updated profile types for optional email and `phone_verified`.
  - `app/(admin)/admin-dashboard/users/user-management.tsx` - Handled nullable email in user management table.
  - `docs/CHANGES_LOG.md` - Added documentation entry.
- **Status:** Completed
- **Verification / Testing:**
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm test`: 10/10 test suites passed, 117/117 unit tests passed with 0 failures.

---

### [2026-10-11] - Customer Delivery Address Overhaul: Flat No, Landmark, PIN Code & GPS Auto-Detection

- **Date & Time:** 2026-10-11 23:58 IST
- **Objective:** Overhaul the customer address management page (`components/profile/address-manager.tsx` and `app/(customer)/profile/page.tsx`). Remove confusing raw Latitude/Longitude input fields and replace them with standard Indian delivery address fields (Flat/House No, Building/Society Name, Street/Area, Landmark, PIN Code, Address Type, Contact Info) plus a 1-click GPS auto-detect button with background coordinates and floating dock padding (`pb-32`).
- **Implementation Plan:**
  1. Revamp `AddressManager` in `components/profile/address-manager.tsx` with structured Indian delivery address fields:
     - House/Flat/Room No. (`house_no`)
     - Apartment/Society/Building Name (`building_name`)
     - Street/Colony/Area (`street`)
     - Landmark (`landmark`)
     - City, State, and 6-digit PIN Code (`zip_code`)
     - Address Tag (Home, Work, Other)
     - Receiver contact name & phone
  2. Integrate one-click "Use Current GPS Location" button using `getAccurateLocation` to automatically fill locality, street, city, state, pincode, and coordinates in the background.
  3. Remove manual raw latitude and longitude number inputs from customer view, keeping coordinates safely populated in the background payload for delivery radius calculations.
  4. Format the saved address display card with clear visual hierarchy, badges, and icon indicators.
  5. Add `pb-32` bottom padding to `app/(customer)/profile/page.tsx` so the floating bottom navigation bar never obstructs buttons or inputs.
  6. Verify with `npx tsc --noEmit` and `npm test`.
- **Files Modified / Created:**
  - `components/profile/address-manager.tsx` - Completely overhauled with complete address fields and GPS auto-fill.
  - `app/(customer)/profile/page.tsx` - Added floating nav bottom padding.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm test`: 10/10 test suites passed, 117/117 unit tests passed with 0 failures.

---

### [2026-10-11] - Custom Delivery Time AM/PM Controls & Time-of-Day Note (Morning/Afternoon/Night)

- **Date & Time:** 2026-10-11 23:08 IST
- **Objective:** Enable clear AM / PM selection for custom delivery break slots in the cart, eliminating native 24-hour browser ambiguities (e.g. typing 02:00 defaulting to 02:00 AM). In addition, display contextual time-of-day indicators (Morning, Afternoon, Evening, Night) beside and below the selected time slot.
- **Implementation Plan:**
  1. Add `getTimeOfDayInfo` utility in `lib/utils/format.ts` to identify whether a slot is Morning, Afternoon, Evening, or Night, along with appropriate badges, icons, and meal context.
  2. Implement interactive 12-hour hour/minute controls and explicit `[ AM ] [ PM ]` segmented toggle buttons for custom break time selection in `components/cart/cart-item.tsx`.
  3. Display a dedicated note beside/below the chosen delivery slot showing the time-of-day period (Morning, Afternoon, Evening, or Night) for both quick slots and custom time slots.
  4. Ensure both Daily lunch break slots and Weekly/Monthly preference time inputs support the AM/PM toggle and time-of-day notes.
  5. Run tests and type-checks (`npm test`, `npx tsc --noEmit`) to verify 0 regressions.
- **Files Modified / Created:**
  - `lib/utils/format.ts` - Added `getTimeOfDayInfo` utility detecting Morning, Afternoon, Evening, Night, or Late Night with icons and styling classes.
  - `components/cart/cart-item.tsx` - Replaced raw 24-hr time input with 12-hour hour/minute dropdowns, explicit `[ AM ] [ PM ]` segmented toggle buttons, and dynamic Morning/Afternoon/Night notes beside and below the slot.
  - `components/checkout/order-summary.tsx` - Added time-of-day badge (`☀️ Morning`, `🌤️ Afternoon`, `🌙 Night`) in checkout line review.
  - `components/checkout/checkout-form.tsx` - Added time-of-day period label in celebration dialog target break slot.
  - `__tests__/lib/utils/format.test.ts` - Added 5 unit tests for `getTimeOfDayInfo` time slot classifications.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm test`: 4 test suites passed, 52/52 tests passed with 0 failures.

---

### [2026-10-11] - Option A: Clean Whole Rupee Pricing Standard & Price Parity

- **Date & Time:** 2026-10-11 20:20 IST
- **Objective:** Fix price discrepancy between Explore menu card (e.g. ₹149.78 / ₹198.97) and Shopping Bag / Cart Summary (₹150 / ₹199) that caused customer confusion and fraud concerns. Implement Option A (Clean Whole Rupee standard) across the database, service queries, and cart computations.
- **Implementation Plan:**
  1. Update live Supabase database records for active meals (`biryani` from 149.78 to 150, `Ramen` from 198.97 to 199).
  2. Normalize meal prices in backend services (`lib/services/meal-service.ts` and `lib/services/vendor-service.ts`) using `Math.round(Number(price) || 0)`.
  3. Enforce clean integer pricing in `lib/contexts/cart-context.tsx` (`getItemPricing`, `addItem`, and localStorage deserialization).
  4. Standardize currency display across components (`components/cart/cart-item.tsx`, `components/cart/cart-summary.tsx`) by using the central `@/lib/utils/format` utility.
  5. Run test suite and TypeScript verification. Keep changes local on branch `remove/persona-switcher` without pushing to GitHub.
- **Files Modified / Created:**
  - `lib/services/meal-service.ts` - Normalized `price` and `discount_price` with `Math.round` in `getMeals` and `getMealById`.
  - `lib/services/vendor-service.ts` - Normalized meal prices in `getVendorMeals`.
  - `lib/contexts/cart-context.tsx` - Enforced whole-rupee math in `getItemPricing`, `addItem`, and storage hydration.
  - `components/cart/cart-item.tsx` - Replaced local duplicate formatter with shared `formatCurrency`.
  - `components/cart/cart-summary.tsx` - Replaced local duplicate formatter with shared `formatCurrency`.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - `npm test`: 4 test suites passed, 47 tests passed with 0 failures.
  - `npx tsc --noEmit`: Completed with 0 type errors.
  - Supabase live database verification: `biryani` confirmed at ₹150, `Ramen` confirmed at ₹199.

---

### [2026-10-11] - Multi-Vendor Cart Crash Fix & Smart "Replace & Add" Modal

- **Date & Time:** 2026-10-11 19:03 IST
- **Objective:** Fix the fatal React error boundary crash ("This page couldn't load") when adding a meal from a second home kitchen, and implement a smart, Swiggy/Zomato-style "Replace & Add" dialog so users can seamlessly switch home kitchens with one tap.
- **Implementation Plan:**
  1. Remove `throw new Error` from inside React's `setCart` state updater callback in `lib/contexts/cart-context.tsx` to stop unhandled background exceptions from unmounting the page.
  2. Implement synchronous conflict detection in `addItem` returning `{ success, conflict }` and expose `clearAndAddItem` in `useCart`.
  3. Integrate an interactive confirmation `Dialog` in `MealCard` giving the user clear choices: "Keep Current Bag" or "Replace & Add".
  4. Update `AddToCartButton` to handle conflicts cleanly without crashing.
- **Files Modified / Created:**
  - `lib/contexts/cart-context.tsx` - Replaced fatal `throw` in state updater with synchronous conflict detection, `AddItemResult`, and `clearAndAddItem`.
  - `components/meals/meal-card.tsx` - Added interactive vendor conflict dialog with 1-click "Replace & Add" action.
  - `components/meals/add-to-cart-button.tsx` - Handled conflict result gracefully without throwing.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - `npm test`: All unit tests passed.
  - `npm run build`: Compiled with Turbopack and generated all 113 routes with 0 errors.

---

### [2026-10-11] - Quick Add to Cart & Student/Worker Lunch Break Delivery Slot

- **Date & Time:** 2026-10-11 18:27 IST
- **Objective:** Enable direct 1-click addition of meals to the cart from the Explore page (`+` icon on meal cards) without navigating to the meal details page, and add a dedicated lunch break delivery time slot picker for Daily orders tailored for students and working professionals.
- **Implementation Plan:**
  1. Add `onClick` quick-add handling to the `+` button in `MealCard` with `e.preventDefault()` / `e.stopPropagation()`, cart context integration, instant feedback micro-interaction (check animation & toast), and error handling for multi-vendor conflicts.
  2. Provide a fallback in `useCartContext` to protect isolated renders and tests.
  3. Introduce curated student and worker lunch break slots (`12:00-12:30 PM`, `12:30-01:00 PM`, `01:00-01:30 PM`, `01:30-02:00 PM`, `07:30-08:30 PM`, and custom break times) visible on Daily orders in `CartItem`.
  4. Display the selected lunch break slot during checkout summary and order celebration.
  5. Expand unit tests in `meal-card.test.tsx` to verify quick-add button presence and disabled state when sold out.
- **Files Modified / Created:**
  - `components/meals/meal-card.tsx` - Added 1-click quick add with check animation and toast notifications, preventing parent link navigation.
  - `components/cart/cart-item.tsx` - Added dedicated Daily lunch break delivery slot selector with quick break pills and custom time input.
  - `components/checkout/order-summary.tsx` - Added delivery slot badge in item line review.
  - `components/checkout/checkout-form.tsx` - Updated celebration screen to show target break slot for daily orders.
  - `lib/contexts/cart-context.tsx` - Provided safe fallback context when rendered outside CartProvider.
  - `__tests__/components/meal-card.test.tsx` - Added unit tests for quick-add button and stock availability.
  - `docs/CHANGES_LOG.md` - Recorded changes.
- **Status:** Completed
- **Verification / Testing:**
  - `npm test`: 10 suites passed, 112 tests passed.
  - `npm run build`: All 96 routes compiled and statically rendered successfully with zero errors.

---

### [2026-10-10] - Customer Dashboard UI Compactness & Food-First Elevation

- **Date & Time:** 2026-10-10T15:45:00+05:30
- **Objective:** Fix the oversized customer dashboard banner which occupied the entire viewport and forced users to scroll down past a cold dark screen to see meals. Streamline header height to < 140px, add quick category filter chips, and bring trending food items above the fold.
- **Implementation Plan:**
  1. Replace the full-screen terminal hero banner in `app/(customer)/dashboard/page.tsx` with a warm, compact, appetizing header featuring personal user greeting and inline quick actions.
  2. Streamline `customer-search.tsx` by eliminating excessive 80px bottom margin (`mb-20`), reducing input height, and adding horizontal category pills (Daily Thali, Biryani, Curries, Paratha, Healthy).
  3. Ensure `TopMealsSection` appears immediately below search above the fold on standard desktop viewports.
  4. Fix profile name property typing from `full_name` to `name`.
- **Files Modified / Created:**
  - `app/(customer)/dashboard/page.tsx` - Replaced bulky black hero with compact food-centric header and reduced vertical grid spacing.
  - `app/(customer)/dashboard/customer-search.tsx` - Compacted search bar and added quick category filter chips.
- **Status:** Completed
- **Verification / Testing:** Tested with `npm run build` — compiled successfully with Turbopack, passed TypeScript checks, and generated all 113 static pages with 0 errors.

---

### [2026-10-10] - Subscriber-Exclusive Feature Gating (Kitchen Circle & Tomorrow's Menu)

- **Date & Time:** 2026-10-10T01:13:43+05:30
- **Objective:** Restrict access to the live Kitchen Circle chef broadcast and Tomorrow's Menu preview so only customers with an active weekly or monthly subscription can access them, while non-subscribers see an upgrade prompt.
- **Implementation Plan:**
  1. Query active subscription status for the authenticated customer in `app/(customer)/dashboard/page.tsx`.
  2. Conditionally mount `EmbeddedKitchenCircle` only when `hasActiveSubscription` is true.
  3. Provide an upgrade/call-to-action prompt for non-subscribed users.
- **Files Modified / Created:**
  - `app/(customer)/dashboard/page.tsx` - Added subscription validation check for Kitchen Circle module.
- **Status:** Completed
- **Verification / Testing:** Verified in preview deployment and local typecheck.

---

### [2026-10-09] - Vercel Next.js 16 Static Build & Supabase Middleware Hardening

- **Date & Time:** 2026-10-09T21:51:52+05:30
- **Objective:** Fix Vercel build failures caused by missing Supabase credentials during static page prerendering (`/meals/[id]`), and protect Next.js middleware against missing runtime environment variables.
- **Implementation Plan:**
  1. Add safe dummy/fallback environment variable handling in `lib/supabase/server.ts` and `lib/supabase/client.ts` during static build worker runs.
  2. Update `lib/supabase/middleware.ts` to exit early on static assets and public routes to prevent unnecessary network roundtrips.
  3. Resolve Next.js 16 ESLint and dependency alerts.
- **Files Modified / Created:**
  - `lib/supabase/server.ts` - Safe fallback client initialization during static builds.
  - `lib/supabase/client.ts` - Safe client fallback handling.
  - `lib/supabase/middleware.ts` - Early exit routing for public assets.
  - `package-lock.json` - Security patch update.
- **Status:** Completed
- **Verification / Testing:** `npm run build` passed on Vercel deployment preview.

---

### [2026-10-09] - Multi-Persona Switcher Dock Removal for Production

- **Date & Time:** 2026-10-09T19:11:00+05:30
- **Objective:** Remove the floating developer persona emulation dock and simulator launcher from the root layout to prepare the application for real customer and partner presentation.
- **Implementation Plan:**
  1. Identify root layout mount points for the persona dock.
  2. Remove `MultiPersonaSwitcher` component from `app/layout.tsx`.
  3. Preserve API routes and standalone test pages for headless access.
- **Files Modified / Created:**
  - `app/layout.tsx` - Removed floating Persona Switcher component.
- **Status:** Completed
- **Verification / Testing:** Clean layout verified across all authenticated views.
