import { isRecord, parseIsoDate } from './orderValueParsers';
import { positiveInteger } from './requestProcess';

export type AgreementItem = {
  catalogItemId: number; nameSnapshot: string; descriptionSnapshot: string;
  quantity: number; unitPriceClpSnapshot: number; subtotalClp: number;
};
export type AgreementReadDto = {
  agreementPublicId: string; requestProcessId: number; acceptedProposalId: number;
  subjectSchemaVersion: 1;
  subjectSnapshot: { orderType: 'product' | 'service'; items: AgreementItem[];
    needNow: boolean; note: string | null; referencePhoto: string | null };
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
    value.subjectSchemaVersion !== 1 || typeof s.orderType !== 'string' ||
    (s.orderType !== 'product' && s.orderType !== 'service') ||
    typeof s.needNow !== 'boolean' || !nullableText(s.note) || !safePhoto(s.referencePhoto) ||
    !Array.isArray(s.items) || s.items.length === 0 || !money(value.totalPriceClp) ||
    value.reservationAmountClp !== null ||
    !(value.scheduledFor === null || parseIsoDate(value.scheduledFor)) ||
    !parseIsoDate(value.customerAcceptedAt) || !parseIsoDate(value.businessAcceptedAt) ||
    !parseIsoDate(value.confirmedAt) || !parseIsoDate(value.createdAt)) return null;
  const items = s.items.map(normalizeItem);
  if (items.some((item) => item === null) ||
    items.reduce((sum, item) => sum + (item?.subtotalClp ?? 0), 0) !== value.totalPriceClp) return null;
  // Whitelist fields: contacts and other extra response data never enter the model.
  return {
    agreementPublicId: value.agreementPublicId, requestProcessId: value.requestProcessId,
    acceptedProposalId: value.acceptedProposalId, subjectSchemaVersion: 1,
    subjectSnapshot: { orderType: s.orderType, items: items as AgreementItem[],
      needNow: s.needNow, note: s.note as string | null, referencePhoto: s.referencePhoto as string | null },
    totalPriceClp: value.totalPriceClp, reservationAmountClp: null,
    scheduledFor: value.scheduledFor as string | null, customerAcceptedAt: value.customerAcceptedAt as string,
    businessAcceptedAt: value.businessAcceptedAt as string, confirmedAt: value.confirmedAt as string,
    createdAt: value.createdAt as string,
  };
}
