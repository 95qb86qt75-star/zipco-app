import { isRecord } from './orderValueParsers';

export const PROCESS_ACTIONS = ['ACCEPT_FIXED_ORDER', 'AUTHORIZE_CONTACT', 'OPEN_WHATSAPP', 'START_WORK', 'MARK_READY', 'ACK_READY_NOTICE', 'CONFIRM_RECEIPT', 'ANNUL_COORDINATION', 'CANCEL_PENDING_REQUEST'] as const;
export type ProcessAction = typeof PROCESS_ACTIONS[number];

export type RequestProcessSummary = {
  id: number;
  state: string;
  version: number;
  currentProposalId: number;
  agreementPublicId: string | null;
  allowedActions: ProcessAction[];
  readyNoticeAcknowledged?: boolean;
  closure?: { reasonCode: 'CUSTOMER_CANCELLED_BEFORE_RESPONSE'; reasonDetail: null; actor: 'CUSTOMER'; actorUserId: number; closedAt: string };
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
      !value.allowedActions.every((action) => PROCESS_ACTIONS.includes(action as ProcessAction))) return null;
  if (value.readyNoticeAcknowledged !== undefined && typeof value.readyNoticeAcknowledged !== 'boolean') return null;
  if (value.coordination !== undefined && (!isRecord(value.coordination) ||
    typeof value.coordination.customerContactAuthorized !== 'boolean' ||
    typeof value.coordination.businessContactAuthorized !== 'boolean')) return null;
  const closure = isRecord(value.closure) && value.closure.reasonCode === 'CUSTOMER_CANCELLED_BEFORE_RESPONSE'
    && value.closure.reasonDetail === null && value.closure.actor === 'CUSTOMER'
    && positiveInteger(value.closure.actorUserId) && value.closure.actorUserId <= 2147483647
    && typeof value.closure.closedAt === 'string' && Number.isFinite(Date.parse(value.closure.closedAt))
    ? { reasonCode: 'CUSTOMER_CANCELLED_BEFORE_RESPONSE' as const, reasonDetail: null,
      actor: 'CUSTOMER' as const, actorUserId: value.closure.actorUserId, closedAt: value.closure.closedAt } : undefined;
  if (isRecord(value.closure) && value.closure.reasonCode === 'CUSTOMER_CANCELLED_BEFORE_RESPONSE' && !closure) return null;
  return {
    id: value.id, state: value.state, version: value.version,
    currentProposalId: value.currentProposalId,
    agreementPublicId: value.agreementPublicId as string | null,
    allowedActions: [...value.allowedActions] as RequestProcessSummary['allowedActions'],
    ...(closure ? { closure } : {}),
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

export function canAcceptFixedOrder(order: ProcessOrder): boolean {
  return order.requestProcess?.state === 'AWAITING_BUSINESS_RESPONSE' &&
    order.requestProcess.allowedActions.includes('ACCEPT_FIXED_ORDER');
}

export function processStatusLabel(order: ProcessOrder): string {
  if (isPendingRequestCancelled(order.requestProcess)) return 'Anulada por el cliente';
  if (order.requestProcess?.state === 'AWAITING_BUSINESS_RESPONSE') return 'Pendiente de respuesta';
  if (order.requestProcess?.state === 'COORDINATION_PENDING') return 'Coordinación pendiente';
  if (order.requestProcess?.state === 'COORDINATING') return 'Coordinando';
  if (order.requestProcess?.state === 'IN_PROGRESS') return 'En curso';
  if (order.requestProcess?.state === 'READY') return order.requestProcess.readyNoticeAcknowledged === true ? 'Pendiente de retiro' : 'Pedido listo';
  if (order.requestProcess?.state === 'COMPLETED') return 'Completado';
  if (order.requestProcess?.state === 'COORDINATION_CANCELLED') return 'Anulada';
  return 'Estado del proceso no disponible. Actualiza el pedido.';
}

export const COORDINATION_ACCEPTED_MESSAGE =
  'El negocio aceptó tu pedido. Falta coordinar los siguientes pasos.';

export function orderNotificationState(order: { status: string } & ProcessOrder): string {
  return hasRequestProcess(order) ? `process:${order.requestProcess?.state ?? 'invalid'}` : order.status;
}
