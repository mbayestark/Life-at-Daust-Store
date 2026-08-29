import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

export function renderWithProviders(ui, options = {}) {
    const { route = '/', ...renderOptions } = options;

    if (route !== '/') {
        window.history.pushState({}, 'Test page', route);
    }

    return render(
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    {ui}
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>,
        renderOptions
    );
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
