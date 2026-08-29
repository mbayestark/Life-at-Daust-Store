import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import ProductCard from './ProductCard';

const mockProduct = {
    _id: 'prod_1',
    name: 'DAUST Water Bottle',
    price: 5000,
    image: '/test-image.jpg',
    category: 'Accessories',
    rating: 4.5,
};

const mockProductWithSpecs = {
    ...mockProduct,
    _id: 'prod_2',
    name: 'DAUST Hoodie',
    colors: [{ name: 'Blue', hex: '#00f' }],
    sizes: ['S', 'M', 'L'],
};

describe('ProductCard Component', () => {
    it('renders product information correctly', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        expect(screen.getByText('DAUST Water Bottle')).toBeInTheDocument();
        expect(screen.getByText(/5.000.CFA/)).toBeInTheDocument();
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
        expect(links[0]).toHaveAttribute('href', '/product/prod_1');
    });

    it('displays rating', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('shows Quick Add for products without specs', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);

        expect(screen.getByText(/Quick Add/i)).toBeInTheDocument();
    });

    it('shows Select Options for products with specs', () => {
        renderWithProviders(<ProductCard product={mockProductWithSpecs} />);

        expect(screen.getByText(/Select Options/i)).toBeInTheDocument();
    });

    it('displays badge if product has one', () => {
        const productWithBadge = { ...mockProduct, badge: 'New Arrival' };
        renderWithProviders(<ProductCard product={productWithBadge} />);

        expect(screen.getByText('New Arrival')).toBeInTheDocument();
    });

    it('shows sale price when on sale', () => {
        const saleProduct = { ...mockProduct, salePrice: 3500 };
        renderWithProviders(<ProductCard product={saleProduct} />);

        expect(screen.getByText(/3.500.CFA/)).toBeInTheDocument();
        expect(screen.getByText(/5.000.CFA/)).toBeInTheDocument();
        expect(screen.getByText('Solde')).toBeInTheDocument();
    });

    it('returns null when product is undefined', () => {
        const { container } = renderWithProviders(<ProductCard product={undefined} />);
        expect(container.firstChild).toBeNull();
    });
});
