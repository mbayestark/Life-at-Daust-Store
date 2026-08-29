import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { userEvent } from '../utils';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';
import Shop from '../../pages/Shop';
import Cart from '../../pages/Cart';

const MOCK_PRODUCTS = [
    {
        _id: 'test-1',
        name: 'DAUST Mug',
        price: 3000,
        category: 'Drinkware',
        image: '/test-mug.jpg',
        rating: 4,
        isActive: true,
    },
    {
        _id: 'test-2',
        name: 'DAUST Hoodie',
        price: 15000,
        category: 'Hoodies',
        image: '/test-hoodie.jpg',
        rating: 5,
        isActive: true,
        colors: [{ name: 'Navy', hex: '#000080' }],
        sizes: ['M', 'L'],
    },
];

vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => MOCK_PRODUCTS),
    useMutation: vi.fn(() => vi.fn()),
    useAction: vi.fn(() => vi.fn()),
}));

function renderPage(Page) {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Page />
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

describe('Cart & Checkout Integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('shop page renders products and shows correct button labels', async () => {
        renderPage(Shop);

        expect((await screen.findAllByText('DAUST Mug')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('DAUST Hoodie').length).toBeGreaterThan(0);

        // Mug has no specs → "Add to Cart"
        const addButtons = screen.getAllByLabelText(/add to cart/i);
        expect(addButtons.length).toBeGreaterThan(0);

        // Hoodie has colors+sizes → "Select Options"
        const selectButtons = screen.getAllByLabelText(/select options/i);
        expect(selectButtons.length).toBeGreaterThan(0);
    }, 10000);

    it('adds a simple product to cart and it appears on cart page', async () => {
        const user = userEvent.setup();

        // Render shop and add the mug
        const { unmount } = renderPage(Shop);
        const addButton = (await screen.findAllByLabelText(/add to cart/i))[0];
        await user.click(addButton);
        unmount();

        // Render cart page — item should be there via localStorage
        renderPage(Cart);
        expect(await screen.findByText('DAUST Mug')).toBeInTheDocument();
    }, 10000);

    it('empty cart shows empty state', () => {
        renderPage(Cart);
        expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
    });
});
