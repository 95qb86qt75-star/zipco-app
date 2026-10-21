import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createProposalIntents } from './proposalIntent';
import { ProposalError, type ProposalReceipt } from './proposalApi';
import { proposalsFixture } from './proposalFixtures';
import { normalizeRequestProcess } from './requestProcess';
const body = { expectedVersion: 1, proposalId: 123, confirmationAccepted: true as const, totalPriceClp: 3000, message: 'Precio explicado para la prueba' };
const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const receipt: ProposalReceipt = { orderId: 20, orderStatus: 'alternative_proposed', requestProcess: normalizeRequestProcess(proposalsFixture(1).process)! };
const hash = async (s: string) => createHash('sha256').update(s).digest('hex');
function setup() { const rows = new Map<string, string>(); const storage = { getItem: (k: string) => rows.get(k) ?? null, setItem: (k: string, v: string) => { rows.set(k, v); } };
  return { rows, storage, engine: createProposalIntents(storage, () => key, hash) }; }
it('coalesces repeated clicks, retains the key on response loss, and never repeats a confirmed POST', async () => {
  const { engine, rows } = setup(); let finish!: (v: ProposalReceipt) => void;
  const send = vi.fn(() => new Promise<ProposalReceipt>(resolve => { finish = resolve; }));
  const first = engine.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send);
  const second = engine.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send);
  await vi.waitFor(() => expect(send).toHaveBeenCalledOnce()); finish(receipt);
  expect(await first).toEqual(receipt); expect(await second).toEqual(receipt);
  await engine.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send); expect(send).toHaveBeenCalledOnce();
  expect([...rows.values()].join('')).not.toContain(body.message);
});
it('restores the same uncertain key across remount/reload and prevents changed payloads', async () => {
  const { engine, storage } = setup(); const fail = vi.fn(async () => { throw new TypeError('lost response'); });
  await expect(engine.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, fail)).rejects.toThrow('lost response');
  const restored = createProposalIntents(storage, () => { throw new Error('must not regenerate'); }, hash);
  const send = vi.fn(async () => receipt);
  await expect(restored.run('11:business', 7, 'PROPOSE_ALTERNATIVE', { ...body, totalPriceClp: 4000 }, send)).rejects.toThrow('operación sin confirmar');
  await restored.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send); expect(send).toHaveBeenCalledWith(key);
  const confirmed = createProposalIntents(storage, () => key, hash);
  await expect(confirmed.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send)).rejects.toMatchObject({ code: 'ALREADY_CONFIRMED' }); expect(send).toHaveBeenCalledOnce();
});
it('retains an acceptance key for explicit past-schedule consent and isolates actors/processes', async () => {
  const { engine } = setup(); const send = vi.fn().mockRejectedValueOnce(new ProposalError('expired', 409, 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED')).mockResolvedValue(receipt);
  await expect(engine.run('11:customer', 7, 'ACCEPT_PROPOSAL', body, send)).rejects.toThrow('expired');
  await engine.run('11:customer', 7, 'ACCEPT_PROPOSAL', { ...body, acceptPastSchedule: true }, send);
  expect(send.mock.calls.map(call => call[0])).toEqual([key, key]);
});
it('does not send if durable intention storage fails before POST', async () => {
  const engine = createProposalIntents({ getItem: () => null, setItem: () => { throw Error('blocked'); } }, () => key, hash);
  const send = vi.fn(); await expect(engine.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send)).rejects.toThrow('No se pudo proteger'); expect(send).not.toHaveBeenCalled();
});
it.each(['null', '[]', '{"11:business:7":{"key":"broken"}}'])('fails closed on corrupt recovery storage %s', saved => {
  const engine = createProposalIntents({ getItem: () => saved, setItem: vi.fn() }, () => key, hash);
  const send = vi.fn(); return expect(engine.run('11:business', 7, 'PROPOSE_ALTERNATIVE', body, send)).rejects.toThrow('recuperar la operación');
});
