import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { userEvent } from '../utils';
import App from '../../App';

// Mock product data - using sample data since products come from Convex
const MOCK_PRODUCTS = [
    {
        _id: 'test-1',
        id: 'test-1',
        name: 'Test T-Shirt',
        price: 5000,
        category: 'T-Shirts',
        image: '/test-image.jpg',
        colors: [{ name: 'Black', hex: '#000000' }],
        sizes: ['S', 'M', 'L'],
    },
    {
        _id: 'test-2',
        id: 'test-2',
        name: 'Test Hoodie',
        price: 8000,
        category: 'Hoodies',
        image: '/test-hoodie.jpg',
        colors: [{ name: 'Navy', hex: '#000080' }],
        sizes: ['S', 'M', 'L', 'XL'],
    },
];

// Mocking Convex
vi.mock('convex/react', () => ({
    useQuery: vi.fn((apiName) => {
        // Distinguish between products and collections to avoid rendering errors/huge dropdowns
        if (typeof apiName === 'string' && apiName.includes('collections')) {
            return [{ name: 'Test Collection', slug: 'test' }];
        }
        return MOCK_PRODUCTS;
    }),
    useMutation: vi.fn(() => vi.fn()),
    useAction: vi.fn(() => vi.fn()),
}));

// Mock AOS
vi.mock('aos', () => ({
    default: { init: vi.fn(), refresh: vi.fn() },
    init: vi.fn(),
    refresh: vi.fn(),
}));

describe('Cart & Checkout Integration', () => {
    // Increase timeout for complex integration tests
    const testTimeout = 15000;

    it('adds a product to the cart and verify it appears in the cart page', async () => {
        const user = userEvent.setup();

        // Render WITHOUT renderWithProviders to avoid duplicate CartProvider
        // but we still need BrowserRouter
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Verification of Home page
        await waitFor(() => {
            expect(screen.getByText(/Life At Daust Store/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        // Navigate to Shop using Hero CTA
        const shopCTA = screen.getByText(/shop collection/i);
        await user.click(shopCTA);

        // Find a product and click add button
        const addButtons = await screen.findAllByLabelText(/add to cart/i);
        await user.click(addButtons[0]);

        // Navigate to Cart
        const cartLinks = screen.getAllByRole('link', { name: /cart/i });
        await user.click(cartLinks[0]);

        // Verify the product is in the cart
        expect(screen.getByText(/shopping bag/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getAllByText(MOCK_PRODUCTS[0].name).length).toBeGreaterThan(0);
        });
    }, testTimeout);

    it('can remove an item from the cart', async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Go to shop
        const shopCTA = await screen.findByText(/shop collection/i);
        await user.click(shopCTA);

        const addButtons = await screen.findAllByLabelText(/add to cart/i);
        await user.click(addButtons[0]);

        // Go to cart
        const cartLinks = screen.getAllByRole('link', { name: /cart/i });
        await user.click(cartLinks[0]);

        // Find remove button by title "Remove from bag"
        const removeButton = await screen.findByTitle(/remove from bag/i);
        await user.click(removeButton);

        // Verify cart is empty
        await waitFor(() => {
            expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
        });
    }, testTimeout);

    it('proceeds to checkout from the cart', async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Add item
        const shopCTA = await screen.findByText(/shop collection/i);
        await user.click(shopCTA);

        const addButtons = await screen.findAllByLabelText(/add to cart/i);
        await user.click(addButtons[0]);

        // Go to cart
        const cartLinks = screen.getAllByRole('link', { name: /cart/i });
        await user.click(cartLinks[0]);

        // Click Checkout button
        const checkoutButton = await screen.findByRole('button', { name: /checkout/i });
        await user.click(checkoutButton);

        // Verify we are on the Checkout page
        expect(screen.getByRole('heading', { name: /complete your order/i })).toBeInTheDocument();
    }, testTimeout);
});
