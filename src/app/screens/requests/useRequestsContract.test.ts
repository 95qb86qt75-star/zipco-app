import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rawOrder, coordinationProcess } from './requestProcessFixtures';

// Run the real hook callbacks with a small state harness; network responses remain mocked.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, toast: vi.fn(), effects: [] as Array<() => unknown> }));
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
  useEffect: (effect: () => unknown) => { hooks.effects.push(effect); },
}));
vi.mock('../Toast', () => ({ showAppToast: hooks.toast }));
import useRequests from './useRequests';
import { clearDiagnostics, diagnosticSnapshot } from './loadOrdersDiagnostics';
import { countStatusViews } from './requestStatusGrouping';
import { getCustomerAttentionItems } from './requestAttentionSummary';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { cancelPendingOrder, cancelledPendingReceipt } from './pendingCancellationFixtures';
import { rejectPendingOrder, rejectedPendingReceipt } from './pendingRejectionFixtures';

const render = () => { hooks.cursor = 0; return useRequests(vi.fn()); };
const reply = (body: unknown) => new Response(JSON.stringify(body));

beforeEach(() => {
  hooks.slots = []; hooks.cursor = 0; hooks.toast.mockReset(); hooks.effects = [];
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.stubGlobal('localStorage', { getItem: (key: string) =>
    key === 'zipco-token' ? 'test' : key === 'zipco-business-id' ? '1' : null });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); clearDiagnostics(); vi.restoreAllMocks(); });

