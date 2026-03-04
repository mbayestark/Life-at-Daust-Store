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
- Requires authentication via `AdminContext` (persists to sessionStorage)
- Hardcoded password: `daust_admin_2024` (see `src/context/AdminContext.jsx:14`)
- Includes Dashboard (analytics), Products (CRUD), Collections (CRUD), Orders (fulfillment tracking)

### State Management

**CartContext** (`src/context/CartContext.jsx`)
- Manages shopping cart with localStorage persistence
- Key: `lifeAtDaust.cart.v1`
- Items include: `id`, `name`, `price`, `qty`, `selectedColor`, `selectedSize`
- Cart matching logic: items are distinct by `(id, color, size)` combination
- Exports: `addItem`, `removeItem`, `setQty`, `clear`, `count`, `subtotal`, `shipping`, `tax`, `total`

**AdminContext** (`src/context/AdminContext.jsx`)
- Session-based admin authentication
- Key: `is_admin` in sessionStorage
- Exports: `isAdmin`, `login(password)`, `logout()`

### Convex Backend Structure

**Schema** (`convex/schema.ts`):
- `products`: name, category, price, rating, badge, image, colors[], sizes[], collection, description
- `collections`: name, slug (indexed), description, image
- `orders`: orderId, customer{name, email, year}, items[], subtotal, total, status, createdAt
- `categories`: name

**Key Files:**
- `convex/products.ts`: CRUD operations + image upload handlers
- `convex/collections.ts`: Collection management
- `convex/orders.ts`: Order creation and fulfillment tracking
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

## Admin Password

The admin authentication uses a hardcoded password (`daust_admin_2024`) defined in `src/context/AdminContext.jsx:14`. This is intentional for the university's internal use. When working on admin features, be aware this is not a production-grade auth system.
