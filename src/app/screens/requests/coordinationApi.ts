import { API_BASE_URL } from '../../api/apiConfig';
import { isRecord } from './orderValueParsers';
import { isPendingRequestCancelled, normalizeRequestProcess, type RequestProcessSummary } from './requestProcess';
import { processApiError, RequestProcessError } from './requestProcessErrors';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';

export const COORDINATION_PATHS = {
  AUTHORIZE_CONTACT: 'authorize-contact', OPEN_WHATSAPP: 'open-whatsapp',
  START_WORK: 'start-work', MARK_READY: 'mark-ready', ANNUL_COORDINATION: 'annul-coordination',
  ACK_READY_NOTICE: 'ack-ready-notice', CONFIRM_RECEIPT: 'confirm-receipt',
  CANCEL_PENDING_REQUEST: 'cancel-pending-request',
} as const;
export type CoordinationAction = keyof typeof COORDINATION_PATHS;
export const ANNUL_REASONS = {
  COORDINATION_NOT_REACHED: 'No logramos coordinar los detalles.',
  COUNTERPART_NOT_RESPONDING: 'La otra parte no responde.', OTHER: 'Otro motivo',
} as const;
export type AnnulReason = keyof typeof ANNUL_REASONS;
export type CoordinationBody = { expectedVersion: number; consentAccepted?: true; confirmationAccepted?: true; reasonCode?: AnnulReason; reasonDetail?: string };
export type CoordinationReceipt = { orderId: number; orderStatus: 'accepted' | 'cancelled' | 'ready' | 'completed'; requestProcess: RequestProcessSummary };

export function coordinationError(status: number, payload: unknown) {
  if (status >= 500) return new RequestProcessError('No se pudo confirmar la operación. Reintenta la misma solicitud.', status);
  if (status === 400) return new RequestProcessError('La solicitud no es válida. Actualiza el pedido y revisa sus datos.', status, true);
  return processApiError(status, payload);
}

export function whatsappUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value !== value.trim() || !value.startsWith('https://wa.me/')) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'wa.me' && !url.port && !url.username && !url.password &&
      /^\/[1-9]\d{5,14}$/.test(url.pathname) && !url.hash && url.searchParams.getAll('text').length === 1 &&
      [...url.searchParams.keys()].every((key) => key === 'text') ? value : null;
  } catch { return null; }
}

export function coordinationBody(action: CoordinationAction, version: number, reason?: AnnulReason, detail = ''): CoordinationBody {
  if (action === 'ACK_READY_NOTICE' || action === 'CONFIRM_RECEIPT' || action === 'CANCEL_PENDING_REQUEST')
    return { expectedVersion: version, confirmationAccepted: true };
  if (action === 'ANNUL_COORDINATION') {
    const trimmed = detail.trim();
    if (!reason || !Object.hasOwn(ANNUL_REASONS, reason) || (reason === 'OTHER' && (!trimmed || trimmed.length > 1000)))
      throw new RequestProcessError('Selecciona un motivo. Para Otro motivo escribe una explicación de hasta 1000 caracteres.', 0);
    return { expectedVersion: version, reasonCode: reason, ...(reason === 'OTHER' ? { reasonDetail: trimmed } : {}) };
  }
  return { expectedVersion: version, ...(['AUTHORIZE_CONTACT', 'OPEN_WHATSAPP'].includes(action) ? { consentAccepted: true as const } : {}) };
}

export function coordinationAllowed(process: RequestProcessSummary | null | undefined, business: boolean, action: CoordinationAction) {
  if (!process?.allowedActions.includes(action)) return false;
  if (action === 'CANCEL_PENDING_REQUEST') return !business && process.state === 'AWAITING_BUSINESS_RESPONSE' && process.agreementPublicId === null;
  if (!process.agreementPublicId) return false;
  // Readiness does not depend on phone numbers or contact consent.
  if (action === 'MARK_READY') return business && process.state === 'IN_PROGRESS';
  if (action === 'ACK_READY_NOTICE') return !business && process.state === 'READY' && process.readyNoticeAcknowledged !== true;
  if (action === 'CONFIRM_RECEIPT') return !business && process.state === 'READY' && process.readyNoticeAcknowledged === true;
  if (!process.coordination) return false;
  const coordinating = ['COORDINATION_PENDING', 'COORDINATING'].includes(process.state);
  if (action === 'AUTHORIZE_CONTACT') return !business && coordinating;
  if (action === 'START_WORK') return business && coordinating;
  if (action === 'OPEN_WHATSAPP' && !business && !process.coordination.customerContactAuthorized) return false;
  return action === 'ANNUL_COORDINATION' ? coordinating : coordinating || process.state === 'IN_PROGRESS' || process.state === 'READY';
}

