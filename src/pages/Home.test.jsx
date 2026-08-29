import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import Home from './Home';

vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => []),
}));

describe('Home Page', () => {
    it('renders hero and featured collections sections', () => {
        renderWithProviders(<Home />);

        expect(screen.getByText(/Welcome to the Life At Daust Store/i)).toBeInTheDocument();
        expect(screen.getByText(/Featured Collections/i)).toBeInTheDocument();
    });

    it('gracefully handles empty product list', () => {
        renderWithProviders(<Home />);

        // With no products, featured product section should not render
        expect(screen.queryByText(/Featured Product/i)).not.toBeInTheDocument();
    });
});
