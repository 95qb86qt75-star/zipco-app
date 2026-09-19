import { describe, expect, it } from 'vitest';
import { sortBusinessOrdersByDelivery } from './businessOrderDates';

const order = (clientKey: string, needNow: boolean, deliveryDate: string | null, deliveryTime: string | null, createdAt: string | null) =>
  ({ clientKey, needNow, deliveryDate, deliveryTime, createdAt });

describe('business order chronological presentation', () => {
  it('places urgent orders first, oldest request first', () => {
    const result = sortBusinessOrdersByDelivery([
      order('urgent-new', true, null, null, '2026-09-18T13:00:00.000Z'),
      order('scheduled', false, '2026-09-19', '09:00', '2026-09-18T10:00:00.000Z'),
      order('urgent-old', true, null, null, '2026-09-18T12:00:00.000Z')
    ]);
    expect(result.map(({ clientKey }) => clientKey)).toEqual(['urgent-old', 'urgent-new', 'scheduled']);
  });

  it('orders scheduled requests by YYYY-MM-DD and time without timezone conversion', () => {
    const result = sortBusinessOrdersByDelivery([
      order('later', false, '2026-09-22', '15:20', '2026-09-18T10:00:00.000Z'),
      order('first', false, '2026-09-19', '18:00', '2026-09-18T12:00:00.000Z'),
      order('second', false, '2026-09-22', '09:00', '2026-09-18T11:00:00.000Z')
    ]);
    expect(result.map(({ clientKey }) => clientKey)).toEqual(['first', 'second', 'later']);
  });

  it('keeps legacy incomplete schedules at the end', () => {
    const result = sortBusinessOrdersByDelivery([
      order('legacy', false, null, null, '2026-09-18T09:00:00.000Z'),
      order('scheduled', false, '2026-09-30', '20:00', '2026-09-18T10:00:00.000Z')
    ]);
    expect(result.map(({ clientKey }) => clientKey)).toEqual(['scheduled', 'legacy']);
  });
});
