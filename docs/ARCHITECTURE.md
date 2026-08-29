# Architecture & Onboarding Guide

Everything you need to understand, run, and contribute to the Life at DAUST Store codebase.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Convex (serverless DB, functions, file storage) |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM v7 |
| Icons | lucide-react |
| Testing | Vitest + React Testing Library |
| Payments | NabooPay API (Wave, Orange Money) |
| Email | Resend API |
| Hosting | Vercel (frontend), Convex Cloud (backend) |
| Domain | shop.daustgov.com |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env   # Add your VITE_CONVEX_URL

# 3. Start both servers (two terminals)
npm run dev             # Terminal 1: Vite at localhost:5173
npx convex dev          # Terminal 2: Convex backend sync
```

Both must run simultaneously. Convex CLI watches `convex/` and pushes schema/function changes to your dev deployment.

### Environment Variables

**Client-side** (`.env`, prefixed `VITE_`):
- `VITE_CONVEX_URL` — Convex deployment URL

**Server-side** (set in Convex dashboard, never `VITE_` prefixed):
- `ADMIN_PASSWORD` — Admin login password (default: `daust`)
- `PARTNER_PASSWORD` — Partner login password
- `NABOOPAY_API_KEY` — NabooPay API key
- `NABOOPAY_WEBHOOK_SECRET` — Webhook signature verification
- `RESEND_API_KEY` — Email service for password resets

### Convex Deployment

Production deployment name: `dependable-octopus-848`

```bash
npx convex deploy --prod   # Deploy to production
```

---

## Project Structure

```
├── convex/                  # Backend (Convex functions + schema)
│   ├── schema.ts            # Database schema (products, orders, users, etc.)
│   ├── products.ts          # Product CRUD, product sets, image resolution
│   ├── orders.ts            # Order lifecycle, webhook handler helpers
│   ├── users.ts             # User accounts, login, password reset
│   ├── auth.ts              # Admin authentication (token sessions)
│   ├── referrals.ts         # Referral tracking, coupon system
│   ├── naboopay.ts          # Payment gateway integration
│   ├── collections.ts       # Collection CRUD
│   ├── http.ts              # HTTP routes (webhook endpoint)
│   ├── crons.ts             # Scheduled jobs (expire stale orders)
│   ├── media.ts             # Media library management
│   ├── settings.ts          # Site-wide settings (hero media)
│   ├── files.ts             # File upload utilities
│   └── _generated/          # Auto-generated Convex types (don't edit)
│
├── src/
│   ├── main.jsx             # App entry point
│   ├── App.jsx              # Router configuration
│   ├── context/
│   │   ├── CartContext.jsx   # Cart state (localStorage persistence)
│   │   ├── AdminContext.jsx  # Admin auth state (sessionStorage)
│   │   └── AuthContext.jsx   # Customer auth state
│   ├── components/
│   │   ├── Layout.jsx        # Storefront shell (Navbar + Footer)
│   │   ├── Navbar.jsx        # Top nav with search, cart badge
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx          # Reusable hero banner
│   │   ├── ProductCard.jsx   # Product grid card (handles sale display)
│   │   ├── ProductSetCard.jsx # Bundle card
│   │   ├── Newsletter.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── ProtectedRoute.jsx # Admin route guard
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx # Admin shell (sidebar)
│   │   │   └── MediaLibrary.jsx
│   │   └── ui/              # Atomic components (Button, Skeleton, Toast, etc.)
│   ├── pages/
│   │   ├── Home.jsx          # Landing page (featured products, reels)
│   │   ├── Shop.jsx          # Product catalog (filter, sort, search)
│   │   ├── ProductDetails.jsx # Single product view
│   │   ├── Collection.jsx    # Collection page
│   │   ├── Cart.jsx          # Cart page
│   │   ├── Checkout.jsx      # Checkout form + payment
│   │   ├── OrderSuccess.jsx  # Post-payment confirmation
│   │   ├── Account.jsx       # User profile + referral info
│   │   ├── Referral.jsx      # Referral program page
│   │   ├── Login.jsx / Signup.jsx / ForgotPassword.jsx / ResetPassword.jsx
│   │   ├── About.jsx / NotFound.jsx
│   │   ├── SalesDashboard.jsx # Revenue analytics (admin-accessible)
│   │   └── admin/
│   │       ├── Login.jsx      # Admin login
│   │       ├── Dashboard.jsx  # Admin overview
│   │       ├── Products.jsx   # Product list (toggle, sale price, bulk actions)
│   │       ├── ProductForm.jsx # Add/edit product (collapsible sections)
│   │       ├── ProductSets.jsx / ProductSetForm.jsx
│   │       ├── Collections.jsx / CollectionForm.jsx
│   │       ├── Orders.jsx     # Order management (inline item editing)
│   │       ├── Media.jsx      # Media library
│   │       └── HeroSettings.jsx
│   ├── utils/
│   │   ├── format.js         # formatPrice(), formatDate()
│   │   └── imageOptimizer.js # Image compression before upload
│   ├── data/
│   │   └── navigation.js     # Nav link definitions
│   └── assets/               # Static images
│
├── docs/                     # Technical documentation (you are here)
├── public/                   # Static assets served by Vite
└── index.html                # SPA entry point
```

---

## Key Patterns

### Convex Image Storage

Products store Convex storage IDs (prefixed `kg`) in their `image` field. Every query that returns products resolves these to URLs:

```ts
if (imageUrl && imageUrl.startsWith("kg")) {
    imageUrl = await ctx.storage.getUrl(imageUrl) || product.image;
}
```

Same pattern applies to logo images and logo combinations.

### Admin Token Verification

Every admin mutation follows this pattern:

```ts
const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
if (!isAuthorized) throw new Error("Unauthorized - Invalid or expired session");
```

The token is passed from `AdminContext` → component → mutation call.

### Sale Price Check

Consistent across frontend and backend:

```js
const isOnSale = salePrice != null && salePrice < price;
const effectivePrice = isOnSale ? salePrice : price;
```

### Product Active Check

```js
// Defaults to active when field is missing (backward compat with existing data)
if (product.isActive === false) // inactive
if (product.isActive !== false) // active (includes undefined)
```

---

## Data Flow Diagrams

### Checkout → Payment → Fulfillment

```
Customer                Frontend              Convex Backend           NabooPay
   │                       │                       │                      │
   ├─ fills form ─────────►│                       │                      │
   │                       ├─ orders.add ─────────►│                      │
   │                       │                       ├─ creates order       │
   │                       │                       │  (Pending Payment)   │
   │                       │◄─ orderId ────────────┤                      │
   │                       ├─ naboopay.createCheckout ─────────────────────►
   │                       │◄─ checkout_url ───────────────────────────────┤
   │◄─ redirect ───────────┤                       │                      │
   │                       │                       │                      │
   │─── pays via Wave/OM ──────────────────────────────────────────────────►
   │                       │                       │◄─ webhook POST ──────┤
   │                       │                       ├─ verify signature    │
   │                       │                       ├─ update order→Paid   │
   │                       │                       ├─ track referral      │
   │                       │                       ├─ redeem coupon       │
   │                       │                       │                      │
   │                    Admin Panel                │                      │
   │                       ├─ updateStatus ───────►│                      │
   │                       │  (Processing/Shipped) │                      │
