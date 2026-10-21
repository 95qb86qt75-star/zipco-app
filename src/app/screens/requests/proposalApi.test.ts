import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readProposals, sendProposalAction, uploadProposalPhoto, ProposalError } from './proposalApi';
import { normalizeRequestProcess } from './requestProcess';
import { PROPOSAL_PATHS, type ProposalAction } from './proposalContract';
import { proposalsFixture } from './proposalFixtures';
const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const body = { expectedVersion: 2, proposalId: 124, confirmationAccepted: true as const };
const respond = (payload: unknown, status = 200) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), { status })));
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.stubGlobal('localStorage', { getItem: () => null }));
it('reads authorized detailed versions on demand without placing text in list URLs', async () => {
  respond(proposalsFixture(1, false));
  const read = await readProposals(7, 'synthetic-token');
  expect(read.process).toEqual(normalizeRequestProcess(proposalsFixture(1, false).process));
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/request-processes/7/proposals'), expect.objectContaining({ cache: 'no-store' }));
});
it.each(Object.keys(PROPOSAL_PATHS) as ProposalAction[])('sends exact confirmation and idempotency for %s', async action => {
  const accepts = action.startsWith('ACCEPT_'), rejects = action.startsWith('REJECT_');
  const state = accepts ? 'COORDINATION_PENDING' : rejects ? 'CLOSED' : action === 'PROPOSE_ALTERNATIVE' ? 'AWAITING_CUSTOMER_DECISION' : action === 'COUNTER_PROPOSAL' ? 'AWAITING_BUSINESS_COUNTER_RESPONSE' : 'AWAITING_CUSTOMER_FINAL_DECISION';
  const p = { ...proposalsFixture(1).process, state, version: accepts ? 4 : 3, currentProposalId: accepts || rejects ? 124 : 125,
    agreementPublicId: accepts ? 'agreement' : null, allowedActions: [], ...(rejects ? { closure: {
      reasonCode: action === 'REJECT_PROPOSAL' ? 'CUSTOMER_REJECTED_PROPOSAL' : 'BUSINESS_REJECTED_COUNTER_PROPOSAL',
      reasonDetail: null, actor: action === 'REJECT_PROPOSAL' ? 'CUSTOMER' : 'BUSINESS', actorUserId: 11, closedAt: '2026-10-20T12:00:00Z' } } : {}) };
  const receipt = { orderId: 20, orderStatus: accepts ? 'accepted' : rejects ? 'rejected' : 'alternative_proposed', requestProcess: p };
  respond(receipt);
  await expect(sendProposalAction(7, 20, action, body, 'synthetic-token', key)).resolves.toMatchObject(receipt);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/request-processes/7/actions/${PROPOSAL_PATHS[action]}`), expect.objectContaining({
    method: 'POST', body: JSON.stringify(body), headers: expect.objectContaining({ 'Idempotency-Key': key }) }));
});
it('does not interpret invalid receipt or a failed GET as confirmation', async () => {
  respond({ orderId: 99, orderStatus: 'accepted', requestProcess: proposalsFixture(1).process });
  await expect(sendProposalAction(7, 20, 'ACCEPT_PROPOSAL', body, 'synthetic-token', key)).rejects.toMatchObject({ status: 502 });
  respond({}, 403); await expect(readProposals(7, 'synthetic-token')).rejects.toMatchObject({ status: 403 });
});
it('requires a separate explicit confirmation for an expired schedule', async () => {
  respond({ code: 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED' }, 409);
  await expect(sendProposalAction(7, 20, 'ACCEPT_PROPOSAL', body, 'synthetic-token', key)).rejects.toMatchObject({ code: 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED' });
  expect(JSON.parse((fetch as any).mock.calls[0][1].body)).not.toHaveProperty('acceptPastSchedule');
});
it('uploads only valid photos through the existing preset and rejects non-image URLs', async () => {
  respond({ secure_url: 'https://res.cloudinary.com/test/image/upload/qa.jpg' });
  const file = new File(['synthetic'], 'qa.jpg', { type: 'image/jpeg' });
  await expect(uploadProposalPhoto(file)).resolves.toContain('/image/upload/qa.jpg');
  const options = (fetch as any).mock.calls[0][1]; expect(options.body.get('upload_preset')).toBe('zipco_products'); expect(options.body.get('file')).toBeInstanceOf(File);
  respond({ secure_url: 'https://example.test/photo.jpg' }); await expect(uploadProposalPhoto(file)).rejects.toBeInstanceOf(ProposalError);
  respond({}); await expect(uploadProposalPhoto(new File(['x'], 'file.txt', { type: 'text/plain' }))).rejects.toBeInstanceOf(ProposalError); expect(fetch).not.toHaveBeenCalled();
});
