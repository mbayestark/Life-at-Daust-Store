import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Additional render options
 * @returns {Object} - Render result from @testing-library/react
 */
export function renderWithProviders(ui, options = {}) {
    const { route = '/', ...renderOptions } = options;

    // Set initial route if provided
    if (route !== '/') {
        window.history.pushState({}, 'Test page', route);
    }

    return render(
        <BrowserRouter>
            <CartProvider>
                {ui}
            </CartProvider>
        </BrowserRouter>,
        renderOptions
    );
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
