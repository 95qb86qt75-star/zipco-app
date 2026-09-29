import { describe, expect, it } from 'vitest';
import { countPendingInteractions, parseOrders, shouldAnnouncePendingOrders } from './BusinessNotificationMonitor';

describe('BusinessNotificationMonitor', () => {
  it('counts active order interactions for customer and provider', () => {
    expect(countPendingInteractions(
      [{ id: 1, status: 'accepted' }],
      [{ id: 2, status: 'ready' }, { id: 3, status: 'completed' }],
      [{ id: 4, status: 'requested' }],
      [{ id: 5, status: 'quoted' }]
    )).toBe(4);
  });
  it('keeps only orders with a safe identity and status', () => {
    expect(parseOrders([
      { id: 4, status: 'pending', customerName: 'Cliente QA' },
      { id: '5', status: 'accepted' },
      { id: 'bad', status: 'pending' },
      { id: 6 }
    ])).toEqual([
      { id: 4, status: 'pending', customerName: 'Cliente QA' },
      { id: 5, status: 'accepted', customerName: null }
    ]);
  });

  it('rejects non-array responses', () => {
    expect(parseOrders({ orders: [] })).toEqual([]);
  });

  it('announces only after the baseline while the app remains visible', () => {
    expect(shouldAnnouncePendingOrders(false, true)).toBe(false);
    expect(shouldAnnouncePendingOrders(true, false)).toBe(false);
    expect(shouldAnnouncePendingOrders(true, true)).toBe(true);
  });
});
