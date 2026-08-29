# Known Issues & Limitations

Current bugs, design trade-offs, and technical debt.

---

## Active Bugs / Risks

### ~~1. Cart stores stale prices~~ — FIXED

Server-side price validation in `orders.addOrder` now looks up each product's current price from the database and overrides client-sent prices. Stale cart prices are corrected at order creation.

---

### ~~2. No server-side price validation at checkout~~ — FIXED

`orders.addOrder` now recomputes `subtotal`, `total`, referral discounts, and coupon discounts server-side by looking up real prices from the DB. Client-sent prices are ignored.

---

### ~~3. Product set savings ignore sale prices~~ — FIXED

`listProductSets` and `getProductSetById` now use `productEffectivePrice` (salePrice if on sale, else price) when computing `originalPrice` and `savings`.

---

## Technical Debt

### ~~4. No CI/CD pipeline~~ — FIXED

Added `.github/workflows/ci.yml`: lint → test → build on push/PR to main/master.

---

### ~~5. Junk files tracked in git~~ — FIXED

Added `debug_output*` and `**/debug*.test.*` patterns to `.gitignore`.

---

### ~~6. No SEO / Open Graph tags~~ — FIXED

Added static OG and Twitter Card meta tags in `index.html`.

---

### ~~7. No error monitoring~~ — FIXED

Added Sentry integration in `main.jsx` and `ErrorBoundary.jsx`. Configure via `VITE_SENTRY_DSN` env var.

---

### ~~8. Tests are shallow~~ — FIXED

Rewrote `CartContext.test.jsx` (21 tests covering sale prices, variants, quantity clamping, logo fees, product sets), `ProductCard.test.jsx`, `Home.test.jsx`, and integration tests. All 84 tests passing.

---

### ~~9. Admin auth has no RBAC granularity~~ — FIXED

Full RBAC system with 9 granular permissions (dashboard, products, product_sets, collections, orders, media, hero, delete, users). Per-user permission arrays stored in `adminUsers` table. Destructive mutations enforce `verifyManagerToken()`, other mutations use `verifyPermission()`. Admin user management UI at `/admin/users`.

---

### ~~10. Password stored in environment variable (plaintext)~~ — FIXED

Admin users now authenticate with individual `@mydaust.org` email accounts and PBKDF2-hashed passwords stored in the `adminUsers` table. Legacy env var passwords kept only as a bootstrap fallback for creating the first user account.

---

### ~~11. `getOrderCount` scans the entire orders table~~ — FIXED

Removed `getOrderCount` entirely — it was unused.

---

### ~~12. No rate limiting on order creation~~ — FIXED

Added in-memory rate limiting on `addOrder`: max 10 orders per phone number per 10-minute window.

---

### ~~13. Dashboard profit calculation matched by product name~~ — FIXED

Profit calculation now looks up buying prices by `productId` instead of name string, with name as a fallback for older orders that lack `productId`.

---

### ~~14. Webhook silently dropped payments for expired/failed orders~~ — FIXED

`updateByNabooPayId` now logs an audit entry (`webhook.payment_after_expired` / `webhook.payment_after_failed`) before returning early, so late payments are visible in the audit log.

---

## Additional Improvements

### Audit Logging

All admin actions are now logged to the `auditLogs` table with actor identity, action type, target, and details. Viewable at `/admin/audit` (manager-only). Covers: login, user CRUD, product CRUD, order status changes, collection CRUD, media uploads/deletes, settings changes, and webhook anomalies.

---

## Design Trade-offs (Intentional)

These are known simplifications, not bugs:

- **Client-side product filtering**: `products.list` returns all products (including inactive). Filtering happens in React. Acceptable at current catalog size (<100 products); revisit if catalog grows past ~500.
- **localStorage cart**: No server-side cart. Users lose their cart if they clear browser data or switch devices. Acceptable for the current user base.
- **No inventory management**: `stock` field exists in schema but isn't enforced at checkout. Products can be "sold" past their stock count. The `isActive` toggle is the current solution for out-of-stock items.
- **Single-currency**: All prices hardcoded to XOF/CFA. No multi-currency support.
- **In-memory rate limits**: Login and order rate limits reset on Convex deploy. Acceptable for current scale; move to DB-backed counters if abuse becomes a problem.
