// Shared by the QA page and a QA-only classic worker import. No payload logging.
export const CLICK_TRACE_CACHE = 'zipco-qa-click-trace-v1';
export const CLICK_TRACE_LIMIT = 50;
export const CLICK_TRACE_TTL = 60 * 60 * 1000;
export const CLICK_TRACE_STAGES = new Set([
  'push-received', 'system-shown', 'click-received', 'target-normalized',
  'launch-requested', 'launch-returned', 'launch-failed', 'windows-found',
  'navigation-posted', 'target-saved', 'target-save-failed', 'worker-target-request',
  'worker-target-sent', 'ack-received', 'ack-consumed', 'ack-mismatch',
  'app-start', 'app-resume', 'app-route', 'controller-change', 'worker-probe',
  'app-system-presented', 'app-worker-target', 'app-target-received',
  'app-target-accepted', 'app-target-ignored', 'app-target-ack',
  'app-cache-start', 'app-cache-read', 'app-cache-failed', 'screen-mounted', 'screen-target', 'card-focused',
  'notice-suppressed', 'notice-delivered',
]);
const flagKeys = ['hasTarget', 'hasEvent', 'hasSession', 'visible', 'hasClient',
  'hasCard', 'loading', 'hasError', 'hasController', 'revisionMatches', 'buildMatches', 'requestsVisible', 'sessionReady'];
const repeatedReadStages = new Set(['app-cache-start', 'app-cache-read', 'worker-target-request',
  'worker-target-sent', 'worker-probe', 'app-target-ignored', 'app-worker-target']);

export function sanitizeClickTrace(row) {
  if (!row || !CLICK_TRACE_STAGES.has(row.stage) || !['app', 'worker'].includes(row.source) ||
      !Number.isFinite(row.at) || row.at > Date.now() || Date.now() - row.at > CLICK_TRACE_TTL) return null;
  const safe = { at: row.at, source: row.source, stage: row.stage,
    build: /^[a-f0-9]{40}(-local)?$/.test(row.build || '') ? row.build : 'unknown' };
  for (const key of flagKeys) if (typeof row[key] === 'boolean') safe[key] = row[key];
  return safe;
}

export function createClickTraceStore(source, build, origin, cacheStorage) {
  let memory = [];
  let writes = Promise.resolve();
  const key = `${origin}/__zipco_qa_click_trace__/${source}`;
  const rows = (value) => (Array.isArray(value) ? value : []).map(sanitizeClickTrace).filter(Boolean).slice(-CLICK_TRACE_LIMIT);
  const bounded = async (work, fallback) => {
    let timer;
    try {
      return await Promise.race([work, new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback()), 1200);
      })]);
    } finally { clearTimeout(timer); }
  };
  const read = async () => {
    const fallback = () => ({ entries: rows(memory), storageAvailable: false });
    return bounded((async () => {
      await writes;
      try {
        const cache = await cacheStorage.open(CLICK_TRACE_CACHE);
        const response = await cache.match(key);
        return { entries: rows(response ? await response.json() : memory), storageAvailable: true };
      } catch { return fallback(); }
    })(), fallback);
  };
  return {
    build,
    record(stage, flags = {}) {
      const entry = sanitizeClickTrace({ ...flags, at: Date.now(), source, stage, build });
      if (!entry) return Promise.resolve();
      const last = memory.slice().reverse().find((row) => row.stage === stage);
      if (repeatedReadStages.has(stage) && last && entry.at - last.at < 10000 &&
          flagKeys.every((flag) => last[flag] === entry[flag])) return Promise.resolve();
      memory = rows([...memory, entry]);
      writes = writes.catch(() => {}).then(async () => {
        try {
          const cache = await cacheStorage.open(CLICK_TRACE_CACHE);
          const response = await cache.match(key);
          const entries = rows([...rows(response ? await response.json() : []), entry]);
          await cache.put(key, new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }));
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
        try { const cache = await cacheStorage.open(CLICK_TRACE_CACHE); await cache.delete(key); return true; }
        catch { return false; }
      })(), () => false);
    },
  };
}
