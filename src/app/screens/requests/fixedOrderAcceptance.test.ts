import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFixedOrderAcceptance } from './fixedOrderAcceptance';
import { readAgreement } from './requestProcessApi';
import { processApiError, PAST_SCHEDULE_MESSAGE, DST_SCHEDULE_MESSAGE, REFRESH_CONDITIONS_MESSAGE } from './requestProcessErrors';
import { patchOrderStatus } from './ordersApi';
import { pendingProcess, coordinationProcess, agreementFixture, rawOrder } from './requestProcessFixtures';
import { normalizeBusinessOrdersPayload } from './orderNormalization';

const key = '123e4567-e89b-42d3-a456-426614174000';
const confirmed = () => new Response(JSON.stringify({ orderId: 20, orderStatus: 'accepted', requestProcess: coordinationProcess }));
afterEach(() => vi.unstubAllGlobals());

describe('fixed order acceptance transport and intention', () => {
  it('uses the new route and exact version, proposal and stable UUID header', async () => {
    const fetch = vi.fn().mockResolvedValue(confirmed()); vi.stubGlobal('fetch', fetch);
    const accept = createFixedOrderAcceptance(() => key);
    expect(await accept.accept(20, pendingProcess, 'test-token')).toMatchObject({ orderStatus: 'accepted', requestProcess: coordinationProcess });
    expect(fetch.mock.calls[0][0]).toMatch(/\/request-processes\/7\/actions\/accept-fixed-order$/);
    expect(fetch.mock.calls[0][1]).toEqual({ method: 'POST', headers: {
      Authorization: 'Bearer test-token', 'Idempotency-Key': key, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ expectedVersion: 1, proposalId: 123 }) });
  });
  it('reuses UUID after network failure, server failure and malformed success', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(new Response('internal', { status: 500 }))
      .mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(confirmed());
    vi.stubGlobal('fetch', fetch); const uuid = vi.fn(() => key);
    const accept = createFixedOrderAcceptance(uuid);
    for (let i = 0; i < 3; i++) await expect(accept.accept(20, pendingProcess, 'test')).rejects.toThrow();
    await accept.accept(20, pendingProcess, 'test');
    expect(uuid).toHaveBeenCalledOnce();
    expect(fetch.mock.calls.map((call) => call[1].headers['Idempotency-Key'])).toEqual([key, key, key, key]);
  });
  it('survives card/screen remounts with the saved intention', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } };
    const fetch = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(confirmed());
    vi.stubGlobal('fetch', fetch);
    await expect(createFixedOrderAcceptance(() => key, storage).accept(20, pendingProcess, 'test')).rejects.toThrow();
    const uuid = vi.fn(() => crypto.randomUUID());
    await createFixedOrderAcceptance(uuid, storage).accept(20, pendingProcess, 'test');
    expect(uuid).not.toHaveBeenCalled();
    expect(fetch.mock.calls[1][1].headers['Idempotency-Key']).toBe(key);
  });
  it('prevents double tap while in flight and stale repeats after confirmation', async () => {
    let resolve!: (r: Response) => void;
    const fetch = vi.fn().mockReturnValue(new Promise<Response>((r) => { resolve = r; }));
    vi.stubGlobal('fetch', fetch); const accept = createFixedOrderAcceptance(() => key);
    const first = accept.accept(20, pendingProcess, 'test');
    await expect(accept.accept(20, pendingProcess, 'test')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledOnce(); resolve(confirmed()); await first;
    await expect(accept.accept(20, pendingProcess, 'test')).resolves.toMatchObject({ orderStatus: 'accepted' });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('requires changed conditions after a version/state/proposal/key conflict', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'private details' }), { status: 409 }));
    vi.stubGlobal('fetch', fetch); const uuid = vi.fn(() => key); const accept = createFixedOrderAcceptance(uuid);
    await expect(accept.accept(20, pendingProcess, 'test')).rejects.toMatchObject({ status: 409, refreshConditions: true });
    await expect(accept.accept(20, pendingProcess, 'test')).rejects.toThrow('Actualiza');
    expect(fetch).toHaveBeenCalledOnce(); expect(uuid).toHaveBeenCalledOnce();
  });
  it('keeps legacy PATCH available without using the new endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 20, status: 'accepted' }))); vi.stubGlobal('fetch', fetch);
    await patchOrderStatus(20, { status: 'accepted' }, 'test');
    expect(fetch.mock.calls[0][0]).toMatch(/\/orders\/20\/status$/);
    expect(fetch.mock.calls[0][1].method).toBe('PATCH');
  });
  it('starts a new intention only for freshly changed version/proposal', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ orderId: 20, orderStatus: 'accepted',
        requestProcess: { ...coordinationProcess, version: 3, currentProposalId: 124 } })));
    vi.stubGlobal('fetch', fetch);
    const nextKey = '123e4567-e89b-42d3-a456-426614174001';
    const uuid = vi.fn().mockReturnValueOnce(key).mockReturnValueOnce(nextKey);
    const accept = createFixedOrderAcceptance(uuid);
    const fresh = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: { ...pendingProcess, version: 2, currentProposalId: 124 } }])[0];
    await expect(accept.accept(20, pendingProcess, 'test', async () => fresh)).rejects.toThrow();
    await accept.accept(20, { ...pendingProcess, version: 2, currentProposalId: 124 }, 'test');
    expect(fetch.mock.calls[1][1].headers['Idempotency-Key']).toBe(nextKey);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ expectedVersion: 2, proposalId: 124 });
  });
  it('does not submit after a corrupt or unreadable persisted intention', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const uuid = vi.fn(() => key);
    const storage = { getItem: () => '{broken', setItem: vi.fn(), removeItem: vi.fn() };
    await expect(createFixedOrderAcceptance(uuid, storage).accept(20, pendingProcess, 'test')).rejects.toMatchObject({ refreshConditions: true });
    expect(fetch).not.toHaveBeenCalled(); expect(uuid).not.toHaveBeenCalled();
  });
  it('does not submit when safe intention storage fails', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const storage = { getItem: () => null, setItem: () => { throw new Error('unavailable'); }, removeItem: vi.fn() };
    await expect(createFixedOrderAcceptance(() => key, storage).accept(20, pendingProcess, 'test')).rejects.toThrow('aceptación segura');
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['STALE_VERSION', 'INCOMPATIBLE_STATE', 'PROPOSAL_MISMATCH', 'IDEMPOTENCY_KEY_REUSED', 'UNKNOWN', undefined])('handles public and unknown conflicts safely: %s', (code) => {
    expect(processApiError(409, { code, message: 'private detail' })).toMatchObject({
      message: REFRESH_CONDITIONS_MESSAGE, refreshConditions: true,
    });
  });
  it('honors the exact future-stage message and invalid-process refresh', () => {
    expect(processApiError(409, { code: 'ACTION_NOT_AVAILABLE_IN_2A' }).message).toBe('Disponible en una próxima etapa de prueba.');
    expect(processApiError(409, { code: 'INVALID_REQUEST_PROCESS' })).toMatchObject({ refreshConditions: true, message: expect.stringContaining('validar') });
  });
  it.each([PAST_SCHEDULE_MESSAGE, DST_SCHEDULE_MESSAGE])('preserves only approved schedule messages', (message) => {
    expect(processApiError(400, { message }).message).toBe(message);
    expect(processApiError(500, { message: 'private server detail' }).message).not.toContain('private');
  });
  it.each([401, 403, 400, 404, 409, 422, 500])('returns a controlled error for HTTP %i', (status) => {
    expect(processApiError(status, { message: 'internal stack' }).message).not.toContain('internal');
  });
  it('reads agreement using process.id, validating identity and public ID', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(agreementFixture))); vi.stubGlobal('fetch', fetch);
    expect(await readAgreement(7, 'agreement-test', 'test')).toEqual(agreementFixture);
    expect(fetch.mock.calls[0][0]).toMatch(/\/request-processes\/7\/agreement\?processContract=availability-v3$/);
    await expect(readAgreement(8, 'agreement-test', 'test')).rejects.toThrow('verificar');
  });
});
