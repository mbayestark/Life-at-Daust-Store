import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';
import ProductCard from './ProductCard';

const mockProduct = {
    id: 1,
    name: 'DAUST Water Bottle',
    price: 29.99,
    image: '/test-image.jpg',
    category: 'Accessories',
    rating: 4.5,
    colors: ['Blue', 'Red'],
    sizes: ['S', 'M', 'L'],
};

describe('ProductCard Component', () => {
    it('renders product information correctly', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        expect(screen.getByText('DAUST Water Bottle')).toBeInTheDocument();
        expect(screen.getByText('30 CFA')).toBeInTheDocument();
        expect(screen.getByText('Accessories')).toBeInTheDocument();
    });

    it('displays product image with correct alt text', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', '/test-image.jpg');
        expect(image).toHaveAttribute('alt', 'DAUST Water Bottle');
    });

    it('links to product details page', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', '/product/1');
        expect(links[1]).toHaveAttribute('href', '/product/1');
    });

    it('displays rating stars', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('shows quick add button on desktop', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        expect(screen.getByText(/quick add/i)).toBeInTheDocument();

        expect(screen.getByLabelText(/add to cart/i)).toBeInTheDocument();
    });

    it('displays badge if product has one', () => {
        const productWithBadge = { ...mockProduct, badge: 'New Arrival' };
        renderWithProviders(<ProductCard product={productWithBadge} />);

        expect(screen.getByText('New Arrival')).toBeInTheDocument();
    });

    it('handles products without colors or sizes', () => {
        const simpleProduct = {
            id: 2,
            name: 'Simple Product',
            price: 19.99,
            image: '/simple.jpg',
            category: 'Test',
            rating: 5,
        };

        renderWithProviders(<ProductCard product={simpleProduct} />);
        expect(screen.getByText('Simple Product')).toBeInTheDocument();
    });

    it('returns null when product is undefined', () => {
        const { container } = renderWithProviders(<ProductCard product={undefined} />);
        expect(container.firstChild).toBeNull();
    });
});
