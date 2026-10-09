# 🔧 Rasan - Developer Quick Reference

Quick reference for common development tasks.

---

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Testing (when implemented)
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI

# Database (Supabase CLI)
supabase db push         # Push migrations
supabase db pull         # Pull schema changes
supabase db reset        # Reset database
supabase gen types typescript --local > types/database.types.ts
```

---

## 📁 Project Structure

```
rasan/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth pages (login, register)
│   ├── (customer)/     # Customer dashboard
│   ├── (vendor)/       # Vendor dashboard
│   ├── (delivery)/     # Delivery partner dashboard
│   ├── (admin)/        # Admin dashboard
│   ├── api/            # API routes
│   └── ...             # Public pages
├── components/          # React components
│   ├── ui/             # Base UI components
│   └── ...             # Feature components
├── lib/                # Utilities
│   ├── supabase/       # Supabase clients
│   ├── services/       # Business logic
│   ├── hooks/          # Custom hooks
│   └── utils/          # Helper functions
└── types/              # TypeScript types
```

---

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

---

## 🗄️ Database Quick Reference

### Tables
- `profiles` - User profiles
- `vendors` - Vendor information
- `meals` - Meal listings
- `orders` - Order records
- `delivery_partners` - Delivery partner info
- `subscriptions` - Subscription plans
- `reviews` - Reviews and ratings
- `notifications` - In-app notifications
- `group_orders` - Group order data
- `categories` - Meal categories
- `plan_pricing` - Subscription pricing

### Common Queries

```typescript
// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Get meals with filters
const { data: meals } = await supabase
  .from('meals')
  .select('*, vendors(*)')
  .eq('is_available', true)
  .order('rating', { ascending: false });

// Create order
const { data: order } = await supabase
  .from('orders')
  .insert({
    customer_id: userId,
    vendor_id: vendorId,
    items: orderItems,
    total: totalAmount,
    status: 'pending',
  })
  .select()
  .single();

// Real-time subscription
const channel = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`,
  }, (payload) => {
    console.log('Order updated:', payload);
  })
  .subscribe();
```

---

## 🎨 UI Components

### Import Pattern
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Common Components
```typescript
// Button
<Button variant="default" size="md">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Input
<Input type="text" placeholder="Enter text" />

// Badge
<Badge variant="default">New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Error</Badge>
```

---

## 🔐 Authentication

### Get Current User
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client Component
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Protected Route
```typescript
// In page.tsx
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect('/login');
}

// Check role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'vendor') {
  redirect('/');
}
```

---

## 🛣️ Routing

### Page Routes
```typescript
// Static route
app/about/page.tsx → /about

// Dynamic route
app/meals/[id]/page.tsx → /meals/123

// Route groups (no URL segment)
app/(customer)/dashboard/page.tsx → /dashboard

// API route
app/api/meals/route.ts → /api/meals
```

### Navigation
```typescript
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Link component
<Link href="/meals">Browse Meals</Link>

// Programmatic navigation
const router = useRouter();
router.push('/checkout');
router.back();
```

---

## 📡 API Routes

### Basic Structure
```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Query database
  const { data, error } = await supabase
    .from('table')
    .select('*');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Handle POST request
}
```

---

## 🎣 Custom Hooks

### useCart
```typescript
import { useCart } from '@/lib/hooks/use-cart';

const { items, addItem, removeItem, updateQuantity, clearCart, total } = useCart();

// Add to cart
addItem({ id: '1', name: 'Meal', price: 299, quantity: 1 });

// Update quantity
updateQuantity('1', 2);

// Remove item
removeItem('1');

// Clear cart
clearCart();
```

### useAuth
```typescript
import { useAuth } from '@/lib/hooks/use-auth';

const { user, profile, loading, signOut } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <div>Not logged in</div>;

// Sign out
await signOut();
```

---

## 🎨 Styling

### Tailwind Classes
```typescript
// Layout
<div className="container mx-auto p-6">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flexbox
<div className="flex items-center justify-between">
<div className="flex flex-col gap-4">

// Responsive
<div className="text-sm md:text-base lg:text-lg">
<div className="hidden md:block">

// Colors (Rasan theme)
<div className="bg-primary text-white">
<div className="text-primary">
<div className="border-primary">

// States
<button className="hover:bg-primary/90 active:scale-95">
<input className="focus:ring-2 focus:ring-primary">
```

### Custom Colors
```typescript
// In Tailwind config
colors: {
  primary: '#FF5200',    // Orange
  secondary: '#1C1C1C',  // Dark Gray
  success: '#60B246',    // Green
  warning: '#FFC107',    // Yellow
  error: '#EF4444',      // Red
}
```

---

## 🔧 Utilities

### Format Functions
```typescript
import { formatCurrency, formatDate, formatDistance } from '@/lib/utils/format';

formatCurrency(299);           // ₹299.00
formatDate(new Date());        // Jan 1, 2024
formatDistance(1500);          // 1.5 km
```

### Validation
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const result = schema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

---

## 🐛 Debugging

### Console Logging
```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### Error Handling
```typescript
try {
  const result = await someAsyncFunction();
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly message
  toast.error('Something went wrong');
}
```

### Supabase Errors
```typescript
const { data, error } = await supabase.from('table').select('*');

if (error) {
  console.error('Supabase error:', error.message);
  console.error('Error code:', error.code);
  console.error('Error details:', error.details);
}
```

---

## 📱 Responsive Design

### Breakpoints
```typescript
// Tailwind breakpoints
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

### Mobile-First Approach
```typescript
// Default: mobile (320px+)
<div className="text-sm">

// Tablet and up
<div className="text-sm md:text-base">

// Desktop and up
<div className="text-sm md:text-base lg:text-lg">
```

---

## 🚀 Performance Tips

1. **Use Next.js Image**
```typescript
import Image from 'next/image';

<Image
  src="/meal.jpg"
  alt="Meal"
  width={400}
  height={300}
  priority={false} // Lazy load
/>
```

2. **Dynamic Imports**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

3. **React.memo**
```typescript
import { memo } from 'react';

export const MealCard = memo(({ meal }) => {
  // Component logic
});
```

4. **useMemo & useCallback**
```typescript
const sortedMeals = useMemo(() => {
  return meals.sort((a, b) => b.rating - a.rating);
}, [meals]);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

---

## 📚 Useful Links

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind Docs:** https://tailwindcss.com/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **React Docs:** https://react.dev

---

## 🆘 Common Issues

### Issue: Build fails
```bash
rm -rf .next
npm run build
```

### Issue: Types not found
```bash
supabase gen types typescript --local > types/database.types.ts
```

### Issue: Port in use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run dev
```

### Issue: Supabase connection error
- Check `.env.local` credentials
- Verify Supabase project is running
- Check RLS policies

---

**Quick Reference Last Updated:** Phase 4 Complete  
**For detailed guides, see:** README.md, QUICK_START.md, DEPLOYMENT_GUIDE.md
