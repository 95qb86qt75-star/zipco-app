import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createProposalIntents } from './proposalIntent';
import { ProposalError, type ProposalReceipt } from './proposalApi';
import { proposalsFixture } from './proposalFixtures';
import { normalizeRequestProcess } from './requestProcess';
import { lateProcess } from './lateInitialFixtures';
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
  await expect(restored.run('11:business', 7, 'PROPOSE_ALTERNATIVE', { ...body, totalPriceClp: 4000 }, send)).rejects.toMatchObject({code:'CHECK_PROPOSAL_REQUIRED'});
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

it('recovers a retained late alternative only after a matching authorized read and waits for explicit send', async () => {
  const {storage}=setup(),p=lateProcess('STILL_NEEDED'),scope='11:business';let serial=0;
  const uuid=()=>serial++===0?key:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const engine=createProposalIntents(storage,uuid,hash),draft={...body,expectedVersion:p.version,proposalId:p.currentProposalId};
  await expect(engine.run(scope,p.id,'PROPOSE_ALTERNATIVE',draft,async()=>{throw new TypeError('lost');})).rejects.toThrow('lost');
  const restored=createProposalIntents(storage,uuid,hash),send=vi.fn(async()=>receipt),edited={...draft,message:'Nueva hora acordada para revisar'};
  await expect(restored.run(scope,p.id,'PROPOSE_ALTERNATIVE',edited,send)).rejects.toMatchObject({code:'CHECK_PROPOSAL_REQUIRED'});
  expect(restored.recoverLateAlternative(scope,p.id,p)).toBe(true);expect(send).not.toHaveBeenCalled();
  await restored.run(scope,p.id,'PROPOSE_ALTERNATIVE',edited,send);expect(send).toHaveBeenCalledWith('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
});

it.each([
  {version:999}, {currentProposalId:999}, {id:999}, {flowContract:'AVAILABILITY_V2'}, {state:'CLOSED'},
  {agreementPublicId:'existing'}, {allowedActions:[]}, {lateInitialResponse:undefined},
  {lateInitialResponse:lateProcess('AWAITING_CUSTOMER').lateInitialResponse},
])('does not release a retained intent when the read is incompatible: %j', async patch => {
  const {engine}=setup(),p=lateProcess('STILL_NEEDED'),draft={...body,expectedVersion:p.version,proposalId:p.currentProposalId};
  await expect(engine.run('11:business',p.id,'PROPOSE_ALTERNATIVE',draft,async()=>{throw new TypeError('lost');})).rejects.toThrow();
  expect(engine.recoverLateAlternative('11:business',p.id,{...p,...patch} as typeof p)).toBe(false);
  await expect(engine.run('11:business',p.id,'PROPOSE_ALTERNATIVE',{...draft,totalPriceClp:999},vi.fn())).rejects.toMatchObject({code:'CHECK_PROPOSAL_REQUIRED'});
});

it('does not release running or confirmed proposals, or another actor intention', async () => {
  const {engine}=setup(),p=lateProcess('STILL_NEEDED'),draft={...body,expectedVersion:p.version,proposalId:p.currentProposalId};let finish!:(v:ProposalReceipt)=>void;
  const running=engine.run('11:business',p.id,'PROPOSE_ALTERNATIVE',draft,()=>new Promise(r=>{finish=r;}));
  await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));
  expect(engine.recoverLateAlternative('11:business',p.id,p)).toBe(false);
  expect(engine.recoverLateAlternative('11:customer',p.id,p)).toBe(false);
  finish(receipt);await running;expect(engine.recoverLateAlternative('11:business',p.id,p)).toBe(false);
});

it.each([false,true])('keeps prior uncertainty even if a later retry receives 400; restored=%s', async restored => {
  const {engine,storage}=setup();
  await expect(engine.run('11:business',7,'PROPOSE_ALTERNATIVE',body,async()=>{throw new TypeError('lost');})).rejects.toThrow();
  const current=restored?createProposalIntents(storage,()=>key,hash):engine;
  await expect(current.run('11:business',7,'PROPOSE_ALTERNATIVE',body,async()=>{throw new ProposalError('validation',400);})).rejects.toThrow('validation');
  await expect(current.run('11:business',7,'PROPOSE_ALTERNATIVE',{...body,totalPriceClp:999},vi.fn())).rejects.toMatchObject({code:'CHECK_PROPOSAL_REQUIRED'});
});
