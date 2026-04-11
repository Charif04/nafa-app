@AGENTS.md

# NAFA — African Marketplace Platform

NAFA is a West African e-commerce marketplace targeting Burkina Faso and neighboring countries. It connects vendors with clients through a platform that handles the full order lifecycle, including warehousing and last-mile delivery managed by NAFA.

---

## Stack

- **Next.js 16.2.1** (App Router, React 19)
- **TypeScript 5**
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Framer Motion 12** for animations
- **Zustand 5** for client-side state
- **Supabase** — auth, PostgreSQL database, Storage, Realtime
- **Recharts 3** for admin analytics charts
- **Lucide React 1** for icons
- **Radix UI** primitives (accordion, dialog, select, switch, tabs, toast…)
- **Zod 4** for validation
- **DOMPurify** for XSS sanitization

> Firebase is still present in the codebase (`src/lib/firebase.ts`) but is no longer used. All auth, data, and storage goes through Supabase.

---

## Architecture

### Route Groups

```
src/app/
  page.tsx                    → splash screen, redirects to /login after 2.4s
  layout.tsx                  → root layout with <AuthProvider>
  (auth)/
    login/page.tsx
    register/page.tsx
  (client)/
    layout.tsx                → ClientTopNav (desktop) + ClientBottomNav (mobile)
    home/page.tsx
    product/[id]/page.tsx
    cart/page.tsx
    checkout/page.tsx
    vendor/[id]/page.tsx
    profile/page.tsx
    profile/orders/page.tsx
    profile/orders/[id]/page.tsx
    profile/settings/page.tsx
    profile/reviews/page.tsx
    profile/following/page.tsx
    notifications/page.tsx
  (vendor)/
    layout.tsx                → VendorSidebar
    vendor/dashboard/page.tsx
    vendor/orders/page.tsx
    vendor/orders/[id]/page.tsx
    vendor/products/page.tsx
    vendor/products/new/page.tsx
    vendor/revenue/page.tsx
    vendor/wallet/page.tsx
    vendor/settings/page.tsx
  (admin)/
    layout.tsx                → AdminSidebar
    admin/dashboard/page.tsx
    admin/orders/page.tsx
    admin/orders/[id]/page.tsx
    admin/analytics/page.tsx
    admin/vendors/page.tsx
    admin/payments/page.tsx
    admin/alerts/page.tsx
    admin/settings/page.tsx
```

**Critical**: Route groups `(vendor)` and `(admin)` both need pages nested under `vendor/` and `admin/` subdirectories respectively.

All route group layouts must have:
```ts
export const dynamic = 'force-dynamic';
```

---

## Supabase Backend

### Project
- URL: `https://kdubcsrcjksfbhwsybhn.supabase.co`
- Client: `src/lib/supabase.ts` — `createClient<Database>(url, key)`
- Types: `src/types/supabase.ts` — manual Row/Insert/Update shapes for all tables
- Credentials: `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Migrations applied
- `supabase/migrations/001_initial_schema.sql` — 12 tables, enums, triggers, full RLS
- `supabase/migrations/002_storage.sql` — Storage policies for products/avatars/cnib buckets

### Database tables
`profiles`, `vendor_profiles`, `products`, `orders`, `order_items`, `order_status_history`, `notifications`, `reviews`, `follows`, `wallets`, `withdrawals`, `alerts`

### Storage buckets
- `products` (public) — product images, path: `{vendorId}/{timestamp}_{random}.{ext}`
- `avatars` (public) — user avatars, path: `{userId}/{timestamp}.{ext}`
- `cnib` (private) — identity documents, access via signed URLs (1h), path: `{userId}/{timestamp}.{ext}`

### TypeScript workaround
Supabase infers `never` for insert/update types until CLI types are regenerated. Cast `supabase as any` for all write operations and add `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.

### Key API files
- `src/lib/api/orders.ts` — `fetchVendorOrders`, `fetchAdminOrders`, `fetchClientOrders`, `updateOrderStatus`, `createOrder`, `mapOrder`
- `src/lib/api/storage.ts` — `uploadProductImages`, `uploadAvatar`, `uploadCnib`, `getCnibSignedUrl`

---

## Authentication

