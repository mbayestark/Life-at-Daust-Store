import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Toast from "../components/ui/Toast";

const STORAGE_KEY = "lifeAtDaust.cart.v2";

export const CartContext = createContext(null);

// Helper function to normalize values (convert undefined/null to null for consistent comparison)
const normalize = (v) => v || null;

// Helper function to compare product set variant selections
const matchesVariantSelections = (selections1, selections2) => {
  const s1 = selections1 || {};
  const s2 = selections2 || {};

  // Get all unique product IDs from both selections
  const allProductIds = new Set([
    ...Object.keys(s1),
    ...Object.keys(s2)
  ]);

  // Compare each product's selections
  for (const productId of allProductIds) {
    const v1 = s1[productId] || {};
    const v2 = s2[productId] || {};

    if (normalize(v1.color) !== normalize(v2.color)) return false;
    if (normalize(v1.size) !== normalize(v2.size)) return false;
    if (normalize(v1.logo) !== normalize(v2.logo)) return false;
  }

  return true;
};

// Helper function to check if a cart item matches the given criteria
const matchesCartItem = (item, id, color, size, frontLogo, backLogo, sideLogo, hoodieType, isProductSet, isCropTop) => {
  if (item.isProductSet !== isProductSet) return false;

  if (isProductSet) {
    return item.productSetId === id;
  }

  return (
    item.id === id &&
    normalize(item.selectedColor) === normalize(color) &&
    normalize(item.selectedSize) === normalize(size) &&
    normalize(item.selectedFrontLogo) === normalize(frontLogo) &&
    normalize(item.selectedBackLogo) === normalize(backLogo) &&
    normalize(item.selectedSideLogo) === normalize(sideLogo) &&
    normalize(item.selectedHoodieType) === normalize(hoodieType) &&
    !!item.isCropTop === !!isCropTop
  );
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const showToast = (message) => {
    setToastMessage(message);
  };

  const hideToast = () => {
    setToastMessage("");
  };

  const addItem = (product, qty = 1) => {
    setItems(prev => {
      const color = product.selectedColor || (product.colors?.[0]?.name) || null;
      const size = product.selectedSize || (product.sizes?.[0]) || null;
      const frontLogo = product.selectedFrontLogo || null;
      const backLogo = product.selectedBackLogo || null;
      const sideLogo = product.selectedSideLogo || null;
      const hoodieType = product.selectedHoodieType || null;
      const cropTop = !!product.isCropTop;

      const i = prev.findIndex(p =>
        matchesCartItem(p, product._id, color, size, frontLogo, backLogo, sideLogo, hoodieType, false, cropTop)
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, 99) };
        return next;
      }
      return [...prev, {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: Math.min(qty, 99),
        selectedColor: color,
        selectedSize: size,
        selectedFrontLogo: frontLogo,
        selectedBackLogo: backLogo,
        selectedSideLogo: sideLogo,
        selectedHoodieType: hoodieType,
        isCropTop: cropTop,
        isProductSet: false,
      }];
    });
  };

  const addProductSet = (productSet, variantSelections = {}, qty = 1) => {
    // variantSelections is { [productId]: { color, size, logo } }
    setItems(prev => {
      // Check if this exact product set with same variant selections is already in cart
      const i = prev.findIndex(p =>
        p.isProductSet &&
        p.productSetId === productSet._id &&
        matchesVariantSelections(p.variantSelections, variantSelections)
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, 99) };
        return next;
      }
      return [...prev, {
        id: `set-${productSet._id}-${Date.now()}`,
        productSetId: productSet._id,
        name: productSet.name,
        price: productSet.specialPrice,
        image: productSet.image,
        qty: Math.min(qty, 99),
        isProductSet: true,
        productSetName: productSet.name,
        products: productSet.products,
        originalPrice: productSet.originalPrice,
        savings: productSet.savings,
        variantSelections,
        selectedColor: null,
        selectedSize: null,
        selectedFrontLogo: null,
        selectedBackLogo: null,
      }];
    });
  };

  const removeItem = (id, color, size, frontLogo, backLogo, sideLogo, isProductSet = false, hoodieType = null, isCropTop = false) => {
    setItems(prev => prev.filter(p =>
      !matchesCartItem(p, id, color, size, frontLogo, backLogo, sideLogo, hoodieType, isProductSet, isCropTop)
    ));
  };

  const setQty = (id, color, size, frontLogo, backLogo, sideLogo, qty, isProductSet = false, hoodieType = null, isCropTop = false) =>
    setItems(prev => prev.map(p =>
      matchesCartItem(p, id, color, size, frontLogo, backLogo, sideLogo, hoodieType, isProductSet, isCropTop)
        ? { ...p, qty: Math.max(1, Math.min(99, qty)) }
        : p
    ));

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((n, p) => n + p.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, p) => s + p.price * p.qty, 0), [items]);

  // Calculate savings from product sets
  const totalSavings = useMemo(() => 
    items.filter(p => p.isProductSet).reduce((s, p) => s + (p.savings || 0) * p.qty, 0),
    [items]
  );

  const LOGO_FEE = 500;

  const logoFees = useMemo(() =>
    items.reduce((sum, p) => {
      if (!p.isProductSet) {
        const freeLogos = ["DAUSTIAN+ENGINEERS"];
        const countBillable = (str) =>
          str ? str.split(", ").filter(name => !freeLogos.includes(name)).length : 0;
        const totalLogos = countBillable(p.selectedFrontLogo) + countBillable(p.selectedBackLogo) + countBillable(p.selectedSideLogo);
        const extraLogos = Math.max(0, totalLogos - 2);
        return sum + extraLogos * LOGO_FEE * p.qty;
      }
      return sum;
    }, 0),
    [items]
  );

  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping + logoFees;

  const value = {
    items,
    addItem,
    addProductSet,
    removeItem,
    setQty,
    clear,
    count,
    subtotal,
    totalSavings,
    logoFees,
    LOGO_FEE,
    shipping,
    total,
    showToast,
    toastMessage,
    hideToast
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {toastMessage && <Toast message={toastMessage} onClose={hideToast} />}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
