import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lifeAtDaust.cart.v1";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems(prev => {
      const color = product.selectedColor || (product.colors?.[0]?.name) || null;
      const size = product.selectedSize || (product.sizes?.[0]) || null;
      const logo = product.selectedLogo || (product.logos?.[0]?.name) || null;

      const i = prev.findIndex(p => 
        p.id === product.id && 
        p.selectedColor === color && 
        p.selectedSize === size &&
        p.selectedLogo === logo &&
        !p.isProductSet
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, 99) };
        return next;
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: Math.min(qty, 99),
        selectedColor: color,
        selectedSize: size,
        selectedLogo: logo,
        isProductSet: false,
      }];
    });
  };

  const addProductSet = (productSet, qty = 1) => {
    setItems(prev => {
      // Check if this exact product set is already in cart
      const i = prev.findIndex(p => 
        p.isProductSet && 
        p.productSetId === productSet._id
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, 99) };
        return next;
      }
      return [...prev, {
        id: `set-${productSet._id}`,
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
        selectedColor: null,
        selectedSize: null,
        selectedLogo: null,
      }];
    });
  };

  const removeItem = (id, color, size, logo, isProductSet = false) => {
    setItems(prev => prev.filter(p => 
      !(p.id === id && p.selectedColor === color && p.selectedSize === size && p.selectedLogo === logo && p.isProductSet === isProductSet)
    ));
  };

  const setQty = (id, color, size, logo, qty, isProductSet = false) =>
    setItems(prev => prev.map(p =>
      (p.id === id && p.selectedColor === color && p.selectedSize === size && p.selectedLogo === logo && p.isProductSet === isProductSet)
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

  const shipping = subtotal > 0 ? 0 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

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
    shipping,
    tax,
    total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
