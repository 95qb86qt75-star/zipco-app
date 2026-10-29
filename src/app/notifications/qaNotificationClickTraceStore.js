// Shared by the QA page and a QA-only classic worker import. No payload logging.
export const CLICK_TRACE_CACHE = 'zipco-qa-click-trace-v2';
export const CLICK_TRACE_LIMIT = 50;
export const CLICK_TRACE_TTL = 60 * 60 * 1000;
export const CLICK_TRACE_STAGES = new Set([
  'push-received', 'system-shown', 'click-entered', 'click-received', 'target-normalized',
  'launch-requested', 'launch-returned', 'launch-failed', 'windows-found',
  'navigation-posted', 'target-saved', 'target-save-failed', 'worker-target-request',
  'worker-target-sent', 'ack-received', 'ack-consumed', 'ack-mismatch',
  'app-start', 'app-resume', 'app-route', 'controller-change', 'worker-probe',
  'app-system-presented', 'app-worker-target', 'app-target-received',
  'app-target-accepted', 'app-target-ignored', 'app-target-ack',
  'app-cache-start', 'app-cache-read', 'app-cache-failed', 'screen-mounted', 'screen-target', 'card-focused',
  'notice-suppressed', 'notice-delivered', 'toast-click',
  'push-failed', 'click-failed', 'worker-message-failed',
]);
const flagKeys = ['hasTarget', 'hasEvent', 'hasSession', 'visible', 'hasClient',
  'hasCard', 'loading', 'hasError', 'hasController', 'revisionMatches', 'buildMatches', 'requestsVisible', 'sessionReady', 'currentContext'];
const repeatedReadStages = new Set(['app-cache-start', 'app-cache-read', 'worker-target-request',
  'worker-target-sent', 'worker-probe', 'app-target-ignored', 'app-worker-target']);

export function sanitizeClickTrace(row) {
  if (!row || !CLICK_TRACE_STAGES.has(row.stage) || !['app', 'worker'].includes(row.source) ||
      !Number.isFinite(row.at) || row.at > Date.now() || Date.now() - row.at > CLICK_TRACE_TTL) return null;
  const safe = { at: row.at, source: row.source, stage: row.stage,
    build: /^[a-f0-9]{40}(-local)?$/.test(row.build || '') ? row.build : 'unknown' };
  if(typeof row.correlationId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(row.correlationId))safe.correlationId=row.correlationId;
  for (const key of flagKeys) if (typeof row[key] === 'boolean') safe[key] = row[key];
  return safe;
}

export function createClickTraceStore(source, build, origin, cacheStorage) {
  let memory = [];
  let writes = Promise.resolve();
  const prefix = `${origin}/__zipco_qa_click_trace__/${source}/`;
  // Diagnostic-only storage nonce, never a user/order identifier or report field.
  const instance = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}-${Date.now()}`;
  let sequence = 0;
  const rows = (value) => (Array.isArray(value) ? value : []).map(sanitizeClickTrace).filter(Boolean).slice(-CLICK_TRACE_LIMIT);
  const records = async (cache) => {
    const keys = (await cache.keys()).map((request) => request.url).filter((key) => key.startsWith(prefix));
    return Promise.all(keys.map(async (key) => {
      try {
        const response = await cache.match(key);
        const entry = sanitizeClickTrace(response ? await response.json() : null);
        return { key, entry: entry?.source === source ? entry : null };
      } catch { return { key, entry: null }; }
    }));
  };
  const latest = (items) => [...new Map(items.map((item) => [item.key, item])).values()]
    .map((item) => ({ ...item, entry: sanitizeClickTrace(item.entry) }))
    .filter((item) => item.entry).sort((a, b) => a.entry.at - b.entry.at).slice(-CLICK_TRACE_LIMIT);
  const memoryRows = () => rows(memory.map((item) => item.entry));
  const bounded = async (work, fallback) => {
    let timer;
    try {
      return await Promise.race([work, new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback()), 1200);
      })]);
    } finally { clearTimeout(timer); }
  };
  const read = async () => {
    const fallback = () => ({ entries: memoryRows().map((entry) => ({ ...entry, currentContext: true })), storageAvailable: false });
    return bounded((async () => {
      await writes;
      try {
        const cache = await cacheStorage.open(CLICK_TRACE_CACHE);
        const stored = await records(cache);
        return { entries: latest([...stored, ...memory]).map((item) => ({ ...item.entry,
          currentContext: item.key.startsWith(`${prefix}${instance}-`) })), storageAvailable: true };
      } catch { return fallback(); }
    })(), fallback);
  };
  return {
    build,
    record(stage, flags = {}) {
      const entry = sanitizeClickTrace({ ...flags, at: Date.now(), source, stage, build });
      if (!entry) return Promise.resolve();
      const last = memoryRows().slice().reverse().find((row) => row.stage === stage);
      if (repeatedReadStages.has(stage) && last && entry.at - last.at < 10000 &&
          flagKeys.every((flag) => last[flag] === entry[flag])) return Promise.resolve();
      const item = { key: `${prefix}${instance}-${++sequence}`, entry };
      memory = latest([...memory, item]);
      writes = writes.catch(() => {}).then(async () => {
        try {
          const cache = await cacheStorage.open(CLICK_TRACE_CACHE);
          // Each row has its own key: independent worker lifetimes cannot
          // overwrite one another's read-modify-write snapshot.
          await cache.put(item.key, new Response(JSON.stringify(entry), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }));
          const stored = await records(cache);
          const keep = new Set(latest(stored).map((record) => record.key));
          await Promise.all(stored.filter((record) => !keep.has(record.key)).map((record) => cache.delete(record.key)));
        } catch { /* Memory fallback; diagnostics never fail navigation. */ }
      });
      return writes;
    },
    read,
    flush: () => writes,
    async clear() {
      memory = [];
      return bounded((async () => {
        await writes;
        try {
          const cache = await cacheStorage.open(CLICK_TRACE_CACHE);
          const stored = await records(cache);
          await Promise.all(stored.map((record) => cache.delete(record.key)));
          return true;
        }
        catch { return false; }
      })(), () => false);
    },
  };
}
