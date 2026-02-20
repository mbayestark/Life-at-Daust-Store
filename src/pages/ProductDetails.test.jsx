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
    it('renders loading state initially', () => {
        renderWithProviders(<ProductDetails />);
        // It should render some skeletons or loading indicator
        // Based on ProductDetails.jsx it renders skeletons if !product
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
