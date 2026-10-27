import { expect, it, vi } from 'vitest';
import { createClickTraceStore, sanitizeClickTrace, CLICK_TRACE_LIMIT, CLICK_TRACE_TTL } from './qaNotificationClickTraceStore.js';

const build = 'a'.repeat(40), origin = 'https://zipco.test';
it('retains only a random QA correlation UUID, not a semantic order key',()=>{
  const base={at:Date.now(),source:'worker',stage:'system-shown',build};
  expect(sanitizeClickTrace({...base,correlationId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}).correlationId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  expect(sanitizeClickTrace({...base,correlationId:'order-91-availability-17'})).not.toHaveProperty('correlationId');
});
function cache() {
  const rows = new Map<string, Response>();
  return { open: async () => ({ match: async (key: string) => rows.get(key)?.clone(),
    put: async (key: string, value: Response) => { rows.set(key, value.clone()); },
    delete: async (key: string) => rows.delete(key),
    keys: async () => [...rows.keys()].map((key) => new Request(key)) }) };
}

it('retains only whitelisted stages, versions and booleans, dropping all payload fields', () => {
  const row = sanitizeClickTrace({ at: Date.now(), source: 'app', stage: 'app-target-received', build,
    hasTarget: true, url: '/?orderId=123', eventKey: 'order-123-accepted', phone: 'private', token: 'private',
    headers: { Authorization: 'private' }, body: 'private', exception: new Error('private'), hasSession: 'private' });
  expect(Object.keys(row).sort()).toEqual(['at', 'build', 'hasTarget', 'source', 'stage']);
  expect(JSON.stringify(row)).not.toContain('private');
  expect(sanitizeClickTrace({ ...row, stage: 'private' })).toBeNull();
  expect(sanitizeClickTrace({ ...row, at: Date.now() - CLICK_TRACE_TTL - 1 })).toBeNull();
  expect(sanitizeClickTrace({ ...row, at: Date.now() + 10000 })).toBeNull();
});

it('limits each actor to 50 entries, survives a worker restart, and clears only diagnostic data', async () => {
  const storage = cache();
  const worker = createClickTraceStore('worker', build, origin, storage);
  const app = createClickTraceStore('app', build, origin, storage);
  for (let i = 0; i < CLICK_TRACE_LIMIT + 3; i++) await worker.record('click-received', { hasTarget: true });
  await app.record('app-start');
  const restarted = createClickTraceStore('worker', build, origin, storage);
  expect((await restarted.read()).entries).toHaveLength(CLICK_TRACE_LIMIT);
  await restarted.clear();
  expect((await restarted.read()).entries).toHaveLength(0);
  expect((await app.read()).entries).toHaveLength(1);
});

it('degrades to bounded memory without propagating Cache API failures or sending requests', async () => {
  const storage = { open: vi.fn(async () => { throw new Error('private'); }) };
  const trace = createClickTraceStore('worker', build, origin, storage);
  await expect(trace.record('target-save-failed')).resolves.toBeUndefined();
  const report = await trace.read();
  expect(report.storageAvailable).toBe(false);
  expect(report.entries).toHaveLength(1);
  expect(JSON.stringify(report)).not.toContain('private');
});

it('returns memory evidence within the diagnostic deadline if Cache API never settles', async () => {
  vi.useFakeTimers();
  try {
    const trace = createClickTraceStore('worker', build, origin, { open: () => new Promise(() => {}) });
    void trace.record('click-received', { hasTarget: true });
    const result = trace.read();
    await vi.advanceTimersByTimeAsync(1200);
    expect(await result).toMatchObject({ storageAvailable: false, entries: [{ stage: 'click-received', hasTarget: true }] });
  } finally { vi.useRealTimers(); }
});

it('coalesces repetitive recovery reads without dropping repeated notification clicks', async () => {
  const trace = createClickTraceStore('worker', build, origin, cache());
  for (let i = 0; i < 80; i++) await trace.record('worker-target-request', { hasTarget: false });
  await trace.record('click-received'); await trace.record('click-received');
  expect((await trace.read()).entries.map((row) => row.stage)).toEqual(['worker-target-request', 'click-received', 'click-received']);
});

it('preserves concurrent records from separate worker instances in shared storage', async () => {
  const storage = cache();
  const background = createClickTraceStore('worker', build, origin, storage);
  const resumed = createClickTraceStore('worker', build, origin, storage);
  await Promise.all([
    background.record('push-received'), resumed.record('worker-target-request', { hasTarget: false }),
  ]);
  const restarted = createClickTraceStore('worker', build, origin, storage);
  expect((await restarted.read()).entries.map((row) => row.stage).sort()).toEqual(['push-received', 'worker-target-request']);
  const firstContext = (await background.read()).entries;
  expect(firstContext.find((row) => row.stage === 'push-received').currentContext).toBe(true);
  expect(firstContext.find((row) => row.stage === 'worker-target-request').currentContext).toBe(false);
  expect(JSON.stringify(firstContext)).not.toMatch(/__zipco|instance|https:/);
});

it('does not restore expired in-memory records when merging persisted evidence', async () => {
  vi.useFakeTimers();
  try {
    const trace = createClickTraceStore('worker', build, origin, cache());
    await trace.record('click-received');
    vi.setSystemTime(Date.now() + CLICK_TRACE_TTL + 1);
    expect((await trace.read()).entries).toHaveLength(0);
  } finally { vi.useRealTimers(); }
});
