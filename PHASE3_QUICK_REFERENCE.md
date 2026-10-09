# Phase 3: Quick Reference Guide

## 🎯 Complete Customer Journey Flow

```
1. BROWSE → 2. DETAIL → 3. CART → 4. CHECKOUT → 5. PAY → 6. TRACK
   /meals     /meals/[id]   /cart     /checkout    Payment   /orders/[id]
```

## 📁 File Structure Overview

### Authentication
```
app/(auth)/
├── login/page.tsx              # Login page
├── register/page.tsx           # Registration page
└── layout.tsx                  # Auth layout

components/auth/
├── login-form.tsx              # Login form component
└── register-form.tsx           # Registration form component

middleware.ts                   # Route protection
lib/supabase/middleware.ts      # Auth middleware logic
```

### Meals
```
app/meals/
├── page.tsx                    # Meals listing
└── [id]/page.tsx              # Meal detail

components/meals/
├── meal-grid.tsx              # Grid layout
├── meal-card.tsx              # Individual card
├── meal-details.tsx           # Detail view (ENHANCED)
├── meal-filters.tsx           # Filter sidebar
├── search-input.tsx           # Search bar
├── sort-dropdown.tsx          # Sort options
├── add-to-cart-button.tsx     # Add to cart
└── nutritional-info.tsx       # Nutrition display
```

### Cart
```
app/cart/page.tsx              # Cart page

components/cart/
├── cart-drawer.tsx            # Slide-in cart
├── cart-item.tsx              # Cart item
├── cart-summary.tsx           # Price summary
└── quantity-selector.tsx      # +/- controls

lib/hooks/use-cart.ts          # Cart state management
```

### Checkout
```
app/checkout/page.tsx          # Checkout page

components/checkout/
├── checkout-form.tsx          # Main form (ENHANCED)
├── delivery-address-section.tsx
├── payment-method-selector.tsx
└── order-summary.tsx
```

### Orders
```
app/(customer)/orders/
├── page.tsx                   # Orders list
└── [id]/page.tsx             # Order detail

components/orders/
├── order-list.tsx            # List view
├── order-card.tsx            # Order card
├── order-tracker.tsx         # Status tracker
├── order-details.tsx         # Detail view
├── order-filters.tsx         # Filter options
└── status-timeline.tsx       # Timeline
```

### Services
```
lib/services/
├── order-service.ts          # Order logic
├── payment-service.ts        # Payment logic
├── meal-service.ts           # Meal logic
└── vendor-service.ts         # Vendor logic
```

### API Routes
```
app/api/
├── orders/route.ts           # Create/list orders
├── payments/
│   ├── create-order/route.ts # Create payment
│   └── verify/route.ts       # Verify payment
└── meals/
    └── [id]/route.ts         # Meal operations
```

## 🔑 Key Components Usage

### 1. Authentication

#### Login
```tsx
import { LoginForm } from '@/components/auth/login-form';

<LoginForm />
```

#### Register
```tsx
import { RegisterForm } from '@/components/auth/register-form';

<RegisterForm />
```

### 2. Add to Cart
```tsx
import { AddToCartButton } from '@/components/meals/add-to-cart-button';

<AddToCartButton
  meal={{
    id: meal.id,
    vendor_id: meal.vendor_id,
    name: meal.name,
    price: meal.price,
    image_url: meal.image_url,
    is_veg: meal.is_vegetarian,
    is_available: meal.is_available,
    stock: meal.stock,
  }}
  size="lg"
  showQuantity={true}
/>
```

### 3. Cart Hook
```tsx
import { useCart } from '@/lib/hooks/use-cart';

const { cart, addItem, updateQuantity, removeItem, clearCart, itemCount } = useCart();

// Add item
addItem({
  meal_id: 'meal-id',
  vendor_id: 'vendor-id',
  name: 'Meal Name',
  price: 250,
  quantity: 1,
  is_veg: true,
});

// Update quantity
updateQuantity('meal-id', 2);

// Remove item
removeItem('meal-id');

// Clear cart
clearCart();
```

### 4. Order Service
```tsx
import { orderService } from '@/lib/services/order-service';

// Create order
const order = await orderService.createOrder(orderData);

// Get orders
const orders = await orderService.getOrders({ customer_id: userId });

// Update status
await orderService.updateOrderStatus(orderId, 'confirmed');

// Calculate totals
const { subtotal, tax, total } = orderService.calculateOrderTotals(
  items,
  deliveryFee,
  discount
);
```

