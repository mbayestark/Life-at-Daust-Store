import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

const normalizeSpaces = (str) => str.replace(/\s/g, ' ');

describe('formatPrice utility', () => {
    it('formats positive integers correctly', () => {
        expect(normalizeSpaces(formatPrice(1000))).toBe('1 000 CFA');
        expect(normalizeSpaces(formatPrice(15000))).toBe('15 000 CFA');
        expect(normalizeSpaces(formatPrice(1000000))).toBe('1 000 000 CFA');
    });

    it('formats zero correctly', () => {
        expect(normalizeSpaces(formatPrice(0))).toBe('0 CFA');
    });

    it('handles null and undefined', () => {
        expect(formatPrice(null)).toBe('0 CFA');
        expect(formatPrice(undefined)).toBe('0 CFA');
    });

    it('formats decimal numbers by rounding (per Intl config)', () => {
        // Since we set minimumFractionDigits: 0, maximumFractionDigits: 0
        expect(formatPrice(10.5)).toBe('11 CFA');
        expect(formatPrice(10.4)).toBe('10 CFA');
    });
});
