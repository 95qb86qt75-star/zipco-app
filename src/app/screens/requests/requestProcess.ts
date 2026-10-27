import { isRecord,parseIsoDate } from './orderValueParsers';
import {normalizeProductPreview,type ProductPreview} from './productPreview';
import { AVAILABILITY_ACTION_PATHS, AVAILABILITY_CLOSURES, availabilityFlow, normalizeAvailability, type AvailabilityPlan, type AvailabilityClosureReason } from './availabilityContract';
import {simplifiedReservationFlow,isSimpleOffer} from './simplifiedReservationContract';
import {LATE_INITIAL_PATHS,normalizeLateInitial,type LateInitialView} from './lateInitialContract';
import {RESERVATION_PATHS,reservationFlow,normalizeReservationChoice,normalizeReservation,normalizeReservationFollowUp,type Reservation,type ReservationChoice,type ReservationFollowUp} from './reservationContract';

export const PROCESS_ACTIONS = ['ACCEPT_FIXED_ORDER', 'AUTHORIZE_CONTACT', 'OPEN_WHATSAPP', 'START_WORK', 'MARK_READY', 'ACK_READY_NOTICE', 'CONFIRM_RECEIPT', 'ANNUL_COORDINATION', 'CANCEL_PENDING_REQUEST', 'REJECT_PENDING_REQUEST', 'PROPOSE_ALTERNATIVE', 'COUNTER_PROPOSAL', 'PROPOSE_FINAL', 'ACCEPT_PROPOSAL', 'REJECT_PROPOSAL', 'ACCEPT_COUNTER_PROPOSAL', 'REJECT_COUNTER_PROPOSAL', 'CONFIRM_AVAILABILITY', 'CONTINUE_REQUEST', 'DECLINE_REQUEST', 'WITHDRAW_AVAILABILITY', 'CANCEL_PICKUP', 'REVOKE_CONTACT_CONSENT'] as const;
export type ProcessAction = typeof PROCESS_ACTIONS[number]|keyof typeof RESERVATION_PATHS|keyof typeof LATE_INITIAL_PATHS;

export const PENDING_REJECTION_REASONS = {
  unavailable: 'Producto o servicio no disponible', cannot_meet_schedule: 'No puedo cumplir el horario',
  outside_service_area: 'Fuera de mi zona de atención', insufficient_information: 'Falta información',
  no_capacity: 'No tengo capacidad para atender', other: 'Otro motivo',
} as const;
export type PendingRejectionReason = keyof typeof PENDING_REJECTION_REASONS;
export function validPendingRejectionReason(code: unknown): code is PendingRejectionReason {
  return typeof code === 'string' && Object.hasOwn(PENDING_REJECTION_REASONS, code);
}
export function validPendingRejectionDetail(code: PendingRejectionReason, detail: unknown) {
  return code === 'other' ? typeof detail === 'string' && detail === detail.trim() && detail.length > 0 && detail.length <= 1000 : detail === null;
}

