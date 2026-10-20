import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], index: 0, cleanups: [] as Array<() => void>, toast: vi.fn() }));
vi.mock('react', () => ({
  useEffect: (effect: () => () => void) => { hooks.cleanups.push(effect()); },
  useState: (initial: unknown) => {
    const index = hooks.index++; if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [hooks.slots[index], (value: unknown) => { hooks.slots[index] = value; }];
  },
  useRef: (value: unknown) => {
    const index = hooks.index++; if (!(index in hooks.slots)) hooks.slots[index] = { current: value };
    return hooks.slots[index];
  },
}));
vi.mock('../Toast', () => ({ showAppToast: hooks.toast }));
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { rawOrder, coordinationProcess } from './requestProcessFixtures';
import { cancelPendingOrder, cancelledPendingOrder, cancelledPendingReceipt } from './pendingCancellationFixtures';
const process = { ...coordinationProcess, allowedActions: ['OPEN_WHATSAPP', 'START_WORK'],
  coordination: { customerContactAuthorized: true, businessContactAuthorized: true } };
const raw = { ...rawOrder, status: 'accepted', requestProcess: process };
const receipt = { orderId: 20, orderStatus: 'accepted', requestProcess: { ...coordinationProcess, state: 'COORDINATING', version: 3 } };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const url = 'https://wa.me/12345678?text=Mensaje';
let navigate: ReturnType<typeof vi.fn>;
let identity: Map<string, string>;
beforeEach(() => {
  vi.resetModules(); hooks.index = 0; hooks.slots = []; hooks.cleanups = []; hooks.toast.mockReset();
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  identity = new Map([['zipco-user-id', 'synthetic'], ['zipco-token', 'synthetic-token'], ['zipco-business-id', '1']]);
  vi.stubGlobal('localStorage', { getItem: (key: string) => identity.get(key) ?? null });
  navigate = vi.fn(); const target = new EventTarget();
  vi.stubGlobal('window', { dispatchEvent: target.dispatchEvent.bind(target), addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target), location: { assign: navigate } });
});
afterEach(() => { hooks.cleanups.forEach((cleanup) => cleanup()); vi.unstubAllGlobals(); });
describe('pending cancellation recovery with mocked backend', () => {
  it('keeps cancellation confirmed after a failed GET and never sends it twice', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response(cancelledPendingReceipt)).mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetcher); const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([cancelPendingOrder])[0], false, vi.fn());
    expect(await hook.run('CANCEL_PENDING_REQUEST')).toBe(true);
    expect(await hook.run('CANCEL_PENDING_REQUEST')).toBe(false);
    expect(await hook.retry()).toBe(false);
    const receipt = dispatch.mock.calls.find(([event]) => event.type === 'zipco-process-receipt')![0] as CustomEvent;
    expect(receipt.detail).toEqual(cancelledPendingReceipt);
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('retries a lost response with the original key and exact body', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response(cancelledPendingReceipt)).mockResolvedValueOnce(response([cancelledPendingOrder]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([cancelPendingOrder])[0], false, vi.fn());
    expect(await hook.run('CANCEL_PENDING_REQUEST')).toBe(false);
    expect(await hook.retry()).toBe(true);
    const posts = fetcher.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(2);
    expect(posts[0][1].headers['Idempotency-Key']).toBe(posts[1][1].headers['Idempotency-Key']);
    expect(posts[0][1].body).toBe(posts[1][1].body);
    expect(JSON.parse(posts[0][1].body)).toEqual({ expectedVersion: 1, confirmationAccepted: true });
  });

  it('reconciles a restored intent by reading CLOSED without another POST', async () => {
    sessionStorage.setItem('zipco-coordination:synthetic:customer:7', JSON.stringify({ action: 'CANCEL_PENDING_REQUEST',
      body: { expectedVersion: 1, confirmationAccepted: true }, key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }));
    const fetcher = vi.fn().mockResolvedValue(response([cancelledPendingOrder])); vi.stubGlobal('fetch', fetcher);
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([cancelPendingOrder])[0], false, vi.fn());
    expect(await hook.retry()).toBe(false); expect(fetcher).not.toHaveBeenCalled();
    await hook.update(); expect(hook.pending()).toBeNull(); expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][1].method).toBeUndefined();
    expect(dispatch.mock.calls.some(([event]) => event.type === 'zipco-process-receipt')).toBe(true);
  });

  it('settles an uncertain cancellation through Actualizar estado without resubmitting it', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('response lost')).mockResolvedValue(response([cancelledPendingOrder]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([cancelPendingOrder])[0], false, vi.fn());
    expect(await hook.run('CANCEL_PENDING_REQUEST')).toBe(false);
    await hook.update(); expect(hook.pending()).toBeNull();
    expect(await hook.retry()).toBe(false);
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it.each(['STALE_VERSION', 'INCOMPATIBLE_STATE'])('refreshes %s after business acceptance without switching to another cancellation action', async code => {
    const latest = { ...cancelPendingOrder, status: 'accepted', requestProcess: { ...coordinationProcess, allowedActions: [] } };
    const fetcher = vi.fn().mockResolvedValueOnce(response({ code }, 409)).mockResolvedValueOnce(response([latest]));
    vi.stubGlobal('fetch', fetcher); const refresh = vi.fn(), dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([cancelPendingOrder])[0], false, refresh);
    expect(await hook.run('CANCEL_PENDING_REQUEST')).toBe(false);
    expect(hook.pending()).toBeNull(); expect(refresh).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(dispatch.mock.calls.some(([event]) => event.type === 'zipco-process-receipt')).toBe(false);
    expect(hooks.toast).toHaveBeenCalledWith(expect.stringContaining('negocio ya respondió'), 'error');
  });
});

