import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

// Mock logo asset
vi.mock('../assets/logo.png', () => ({
    default: 'test-file-stub'
}));

describe('Footer Component', () => {
    it('renders column titles and brand info', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );

        expect(screen.getByText(/Shop/i)).toBeInTheDocument();
        expect(screen.getByText(/Information/i)).toBeInTheDocument();
        expect(screen.getByText(/Support/i)).toBeInTheDocument();
        expect(screen.getByText(/Connect/i)).toBeInTheDocument();
        expect(screen.getByText(/Handcrafted with pride in Dakar/i)).toBeInTheDocument();
    });

    it('contains policy links at the bottom', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );

        expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
        expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
        expect(screen.getByText(/Cookie Policy/i)).toBeInTheDocument();
    });
});
