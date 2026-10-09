# 🍲 Rasan — Hyperlocal Food Delivery Platform

> Connecting customers with local home chefs and restaurants for delicious, homemade meals — inspired by Swiggy & Zomato, built for India.

**Version:** 1.0.0 | **Status:** 🟢 Production Ready | **Stack:** Next.js 16 · React 19 · Supabase · TypeScript

---

## ✨ Feature Overview

### 🛍️ Customer
| Feature | Description |
|---|---|
| Browse & Search | Advanced filters by meal type, dietary preference, and category |
| Smart Cart | Multi-vendor cart with real-time price breakdowns |
| Secure Checkout | Razorpay, Stripe, Cash on Delivery, UPI |
| Live Order Tracking | Real-time status updates with doorstep OTP/PIN handover |
| Tiffin Subscriptions | Daily / Weekly / Monthly flexible meal plans |
| Group Orders | Collaborative ordering with shareable invite links |
| Reviews & Ratings | Rate meals and vendors post-delivery |

### 👨‍🍳 Vendor / Home Chef
| Feature | Description |
|---|---|
| Dashboard | Analytics, revenue split, active orders |
| Menu Management | Add/edit meals with nutritional info, allergens, and stock |
| Order Queue | Real-time order feed with audio alert on new orders |
| Broadcasts | Send promotional messages to subscribed customers |
| Payouts | Settlement requests and earnings tracking |

### 🛵 Delivery Partner
| Feature | Description |
|---|---|
| Order Dispatch | Real-time available order feed and claim system |
| Active Delivery | Route navigation + doorstep OTP verification |
| Earnings | Daily / Weekly / Monthly earnings tracker |
| Availability Toggle | Go online/offline on demand |

### 🛡️ Admin
| Feature | Description |
|---|---|
| Mission Control | Platform GMV, revenue splits (25% Rasan / 75% vendors), anomaly detection |
| User Management | Manage customers, vendors, and delivery partners |
| Vendor & Rider Verification | Approve, reject, or suspend partners |
| Live Ops | Broadcast alerts, support tickets, refund ledger |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 with App Router & Server Components |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 with custom design tokens |
| **UI Primitives** | Radix UI + Lucide Icons |
| **Database** | PostgreSQL via Supabase (PostGIS for geospatial) |
| **Auth** | Supabase Auth (email/password, RBAC, RLS) |
| **Real-time** | Supabase Realtime subscriptions |
| **Storage** | Supabase Storage (meal images, avatars) |
| **Payments** | Razorpay (India) + Stripe (International) |
| **Maps** | PostGIS spatial queries + Leaflet |
| **Validation** | Zod + React Hook Form |
| **Charts** | Recharts |
| **Testing** | Jest (unit) + Playwright (E2E) |
| **Deployment** | Vercel + Supabase Cloud |

---

## 🗄️ Database Schema (12 Tables)

```
profiles          -> User profiles with roles (customer/vendor/delivery/admin)
vendors           -> Home chef / restaurant listings (PostGIS location)
meals             -> Meal catalog with nutritional info & allergens
delivery_partners -> Rider profiles with vehicle & earnings data
orders            -> Order records with tracking_updates JSONB
subscriptions     -> Recurring tiffin plans
reviews           -> Meal & vendor ratings
notifications     -> In-app real-time notifications
group_orders      -> Shared cart sessions
categories        -> Meal categories
plan_pricing      -> Subscription plan pricing matrix
```

RLS (Row Level Security) is enforced on every table.
Full schema: `supabase/migrations/001_initial_schema.sql`

---

## 📂 Project Structure

```
rasan/
├── app/
│   ├── (auth)/              # Login, Register, Password Reset
│   ├── (customer)/          # Dashboard, Orders, Subscriptions, Profile
│   ├── (vendor)/            # Vendor Dashboard, Menu, Analytics, Payouts
│   ├── (delivery)/          # Delivery Dashboard, Active Orders, Earnings
│   ├── (admin)/             # Admin Dashboard, User/Vendor/Delivery Mgmt
│   ├── api/                 # 20+ API route groups (REST endpoints)
│   ├── meals/               # Public meal browsing
│   ├── vendors/             # Public vendor discovery
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout flow
│   └── group-order/         # Group ordering session
├── components/              # Feature-scoped React components (23 domains)
├── lib/
│   ├── supabase/            # Client, Server, Middleware helpers
│   ├── services/            # Business logic (order, meal, vendor, payment)
│   ├── hooks/               # useAuth, useCart, useLocation, useToast
│   ├── contexts/            # CartContext
│   └── utils/               # format, distance, validation, cache, rate-limit
├── types/                   # Global TypeScript types + DB generated types
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── functions/           # Edge functions
├── __tests__/               # Jest unit tests
└── e2e/                     # Playwright E2E tests
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (https://supabase.com)
- A Razorpay account (for payments)
- Stripe account (optional, for international payments)

### 1. Clone the repository
```bash
git clone https://github.com/Ayush-wattakhare/rasan.git
cd rasan
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your credentials:
```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Run Supabase migrations
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 5. Start the dev server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🧪 Testing

```bash
npm run test            # Jest unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:ui     # E2E with interactive UI
```

---

## 🚢 Deployment (Vercel)

1. Push to GitHub: `git push origin main`
2. Go to vercel.com → Import Project → select `rasan`
3. Add all variables from `.env.local` in Project Settings → Environment Variables
4. Deploy!

Full deployment guide: `DEPLOYMENT_GUIDE.md`

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#FF5200` (Orange) |
| Secondary | `#1C1C1C` (Dark Slate) |
| Success | `#60B246` (Green) |
| Warning | `#FFC107` (Amber) |
| Error | `#EF4444` (Red) |
| Font | Inter (Google Fonts) |

Full guide: `DESIGN_SYSTEM_GUIDE.md`

---

## 🔐 Security

- **Row Level Security (RLS)** on all Supabase tables
- **RBAC middleware** — routes are protected by role at the server level
- **Input validation** with Zod schemas on every API route
- **Rate limiting** on auth and payment endpoints
- **OTP/PIN handover** for delivery confirmation
- `.env.local` is gitignored — no secrets committed

---

## 📜 Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run format       # Prettier (auto-fix)
npm run type-check   # TypeScript check (no emit)
npm run test         # Jest unit tests
npm run test:e2e     # Playwright E2E tests
```

---

## 📄 License

This project is **private and proprietary**. All rights reserved © 2026 Rasan.

---

**Built with ❤️ by Ayush Wattakhare (https://github.com/Ayush-wattakhare)**
