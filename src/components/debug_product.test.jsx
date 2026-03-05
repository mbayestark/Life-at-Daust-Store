import { describe, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import ProductCard from './ProductCard';
import React from 'react';

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

describe('ProductCard Debug', () => {
    it('debug output', () => {
        renderWithProviders(<ProductCard product={mockProduct} />);
        console.log(document.body.innerHTML);
    });
});
