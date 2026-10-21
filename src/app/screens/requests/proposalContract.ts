import { isRecord, parseIsoDate } from './orderValueParsers';
import { normalizeRequestProcess, positiveInteger, type RequestProcessSummary } from './requestProcess';

export const PROPOSAL_PATHS = {
  PROPOSE_ALTERNATIVE: 'propose-alternative', COUNTER_PROPOSAL: 'counter-proposal', PROPOSE_FINAL: 'propose-final',
  ACCEPT_PROPOSAL: 'accept-proposal', REJECT_PROPOSAL: 'reject-proposal',
  ACCEPT_COUNTER_PROPOSAL: 'accept-counter-proposal', REJECT_COUNTER_PROPOSAL: 'reject-counter-proposal',
} as const;
export type ProposalAction = keyof typeof PROPOSAL_PATHS;
export const NEGOTIATION_STATES = ['AWAITING_CUSTOMER_DECISION', 'AWAITING_BUSINESS_COUNTER_RESPONSE', 'AWAITING_CUSTOMER_FINAL_DECISION'];
export const PROPOSAL_TYPES = ['ORIGINAL_REQUEST', 'BUSINESS_PROPOSAL', 'CUSTOMER_COUNTER', 'BUSINESS_FINAL'] as const;
export const proposalMoney = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= 50_000_000;
export const proposalPhoto = (v: unknown): v is string => typeof v === 'string' && v.length <= 2048 && /^https:\/\/res\.cloudinary\.com\/[^/?#\s]+\/image\/upload\/[^\s]+$/.test(v);
export type ProposalItem = { source: 'CATALOG' | 'CUSTOM'; catalogItemId: number | null; nameSnapshot: string; descriptionSnapshot: string;
  quantity: number; unitPriceClpSnapshot: number | null; subtotalClp: number; publishedUnitPriceClp: number | null };
export type ProposalSubject = { orderType: 'product' | 'service'; items: ProposalItem[]; needNow: boolean;
  note: string | null; referencePhoto: string | null; proposalMessage: string; proposalPhoto: string | null };
const textOrNull = (v: unknown) => v === null || typeof v === 'string';
export function normalizeProposalSubject(schema: unknown, value: unknown, total: unknown, scheduled: unknown): ProposalSubject | null {
  if ((schema !== 1 && schema !== 2) || !isRecord(value) || !['product', 'service'].includes(String(value.orderType)) ||
    typeof value.needNow !== 'boolean' || !textOrNull(value.note) || !textOrNull(value.referencePhoto) ||
    !Array.isArray(value.items) || value.items.length < 1 || value.items.length > 20 || !proposalMoney(total) ||
    (value.needNow ? scheduled !== null : !parseIsoDate(scheduled))) return null;
  if (schema === 2 && (typeof value.proposalMessage !== 'string' || value.proposalMessage.trim() !== value.proposalMessage ||
    value.proposalMessage.length < 3 || value.proposalMessage.length > 1000 ||
    !(value.proposalPhoto === null || proposalPhoto(value.proposalPhoto)))) return null;
  const items: ProposalItem[] = [];
  for (const raw of value.items) {
    if (!isRecord(raw) || typeof raw.nameSnapshot !== 'string' || !raw.nameSnapshot.trim() ||
      typeof raw.descriptionSnapshot !== 'string' || !positiveInteger(raw.quantity) || raw.quantity > 99 || !proposalMoney(raw.subtotalClp)) return null;
    const custom = schema === 2 && raw.source === 'CUSTOM';
    if (custom ? raw.catalogItemId !== null || raw.unitPriceClpSnapshot !== null || raw.publishedUnitPriceClp !== null
      : !positiveInteger(raw.catalogItemId) || !proposalMoney(raw.unitPriceClpSnapshot) || raw.subtotalClp !== raw.quantity * raw.unitPriceClpSnapshot ||
        (schema === 2 && (raw.source !== 'CATALOG' || !proposalMoney(raw.publishedUnitPriceClp)))) return null;
    items.push({ source: custom ? 'CUSTOM' : 'CATALOG', catalogItemId: raw.catalogItemId as number | null,
      nameSnapshot: raw.nameSnapshot, descriptionSnapshot: raw.descriptionSnapshot, quantity: raw.quantity,
      unitPriceClpSnapshot: raw.unitPriceClpSnapshot as number | null, subtotalClp: raw.subtotalClp,
      publishedUnitPriceClp: schema === 1 ? raw.unitPriceClpSnapshot as number : raw.publishedUnitPriceClp as number | null });
  }
  if (items.reduce((sum, item) => sum + item.subtotalClp, 0) !== total ||
    (value.orderType === 'service' && (items.length !== 1 || items[0].quantity !== 1))) return null;
  return { orderType: value.orderType as ProposalSubject['orderType'], items, needNow: value.needNow,
    note: value.note as string | null, referencePhoto: value.referencePhoto as string | null,
    proposalMessage: schema === 2 ? value.proposalMessage as string : '', proposalPhoto: schema === 2 ? value.proposalPhoto as string | null : null };
}
export type Proposal = { id: number; sequence: number; type: typeof PROPOSAL_TYPES[number]; authorActor: 'CUSTOMER' | 'BUSINESS';
  createdAt: string; subjectSchemaVersion: 1 | 2; subjectSnapshot: ProposalSubject; totalPriceClp: number; scheduledFor: string | null };
export type ProposalRead = { process: RequestProcessSummary; proposals: Proposal[] };
export function normalizeProposals(value: unknown, processId: number): ProposalRead | null {
  if (!isRecord(value) || !Array.isArray(value.proposals) || !value.proposals.length || value.proposals.length > 4) return null;
  const process = normalizeRequestProcess(value.process);
  if (!process || process.id !== processId) return null;
  const proposals: Proposal[] = [];
  const ids = new Set<number>();
  for (let i = 0; i < value.proposals.length; i++) {
    const p = value.proposals[i];
    if (!isRecord(p) || !positiveInteger(p.id) || ids.has(p.id) || p.sequence !== i || p.type !== PROPOSAL_TYPES[i] ||
      p.subjectSchemaVersion !== (i === 0 ? 1 : 2) || p.authorActor !== (i === 0 || i === 2 ? 'CUSTOMER' : 'BUSINESS') ||
      !positiveInteger(p.authorUserId) || !parseIsoDate(p.createdAt) || p.reservationAmountClp !== null) return null;
    const subject = normalizeProposalSubject(p.subjectSchemaVersion, p.subjectSnapshot, p.totalPriceClp, p.scheduledFor);
    if (!subject || (i > 0 && (subject.orderType !== proposals[0].subjectSnapshot.orderType || subject.items.length !== proposals[0].subjectSnapshot.items.length))) return null;
    ids.add(p.id);
    proposals.push({ id: p.id, sequence: i, type: PROPOSAL_TYPES[i], authorActor: p.authorActor as Proposal['authorActor'],
      createdAt: p.createdAt as string, subjectSchemaVersion: p.subjectSchemaVersion as 1 | 2, subjectSnapshot: subject,
      totalPriceClp: p.totalPriceClp as number, scheduledFor: p.scheduledFor as string | null });
  }
  const latest = proposals[proposals.length - 1];
  if (process.currentProposalId !== latest.id ||
    (NEGOTIATION_STATES.includes(process.state) && latest.sequence !== NEGOTIATION_STATES.indexOf(process.state) + 1) ||
    (process.proposalSummary && (process.proposalSummary.type !== latest.type || process.proposalSummary.totalPriceClp !== latest.totalPriceClp || process.proposalSummary.scheduledFor !== latest.scheduledFor))) return null;
  return { process, proposals };
}
export function proposalAllowed(process: RequestProcessSummary, business: boolean, action: ProposalAction) {
  const states: Record<ProposalAction, string[]> = {
    PROPOSE_ALTERNATIVE: ['AWAITING_BUSINESS_RESPONSE'], COUNTER_PROPOSAL: ['AWAITING_CUSTOMER_DECISION'],
    PROPOSE_FINAL: ['AWAITING_BUSINESS_COUNTER_RESPONSE'], ACCEPT_PROPOSAL: ['AWAITING_CUSTOMER_DECISION', 'AWAITING_CUSTOMER_FINAL_DECISION'],
    REJECT_PROPOSAL: ['AWAITING_CUSTOMER_DECISION', 'AWAITING_CUSTOMER_FINAL_DECISION'],
    ACCEPT_COUNTER_PROPOSAL: ['AWAITING_BUSINESS_COUNTER_RESPONSE'], REJECT_COUNTER_PROPOSAL: ['AWAITING_BUSINESS_COUNTER_RESPONSE'],
  };
  return !process.agreementPublicId && process.allowedActions.includes(action) && states[action].includes(process.state) &&
    business === ['PROPOSE_ALTERNATIVE', 'PROPOSE_FINAL', 'ACCEPT_COUNTER_PROPOSAL', 'REJECT_COUNTER_PROPOSAL'].includes(action);
}
