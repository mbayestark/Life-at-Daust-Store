import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import Shop from './Shop';

// Mock Convex
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => []),
}));

describe('Shop Page', () => {
    it('renders shop title and search input', () => {
        renderWithProviders(<Shop />);

        expect(screen.getByText(/Find your vision/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search products/i)).toBeInTheDocument();
    });

    it('displays filters section', () => {
        renderWithProviders(<Shop />);
        expect(screen.getByText(/Categories/i)).toBeInTheDocument();
        expect(screen.getByText(/Sort By/i)).toBeInTheDocument();
    });

    it('displays empty state when no products found', () => {
        renderWithProviders(<Shop />);
        expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });
});
