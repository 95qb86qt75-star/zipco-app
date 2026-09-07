import { describe, expect, it } from 'vitest';
import { actionToPayload, classifyBusinessOrders, classifyCustomerOrders } from './orderPresentation';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';

const makeOrder = (id: number, status: string) => ({
  id, status, businessId: 50, userId: 36, createdAt: '2026-09-05T10:20:30.000Z',
  products: [], total: 0, needNow: false,
  ...(status === 'cancelled' ? { cancellationReason: 'selected_by_mistake' } : {})
});

describe('order presentation', () => {
  it('classifies customer orders and prioritizes ready', () => {
    const orders = normalizeMyOrdersPayload([
      makeOrder(1, 'accepted'), makeOrder(2, 'pending'), makeOrder(3, 'ready'),
      makeOrder(4, 'completed'), makeOrder(5, 'rejected'), makeOrder(6, 'cancelled')
    ]);
    const result = classifyCustomerOrders(orders);
    expect(result.active.map((order) => order.status)).toEqual(['ready', 'pending', 'accepted']);
    expect(result.history.map((order) => order.status)).toEqual(['completed', 'rejected', 'cancelled']);
  });

  it('classifies every business state', () => {
    const orders = normalizeBusinessOrdersPayload([
      makeOrder(1, 'pending'), makeOrder(2, 'accepted'), makeOrder(3, 'ready'),
      makeOrder(4, 'completed'), makeOrder(5, 'rejected'), makeOrder(6, 'cancelled')
    ]);
    const result = classifyBusinessOrders(orders);
    expect(result.pending).toHaveLength(1);
    expect(result.preparing).toHaveLength(1);
    expect(result.ready).toHaveLength(1);
    expect(result.history).toHaveLength(3);
  });

  it('keeps unavailable records outside normal customer and business groups', () => {
    const customerOrders = normalizeMyOrdersPayload([{ ...makeOrder(1, 'pending'), status: 'unknown' }]);
    const businessOrders = normalizeBusinessOrdersPayload([{ ...makeOrder(1, 'pending'), status: 'unknown' }]);
    expect(classifyCustomerOrders(customerOrders)).toMatchObject({ active: [], history: [], unavailable: customerOrders });
    expect(classifyBusinessOrders(businessOrders)).toMatchObject({
      pending: [], preparing: [], ready: [], history: [], unavailable: businessOrders
    });
  });

  it('creates stable status payloads including cancellation reason', () => {
    expect(actionToPayload('accept')).toEqual({ status: 'accepted' });
    expect(actionToPayload('mark-ready')).toEqual({ status: 'ready' });
    expect(actionToPayload('complete-reception')).toEqual({ status: 'completed' });
    expect(actionToPayload('cancel')).toBeNull();
    expect(actionToPayload('cancel', 'selected_by_mistake')).toEqual({
      status: 'cancelled', cancellationReason: 'selected_by_mistake'
    });
  });
});