### Flow
- `supabase.auth.signUp()` with `options.data` (role, first_name, last_name, phone, country) → DB trigger `handle_new_user()` auto-creates `profiles` row
- `supabase.auth.signInWithPassword()` → fetch role from `profiles` → redirect by role
- `AuthProvider` (`src/components/providers/AuthProvider.tsx`) — root-level listener on `onAuthStateChange`, loads profile + shop_name (for vendors) into `useAuthStore`
- `useAuthStore` (`src/stores/authStore.ts`) — holds `user`, `session`, `shopName` (vendor only), `isLoading`
- `mapToAppUser(supabaseUser, profileRow)` — converts to app `User` type

### Demo buttons
Login page has three demo buttons (Client / Vendeur / Admin) that navigate directly without a real session. Pages using `useAuthStore` will show empty data when accessed via demo buttons — this is expected.

### Vendor upgrade (client → vendor)
`src/components/shared/BecomeVendorModal.tsx` — shared modal used in both `profile/page.tsx` and `profile/settings/page.tsx`:
1. Uploads CNIB to private bucket
2. Creates `vendor_profiles` row (`is_pending: true`, `is_verified: false`)
3. Updates `profiles.role` to `'vendor'`
4. Re-fetches profile → updates `useAuthStore` immediately (no re-login needed)
5. Redirects to `/vendor/dashboard`

---

## Design System

All colors use CSS variables defined in `src/styles/globals.css`:

```css
--nafa-orange       /* primary CTA color */
--nafa-black
--nafa-white
--nafa-green        /* success, delivered status */
--nafa-blue         /* info, NAFA-handled state */
--nafa-error        /* red, destructive */
--nafa-gray-100 through --nafa-gray-900
```

Never use raw Tailwind color classes for brand colors — always use `style={{ color: 'var(--nafa-orange)' }}` etc.

**Typography**: `.nafa-mono` class for prices and order IDs (monospace font).

**Cursors**: `globals.css` sets `cursor: pointer` on all interactive elements; `button:disabled` gets `cursor: not-allowed`.

---

## Pricing Model

The vendor sets their own price. NAFA adds a 10% commission on top. The client always sees the vendor price × 1.1.

```ts
// src/lib/utils.ts
export function clientPrice(vendorPrice: number): number {
  return Math.round(vendorPrice * 1.1);
}
export const NAFA_COMMISSION_RATE = 0.10;
```

- `Product.price` is always the **vendor price** (raw, pre-commission)
- Display to clients always calls `clientPrice(product.price)`
- Cart subtotal uses `clientPrice(item.price) * item.quantity`
- Vendor revenue = `order.subtotal / 1.1` (strip the commission that was added on top)

---

## Delivery Fees

```ts
export const FREE_DELIVERY_THRESHOLD = 15000; // FCFA
export function calculateDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 2500;
}
```

---

## Order Status Flow

```
placed → confirmed → preparing → in_transit_warehouse
         ^^^ VENDOR HANDLES ^^^

in_transit_warehouse → at_warehouse → delivering → delivered
                    ^^^ ADMIN HANDLES ^^^
```

Cancelled is always possible (admin only).

---

## Zustand Stores

| File | Purpose |
|------|---------|
| `authStore.ts` | user, session, shopName (vendor), isLoading |
| `cartStore.ts` | Cart items, quantities, subtotal/total |
| `adminOrdersStore.ts` | Admin orders — real Supabase queries |
| `vendorOrdersStore.ts` | Vendor orders — real Supabase queries |
| `clientOrdersStore.ts` | Client orders — real Supabase queries |
| `notificationStore.ts` | Notifications + Realtime subscription |
| `uiStore.ts` | Global UI state |

All order stores use optimistic updates with rollback on error.

---

## CSP (Content Security Policy)

`next.config.ts` has a strict CSP. The `connect-src` and `img-src` directives include `https://*.supabase.co` and `wss://*.supabase.co`. If adding new external services, update the CSP header in `next.config.ts` — missing entries cause silent `Failed to fetch` errors.

---

## Responsive Layout Strategy

**Client portal**: `max-w-7xl mx-auto` containers. Navigation:
- `ClientTopNav` — `hidden md:flex` (desktop only)
- `ClientBottomNav` — `md:hidden` (mobile only)
- Body padding: `pb-20 md:pb-0 md:pt-16`

**Admin & Vendor portals**: `w-full` containers (sidebar constrains width). Never add `max-w-*` on admin/vendor page roots.

---

## Shared Components

`src/components/shared/`:

