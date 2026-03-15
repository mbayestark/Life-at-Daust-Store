# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Life at DAUST is a full-stack e-commerce store for Dakar American University of Science and Technology campus merchandise. The application has two main sections: a public storefront and a protected admin panel for inventory/order management.

**Tech Stack:**
- Frontend: React 19 + Vite
- Backend: Convex (serverless database, functions, and file storage)
- Styling: Tailwind CSS 4
- Testing: Vitest + React Testing Library
- State: React Context API (CartContext, AdminContext)
- Routing: React Router DOM v7

## Development Commands

```bash
# Start development (requires TWO terminals)
npm run dev              # Terminal 1: Vite dev server (localhost:5173)
npx convex dev          # Terminal 2: Convex backend sync

# Build and preview
npm run build           # Production build
npm run preview         # Preview production build

# Linting
npm run lint            # ESLint

# Testing
npm run test            # Run all tests (watch mode)
npm run test:ui         # Vitest UI
npm run test:coverage   # Coverage report
```

**Critical:** Both `npm run dev` and `npx convex dev` must run simultaneously for full functionality. The Convex CLI syncs the backend schema and functions.

## Environment Setup

Required `.env` file:
```env
VITE_CONVEX_URL=your_convex_deployment_url
```

## Architecture

### Dual Application Structure

The app has two distinct sections with separate routing:

**Storefront Routes** (`/`, `/shop`, `/product/:id`, etc.)
- Uses `Layout` component (Navbar + Footer)
- Public access
- Cart managed via `CartContext` (persists to localStorage)

**Admin Routes** (`/admin/*`)
- Uses `AdminLayout` component (Sidebar + protected routes)
- Requires authentication via secure token-based system (`convex/auth.ts`)
- Default password: `daust` (override via `ADMIN_PASSWORD` server env variable - NOT `VITE_` prefix)
- Session tokens (30min expiry) with auto-refresh
- Includes Dashboard (analytics), Products (CRUD), Collections (CRUD), Orders (fulfillment tracking)

### State Management

**CartContext** (`src/context/CartContext.jsx`)
- Manages shopping cart with localStorage persistence
- Key: `lifeAtDaust.cart.v2`
- Items include: `id`, `name`, `price`, `qty`, `selectedColor`, `selectedSize`, `selectedFrontLogo`, `selectedBackLogo`, `selectedSideLogo`, `selectedHoodieType`, `isProductSet`
- Cart matching logic:
  - Regular items: distinct by `(id, color, size, frontLogo, backLogo, sideLogo, hoodieType)` combination
  - Product sets: uses normalized variant selection comparison (property-order independent)
- Logo fee: 1000 CFA when all 3 logos selected (front + back + side)
- Exports: `addItem`, `addProductSet`, `removeItem`, `setQty`, `clear`, `count`, `subtotal`, `logoFees`, `totalSavings`, `total`, `showToast`

**AdminContext** (`src/context/AdminContext.jsx`)
- Secure token-based admin authentication with server-side verification
- Uses Convex auth system (`convex/auth.ts`)
- Session tokens stored in `admin_token` (sessionStorage)
- Auto-refresh 5 minutes before expiry
- 30-minute session timeout
- Rate limiting: 5 failed attempts = 15 minute lockout
- Exports: `isAdmin`, `adminToken`, `login(password)`, `logout()`, `sessionExpiry`

### Convex Backend Structure

**Schema** (`convex/schema.ts`):
- `products`: name, category, price, rating, badge, image, colors[], sizes[], collection, description
- `collections`: name, slug (indexed), description, image
- `orders`: orderId, customer{name, phone, location}, items[productId, name, qty, price, frontLogo, backLogo, sideLogo, ...], subtotal, deliveryFee, total, status, createdAt
- `adminSessions`: token (indexed), expiresAt, createdAt
- `productSets`: name, description, products[], specialPrice, image, badge

**Key Files:**
- `convex/auth.ts`: Secure authentication system with session management
- `convex/products.ts`: CRUD operations + image upload handlers (token-verified)
- `convex/collections.ts`: Collection management (token-verified)
- `convex/orders.ts`: Order creation and fulfillment tracking (token-verified)
- `convex/seed.ts` & `convex/seedCollections.ts`: Database seeders

**Important Patterns:**
- Images stored in Convex Storage return storage IDs (prefix `kg`)
- Queries automatically convert storage IDs to URLs via `ctx.storage.getUrl()`
- Mutations use `ctx.storage.generateUploadUrl()` for client-side uploads

### Testing Patterns

**Setup:** Vitest with jsdom environment (`vitest.config.js`, `src/test/setup.js`)

**Mocking Convex Hooks:**
Tests mock `useQuery` and `useMutation` from Convex. Example pattern:
```javascript
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn()
}));
```

**Integration Tests:** Located in `src/test/integration/` - test full user flows (e.g., Shop → Cart → Checkout)

**Coverage:** Excludes `node_modules/`, `src/test/`, `convex/`, and config files

## Key Conventions

### Currency Formatting
All prices use West African CFA (XOF). Use the centralized utility:
```javascript
import { formatPrice } from './utils/format.js';
formatPrice(7500); // Returns "7,500 CFA"
```

### Design System
- Primary colors: `#0A192F` (Navy), `#FF6B00` (Orange)
- Heavy use of glassmorphism effects and 2rem border radii
- All interactive elements use `transition-all` with hover states
- Icons exclusively from `lucide-react` (standardized in Phase 1)

### Component Structure
- `src/components/ui/`: Atomic components (Button, LoadingSpinner, Notification, etc.)
- `src/components/admin/`: Admin-specific layouts (AdminLayout, Sidebar)
- Each component should have a corresponding `.test.jsx` file

### Loading & Error States
- Use `ProductCardSkeleton` for loading states
- Global `ErrorBoundary` wraps the entire app
- Admin dashboard uses real-time Convex queries for live data

## Important Context Files

- **PROJECT_CONTEXT.md**: Historical changelog and architectural decisions
- **README.md**: Setup instructions and feature overview

## Admin Authentication

The admin authentication uses a **secure server-side system** (`convex/auth.ts`):

**Password Configuration:**
- Stored in `ADMIN_PASSWORD` environment variable (server-side only, NOT `VITE_` prefix)
- Default fallback: `daust` (for development only)
- Password NEVER exposed to client code

**Security Features:**
- ✅ Server-side password verification (never sent plaintext after login)
- ✅ Session tokens generated on successful login
- ✅ Tokens verified server-side for all admin operations
- ✅ Automatic 30-minute session expiration
- ✅ Auto-refresh prevents unexpected logouts (5min before expiry)
- ✅ Rate limiting: 5 failed attempts = 15 minute lockout
- ✅ Session cleanup (expired sessions removed from database)

**How It Works:**
1. User enters password on login page
2. `convex/auth.ts:login()` verifies password server-side
3. Server generates unique session token
4. Token stored in `adminSessions` table with expiry timestamp
5. Client stores token (not password) in sessionStorage
6. All admin mutations verify token via `verifyAdminToken()` helper
7. Invalid/expired tokens result in automatic logout

**For Production:**
Set the `ADMIN_PASSWORD` environment variable in your Convex deployment dashboard.
