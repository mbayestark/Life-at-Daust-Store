# Front/Back Logo Selection & Contact Removal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single logo+position selection with independent front/back logo selectors, charge +1,000 CFA when both are selected, and remove the contact page entirely.

**Architecture:** The current single `selectedLogo`/`selectedLogoPosition` fields become `selectedFrontLogo`/`selectedBackLogo` throughout the stack (CartContext, ProductDetails, Cart, Checkout, order schema). A computed `logoFee` of 1,000 CFA applies when both are non-null. The contact page, route, and all nav links are deleted.

**Tech Stack:** React 19, Convex, Tailwind CSS 4, React Router DOM v7

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/context/CartContext.jsx` | Replace logo/logoPosition with frontLogo/backLogo in state, matching, add logoFee to totals |
| Modify | `src/pages/ProductDetails.jsx` | Two independent logo sections (Front/Back), fee notice, updated addItem call |
| Modify | `src/pages/Cart.jsx` | Display front/back logos, update remove/setQty calls |
| Modify | `src/pages/Checkout.jsx` | Display front/back logos in review, pass to order lines, include logoFee in totals |
| Modify | `convex/schema.ts` | Replace `logo`/`logoPosition` with `frontLogo`/`backLogo` in orders items |
| Modify | `src/components/Footer.jsx` | Remove "Contact Us" from SUPPORT_LINKS |
| Modify | `src/data/navigation.js` | Remove Contact from NAV_LINKS |
| Modify | `src/App.jsx` | Remove Contact route and import |
| Delete | `src/pages/Contact.jsx` | No longer needed |
| Modify | `src/pages/admin/Orders.jsx` | Show front/back logo in order items display |

---

### Task 1: Update CartContext — replace logo/logoPosition with frontLogo/backLogo

**Files:**
- Modify: `src/context/CartContext.jsx`

- [ ] **Step 1: Update `addItem` function**

Replace lines 23-27 (logo/logoPosition extraction):
```javascript
const logo = product.selectedLogo || (product.logos?.[0]?.name) || null;
const logoPosition = product.selectedLogoPosition || null;
```
With:
```javascript
const frontLogo = product.selectedFrontLogo || null;
const backLogo = product.selectedBackLogo || null;
```

Update `findIndex` matching (lines 29-37) — replace `p.selectedLogo === logo && p.selectedLogoPosition === logoPosition` with `p.selectedFrontLogo === frontLogo && p.selectedBackLogo === backLogo`.

Update the new item object (lines 43-55) — replace `selectedLogo: logo, selectedLogoPosition: logoPosition` with `selectedFrontLogo: frontLogo, selectedBackLogo: backLogo`.

- [ ] **Step 2: Update `removeItem` function**

Change signature from `(id, color, size, logo, isProductSet, logoPosition, hoodieType)` to `(id, color, size, frontLogo, backLogo, isProductSet, hoodieType)`.

Update the matching condition to use `p.selectedFrontLogo === frontLogo && p.selectedBackLogo === backLogo` instead of `p.selectedLogo === logo && p.selectedLogoPosition === logoPosition`.

- [ ] **Step 3: Update `setQty` function**

Change signature from `(id, color, size, logo, qty, isProductSet, logoPosition, hoodieType)` to `(id, color, size, frontLogo, backLogo, qty, isProductSet, hoodieType)`.

Update matching to use `p.selectedFrontLogo === frontLogo && p.selectedBackLogo === backLogo`.

- [ ] **Step 4: Add logoFee computation**

After the `totalSavings` memo (line 128), add:
```javascript
const LOGO_FEE = 1000;

