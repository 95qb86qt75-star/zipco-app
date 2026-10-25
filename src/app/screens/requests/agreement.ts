import { isRecord, parseIsoDate } from './orderValueParsers';
import { positiveInteger } from './requestProcess';
import { normalizeProposalSubject } from './proposalContract';
import { normalizeAvailability, type AvailabilityPlan } from './availabilityContract';
import {normalizeReservationChoice,normalizeReservationOffer,type ReservationChoice} from './reservationContract';

export type AgreementItem = {
  catalogItemId: number | null; nameSnapshot: string; descriptionSnapshot: string;
  quantity: number; unitPriceClpSnapshot: number | null; subtotalClp: number;
  source?: 'CATALOG' | 'CUSTOM';
};
export type AgreementReadDto = {
  availability?: AvailabilityPlan;
  reservationChoice?:ReservationChoice;
  agreementPublicId: string; requestProcessId: number; acceptedProposalId: number;
  subjectSchemaVersion: 1 | 2;
  subjectSnapshot: { orderType: 'product' | 'service'; items: AgreementItem[];
    needNow: boolean; note: string | null; referencePhoto: string | null; proposalMessage?: string; proposalPhoto?: string | null };
  totalPriceClp: number; reservationAmountClp: null; scheduledFor: string | null;
  customerAcceptedAt: string; businessAcceptedAt: string; confirmedAt: string; createdAt: string;
};
const money = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const nullableText = (v: unknown) => v === null || typeof v === 'string';
export const safePhoto = (v: unknown): v is string | null => v === null ||
  (typeof v === 'string' && /^https?:\/\//i.test(v));
function normalizeItem(v: unknown): AgreementItem | null {
  if (!isRecord(v) || !positiveInteger(v.catalogItemId) ||
    typeof v.nameSnapshot !== 'string' || !v.nameSnapshot.trim() ||
    typeof v.descriptionSnapshot !== 'string' || !positiveInteger(v.quantity) ||
    !money(v.unitPriceClpSnapshot) || !money(v.subtotalClp) ||
    v.subtotalClp !== v.quantity * v.unitPriceClpSnapshot) return null;
  return { catalogItemId: v.catalogItemId, nameSnapshot: v.nameSnapshot,
    descriptionSnapshot: v.descriptionSnapshot, quantity: v.quantity,
    unitPriceClpSnapshot: v.unitPriceClpSnapshot, subtotalClp: v.subtotalClp };
}
export function normalizeAgreement(value: unknown): AgreementReadDto | null {
  if (!isRecord(value) || !isRecord(value.subjectSnapshot)) return null;
  const s = value.subjectSnapshot;
  if (typeof value.agreementPublicId !== 'string' || !value.agreementPublicId.trim() ||
    !positiveInteger(value.requestProcessId) || !positiveInteger(value.acceptedProposalId) ||
    (value.subjectSchemaVersion !== 1 && value.subjectSchemaVersion !== 2) || typeof s.orderType !== 'string' ||
    (s.orderType !== 'product' && s.orderType !== 'service') ||
    typeof s.needNow !== 'boolean' || !nullableText(s.note) || !safePhoto(s.referencePhoto) ||
    !Array.isArray(s.items) || s.items.length === 0 || !money(value.totalPriceClp) ||
    value.reservationAmountClp !== null ||
    !(value.scheduledFor === null || parseIsoDate(value.scheduledFor)) ||
    !parseIsoDate(value.customerAcceptedAt) || !parseIsoDate(value.businessAcceptedAt) ||
    !parseIsoDate(value.confirmedAt) || !parseIsoDate(value.createdAt)) return null;
  const schema2 = value.subjectSchemaVersion === 2 ? normalizeProposalSubject(2, s, value.totalPriceClp, value.scheduledFor) : null;
  if (value.subjectSchemaVersion === 2 && !schema2) return null;
  const items = schema2 ? schema2.items : s.items.map(normalizeItem);
  if (items.some((item) => item === null) ||
    items.reduce((sum, item) => sum + (item?.subtotalClp ?? 0), 0) !== value.totalPriceClp) return null;
  const availability = value.availability === undefined ? undefined : normalizeAvailability(value.availability, value.acceptedProposalId);
  if (availability === null) return null;
  const choice=value.reservationChoice===undefined?undefined:normalizeReservationChoice(value.reservationChoice);
  if(choice===null||availability?.reservationOffer&&!normalizeReservationOffer(availability.reservationOffer,value.totalPriceClp as number)||
    choice&&availability&&choice.offerId!==availability.availabilityConfirmationId)return null;
  // Whitelist fields: contacts and other extra response data never enter the model.
  return {
    agreementPublicId: value.agreementPublicId, requestProcessId: value.requestProcessId,
    acceptedProposalId: value.acceptedProposalId, subjectSchemaVersion: value.subjectSchemaVersion as 1 | 2,
    subjectSnapshot: { orderType: s.orderType, items: items as AgreementItem[],
      needNow: s.needNow, note: s.note as string | null, referencePhoto: s.referencePhoto as string | null,
      ...(schema2 ? { proposalMessage: schema2.proposalMessage, proposalPhoto: schema2.proposalPhoto } : {}) },
    totalPriceClp: value.totalPriceClp, reservationAmountClp: null,
    scheduledFor: value.scheduledFor as string | null, customerAcceptedAt: value.customerAcceptedAt as string,
    businessAcceptedAt: value.businessAcceptedAt as string, confirmedAt: value.confirmedAt as string,
    createdAt: value.createdAt as string,
    ...(availability ? { availability } : {}),
    ...(choice?{reservationChoice:choice}:{}),
  };
}
