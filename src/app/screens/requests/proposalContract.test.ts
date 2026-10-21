import { describe, expect, it } from 'vitest';
import { normalizeProposals, proposalAllowed, PROPOSAL_PATHS } from './proposalContract';
import { proposalsFixture, negotiatedAgreementFixture } from './proposalFixtures';
import { normalizeAgreement } from './agreement';
import { normalizeRequestProcess } from './requestProcess';
import { statusViewFor } from './requestStatusGrouping';
import { newAlternativeDraft, proposalDraftSource, reviewAlternative } from './alternativeDraft';

describe('alternatives-v1 strict representation and permissions', () => {
  it.each([0, 1, 2, 3])('validates the ordered chain through sequence %s without overwriting the original', sequence => {
    const raw = proposalsFixture(sequence); const before = JSON.stringify(raw);
    const read = normalizeProposals(raw, 7)!;
    expect(read.proposals).toHaveLength(sequence + 1); expect(read.proposals[0].subjectSnapshot.items[0].nameSnapshot).toBe('Artículo sintético');
    expect(JSON.stringify(raw)).toBe(before);
    expect(statusViewFor('orders', sequence ? 'alternative_proposed' : 'pending', read.process)).toBe(sequence ? 'waiting' : 'pending');
  });
  it.each([0, 1, 2, 3])('allows only the actor/state actions at sequence %s', sequence => {
    for (const business of [true, false]) {
      const read = normalizeProposals(proposalsFixture(sequence, business), 7)!;
      for (const action of Object.keys(PROPOSAL_PATHS) as Array<keyof typeof PROPOSAL_PATHS>) {
        const allowed = read.process.allowedActions.includes(action);
        expect(proposalAllowed(read.process, business, action)).toBe(allowed);
        if (allowed) expect(proposalAllowed(read.process, !business, action)).toBe(false);
      }
    }
  });
  it.each(['id', 'sequence', 'type', 'authorActor', 'authorUserId', 'subjectSchemaVersion', 'totalPriceClp', 'scheduledFor'])('fails closed on malformed proposal %s', key => {
    const raw = proposalsFixture(1); (raw.proposals[1] as any)[key] = 'invalid';
    expect(normalizeProposals(raw, 7)).toBeNull();
  });
  it('rejects duplicated identities, missing/reordered versions, mismatched current and wrong summary', () => {
    const raw = proposalsFixture(2); raw.proposals[1].id = raw.proposals[0].id; expect(normalizeProposals(raw, 7)).toBeNull();
    const other = proposalsFixture(1); other.process.currentProposalId = 900; expect(normalizeProposals(other, 7)).toBeNull();
    const mismatch = proposalsFixture(1); mismatch.process.proposalSummary!.totalPriceClp = 1; expect(normalizeProposals(mismatch, 7)).toBeNull();
    const missing = proposalsFixture(2); missing.proposals.splice(1, 1); expect(normalizeProposals(missing, 7)).toBeNull();
  });
  it('supports CUSTOM without dividing its total into a fabricated unit price in editing or agreement', () => {
    const read = normalizeProposals(proposalsFixture(2), 7)!;
    expect(read.proposals[2].subjectSnapshot.items[0].unitPriceClpSnapshot).toBeNull();
    const source = proposalDraftSource(read), draft = newAlternativeDraft(source);
    draft.lines[0].selected.add('quantity'); draft.lines[0].quantity = '4'; draft.message = 'Mismo conjunto con otra cantidad.';
    expect(reviewAlternative(source, draft).review).toMatchObject({ totalPriceClp: 10001,
      lineChanges: [{ originalLineIndex: 0, quantity: 4, lineTotalPriceClp: 10001 }] });
    draft.lines[0].selected.add('price'); draft.lines[0].price = '11001';
    expect(reviewAlternative(source, draft).review).toMatchObject({ totalPriceClp: 11001, lineChanges: [{ originalLineIndex: 0, lineTotalPriceClp: 11001 }] });
    const agreement = normalizeAgreement(negotiatedAgreementFixture())!;
    expect(agreement.subjectSnapshot.items[0]).toMatchObject({ unitPriceClpSnapshot: null, subtotalClp: 10001 });
    expect(agreement.subjectSnapshot.proposalPhoto).toContain('/image/upload/');
  });
  it.each(['CUSTOMER_REJECTED_PROPOSAL', 'BUSINESS_REJECTED_COUNTER_PROPOSAL'])('preserves closure and routes %s to history', reasonCode => {
    const process = normalizeRequestProcess({ ...proposalsFixture(1).process, state: 'CLOSED', allowedActions: [], closure: {
      reasonCode, reasonDetail: null, actor: reasonCode.startsWith('CUSTOMER') ? 'CUSTOMER' : 'BUSINESS', actorUserId: 11, closedAt: '2026-10-20T12:00:00Z' } })!;
    expect(process).not.toBeNull(); expect(statusViewFor('orders', 'rejected', process)).toBe('history');
    expect(process.allowedActions).toEqual([]);
  });
  it('keeps terminal and final-round permissions closed', () => {
    const read = normalizeProposals(proposalsFixture(3, false), 7)!;
    expect(proposalAllowed({ ...read.process, allowedActions: ['COUNTER_PROPOSAL'] }, false, 'COUNTER_PROPOSAL')).toBe(false);
    expect(proposalAllowed({ ...read.process, agreementPublicId: 'agreed' }, false, 'ACCEPT_PROPOSAL')).toBe(false);
  });
  it('does not coerce schema versions or malformed CUSTOM agreement prices', () => {
    const agreement = negotiatedAgreementFixture();
    expect(normalizeAgreement({ ...agreement, subjectSchemaVersion: '2' })).toBeNull();
    agreement.subjectSnapshot.items[0].unitPriceClpSnapshot = 3333;
    expect(normalizeAgreement(agreement)).toBeNull();
  });
});