### 5. Payment Service
```tsx
import { paymentService } from '@/lib/services/payment-service';

// Create Razorpay order
const paymentOrder = await paymentService.createRazorpayOrder({
  amount: total,
  currency: 'INR',
  orderId: order.id,
});

// Verify payment
await paymentService.verifyPayment(
  { paymentId, orderId, signature },
  'razorpay'
);
```

## 🎨 UI Components

### Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">Click Me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Input
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="you@example.com" />
```

### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
```

## 🔐 Protected Routes

Routes automatically protected by middleware:

### Customer Routes
- `/dashboard` - Customer dashboard
- `/orders` - Order history
- `/orders/[id]` - Order details
- `/subscriptions` - Subscriptions
- `/profile` - Profile settings

### Vendor Routes
- `/vendor-dashboard` - Vendor dashboard
- `/menu-management` - Menu management
- `/vendor-orders` - Vendor orders
- `/analytics` - Analytics

### Delivery Routes
- `/delivery-dashboard` - Delivery dashboard
- `/available-orders` - Available orders
- `/active-deliveries` - Active deliveries

### Admin Routes
- `/admin-dashboard` - Admin dashboard
- `/users` - User management
- `/vendors` - Vendor management

## 🔄 Real-time Updates

### Order Tracking
```tsx
useEffect(() => {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`
    }, (payload) => {
      setOrder(payload.new as Order);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [orderId]);
```

## 📊 Data Flow

### Order Creation Flow
```
1. User clicks "Place Order"
   ↓
2. Validate cart items availability
   ↓
3. Create order in database
   ↓
4. Process payment (if online)
   ↓
5. Verify payment
   ↓
6. Update order status to "confirmed"
   ↓
7. Clear cart
   ↓
8. Redirect to order tracking
   ↓
9. Real-time updates via Supabase Realtime
```

### Cart State Flow
```
1. User adds item
   ↓
2. Validate vendor consistency
   ↓
3. Update cart state
   ↓
4. Save to localStorage
   ↓
5. Update UI (cart icon badge, drawer, page)
   ↓
6. Calculate totals automatically
```

## 🎯 Status Codes

### Order Status
- `pending` - Order placed, awaiting confirmation
- `confirmed` - Order confirmed by vendor
- `preparing` - Food being prepared
- `ready` - Ready for pickup
- `picked_up` - Picked up by delivery partner
- `out_for_delivery` - On the way
- `delivered` - Successfully delivered
- `cancelled` - Order cancelled

### Payment Status
- `pending` - Payment not yet made
- `paid` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

## 🚀 Quick Commands

### Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format
```

### Database
```bash
# Apply migrations
supabase db push

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > types/database.types.ts
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }
```

## 🎨 Color Palette

```css
/* Primary */
--primary: #FF6B35 (Orange)

/* Success */
--success: #10B981 (Green)

/* Error */
--destructive: #EF4444 (Red)

/* Warning */
--warning: #F59E0B (Amber)

/* Info */
--info: #3B82F6 (Blue)
```

## 📝 Common Patterns

### Server Component with Data Fetching
```tsx
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('meals')
    .select('*')
    .eq('is_available', true);
  
  return <div>{/* Render data */}</div>;
}
```

### Client Component with State
```tsx
'use client';

import { useState } from 'react';

export function Component() {
  const [state, setState] = useState(initialValue);
  
  return <div>{/* Interactive UI */}</div>;
}
```

### API Route Handler
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Handle request
  
  return NextResponse.json({ success: true });
}
```

## 🔍 Debugging Tips

### Check Auth State
```tsx
const { user, profile, loading } = useAuth();
console.log('User:', user);
console.log('Profile:', profile);
```

### Check Cart State
```tsx
const { cart, itemCount } = useCart();
console.log('Cart:', cart);
console.log('Item Count:', itemCount);
```

### Check API Errors
```tsx
try {
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Razorpay Docs](https://razorpay.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ✅ Implementation Checklist

- [x] Authentication system
- [x] Meal browsing and search
- [x] Meal detail page
- [x] Shopping cart
- [x] Checkout flow
- [x] Order placement
- [x] Payment integration
- [x] Order tracking
- [x] Real-time updates
- [x] Vendor discovery
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Empty states

## 🎉 Ready for Production!

All Phase 3 critical user flows are implemented and tested. The platform is ready for deployment after configuring production payment gateway credentials.
