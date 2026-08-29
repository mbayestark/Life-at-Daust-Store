# Business Logic

How Life at DAUST Store works, end to end.

---

## Products

Each product has a `name`, `category`, `price`, `image`, and optional fields: `colors[]`, `sizes[]`, `logos[]`, `description`, `collection`, `stock`, `badge`, `buyingPrice`, `shippingTimeline`, `hoodieTypes[]`, `hasCropTopOption`.

### Product Availability (`isActive`)

- `isActive` is an optional boolean on the `products` table. Defaults to active (missing field = active).
- Admin can toggle any product on/off from the Products list page.
- Inactive products are hidden from: Shop, Home, Collection pages, and direct URL access (`getById` returns `null`).
- The `list` query returns all products (including inactive) — filtering happens client-side for the storefront, so the admin panel can still see everything.

### Sale Prices (`salePrice`)

- `salePrice` is an optional field: `number | null`.
- A product is "on sale" when `salePrice != null && salePrice < price`.
- Storefront displays: red "Solde" badge, sale price in red, original price with strikethrough.
- Cart stores the effective price at add-time (sale price if on sale, otherwise regular price).
- Clearing the sale: admin empties the field, form sends `null`, Convex patches it to `null`.

### Product Sets (Packs/Bundles)

- A product set groups multiple products at a `specialPrice` lower than the sum of individual prices.
- Schema: `name`, `description`, `products[]` (each with `productId`, `quantity`, optional preselected color/size/logo), `specialPrice`, `image`, `badge`.
- **Inactive cascade**: if *any* product in a set has `isActive === false`, the entire set is hidden from the storefront (both list and direct URL).
- `originalPrice` and `savings` are computed at query time from constituent product prices.

---

## Collections

- Each collection has a `name`, `slug` (indexed), optional `description` and `image`.
- Products link to a collection via the `collection` field (stores the slug).
- Shop page groups products by collection. "Daustian"/"Uniwear" collections sort first, then alphabetical.
- Products with no collection or a stale slug appear under "Other Products".

---

## Cart & Pricing

### Cart Storage

- Persisted in `localStorage` under key `lifeAtDaust.cart.v2`.
- Each cart item stores: `id`, `name`, `price`, `qty`, `image`, `selectedColor`, `selectedSize`, `selectedFrontLogo`, `selectedBackLogo`, `selectedSideLogo`, `selectedHoodieType`, `isCropTop`, `isProductSet`.
- **Price is captured at add-time.** If a sale ends or price changes, items already in cart keep the old price.

### Item Uniqueness

- Regular products: distinct by combination of `(id, color, size, frontLogo, backLogo, sideLogo, hoodieType)`.
- Product sets: uses normalized variant selection comparison (property-order independent). Same set with different selections = different cart items.

### Logo Fee

- If a product has all three logo positions selected (front + back + side), a 1,000 CFA fee is added per item.
- Computed in `CartContext` via `logoFees`.

### Discounts

Two discount types can apply (but not both referral + coupon on the same order):

1. **Referral discount (7%)**: applied when the buyer enters a valid referral code from another user. Excludes "Quarter Zip" category products.
2. **Coupon discount (variable %)**: earned by referring others. Each referral adds 12.5% to the user's coupon, up to 75% max. One-time use — redeemed on payment confirmation.

### Delivery Fee

- Flat fee added at checkout based on customer location. Configured in the checkout form.

---

## Checkout & Payment

### Order Creation Flow

1. Customer fills in name, phone, location.
2. Frontend calls `orders.add` with cart items, subtotal, delivery fee, discount, total, and optional referral/coupon data.
3. `orderId` is generated: `LAD-XXXXX` (random 5-digit).
4. Order starts with status `"Pending Payment"`.

### Payment via NabooPay

1. After order creation, frontend calls `naboopay.createCheckout` action.
2. Backend creates a checkout session via `api.naboopay.com/api/v2/checkout` with the order total and metadata.
3. NabooPay returns a `checkout_url` — user is redirected to pay via **Wave** or **Orange Money**.
4. Payment confirmation comes via webhook.