export type RequestProcessSummary = {
  productPreview?:ProductPreview;requestedProductPreview?:ProductPreview;
  flowContract?: 'LEGACY_V1' | 'AVAILABILITY_V1'|'AVAILABILITY_V2'|'AVAILABILITY_V3';
  serverNow?:string;reservationChoice?:ReservationChoice;reservation?:Reservation;reservationFollowUp?:ReservationFollowUp;
  availability?: AvailabilityPlan;
  lateInitialResponse?:LateInitialView;
  customerContactPreference?: {
    allowed: boolean;
    textVersion: 'availability-customer-whatsapp-v1';
    recordedAt: string;
    effective: false;
    requiresReconfirmation: boolean;
  };
  id: number;
  state: string;
  version: number;
  currentProposalId: number;
  agreementPublicId: string | null;
  allowedActions: ProcessAction[];
  proposalSummary?: { type: string; subjectSchemaVersion: 2; totalPriceClp: number; scheduledFor: string | null };
  readyNoticeAcknowledged?: boolean;
  closure?: { reasonCode: 'CUSTOMER_CANCELLED_BEFORE_RESPONSE'; reasonDetail: null; actor: 'CUSTOMER'; actorUserId: number; closedAt: string }
    | { reasonCode: PendingRejectionReason; reasonDetail: string | null; actor: 'BUSINESS'; actorUserId: number; closedAt: string }
    | { reasonCode: 'CUSTOMER_REJECTED_PROPOSAL' | 'BUSINESS_REJECTED_COUNTER_PROPOSAL'; reasonDetail: null; actor: 'CUSTOMER' | 'BUSINESS'; actorUserId: number; closedAt: string }
    | { reasonCode: AvailabilityClosureReason; reasonDetail: string | null; actor: 'CUSTOMER' | 'BUSINESS'; actorUserId: number; closedAt: string };
  coordination?: { customerContactAuthorized: boolean; businessContactAuthorized: boolean };
};

// Absent/null is legacy. A separate marker keeps malformed objects fail closed.
export type ProcessOrder = { requestProcess?: RequestProcessSummary | null; requestProcessInvalid?: boolean };
export const hasRequestProcess = (order: ProcessOrder) => order.requestProcess != null || order.requestProcessInvalid === true;

