import { describe, expect, it } from 'vitest';
import type { ProposalRead } from './proposalContract';
import { canRequestProposalSchedule, needsReservationRenewal, scheduleRequestReview, sameScheduleFinalReview } from './expiredProposalSchedule';

const now = Date.parse('2026-11-13T22:00:00Z');
function fixture(mode = 'FREE'): ProposalRead {
  const availability = { path: 'LOCAL_PICKUP', availabilityConfirmationId: 201,
    reservationOffer: { mode, simplified: { scheduledFor: '2026-11-12T15:00:00Z', termsVersion: 'old' } } };
  return { process: { id: 1, version: 7, currentProposalId: 101, state: 'AWAITING_CUSTOMER_DECISION',
    flowContract: 'AVAILABILITY_V3', agreementPublicId: null, allowedActions: ['COUNTER_PROPOSAL'], availability },
    proposals: [{ id: 101, type: 'BUSINESS_PROPOSAL', totalPriceClp: 12000, availability }] } as unknown as ProposalRead;
}
const evidence = { version: 7, proposalId: 101 };
describe('expired proposal schedule handoff E205', () => {
  it.each(['FREE', 'PREPAYMENT'])('requires matching server-expiry evidence and COUNTER for %s', mode => {
    const read = fixture(mode);
    expect(canRequestProposalSchedule(read, evidence)).toBe(true);
    expect(canRequestProposalSchedule(read, null)).toBe(false);
    expect(canRequestProposalSchedule(read, { ...evidence, version: 6 })).toBe(false);
    expect(canRequestProposalSchedule(read, { ...evidence, proposalId: 99 })).toBe(false);
    read.process.allowedActions = [];
    expect(canRequestProposalSchedule(read, evidence)).toBe(false);
  });
  it.each(['AVAILABILITY_V2', 'AVAILABILITY_V1'])('excludes %s', contract => {
    const read = fixture(); read.process.flowContract = contract as never;
    expect(canRequestProposalSchedule(read, evidence)).toBe(false);
  });
  it('excludes final proposals, agreement, reservation and NONE', () => {
    for (const changes of [{ state: 'AWAITING_CUSTOMER_FINAL_DECISION' }, { agreementPublicId: 'agreed' }, { reservation: { id: 2 } }]) {
      const read = fixture(); Object.assign(read.process, changes);
      expect(canRequestProposalSchedule(read, evidence)).toBe(false);
    }
    expect(canRequestProposalSchedule(fixture('NONE'), evidence)).toBe(false);
  });
  it('builds schedule-only immediate counter preserving price and note, without old-time acceptance', () => {
    const review = scheduleRequestReview(fixture(), { mode: 'IMMEDIATE' }, '  A nombre de Bastián  ', now);
    expect(review.schedule).toEqual({ mode: 'IMMEDIATE' });
    expect(review.totalPriceClp).toBe(12000);
    expect(review.message).toContain('A nombre de Bastián');
    expect(review).not.toHaveProperty('lineChanges');
    expect(review).not.toHaveProperty('acceptPastSchedule');
  });
  it('validates Santiago future schedule and rejects past or invalid times', () => {
    expect(scheduleRequestReview(fixture(), { mode: 'SCHEDULED', date: '2026-11-14', time: '18:00' }, '', now).schedule).toEqual({ mode: 'SCHEDULED', date: '2026-11-14', time: '18:00' });
    expect(() => scheduleRequestReview(fixture(), { mode: 'SCHEDULED', date: '2026-11-12', time: '18:00' }, '', now)).toThrow();
    expect(() => scheduleRequestReview(fixture(), { mode: 'SCHEDULED', date: '', time: '' }, '', now)).toThrow();
  });
  it.each([null, '2026-11-14T21:00:00Z'])('guides renewal for counter %s without changing inherited conditions', scheduledFor => {
    const read = fixture(); Object.assign(read.process, { state: 'AWAITING_BUSINESS_COUNTER_RESPONSE', allowedActions: ['PROPOSE_FINAL'] });
    Object.assign(read.proposals[0], { type: 'CUSTOMER_COUNTER', scheduledFor });
    const before = JSON.stringify(read);
    expect(needsReservationRenewal(read, now)).toBe(true);
    expect(sameScheduleFinalReview(read)).toMatchObject({ totalPriceClp: 12000, proposalId: 101 });
    expect(sameScheduleFinalReview(read)).not.toHaveProperty('schedule');
    expect(JSON.stringify(read)).toBe(before);
    read.proposals[0].scheduledFor = '2026-11-12T15:00:00Z';
    expect(needsReservationRenewal(read, now)).toBe(false);
  });
});