### Webhook Flow

1. NabooPay sends a POST to `/naboopay-webhook` with HMAC-SHA256 signature.
2. `convex/http.ts` verifies the signature against `NABOOPAY_WEBHOOK_SECRET`.
3. Payload contains `order_id` (NabooPay's) and `transaction_status`.
4. `orders.updateByNabooPayId` maps NabooPay status to internal status:
   - `"paid"` or `"paid_and_blocked"` → `"Paid"`
   - `"cancelled"` → `"Cancelled"`
5. On `"Paid"`: referral tracking fires (increments referrer's count, redeems buyer's coupon if used).

### Order Lifecycle

```
Pending Payment → Paid → Processing → Shipped → Delivered
                → Cancelled
                → Expired (auto, after 1 hour with no payment)
                → Failed (no NabooPay ID within timeout)
```

- `expireStaleOrders` cron runs periodically, marks orders older than 1 hour as "Expired".
- `cancelFailedOrder` marks orders as "Failed" if they never got a NabooPay ID.
- Admin can manually update status, bulk-update, toggle gift flag, edit order items (manager-only), or delete orders.
- Webhook payments arriving for Expired or Failed orders are logged to `auditLogs` (action: `webhook.payment_after_expired` / `webhook.payment_after_failed`) instead of silently dropped.

---

## User Accounts & Auth

### Customer Accounts

- Users sign up with name, email, password.
- Password hashed with PBKDF2 (100,000 iterations, SHA-256, random salt).
- Email validated, password requires: 8+ chars, 1 uppercase, 1 number.
- Login: rate-limited (5 failed attempts → 15-minute lockout), constant-time comparison, timing-safe against enumeration.
- Password reset: token sent via Resend email service, 1-hour expiry, rate-limited to 1 request per 5 minutes.

### Referral System

- Each user gets a unique 8-char alphanumeric referral code on signup.
- Sharing the code: referrer earns 12.5% coupon increment per successful referral (max 75%).
- Buyer using a referral code gets 7% off eligible items (Quarter Zip excluded).
- Coupon is one-time use, redeemed automatically on payment confirmation.
- Tracked via `referralTracked` flag on the order to prevent double-counting.

### Admin Auth

- Two roles: **manager** (full access, `ADMIN_PASSWORD` env var) and **partner** (limited, `PARTNER_PASSWORD` env var).
- Token-based sessions stored in `adminSessions` table, 30-minute expiry.
- All admin mutations verify the token server-side via `verifyAdminToken()`.
- Auto-refresh: client refreshes token 5 minutes before expiry.
- Default password: `daust` (development only).

---

## Admin Features

- **Dashboard**: order count, revenue, profit analytics (real-time via Convex queries). Date range selector (This Week / This Month / All Time). Profit calculated by matching `productId` to buying prices. Stats only count active products.
- **Products**: CRUD, toggle active/inactive, set sale prices, manage images/logos/colors/sizes. Bulk actions: select multiple products to activate, deactivate, or delete (manager-only).
- **Product Form**: collapsible sections (Colors, Logo Types, Sizes, Hoodie Types, Crop Top, Logo Combinations, Color Images) for easier navigation.
- **Product Sets**: create bundles, set special price, auto-compute savings.
- **Collections**: CRUD with slug-based routing.
- **Orders**: view all, update status (single/bulk), toggle gift, delete, clear all. Managers can edit order items inline (quantities, sizes, colors, remove items) with automatic total recalculation.
- **Media Library**: upload images/videos to Convex Storage, organize by folder.
- **Hero Settings**: configure homepage hero media (images/videos).
- **Sales Dashboard**: revenue/profit analytics using `buyingPrice` for margin calculation.

---

## Currency

All prices are in **West African CFA (XOF)**. Formatted via `formatPrice()` utility:
```
formatPrice(7500) → "7,500 CFA"
```
