import { describe, expect, it } from 'vitest';
import { formatBusinessDeliverySchedule, formatDeliverySchedule } from './utils';

describe('formatDeliverySchedule', () => {
  it('uses the customer perspective for an urgent order', () => {
    expect(formatDeliverySchedule({ needNow: true, deliveryDate: null, deliveryTime: null }, 'customer'))
      .toBe('Lo necesitas ahora');
  });

  it('uses the business perspective for an urgent order', () => {
    expect(formatDeliverySchedule({ needNow: true, deliveryDate: null, deliveryTime: null }, 'business'))
      .toBe('Lo necesita ahora');
  });

  it('formats a scheduled date without timezone conversion', () => {
    expect(formatDeliverySchedule({
      needNow: false,
      deliveryDate: '2026-09-16',
      deliveryTime: '13:30'
    }, 'customer')).toBe('16 Sep · 13:30');
  });

  it.each([
    { needNow: false, deliveryDate: null, deliveryTime: null },
    { needNow: false, deliveryDate: null, deliveryTime: '13:30' },
    { needNow: false, deliveryDate: '2026-09-16', deliveryTime: null }
  ])('omits delivery information when normalized scheduling is incomplete', (schedule) => {
    expect(formatDeliverySchedule(schedule, 'customer')).toBeNull();
  });

  it('explains explicitly when a business order is scheduled', () => {
    expect(formatBusinessDeliverySchedule({
      needNow: false,
      deliveryDate: '2026-09-22',
      deliveryTime: '15:20'
    })).toBe('Programado para: 22 Sep · 15:20');
  });
});
