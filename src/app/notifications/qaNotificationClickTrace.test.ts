import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

it('distinguishes the controller and registration active builds, and copies only sanitized worker evidence', async () => {
  const pageBuild = 'a'.repeat(40), oldBuild = 'b'.repeat(40);
  vi.stubEnv('QA_LOAD_DIAGNOSTICS_VERSION', pageBuild);
  const fakeWorker = (build: string) => ({ postMessage: (message: any, ports: MessagePort[]) => {
    ports[0].postMessage(message.type === 'ZIPCO_NOTIFICATION_WORKER_VERSION'
      ? { revision: 'ios-click-trace-v4', build, traceEnabled: true }
      : { storageAvailable: true, entries: [{ at: Date.now(), source: 'worker', stage: 'click-received', build,
        hasTarget: true, orderId: 99, url: '/?orderId=99', token: 'private' }] });
  } });
  vi.stubGlobal('navigator', { serviceWorker: { controller: fakeWorker(oldBuild),
    getRegistration: async () => ({ active: fakeWorker(pageBuild) }) } });
  vi.stubGlobal('window', { location: new URL('https://zipco.test/') });
  vi.stubGlobal('caches', { open: async () => ({ match: async () => undefined }) });
  const { readClickTrace } = await import('./qaNotificationClickTrace');
  const result = await readClickTrace();
  expect(result.frontendVersion).toBe(pageBuild);
  expect(result.controllingWorker.build).toBe(oldBuild);
  expect(result.activeWorker.build).toBe(pageBuild);
  expect(result.entries).toHaveLength(1);
  expect(result.entries[0].stage).toBe('click-received');
  expect(JSON.stringify(result)).not.toMatch(/private|orderId|token/);
});
