# Rasan Phase 3 - Testing Guide

## Quick Start Testing

### Prerequisites
1. Ensure the development server is running:
```bash
npm run dev
```

2. Ensure Supabase is configured (already done in `.env.local`)

3. Ensure database migrations are applied:
```bash
# If using Supabase CLI
supabase db push
```

## Test Scenarios

### 1. Authentication Flow

#### Test User Registration
1. Navigate to `http://localhost:3000/register`
2. Fill in the registration form:
   - Name: Test Customer
   - Email: customer@test.com
   - Phone: +1234567890
   - Password: test123456
   - Confirm Password: test123456
   - Role: Customer
3. Click "Create account"
4. **Expected:** Redirected to `/dashboard`
5. **Verify:** User is logged in and can see customer dashboard

#### Test User Login
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: customer@test.com
   - Password: test123456
3. Click "Sign in"
4. **Expected:** Redirected to `/dashboard` (customer role)
5. **Verify:** Session persists on page reload

#### Test Role-Based Redirect
1. Register/login as different roles:
   - Customer → `/dashboard`
   - Vendor → `/vendor-dashboard`
   - Delivery → `/delivery-dashboard`
   - Admin → `/admin-dashboard`
2. **Verify:** Each role redirects to correct dashboard

#### Test Protected Routes
1. Logout (if logged in)
2. Try to access `/orders`
3. **Expected:** Redirected to `/login?redirectTo=/orders`
4. Login and verify redirect back to `/orders`

### 2. Meal Browsing & Search

#### Test Meal Listing
1. Navigate to `http://localhost:3000/meals`
2. **Verify:**
   - Meals display in grid layout
   - Filters sidebar visible
   - Search bar present
   - Sort dropdown available
   - Pagination works (if >12 meals)

#### Test Meal Filters
1. On `/meals` page:
   - Select a category filter
   - Toggle vegetarian filter
   - Select meal type (breakfast/lunch/dinner)
2. **Verify:** Meals update based on filters

#### Test Meal Search
1. Type in search bar: "chicken"
2. **Verify:** Results filter in real-time
3. Clear search
4. **Verify:** All meals return

#### Test Meal Sorting
1. Select "Price: Low to High"
2. **Verify:** Meals sorted by price ascending
3. Select "Rating: High to Low"
4. **Verify:** Meals sorted by rating descending

### 3. Meal Detail & Add to Cart

#### Test Meal Detail Page
1. Click on any meal card
2. **Verify:**
   - Meal image displays
   - Name, description, price visible
   - Nutritional info shows
   - Ingredients list displays
   - Allergens show (if any)
   - Vendor name with link
   - Add to cart button visible

#### Test Add to Cart
1. On meal detail page, click "Add to Cart"
2. **Verify:**
   - Success toast appears
   - Button changes to quantity controls
   - Cart icon badge updates
3. Click "+" to increase quantity
4. **Verify:** Quantity increases
5. Click "-" to decrease quantity
6. **Verify:** Quantity decreases

#### Test Cart Drawer
1. Click cart icon in header
2. **Verify:**
   - Drawer slides in from right
   - Cart items display
   - Subtotal shows
   - "Checkout" button visible
3. Update quantity in drawer
4. **Verify:** Subtotal updates
5. Remove item
6. **Verify:** Item removed from cart

### 4. Shopping Cart Page

#### Test Cart Page
1. Add multiple meals to cart
2. Navigate to `/cart`
3. **Verify:**
   - All items display
   - Quantities can be updated
   - Items can be removed
   - Subtotal calculates correctly
   - "Proceed to Checkout" button visible

#### Test Multi-Vendor Validation
1. Add meal from Vendor A
2. Try to add meal from Vendor B
3. **Verify:** Error message about different vendors
4. Clear cart
5. **Verify:** Can now add from Vendor B

#### Test Empty Cart
1. Remove all items from cart
2. **Verify:**
   - Empty state displays
   - "Browse Meals" button shows
   - No checkout button

### 5. Checkout Flow

#### Test Checkout Page Access
1. Ensure cart has items
2. Click "Proceed to Checkout"
3. **Verify:**
   - Redirected to `/checkout`
   - If not logged in, redirected to login first

#### Test Address Selection
1. On checkout page:
   - View saved addresses (if any)
   - Select an address
2. **Verify:** Address selected and highlighted

#### Test Delivery Instructions
1. Enter delivery instructions: "Leave at door"
2. **Verify:** Text saved in form

#### Test Payment Method Selection
1. Select "Cash on Delivery"
2. **Verify:** Payment method selected
3. Try other methods (Card, UPI, Wallet)
4. **Verify:** Selection updates

