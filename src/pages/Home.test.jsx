import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import Home from './Home';

// Mock Convex
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => []), // Return empty array to test defensive rendering
}));

describe('Home Page', () => {
    it('renders hero and featured collections sections', () => {
        renderWithProviders(<Home />);

        // Assert on Hero content (title passed from Home.jsx)
        expect(screen.getByText(/Welcome to the Life At Daust Store/i)).toBeInTheDocument();

        // Assert on Featured Collections section heading
        expect(screen.getByText(/Featured Collections/i)).toBeInTheDocument();
    });

    it('gracefully handles missing featured product', () => {
        // Since useQuery returns empty array, featuredProduct will be undefined
        renderWithProviders(<Home />);

        // "Featured Product" badge should NOT be in document
        expect(screen.queryByText(/Featured Product/i)).not.toBeInTheDocument();
    });
});
