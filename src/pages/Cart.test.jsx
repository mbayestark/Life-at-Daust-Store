import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import Cart from './Cart';

describe('Cart Page', () => {
    it('renders empty cart state by default', () => {
        renderWithProviders(<Cart />);
        expect(screen.getByText(/Your bag is empty/i)).toBeInTheDocument();
        expect(screen.getByText(/Looks like you haven't added anything yet/i)).toBeInTheDocument();
    });

    it('contains a link back to shop', () => {
        renderWithProviders(<Cart />);
        const shopLink = screen.getByRole('link', { name: /Start Shopping/i });
        expect(shopLink).toHaveAttribute('href', '/shop');
    });
});
