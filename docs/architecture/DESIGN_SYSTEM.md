# Design system

Tailwind CSS v4 tokens and UI conventions used in Rasan. The token source is `app/globals.css`.
Reusable components are in `components/ui/`, and `components/home/` has worked examples.

Related: [Docs index](../README.md) · [Contributing](../development/CONTRIBUTING.md)

## Tokens

Colors are HSL triplets on `:root` (e.g. `--primary: 16 100% 50%`). The `@theme` block in
`globals.css` maps them to Tailwind utilities (`--color-primary: hsl(var(--primary))` →
`bg-primary`, `text-primary`, `border-primary`, …). Opacity modifiers work (`bg-primary/10`).

### Brand and status

| Token | Value | Utilities |
|-------|-------|-----------|
| `primary` | `#FF5200` (16 100% 50%) | `bg-primary`, `text-primary`, `border-primary`, `ring-primary` |
| `primary-dark` | `#E04700` | `hover:bg-primary-dark` |
| `primary-light` | `#FF6B1A` | `bg-primary-light` |
| `primary-foreground` | white | `text-primary-foreground` |
| `accent` | same as primary | `bg-accent` (Button `ghost` hover) |
| `success` | `#60B246` | `bg-success`, `text-success` |
| `rating` | `#FFC700` | `text-rating`, `fill-rating` |
| `destructive` | 0 84.2% 60.2% | `bg-destructive` |

`success` and `rating` are defined but not used by components yet. Rating badges and success
states use Tailwind's `green-600` (see patterns below).

### Text and surfaces

| Token | Value | Utility | Use |
|-------|-------|---------|-----|
| `text-primary` | `#3D4152` | `text-text-primary` | Headings, key text (all `h1`–`h6` get it by default) |
| `text-secondary` | `#686B78` | `text-text-secondary` | Body text, descriptions |
| `text-light` | `#93959F` | `text-text-light` | Meta text, placeholders |
| `foreground` | `#3D4152` | `text-foreground` | Body default |
| `background` | white | `bg-background` | Page |
| `background-secondary` | `#F9F9F9` | `bg-background-secondary` | Section backgrounds |
| `background-tertiary` | `#F5F5F5` | `bg-background-tertiary` | |
| `muted` / `muted-foreground` | `#F5F5F5` / `#686B78` | `bg-muted`, `text-muted-foreground` | Skeletons, subdued UI |
| `secondary` | 210 40% 96.1% | `bg-secondary` | Button `secondary` |
| `card`, `popover` (+ `-foreground`) | white / `#3D4152` | `bg-card`, `bg-popover` | |
| `border`, `input` | `#E9E9EB` | `border-border`, `border-input` | Default border color for every element |
| `ring` | primary | `ring-ring` | Focus rings |

### Radius and shadows

Defined on `:root`:

