import { describe, expect, it } from 'vitest';
import { classifyBusinessDeliveryDate } from './businessOrderDates';

const now = new Date(2026, 8, 5, 12, 0, 0);

describe('business order date classification', () => {
  it('classifies needNow as today even without deliveryDate', () => {
    expect(classifyBusinessDeliveryDate({ needNow: true, deliveryDate: null }, now)).toBe('today');
  });

  it('classifies a valid date equal to or before today as today', () => {
    expect(classifyBusinessDeliveryDate({ needNow: false, deliveryDate: '2026-09-05' }, now)).toBe('today');
    expect(classifyBusinessDeliveryDate({ needNow: false, deliveryDate: '2026-09-04' }, now)).toBe('today');
  });

  it('classifies tomorrow separately', () => {
    expect(classifyBusinessDeliveryDate({ needNow: false, deliveryDate: '2026-09-06' }, now)).toBe('tomorrow');
  });

  it('classifies later dates as upcoming', () => {
    expect(classifyBusinessDeliveryDate({ needNow: false, deliveryDate: '2026-09-07' }, now)).toBe('upcoming');
  });

  it('keeps a missing date in the undated group', () => {
    expect(classifyBusinessDeliveryDate({ needNow: false, deliveryDate: null }, now)).toBe('undated');
  });
});
