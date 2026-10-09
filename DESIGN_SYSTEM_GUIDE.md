# Rasan Design System Guide

## Quick Reference for Developers

### Color Usage

```tsx
// Primary Actions & Branding
className="bg-primary text-white"
className="text-primary"
className="border-primary"

// Text Colors
className="text-text-primary"    // Main headings and important text
className="text-text-secondary"  // Body text and descriptions
className="text-text-light"      // Subtle text and placeholders

// Backgrounds
className="bg-white"              // Cards and main content
className="bg-background-secondary" // Section backgrounds (#F9F9F9)

// Success & Ratings
className="bg-green-600 text-white" // Rating badges
className="text-green-600"          // Success states

// Borders
className="border-gray-100"  // Subtle dividers
className="border-gray-200"  // Input borders
```

### Typography

```tsx
// Headings
<h1 className="text-3xl md:text-4xl font-bold text-text-primary">
<h2 className="text-2xl md:text-3xl font-bold text-text-primary">
<h3 className="text-xl md:text-2xl font-bold text-text-primary">

// Body Text
<p className="text-base text-text-secondary">
<p className="text-sm text-text-secondary">
<p className="text-xs text-text-light">
```

### Card Components

```tsx
// Standard Card
<Card className="border-0 shadow-card hover:shadow-hover smooth-transition">
  <CardContent className="p-4">
    {/* Content */}
  </CardContent>
</Card>

// Clickable Card
<Link href="/path" className="group">
  <Card className="border-0 shadow-card hover:shadow-hover smooth-transition">
    {/* Content */}
  </Card>
</Link>
```

### Badges & Indicators

```tsx
// Veg Indicator
<div className="w-5 h-5 border-2 border-green-600 bg-white flex items-center justify-center rounded-sm">
  <div className="w-2 h-2 rounded-full bg-green-600"></div>
</div>

// Non-veg Indicator
<div className="w-5 h-5 border-2 border-red-600 bg-white flex items-center justify-center rounded-sm">
  <div className="w-2 h-2 rounded-full bg-red-600"></div>
</div>

// Rating Badge
<div className="bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1">
  <Star className="w-3 h-3 fill-white" />
  <span className="text-xs font-bold">4.5</span>
</div>

// Offer Badge
<div className="bg-primary text-white px-2 py-1 rounded text-xs font-bold">
  20% OFF
</div>

// Status Badge
<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Delivered
</span>
```

### Buttons

```tsx
// Primary Button
<Button className="bg-primary hover:bg-primary-dark">
  Order Now
</Button>

// Outline Button
<Button variant="outline" className="border-2 hover:bg-primary hover:text-white hover:border-primary">
  View All
</Button>

// Icon Button
<button className="p-2 hover:bg-gray-100 rounded-full smooth-transition">
  <Icon className="w-5 h-5" />
</button>
```

### Spacing

```tsx
// Section Padding
className="py-8 md:py-12"     // Small sections
className="py-12 md:py-16"    // Medium sections
className="py-16 md:py-20"    // Large sections

// Container
className="container mx-auto px-4 sm:px-6 lg:px-8"

// Card Padding
className="p-4"               // Standard
className="p-4 md:p-5"        // Responsive
className="p-5 md:p-6"        // Larger cards

// Gaps
className="gap-3"             // Small
className="gap-4"             // Medium
className="gap-6 md:gap-8"    // Large
```

### Grid Layouts

```tsx
// Meal/Vendor Cards
<div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>

// 4 Column Grid
<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
  {/* Items */}
</div>

// Quick Actions
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {/* Action cards */}
</div>
```

### Responsive Design

```tsx
// Hide on Mobile
className="hidden md:block"
className="hidden md:flex"

// Show on Mobile Only
className="md:hidden"

// Responsive Text
className="text-sm md:text-base"
className="text-2xl md:text-3xl"

// Responsive Spacing
className="p-4 md:p-6"
className="gap-3 md:gap-6"
```

### Animations & Transitions

```tsx
// Standard Transition
className="smooth-transition"  // 200ms ease-in-out

// Hover Effects
className="hover:shadow-hover hover:-translate-y-1 smooth-transition"
className="hover:scale-105 smooth-transition"
className="hover:text-primary smooth-transition"
className="hover:bg-gray-50 smooth-transition"

// Loading Shimmer
className="shimmer"
```

### Icons

```tsx
import { Icon } from 'lucide-react';

// Standard Sizes
<Icon className="w-4 h-4" />  // Small (buttons, inline)
<Icon className="w-5 h-5" />  // Medium (navigation)
<Icon className="w-6 h-6" />  // Large (features)

// With Colors
<Icon className="w-5 h-5 text-primary" />
<Icon className="w-5 h-5 text-text-secondary" />
<Icon className="w-3 h-3 fill-green-600 text-green-600" />
```

### Images

```tsx
import Image from 'next/image';

// Card Images
<div className="relative h-44 w-full bg-gray-100">
  <Image
    src={imageUrl}
    alt={name}
    fill
    className="object-cover group-hover:scale-105 smooth-transition"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### Forms & Inputs

```tsx
// Search Input
<input
  type="text"
  placeholder="Search..."
  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary smooth-transition"
/>

// With Icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
  <input className="pl-10 ..." />
