import { proposalAllowed, type ProposalRead } from './proposalContract';
import { isSimpleOffer } from './simplifiedReservationContract';
import { santiagoDraftTime, type AlternativeReview } from './alternativeDraft';

export type ExpiredProposalEvidence = { version: number; proposalId: number };
export type RequestedSchedule = NonNullable<AlternativeReview['schedule']>;

function reservablePlan(read: ProposalRead) {
  const p = read.process;
  const plan = read.proposals.at(-1)?.availability ?? p.availability;
  return p.flowContract === 'AVAILABILITY_V3' && !p.agreementPublicId && !p.reservation &&
    plan?.path === 'LOCAL_PICKUP' && plan.reservationOffer &&
    ['FREE', 'PREPAYMENT'].includes(plan.reservationOffer.mode) && isSimpleOffer(plan.reservationOffer)
    ? plan : null;
}

export function canRequestProposalSchedule(read: ProposalRead, evidence: ExpiredProposalEvidence | null) {
  return Boolean(evidence && evidence.version === read.process.version &&
    evidence.proposalId === read.process.currentProposalId && reservablePlan(read) &&
    read.process.state === 'AWAITING_CUSTOMER_DECISION' &&
    read.proposals.at(-1)?.type === 'BUSINESS_PROPOSAL' &&
    proposalAllowed(read.process, false, 'COUNTER_PROPOSAL'));
}

// Presentation guidance only. The server remains the authority for the exception,
// permissions, expiry, and whether the renewed final may keep identical conditions.
export function needsReservationRenewal(read: ProposalRead, now = Date.now()) {
  const plan = reservablePlan(read);
  const offer = plan?.reservationOffer;
  if (!offer || !isSimpleOffer(offer) || !offer.simplified.scheduledFor) return false;
  const latest = read.proposals.at(-1);
  const serverNow = read.process.serverNow ? Date.parse(read.process.serverNow) : now;
  return read.process.state === 'AWAITING_BUSINESS_COUNTER_RESPONSE' && latest?.type === 'CUSTOMER_COUNTER' &&
    proposalAllowed(read.process, true, 'PROPOSE_FINAL') &&
    Date.parse(offer.simplified.scheduledFor) <= serverNow &&
    offer.simplified.scheduledFor !== latest.scheduledFor &&
    (latest.scheduledFor === null || Date.parse(latest.scheduledFor) > serverNow);
}

export function scheduleRequestReview(read: ProposalRead, schedule: RequestedSchedule, note: string, now = Date.now()): AlternativeReview {
  if (schedule.mode === 'SCHEDULED') {
    const time = santiagoDraftTime(schedule.date, schedule.time);
    if (time === null || time <= now) throw new Error('Elige una fecha y hora futuras válidas de Chile.');
  }
  const description = schedule.mode === 'IMMEDIATE' ? 'lo antes posible' : `${schedule.date} a las ${schedule.time} (Chile)`;
  return { expectedVersion: read.process.version, proposalId: read.process.currentProposalId,
    totalPriceClp: read.proposals.at(-1)!.totalPriceClp,
    schedule, message: `Solicito otro horario: ${description}.${note.trim() ? ` Nota: ${note.trim()}` : ''}` };
}

export function sameScheduleFinalReview(read: ProposalRead): AlternativeReview {
  // Omit schedule and lineChanges: the current counter already carries the exact
  // requested conditions. The business supplies a newly validated fulfillment.
  return { expectedVersion: read.process.version, proposalId: read.process.currentProposalId,
    totalPriceClp: read.proposals.at(-1)!.totalPriceClp,
    message: 'Confirmo que puedo para el horario solicitado. Revisa las condiciones de reserva renovadas antes de aceptar.' };
}
