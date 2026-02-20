import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../test/utils';
import ErrorBoundary from './ErrorBoundary';

const BuggyComponent = ({ shouldThrow = false }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Everything is fine</div>;
};

describe('ErrorBoundary Component', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        delete window.location;
        window.location = {
            ...originalLocation,
            reload: vi.fn(),
        };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    it('renders children when there is no error', () => {
        renderWithProviders(
            <ErrorBoundary>
                <div>Test Child</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('renders fallback UI when an error occurs', () => {
        // Suppress console.error for this test as it's expected
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithProviders(
            <ErrorBoundary>
                <BuggyComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('shows error details in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithProviders(
            <ErrorBoundary>
                <BuggyComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText(/error details/i)).toBeInTheDocument();
        expect(screen.getByText(/test error/i)).toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
    });

    it('calls window.location.reload when refresh button is clicked', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithProviders(
            <ErrorBoundary>
                <BuggyComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        await user.click(screen.getByRole('button', { name: /refresh page/i }));
        expect(window.location.reload).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
