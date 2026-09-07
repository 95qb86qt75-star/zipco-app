import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrdersApiError, patchOrderStatus } from './ordersApi';

const token = 'private-test-token';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function response(ok: boolean, status: number, body?: unknown, jsonFails = false) {
  return {
    ok,
    status,
    json: jsonFails
      ? vi.fn().mockRejectedValue(new Error('invalid json'))
      : vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

describe('orders API', () => {
  it('sends the expected PATCH request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(true, 200));
    vi.stubGlobal('fetch', fetchMock);
    await patchOrderStatus(19, { status: 'accepted' }, token);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/orders\/19\/status$/);
    expect(init).toEqual({
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' })
    });
  });

  it('uses a safe string message for a client error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 400, { message: 'Transición inválida' })));
    await expect(patchOrderStatus(19, { status: 'accepted' }, token))
      .rejects.toMatchObject({ status: 400, message: 'Transición inválida' });
  });

  it('joins string array validation messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 400, { message: ['Estado inválido', 'Dato inválido'] })));
    await expect(patchOrderStatus(19, { status: 'rejected' }, token))
      .rejects.toMatchObject({ message: 'Estado inválido. Dato inválido' });
  });

  it.each([401, 403, 409])('preserves a safe backend message for status %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, status, { message: 'Mensaje seguro' })));
    await expect(patchOrderStatus(19, { status: 'ready' }, token))
      .rejects.toMatchObject({ status, message: 'Mensaje seguro' });
  });

  it('sends the cancellation reason code unchanged', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(true, 200));
    vi.stubGlobal('fetch', fetchMock);
    await patchOrderStatus(19, { status: 'cancelled', cancellationReason: 'selected_by_mistake' }, token);
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({
      status: 'cancelled', cancellationReason: 'selected_by_mistake'
    }));
  });

  it('sanitizes server errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 500, { message: 'stack and internal secret' })));
    await expect(patchOrderStatus(19, { status: 'accepted' }, token))
      .rejects.toEqual(new OrdersApiError('El servidor no pudo actualizar el pedido.', 500));
  });

  it('uses a generic message when error JSON is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 400, undefined, true)));
    await expect(patchOrderStatus(19, { status: 'accepted' }, token))
      .rejects.toMatchObject({ message: 'No se pudo actualizar el pedido.' });
  });

  it('does not expose messages from unexpected response statuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 418, { message: 'internal detail' })));
    await expect(patchOrderStatus(19, { status: 'accepted' }, token))
      .rejects.toMatchObject({ status: 418, message: 'No se pudo actualizar el pedido.' });
  });

  it('never writes the token to console logs', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warningLog = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 500, { message: token })));
    await expect(patchOrderStatus(19, { status: 'accepted' }, token)).rejects.toBeInstanceOf(OrdersApiError);
    expect(errorLog).not.toHaveBeenCalled();
    expect(warningLog).not.toHaveBeenCalled();
  });
});
