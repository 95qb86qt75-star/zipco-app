import { afterEach, describe, expect, it, vi } from 'vitest';
import { agreementRouteId, agreementPath } from './AgreementRoute';
import { readAgreement } from './requestProcessApi';
import { agreementFixture } from './requestProcessFixtures';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AgreementRoute, { fetchSessionAgreement } from './AgreementRoute';
import { notifyCoordinationSessionChange, readCoordinationSession } from './coordinationSession';
afterEach(() => vi.unstubAllGlobals());
describe('private agreement route', () => {
  it('accepts only the exact relative process route and a safe positive id', () => {
    expect(agreementRouteId(agreementPath(7))).toBe(7);
    for (const path of ['/solicitudes/procesos/0/acuerdo', '/solicitudes/procesos/abc/acuerdo', '/solicitudes/procesos/9007199254740992/acuerdo', 'https://evil.test/solicitudes/procesos/7/acuerdo'])
      expect(agreementRouteId(path)).toBeNull();
  });
  it.each([false, true])('gates direct access on the existing session (authenticated=%s)', (authenticated) => {
    vi.stubGlobal('React', React);
    vi.stubGlobal('window', { location: { pathname: '/solicitudes/procesos/7/acuerdo', search: '?participant=business&volver=historial' } });
    vi.stubGlobal('localStorage', { getItem: () => authenticated ? 'synthetic' : null });
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const html = renderToStaticMarkup(React.createElement(AgreementRoute, { children: React.createElement('p', null, 'Login existente') }));
    expect(html.includes('Login existente')).toBe(!authenticated);
    if (authenticated) { expect(html).toContain('Condiciones aceptadas'); expect(html).toContain('requests-business&amp;view=history'); }
    expect(fetcher).not.toHaveBeenCalled(); // Fetch occurs only in the mounted authorized page effect.
  });
  it('reads using process id, JWT and no-store without requiring a public id in the route', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(agreementFixture)));
    vi.stubGlobal('fetch', fetcher);
    expect(await readAgreement(7, null, 'synthetic')).toEqual(agreementFixture);
    expect(fetcher.mock.calls[0][0]).toContain('/request-processes/7/agreement');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: 'no-store', headers: { Authorization: 'Bearer synthetic' } });
  });
  it.each([401, 403, 404, 500])('shows safe agreement errors for HTTP %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'internal stack' }), { status })));
    await expect(readAgreement(7, null, 'synthetic')).rejects.not.toThrow('internal');
  });
  it.each(['user', 'token', 'abort'])('does not display late agreement conditions after changing %s', async (change) => {
    let user = 'user-a'; let token = 'token-a';
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'zipco-user-id' ? user : key === 'zipco-token' ? token : null });
    notifyCoordinationSessionChange();
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const update = vi.fn(); const controller = new AbortController();
    const pending = fetchSessionAgreement(7, readCoordinationSession()!, controller.signal, update);
    expect(update).toHaveBeenCalledWith({ status: 'loading' });
    if (change === 'user') user = 'user-b';
    if (change === 'token') token = 'token-b';
    if (change === 'abort') controller.abort();
    finish(new Response(JSON.stringify(agreementFixture))); await pending;
    expect(update).toHaveBeenCalledOnce(); // No stale loaded state can return.
  });
  it('does not expire a new account when an older agreement returns 401', async () => {
    const values = new Map([['zipco-user-id', 'user-a'], ['zipco-token', 'token-a']]);
    const remove = vi.fn((key: string) => values.delete(key));
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, removeItem: remove });
    notifyCoordinationSessionChange();
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const update = vi.fn(); const pending = fetchSessionAgreement(7, readCoordinationSession()!, new AbortController().signal, update);
    values.set('zipco-user-id', 'user-b'); values.set('zipco-token', 'token-b');
    finish(new Response('{}', { status: 401 })); await pending;
    expect(remove).not.toHaveBeenCalled(); expect(values.get('zipco-token')).toBe('token-b');
    expect(update).toHaveBeenCalledOnce();
  });
});
