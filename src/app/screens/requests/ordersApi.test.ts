import { afterEach, describe, expect, it, vi } from 'vitest';
import { patchOrderStatus, archiveOrder, deleteOrderPermanently, proposeOrderAlternative } from './ordersApi';
import { getOrderErrorPolicy } from './orderErrorPolicy';
import { PAST_SCHEDULE_MESSAGE, DST_SCHEDULE_MESSAGE } from './requestProcessErrors';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const patch = () => patchOrderStatus(19, { status: 'accepted' }, 'test-token');

describe('legacy PATCH response contract', () => {
  it('validates the legacy order independently and sends only PATCH', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ id: 19, status: 'accepted', extra: true }));
    vi.stubGlobal('fetch', fetch);
    await expect(patch()).resolves.toEqual({ id: 19, status: 'accepted' });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toMatch(/\/orders\/19\/status$/);
    expect(fetch.mock.calls[0][1]).toEqual({ method: 'PATCH',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }) });
  });
  it.each([null, [], {}, { id: 0, status: 'accepted' }, { id: -1, status: 'accepted' },
    { id: 1.5, status: 'accepted' }, { id: '19', status: 'accepted' }, { id: 20, status: 'accepted' },
    { id: 19 }, { id: 19, status: null }, { id: 19, status: 'UNKNOWN' }, { id: 19, status: 'pending' },
    { orderId: 19, orderStatus: 'accepted' }])('requires refresh for an invalid success body %j', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(body)));
    const error = await patch().catch((error: unknown) => error);
    expect(error).toMatchObject({ status: 502, refreshRequired: true });
    expect(getOrderErrorPolicy(error)).toMatchObject({ reload: true });
  });
  it('requires refresh when successful HTTP returns HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>internal</html>')));
    await expect(patch()).rejects.toMatchObject({ refreshRequired: true });
  });
  it('keeps cancellation payload and validates its resulting status', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ id: 19, status: 'cancelled' }));
    vi.stubGlobal('fetch', fetch);
    await patchOrderStatus(19, { status: 'cancelled', cancellationReason: 'selected_by_mistake' }, 'test');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ status: 'cancelled', cancellationReason: 'selected_by_mistake' });
  });
});

describe('safe legacy API errors', () => {
  const expected: Record<number, string> = {
    400: 'La solicitud no es válida. Revisa los datos.',
    401: 'Tu sesión venció o no es válida. Ingresa nuevamente.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'El pedido o recurso ya no está disponible. Actualiza la pantalla.',
    409: 'El pedido cambió. Actualiza la pantalla y revisa sus condiciones.',
    500: 'No se pudo completar la acción. Actualiza la pantalla e intenta nuevamente.',
    418: 'No se pudo completar la acción. Actualiza la pantalla e intenta nuevamente.',
  };
  for (const status of [400, 401, 403, 404, 409, 500, 418]) {
    it.each([{ message: 'private detail' }, { message: ['private detail', 'stack'] }, {}, null, '<html>private detail</html>'])('sanitizes HTTP ' + status + ' body %j', async (body) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(body, status)));
      await expect(patch()).rejects.toMatchObject({ status, message: expected[status] });
    });
    it('sanitizes empty/text HTTP ' + status, async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('internal plain text', { status })));
      await expect(patch()).rejects.toMatchObject({ message: expected[status] });
    });
  }
  it.each([PAST_SCHEDULE_MESSAGE, DST_SCHEDULE_MESSAGE])('preserves only the exact approved message %s', async (message) => {
    for (const body of [{ message }, { message: ['private detail', message] }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(body, 400)));
      await expect(patch()).rejects.toMatchObject({ message });
    }
  });
  it('never uses approved-looking text from a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ message: PAST_SCHEDULE_MESSAGE }, 500)));
    await expect(patch()).rejects.toMatchObject({ message: expected[500] });
  });
  it('uses the same safe error mapping for archive, delete and alternatives', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => reply({ message: ['internal'] }, 403)));
    for (const action of [() => archiveOrder(19, true, 'test'), () => deleteOrderPermanently(19, 'test'),
      () => proposeOrderAlternative(19, { message: 'test' }, 'test')]) {
      await expect(action()).rejects.toMatchObject({ message: expected[403] });
    }
  });
  it('maps uncertain network errors to a safe UI message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('internal network detail')));
    const error = await patch().catch((error: unknown) => error);
    expect(getOrderErrorPolicy(error).message).toBe('No se pudo actualizar el pedido. Intenta nuevamente.');
  });
});
