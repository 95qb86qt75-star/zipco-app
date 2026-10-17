import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { qaLoadDiagnosticsEnabled } from '../../../../scripts/qa-load-diagnostics-config.mjs';
import { clearDiagnostics, diagnoseLoadOrdersRead, diagnosticSnapshot, diagnosticText, subscribeDiagnostics } from './loadOrdersDiagnostics';

beforeEach(() => { clearDiagnostics(); vi.stubEnv('QA_LOAD_DIAGNOSTICS_VERSION', 'test-build-local'); });
afterEach(() => vi.unstubAllEnvs());
const consume = async (response: Response) => {
  if (!response.ok) throw new Error('private backend error');
  return response.json();
};
const settle = () => vi.waitFor(() => expect(diagnosticSnapshot()).toHaveLength(1));

describe('QA diagnostic build gate', () => {
  it.each(['production', 'development', 'test'])('is absent in %s even with opt-in', (mode) => {
    expect(qaLoadDiagnosticsEnabled(mode, { ZIPCO_QA_LOAD_DIAGNOSTICS: '1' })).toBe(false);
  });
  it('defaults off and requires explicit QA opt-in', () => {
    expect(qaLoadDiagnosticsEnabled('qa', {})).toBe(false);
    expect(qaLoadDiagnosticsEnabled('qa', { ZIPCO_QA_LOAD_DIAGNOSTICS: 'true' })).toBe(false);
    expect(qaLoadDiagnosticsEnabled('qa', { ZIPCO_QA_LOAD_DIAGNOSTICS: '1' })).toBe(true);
  });
  it('refuses production deployments and other preview branches even in QA mode', () => {
    const env = { ZIPCO_QA_LOAD_DIAGNOSTICS: '1', VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'qa' };
    expect(qaLoadDiagnosticsEnabled('qa', env)).toBe(true);
    expect(qaLoadDiagnosticsEnabled('qa', { ...env, VERCEL_ENV: 'production' })).toBe(false);
    expect(qaLoadDiagnosticsEnabled('qa', { ...env, VERCEL_GIT_COMMIT_REF: 'main' })).toBe(false);
  });
});

describe('sanitized read failures only', () => {
  it.each([400, 401, 403, 404, 409, 500])('records HTTP %s without exposing other response fields', async (status) => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'STALE_VERSION',
      message: 'private message', phone: 'private phone', url: 'private URL', token: 'private token' }), { status }));
    await expect(diagnoseLoadOrdersRead('loadOrders.business', request, consume)).rejects.toThrow('private backend error');
    await settle(); expect(request).toHaveBeenCalledOnce();
    expect(diagnosticSnapshot()[0]).toEqual({ operation: 'loadOrders.business', method: 'GET',
      route: '/orders/business/:businessId', httpStatus: status, publicCode: 'STALE_VERSION', frontendVersion: 'test-build-local' });
    expect(diagnosticText()).not.toContain('private');
  });
  it.each(['', '<html>private</html>', JSON.stringify({ code: ['private'] }), JSON.stringify({ code: 'private-new-code' })])
    ('ignores unknown or unreadable error bodies (%s)', async (body) => {
      await expect(diagnoseLoadOrdersRead('loadOrders.customer', async () => new Response(body, { status: 500 }), consume)).rejects.toThrow();
      await settle(); expect(diagnosticSnapshot()[0].publicCode).toBeNull();
    });
  it('keeps network exceptions unchanged, without copying messages or retrying', async () => {
    const error = new Error('secret URL and token'); const request = vi.fn().mockRejectedValue(error);
    await expect(diagnoseLoadOrdersRead('loadOrders.businessName', request, consume)).rejects.toBe(error);
    expect(request).toHaveBeenCalledOnce();
    expect(diagnosticSnapshot()[0]).toMatchObject({ route: '/businesses/:id', httpStatus: null, publicCode: null });
    expect(diagnosticText()).not.toContain('secret');
  });
  it('records invalid success JSON with its actual HTTP status', async () => {
    await expect(diagnoseLoadOrdersRead('loadOrders.customer', async () => new Response('<html>private</html>'), consume)).rejects.toThrow();
    expect(diagnosticSnapshot()[0]).toMatchObject({ httpStatus: 200, publicCode: null });
  });
  it('does not record successful reads or change the response body', async () => {
    const response = new Response(JSON.stringify({ id: 12 }));
    expect(await diagnoseLoadOrdersRead('loadOrders.customer', async () => response, consume)).toEqual({ id: 12 });
    expect(diagnosticSnapshot()).toEqual([]);
  });
  it('records nonfatal business name failures while preserving the empty-name fallback', async () => {
    const value = await diagnoseLoadOrdersRead('loadOrders.businessName', async () => new Response('', { status: 404 }), async () => '');
    expect(value).toBe(''); await settle(); expect(diagnosticSnapshot()[0].httpStatus).toBe(404);
  });
  it('limits history to twenty in-memory entries and isolates subscriber failures', async () => {
    const unsubscribe = subscribeDiagnostics(() => { throw new Error('subscriber failure'); });
    for (let i = 0; i < 25; i++) {
      await expect(diagnoseLoadOrdersRead('loadOrders.customer', async () => { throw new Error(); }, consume)).rejects.toThrow();
    }
    expect(diagnosticSnapshot()).toHaveLength(20);
    expect(Object.keys(diagnosticSnapshot()[0]).sort()).toEqual(['operation', 'method', 'route', 'httpStatus', 'publicCode', 'frontendVersion'].sort());
    clearDiagnostics(); expect(diagnosticSnapshot()).toEqual([]); unsubscribe();
  });
});
