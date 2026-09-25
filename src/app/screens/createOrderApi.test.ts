import { describe, expect, it, vi } from 'vitest';
import {
  buildCreateOrderPayload,
  createOrder,
  CreateOrderError,
  GENERIC_CREATE_ORDER_MESSAGE,
  hasCompleteDeliverySelection,
  OWN_BUSINESS_ORDER_MESSAGE
} from './createOrderApi';

const input = {
  url: 'http://127.0.0.1:3000/orders',
  token: 'test-token',
  currentUserId: '36',
  businessUserId: 35,
  idempotencyKey: '123e4567-e89b-42d3-a456-426614174000',
  payload: { businessId: 50, items: [{ catalogItemId: 7, quantity: 2 }], note: '', needNow: true, deliveryDate: null, deliveryTime: null, referencePhoto: null }
};
const createdOrder = { id: 1, total: '24000.00', items: [{ id: 1, orderId: 1, catalogItemId: 7, nameSnapshot: 'Torta', unitPriceClpSnapshot: 12000, quantity: 2, subtotalClp: 24000 }] };

describe('buildCreateOrderPayload', () => {
  const draft = {
    businessId: 50,
    items: [{ catalogItemId: 7, quantity: 2 }],
    note: '',
    needNow: true,
    deliveryDate: '',
    deliveryTime: '',
    referencePhoto: null
  };

  it('sends null delivery values when the order is needed now', () => {
    expect(buildCreateOrderPayload(draft)).toEqual({ ...draft, deliveryDate: null, deliveryTime: null });
  });

  it('preserves a valid scheduled date and time', () => {
    const payload = buildCreateOrderPayload({
      ...draft,
      needNow: false,
      deliveryDate: '2026-09-20',
      deliveryTime: '13:30'
    });

    expect(payload.deliveryDate).toBe('2026-09-20');
    expect(payload.deliveryTime).toBe('13:30');
  });

  it('contains only the fields allowed by the create-order contract', () => {
    const payload = buildCreateOrderPayload(draft);

    expect(Object.keys(payload).sort()).toEqual([
      'businessId', 'deliveryDate', 'deliveryTime', 'items', 'needNow', 'note', 'referencePhoto'
    ]);
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('products');
    expect(payload).not.toHaveProperty('prices');
    expect(payload).not.toHaveProperty('total');
  });
});

describe('delivery selection', () => {
  it('accepts immediate or complete scheduled delivery', () => {
    expect(hasCompleteDeliverySelection({ needNow: true, deliveryDate: '', deliveryTime: '' })).toBe(true);
    expect(hasCompleteDeliverySelection({ needNow: false, deliveryDate: '2026-09-20', deliveryTime: '13:30' })).toBe(true);
  });

  it('rejects an unselected or incomplete delivery', () => {
    expect(hasCompleteDeliverySelection({ needNow: false, deliveryDate: '', deliveryTime: '' })).toBe(false);
    expect(hasCompleteDeliverySelection({ needNow: false, deliveryDate: '2026-09-20', deliveryTime: '' })).toBe(false);
    expect(hasCompleteDeliverySelection({ needNow: true, deliveryDate: '2026-09-20', deliveryTime: '13:30' })).toBe(false);
  });
});

describe('createOrder', () => {
  it('does not fetch when checkout is forced for the owner', async () => {
    const fetchImpl = vi.fn();
    await expect(createOrder({ ...input, currentUserId: '35', fetchImpl })).rejects.toMatchObject({
      message: OWN_BUSINESS_ORDER_MESSAGE,
      status: null
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses a controlled message for a backend 403', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"message":"unexpected"}', {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }));
    await expect(createOrder({ ...input, fetchImpl })).rejects.toMatchObject({
      message: OWN_BUSINESS_ORDER_MESSAGE,
      status: 403
    });
  });

  it('uses a generic message for server failures', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('Internal details', { status: 500 }));
    await expect(createOrder({ ...input, fetchImpl })).rejects.toEqual(new CreateOrderError(GENERIC_CREATE_ORDER_MESSAGE, 500));
  });

  it('preserves the successful order flow for another user', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(createdOrder), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    await expect(createOrder({ ...input, fetchImpl })).resolves.toMatchObject({ total: 24000 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(input.url, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(input.payload),
      headers: expect.objectContaining({ 'Idempotency-Key': input.idempotencyKey })
    }));
  });

  it('normalizes official total and validates item subtotals', async () => {
    const ok = vi.fn().mockResolvedValue(new Response(JSON.stringify(createdOrder), { status: 201 }));
    await expect(createOrder({ ...input, fetchImpl: ok })).resolves.toMatchObject({ total: 24000 });
    const invalid = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...createdOrder, items: [{ ...createdOrder.items[0], subtotalClp: 1 }] }), { status: 201 }));
    await expect(createOrder({ ...input, fetchImpl: invalid })).rejects.toMatchObject({ status: null });
  });

  it.each([
    { ...createdOrder, total: 1 },
    { ...createdOrder, items: [{ ...createdOrder.items[0], orderId: 2 }] },
    { ...createdOrder, items: [createdOrder.items[0], { ...createdOrder.items[0] }] },
    { ...createdOrder, total: 0, items: [{ ...createdOrder.items[0], unitPriceClpSnapshot: 0, subtotalClp: 0 }] }
  ])('rejects an incoherent successful response', async (body) => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 201 }));
    await expect(createOrder({ ...input, fetchImpl })).rejects.toMatchObject({ status: null });
  });

  it('reports 409 without retrying', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 409 }));
    await expect(createOrder({ ...input, fetchImpl })).rejects.toMatchObject({ status: 409, message: 'El catálogo cambió. Revisa nuevamente tu pedido.' });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
