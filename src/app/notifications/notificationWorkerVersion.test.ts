import { afterEach, expect, it, vi } from 'vitest';
import { checkNotificationWorkerVersion } from './notificationWorkerVersion';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('queries the controlling worker without subscriptions, requests or updates', async () => {
  const worker = { postMessage: vi.fn((message, ports) => {
    expect(message).toEqual({ type: 'ZIPCO_NOTIFICATION_WORKER_VERSION' });
    ports[0].postMessage({ revision: 'ios-click-direct-v3' });
  }) };
  expect(await checkNotificationWorkerVersion(worker)).toBe('ios-click-direct-v3');
  expect(worker.postMessage).toHaveBeenCalledOnce();
});

it('does not mistake an absent or nonresponsive old worker for the published revision', async () => {
  expect(await checkNotificationWorkerVersion(null)).toContain('Sin worker');
  vi.useFakeTimers();
  const pending = checkNotificationWorkerVersion({ postMessage: vi.fn() });
  await vi.advanceTimersByTimeAsync(1500);
  expect(await pending).toContain('Sin respuesta de versión');
});

it('does not expose arbitrary worker replies or throw on a postMessage failure', async () => {
  expect(await checkNotificationWorkerVersion({ postMessage: (_message, ports) => {
    (ports as Transferable[] as MessagePort[])[0].postMessage({ revision: 'https://unexpected.invalid/private' });
  } })).toBe('Respuesta de versión no válida.');
  expect(await checkNotificationWorkerVersion({ postMessage: () => { throw new Error('private'); } })).toBe('No se pudo consultar el worker activo.');
});
