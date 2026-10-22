import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { acceptedProposal, announceProposalAccepted, PROPOSAL_ACCEPTED_EVENT, type AcceptedProposal } from './proposalAcceptance';
import { readCoordinationSession, notifyCoordinationSessionChange } from './coordinationSession';
import { normalizeMyOrdersPayload } from './orderNormalization';
import { rawOrder } from './requestProcessFixtures';
import { proposalsFixture } from './proposalFixtures';

let storage: Map<string, string>;
const dispatch = vi.fn();
beforeEach(() => {
  storage = new Map([['zipco-token', 'synthetic-token'], ['zipco-user-id', '11']]);
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null });
  vi.stubGlobal('window', { dispatchEvent: dispatch });
  notifyCoordinationSessionChange(); dispatch.mockClear();
});
afterEach(() => vi.unstubAllGlobals());
function value(): AcceptedProposal {
  const process = proposalsFixture(1, false).process;
  const order = normalizeMyOrdersPayload([{ ...rawOrder, status: 'alternative_proposed', requestProcess: process }])[0];
  return { order, receipt: { orderId: 20, orderStatus: 'accepted', requestProcess: { ...order.requestProcess!,
    state: 'COORDINATION_PENDING', version: process.version + 2, agreementPublicId: 'synthetic-agreement', allowedActions: [] } },
  session: readCoordinationSession()!, business: false, authorize: true };
}
it('accepts an authoritative receipt without inventing contact permissions', () => {
  const confirmed = acceptedProposal(value());
  expect(confirmed?.receipt.requestProcess.allowedActions).toEqual([]);
  expect(confirmed?.authorize).toBe(true);
});
it('only emits local follow-up after verified acceptance, without posting an API action', () => {
  const confirmed = value(); announceProposalAccepted(confirmed);
  expect(dispatch).toHaveBeenCalledOnce();
  expect(dispatch.mock.calls[0][0]).toMatchObject({ type: PROPOSAL_ACCEPTED_EVENT, detail: confirmed });
});
it('refuses stale, mismatched and non-acceptance receipts', () => {
  const confirmed = value();
  for (const patch of [{ orderId: 21 }, { orderStatus: 'alternative_proposed' },
    { requestProcess: { ...confirmed.receipt.requestProcess, agreementPublicId: null } },
    { requestProcess: { ...confirmed.receipt.requestProcess, version: confirmed.order.requestProcess!.version } },
    { requestProcess: { ...confirmed.receipt.requestProcess, id: 99 } }]) {
    expect(acceptedProposal({ ...confirmed, receipt: { ...confirmed.receipt, ...patch } } as AcceptedProposal)).toBeNull();
  }
});
it('invalidates a follow-up when credentials or account change', () => {
  const confirmed = value(); storage.set('zipco-token', 'new-session');
  expect(acceptedProposal(confirmed)).toBeNull(); announceProposalAccepted(confirmed);
  expect(dispatch).not.toHaveBeenCalled();
});
it('keeps solo acceptance and business counter acceptance separate from customer consent', () => {
  const confirmed = value();
  expect(acceptedProposal({ ...confirmed, authorize: false })?.authorize).toBe(false);
  expect(acceptedProposal({ ...confirmed, business: true, authorize: false })?.business).toBe(true);
});
