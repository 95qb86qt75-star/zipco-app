import { describe, expect, it } from 'vitest';
import { normalizeChileanMobileDigits } from './PhoneStep';

describe('normalizeChileanMobileDigits', () => {
  it('keeps only the eight editable digits', () => {
    expect(normalizeChileanMobileDigits('abcd123456789')).toBe('12345678');
  });

  it('rejects spaces and symbols', () => {
    expect(normalizeChileanMobileDigits('12 34-56.78')).toBe('12345678');
  });
});
