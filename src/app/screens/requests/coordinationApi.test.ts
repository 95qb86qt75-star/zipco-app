import { afterEach, describe, expect, it, vi } from 'vitest';
import { coordinationAllowed, coordinationBody, sendCoordination, whatsappUrl } from './coordinationApi';
import { normalizeRequestProcess } from './requestProcess';
import { statusViewFor } from './requestStatusGrouping';
import { processApiError } from './requestProcessErrors';
import { coordinationProcess } from './requestProcessFixtures';
import { mergeProcessOrderUpdates } from './processOrderUpdates';

const process = { ...coordinationProcess, coordination: { customerContactAuthorized: true, businessContactAuthorized: true },
  allowedActions: ['AUTHORIZE_CONTACT', 'OPEN_WHATSAPP', 'START_WORK', 'ANNUL_COORDINATION'] as const };
afterEach(() => vi.unstubAllGlobals());
describe('coordination public contract', () => {
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('consumes the exact %s contract with no contact dependency', async (action) => {
    const acknowledged = action === 'CONFIRM_RECEIPT';
    const source = { ...coordinationProcess, state: 'READY', readyNoticeAcknowledged: acknowledged, allowedActions: [action] };
    expect(coordinationAllowed(source, false, action)).toBe(true);
    expect(coordinationAllowed(source, true, action)).toBe(false);
    expect(coordinationAllowed({ ...source, allowedActions: [] }, false, action)).toBe(false);
    for (const state of ['IN_PROGRESS', 'COMPLETED', 'COORDINATION_PENDING'])
      expect(coordinationAllowed({ ...source, state }, false, action)).toBe(false);
    expect(coordinationAllowed({ ...source, readyNoticeAcknowledged: !acknowledged }, false, action)).toBe(false);
    const result = { orderId: 20, orderStatus: acknowledged ? 'completed' : 'ready', requestProcess: {
      ...coordinationProcess, state: acknowledged ? 'COMPLETED' : 'READY', version: 3, readyNoticeAcknowledged: true,
      allowedActions: acknowledged ? [] : ['CONFIRM_RECEIPT'],
    } };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(result))); vi.stubGlobal('fetch', fetcher);
    const body = coordinationBody(action, 2, 'OTHER', 'must not be sent');
    expect(body).toEqual({ expectedVersion: 2, confirmationAccepted: true });
    expect(await sendCoordination(7, 20, action, body, 'test', 'test-key')).toEqual({ result, navigation: null });
    const [path, init] = fetcher.mock.calls[0];
    expect(path).toContain(`/request-processes/7/actions/${action === 'ACK_READY_NOTICE' ? 'ack-ready-notice' : 'confirm-receipt'}`);
    expect(init.method).toBe('POST'); expect(init.headers['Idempotency-Key']).toBe('test-key');
    expect(JSON.parse(init.body)).toEqual(body); expect(fetcher).toHaveBeenCalledOnce();
  });
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('tolerates historical %s receipts missing the optional boolean', async (action) => {
    const receipt = { orderId: 20, orderStatus: action === 'ACK_READY_NOTICE' ? 'ready' : 'completed', requestProcess: {
      ...coordinationProcess, state: action === 'ACK_READY_NOTICE' ? 'READY' : 'COMPLETED', version: 3,
    } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt))));
    const response = await sendCoordination(7, 20, action, coordinationBody(action, 2), 'test', 'key');
    expect(response.result.requestProcess).not.toHaveProperty('readyNoticeAcknowledged');
  });
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('rejects contradictory or unadvanced %s receipts', async (action) => {
    const result = { orderId: 20, orderStatus: action === 'ACK_READY_NOTICE' ? 'ready' : 'completed', requestProcess: {
      ...coordinationProcess, state: action === 'ACK_READY_NOTICE' ? 'READY' : 'COMPLETED', version: 3, readyNoticeAcknowledged: true,
    } };
    for (const patch of [{ readyNoticeAcknowledged: false }, { version: 2 }, { state: 'IN_PROGRESS' }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...result, requestProcess: { ...result.requestProcess, ...patch } }))));
      await expect(sendCoordination(7, 20, action, coordinationBody(action, 2), 'test', 'key')).rejects.toThrow('No se pudo confirmar');
    }
  });
  it('offers MARK_READY only to the permitted business in progress without requiring contact', () => {
    const ready = { ...coordinationProcess, state: 'IN_PROGRESS', allowedActions: ['MARK_READY'] as const };
    const valid = normalizeRequestProcess(ready)!;
    expect(valid).not.toBeNull();
    expect(coordinationAllowed(valid, true, 'MARK_READY')).toBe(true);
    expect(coordinationAllowed(valid, false, 'MARK_READY')).toBe(false);
    for (const state of ['COORDINATION_PENDING', 'READY', 'COORDINATION_CANCELLED'])
      expect(coordinationAllowed({ ...valid, state }, true, 'MARK_READY')).toBe(false);
    expect(coordinationAllowed({ ...valid, allowedActions: [] }, true, 'MARK_READY')).toBe(false);
    expect(coordinationBody('MARK_READY', 7)).toEqual({ expectedVersion: 7 });
  });
  it.each(['accepted', 'ready'])('rejects an incompatible MARK_READY receipt (%s)', async (orderStatus) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ orderId: 20, orderStatus,
      requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS', version: 3 } }))));
    await expect(sendCoordination(7, 20, 'MARK_READY', { expectedVersion: 2 }, 'test', 'key')).rejects.toThrow('No se pudo confirmar');
  });
  it('preserves client WhatsApp access and ready status according to server permissions', async () => {
    const ready = { ...coordinationProcess, state: 'READY', version: 3, allowedActions: ['OPEN_WHATSAPP'] as const,
      coordination: { customerContactAuthorized: true, businessContactAuthorized: true } };
    expect(coordinationAllowed(normalizeRequestProcess(ready), false, 'OPEN_WHATSAPP')).toBe(true);
    expect(coordinationAllowed({ ...normalizeRequestProcess(ready)!, allowedActions: [] }, false, 'OPEN_WHATSAPP')).toBe(false);
    const result = { orderId: 20, orderStatus: 'ready', requestProcess: ready };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ result, navigation: null, navigationUnavailableReason: 'CONTACT_NOT_AVAILABLE' }))));
    expect((await sendCoordination(7, 20, 'OPEN_WHATSAPP', { expectedVersion: 3, consentAccepted: true }, 'test', 'key')).result).toEqual(result);
  });
  it('normalizes all recognized actions and contact flags without phones', () => {
    const normalized = normalizeRequestProcess({ ...process, phone: 'not retained' });
    expect(normalized?.coordination).toEqual(process.coordination);
    expect(normalized?.allowedActions).toEqual(process.allowedActions);
    expect(normalized).not.toHaveProperty('phone');
    expect(normalizeRequestProcess({ ...process, coordination: { customerContactAuthorized: 1 } })).toBeNull();
    expect(normalizeRequestProcess({ ...process, allowedActions: 'OPEN_WHATSAPP' })).toBeNull();
    expect(normalizeRequestProcess({ ...process, allowedActions: ['UNKNOWN'] })).toBeNull();
  });
  it.each([
    ['COORDINATION_PENDING', 'coordination'], ['COORDINATING', 'coordination'],
    ['READY', 'ready'], ['IN_PROGRESS', 'active'], ['COORDINATION_CANCELLED', 'history'],
  ] as const)('groups %s by the process instead of accepted Order status', (state, view) => {
    expect(statusViewFor('orders', 'accepted', { ...coordinationProcess, state })).toBe(view);
  });
  it('requires participant, recognized state, coordination flags and server permissions', () => {
    const valid = normalizeRequestProcess(process)!;
    expect(coordinationAllowed(valid, true, 'START_WORK')).toBe(true);
    expect(coordinationAllowed(valid, false, 'START_WORK')).toBe(false);
    expect(coordinationAllowed(valid, true, 'AUTHORIZE_CONTACT')).toBe(false);
    expect(coordinationAllowed(valid, false, 'AUTHORIZE_CONTACT')).toBe(true);
    expect(coordinationAllowed({ ...valid, coordination: { ...valid.coordination!, customerContactAuthorized: false } }, false, 'OPEN_WHATSAPP')).toBe(false);
    expect(coordinationAllowed({ ...valid, state: 'IN_PROGRESS' }, false, 'OPEN_WHATSAPP')).toBe(true);
    expect(coordinationAllowed({ ...valid, state: 'IN_PROGRESS' }, true, 'ANNUL_COORDINATION')).toBe(false);
    for (const value of [null, { ...valid, coordination: undefined }, { ...valid, allowedActions: [] }, { ...valid, state: 'UNKNOWN' }])
      expect(coordinationAllowed(value, true, 'OPEN_WHATSAPP')).toBe(false);
  });
  it('does not replace a newer cancellation with an original WhatsApp receipt', () => {
    const current = [{ id: 20, status: 'cancelled', requestProcess: { ...coordinationProcess, version: 5, state: 'COORDINATION_CANCELLED' } }];
    const original = [{ id: 20, status: 'accepted', requestProcess: coordinationProcess }];
    expect(mergeProcessOrderUpdates(original, current)).toEqual(current);
  });
  it('builds exact bodies and validates Other without carrying incompatible details', () => {
    expect(coordinationBody('AUTHORIZE_CONTACT', 2)).toEqual({ expectedVersion: 2, consentAccepted: true });
    expect(coordinationBody('OPEN_WHATSAPP', 2)).toEqual({ expectedVersion: 2, consentAccepted: true });
    expect(coordinationBody('START_WORK', 2)).toEqual({ expectedVersion: 2 });
    expect(coordinationBody('ANNUL_COORDINATION', 2, 'OTHER', '  Explicación  ')).toEqual({ expectedVersion: 2, reasonCode: 'OTHER', reasonDetail: 'Explicación' });
    expect(coordinationBody('ANNUL_COORDINATION', 2, 'COUNTERPART_NOT_RESPONDING', 'omit')).not.toHaveProperty('reasonDetail');
    for (const detail of ['', '   ', 'a'.repeat(1001)]) expect(() => coordinationBody('ANNUL_COORDINATION', 2, 'OTHER', detail)).toThrow();
  });
  it.each(['http://wa.me/12345678?text=x', 'https://wa.me.evil.test/12345678?text=x', 'https://user@wa.me/12345678?text=x',
    'javascript:alert(1)', 'https://wa.me:444/12345678?text=x', 'https://wa.me/redirect?text=x', 'https://wa.me/12345678?redirect=x', null])('rejects unsafe navigation %s', (url) => {
    expect(whatsappUrl(url)).toBeNull();
  });
  it.each(['AUTHORIZE_CONTACT', 'OPEN_WHATSAPP', 'START_WORK', 'MARK_READY', 'ANNUL_COORDINATION'] as const)('uses only the new route for %s and validates the receipt', async (action) => {
    const requestProcess = { ...coordinationProcess, version: 3, state: action === 'MARK_READY' ? 'READY' : action === 'START_WORK' ? 'IN_PROGRESS' : action === 'ANNUL_COORDINATION' ? 'COORDINATION_CANCELLED' : 'COORDINATING' };
    const receipt = { orderId: 20, orderStatus: action === 'ANNUL_COORDINATION' ? 'cancelled' : action === 'MARK_READY' ? 'ready' : 'accepted', requestProcess };
    const url = 'https://wa.me/12345678?text=Mensaje%20de%20prueba';
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(action === 'OPEN_WHATSAPP' ? { result: receipt, navigation: { url } } : receipt)));
    vi.stubGlobal('fetch', fetcher);
    const body = coordinationBody(action, 2, 'COORDINATION_NOT_REACHED');
    const result = await sendCoordination(7, 20, action, body, 'synthetic-token', 'synthetic-key');
    expect(result.result).toEqual(receipt);
    const [path, init] = fetcher.mock.calls[0];
    expect(path).toContain(`/request-processes/7/actions/${action.toLowerCase().replaceAll('_', '-')}`);
    expect(init.method).toBe('POST'); expect(init.headers['Idempotency-Key']).toBe('synthetic-key');
    expect(JSON.parse(init.body)).toEqual(body); expect(fetcher).toHaveBeenCalledOnce();
  });
  it('accepts navigation null with an original receipt but rejects malformed success', async () => {
    const result = { orderId: 20, orderStatus: 'accepted', requestProcess: coordinationProcess };
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ result, navigation: null, navigationUnavailableReason: 'CONTACT_NOT_AVAILABLE' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result, navigation: { url: 'https://evil.test' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...result, orderId: 99 })));
    vi.stubGlobal('fetch', fetcher);
    expect((await sendCoordination(7, 20, 'OPEN_WHATSAPP', coordinationBody('OPEN_WHATSAPP', 2), 'test', 'key')).navigation).toBeNull();
    await expect(sendCoordination(7, 20, 'OPEN_WHATSAPP', coordinationBody('OPEN_WHATSAPP', 2), 'test', 'key')).rejects.toThrow('No se pudo verificar');
    await expect(sendCoordination(7, 20, 'AUTHORIZE_CONTACT', coordinationBody('AUTHORIZE_CONTACT', 2), 'test', 'key')).rejects.toThrow('No se pudo confirmar');
  });
  it('uses only public errors and safe text for unknown responses', () => {
    expect(processApiError(409, { code: 'INVALID_PROFILE_CONTACT' }).message).toBe('Revisa el teléfono internacional de tu perfil antes de continuar.');
    expect(processApiError(409, { code: 'CONTACT_CONSENT_REQUIRED' }).message).toContain('La otra parte todavía debe autorizar');
    for (const status of [400, 401, 403, 404, 409, 500]) expect(processApiError(status, { message: 'INTERNAL SECRET' }).message).not.toContain('INTERNAL');
  });
});