</div>
```

### Loading States

```tsx
import { MealCardSkeleton, VendorCardSkeleton } from '@/components/ui/skeleton-card';

// Show while loading
{isLoading ? (
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <MealCardSkeleton key={i} />
    ))}
  </div>
) : (
  // Actual content
)}
```

### Empty States

```tsx
<Card className="border-0 shadow-card">
  <CardContent className="p-8 text-center">
    <Icon className="w-12 h-12 mx-auto mb-3 text-text-light" />
    <p className="text-text-secondary mb-4">No items found</p>
    <Button asChild>
      <Link href="/browse">Start Browsing</Link>
    </Button>
  </CardContent>
</Card>
```

### Mobile Bottom Sheet

```tsx
import BottomSheet from '@/components/ui/bottom-sheet';

<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filters"
  footer={
    <Button onClick={handleApply} className="w-full">
      Apply
    </Button>
  }
>
  {/* Content */}
</BottomSheet>
```

### Common Patterns

#### Restaurant/Vendor Card
```tsx
<Link href={`/vendors/${id}`} className="group">
  <Card className="border-0 shadow-card hover:shadow-hover smooth-transition">
    <div className="relative h-36 bg-gradient-to-br from-orange-100 to-orange-50">
      <span className="text-5xl">🏪</span>
      <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-bold">
        20% OFF
      </div>
    </div>
    <CardContent className="p-4">
      <h3 className="font-bold text-text-primary group-hover:text-primary smooth-transition">
        {name}
      </h3>
      <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded">
        <Star className="w-3 h-3 fill-white" />
        <span className="font-bold text-xs">{rating}</span>
      </div>
    </CardContent>
  </Card>
</Link>
```

#### Meal Card
```tsx
<Link href={`/meals/${id}`} className="group">
  <Card className="border-0 shadow-card hover:shadow-hover smooth-transition">
    <div className="relative h-44 w-full">
      <Image src={image} alt={name} fill className="object-cover group-hover:scale-105 smooth-transition" />
      
      {/* Veg/Non-veg Badge */}
      <div className="absolute top-3 left-3">
        <div className={`w-5 h-5 border-2 ${isVeg ? 'border-green-600' : 'border-red-600'} bg-white flex items-center justify-center rounded-sm`}>
          <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
        </div>
      </div>
      
      {/* Rating Badge */}
      <div className="absolute bottom-3 left-3 bg-white px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
        <Star className="w-3 h-3 fill-green-600 text-green-600" />
        <span className="text-xs font-bold">{rating}</span>
      </div>
    </div>
    
    <CardContent className="p-4">
      <h3 className="font-bold text-text-primary group-hover:text-primary smooth-transition">
        {name}
      </h3>
      <div className="flex items-center justify-between mt-3">
        <span className="text-lg font-bold">₹{price}</span>
        <div className="flex items-center gap-1 text-xs text-text-light">
          <Clock className="w-3 h-3" />
          <span>25-30 mins</span>
        </div>
      </div>
    </CardContent>
  </Card>
</Link>
```

#### Section Header
```tsx
<div className="mb-8 md:mb-10">
  <h2 className="mb-2 text-2xl md:text-3xl font-bold text-text-primary">
    Section Title
  </h2>
  <p className="text-sm md:text-base text-text-secondary">
    Section description
  </p>
</div>
```

#### Quick Action Card
```tsx
<Link href="/path">
  <Card className="border-0 shadow-card hover:shadow-hover smooth-transition">
    <CardContent className="p-4 text-center">
      <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">Action</h3>
    </CardContent>
  </Card>
</Link>
```

## Best Practices

1. **Always use semantic HTML**: Use proper heading hierarchy (h1 → h2 → h3)
2. **Mobile-first**: Design for mobile, then enhance for desktop
3. **Consistent spacing**: Use Tailwind's spacing scale (4, 6, 8, 12, 16)
4. **Smooth transitions**: Add `smooth-transition` class to interactive elements
5. **Loading states**: Always show skeletons while loading
6. **Empty states**: Provide helpful empty states with CTAs
7. **Accessibility**: Add aria-labels, proper alt text, keyboard navigation
8. **Image optimization**: Use Next.js Image component with proper sizes
9. **Color contrast**: Ensure text is readable (use text-text-primary/secondary/light)
10. **Hover feedback**: Add hover effects to clickable elements

## Common Mistakes to Avoid

❌ Don't use `text-gray-900` → ✅ Use `text-text-primary`
❌ Don't use `bg-gray-50` → ✅ Use `bg-background-secondary`
❌ Don't use `border` alone → ✅ Use `border-0` for cards or `border-gray-100` for dividers
❌ Don't forget hover states → ✅ Add `hover:shadow-hover smooth-transition`
❌ Don't use fixed heights → ✅ Use `h-44`, `h-36` for images, let content flow
❌ Don't forget mobile → ✅ Always test on mobile breakpoints
❌ Don't use inline styles → ✅ Use Tailwind classes
❌ Don't forget loading states → ✅ Use skeleton components

## Resources

- **Icons**: [Lucide React](https://lucide.dev/)
- **Colors**: See `app/globals.css` for full palette
- **Components**: Check `components/ui/` for reusable components
- **Examples**: See `components/home/` for implementation examples
