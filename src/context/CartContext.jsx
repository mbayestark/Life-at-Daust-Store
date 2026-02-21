import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lifeAtDaust.cart.v1";

// eslint-disable-next-line react-refresh/only-export-components
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

      const i = prev.findIndex(p => p.id === product.id && p.selectedColor === color && p.selectedSize === size);
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
        selectedSize: size
      }];
    });
  };

  const removeItem = (id, color, size) => {
    setItems(prev => prev.filter(p => !(p.id === id && p.selectedColor === color && p.selectedSize === size)));
  };

  const setQty = (id, color, size, qty) =>
    setItems(prev => prev.map(p =>
      (p.id === id && p.selectedColor === color && p.selectedSize === size)
        ? { ...p, qty: Math.max(1, Math.min(99, qty)) }
        : p
    ));

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((n, p) => n + p.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, p) => s + p.price * p.qty, 0), [items]);

  // New calculations for Checkout
  const shipping = subtotal > 0 ? 0 : 0; // Complimentary as per design
  const tax = subtotal * 0.05; // 5% example tax
  const total = subtotal + shipping + tax;

  const value = {
    items,
    addItem,
    removeItem,
    setQty,
    clear,
    count,
    subtotal,
    shipping,
    tax,
    total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};