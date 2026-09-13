import { describe, expect, it } from 'vitest';
import {
  isOwnBusiness,
  parsePositiveIntegerId,
  selectionAfterBusinessContextChange
} from './businessOwnership';

describe('business ownership', () => {
  it.each(['user', 'admin'])('recognizes an authenticated %s owner', () => {
    expect(isOwnBusiness(35, '35')).toBe(true);
  });

  it('allows a different user to order', () => {
    expect(isOwnBusiness(35, '36')).toBe(false);
  });

  it.each([null, undefined, '', '0', 0, -1, '01', '+1', '1.0', '1e0', 1.5, {}, []])(
    'rejects invalid or ambiguous ID %j',
    (value) => {
      expect(parsePositiveIntegerId(value)).toBeNull();
      expect(isOwnBusiness(value, 1)).toBe(false);
      expect(isOwnBusiness(1, value)).toBe(false);
    }
  );

  it('clears stale selections whenever the business context changes', () => {
    expect(selectionAfterBusinessContextChange([1, 2], false)).toEqual([]);
    expect(selectionAfterBusinessContextChange([1, 2], true)).toEqual([]);
  });
});