export function normalizeOrderProcess(value: unknown): ProcessOrder {
  if (value == null) return { requestProcess: null };
  const requestProcess = normalizeRequestProcess(value);
  return requestProcess ? { requestProcess } : { requestProcess: null, requestProcessInvalid: true };
}
export const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export function normalizeRequestProcess(value: unknown): RequestProcessSummary | null {
  if (!isRecord(value) || !positiveInteger(value.id) ||
      !positiveInteger(value.version) || !positiveInteger(value.currentProposalId) ||
      typeof value.state !== 'string' || !value.state.trim() ||
      !(value.agreementPublicId === null ||
        (typeof value.agreementPublicId === 'string' && value.agreementPublicId.trim())) ||
      !Array.isArray(value.allowedActions) ||
      !value.allowedActions.every((action) => PROCESS_ACTIONS.includes(action as typeof PROCESS_ACTIONS[number])||Object.hasOwn(RESERVATION_PATHS,String(action))||Object.hasOwn(LATE_INITIAL_PATHS,String(action)))) return null;
  if (value.readyNoticeAcknowledged !== undefined && typeof value.readyNoticeAcknowledged !== 'boolean') return null;
  if (value.flowContract !== undefined && !['LEGACY_V1','AVAILABILITY_V1','AVAILABILITY_V2','AVAILABILITY_V3'].includes(String(value.flowContract))) return null;
  const availability = value.availability === undefined ? undefined : normalizeAvailability(value.availability, value.currentProposalId);
  if (availability === null || (value.availability !== undefined && !availabilityFlow(value)) ||
    (!availabilityFlow(value) && (value.state === 'AWAITING_CUSTOMER_CONTINUATION' || value.allowedActions.some(a => Object.hasOwn(AVAILABILITY_ACTION_PATHS, String(a))))) ||
    (availabilityFlow(value) && (value.allowedActions.includes('ACCEPT_FIXED_ORDER') ||
      (value.state === 'AWAITING_CUSTOMER_CONTINUATION' || value.agreementPublicId !== null) && !availability))) return null;
  const choice=value.reservationChoice===undefined?undefined:normalizeReservationChoice(value.reservationChoice),reservation=value.reservation===undefined?undefined:normalizeReservation(value.reservation,simplifiedReservationFlow(value)),followUp=value.reservationFollowUp===undefined?undefined:normalizeReservationFollowUp(value.reservationFollowUp);
  if(choice===null||reservation===null||followUp===null||value.serverNow!==undefined&&!parseIsoDate(value.serverNow)||
    (!reservationFlow(value)&&(availability?.reservationOffer||choice||reservation||followUp||value.allowedActions.some(a=>Object.hasOwn(RESERVATION_PATHS,String(a)))))||
    reservationFlow(value)&&availability?.path==='LOCAL_PICKUP'&&!availability.reservationOffer||
    reservation&&(availability?.path!=='LOCAL_PICKUP'||!choice||choice.choice!=='REQUEST_RESERVATION'||choice.offerId!==availability.availabilityConfirmationId||availability.reservationOffer?.mode!==reservation.mode)||
    followUp&&reservation?.mode!=='PREPAYMENT'||choice&&availability&&choice.offerId!==availability.availabilityConfirmationId||
    choice?.choice==='REQUEST_RESERVATION'&&!reservation||reservation&&(!value.serverNow||!value.agreementPublicId)||
    reservation?.mode==='PREPAYMENT'&&(!followUp||reservation.paymentReceiptDeclaration&&availability?.reservationOffer?.mode==='PREPAYMENT'&&reservation.paymentReceiptDeclaration.amountClp!==availability.reservationOffer.requiredAmountClp))return null;
   const simple=simplifiedReservationFlow(value),offer=availability?.reservationOffer;
   if(offer&&offer.mode!=='NONE'&&(simple!==isSimpleOffer(offer))||!simple&&(choice?.termsVersion||choice?.noReservationAcknowledged||followUp?.paymentConfirmationReminder||value.allowedActions.includes('CANCEL_PICKUP_RESERVATION'))||
     simple&&choice&&availability?.path==='LOCAL_PICKUP'&&(choice.choice==='NONE'&&choice.noReservationAcknowledged!==true||offer&&isSimpleOffer(offer)&&choice.termsVersion!==offer.simplified.termsVersion)||
     simple&&followUp&&(!followUp.paymentConfirmationReminder||followUp.paymentConfirmationReminder.reservationId!==reservation?.id||followUp.paymentConfirmationReminder.expectedVersion!==value.version||followUp.paymentConfirmationReminder.eligible!==followUp.allowedActions.includes('CONFIRM_PICKUP_RESERVATION'))||
     simple&&reservation?.mode==='FREE'&&value.allowedActions.some(a=>['CONFIRM_PICKUP_RESERVATION','DECLINE_PICKUP_RESERVATION'].includes(String(a))))return null;
   let customerContactPreference: RequestProcessSummary['customerContactPreference'];
  if (value.customerContactPreference !== undefined) {
    const p = value.customerContactPreference;
    if (!isRecord(p) || typeof p.allowed !== 'boolean' || p.textVersion !== 'availability-customer-whatsapp-v1' ||
      typeof p.recordedAt !== 'string' || !Number.isFinite(Date.parse(p.recordedAt)) ||
      p.effective !== false || typeof p.requiresReconfirmation !== 'boolean' || (!p.allowed && p.requiresReconfirmation)) return null;
    customerContactPreference = { allowed: p.allowed, textVersion: p.textVersion, recordedAt: p.recordedAt,
      effective: false, requiresReconfirmation: p.requiresReconfirmation };
  }
  let proposalSummary: RequestProcessSummary['proposalSummary'];
  if (value.proposalSummary !== undefined) {
    const s = value.proposalSummary;
    if (!isRecord(s) || !['BUSINESS_PROPOSAL', 'CUSTOMER_COUNTER', 'BUSINESS_FINAL'].includes(String(s.type)) ||
      s.subjectSchemaVersion !== 2 || !positiveInteger(s.totalPriceClp) || s.totalPriceClp > 50000000 ||
      !(s.scheduledFor === null || typeof s.scheduledFor === 'string' && Number.isFinite(Date.parse(s.scheduledFor)))) return null;
    proposalSummary = { type: s.type as string, subjectSchemaVersion: 2, totalPriceClp: s.totalPriceClp, scheduledFor: s.scheduledFor as string | null };
  }
  if (value.coordination !== undefined && (!isRecord(value.coordination) ||
    typeof value.coordination.customerContactAuthorized !== 'boolean' ||
    typeof value.coordination.businessContactAuthorized !== 'boolean')) return null;
  let closure: RequestProcessSummary['closure'] = isRecord(value.closure) && value.closure.reasonCode === 'CUSTOMER_CANCELLED_BEFORE_RESPONSE'
    && value.closure.reasonDetail === null && value.closure.actor === 'CUSTOMER'
    && positiveInteger(value.closure.actorUserId) && value.closure.actorUserId <= 2147483647
    && typeof value.closure.closedAt === 'string' && Number.isFinite(Date.parse(value.closure.closedAt))
    ? { reasonCode: 'CUSTOMER_CANCELLED_BEFORE_RESPONSE' as const, reasonDetail: null,
      actor: 'CUSTOMER' as const, actorUserId: value.closure.actorUserId, closedAt: value.closure.closedAt } : undefined;
  if (isRecord(value.closure) && value.closure.reasonCode === 'CUSTOMER_CANCELLED_BEFORE_RESPONSE' && !closure) return null;
  if (isRecord(value.closure) && validPendingRejectionReason(value.closure.reasonCode)) {
    const raw = value.closure;
    if (raw.actor !== 'BUSINESS' || !positiveInteger(raw.actorUserId) || raw.actorUserId > 2147483647 ||
        typeof raw.closedAt !== 'string' || !Number.isFinite(Date.parse(raw.closedAt)) ||
        !validPendingRejectionDetail(raw.reasonCode as PendingRejectionReason, raw.reasonDetail) ||
        value.state !== 'CLOSED' || value.agreementPublicId !== null || value.allowedActions.length !== 0) return null;
    closure = { reasonCode: raw.reasonCode as PendingRejectionReason, reasonDetail: raw.reasonDetail as string | null,
      actor: 'BUSINESS', actorUserId: raw.actorUserId, closedAt: raw.closedAt };
  }
  if (isRecord(value.closure) && ['CUSTOMER_REJECTED_PROPOSAL', 'BUSINESS_REJECTED_COUNTER_PROPOSAL'].includes(String(value.closure.reasonCode))) {
    const c = value.closure;
    if (value.state !== 'CLOSED' || value.agreementPublicId !== null || value.allowedActions.length || c.reasonDetail !== null ||
      c.actor !== (c.reasonCode === 'CUSTOMER_REJECTED_PROPOSAL' ? 'CUSTOMER' : 'BUSINESS') || !positiveInteger(c.actorUserId) ||
      typeof c.closedAt !== 'string' || !Number.isFinite(Date.parse(c.closedAt))) return null;
    closure = { reasonCode: c.reasonCode as 'CUSTOMER_REJECTED_PROPOSAL' | 'BUSINESS_REJECTED_COUNTER_PROPOSAL', reasonDetail: null,
      actor: c.actor as 'CUSTOMER' | 'BUSINESS', actorUserId: c.actorUserId, closedAt: c.closedAt };
  }
  if (isRecord(value.closure) && AVAILABILITY_CLOSURES.includes(value.closure.reasonCode as AvailabilityClosureReason)) {
    const c = value.closure, pickup = c.reasonCode === 'PICKUP_CANCELLED';
    if (!availabilityFlow(value) || value.state !== 'CLOSED' || value.allowedActions.length ||
      !positiveInteger(c.actorUserId) || c.actorUserId > 2147483647 || typeof c.closedAt !== 'string' || !Number.isFinite(Date.parse(c.closedAt)) ||
      (pickup ? !value.agreementPublicId || availability?.path !== 'LOCAL_PICKUP' || !['CUSTOMER','BUSINESS'].includes(String(c.actor)) ||
        typeof c.reasonDetail !== 'string' || c.reasonDetail !== c.reasonDetail.trim() || Array.from(c.reasonDetail).length < 3 || Array.from(c.reasonDetail).length > 1000
        : value.agreementPublicId !== null || c.reasonDetail !== null || c.actor !== (c.reasonCode === 'CUSTOMER_DECLINED_CONTINUATION' ? 'CUSTOMER' : 'BUSINESS'))) return null;
    closure = { reasonCode: c.reasonCode as AvailabilityClosureReason, reasonDetail: c.reasonDetail as string | null,
      actor: c.actor as 'CUSTOMER' | 'BUSINESS', actorUserId: c.actorUserId, closedAt: c.closedAt };
  }
   const late=value.lateInitialResponse===undefined?undefined:normalizeLateInitial(value.lateInitialResponse);
   if(late===null||late&&(value.flowContract!=='AVAILABILITY_V3'||value.agreementPublicId!==null||availability||reservation||proposalSummary||
     !['AWAITING_BUSINESS_RESPONSE','CLOSED'].includes(value.state)||
     (['NO_LONGER_NEEDED','BUSINESS_UNAVAILABLE'].includes(late.status)!==(value.state==='CLOSED'))||
     late.status==='NO_LONGER_NEEDED'&&closure?.reasonCode!=='CUSTOMER_CANCELLED_BEFORE_RESPONSE'||
     late.status==='BUSINESS_UNAVAILABLE'&&closure?.reasonCode!=='cannot_meet_schedule')||
     value.allowedActions.some(a=>Object.hasOwn(LATE_INITIAL_PATHS,String(a)))&&!late)return null;
   const visual=normalizeProductPreview(value.productPreview,value.currentProposalId);
   const productPreview=visual&&(!proposalSummary||visual.items.reduce((sum,item)=>sum+item.subtotalClp,0)===proposalSummary.totalPriceClp)?visual:undefined;
   const requestedProductPreview=normalizeProductPreview(value.requestedProductPreview);
   return {
    id: value.id, state: value.state, version: value.version,
    currentProposalId: value.currentProposalId,
    agreementPublicId: value.agreementPublicId as string | null,
    allowedActions: [...value.allowedActions] as RequestProcessSummary['allowedActions'],
    ...(productPreview?{productPreview}:{}),
    ...(requestedProductPreview&&requestedProductPreview.proposalId!==value.currentProposalId?{requestedProductPreview}:{}),
    ...(value.flowContract ? { flowContract: value.flowContract as RequestProcessSummary['flowContract'] } : {}),
    ...(availability ? { availability } : {}),
    ...(late?{lateInitialResponse:late}:{}),
    ...(value.serverNow?{serverNow:value.serverNow as string}:{}),...(choice?{reservationChoice:choice}:{}),...(reservation?{reservation}:{}),...(followUp?{reservationFollowUp:followUp}:{}),
    ...(closure ? { closure } : {}),
    ...(customerContactPreference ? { customerContactPreference } : {}),
    ...(proposalSummary ? { proposalSummary } : {}),
    ...(typeof value.readyNoticeAcknowledged === 'boolean' ? { readyNoticeAcknowledged: value.readyNoticeAcknowledged } : {}),
    ...(isRecord(value.coordination) ? { coordination: {
      customerContactAuthorized: value.coordination.customerContactAuthorized as boolean,
      businessContactAuthorized: value.coordination.businessContactAuthorized as boolean,
    } } : {}),
  };
}

