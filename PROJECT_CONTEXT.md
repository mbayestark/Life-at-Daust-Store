# Life at DAUST - Project Context

This document serves as the primary source of truth for the project's architecture, state, and history. It is designed to provide immediate context for any AI model or developer working on this codebase.

## 🚀 Project Overview
**Name:** Life at DAUST  
**Purpose:** Official campus merchandise store for the Dakar American University of Science and Technology (DAUST).  
**Status:** Active Development (Phase 12: Admin Management Improvements)  
**Domain:** shop.daustgov.com  
**Convex Deployment:** dependable-octopus-848

## 🛠 Tech Stack
- **Frontend:** React 19 + Vite (Fast, modern, ESM-based)
- **Backend:** Convex (Serverless, real-time database, cloud functions, and file storage)
- **Styling:** TailwindCSS 4 (Modern utility-first CSS)
- **Routing:** React Router DOM v7
- **Icons:** Lucide React (Standardized project-wide)
- **Payments:** NabooPay API (Wave, Orange Money)
- **Email:** Resend API (password reset flows)
- **Hosting:** Vercel (frontend) + Convex Cloud (backend)
- **Testing Suite:**
  - **Runner:** Vitest
  - **Utilities:** React Testing Library + JSDOM
  - **Patterns:** Mocking Convex hooks (`useQuery`, `useMutation`) for integration tests
- **Environment:** Node.js with ESM (`"type": "module"`)

## 📁 Key Directories & Files
- `src/components/`: Reusable UI components.
  - `ui/`: Atomic components (Button, LoadingSpinner, Notification, etc.).
  - `admin/`: Admin-specific layout components (AdminLayout, Sidebar).
- `src/pages/`: Application routes.
  - `admin/`: Secured administrative pages (Dashboard, Products, Orders, Login).
- `src/utils/`: High-level utility functions.
  - `format.js`: Centralized price formatting for CFA (XOF).
- `src/context/`: Global state management.
  - `CartContext.jsx`: Client-side cart persistence via `localStorage`.
  - `AdminContext.jsx`: Session-based administrative authentication.
- `src/test/`: Testing utilities, setup, and integration tests.
- `convex/`: Full-stack backend logic.
  - `schema.ts`: Database definitions (products, orders, users, collections, productSets, adminSessions, media, siteSettings).
  - `products.ts`: CRUD, product sets, image resolution, active toggle.
  - `orders.ts`: Order lifecycle, webhook helpers, stale order expiry.
  - `users.ts`: User accounts, login, password reset (PBKDF2).
  - `auth.ts`: Admin auth (two roles, token sessions, rate limiting).
  - `referrals.ts`: Referral tracking, coupon system.
  - `naboopay.ts`: Payment gateway integration.
  - `http.ts`: Webhook endpoint (HMAC signature verification).
  - `crons.ts`: Scheduled jobs.
- `docs/`: Technical documentation.
  - `BUSINESS_LOGIC.md`: How the store works end to end.
  - `KNOWN_ISSUES.md`: Current bugs, debt, and trade-offs.
  - `ARCHITECTURE.md`: Onboarding guide, structure, patterns.
- `PROJECT_CONTEXT.md`: This document (Historical & Structural reference).

## 🧬 Patterns & Conventions
- **Institutional Premium Design:** A high-contrast aesthetic using `#0A192F` (Navy) and `#FF6B00` (Orange). Heavy focus on glassmorphism, 2rem corner radii, and black-weight typography.
- **Micro-interactivity:** All interactive elements use `transition-all` with hover states (scale, shadow, or color shifts).
- **Safe Storefront:** Global `ErrorBoundary` and pervasive loading states (Skeleton UI) ensure a polished user experience even during errors or slow fetches.
- **Admin Security:** Two-role system (manager/partner) with server-side token verification. Tokens stored in `adminSessions` table with 30-minute expiry, auto-refresh, and rate limiting (5 attempts → 15-minute lockout).
- **User Accounts:** PBKDF2-hashed passwords, email-based login, password reset via Resend, referral codes.
- **Localized Commerce:** Standardized use of the `formatPrice` utility for all currency rendering. Currency is fixed to West African CFA (XOF) with whole-number precision.
- **Data Integrity:** Checkout orders are saved synchronously to Convex. Payment confirmation via NabooPay webhook with HMAC-SHA256 signature verification.
- **Modular Testing:** Every new UI component must have a corresponding `.test.jsx` file. Integration tests cover the path from Shop to Checkout.

## 📜 Project Change Log

### Phase 1: Foundation & Recovery (Feb 14, 2026)
- **Fixed Critical Build Error:** Resolved missing `react-feather` dependencies.
- **Standardized Icon Library:** Migrated entire project to `lucide-react`.
- **Verified Production Build:** Successfully tested `npm run build` for deployment readiness.

### Phase 2: UX & Robustness (Feb 14, 2026)
- **Implemented Error Boundaries:** Created global failure recovery UI.
- **Enhanced Loading States:** Added `ProductCardSkeleton` and `LoadingSpinner`.
- **Validation:** Implemented real-time form feedback for Checkout and Contact flows.
- **Navigation Fix:** Forced scroll-to-top on product views.

### Phase 3: Quality Assurance (Feb 14, 2026)
- **Testing Suite:** Set up Vitest/RTL environment.
- **Verification:** Implemented 33 passing unit tests and full-flow integration tests.
- **Bug Fix:** Resolved a critical issue where cart items failed to remove due to missing property arguments in `CartContext` calls.

