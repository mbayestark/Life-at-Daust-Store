import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../utils';
import App from '../../App';
import { PRODUCTS } from '../../data/products';

// Mocking Convex - returning data directly to avoid persistent loading state in tests
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => PRODUCTS),
    useMutation: vi.fn(() => vi.fn()),
}));

// Mock AOS
vi.mock('aos', () => ({
    default: {
        init: vi.fn(),
        refresh: vi.fn(),
    },
    init: vi.fn(),
    refresh: vi.fn(),
}));

describe('Cart & Checkout Integration', () => {
    it('adds a product to the cart and verify it appears in the cart page', async () => {
        const user = userEvent.setup();

        // Render the whole App to test navigation
        renderWithProviders(<App />);

        // Navigation to Shop
        const shopLinks = screen.getAllByRole('link', { name: /shop/i });
        await user.click(shopLinks[0]);

        // Verify we are on the Shop page
        expect(screen.getByText(/store catalog/i)).toBeInTheDocument();

        // Find a product and click Quick Add
        const quickAddButtons = screen.getAllByText(/quick add/i);
        await user.click(quickAddButtons[0]);

        // Navigate to Cart
        const cartLinks = screen.getAllByRole('link', { name: /cart/i });
        await user.click(cartLinks[0]);

        // Verify the product is in the cart
        expect(screen.getByText(/shopping bag/i)).toBeInTheDocument();
        expect(screen.getAllByText(PRODUCTS[0].name).length).toBeGreaterThan(0);
    });

    it('can remove an item from the cart', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />);

        // Go to shop and add item
        const shopLinks = screen.getAllByRole('link', { name: /shop/i });
        await user.click(shopLinks[0]);
        await user.click(screen.getAllByText(/quick add/i)[0]);

        // Go to cart
        const cartLinks = screen.getAllByRole('link', { name: /cart/i });
        await user.click(cartLinks[0]);

        // Find remove button by title "Remove from bag"
        const removeButton = screen.getByTitle(/remove from bag/i);
        await user.click(removeButton);

        // Verify cart is empty
        await waitFor(() => {
            expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
        });
    });

    it('proceeds to checkout from the cart', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />);

        // Add item
        const shopLinks = screen.getAllByRole('link', { name: /shop/i });
        await user.click(shopLinks[0]);
        await user.click(screen.getAllByText(/quick add/i)[0]);

        // Go to cart
        const cartLinks = screen.getAllByRole('link', { name: /cart/i });
        await user.click(cartLinks[0]);

        // Click Checkout button
        const checkoutButton = screen.getByRole('button', { name: /checkout/i });
        await user.click(checkoutButton);

        // Verify we are on the Checkout page
        expect(screen.getByText(/complete your order/i)).toBeInTheDocument();
    });
});