#### Test Order Summary
1. Review order summary section
2. **Verify:**
   - All items listed
   - Subtotal correct
   - Delivery fee shown
   - Tax calculated (5%)
   - Total correct

#### Test Place Order
1. Ensure address and payment method selected
2. Click "Place Order"
3. **Verify:**
   - Loading state shows
   - Order created successfully
   - Redirected to order detail page
   - Cart cleared

### 6. Order Tracking

#### Test Orders List
1. Navigate to `/orders`
2. **Verify:**
   - All orders display
   - Order cards show:
     - Order number
     - Date/time
     - Status badge
     - Items count
     - Delivery address
     - Total amount
     - "View Details" button

#### Test Order Filters
1. Click filter by status
2. Select "Confirmed"
3. **Verify:** Only confirmed orders show
4. Select "All"
5. **Verify:** All orders return

#### Test Order Detail Page
1. Click "View Details" on any order
2. **Verify:**
   - Order tracker shows current status
   - Status timeline displays
   - Order items listed with quantities
   - Price breakdown shows
   - Delivery address displays
   - Payment information shows
   - Delivery instructions visible (if any)

#### Test Real-time Updates
1. Open order detail page
2. Have another user/admin update order status
3. **Verify:** Status updates automatically without refresh

### 7. Vendor Discovery

#### Test Vendors Listing
1. Navigate to `/vendors`
2. **Verify:**
   - Vendors display in grid
   - Search bar present
   - Filters available
   - Pagination works

#### Test Vendor Search
1. Type vendor name in search
2. **Verify:** Results filter

#### Test Vendor Detail
1. Click on vendor card
2. **Verify:**
   - Vendor info displays
   - Menu/meals show
   - Can add meals to cart from vendor page

## Edge Cases to Test

### Authentication
- [ ] Invalid email format
- [ ] Password too short (<6 chars)
- [ ] Passwords don't match
- [ ] Email already exists
- [ ] Wrong password on login
- [ ] Session expiry

### Cart
- [ ] Add unavailable meal
- [ ] Add meal with 0 stock
- [ ] Cart persists after browser close
- [ ] Cart clears after order
- [ ] Maximum quantity limits

### Checkout
- [ ] Checkout with empty cart
- [ ] No address selected
- [ ] No payment method selected
- [ ] Order validation fails
- [ ] Payment fails

### Orders
- [ ] View order not belonging to user
- [ ] Cancel delivered order
- [ ] Rate order twice

## Performance Testing

### Load Times
- [ ] Home page loads < 2s
- [ ] Meals page loads < 2s
- [ ] Meal detail loads < 1s
- [ ] Cart operations instant
- [ ] Checkout page loads < 2s

### Responsiveness
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Cart drawer works on mobile
- [ ] All forms usable on mobile

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Form labels present
- [ ] Error messages clear

## Security Testing

- [ ] SQL injection attempts fail
- [ ] XSS attempts sanitized
- [ ] CSRF protection works
- [ ] Rate limiting active
- [ ] Sensitive data not exposed
- [ ] API routes protected

## Test Data Setup

### Create Test Users
```sql
-- Customer
INSERT INTO profiles (id, email, name, role, is_active)
VALUES ('uuid-1', 'customer@test.com', 'Test Customer', 'customer', true);

-- Vendor
INSERT INTO profiles (id, email, name, role, is_active)
VALUES ('uuid-2', 'vendor@test.com', 'Test Vendor', 'vendor', true);

-- Delivery Partner
INSERT INTO profiles (id, email, name, role, is_active)
VALUES ('uuid-3', 'delivery@test.com', 'Test Delivery', 'delivery', true);
```

### Create Test Meals
```sql
-- Sample meals for testing
INSERT INTO meals (vendor_id, name, description, price, is_available, is_vegetarian)
VALUES 
  ('vendor-uuid', 'Chicken Biryani', 'Delicious chicken biryani', 250, true, false),
  ('vendor-uuid', 'Paneer Tikka', 'Grilled paneer tikka', 180, true, true),
  ('vendor-uuid', 'Dal Makhani', 'Creamy dal makhani', 150, true, true);
```

## Automated Testing Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- auth
npm test -- cart
npm test -- checkout

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/videos
5. Browser/device info
6. Console errors
7. Network errors

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No network errors
- ✅ Proper loading states
- ✅ Clear error messages
- ✅ Smooth transitions
- ✅ Fast response times
- ✅ Mobile-friendly UI
- ✅ Accessible to all users

## Notes

- Test with real payment gateways requires API keys
- Real-time updates require Supabase Realtime enabled
- Email notifications require email service configured
- Some features may need production environment