describe('loadOrders temporary diagnostics preserve the existing reads', () => {
  it('retains confirmed rejection and original data in both lists after failed and stale reads', async () => {
    const listeners = new Map<string, (event: Event) => void>();
    vi.stubGlobal('window', { addEventListener: (name: string, listener: (event: Event) => void) => listeners.set(name, listener), removeEventListener: vi.fn() });
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 503 })); vi.stubGlobal('fetch', fetcher);
    hooks.slots = [normalizeBusinessOrdersPayload([rejectPendingOrder]), normalizeMyOrdersPayload([rejectPendingOrder])];
    render(); hooks.effects.find(effect => effect.toString().includes('zipco-process-receipt'))!();
    listeners.get('zipco-process-receipt')!(new CustomEvent('zipco-process-receipt', { detail: rejectedPendingReceipt }));
    await vi.waitFor(() => expect(render().loadError).not.toBe(''));
    fetcher.mockImplementation(() => Promise.resolve(reply([rejectPendingOrder]))); await render().loadOrders(true);
    for (const list of [render().requests, render().myOrders]) {
      expect(list[0].status).toBe('rejected'); expect(list[0].requestProcess).toEqual(rejectedPendingReceipt.requestProcess);
      expect(list[0].note).toBe(rejectPendingOrder.note);
      expect(countStatusViews(list, 'orders')).toMatchObject({ pending: 0, coordination: 0, history: 1 });
    }
    expect(fetcher.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
  });
  it('retains the confirmed pending cancellation in both lists despite a failed GET and a late older list', async () => {
    const listeners = new Map<string, (event: Event) => void>();
    vi.stubGlobal('window', { addEventListener: (name: string, listener: (event: Event) => void) => listeners.set(name, listener), removeEventListener: vi.fn() });
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 503 })); vi.stubGlobal('fetch', fetcher);
    hooks.slots = [normalizeBusinessOrdersPayload([cancelPendingOrder]), normalizeMyOrdersPayload([cancelPendingOrder])];
    render(); hooks.effects.find(effect => effect.toString().includes('zipco-process-receipt'))!();
    listeners.get('zipco-process-receipt')!(new CustomEvent('zipco-process-receipt', { detail: cancelledPendingReceipt }));
    await vi.waitFor(() => expect(render().loadError).not.toBe(''));
    fetcher.mockImplementation(() => Promise.resolve(reply([cancelPendingOrder])));
    await render().loadOrders(true);
    for (const list of [render().requests, render().myOrders]) {
      expect(list[0].status).toBe('cancelled'); expect(list[0].requestProcess).toEqual(cancelledPendingReceipt.requestProcess);
      expect(list[0].note).toBe(cancelPendingOrder.note);
      expect(countStatusViews(list, 'orders')).toMatchObject({ pending: 0, history: 1 });
    }
    expect(fetcher.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
  });
  it('keeps acknowledged orders ready and completes only on receipt in both lists despite stale reads or replays', async () => {
    const input = { ...rawOrder, businessName: 'Business', status: 'ready', requestProcess: {
      ...coordinationProcess, state: 'READY', version: 2, readyNoticeAcknowledged: false, allowedActions: ['ACK_READY_NOTICE'],
    } };
    const listeners = new Map<string, (event: Event) => void>();
    vi.stubGlobal('window', { addEventListener: (name: string, listener: (event: Event) => void) => listeners.set(name, listener), removeEventListener: vi.fn() });
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(null, { status: 503 }))); vi.stubGlobal('fetch', fetcher);
    hooks.slots = [[input], [input]]; render();
    hooks.effects.find((effect) => effect.toString().includes('zipco-process-receipt'))!();
    const deliver = (state: string, version: number, orderStatus: string, acknowledged?: boolean) => listeners.get('zipco-process-receipt')!(new CustomEvent('zipco-process-receipt', {
      detail: { orderId: 20, orderStatus, requestProcess: { ...coordinationProcess, state, version, allowedActions: [],
        ...(acknowledged === undefined ? {} : { readyNoticeAcknowledged: acknowledged }) } },
    }));
    deliver('READY', 3, 'ready', true);
    for (const list of [render().requests, render().myOrders]) {
      expect(list[0]).toMatchObject({ status: 'ready', requestProcess: { readyNoticeAcknowledged: true } });
      expect(countStatusViews(list, 'orders')).toMatchObject({ ready: 1, history: 0 });
    }
    // Same-version historical receipt does not erase the acknowledgment learned by GET.
    deliver('READY', 3, 'ready');
    expect(render().myOrders[0].requestProcess?.readyNoticeAcknowledged).toBe(true);
    deliver('COMPLETED', 4, 'completed', true);
    deliver('READY', 3, 'ready', true);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(4));
    fetcher.mockImplementation(() => Promise.resolve(reply([input]))); await render().loadOrders(true);
    for (const list of [render().requests, render().myOrders]) {
      expect(list[0]).toMatchObject({ status: 'completed', requestProcess: { state: 'COMPLETED', version: 4,
        readyNoticeAcknowledged: true, agreementPublicId: coordinationProcess.agreementPublicId } });
      expect(countStatusViews(list, 'orders')).toMatchObject({ ready: 0, history: 1 });
      expect(getCustomerAttentionItems(list, 'orders', new Set()).ready).toEqual([]);
    }
    expect(fetcher.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
  });
  it('applies ready receipts to both lists, preserving the agreement and rejecting older receipts and reads', async () => {
    const input = { ...rawOrder, businessName: 'Business', status: 'accepted',
      requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS', version: 7, allowedActions: ['MARK_READY'] } };
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    const listeners = new Map<string, (event: Event) => void>();
    vi.stubGlobal('window', { addEventListener: (name: string, listener: (event: Event) => void) => listeners.set(name, listener), removeEventListener: vi.fn() });
    // The first two slots are the real business/customer list states of this hook harness.
    hooks.slots = [[input], [input]];
    render();
    const effect = hooks.effects.find((effect) => effect.toString().includes('zipco-process-receipt'))!;
    expect(effect).toBeDefined(); effect();
    const deliver = (state: string, version: number, orderStatus: string) => listeners.get('zipco-process-receipt')!(new CustomEvent('zipco-process-receipt', {
      detail: { orderId: 20, orderStatus, requestProcess: { ...coordinationProcess, state, version, allowedActions: [] } },
    }));
    deliver('READY', 8, 'ready');
    for (const list of [render().requests, render().myOrders]) {
      expect(list[0]).toMatchObject({ status: 'ready', requestProcess: { state: 'READY', version: 8, agreementPublicId: coordinationProcess.agreementPublicId } });
    }
    deliver('IN_PROGRESS', 7, 'accepted');
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    // A late list read from before MARK_READY also cannot undo its confirmed receipt.
    fetcher.mockImplementation(() => Promise.resolve(reply([input])));
    await render().loadOrders(true);
    for (const list of [render().requests, render().myOrders]) expect(list[0].requestProcess?.version).toBe(8);
    expect(fetcher.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
  });
  it.each(['customer', 'business', 'businessName'] as const)('identifies the failing %s GET without any POST', async (operation) => {
    vi.stubEnv('QA_LOAD_DIAGNOSTICS', true);
    vi.stubEnv('QA_LOAD_DIAGNOSTICS_VERSION', 'local-test');
    const fetcher = vi.fn(async (url: string) => {
      if ((operation === 'customer' && url.endsWith('/orders/my-orders?processContract=alternatives-v1')) ||
        (operation === 'business' && url.endsWith('/orders/business/1?processContract=alternatives-v1')) ||
        (operation === 'businessName' && url.includes('/businesses/'))) return new Response('{}', { status: 500 });
      return reply([{ ...rawOrder, businessId: 9, businessName: operation === 'businessName' ? '' : 'Business' }]);
    });
    vi.stubGlobal('fetch', fetcher);
    const result = await render().loadOrders(true);
    expect(result).toBe(operation === 'businessName');
    await vi.waitFor(() => expect(diagnosticSnapshot()).toHaveLength(1));
    expect(diagnosticSnapshot()[0]).toMatchObject({ operation: `loadOrders.${operation}`, httpStatus: 500 });
    expect(fetcher.mock.calls.map(([url]) => new URL(url).pathname + new URL(url).search)).toEqual(operation === 'customer'
      ? ['/orders/my-orders?processContract=alternatives-v1'] : operation === 'business'
        ? ['/orders/my-orders?processContract=alternatives-v1', '/orders/business/1?processContract=alternatives-v1'] : ['/orders/my-orders?processContract=alternatives-v1', '/businesses/9', '/orders/business/1?processContract=alternatives-v1']);
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

  it('never sends a process alternative through the historical transport, including negotiated permission', async () => {
    const input = { ...rawOrder, orderType: 'product', requestProcess: { ...coordinationProcess,
      state: 'AWAITING_BUSINESS_RESPONSE', agreementPublicId: null, allowedActions: ['ACCEPT_FIXED_ORDER', 'REJECT_PENDING_REQUEST', 'PROPOSE_ALTERNATIVE'] } };
    const fetcher = vi.fn(async () => reply([input])); vi.stubGlobal('fetch', fetcher);
    await render().loadOrders(); const current = render(); fetcher.mockClear();
    await current.proposeAlternative(rawOrder.id, { message: 'Una alternativa local sin enviar' });
    expect(fetcher).not.toHaveBeenCalled(); expect(hooks.toast).not.toHaveBeenCalledWith('Alternativa enviada al cliente.');
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
