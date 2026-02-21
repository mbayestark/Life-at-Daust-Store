import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import Cart from './Cart';

describe('Cart Page', () => {
    it('renders empty cart state by default', () => {
        renderWithProviders(<Cart />);
        // Heading shown when cart is empty
        expect(screen.getByText(/Your Bag is Empty/i)).toBeInTheDocument();
        // Subtitle text shown in empty state
        expect(screen.getByText(/Items stay in your bag for a limited time/i)).toBeInTheDocument();
    });

    it('contains a link back to shop', () => {
        renderWithProviders(<Cart />);
        // The CTA button in the empty state links to /shop
        const shopLink = screen.getByRole('link', { name: /Discover What's New/i });
        expect(shopLink).toHaveAttribute('href', '/shop');
    });
});
