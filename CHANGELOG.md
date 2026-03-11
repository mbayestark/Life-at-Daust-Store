# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Customer-facing **Hoodie Type** selection (`Zipped` / `No zip`) on the product details page for hoodie products.
- Cart and checkout support for storing and displaying the selected hoodie type.
- Order payload and backend schema support for persisting the selected hoodie type.

### Changed

- Hoodie products can no longer be “quick added” without selecting a hoodie type; users are routed to the product page to choose options first.

### Technical

- Cart item identity/matching now includes hoodie type to prevent different hoodie variants from merging into the same cart line.
- Backend order validation updated to accept additional optional item fields (`hoodieType`, `logoPosition`, `isProductSet`, `productSetName`).
