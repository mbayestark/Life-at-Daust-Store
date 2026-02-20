import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from './Hero';

describe('Hero Component', () => {
    const props = {
        title: 'Empowering the Next Generation',
        subtitle: 'Wear your ambition',
        cta: 'Shop the Collection',
        to: '/shop'
    };

    it('renders heading and subheading', () => {
        render(
            <BrowserRouter>
                <Hero {...props} />
            </BrowserRouter>
        );

        expect(screen.getByText(/Empowering the Next Generation/i)).toBeInTheDocument();
        expect(screen.getByText(/Wear your ambition/i)).toBeInTheDocument();
    });

    it('contains a link to the shop', () => {
        render(
            <BrowserRouter>
                <Hero {...props} />
            </BrowserRouter>
        );

        const shopLink = screen.getByRole('link', { name: /Shop the Collection/i });
        expect(shopLink).toHaveAttribute('href', '/shop');
    });
});