const logoFees = useMemo(() =>
  items.reduce((sum, p) => {
    if (!p.isProductSet && p.selectedFrontLogo && p.selectedBackLogo) {
      return sum + LOGO_FEE * p.qty;
    }
    return sum;
  }, 0),
  [items]
);
```

Update total calculation (line 131):
```javascript
const total = subtotal + shipping + logoFees;
```

Add `logoFees` and `LOGO_FEE` to the context value object.

- [ ] **Step 5: Update `addProductSet` item shape**

In the product set item object (lines 74-92), replace `selectedLogo: null, selectedLogoPosition: null` with `selectedFrontLogo: null, selectedBackLogo: null`.

- [ ] **Step 6: Verify no remaining references to old field names**

Search for `selectedLogo` and `selectedLogoPosition` — should be zero occurrences in this file after edits.

---

### Task 2: Update ProductDetails — two independent logo sections

**Files:**
- Modify: `src/pages/ProductDetails.jsx`

- [ ] **Step 1: Replace state variables**

Remove:
```javascript
const [selectedLogo, setSelectedLogo] = useState(null);
const [selectedLogoPosition, setSelectedLogoPosition] = useState(null);
```

Add:
```javascript
const [selectedFrontLogo, setSelectedFrontLogo] = useState(null);
const [selectedBackLogo, setSelectedBackLogo] = useState(null);
```

- [ ] **Step 2: Update initialization effect**

Replace lines 37-39:
```javascript
const firstLogo = product.logos?.[0] || null;
setSelectedLogo(firstLogo);
setSelectedLogoPosition(firstLogo?.positions?.[0] || null);
```
With:
```javascript
setSelectedFrontLogo(null);
setSelectedBackLogo(null);
```

- [ ] **Step 3: Compute filtered logos for each position**

Add computed values after the initialization effect:
```javascript
const frontLogos = useMemo(() =>
  product?.logos?.filter(l => !l.positions || l.positions.includes("front")) || [],
  [product]
);
const backLogos = useMemo(() =>
  product?.logos?.filter(l => !l.positions || l.positions.includes("back")) || [],
  [product]
);
const hasDoubleLogos = selectedFrontLogo && selectedBackLogo;
```

- [ ] **Step 4: Replace the logo variants UI section (lines 216-278)**

Remove the entire `{/* Logo Variants - click to preview */}` block and the `{/* Logo Position selector */}` block.

Replace with two independent sections:

```jsx
{/* Front Logo Selection */}
{frontLogos.length > 0 && (
  <div className="space-y-5">
    <div>
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">
        Front Logo · <span className="text-brand-navy">{selectedFrontLogo?.name || "None"}</span>
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSelectedFrontLogo(null)}
          className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${
            !selectedFrontLogo
              ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
              : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
          }`}
        >
          None
        </button>
        {frontLogos.map((logo) => (
          <button
            key={logo.id || logo.name}
            type="button"
            onClick={() => {
              setSelectedFrontLogo(logo);
              if (window.innerWidth < 1024) {
                const imageSection = document.getElementById('product-image');
                if (imageSection) {
                  imageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
              if (logo.image) {
                setLogoPreview(logo.image);
                setTimeout(() => setLogoPreview(null), 2500);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${
              selectedFrontLogo?.id === logo.id || selectedFrontLogo?.name === logo.name
                ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
            }`}
          >
            {logo.image && (
              <img src={logo.image} alt={logo.name} className="w-7 h-7 rounded-lg object-cover" />
            )}
            {logo.name}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* Back Logo Selection */}
{backLogos.length > 0 && (
  <div className="space-y-5">
    <div>
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">
        Back Logo · <span className="text-brand-navy">{selectedBackLogo?.name || "None"}</span>
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSelectedBackLogo(null)}
          className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${
            !selectedBackLogo
              ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
              : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
          }`}
        >
          None
        </button>
        {backLogos.map((logo) => (
          <button
            key={logo.id || logo.name}
            type="button"
            onClick={() => {
              setSelectedBackLogo(logo);
              if (window.innerWidth < 1024) {
                const imageSection = document.getElementById('product-image');
                if (imageSection) {
                  imageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
              if (logo.image) {
                setLogoPreview(logo.image);
                setTimeout(() => setLogoPreview(null), 2500);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${
              selectedBackLogo?.id === logo.id || selectedBackLogo?.name === logo.name
                ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
            }`}
          >
            {logo.image && (
              <img src={logo.image} alt={logo.name} className="w-7 h-7 rounded-lg object-cover" />
            )}
            {logo.name}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* Additional Logo Fee Notice */}
{hasDoubleLogos && (
  <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
    <Info size={18} className="text-brand-orange flex-shrink-0" />
    <p className="text-sm font-bold text-brand-orange">
      +{formatPrice(1000)} additional fee for logos on both front and back
    </p>
  </div>
)}
```

- [ ] **Step 5: Update validation in the Add to Cart onClick (lines 380-400)**

Remove:
```javascript
if (product.logos?.length > 0 && !selectedLogo) {
    alert('Please select a logo style');
    return;
}
if (selectedLogo?.positions?.length > 1 && !selectedLogoPosition) {
    alert('Please select a logo position (Front or Back)');
    return;
}
```

Add:
```javascript
if (product.logos?.length > 0 && !selectedFrontLogo && !selectedBackLogo) {
    alert('Please select at least one logo (front or back)');
    return;
}
```

- [ ] **Step 6: Update addItem call (lines 402-410)**

Replace:
```javascript
selectedLogo: selectedLogo?.name,
selectedLogoPosition: selectedLogoPosition,
```
With:
```javascript
selectedFrontLogo: selectedFrontLogo?.name || null,
selectedBackLogo: selectedBackLogo?.name || null,
```

---

### Task 3: Update Cart page display

**Files:**
- Modify: `src/pages/Cart.jsx`

- [ ] **Step 1: Update cart item key**

Line 156, replace:
```javascript
key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedLogo}-${item.selectedHoodieType}`}
```
With:
```javascript
key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedFrontLogo}-${item.selectedBackLogo}-${item.selectedHoodieType}`}
```

- [ ] **Step 2: Update logo display in item details**

Lines 176-178, replace the single logo display:
```jsx
{item.selectedLogo && (
  <span className="flex items-center gap-2">Logo: <span className="text-brand-navy">{item.selectedLogo}</span></span>
)}
```
With:
```jsx
{item.selectedFrontLogo && (
  <span className="flex items-center gap-2">Front: <span className="text-brand-navy">{item.selectedFrontLogo}</span></span>
)}
{item.selectedBackLogo && (
  <span className="flex items-center gap-2">Back: <span className="text-brand-navy">{item.selectedBackLogo}</span></span>
)}
```

- [ ] **Step 3: Update setQty calls**

Lines 191 and 199, replace:
```javascript
setQty(item.id, item.selectedColor, item.selectedSize, item.selectedLogo, item.qty - 1, false, item.selectedLogoPosition, item.selectedHoodieType)
```
With:
```javascript
setQty(item.id, item.selectedColor, item.selectedSize, item.selectedFrontLogo, item.selectedBackLogo, item.qty - 1, false, item.selectedHoodieType)
```
(Same pattern for qty + 1 call.)

- [ ] **Step 4: Update removeItem call**

Line 219, replace:
```javascript
removeItem(item.id, item.selectedColor, item.selectedSize, item.selectedLogo, false, item.selectedLogoPosition, item.selectedHoodieType)
```
With:
```javascript
removeItem(item.id, item.selectedColor, item.selectedSize, item.selectedFrontLogo, item.selectedBackLogo, false, item.selectedHoodieType)
```

- [ ] **Step 5: Add logoFees to summary**

Destructure `logoFees` from `useCart()` (line 9). Add after the subtotal row in the summary section (around line 240):
```jsx
{logoFees > 0 && (
  <div className="flex justify-between items-center">
    <span className="text-brand-cream/60 font-medium">Additional Logo Fees</span>
    <span className="font-bold">{formatPrice(logoFees)}</span>
  </div>
)}
```

Update the estimated total display to use `total` from useCart instead of `subtotal`.

---

### Task 4: Update Checkout page

**Files:**
- Modify: `src/pages/Checkout.jsx`

- [ ] **Step 1: Add logoFees to destructured cart values**

Line 25, add `logoFees` to the destructured values:
```javascript
const { items, subtotal, clear, totalSavings, logoFees } = useCart();
```

- [ ] **Step 2: Update order lines builder (lines 50-70)**

Replace:
```javascript
if (it.selectedLogo) line.logo = it.selectedLogo;
if (it.selectedLogoPosition) line.logoPosition = it.selectedLogoPosition;
```
With:
```javascript
if (it.selectedFrontLogo) line.frontLogo = it.selectedFrontLogo;
if (it.selectedBackLogo) line.backLogo = it.selectedBackLogo;
```

- [ ] **Step 3: Update total calculation**

Line 44, change:
```javascript
const total = subtotal + deliveryFee;
```
To:
```javascript
const total = subtotal + deliveryFee + logoFees;
```

- [ ] **Step 4: Update review panel item display**

Lines 378-382, replace:
```jsx
{it.selectedLogo ? ` • ${it.selectedLogo}${it.selectedLogoPosition ? ` (${it.selectedLogoPosition})` : ""}` : ""}
```
With:
```jsx
{it.selectedFrontLogo ? ` • Front: ${it.selectedFrontLogo}` : ""}
{it.selectedBackLogo ? ` • Back: ${it.selectedBackLogo}` : ""}
```

- [ ] **Step 5: Add logo fees line in summary section**

After the subtotal display (around line 393), add:
```jsx
{logoFees > 0 && (
  <div className="flex justify-between items-center text-brand-cream/60">
    <span>Additional Logo Fees</span>
    <span>{fmt(logoFees)}</span>
  </div>
)}
```

---

### Task 5: Update Convex order schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Replace logo/logoPosition fields in orders items**

Lines 71-72, replace:
```typescript
logo: v.optional(v.string()),
logoPosition: v.optional(v.string()),
```
With:
```typescript
frontLogo: v.optional(v.string()),
backLogo: v.optional(v.string()),
```

- [ ] **Step 2: Run `npx convex dev` to sync schema**

Run: `npx convex dev --once`
Expected: Schema syncs successfully.

---

### Task 6: Update Admin Orders display

**Files:**
- Modify: `src/pages/admin/Orders.jsx`

- [ ] **Step 1: Update order items display**

Line 306-307, replace:
```jsx
QTY: {item.qty} {item?.size ? `• Size: ${item.size}` : ""} {item?.color ? `• ${item.color}` : ""}
```
With:
```jsx
QTY: {item.qty} {item?.size ? `• Size: ${item.size}` : ""} {item?.color ? `• ${item.color}` : ""} {item?.frontLogo ? `• Front: ${item.frontLogo}` : ""} {item?.backLogo ? `• Back: ${item.backLogo}` : ""} {item?.logo ? `• Logo: ${item.logo}${item.logoPosition ? ` (${item.logoPosition})` : ""}` : ""}
```

Note: The last part (`item?.logo`) preserves backward compatibility with old orders that used the previous schema.

---

### Task 7: Remove Contact page and all references

**Files:**
- Delete: `src/pages/Contact.jsx`
- Modify: `src/data/navigation.js`
- Modify: `src/components/Footer.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Remove Contact from navigation data**

In `src/data/navigation.js`, remove:
```javascript
{ name: "Contact", path: "/contact" },
```

- [ ] **Step 2: Remove Contact Us from Footer**

In `src/components/Footer.jsx`, remove from SUPPORT_LINKS:
```javascript
{ label: "Contact Us", to: "/contact" },
```

- [ ] **Step 3: Remove Contact route and import from App.jsx**

Remove import line 12:
```javascript
import Contact from "./pages/Contact.jsx";
```

Remove route line 44:
```jsx
<Route path="/contact" element={<Contact />} />
```

- [ ] **Step 4: Delete Contact.jsx file**

```bash
rm src/pages/Contact.jsx
```

- [ ] **Step 5: Commit all changes**

```bash
git add -A
git commit -m "feat: front/back logo selection with +1000 CFA fee, remove contact page"
```
