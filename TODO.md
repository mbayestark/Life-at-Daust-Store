# Task: Fix Console Errors and Logo/Color Variant Display

## Plan - COMPLETED

### ✅ Step 1: Hide NABOOPAY Console Errors
- Updated Checkout.jsx to catch Convex action errors
- Display user-friendly message instead of exposing error details
- Error message now shows: "Online payment is temporarily unavailable. Please use manual payment method instead."

### ✅ Step 2: Logo Management Verified
- Logo management already implemented in ProductForm.jsx
- Similar UX to colors - add with name and optional image upload
- Variant images section shows logo × color combinations for easy setup

### ✅ Step 3: Fixed Variant Image Display in Cart
- Updated ProductDetails.jsx to save the currently displayed variant image when adding to cart
- Now when user selects a color + logo combination, the exact variant image (white hoodie with DAUST logo, black hoodie with LAD logo, etc.) is saved to cart
- Cart and Checkout pages now show the correct variant image instead of the main product image

