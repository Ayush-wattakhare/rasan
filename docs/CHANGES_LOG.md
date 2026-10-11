# Project Changes & Implementation Log

This document maintains a dated, chronological record of all features, fixes, architectural plans, and code changes in the Rasan platform.

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
