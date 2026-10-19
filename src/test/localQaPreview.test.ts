import { describe, expect, it, vi } from 'vitest';
import { LOCAL_QA_BACKEND, isPrivateLanAddress, selectLanAddress, localQaOverrides, checkLocalQaCors } from '../../scripts/local-qa-preview-config.mjs';

describe('local design preview restricted to QA', () => {
  it('overrides an existing production or development API setting without copying secrets', () => {
    const settings = localQaOverrides({ VITE_API_URL: 'https://zipco-backend-production.up.railway.app',
      VITE_ENABLE_DEV_AUTH: 'true', VITE_DEV_AUTH_KEY: 'synthetic-value-must-not-be-copied' });
    expect(settings.VITE_API_URL).toBe(LOCAL_QA_BACKEND);
    expect(settings.VITE_ENABLE_QA_AUTH).toBe('true');
    expect(settings.VITE_ENABLE_DEV_AUTH).toBe('false');
    expect(settings.VITE_DEV_AUTH_KEY).toBe('');
    expect(JSON.stringify(settings)).not.toContain('synthetic-value-must-not-be-copied');
  });
  it.each([{ VERCEL: '1' }, { CI: 'true' }])('cannot run on a provider/CI environment (%j)', (env) => {
    expect(() => localQaOverrides(env)).toThrow('exclusiva');
  });
  it.each(['127.0.0.1', '0.0.0.0', '8.8.8.8', '169.254.1.1', '192.168.1.999', '::1'])('does not listen on %s', (address) => {
    expect(isPrivateLanAddress(address)).toBe(false);
  });
  it('prefers the Wi-Fi address and validates an explicitly selected interface', () => {
    const interfaces = { Ethernet: [{ address: '10.1.0.1', family: 'IPv4', internal: false }],
      'Wi-Fi': [{ address: '192.168.50.168', family: 'IPv4', internal: false }] };
    expect(selectLanAddress(interfaces)).toBe('192.168.50.168');
    expect(selectLanAddress(interfaces, '10.1.0.1')).toBe('10.1.0.1');
    expect(() => selectLanAddress(interfaces, '192.168.99.99')).toThrow('no pertenece');
    expect(() => selectLanAddress({})).toThrow('Wi-Fi');
  });
  it('checks only a credential-free OPTIONS request against the fixed QA backend', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204,
      headers: { 'Access-Control-Allow-Origin': 'http://192.168.50.168:5173' } }));
    expect(await checkLocalQaCors('http://192.168.50.168:5173', request)).toEqual({ reachable: true, httpStatus: 204, originAllowed: true });
    expect(request).toHaveBeenCalledExactlyOnceWith(`${LOCAL_QA_BACKEND}/qa/auth/session`, expect.objectContaining({ method: 'OPTIONS' }));
    const init = request.mock.calls[0][1];
    expect(init.body).toBeUndefined();
    expect(Object.keys(init.headers)).not.toContain('Authorization');
    expect(Object.keys(init.headers)).not.toContain('X-QA-Auth-Key');
  });
  it('reports the CORS block or connection failure without inventing a working login', async () => {
    expect((await checkLocalQaCors('http://192.168.50.168:5173', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))).originAllowed).toBe(false);
    expect(await checkLocalQaCors('http://192.168.50.168:5173', vi.fn().mockRejectedValue(new Error('offline'))))
      .toEqual({ reachable: false, httpStatus: null, originAllowed: false });
  });
});