export async function sendCoordination(processId: number, orderId: number, action: CoordinationAction, body: CoordinationBody, token: string, key: string, signal?: AbortSignal, expectedProposalId?: number) {
  const cancellation = action === 'CANCEL_PENDING_REQUEST';
  if (cancellation && (![processId, orderId, expectedProposalId, body.expectedVersion].every(value => typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647) ||
    body.confirmationAccepted !== true || Object.keys(body).sort().join(',') !== 'confirmationAccepted,expectedVersion' ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(key)))
    throw new RequestProcessError('No se pudo preparar la anulación. Actualiza el pedido.', 400, true);
  const response = await fetch(`${API_BASE_URL}/request-processes/${processId}/actions/${COORDINATION_PATHS[action]}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal,
  });
  let payload: unknown; try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) {
    if (cancellation && response.status === 409 && isRecord(payload) && ['STALE_VERSION', 'INCOMPATIBLE_STATE'].includes(String(payload.code)))
      throw new RequestProcessError('El pedido cambió o el negocio ya respondió. Actualiza su estado; no se anulará automáticamente.', 409, true);
    throw coordinationError(response.status, payload);
  }
  const raw = action === 'OPEN_WHATSAPP' && isRecord(payload) ? payload.result : payload;
  const process = isRecord(raw) ? normalizeRequestProcess(raw.requestProcess) : null;
  const customerConfirmation = action === 'ACK_READY_NOTICE' || action === 'CONFIRM_RECEIPT';
  const expectedStatus = action === 'CONFIRM_RECEIPT' ? 'completed'
    : action === 'ANNUL_COORDINATION' || cancellation ? 'cancelled'
      : action === 'MARK_READY' || action === 'ACK_READY_NOTICE' || (action === 'OPEN_WHATSAPP' && process?.state === 'READY') ? 'ready' : 'accepted';
  const states = cancellation ? ['CLOSED'] : action === 'ANNUL_COORDINATION' ? ['COORDINATION_CANCELLED']
    : action === 'CONFIRM_RECEIPT' ? ['COMPLETED'] : action === 'ACK_READY_NOTICE' || action === 'MARK_READY' ? ['READY'] : action === 'START_WORK' ? ['IN_PROGRESS']
      : action === 'OPEN_WHATSAPP' ? ['COORDINATION_PENDING', 'COORDINATING', 'IN_PROGRESS', 'READY'] : ['COORDINATION_PENDING', 'COORDINATING', 'IN_PROGRESS'];
  if (!isRecord(raw) || raw.orderId !== orderId || raw.orderStatus !== expectedStatus || !process || process.id !== processId ||
    process.version < body.expectedVersion || ((action === 'MARK_READY' || customerConfirmation) && process.version === body.expectedVersion) ||
    (customerConfirmation && process.readyNoticeAcknowledged === false) || !states.includes(process.state) ||
    (cancellation ? !isPendingRequestCancelled(process) || process.version !== body.expectedVersion + 1 || process.currentProposalId !== expectedProposalId : !process.agreementPublicId))
    throw new RequestProcessError('No se pudo confirmar la operación. Reintenta la misma solicitud.', 502);
  const result: CoordinationReceipt = { orderId, orderStatus: expectedStatus, requestProcess: process };
  if (action !== 'OPEN_WHATSAPP') return { result, navigation: null };
  if (!isRecord(payload)) throw new RequestProcessError('No se pudo verificar el acceso a WhatsApp. Reintenta la misma solicitud.', 502);
  if (payload.navigation === null && payload.navigationUnavailableReason === 'CONTACT_NOT_AVAILABLE') return { result, navigation: null };
  const url = isRecord(payload.navigation) ? whatsappUrl(payload.navigation.url) : null;
  if (!url) throw new RequestProcessError('No se pudo verificar el acceso a WhatsApp. Reintenta la misma solicitud.', 502);
  return { result, navigation: { url } };
}

export async function refreshCoordinationOrder(orderId: number, business: boolean, token: string,
  businessId = localStorage.getItem('zipco-business-id'), signal?: AbortSignal) {
  if (business && (!businessId || !/^[1-9]\d*$/.test(businessId))) throw new RequestProcessError('No se pudo verificar el negocio. Actualiza la pantalla.', 0);
  const response = await fetch(`${API_BASE_URL}/orders/${business ? `business/${businessId}` : 'my-orders'}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!response.ok) throw coordinationError(response.status, null);
  const payload: unknown = await response.json();
  const orders = business ? normalizeBusinessOrdersPayload(payload) : normalizeMyOrdersPayload(payload);
  return orders.find((order) => order.recordState === 'available' && order.id === orderId) ?? null;
}
