import { it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTiming } from './timing.mjs';

it('records successful and failed phases without swallowing the failure', async () => {
  const timer = createTiming('tooling');
  assert.equal(await timer.measure('success', async () => 7), 7);
  await assert.rejects(timer.measure('failure', async () => { throw Error('expected'); }), /expected/);
  assert.deepEqual(timer.report().phases.map(p => p.name), ['success', 'failure']);
  assert(timer.report().phases.every(p => p.seconds >= 0));
});

it('keeps a per-run timing file alongside the latest report', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zipco-qa-timing-'));
  try {
    const report = createTiming('tooling').save(path.join(directory, 'timing.json'));
    const archived = fs.readdirSync(directory).filter(f => /^timing-\d+\.json$/.test(f));
    assert.equal(archived.length, 1);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, archived[0]), 'utf8')), report);
  } finally {
    for (const file of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, file));
    fs.rmdirSync(directory);
  }
});
