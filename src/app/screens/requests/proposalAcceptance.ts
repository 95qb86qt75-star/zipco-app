import type { BusinessRequest, MyOrder } from './types';
import type { ProposalReceipt } from './proposalApi';
import { readCoordinationSession, type CoordinationSession } from './coordinationSession';
import { normalizeRequestProcess } from './requestProcess';

export const PROPOSAL_ACCEPTED_EVENT = 'zipco-proposal-accepted';
export type AcceptedProposal = {
  order: BusinessRequest | MyOrder; receipt: ProposalReceipt; business: boolean;
  authorize: boolean; session: CoordinationSession;
};

// Local follow-up only, after the exact proposal POST has been verified. No new API action.
export function acceptedProposal(value: AcceptedProposal | undefined): AcceptedProposal | null {
  if (!value || !value.session || value.session !== readCoordinationSession() ||
    typeof value.business !== 'boolean' || typeof value.authorize !== 'boolean' ||
    value.order?.recordState !== 'available' || value.receipt?.orderStatus !== 'accepted' ||
    value.receipt.orderId !== value.order.id) return null;
  const process = normalizeRequestProcess(value.receipt.requestProcess);
  if (!process || process.id !== value.order.requestProcess?.id || process.state !== 'COORDINATION_PENDING' ||
    !process.agreementPublicId || process.version <= value.order.requestProcess.version) return null;
  return { ...value, receipt: { ...value.receipt, requestProcess: process } };
}

export function announceProposalAccepted(value: AcceptedProposal) {
  if (acceptedProposal(value)) window.dispatchEvent(new CustomEvent(PROPOSAL_ACCEPTED_EVENT, { detail: value }));
}
