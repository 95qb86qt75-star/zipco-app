import { createClickTraceStore, sanitizeClickTrace, CLICK_TRACE_LIMIT, CLICK_TRACE_CONTEXT_LIMIT, CLICK_TRACE_TTL } from './qaNotificationClickTraceStore.js';
import { readNotificationWorkerIdentity } from './notificationWorkerVersion';
import { parseNotificationTarget } from './notificationNavigation';
import { flushNotificationClickTrace } from './notificationClickTraceQueue';
import { readRegistrationInventory } from './qaNotificationInventory';

const build = import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION;
const app = createClickTraceStore('app', build, window.location.origin, globalThis.caches);
export const recordClickTrace = (stage: string, flags: Record<string, boolean> = {}, correlationId?: string) => app.record(stage, {...flags,...(correlationId?{correlationId}:{})});

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
      revisionMatches: identity.revision === 'notification-click-attempt-v11', buildMatches: identity.build === build,
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
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  const pageFlushCompleted = await Promise.race([
    Promise.all([flushNotificationClickTrace(), app.flush()]).then(() => true),
    new Promise<boolean>(resolve => { flushTimer = setTimeout(() => resolve(false),1200); }),
  ]).finally(() => clearTimeout(flushTimer));
  const registration = await navigator.serviceWorker?.getRegistration?.().catch(() => undefined);
  const enumerated = await navigator.serviceWorker?.getRegistrations?.().catch(() => null);
  const registrations = enumerated ?? (registration ? [registration] : []);
  const controller = navigator.serviceWorker?.controller ?? null;
  const [page, worker, controllingWorker, activeWorker, registrationReports] = await Promise.all([
    app.read(), workerRequest('ZIPCO_QA_CLICK_TRACE_READ'), readNotificationWorkerIdentity(),
    readNotificationWorkerIdentity(registration?.active ?? null),
    Promise.all(registrations.slice(0,8).map(async (item, index) => {
      const [inventory, identity, stored] = await Promise.all([
        readRegistrationInventory(item, window.location.origin, controller),
        readNotificationWorkerIdentity(item.active),
        item.active === controller ? Promise.resolve(null) : workerRequest('ZIPCO_QA_CLICK_TRACE_READ', item.active),
      ]);
      return { registrationIndex: index + 1, ...inventory, worker: identity,
        traceReadFromController: item.active === controller,
        additionalWorkerEntries: Array.isArray(stored?.entries) ? stored.entries.map(sanitizeClickTrace).filter(Boolean).slice(-CLICK_TRACE_LIMIT) : [] };
    })),
  ]);
  const workerEntries = Array.isArray(worker?.entries) ? worker.entries.map(sanitizeClickTrace).filter(Boolean).slice(-CLICK_TRACE_LIMIT) : [];
  return { frontendVersion: build, copiedAt: Date.now(), pageFlushCompleted, controllingWorker, activeWorker,
    localRetention: { policy: 'causal-first-v1', maxEntriesPerSource: CLICK_TRACE_LIMIT,
      maxContextEntriesPerSource: CLICK_TRACE_CONTEXT_LIMIT, ttlMs: CLICK_TRACE_TTL,
      controllerPolicyConfirmed: worker?.retentionPolicy === 'causal-first-v1', missingStagesAreInconclusive: true },
    pageContext: { standalone: (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true,
      expectedQaAlias: window.location.hostname === 'zipco-app-git-qa-zipco-s-projects.vercel.app' },
    registrationEnumerationAvailable: !!enumerated, registrationCount: registrations.length, registrationReports,
    pageStorageAvailable: page.storageAvailable, workerTraceAvailable: Array.isArray(worker?.entries),
    workerStorageAvailable: typeof worker?.storageAvailable === 'boolean' ? worker.storageAvailable : null,
    entries: [...page.entries, ...workerEntries].sort((a, b) => a.at - b.at) };
}

export async function clearClickTrace() {
  const [page, worker] = await Promise.all([app.clear(), workerRequest('ZIPCO_QA_CLICK_TRACE_CLEAR')]);
  return page && worker?.cleared === true;
}
