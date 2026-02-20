import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CartContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

    it('starts with an empty cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        expect(result.current.items).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.subtotal).toBe(0);
    });

    it('adds an item to the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Test Product', price: 1000, image: 'test.jpg' };

        act(() => {
            result.current.addItem(product, 2);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].qty).toBe(2);
        expect(result.current.count).toBe(2);
        expect(result.current.subtotal).toBe(2000);
    });

    it('increments quantity when adding same item', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Test Product', price: 1000, image: 'test.jpg' };

        act(() => {
            result.current.addItem(product, 1);
            result.current.addItem(product, 2);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].qty).toBe(3);
    });

    it('removes an item from the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Test Product', price: 1000, image: 'test.jpg' };

        act(() => {
            result.current.addItem(product, 1);
        });
        expect(result.current.items).toHaveLength(1);

        act(() => {
            const item = result.current.items[0];
            result.current.removeItem(item.id, item.selectedColor, item.selectedSize);
        });

        expect(result.current.items).toHaveLength(0);
    });

    it('sets quantity of an item', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Test Product', price: 1000, image: 'test.jpg' };

        act(() => {
            result.current.addItem(product, 1);
        });

        act(() => {
            const item = result.current.items[0];
            result.current.setQty(item.id, item.selectedColor, item.selectedSize, 5);
        });

        expect(result.current.items[0].qty).toBe(5);
    });

    it('clears the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Test Product', price: 1000, image: 'test.jpg' };

        act(() => {
            result.current.addItem(product, 1);
            result.current.clear();
        });

        expect(result.current.items).toHaveLength(0);
    });

    it('calculates total with tax', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = { id: 1, name: 'Test Product', price: 1000, image: 'test.jpg' };

        act(() => {
            result.current.addItem(product, 1);
        });

        // subtotal 1000, tax 5% = 50, total = 1050
        expect(result.current.subtotal).toBe(1000);
        expect(result.current.tax).toBe(50);
        expect(result.current.total).toBe(1050);
    });
});
