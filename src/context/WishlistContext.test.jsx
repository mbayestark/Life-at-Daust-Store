import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WishlistProvider, useWishlist } from './WishlistContext';

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

describe('WishlistContext', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    const wrapper = ({ children }) => <WishlistProvider>{children}</WishlistProvider>;

    it('starts with an empty wishlist', () => {
        const { result } = renderHook(() => useWishlist(), { wrapper });
        expect(result.current.wishlist).toEqual([]);
        expect(result.current.wishlistCount).toBe(0);
    });

    it('toggles an item in the wishlist', () => {
        const { result } = renderHook(() => useWishlist(), { wrapper });
        const product = { id: 1, name: 'Test Product' };

        act(() => {
            result.current.toggleWishlist(product);
        });

        expect(result.current.wishlist).toHaveLength(1);
        expect(result.current.isInWishlist(1)).toBe(true);
        expect(result.current.wishlistCount).toBe(1);

        act(() => {
            result.current.toggleWishlist(product);
        });

        expect(result.current.wishlist).toHaveLength(0);
        expect(result.current.isInWishlist(1)).toBe(false);
    });

    it('handles products with _id', () => {
        const { result } = renderHook(() => useWishlist(), { wrapper });
        const product = { _id: 'abc', name: 'Test Product' };

        act(() => {
            result.current.toggleWishlist(product);
        });

        expect(result.current.isInWishlist('abc')).toBe(true);
    });
});
