import { createClickTraceStore, sanitizeClickTrace, CLICK_TRACE_LIMIT } from './qaNotificationClickTraceStore.js';
import { readNotificationWorkerIdentity } from './notificationWorkerVersion';
import { parseNotificationTarget } from './notificationNavigation';

const build = import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION;
const app = createClickTraceStore('app', build, window.location.origin, globalThis.caches);
export const recordClickTrace = (stage: string, flags: Record<string, boolean> = {}, correlationId?: string) => { void app.record(stage, {...flags,...(correlationId?{correlationId}:{})}); };

async function workerRequest(type: string, worker = navigator.serviceWorker?.controller): Promise<any> {
  if (!worker) return null;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (value: unknown) => { clearTimeout(timer); channel.port1.close(); channel.port2.close(); resolve(value); };
    const timer = setTimeout(() => finish(null), 1500);
    channel.port1.onmessage = (event) => finish(event.data);
    try { worker.postMessage({ type }, [channel.port2]); } catch { finish(null); }
  });
}

export function startClickTrace() {
  const probe = () => {
    void readNotificationWorkerIdentity().then((identity) => recordClickTrace('worker-probe', {
      hasController: !!navigator.serviceWorker?.controller,
      revisionMatches: identity.revision === 'notification-click-attempt-v9', buildMatches: identity.build === build,
    }));
  };
  const flags = () => ({ hasTarget: !!parseNotificationTarget(window.location.href, window.location.origin),
    hasSession: !!(localStorage.getItem('zipco-token') && localStorage.getItem('zipco-user-id')),
    visible: document.visibilityState === 'visible', hasController: !!navigator.serviceWorker?.controller });
  const resume = () => { recordClickTrace('app-resume', flags()); if (document.visibilityState === 'visible') probe(); };
  const controller = () => { recordClickTrace('controller-change', flags()); probe(); };
  recordClickTrace('app-start', flags()); probe();
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  navigator.serviceWorker?.addEventListener('controllerchange', controller);
  return () => {
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('pageshow', resume);
    navigator.serviceWorker?.removeEventListener('controllerchange', controller);
  };
}

export async function readClickTrace() {
  const registration = await navigator.serviceWorker?.getRegistration?.().catch(() => undefined);
  const [page, worker, controllingWorker, activeWorker] = await Promise.all([
    app.read(), workerRequest('ZIPCO_QA_CLICK_TRACE_READ'), readNotificationWorkerIdentity(),
    readNotificationWorkerIdentity(registration?.active ?? null),
  ]);
  const workerEntries = Array.isArray(worker?.entries) ? worker.entries.map(sanitizeClickTrace).filter(Boolean).slice(-CLICK_TRACE_LIMIT) : [];
  return { frontendVersion: build, controllingWorker, activeWorker,
    pageStorageAvailable: page.storageAvailable, workerTraceAvailable: Array.isArray(worker?.entries),
    workerStorageAvailable: typeof worker?.storageAvailable === 'boolean' ? worker.storageAvailable : null,
    entries: [...page.entries, ...workerEntries].sort((a, b) => a.at - b.at) };
}

export async function clearClickTrace() {
  const [page, worker] = await Promise.all([app.clear(), workerRequest('ZIPCO_QA_CLICK_TRACE_CLEAR')]);
  return page && worker?.cleared === true;
}
