import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFixedOrderAcceptance } from './fixedOrderAcceptance';
import { readBusinessOrderForRecovery } from './requestProcessApi';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { rawOrder, pendingProcess, coordinationProcess } from './requestProcessFixtures';

const key = '123e4567-e89b-42d3-a456-426614174000';
const storageKey = 'zipco-fixed-accept:test:7';
const result = { orderId: 20, orderStatus: 'accepted', requestProcess: coordinationProcess };
const confirmed = () => new Response(JSON.stringify(result));
const businessOrder = (process = pendingProcess, status = 'pending') =>
  normalizeBusinessOrdersPayload([{ ...rawOrder, status, requestProcess: process }])[0];
function memoryStorage(value?: string) {
  const values = new Map(value === undefined ? [] : [[storageKey, value]]);
  return {
    getItem: vi.fn((k: string) => values.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { values.set(k, v); }),
    removeItem: vi.fn((k: string) => { values.delete(k); }),
  };
}
afterEach(() => vi.unstubAllGlobals());

describe('pending, in-flight and confirmed acceptance lifecycle', () => {
  it('generates a real UUID v4 for a new deliberate acceptance', async () => {
    const fetch = vi.fn().mockResolvedValue(confirmed()); vi.stubGlobal('fetch', fetch);
    await createFixedOrderAcceptance(undefined, memoryStorage(), 'test').accept(20, pendingProcess, 'session');
    expect(fetch.mock.calls[0][1].headers['Idempotency-Key'])
      .toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  it('removes pending storage on success and prevents another POST until the UI acknowledges it', async () => {
    const storage = memoryStorage(); const fetch = vi.fn().mockResolvedValue(confirmed()); vi.stubGlobal('fetch', fetch);
    const accept = createFixedOrderAcceptance(() => key, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session')).resolves.toEqual(result);
    expect(storage.removeItem).toHaveBeenCalledWith(storageKey);
    expect(storage.getItem(storageKey)).toBeNull();
    await expect(accept.accept(20, pendingProcess, 'session')).resolves.toEqual(result);
    expect(fetch).toHaveBeenCalledOnce();
    accept.acknowledge(coordinationProcess);
    await expect(accept.accept(20, coordinationProcess, 'session')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('retains the same key after an uncertain result and clears it after the confirmed retry', async () => {
    const storage = memoryStorage(); const fetch = vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(confirmed());
    vi.stubGlobal('fetch', fetch); const uuid = vi.fn(() => key);
    const accept = createFixedOrderAcceptance(uuid, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session')).rejects.toThrow();
    expect(JSON.parse(storage.getItem(storageKey)!)).toEqual({ signature: '20:1:123', key });
    await accept.accept(20, pendingProcess, 'session');
    expect(uuid).toHaveBeenCalledOnce();
    expect(fetch.mock.calls.map((call) => call[1].headers['Idempotency-Key'])).toEqual([key, key]);
    expect(storage.getItem(storageKey)).toBeNull();
  });
  it('refreshes a confirmed conflict without automatically retrying the acceptance', async () => {
    const storage = memoryStorage(); const refresh = vi.fn().mockResolvedValue(businessOrder());
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ code: 'STALE_VERSION' }), { status: 409 }))
      .mockResolvedValueOnce(confirmed()); vi.stubGlobal('fetch', fetch);
    const uuid = vi.fn().mockReturnValueOnce(key).mockReturnValueOnce('123e4567-e89b-42d3-a456-426614174001');
    const accept = createFixedOrderAcceptance(uuid, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).rejects.toMatchObject({ status: 409 });
    expect(refresh).toHaveBeenCalledOnce(); expect(fetch).toHaveBeenCalledOnce();
    expect(storage.getItem(storageKey)).toBeNull();
    // Only a separate deliberate invocation can submit again after the refresh.
    await accept.accept(20, pendingProcess, 'session', refresh);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers['Idempotency-Key']).not.toBe(key);
  });
  it('reflects an acceptance found while refreshing a conflict, without a second POST', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'INCOMPATIBLE_STATE' }), { status: 409 }));
    vi.stubGlobal('fetch', fetch); const storage = memoryStorage();
    const refresh = vi.fn().mockResolvedValue(businessOrder(coordinationProcess, 'accepted'));
    const accept = createFixedOrderAcceptance(() => key, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).resolves.toEqual(result);
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).resolves.toEqual(result);
    expect(fetch).toHaveBeenCalledOnce(); expect(refresh).toHaveBeenCalledOnce();
    expect(storage.getItem(storageKey)).toBeNull();
  });
  it('does not resubmit a confirmed acceptance if storage becomes unavailable during cleanup', async () => {
    const fetch = vi.fn().mockResolvedValue(confirmed()); vi.stubGlobal('fetch', fetch);
    const storage = memoryStorage(); storage.removeItem.mockImplementation(() => { throw new Error('storage unavailable'); });
    const accept = createFixedOrderAcceptance(() => key, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session')).resolves.toEqual(result);
    await expect(accept.accept(20, pendingProcess, 'session')).resolves.toEqual(result);
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('corrupt acceptance record recovery', () => {
  it('reflects server-confirmed acceptance without generating a UUID or sending an acceptance', async () => {
    const storage = memoryStorage('{broken');
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }])));
    vi.stubGlobal('fetch', fetch); const uuid = vi.fn(() => key);
    const refresh = () => readBusinessOrderForRecovery(20, 50, 'session');
    const accept = createFixedOrderAcceptance(uuid, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).resolves.toEqual(result);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toMatch(/\/orders\/business\/50$/);
    expect(fetch.mock.calls[0][1].method).toBeUndefined();
    expect(uuid).not.toHaveBeenCalled(); expect(storage.getItem(storageKey)).toBeNull();
  });
  it('clears corruption only after fetching the unchanged pending version and requires a deliberate new action', async () => {
    const storage = memoryStorage('{broken'); const refresh = vi.fn().mockResolvedValue(businessOrder());
    const fetch = vi.fn().mockResolvedValue(confirmed()); vi.stubGlobal('fetch', fetch); const uuid = vi.fn(() => key);
    const accept = createFixedOrderAcceptance(uuid, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).rejects.toThrow('pulsa Aceptar pedido');
    expect(refresh).toHaveBeenCalledOnce(); expect(storage.getItem(storageKey)).toBeNull();
    expect(uuid).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    await accept.accept(20, pendingProcess, 'session', refresh);
    expect(uuid).toHaveBeenCalledOnce(); expect(fetch).toHaveBeenCalledOnce();
  });
  it.each([
    { ...pendingProcess, version: 2 },
    { ...pendingProcess, currentProposalId: 124 },
    { ...pendingProcess, state: 'UNKNOWN' },
  ])('requires condition review when the authoritative process changed', async (process) => {
    const storage = memoryStorage('{broken'); const refresh = vi.fn().mockResolvedValue(businessOrder(process));
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const uuid = vi.fn(() => key);
    const accept = createFixedOrderAcceptance(uuid, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).rejects.toThrow('revisa sus condiciones');
    expect(refresh).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled();
    expect(uuid).not.toHaveBeenCalled(); expect(storage.getItem(storageKey)).toBeNull();
  });
  it('preserves corruption and blocks submission when the authoritative refresh fails', async () => {
    const storage = memoryStorage('{broken'); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const refresh = vi.fn().mockRejectedValue(new TypeError('network')); const uuid = vi.fn(() => key);
    const accept = createFixedOrderAcceptance(uuid, storage, 'test');
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).rejects.toThrow();
    expect(storage.getItem(storageKey)).toBe('{broken'); expect(fetch).not.toHaveBeenCalled(); expect(uuid).not.toHaveBeenCalled();
  });
  it('blocks a second tap during the recovery read', async () => {
    const storage = memoryStorage('{broken'); let resolve!: (value: ReturnType<typeof businessOrder>) => void;
    const refresh = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const accept = createFixedOrderAcceptance(() => key, storage, 'test');
    const first = accept.accept(20, pendingProcess, 'session', refresh);
    await expect(accept.accept(20, pendingProcess, 'session', refresh)).resolves.toBeNull();
    resolve(businessOrder()); await expect(first).rejects.toThrow('pulsa Aceptar pedido');
    expect(refresh).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled();
  });
});
