import { describe, expect, it, vi } from 'vitest';
import {
  createOrder,
  CreateOrderError,
  GENERIC_CREATE_ORDER_MESSAGE,
  OWN_BUSINESS_ORDER_MESSAGE
} from './createOrderApi';

const input = {
  url: 'http://127.0.0.1:3000/orders',
  token: 'test-token',
  currentUserId: '36',
  businessUserId: 35,
  payload: { businessId: 50 }
};

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

  it.each([
    new Response('Internal details', { status: 500 }),
    new Response('not json', { status: 400 })
  ])('uses a generic message for unexpected HTTP failures', async (response) => {
    const fetchImpl = vi.fn().mockResolvedValue(response);
    await expect(createOrder({ ...input, fetchImpl })).rejects.toEqual(
      new CreateOrderError(GENERIC_CREATE_ORDER_MESSAGE, response.status)
    );
  });

  it('preserves the successful order flow for another user', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await expect(createOrder({ ...input, fetchImpl })).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(input.url, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(input.payload)
    }));
  });
});
