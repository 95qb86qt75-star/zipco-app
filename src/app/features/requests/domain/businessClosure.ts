import { isRecord, parseIsoDate } from './orderValueParsers';

export const BUSINESS_CLOSURE_CONTRACT = 'business-order-closure-v1' as const;
export const BUSINESS_CLOSURE_HEADERS = { 'X-Business-Order-Closure-Contract': BUSINESS_CLOSURE_CONTRACT };
export const BUSINESS_CLOSURE_REASONS = {
  CUSTOMER_DID_NOT_COLLECT: 'El cliente no retiró el pedido',
  BUSINESS_COULD_NOT_FULFILL: 'No pude entregar el pedido',
  AGREED_NOT_TO_PROCEED: 'Acordamos no continuar',
  OTHER: 'Otro motivo',
} as const;
export type BusinessClosureReason = keyof typeof BUSINESS_CLOSURE_REASONS;
export type BusinessClosureAction = 'BUSINESS_DECLARE_DELIVERY' | 'BUSINESS_CLOSE_WITHOUT_DELIVERY';
export type DeliveryBlock = { code: 'BUSINESS_DELIVERY_RESERVATION_BLOCKED'; cause: string; reservationId: number | null; target: 'RESERVATION_DETAILS' };
export type BusinessClosureOptions = { deliveryBlock: DeliveryBlock | null; reasonCodes: BusinessClosureReason[] };
export type BusinessClosure = {
  contract: typeof BUSINESS_CLOSURE_CONTRACT; status: 'DELIVERY_DECLARED' | 'CLOSED_WITHOUT_DELIVERY';
  eventId: number; operationRef: string; actor: 'BUSINESS'; actorUserId: number; declaredAt: string;
  reasonCode: BusinessClosureReason | null; reasonDetail: string | null;
  businessCategory: 'HISTORY'; customerCategory: 'IN_PROGRESS' | 'HISTORY';
};
export const closureReason = (v: unknown): v is BusinessClosureReason => typeof v === 'string' && Object.hasOwn(BUSINESS_CLOSURE_REASONS, v);
export const validClosureDetail = (reason: BusinessClosureReason, detail: unknown) => reason === 'OTHER'
  ? typeof detail === 'string' && detail === detail.trim() && Array.from(detail).length >= 3 && Array.from(detail).length <= 1000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(detail)
  : detail === null;
const id = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
export function normalizeBusinessClosure(v: unknown, state: string): BusinessClosure | null {
  if (!isRecord(v) || v.contract !== BUSINESS_CLOSURE_CONTRACT || !id(v.eventId) || !id(v.actorUserId) ||
      typeof v.operationRef !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v.operationRef) ||
      v.actor !== 'BUSINESS' || !parseIsoDate(v.declaredAt) || v.businessCategory !== 'HISTORY') return null;
  const delivered = v.status === 'DELIVERY_DECLARED';
  if (delivered ? !['READY', 'COMPLETED'].includes(state) || v.reasonCode !== null || v.reasonDetail !== null ||
      v.customerCategory !== (state === 'COMPLETED' ? 'HISTORY' : 'IN_PROGRESS')
    : v.status !== 'CLOSED_WITHOUT_DELIVERY' || state !== 'CLOSED' || v.customerCategory !== 'HISTORY' ||
      !closureReason(v.reasonCode) || !validClosureDetail(v.reasonCode, v.reasonDetail)) return null;
  return { contract: BUSINESS_CLOSURE_CONTRACT, status: v.status as BusinessClosure['status'], eventId: v.eventId,
    operationRef: v.operationRef, actor: 'BUSINESS', actorUserId: v.actorUserId, declaredAt: v.declaredAt as string,
    reasonCode: v.reasonCode as BusinessClosureReason | null, reasonDetail: v.reasonDetail as string | null,
    businessCategory: 'HISTORY', customerCategory: v.customerCategory as BusinessClosure['customerCategory'] };
}
export function normalizeDeliveryBlock(v: unknown): DeliveryBlock | null {
  const causes = ['RESERVATION_MISSING','RESERVATION_CONFIRMATION_REQUIRED','RESERVATION_CLARIFICATION_REQUIRED',
    'RESERVATION_CANCELLED','RESERVATION_EXPIRED','RESERVATION_DECLINED','RESERVATION_PAYMENT_DECLARATION_REQUIRED','PRODUCT_RECEIPT_ALREADY_DECLARED'];
  return isRecord(v) && v.code === 'BUSINESS_DELIVERY_RESERVATION_BLOCKED' && causes.includes(String(v.cause)) &&
    (v.reservationId === null || id(v.reservationId)) && v.target === 'RESERVATION_DETAILS'
    ? { code: v.code, cause: String(v.cause), reservationId: v.reservationId as number | null, target: v.target } : null;
}
export function normalizeClosureOptions(v: unknown): BusinessClosureOptions | null {
  if (!isRecord(v) || !Array.isArray(v.reasonCodes) || !v.reasonCodes.every(closureReason)) return null;
  const block = v.deliveryBlock === null ? null : normalizeDeliveryBlock(v.deliveryBlock);
  if (v.deliveryBlock !== null && !block) return null;
  return { deliveryBlock: block, reasonCodes: [...v.reasonCodes] };
}
export const DELIVERY_BLOCK_COPY: Record<string, string> = {
  RESERVATION_MISSING: 'Falta el registro de la reserva. Actualiza el pedido.',
  RESERVATION_CONFIRMATION_REQUIRED: 'Confirma el apartado desde los controles de la reserva antes de declarar entrega.',
  RESERVATION_CLARIFICATION_REQUIRED: 'La reserva tiene una aclaración pendiente. Revisa sus controles.',
  RESERVATION_PAYMENT_DECLARATION_REQUIRED: 'Falta la declaración del monto requerido. Revisa los controles de la reserva.',
  RESERVATION_CANCELLED: 'La reserva está cancelada. Revisa sus condiciones antes de continuar.',
  RESERVATION_EXPIRED: 'La reserva venció. Revisa sus condiciones antes de continuar.',
  RESERVATION_DECLINED: 'La reserva fue rechazada. Revisa sus condiciones antes de continuar.',
  PRODUCT_RECEIPT_ALREADY_DECLARED: 'La recepción ya fue declarada. Actualiza el pedido.',
};