```

### Referral System

```
User A (referrer)              User B (buyer)
   │                               │
   ├─ shares referral code ───────►│
   │                               ├─ enters code at checkout
   │                               ├─ gets 7% off eligible items
   │                               │
   │                          [payment confirmed]
   │                               │
   │◄── +12.5% coupon added ──────┤ (via webhook → trackReferral)
   │    (capped at 75%)            ├─ coupon redeemed if used
```

---

## Deployment

- **Frontend**: Vercel, auto-deploys from GitHub.
- **Backend**: Convex Cloud, deployed manually via `npx convex deploy --prod`.
- **Domain**: `shop.daustgov.com`
- No CI/CD pipeline currently. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md#4-no-cicd-pipeline).

---

## Design System Quick Ref

| Token | Value |
|-------|-------|
| Navy | `#0A192F` (brand-navy) |
| Orange | `#FF6B00` (brand-orange) |
| Border radius | `rounded-2xl` / `rounded-3xl` |
| Transitions | `transition-all` on interactive elements |
| Font weight | Heavy use of `font-black` and `font-bold` |
| Icons | `lucide-react` exclusively |

Glassmorphism and `backdrop-blur` effects used on overlays and cards.

---

## Testing

```bash
npm run test              # Watch mode
npm run test -- --run     # Single run (CI-friendly)
npm run test:coverage     # Coverage report
```

Tests mock Convex hooks (`useQuery`, `useMutation`) — no real backend calls. See `src/test/setup.js` for global mocks and `src/test/utils.jsx` for render helpers.
