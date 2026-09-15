import { describe, expect, it } from 'vitest';
import { nextOrderQuantity } from './checkoutOrderState';

describe('checkout quantity', () => {
  it('stays between 1 and 99 using only increment/decrement operations', () => {
    expect(nextOrderQuantity(1, -1)).toBe(1);
    expect(nextOrderQuantity(1, 1)).toBe(2);
    expect(nextOrderQuantity(99, 1)).toBe(99);
    expect(nextOrderQuantity(99, -1)).toBe(98);
  });
});
