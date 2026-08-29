# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Customer-facing **Hoodie Type** selection (`Zipped` / `No zip`) on the product details page for hoodie products.
- Cart and checkout support for storing and displaying the selected hoodie type.
- Order payload and backend schema support for persisting the selected hoodie type.
- **Dashboard date range selector**: filter stats by This Week, This Month, or All Time.
- **Bulk product actions**: select multiple products to activate, deactivate, or delete (manager-only) in batch.
- **Order item editing**: managers can edit item quantities, sizes, colors, and remove items from orders inline; totals recalculate automatically.
- **Webhook audit logging**: payments arriving for Expired or Failed orders are logged to `auditLogs` with action `webhook.payment_after_expired` / `webhook.payment_after_failed`.

### Changed

- Hoodie products can no longer be “quick added” without selecting a hoodie type; users are routed to the product page to choose options first.
- **Dashboard profit calculation** now matches products by `productId` instead of name string, with name as fallback for older orders.
- **Dashboard catalog size** only counts active products; low stock and top categories also filter by active.
- **ProductForm** reorganized into collapsible `<Section>` components (Colors, Logo Types, Sizes, Hoodie Types, Crop Top, Logo Combinations, Color Images).

### Technical

- Cart item identity/matching now includes hoodie type to prevent different hoodie variants from merging into the same cart line.
- Backend order validation updated to accept additional optional item fields (`hoodieType`, `logoPosition`, `isProductSet`, `productSetName`).
- New Convex mutations: `products.bulkToggleActive`, `products.bulkDeleteProducts`, `orders.updateOrderItems`.
