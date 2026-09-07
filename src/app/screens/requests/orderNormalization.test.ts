import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canSubmitOrderStatus,
  getActionableOrder,
  normalizeBusinessOrdersPayload,
  normalizeMyOrdersPayload
} from './orderNormalization';

const baseOrder = {
  id: 20,
  status: 'pending',
  businessId: 50,
  userId: 36,
  createdAt: '2026-09-05T10:20:30.000Z',
  products: [{ name: 'Producto', quantity: 1, price: 3800 }],
  total: '3800',
  needNow: false
};

afterEach(() => vi.restoreAllMocks());

describe('order payload normalization', () => {
  it.each(['pending', 'accepted', 'ready', 'completed', 'rejected', 'cancelled'])
  ('preserves the valid status %s', (status) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const candidate = status === 'cancelled'
      ? { ...baseOrder, status, cancellationReason: 'selected_by_mistake' }
      : { ...baseOrder, status };
    const [order] = normalizeMyOrdersPayload([candidate]);
    expect(order).toMatchObject({ recordState: 'available', status });
    expect(warning).not.toHaveBeenCalled();
  });

  it('creates a stable available customer order', () => {
    const [order] = normalizeMyOrdersPayload([baseOrder]);
    expect(order).toMatchObject({
      recordState: 'available', id: 20, status: 'pending', clientKey: 'customer-20', total: 3800
    });
    expect(getActionableOrder(order)).toEqual({ id: 20, status: 'pending' });
  });

  it('preserves non-object candidates as visible unavailable records', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeBusinessOrdersPayload([null]);
    expect(order).toMatchObject({
      recordState: 'unavailable', id: null, status: 'unavailable',
      identityIssues: ['record'], clientKey: 'business-invalid-0'
    });
    expect(getActionableOrder(order)).toBeNull();
  });

  it('marks every duplicated ID as unavailable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const orders = normalizeMyOrdersPayload([baseOrder, { ...baseOrder }]);
    expect(orders.map((order) => order.recordState)).toEqual(['unavailable', 'unavailable']);
    expect(orders.map((order) => order.clientKey)).toEqual(['customer-invalid-0', 'customer-invalid-1']);
    expect(orders.every((order) => order.identityIssues.includes('id'))).toBe(true);
  });

  it('marks an invalid ID unavailable and prevents an actionable result', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload([{ ...baseOrder, id: '2e1' }]);
    expect(order).toMatchObject({ recordState: 'unavailable', id: null, status: 'unavailable' });
    expect(order.identityIssues).toContain('id');
    expect(getActionableOrder(order)).toBeNull();
  });

  it.each([null, undefined, '', 5, 'unknown'])('marks invalid status %s unavailable', (status) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload([{ ...baseOrder, status }]);
    expect(order.recordState).toBe('unavailable');
    expect(order.identityIssues).toContain('status');
  });

  it('keeps optional missing fields out of data issues', () => {
    const [order] = normalizeMyOrdersPayload([baseOrder]);
    expect(order.dataIssues).not.toEqual(expect.arrayContaining([
      'deliveryDate', 'deliveryTime', 'businessPhone', 'businessImage', 'referencePhoto'
    ]));
  });

  it('records a missing or invalid needNow as a secondary issue', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { needNow: _needNow, ...withoutNeedNow } = baseOrder;
    const [missing] = normalizeMyOrdersPayload([withoutNeedNow]);
    const [invalid] = normalizeMyOrdersPayload([{ ...baseOrder, needNow: 'yes' }]);
    expect(missing.needNow).toBe(false);
    expect(invalid.needNow).toBe(false);
    expect(missing.dataIssues).toContain('needNow');
    expect(invalid.dataIssues).toContain('needNow');
  });

  it.each([
    ['array', [baseOrder]],
    ['orders wrapper', { orders: [baseOrder] }],
    ['results wrapper', { results: [baseOrder] }]
  ])('normalizes an %s response', (_label, payload) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload(payload);
    expect(order).toMatchObject({ recordState: 'available', id: 20, status: 'pending' });
  });

  it('preserves an invalid wrapper as an unavailable visible record', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload({ orders: 'invalid' });
    expect(order).toMatchObject({ recordState: 'unavailable', id: null, status: 'unavailable' });
    expect(getActionableOrder(order)).toBeNull();
  });

  it('blocks acceptance but permits rejection when products are unavailable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeBusinessOrdersPayload([{ ...baseOrder, products: '{broken' }]);
    expect(canSubmitOrderStatus(order, 'business', 'accept')).toBe(false);
    expect(canSubmitOrderStatus(order, 'business', 'reject')).toBe(true);
  });

  it('blocks preparing damaged products but permits completing an already ready order', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [accepted] = normalizeBusinessOrdersPayload([{ ...baseOrder, status: 'accepted', products: '{broken' }]);
    const [ready] = normalizeBusinessOrdersPayload([{ ...baseOrder, status: 'ready', products: '{broken' }]);
    expect(canSubmitOrderStatus(accepted, 'business', 'mark-ready')).toBe(false);
    expect(canSubmitOrderStatus(ready, 'business', 'complete-delivery')).toBe(true);
  });

  it('enforces the allowed customer and business transitions', () => {
    const pendingBusiness = normalizeBusinessOrdersPayload([baseOrder])[0];
    const acceptedBusiness = normalizeBusinessOrdersPayload([{ ...baseOrder, status: 'accepted' }])[0];
    const readyBusiness = normalizeBusinessOrdersPayload([{ ...baseOrder, status: 'ready' }])[0];
    const pendingCustomer = normalizeMyOrdersPayload([baseOrder])[0];
    const readyCustomer = normalizeMyOrdersPayload([{ ...baseOrder, status: 'ready' }])[0];
    expect(canSubmitOrderStatus(pendingBusiness, 'business', 'accept')).toBe(true);
    expect(canSubmitOrderStatus(pendingBusiness, 'business', 'mark-ready')).toBe(false);
    expect(canSubmitOrderStatus(acceptedBusiness, 'business', 'mark-ready')).toBe(true);
    expect(canSubmitOrderStatus(readyBusiness, 'business', 'complete-delivery')).toBe(true);
    expect(canSubmitOrderStatus(pendingCustomer, 'customer', 'cancel')).toBe(true);
    expect(canSubmitOrderStatus(readyCustomer, 'customer', 'complete-reception')).toBe(true);
  });

  it('tracks invalid mandatory and present optional fields by name only', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload([{
      ...baseOrder, createdAt: null, products: '{broken', total: -1, deliveryDate: '2026-02-30'
    }]);
    expect(order.dataIssues).toEqual(expect.arrayContaining(['createdAt', 'products', 'total', 'deliveryDate']));
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0][1]).toEqual({
      context: 'customer', index: 0, identityIssues: [], dataIssues: order.dataIssues
    });
  });

  it('keeps cancelled with a valid reason', () => {
    const [order] = normalizeMyOrdersPayload([{
      ...baseOrder, status: 'cancelled', cancellationReason: 'no_longer_needed'
    }]);
    expect(order.status).toBe('cancelled');
    expect(order.cancellationReason).toBe('no_longer_needed');
  });

  it('keeps cancelled but marks a missing reason unavailable', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload([{ ...baseOrder, status: 'cancelled' }]);
    expect(order).toMatchObject({ recordState: 'available', status: 'cancelled' });
    expect(order.cancellationReason).toBe('unavailable');
    expect(order.dataIssues).toContain('cancellationReason');
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('ignores a cancellation reason on another status and records the inconsistency', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeMyOrdersPayload([{
      ...baseOrder, cancellationReason: 'selected_by_mistake'
    }]);
    expect(order.cancellationReason).toBeNull();
    expect(order.dataIssues).toContain('cancellationReason');
    expect(warning).toHaveBeenCalledTimes(1);
  });
});
