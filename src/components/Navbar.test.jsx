import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import Navbar from './Navbar';

// Mock convex
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => []), // Return empty array for collections
}));

// Mock logo asset
vi.mock('../assets/logo.png', () => ({
    default: 'test-file-stub'
}));

describe('Navbar Component', () => {
    it('renders logo and main navigation links', () => {
        renderWithProviders(<Navbar />);

        // Use getAllBy as elements appear in both desktop and mobile menus
        expect(screen.getAllByAltText('Life at DAUST')[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Shop/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Collections/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/About/i)[0]).toBeInTheDocument();
    });

    it('renders the cart icon', () => {
        renderWithProviders(<Navbar />);
        expect(screen.getAllByLabelText(/cart/i)[0]).toBeInTheDocument();
    });
});
