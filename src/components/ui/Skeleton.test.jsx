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
        // Default variant is 'rect' which applies 'rounded-lg'
        expect(skeleton).toHaveClass('rounded-lg');
    });

    it('applies custom className', () => {
        const { container } = render(<Skeleton className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies circle variant', () => {
        const { container } = render(<Skeleton variant="circle" />);
        expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('applies text variant', () => {
        const { container } = render(<Skeleton variant="text" />);
        expect(container.firstChild).toHaveClass('rounded');
        expect(container.firstChild).toHaveClass('h-4');
        expect(container.firstChild).toHaveClass('w-full');
    });
});