| Variable | Value |
|----------|-------|
| `--radius-sm` / `--radius-md` / `--radius-lg` | 0.5rem / 0.75rem / 1rem |
| `--radius` | 0.75rem |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | light / medium / large drop shadows |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,.08)` (via `.shadow-card`) |
| `--shadow-hover` | `0 8px 16px rgba(0,0,0,.12)` (via `.shadow-hover`) |

### Typography

Inter, loaded with `next/font` in `app/layout.tsx` as `--font-inter`, with a system-font
fallback. Headings are `font-weight: 700`.

| Element | Classes |
|---------|---------|
| h1 | `text-3xl md:text-4xl font-bold text-text-primary` |
| h2 | `text-2xl md:text-3xl font-bold text-text-primary` |
| h3 | `text-xl md:text-2xl font-bold text-text-primary` |
| Body | `text-base` / `text-sm text-text-secondary` |
| Meta | `text-xs text-text-light` |

### Dark mode

A `.dark` palette exists in `globals.css` (with dark scrollbars), but nothing in the app adds the
`dark` class yet. Treat dark mode as not supported.

## Custom utilities (`globals.css`)

| Class | Effect |
|-------|--------|
| `.shadow-card` / `.shadow-hover` | Card shadow / raised hover shadow |
| `.card-hover` | 300 ms transition, hover shadow + `translateY(-0.25rem)` |
| `.smooth-transition` | `transition: all 0.2s ease-in-out` |
| `.shimmer` | Animated loading gradient on `muted` |
| `.animate-float` | 3 s vertical float |
| `.animate-pulse-slow` | 4 s opacity pulse (0.2 ↔ 0.4) |
| `.text-text-primary/secondary/light`, `.bg-background-secondary` | Explicit versions of the token utilities |

## Components (`components/ui/`)

| Component | Notes |
|-----------|-------|
| `Button` | `variant`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. `size`: `default` (h-10), `sm`, `lg`, `icon`. `asChild` (Radix Slot) |
| `Badge` | `variant`: `default`, `secondary`, `destructive`, `outline` |
| `Card` (+ `CardContent`, …) | Usually `border-0 shadow-card hover:shadow-hover smooth-transition` |
| `MealCardSkeleton`, `VendorCardSkeleton`, `CategorySkeleton` | `skeleton-card.tsx`. Show while loading |
| `BottomSheet` (default export), `FilterBottomSheet` | Mobile sheet: `isOpen, onClose, title, children, footer?`. Locks body scroll while open |
| `EmptyState` (default export) | `icon?, title, description?, action?{label, onClick}` |
| Radix wrappers | `dialog`, `dropdown-menu`, `select`, `radio-group`, `switch`, `tabs`, `scroll-area`, `separator`, `sheet`, `progress`, `toast`/`toaster` |
| Form primitives | `input`, `label`, `textarea`, `table`, `skeleton`, `error-message` |

Icons: `lucide-react`. Sizes `w-4 h-4` (inline/buttons), `w-5 h-5` (nav), `w-6 h-6` (features).

## Patterns

```tsx
// Card (clickable)
<Link href={`/meals/${id}`} className="group">
  <Card className="border-0 shadow-card hover:shadow-hover smooth-transition">
    <div className="relative h-44 w-full bg-gray-100">
      <Image src={image} alt={name} fill
        className="object-cover group-hover:scale-105 smooth-transition"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
    </div>
    <CardContent className="p-4">
      <h3 className="font-bold text-text-primary group-hover:text-primary smooth-transition">{name}</h3>
    </CardContent>
  </Card>
</Link>

// Veg / non-veg indicator
<div className={`w-5 h-5 border-2 ${isVeg ? 'border-green-600' : 'border-red-600'} bg-white flex items-center justify-center rounded-sm`}>
  <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
</div>

// Rating badge
<div className="bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1">
  <Star className="w-3 h-3 fill-white" /><span className="text-xs font-bold">{rating}</span>
</div>

// Offer badge / status pill
<div className="bg-primary text-white px-2 py-1 rounded text-xs font-bold">20% OFF</div>
<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Delivered</span>

// Buttons
<Button className="bg-primary hover:bg-primary-dark">Order Now</Button>
<Button variant="outline" className="border-2 hover:bg-primary hover:text-white hover:border-primary">View All</Button>

// Search input
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
  <input className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary smooth-transition" />
</div>

// Section header
<div className="mb-8 md:mb-10">
  <h2 className="mb-2 text-2xl md:text-3xl font-bold text-text-primary">Title</h2>
  <p className="text-sm md:text-base text-text-secondary">Description</p>
</div>
```

## Layout and spacing

| Use | Classes |
|-----|---------|
| Container | `container mx-auto px-4 sm:px-6 lg:px-8` |
| Section padding | `py-8 md:py-12` (small) · `py-12 md:py-16` (medium) · `py-16 md:py-20` (large) |
| Card padding | `p-4` · `p-4 md:p-5` · `p-5 md:p-6` |
| Card grid | `grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| 4-up grid | `grid gap-4 grid-cols-2 md:grid-cols-4` |
| Quick actions | `grid grid-cols-2 md:grid-cols-4 gap-3` |
| Mobile only / desktop only | `md:hidden` / `hidden md:block` |

## Conventions

- Use the text tokens (`text-text-primary/secondary/light`), not raw grays, for copy.
  Use `bg-background-secondary` for section backgrounds.
- Cards: `border-0 shadow-card`. Clickable things get a hover state (`hover:shadow-hover`,
  `hover:text-primary`) plus `smooth-transition`.
- Design mobile-first and check small breakpoints.
- Show skeletons while loading, and an empty state with a call to action when there's no data.
- Use `next/image` with `sizes`. Give every image `alt` text and every icon-only button an
  `aria-label`.
- Use Tailwind classes, not inline styles.
