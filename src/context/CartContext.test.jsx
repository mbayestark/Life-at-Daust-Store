import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

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

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const makeProduct = (overrides = {}) => ({
    _id: "prod_1",
    name: "T-Shirt",
    price: 7500,
    image: "test.jpg",
    colors: [{ name: "Black", hex: "#000" }],
    sizes: ["M", "L"],
    ...overrides,
});

describe('CartContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('starts empty', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        expect(result.current.items).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.subtotal).toBe(0);
        expect(result.current.total).toBe(0);
    });

    it('adds a product and computes subtotal', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => result.current.addItem(makeProduct(), 2));

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].qty).toBe(2);
        expect(result.current.count).toBe(2);
        expect(result.current.subtotal).toBe(15000);
    });

    it('uses sale price when on sale', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => result.current.addItem(makeProduct({ salePrice: 5000 }), 1));

        expect(result.current.items[0].price).toBe(5000);
        expect(result.current.subtotal).toBe(5000);
    });

    it('ignores sale price when >= regular price', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => result.current.addItem(makeProduct({ salePrice: 9000 }), 1));

        expect(result.current.items[0].price).toBe(7500);
    });

    it('ignores null sale price', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => result.current.addItem(makeProduct({ salePrice: null }), 1));

        expect(result.current.items[0].price).toBe(7500);
    });

    it('increments qty when adding same product+variant', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const p = makeProduct();
        act(() => {
            result.current.addItem(p, 1);
            result.current.addItem(p, 2);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].qty).toBe(3);
    });

    it('treats different colors as separate items', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => {
            result.current.addItem(makeProduct({ selectedColor: "Black" }), 1);
            result.current.addItem(makeProduct({ selectedColor: "White" }), 1);
        });

        expect(result.current.items).toHaveLength(2);
        expect(result.current.count).toBe(2);
    });

    it('treats different sizes as separate items', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => {
            result.current.addItem(makeProduct({ selectedSize: "M" }), 1);
            result.current.addItem(makeProduct({ selectedSize: "L" }), 1);
        });

        expect(result.current.items).toHaveLength(2);
    });

    it('caps quantity at 99', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => result.current.addItem(makeProduct(), 100));

        expect(result.current.items[0].qty).toBe(99);
    });

    it('removes item by variant match', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => {
            result.current.addItem(makeProduct({ selectedColor: "Red", colors: [] }), 1);
            result.current.addItem(makeProduct({ selectedColor: "White", colors: [] }), 1);
        });
        expect(result.current.items).toHaveLength(2);

        const target = result.current.items[0];
        act(() => result.current.removeItem(
            target.id, target.selectedColor, target.selectedSize,
            target.selectedFrontLogo, target.selectedBackLogo, target.selectedSideLogo,
        ));
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].selectedColor).toBe("White");
    });

    it('setQty clamps between 1 and 99', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => result.current.addItem(makeProduct(), 1));

        const item = result.current.items[0];
        act(() => result.current.setQty(item.id, item.selectedColor, item.selectedSize, null, null, null, 0));
        expect(result.current.items[0].qty).toBe(1);

        act(() => result.current.setQty(item.id, item.selectedColor, item.selectedSize, null, null, null, 200));
        expect(result.current.items[0].qty).toBe(99);
    });

    it('clear empties the cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        act(() => {
            result.current.addItem(makeProduct(), 3);
            result.current.clear();
        });

        expect(result.current.items).toHaveLength(0);
        expect(result.current.total).toBe(0);
    });

    describe('logo fees', () => {
        it('no fee for 2 or fewer billable logos', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addItem(makeProduct({
                selectedFrontLogo: "Logo A",
                selectedBackLogo: "Logo B",
            }), 1));

            expect(result.current.logoFees).toBe(0);
        });

        it('charges 500 CFA per extra logo beyond 2', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addItem(makeProduct({
                selectedFrontLogo: "Logo A",
                selectedBackLogo: "Logo B",
                selectedSideLogo: "Logo C",
            }), 2));

            // 3 logos - 2 free = 1 extra × 500 × qty 2
            expect(result.current.logoFees).toBe(1000);
        });

        it('DAUSTIAN+ENGINEERS logo is free', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addItem(makeProduct({
                selectedFrontLogo: "DAUSTIAN+ENGINEERS",
                selectedBackLogo: "Logo B",
                selectedSideLogo: "Logo C",
            }), 1));

            // Only 2 billable logos (B + C), within free allowance
            expect(result.current.logoFees).toBe(0);
        });
    });

    describe('product sets', () => {
        const makeSet = (overrides = {}) => ({
            _id: "set_1",
            name: "Bundle Deal",
            specialPrice: 12000,
            image: "set.jpg",
            originalPrice: 15000,
            savings: 3000,
            products: [
                { productId: "prod_1", productName: "T-Shirt", quantity: 1 },
                { productId: "prod_2", productName: "Cap", quantity: 1 },
            ],
            ...overrides,
        });

        it('adds a product set at specialPrice', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addProductSet(makeSet()));

            expect(result.current.items).toHaveLength(1);
            expect(result.current.items[0].price).toBe(12000);
            expect(result.current.items[0].isProductSet).toBe(true);
            expect(result.current.subtotal).toBe(12000);
        });

        it('computes totalSavings from product sets', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addProductSet(makeSet(), {}, 2));

            expect(result.current.totalSavings).toBe(6000); // 3000 × 2
        });

        it('increments qty when adding same set with same variants', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const s = makeSet();
            const variants = { prod_1: { color: "Black", size: "M" } };
            act(() => {
                result.current.addProductSet(s, variants, 1);
                result.current.addProductSet(s, variants, 1);
            });

            expect(result.current.items).toHaveLength(1);
            expect(result.current.items[0].qty).toBe(2);
        });

        it('separates sets with different variant selections', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const s = makeSet();
            act(() => {
                result.current.addProductSet(s, { prod_1: { color: "Black" } }, 1);
                result.current.addProductSet(s, { prod_1: { color: "White" } }, 1);
            });

            expect(result.current.items).toHaveLength(2);
        });

        it('no logo fees on product sets', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addProductSet(makeSet()));

            expect(result.current.logoFees).toBe(0);
        });
    });

    describe('total', () => {
        it('total = subtotal + logoFees', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            act(() => result.current.addItem(makeProduct({
                selectedFrontLogo: "A",
                selectedBackLogo: "B",
                selectedSideLogo: "C",
            }), 1));

            // subtotal: 7500, logoFees: 500 (1 extra logo)
            expect(result.current.total).toBe(8000);
        });
    });
});
