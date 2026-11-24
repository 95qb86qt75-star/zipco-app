import { parseNotificationTarget } from './notificationNavigation';

type Stage = 'APP_TARGET_ACCEPTED' | 'CARD_FOCUSED';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
type Sender = Pick<ServiceWorker, 'postMessage' | 'scriptURL'>;
type Entry = { accepted: boolean; focused: boolean; meta?: { traceId: string; attemptId: string }; sender?: Sender; sent: Set<Stage> };

// Public identifiers only. The receipt stays in Notification.data/the worker.
export function createQaPushObservationAcks(origin: string) {
  const entries = new Map<string, Entry>();
  const entryFor = (value: string) => {
    const target = parseNotificationTarget(value, origin);
    if (!target || !new URL(target.url, origin).searchParams.has('notificationClick')) return null;
    if (!entries.has(target.identity)) entries.set(target.identity, { accepted: false, focused: false, sent: new Set() });
    if (entries.size > 100) entries.delete(entries.keys().next().value!);
    return entries.get(target.identity)!;
  };
  const flush = (entry: Entry) => {
    if (!entry.meta || !entry.sender) return;
    for (const stage of ['APP_TARGET_ACCEPTED', 'CARD_FOCUSED'] as const) {
      if (!(stage === 'CARD_FOCUSED' ? entry.focused : entry.accepted) || entry.sent.has(stage)) continue;
      try {
        entry.sender.postMessage({ type: 'ZIPCO_QA_OBSERVATION_ACK', ...entry.meta, stage });
        entry.sent.add(stage);
      } catch { /* A later delivery may retry the local ACK, never a business action. */ }
    }
  };
  return {
    receive(value: string, meta: unknown, source: unknown) {
      const m = meta as { traceId?: unknown; attemptId?: unknown } | null;
      const sender = source as Sender | null;
      if (!m || !uuid(m.traceId) || !uuid(m.attemptId) || typeof sender?.postMessage !== 'function' || sender.scriptURL !== new URL('/sw.js', origin).href) return;
      const entry = entryFor(value); if (!entry) return;
      // A delivered attempt cannot be rebound to a different receipt identity.
      if (entry.meta && (entry.meta.traceId !== m.traceId || entry.meta.attemptId !== m.attemptId)) return;
      entry.meta = { traceId: m.traceId, attemptId: m.attemptId }; entry.sender = sender; flush(entry);
    },
    accepted(value: string) { const entry = entryFor(value); if (entry) { entry.accepted = true; flush(entry); } },
    focused(value: string) { const entry = entryFor(value); if (entry) { entry.accepted = true; entry.focused = true; flush(entry); } },
    clear() { entries.clear(); },
  };
}