### Phase 4: Admin Panel Implementation (Feb 14, 2026)
- **Infrastructure:** Built `AdminContext` and `AdminLayout` with protected routes.
- **Analytics:** Developed a live dashboard syncing stats (Revenue, Orders, Inventory) from Convex.
- **Catalog Control:** Implemented full Product CRUD with Convex image upload integration.
- **Order Fulfillment:** Built a management page for tracking student purchases and updating shipment statuses (Processing → Shipped → Delivered).
- **Backend Overhaul:** Added `orders` table to Convex schema and moved primary order persistence from Google Sheets to the database.

### Phase 5: Collections Integration & Visual Curations (Feb 14, 2026)
- **Database Evolution:** Added `collections` table to Convex with unique slug indexing and image support.
- **Administrative CRUD:** Built a dedicated Collections management interface with auto-slug generation and Convex storage image uploads.
- **Product Mapping:** Enhanced Product CRUD to support one-to-one collection assignments.
- **Dynamic Navigation:** Migrated Navbar and mobile menus to fetch collection links directly from the database.
- **Curated Storefront:** Updated Home and Shop pages to dynamically group and display products by collection, replacing all static mock data.

### Phase 6: Global Localized Pricing (Feb 14, 2026)
- **Central Utility:** Implemented a standardized `formatPrice` utility to ensure consistent "X,XXX CFA" rendering project-wide.
- **Store-wide Localization:** Migrated every touchpoint (Shop, Product Details, Cart, Checkout, Admin Dashboard) to the new CFA format.
- **Realistic Data Scaling:** Updated the static product catalog with logical, localized prices (e.g., T-shirts at 7,500 CFA, Hoodies at 15,000 CFA).
- **Backend Accuracy:** Synchronized admin revenue analytics to reflect the new currency scale.

### Phase 7: User Accounts & Authentication
- **User Registration:** Email/password signup with PBKDF2 hashing (100k iterations, SHA-256).
- **Login Security:** Rate limiting, account lockout, constant-time comparison, timing-safe enumeration protection.
- **Password Reset:** Token-based reset via Resend email service with 1-hour expiry.

### Phase 8: Referral & Coupon System
- **Referral Codes:** Unique 8-char alphanumeric code per user.
- **Referral Discount:** 7% off eligible items for buyers using a referral code (Quarter Zip excluded).
- **Coupon Accumulation:** Referrers earn 12.5% coupon increment per successful referral (max 75%), one-time use.
- **Tracking:** Referral and coupon redemption triggered on payment confirmation via webhook.

### Phase 9: NabooPay Payment Integration
- **Payment Gateway:** NabooPay API for Wave and Orange Money mobile payments.
- **Webhook Handler:** HMAC-SHA256 signature verification at `/naboopay-webhook` endpoint.
- **Order Lifecycle:** Pending Payment → Paid → Processing → Shipped → Delivered (+ Cancelled, Expired, Failed states).
- **Auto-Expiry:** Cron job expires stale orders after 1 hour.

### Phase 10: Product Sets & Admin Enhancements
- **Product Bundles:** Group multiple products at a special price with computed savings.
- **Media Library:** Upload/organize images and videos in Convex Storage with folder support.
- **Hero Settings:** Configurable homepage hero media (images/videos).
- **Sales Dashboard:** Revenue and profit analytics using buying prices for margin calculation.
- **Bulk Order Actions:** Bulk status update, gift toggle, order deletion.

### Phase 11: Product Availability & Sales (Aug 2026)
- **Active Toggle:** `isActive` field on products — admin can toggle products on/off from the product list.
- **Inactive Cascade:** Product sets containing any inactive product are automatically hidden from storefront.
- **Sale Prices:** `salePrice` field — admin can set/clear sale prices anytime. Storefront shows "Solde" badge, red price, and strikethrough original.
- **Cart Integration:** Cart captures effective price (sale or regular) at add-time.
- **Bug Fixes:** Fixed sale price removal (null vs undefined), getById isActive bypass, getProductSetById inconsistency, Shop.jsx memoization.

### Phase 12: Admin Management Improvements (Aug 2026)
- **Dashboard Date Range:** Period selector (This Week / This Month / All Time) filters revenue, orders, and profit stats.
- **Profit Calculation Fix:** Dashboard matches products by `productId` instead of name string for buying price lookup (name fallback for older orders).
- **Active Products Filter:** Dashboard catalog size, low stock alerts, and top categories only count active products.
- **ProductForm Collapsible Sections:** Form reorganized into expandable `<Section>` components — Colors, Logo Types, Sizes, Hoodie Types, Crop Top, Logo Combinations, Color Images.
- **Bulk Product Actions:** Select multiple products to activate, deactivate, or delete (manager-only) in batch from the Products page.
- **Order Item Editing:** Managers can edit item quantities, sizes, colors, and remove items inline; subtotal and total recalculate automatically.
- **Webhook Audit Logging:** Payments arriving for Expired/Failed orders are logged to `auditLogs` instead of silently dropped.

---

**Detailed documentation:** See `docs/BUSINESS_LOGIC.md`, `docs/KNOWN_ISSUES.md`, `docs/ARCHITECTURE.md`.

---
*Last Updated: August 27, 2026*

