import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test/utils';
import App from '../src/App';

// Mocking Convex
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => []),
    useMutation: vi.fn(() => vi.fn()),
}));

// Mock AOS
vi.mock('aos', () => ({
    default: { init: vi.fn(), refresh: vi.fn() },
    init: vi.fn(),
    refresh: vi.fn(),
}));

describe('Debug App Rendering', () => {
    it('renders the Home page', async () => {
        renderWithProviders(<App />);
        expect(screen.getByText(/university of/i)).toBeInTheDocument();
    });
});
