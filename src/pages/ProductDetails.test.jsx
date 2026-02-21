import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import ProductDetails from './ProductDetails';

// Mock Convex
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => null), // Simulate loading state
}));

describe('ProductDetails Page', () => {
    it('renders "product not found" state when no id is provided', () => {
        // Without a URL param, id is undefined, isConvexId is false,
        // product resolves to null → renders "Product not found" state
        renderWithProviders(<ProductDetails />);
        expect(screen.getByText(/Product not found/i)).toBeInTheDocument();
    });

    it('shows a link back to shop when product is not found', () => {
        renderWithProviders(<ProductDetails />);
        const returnLink = screen.getByRole('link', { name: /Return to Shop/i });
        expect(returnLink).toHaveAttribute('href', '/shop');
    });
});
