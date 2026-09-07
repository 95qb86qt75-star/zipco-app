import { afterEach, describe, expect, it, vi } from 'vitest';
import { DevAuthError, parseDevAuthSession, requestDevSession } from './devAuthApi';
import type { DevAuthConfig } from './devAuthConfig';

const config: DevAuthConfig = { state: 'enabled', apiOrigin: 'http://127.0.0.1:3000', key: 'test-local-key' };
const session = {
  access_token: 'signed-local-jwt',
  user: { id: 2, name: 'Negocio de prueba', email: 'dev.business-owner@zipco.local', role: 'user' },
  businessId: 1
};

const response = (ok: boolean, status: number, body: unknown, invalidJson = false) => ({
  ok,
  status,
  json: invalidJson ? vi.fn().mockRejectedValue(new Error('invalid')) : vi.fn().mockResolvedValue(body)
}) as unknown as Response;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('strict dev auth response', () => {
  it('accepts the exact customer and owner contracts', () => {
    expect(parseDevAuthSession(session)).toEqual(session);
    expect(parseDevAuthSession({ ...session, businessId: null, user: { ...session.user, role: 'admin' } })).not.toBeNull();
  });

  it.each([
    null,
    [],
    { ...session, access_token: '' },
    { ...session, access_token: ' padded ' },
    { ...session, token: session.access_token, access_token: undefined },
    { ...session, userId: 2 },
    { ...session, user: { ...session.user, id: '2' } },
    { ...session, user: { ...session.user, id: 0 } },
    { ...session, user: { ...session.user, name: '' } },
    { ...session, user: { ...session.user, email: '' } },
    { ...session, user: { ...session.user, role: 'owner' } },
    { ...session, businessId: '1' },
    { ...session, extra: true }
  ])('rejects a non-contractual response %#', (value) => {
    expect(parseDevAuthSession(value)).toBeNull();
  });
});

describe('dev auth API', () => {
  it('sends the exact local request without fabricating a JWT', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(true, 201, session));
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestDevSession(config, 'business-owner')).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/dev/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-Auth-Key': 'test-local-key' },
      body: JSON.stringify({ account: 'business-owner' })
    });
  });

  it.each(['customer', 'business-owner', 'unrelated-user', 'admin'] as const)('accepts alias %s', async (account) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(true, 201, session)));
    await expect(requestDevSession(config, account)).resolves.toEqual(session);
  });

  it('does not send a request when configuration is disabled', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestDevSession({ state: 'disabled' }, 'customer')).rejects.toBeInstanceOf(DevAuthError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([[400, 'cuenta'], [401, 'clave'], [404, 'disponible'], [500, 'sesión local']])
  ('maps HTTP %s to a controlled message', async (status, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, Number(status), { message: 'private detail' })));
    await expect(requestDevSession(config, 'customer')).rejects.toMatchObject({
      status,
      message: expect.stringContaining(String(expected))
    });
  });

  it('rejects invalid JSON and network failures without exposing details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(true, 201, null, true)));
    await expect(requestDevSession(config, 'customer')).rejects.toMatchObject({ message: expect.stringContaining('respuesta inválida') });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private network detail')));
    await expect(requestDevSession(config, 'customer')).rejects.toMatchObject({ message: 'No se pudo conectar con el backend local.' });
  });

  it('does not log the local key or JWT', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 500, session)));
    await expect(requestDevSession(config, 'customer')).rejects.toBeInstanceOf(DevAuthError);
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