describe('coordination hook with mocked server and external navigation', () => {
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('does not repeat confirmed %s after GET failure or double touch', async (action) => {
    const receiptAction = action === 'CONFIRM_RECEIPT';
    const input = { ...raw, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY',
      readyNoticeAcknowledged: receiptAction, allowedActions: [action] } };
    const result = { orderId: 20, orderStatus: receiptAction ? 'completed' : 'ready', requestProcess: {
      ...coordinationProcess, state: receiptAction ? 'COMPLETED' : 'READY', version: 3, readyNoticeAcknowledged: true, allowedActions: [],
    } };
    let finish!: (reply: Response) => void;
    const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }))
      .mockRejectedValueOnce(new TypeError('read offline')).mockResolvedValueOnce(response([{ ...input, status: result.orderStatus, requestProcess: result.requestProcess }]));
    vi.stubGlobal('fetch', fetcher); const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([input])[0], false, vi.fn());
    const first = hook.run(action); expect(await hook.run(action)).toBe(false);
    finish(response(result)); expect(await first).toBe(true);
    expect(hook.pending()).toBeNull(); expect(hooks.slots[2]).toBe(true);
    expect(dispatch.mock.calls.some(([event]) => event.type === 'zipco-process-receipt' && (event as CustomEvent).detail.orderStatus === result.orderStatus)).toBe(true);
    expect(await hook.retry()).toBe(false); expect(await hook.run(action)).toBe(false); await hook.update();
    expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ expectedVersion: 2, confirmationAccepted: true });
    expect(navigate).not.toHaveBeenCalled();
  });
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('preserves exact %s key/body on a lost response, even if a replay omits acknowledgment', async (action) => {
    const receiptAction = action === 'CONFIRM_RECEIPT';
    const input = { ...raw, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY',
      readyNoticeAcknowledged: receiptAction, allowedActions: [action] } };
    const result = { orderId: 20, orderStatus: receiptAction ? 'completed' : 'ready', requestProcess: {
      ...coordinationProcess, state: receiptAction ? 'COMPLETED' : 'READY', version: 3, allowedActions: [],
    } };
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(response(result))
      .mockResolvedValueOnce(response([{ ...input, status: result.orderStatus, requestProcess: { ...result.requestProcess, readyNoticeAcknowledged: true } }]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([input])[0], false, vi.fn());
    expect(await hook.run(action)).toBe(false); expect(await hook.retry()).toBe(true);
    expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
    expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetcher.mock.calls[1][1].headers['Idempotency-Key']);
    expect(await hook.run(action)).toBe(false); expect(fetcher).toHaveBeenCalledTimes(3);
    expect(navigate).not.toHaveBeenCalled();
  });
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('settles restored %s by GET without a new confirmation', async (action) => {
    sessionStorage.setItem('zipco-coordination:synthetic:customer:7', JSON.stringify({ action,
      body: { expectedVersion: 2, confirmationAccepted: true }, key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }));
    const input = { ...raw, status: action === 'CONFIRM_RECEIPT' ? 'completed' : 'ready', requestProcess: {
      ...coordinationProcess, state: action === 'CONFIRM_RECEIPT' ? 'COMPLETED' : 'READY', version: 3, readyNoticeAcknowledged: true, allowedActions: [],
    } };
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response([input]))); vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([input])[0], false, vi.fn());
    expect(hook.pending()?.action).toBe(action); expect(await hook.retry()).toBe(false);
    expect(fetcher).not.toHaveBeenCalled(); await hook.update();
    expect(hook.pending()).toBeNull(); expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][1].method).toBeUndefined(); expect(navigate).not.toHaveBeenCalled();
  });
  it('never navigates using recovered WhatsApp after the read shows COMPLETED', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ result: receipt, navigation: { url } }))
      .mockResolvedValueOnce(response([{ ...raw, status: 'completed', requestProcess: { ...process, state: 'COMPLETED', version: 4, readyNoticeAcknowledged: true, allowedActions: [] } }]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    expect(await useCoordination(normalizeMyOrdersPayload([raw])[0], false, vi.fn()).run('OPEN_WHATSAPP')).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
  it('prefers newer completed GET over a recovered acknowledgment receipt without regressing its state', async () => {
    const input = { ...raw, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY',
      readyNoticeAcknowledged: false, allowedActions: ['ACK_READY_NOTICE'] } };
    const original = { orderId: 20, orderStatus: 'ready', requestProcess: { ...coordinationProcess, state: 'READY', version: 3, allowedActions: [] } };
    const latest = { ...input, status: 'completed', requestProcess: { ...coordinationProcess, state: 'COMPLETED', version: 4, readyNoticeAcknowledged: true, allowedActions: [] } };
    const fetcher = vi.fn().mockResolvedValueOnce(response(original)).mockResolvedValueOnce(response([latest]));
    vi.stubGlobal('fetch', fetcher); const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination');
    expect(await useCoordination(normalizeMyOrdersPayload([input])[0], false, vi.fn()).run('ACK_READY_NOTICE')).toBe(true);
    const emitted = dispatch.mock.calls.find(([event]) => event.type === 'zipco-process-receipt')![0] as CustomEvent;
    expect(emitted.detail).toEqual({ orderId: 20, orderStatus: 'completed', requestProcess: latest.requestProcess });
    expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
  });
  it('keeps MARK_READY confirmed when the next GET fails and never repeats it during recovery', async () => {
    const input = { ...raw, requestProcess: { ...process, state: 'IN_PROGRESS', allowedActions: ['MARK_READY'] } };
    const result = { orderId: 20, orderStatus: 'ready', requestProcess: { ...process, state: 'READY', version: 3, allowedActions: [] } };
    let finish!: (response: Response) => void;
    const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }))
      .mockRejectedValueOnce(new TypeError('read offline'))
      .mockResolvedValueOnce(response([{ ...input, status: 'ready', requestProcess: result.requestProcess }]));
    vi.stubGlobal('fetch', fetcher);
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([input])[0], true, vi.fn());
    const first = hook.run('MARK_READY');
    expect(await hook.run('MARK_READY')).toBe(false);
    finish(response(result)); expect(await first).toBe(true);
    expect(hook.pending()).toBeNull(); expect(hooks.slots[2]).toBe(true);
    expect(dispatch.mock.calls.some(([event]) => event.type === 'zipco-process-receipt' && (event as CustomEvent).detail.orderStatus === 'ready')).toBe(true);
    expect(await hook.retry()).toBe(false); expect(await hook.run('MARK_READY')).toBe(false);
    await hook.update();
    expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ expectedVersion: 2 });
  });
  it('retries a lost MARK_READY response with the same key and body, preserving newer reads', async () => {
    const input = { ...raw, requestProcess: { ...process, state: 'IN_PROGRESS', allowedActions: ['MARK_READY'] } };
    const result = { orderId: 20, orderStatus: 'ready', requestProcess: { ...process, state: 'READY', version: 3, allowedActions: [] } };
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response(result)).mockResolvedValueOnce(response([{ ...input, status: 'ready', requestProcess: { ...result.requestProcess, version: 4 } }]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([input])[0], true, vi.fn());
    expect(await hook.run('MARK_READY')).toBe(false);
    expect(await hook.retry()).toBe(true);
    expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
    expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetcher.mock.calls[1][1].headers['Idempotency-Key']);
    expect(await hook.run('MARK_READY')).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('settles a restored MARK_READY by reading READY without replaying its POST', async () => {
    const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    sessionStorage.setItem('zipco-coordination:synthetic:business:7', JSON.stringify({ action: 'MARK_READY', body: { expectedVersion: 2 }, key }));
    const input = { ...raw, status: 'ready', requestProcess: { ...process, state: 'READY', version: 3, allowedActions: [] } };
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response([input])));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([input])[0], true, vi.fn());
    expect(hook.pending()?.key).toBe(key); expect(hook.restored()).toBe(true);
    expect(await hook.retry()).toBe(false); expect(fetcher).not.toHaveBeenCalled();
    await hook.update();
    expect(hook.pending()).toBeNull(); expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][1].method).toBeUndefined();
    expect(await hook.run('MARK_READY')).toBe(false); expect(navigate).not.toHaveBeenCalled();
  });
  it('refreshes before navigating and does not persist the URL', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ result: receipt, navigation: { url } }))
      .mockResolvedValueOnce(response([{ ...raw, requestProcess: { ...process, state: 'COORDINATING', version: 3 } }]));
    vi.stubGlobal('fetch', fetcher); const store = vi.spyOn(sessionStorage, 'setItem');
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    expect(await hook.run('OPEN_WHATSAPP')).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2); expect(navigate).toHaveBeenCalledWith(url);
    expect(JSON.stringify(store.mock.calls)).not.toContain('wa.me');
  });
  it.each([true, false])('never reuses navigation when contact is unavailable (navigation null=%s)', async (absent) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ result: receipt, navigation: absent ? null : { url },
      ...(absent ? { navigationUnavailableReason: 'CONTACT_NOT_AVAILABLE' } : {}) }))
      .mockResolvedValueOnce(response([{ ...raw, status: 'cancelled', requestProcess: { ...process, state: 'COORDINATION_CANCELLED', version: 4, allowedActions: [] } }])));
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    expect(await hook.run('OPEN_WHATSAPP')).toBe(true); expect(navigate).not.toHaveBeenCalled();
  });
  it('retries the exact request after network failure and blocks a double touch', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response({ result: receipt, navigation: { url } }))
      .mockResolvedValueOnce(response([{ ...raw, requestProcess: { ...process, state: 'COORDINATING', version: 3 } }]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    const first = hook.run('OPEN_WHATSAPP');
    expect(await hook.run('OPEN_WHATSAPP')).toBe(false); await first;
    expect(hook.pending()?.action).toBe('OPEN_WHATSAPP');
    expect(await hook.retry()).toBe(true);
    expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
    expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetcher.mock.calls[1][1].headers['Idempotency-Key']);
    expect(hook.pending()).toBeNull();
  });
  it('refreshes a conflict without sending a second action automatically', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ code: 'STALE_VERSION', message: 'internal' }, 409))
      .mockResolvedValueOnce(response([{ ...raw, requestProcess: { ...process, version: 4 } }]));
    vi.stubGlobal('fetch', fetcher); const refresh = vi.fn();
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, refresh);
    expect(await hook.run('START_WORK')).toBe(false);
    expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
    expect(refresh).toHaveBeenCalledOnce(); expect(hook.pending()).toBeNull();
  });
  it('does not allow a retry flag to bypass permissions or create an intention', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], false, vi.fn());
    expect(await hook.run('START_WORK')).toBe(false);
    expect(await hook.run('START_WORK', undefined, undefined, true)).toBe(false);
    expect(await hook.retry()).toBe(false); expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['user', 'token', 'unmount'])('discards a late POST after changing %s, retaining the original intention for reconciliation', async (change) => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })); vi.stubGlobal('fetch', fetcher);
    const dispatch = vi.spyOn(window, 'dispatchEvent'); const remove = vi.spyOn(sessionStorage, 'removeItem');
    const { default: useCoordination } = await import('./useCoordination'); const refresh = vi.fn();
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, refresh);
    const request = hook.run('OPEN_WHATSAPP');
    const saved = sessionStorage.getItem('zipco-coordination:synthetic:business:7');
    if (change === 'user') { identity.set('zipco-user-id', 'other'); identity.set('zipco-token', 'other-token'); }
    if (change === 'token') identity.set('zipco-token', 'renewed-token');
    if (change === 'unmount') { hooks.cleanups.forEach((cleanup) => cleanup()); hooks.cleanups = []; }
    finish(response({ result: receipt, navigation: { url } }));
    expect(await request).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce(); expect(navigate).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled(); expect(refresh).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('zipco-coordination:synthetic:business:7')).toBe(saved);
    expect(hooks.toast).not.toHaveBeenCalled();
  });
  it('discards late GET/navigation after another user signs in', async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn().mockResolvedValueOnce(response({ result: receipt, navigation: { url } }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal('fetch', fetcher); const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { default: useCoordination } = await import('./useCoordination'); const refresh = vi.fn();
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, refresh);
    const request = hook.run('OPEN_WHATSAPP');
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    identity.set('zipco-user-id', 'other'); identity.set('zipco-token', 'other-token');
    const remove = vi.spyOn(sessionStorage, 'removeItem');
    finish(response([{ ...raw, requestProcess: { ...process, version: 3 } }])); await request;
    expect(navigate).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled(); expect(refresh).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer synthetic-token');
  });
  it('does not clear another scope when conflict recovery finishes late', async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn().mockResolvedValueOnce(response({ code: 'STALE_VERSION' }, 409))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    const request = hook.run('START_WORK'); await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    identity.set('zipco-user-id', 'other'); identity.set('zipco-token', 'other-token');
    sessionStorage.setItem('zipco-coordination:other:business:7', 'keep-other-scope');
    const remove = vi.spyOn(sessionStorage, 'removeItem');
    finish(response([raw])); await request;
    expect(remove).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('zipco-coordination:other:business:7')).toBe('keep-other-scope');
  });
  it('keeps POST success when GET fails and updates only by GET without another POST', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ result: receipt, navigation: { url } }))
      .mockRejectedValueOnce(new TypeError('read offline')).mockResolvedValueOnce(response([{ ...raw, requestProcess: { ...process, version: 3 } }]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    expect(await hook.run('OPEN_WHATSAPP')).toBe(true);
    expect(hook.pending()).toBeNull(); expect(hooks.slots[2]).toBe(true);
    expect(sessionStorage.getItem('zipco-coordination:synthetic:business:7')).toBeNull();
    expect(await hook.retry()).toBe(false); expect(await hook.run('OPEN_WHATSAPP')).toBe(false);
    await hook.update();
    expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
    expect(navigate).not.toHaveBeenCalled(); expect(hooks.slots[2]).toBe(false);
    expect(hooks.toast).toHaveBeenCalledWith(expect.stringContaining('operación fue confirmada'), 'error');
  });
  it('reports failed storage cleanup and blocks replay or new keys until a read-only recovery', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ result: receipt, navigation: { url } }))
      .mockImplementation(() => Promise.resolve(response([{ ...raw, requestProcess: { ...process, version: 3 } }])));
    vi.stubGlobal('fetch', fetcher);
    const remove = vi.spyOn(sessionStorage, 'removeItem').mockImplementation(() => { throw new Error('unavailable'); });
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    expect(await hook.run('OPEN_WHATSAPP')).toBe(true);
    expect(hook.pending()).toBeNull(); expect(hook.storageWarning()).toContain('no se pudo limpiar');
    expect(await hook.retry()).toBe(false); await hook.run('OPEN_WHATSAPP');
    expect(fetcher.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
    expect(navigate).not.toHaveBeenCalled();
    remove.mockRestore(); await hook.update(); expect(hook.storageWarning()).toBe('');
  });
  it('reconciles a restored WhatsApp record by GET without replaying a potentially confirmed operation', async () => {
    const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    sessionStorage.setItem('zipco-coordination:synthetic:business:7', JSON.stringify({ action: 'OPEN_WHATSAPP', body: { expectedVersion: 2, consentAccepted: true }, key }));
    const fetcher = vi.fn().mockResolvedValue(response([raw])); vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeBusinessOrdersPayload([raw])[0], true, vi.fn());
    expect(hook.pending()?.key).toBe(key); expect(hook.restored()).toBe(true);
    await hook.retry(); expect(fetcher).not.toHaveBeenCalled();
    await hook.update();
    expect(fetcher).toHaveBeenCalledOnce(); expect(fetcher.mock.calls[0][1].method).toBeUndefined();
    expect(hook.pending()).toBeNull(); expect(navigate).not.toHaveBeenCalled();
  });
  it('allows the identical restored intention only after an unchanged, unfulfilled state is read', async () => {
    const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const body = { expectedVersion: 2, consentAccepted: true };
    sessionStorage.setItem('zipco-coordination:synthetic:customer:7', JSON.stringify({ action: 'AUTHORIZE_CONTACT', body, key }));
    const customerRaw = { ...raw, requestProcess: { ...process, allowedActions: ['AUTHORIZE_CONTACT'], coordination: { customerContactAuthorized: false, businessContactAuthorized: false } } };
    const fetcher = vi.fn().mockResolvedValueOnce(response([customerRaw])).mockResolvedValueOnce(response(receipt))
      .mockResolvedValueOnce(response([{ ...customerRaw, requestProcess: { ...customerRaw.requestProcess, version: 3, coordination: { customerContactAuthorized: true, businessContactAuthorized: false } } }]));
    vi.stubGlobal('fetch', fetcher);
    const { default: useCoordination } = await import('./useCoordination');
    const hook = useCoordination(normalizeMyOrdersPayload([customerRaw])[0], false, vi.fn());
    hook.pending(); expect(hook.restored()).toBe(true); await hook.update();
    expect(hook.restored()).toBe(false); expect(await hook.retry()).toBe(true);
    expect(fetcher.mock.calls[1][1].headers['Idempotency-Key']).toBe(key);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual(body);
  });
});
