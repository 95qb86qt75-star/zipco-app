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
describe('coordination hook with mocked server and external navigation', () => {
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