| Component | Notes |
|-----------|-------|
| `StatusBadge` | Colored pill for OrderStatus |
| `OrderStatusStepper` | Full order timeline |
| `ProductCard` | Shows `clientPrice(product.price)` |
| `EmptyState` | Generic empty state with icon, title, description, optional action |
| `AnimatedCounter` | Animated number counter for dashboard stats |
| `SkeletonShimmer` | Exports `Skeleton`, `ProductCardSkeleton`, `OrderCardSkeleton`, `TableRowSkeleton` |
| `BecomeVendorModal` | Client → vendor upgrade flow (shared between profile and settings) |
| `SeverityIndicator` | Warning/critical severity for admin alerts |
| `RatingStars` | Star rating display |
| `Logo` | NAFA logo component |

---

## Known TypeScript Gotchas

**Framer Motion `Variants`**: Inside `Variants` objects, `ease` must be a string (`'easeOut'`), not an array. Arrays cause type errors.

**Recharts `formatter`**: Do not add explicit type annotations on formatter functions — let TypeScript infer.

**Hydration mismatches**: Date/time elements rendered with `toLocaleDateString` differ between server and client. Always add `suppressHydrationWarning` on those elements.

**`use(params)` in Next.js 16**: Params are now a Promise:
```ts
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

**`??` and `||` mixing**: TypeScript 5 forbids mixing `??` and `||` without parentheses. Always wrap: `(a ?? b) || c`.

---

## Localization

- Default phone prefix: **+226**
- Country list: Burkina Faso first, then alphabetical
- Currency: **FCFA** (formatted via `Intl.NumberFormat`)
- Language: French (`fr-FR` for dates and numbers)
- Payment methods: Orange Money, Moov Money, card

---

## Local Development & Testing

```bash
npm run dev
npm run build
npm run type-check
```

**Testing on external devices**:
```bash
ngrok http 3000
```
`next.config.ts` already has `allowedDevOrigins` and CSP entries for ngrok domains.

---

## What Has Been Built & Wired to Supabase

### Auth
- Signup with real Supabase accounts, DB trigger creates `profiles` row automatically
- Login fetches role from `profiles`, redirects by role
- `AuthProvider` loads session + profile + shop_name on mount and on auth state changes
- Profile page, settings page show real user data (name, email, phone, location)

### Client Portal
- Splash screen → login redirect
- Login / Register (real Supabase auth)
- Home: products fetched from Supabase with vendor shop name
- Product detail, cart, checkout (creates real order in DB)
- Profile: real user data, orders from Supabase, become-vendor flow
- Notifications: fetch + Realtime Postgres LISTEN
- Vendor upgrade: immediate role change + redirect, no re-login needed

### Vendor Portal
- Dashboard: real KPIs (revenue 7d, active orders, rating, followers), real recent orders, real top 5 vendors, real low-stock alerts
- Orders: real data with status transitions written to Supabase
- Products: list from Supabase, creation with real Storage upload, soft delete
- Revenue: real aggregated data from orders, chart 6 months, breakdown by product
- Wallet: real balance from `wallets` table, real withdrawal history, withdrawal form inserts to DB
- Settings: loads/saves real `shop_name` and `shop_description` from `vendor_profiles`, updates sidebar immediately
- Sidebar: shows real shop name and email from `useAuthStore`

### Admin Portal
- Dashboard: real KPIs (CA today, orders today, new users, active vendors, in-transit), real revenue chart 7 days, real recent orders
- Orders: real data, full status lifecycle
- Vendors: real list from `vendor_profiles` + `profiles` join, filter tabs (tous/en_attente/vérifiés/suspendus), detail modal with CNIB viewer (signed URL), certify/suspend/reactivate actions write to Supabase

---

## What Remains To Build

- **Admin payments page** — real payment data
- **Reviews system** — end-to-end: client rates vendor after delivery
- **Admin analytics** — replace mock chart data with real aggregated queries
- **Admin alerts** — wire to real data
- **Search and filters** — full-text product search, category/price filters on home page
- **Multi-vendor cart** — cart currently single-vendor; needs order splitting at checkout
- **Push notifications** — Firebase Cloud Messaging or Supabase Edge Functions
- **Payment integration** — Orange Money and Moov Money APIs
- **Production deployment** — Vercel + real env vars
- **Wallet payout** — admin approval flow for withdrawals
