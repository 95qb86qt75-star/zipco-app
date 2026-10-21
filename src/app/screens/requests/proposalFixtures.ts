// Synthetic contract fixtures. Never sent to QA.
import { pendingProcess, agreementFixture } from './requestProcessFixtures';
export const proposalFixture = (sequence = 0) => {
  const custom = sequence === 2;
  const item = { catalogItemId: custom ? null : 8, nameSnapshot: custom ? 'Opción escrita' : 'Artículo sintético', descriptionSnapshot: 'Descripción sintética',
    quantity: custom ? 3 : 2, unitPriceClpSnapshot: custom ? null : 1000 + sequence * 500, subtotalClp: custom ? 10001 : 2000 + sequence * 1000,
    ...(sequence ? { source: custom ? 'CUSTOM' : 'CATALOG', publishedUnitPriceClp: custom ? null : 1000 } : {}) };
  return { id: 123 + sequence, sequence, type: ['ORIGINAL_REQUEST', 'BUSINESS_PROPOSAL', 'CUSTOMER_COUNTER', 'BUSINESS_FINAL'][sequence],
    authorActor: sequence === 0 || sequence === 2 ? 'CUSTOMER' : 'BUSINESS', authorUserId: sequence === 0 || sequence === 2 ? 11 : 12,
    createdAt: '2026-10-20T12:00:00.000Z', subjectSchemaVersion: sequence ? 2 : 1,
    subjectSnapshot: { orderType: 'product', items: [item], needNow: true, note: 'Nota original', referencePhoto: null,
      ...(sequence ? { proposalMessage: 'Explicación del cambio de precio.', proposalPhoto: 'https://res.cloudinary.com/test/image/upload/proposal.jpg' } : {}) },
    totalPriceClp: item.subtotalClp, scheduledFor: null, reservationAmountClp: null, changesFromPrevious: null };
};
export function proposalsFixture(sequence = 0, business = true) {
  const proposals = Array.from({ length: sequence + 1 }, (_, i) => proposalFixture(i));
  const current = proposals[sequence];
  return { process: { ...pendingProcess, state: ['AWAITING_BUSINESS_RESPONSE', 'AWAITING_CUSTOMER_DECISION', 'AWAITING_BUSINESS_COUNTER_RESPONSE', 'AWAITING_CUSTOMER_FINAL_DECISION'][sequence],
    version: sequence + 1, currentProposalId: current.id, allowedActions: sequence === 0 ? business ? ['PROPOSE_ALTERNATIVE', 'ACCEPT_FIXED_ORDER'] : []
      : sequence === 1 ? business ? [] : ['ACCEPT_PROPOSAL', 'REJECT_PROPOSAL', 'COUNTER_PROPOSAL']
      : sequence === 2 ? business ? ['ACCEPT_COUNTER_PROPOSAL', 'REJECT_COUNTER_PROPOSAL', 'PROPOSE_FINAL'] : []
      : business ? [] : ['ACCEPT_PROPOSAL', 'REJECT_PROPOSAL'],
    ...(sequence ? { proposalSummary: { type: current.type, subjectSchemaVersion: 2, totalPriceClp: current.totalPriceClp, scheduledFor: current.scheduledFor } } : {}) }, proposals };
}
export const negotiatedAgreementFixture = () => ({ ...agreementFixture, subjectSchemaVersion: 2,
  subjectSnapshot: proposalFixture(2).subjectSnapshot, totalPriceClp: proposalFixture(2).totalPriceClp, scheduledFor: null });
