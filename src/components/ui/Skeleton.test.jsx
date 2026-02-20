import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton from './Skeleton';

describe('Skeleton UI Component', () => {
    it('renders with default classes', () => {
        const { container } = render(<Skeleton />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('bg-gray-200');
        expect(skeleton).toHaveClass('rounded-md');
    });

    it('applies custom className', () => {
        const { container } = render(<Skeleton className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies arbitrary props', () => {
        const { container } = render(<Skeleton data-testid="skeleton-test" />);
        expect(container.querySelector('[data-testid="skeleton-test"]')).toBeInTheDocument();
    });
});
