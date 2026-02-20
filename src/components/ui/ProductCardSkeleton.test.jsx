import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProductCardSkeleton from './ProductCardSkeleton';

describe('ProductCardSkeleton UI Component', () => {
    it('renders the correct number of skeletons', () => {
        const { container } = render(<ProductCardSkeleton />);
        // It should have several skeletons for image, title, price, etc.
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(3);
    });

    it('applies container classes', () => {
        const { container } = render(<ProductCardSkeleton />);
        expect(container.firstChild).toHaveClass('bg-white');
        expect(container.firstChild).toHaveClass('premium-shadow');
    });
});