export function isPendingRequestCancelled(process: RequestProcessSummary | null | undefined) {
  return process?.state === 'CLOSED' && process.agreementPublicId === null && process.allowedActions.length === 0 &&
    process.closure?.reasonCode === 'CUSTOMER_CANCELLED_BEFORE_RESPONSE' && process.closure.actor === 'CUSTOMER';
}

export function isPendingRequestRejected(process: RequestProcessSummary | null | undefined) {
  return process?.state === 'CLOSED' && process.agreementPublicId === null && process.allowedActions.length === 0 &&
    process.closure?.actor === 'BUSINESS' && validPendingRejectionReason(process.closure.reasonCode);
}

export function canAcceptFixedOrder(order: ProcessOrder): boolean {
  return order.requestProcess?.state === 'AWAITING_BUSINESS_RESPONSE' &&
    order.requestProcess.allowedActions.includes('ACCEPT_FIXED_ORDER');
}

export function processStatusLabel(order: ProcessOrder): string {
  const late=order.requestProcess?.lateInitialResponse;
  if(late)return late.status==='OUT_OF_TIME'?'Fuera de hora':late.status==='AWAITING_CUSTOMER'?'Esperando respuesta del cliente':late.status==='STILL_NEEDED'?'Falta acordar una nueva hora':late.status==='NO_LONGER_NEEDED'?'El cliente ya no necesita el pedido':'El negocio no podrá atender';
  if (order.requestProcess?.state === 'AWAITING_CUSTOMER_CONTINUATION') return 'Disponibilidad por confirmar';
  if (isAvailabilityClosed(order.requestProcess)) return 'Solicitud finalizada';
  if (order.requestProcess?.state === 'AWAITING_CUSTOMER_DECISION') return 'Alternativa por responder';
  if (order.requestProcess?.state === 'AWAITING_CUSTOMER_FINAL_DECISION') return 'Propuesta final por responder';
  if (order.requestProcess?.state === 'AWAITING_BUSINESS_COUNTER_RESPONSE') return 'Contrapropuesta por responder';
  if (isProposalRejected(order.requestProcess)) return 'Propuesta rechazada';
  if (isPendingRequestCancelled(order.requestProcess)) return 'Anulada por el cliente';
  if (isPendingRequestRejected(order.requestProcess)) return 'Rechazada';
  if (order.requestProcess?.state === 'AWAITING_BUSINESS_RESPONSE') return 'Pendiente de respuesta';
  if (order.requestProcess?.state === 'COORDINATION_PENDING') return 'Coordinación pendiente';
  if (order.requestProcess?.state === 'COORDINATING') return 'Coordinando';
  if (order.requestProcess?.state === 'IN_PROGRESS') return order.requestProcess.availability?.path === 'LOCAL_PICKUP' ? 'Pendiente de retiro en el local' : 'En curso';
  if (order.requestProcess?.state === 'READY') return order.requestProcess.readyNoticeAcknowledged === true ? 'Pendiente de retiro' : 'Pedido listo';
  if (order.requestProcess?.state === 'COMPLETED') return 'Completado';
  if (order.requestProcess?.state === 'COORDINATION_CANCELLED') return 'Anulada';
  return 'Estado del proceso no disponible. Actualiza el pedido.';
}

export const COORDINATION_ACCEPTED_MESSAGE =
  'El negocio aceptó tu pedido. Falta coordinar los siguientes pasos.';

export function orderNotificationState(order: { status: string } & ProcessOrder): string {
  const late=order.requestProcess?.lateInitialResponse;
  if(late)return `late:${late.queryId??'none'}:${late.status}`;
  if (order.requestProcess?.proposalSummary) return `proposal:${order.requestProcess.currentProposalId}:${order.requestProcess.state}`;
  return hasRequestProcess(order) ? `process:${order.requestProcess?.state ?? 'invalid'}` : order.status;
}

export function isProposalRejected(process: RequestProcessSummary | null | undefined) {
  return process?.state === 'CLOSED' && ['CUSTOMER_REJECTED_PROPOSAL', 'BUSINESS_REJECTED_COUNTER_PROPOSAL'].includes(process.closure?.reasonCode ?? '');
}

export function isAvailabilityClosed(process: RequestProcessSummary | null | undefined) {
  return availabilityFlow(process) && process?.state === 'CLOSED' && AVAILABILITY_CLOSURES.includes(process.closure?.reasonCode as AvailabilityClosureReason);
}
