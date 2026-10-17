import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rawOrder } from './requestProcessFixtures';

// Run the real hook callbacks with a small state harness; network responses remain mocked.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, toast: vi.fn() }));
vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[index], (next: unknown) => {
      hooks.slots[index] = typeof next === 'function' ? next(hooks.slots[index]) : next;
    }];
  },
  useRef: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useCallback: (callback: unknown) => callback,
  useEffect: () => undefined,
}));
vi.mock('../Toast', () => ({ showAppToast: hooks.toast }));
import useRequests from './useRequests';
import { clearDiagnostics, diagnosticSnapshot } from './loadOrdersDiagnostics';

const render = () => { hooks.cursor = 0; return useRequests(vi.fn()); };
const reply = (body: unknown) => new Response(JSON.stringify(body));

beforeEach(() => {
  hooks.slots = []; hooks.cursor = 0; hooks.toast.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.stubGlobal('localStorage', { getItem: (key: string) =>
    key === 'zipco-token' ? 'test' : key === 'zipco-business-id' ? '1' : null });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); clearDiagnostics(); vi.restoreAllMocks(); });

describe('loadOrders temporary diagnostics preserve the existing reads', () => {
  it.each(['customer', 'business', 'businessName'] as const)('identifies the failing %s GET without any POST', async (operation) => {
    vi.stubEnv('QA_LOAD_DIAGNOSTICS', true);
    vi.stubEnv('QA_LOAD_DIAGNOSTICS_VERSION', 'local-test');
    const fetcher = vi.fn(async (url: string) => {
      if ((operation === 'customer' && url.endsWith('/orders/my-orders')) ||
        (operation === 'business' && url.endsWith('/orders/business/1')) ||
        (operation === 'businessName' && url.includes('/businesses/'))) return new Response('{}', { status: 500 });
      return reply([{ ...rawOrder, businessId: 9, businessName: operation === 'businessName' ? '' : 'Business' }]);
    });
    vi.stubGlobal('fetch', fetcher);
    const result = await render().loadOrders(true);
    expect(result).toBe(operation === 'businessName');
    await vi.waitFor(() => expect(diagnosticSnapshot()).toHaveLength(1));
    expect(diagnosticSnapshot()[0]).toMatchObject({ operation: `loadOrders.${operation}`, httpStatus: 500 });
    expect(fetcher.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(operation === 'customer'
      ? ['/orders/my-orders'] : operation === 'business'
        ? ['/orders/my-orders', '/orders/business/1'] : ['/orders/my-orders', '/businesses/9', '/orders/business/1']);
  });
  it('does not collect failures when disabled', async () => {
    vi.stubEnv('QA_LOAD_DIAGNOSTICS', false);
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 500 }));
    vi.stubGlobal('fetch', fetcher);
    expect(await render().loadOrders(true)).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce(); expect(diagnosticSnapshot()).toEqual([]);
  });
});

describe('legacy action and recovery through useRequests', () => {
  it.each([undefined, null])('uses only PATCH for a legacy order (%s)', async (requestProcess) => {
    let status = 'pending';
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') { status = 'accepted'; return reply({ id: rawOrder.id, status }); }
      return reply([{ ...rawOrder, businessName: 'Negocio', status, requestProcess }]);
    });
    vi.stubGlobal('fetch', fetch);
    await render().loadOrders();
    const current = render();
    await expect(current.performAction(current.requests[0], 'business', 'accept')).resolves.toBe(true);
    expect(render().requests[0].status).toBe('accepted');
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1);
    expect(fetch.mock.calls.some(([url]) => url.includes('/request-processes/'))).toBe(false);
  });

  it('reloads an effectively accepted order after an unreadable success without announcing false success', async () => {
    let status = 'pending';
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') { status = 'accepted'; return new Response('<html>unexpected</html>'); }
      return reply([{ ...rawOrder, businessName: 'Negocio', status, requestProcess: null }]);
    });
    vi.stubGlobal('fetch', fetch);
    await render().loadOrders();
    const current = render();
    await expect(current.performAction(current.requests[0], 'business', 'accept')).resolves.toBe(false);
    expect(render().requests[0].status).toBe('accepted');
    expect(hooks.toast).toHaveBeenCalledWith(
      'No se pudo confirmar la actualización del pedido. Actualiza la pantalla y revisa su estado.', 'error',
    );
    expect(hooks.toast).not.toHaveBeenCalledWith('Pedido actualizado correctamente.');
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1);
  });

  it('never dispatches historical actions for malformed process objects', async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => reply([{ ...rawOrder, businessName: 'Negocio', requestProcess: {} }]));
    vi.stubGlobal('fetch', fetch);
    await render().loadOrders();
    const current = render();
    fetch.mockClear();
    for (const action of ['accept', 'reject', 'cancel', 'mark-ready', 'accept-alternative', 'reject-alternative', 'complete-delivery', 'complete-reception'] as const) {
      await expect(current.performAction(current.requests[0], 'business', action)).resolves.toBe(false);
    }
    await current.proposeAlternative(rawOrder.id, { message: 'test' });
    await current.setArchived(rawOrder.id, true);
    await current.deletePermanently(rawOrder.id);
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'PATCH' || init?.method === 'POST')).toBe(false);
  });
});
