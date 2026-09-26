import { describe, expect, it } from 'vitest';
import { formatChileanMobile } from './PersonalInfoSection';

describe('formatChileanMobile', () => {
  it.each([
    ['56912345678', '+56 9 1234 5678'],
    ['+56 9 1234 5678', '+56 9 1234 5678'],
    ['912345678', '+56 9 1234 5678']
  ])('formats %s as a Chilean mobile number', (phone, expected) => {
    expect(formatChileanMobile(phone)).toBe(expected);
  });

  it('shows the empty state when there is no phone', () => {
    expect(formatChileanMobile('')).toBe('Sin completar');
  });
});
