import { API_BASE_URL } from '../../api/apiConfig';
import { isRecord } from './orderValueParsers';
import { normalizeRequestProcess, type RequestProcessSummary } from './requestProcess';
import { processApiError, RequestProcessError } from './requestProcessErrors';
import { AVAILABILITY_ACTION_PATHS, availabilityFlow, type AvailabilityAction, type FulfillmentChoice } from './availabilityContract';
import type { CustomerContactPreference } from '../createOrderApi';

export type AvailabilityBody = { expectedVersion: number; proposalId?: number; availabilityConfirmationId?: number;
  fulfillment?: FulfillmentChoice; conditionsAccepted?: true; customerContactPreference?: CustomerContactPreference;
  acceptPastSchedule?: true; reasonDetail?: string };
export type AvailabilityReceipt = { orderId: number; orderStatus: 'pending' | 'accepted' | 'cancelled' | 'ready'; requestProcess: RequestProcessSummary };
export class AvailabilityError extends RequestProcessError {
  constructor(message: string, status: number, readonly code = '', refresh = false) { super(message,status,refresh); }
}
export function availabilityAllowed(process: RequestProcessSummary | null | undefined, business: boolean, action: AvailabilityAction) {
  if (!process || !availabilityFlow(process) || !process.allowedActions.includes(action)) return false;
  if (action === 'CONFIRM_AVAILABILITY') return business && process.state === 'AWAITING_BUSINESS_RESPONSE' && !process.agreementPublicId;
  if (['CONTINUE_REQUEST','DECLINE_REQUEST','WITHDRAW_AVAILABILITY'].includes(action)) return process.state === 'AWAITING_CUSTOMER_CONTINUATION' &&
    !process.agreementPublicId && !!process.availability && business === (action === 'WITHDRAW_AVAILABILITY');
  if (action === 'CANCEL_PICKUP') return process.state === 'IN_PROGRESS' && process.availability?.path === 'LOCAL_PICKUP' && !!process.agreementPublicId;
  return ['COORDINATION_PENDING','COORDINATING','IN_PROGRESS','READY'].includes(process.state) && !!process.agreementPublicId &&
    process.coordination?.[business ? 'businessContactAuthorized' : 'customerContactAuthorized'] === true;
}
export async function sendAvailabilityAction(process: RequestProcessSummary, orderId: number, business: boolean,
  action: AvailabilityAction, body: AvailabilityBody, token: string, key: string, signal?: AbortSignal): Promise<AvailabilityReceipt> {
  if (!availabilityAllowed(process,business,action) || body.expectedVersion !== process.version ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(key)) throw new AvailabilityError('Actualiza el pedido antes de confirmar.',0);
  const response = await fetch(`${API_BASE_URL}/request-processes/${process.id}/actions/${AVAILABILITY_ACTION_PATHS[action]}`, {
    method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body),signal,
  });
  const raw: unknown = await response.json().catch(()=>null);
  if (!response.ok) {
    const code = isRecord(raw) && typeof raw.code === 'string' ? raw.code : '';
    const e = processApiError(response.status,raw);
    throw new AvailabilityError(code === 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED' ? 'La fecha y hora solicitadas ya pasaron. Confirma si quieres continuar igualmente.'
      : response.status >= 500 ? 'No se pudo confirmar el resultado. Reintenta la misma operación.' : e.message,response.status,code,e.refreshConditions);
  }
  const p = isRecord(raw) ? normalizeRequestProcess(raw.requestProcess) : null;
  const confirming = action === 'CONFIRM_AVAILABILITY', continuing = action === 'CONTINUE_REQUEST', revoking = action === 'REVOKE_CONTACT_CONSENT';
  const expectedState = confirming ? 'AWAITING_CUSTOMER_CONTINUATION' : continuing ? process.availability?.path === 'LOCAL_PICKUP' ? 'IN_PROGRESS' : 'COORDINATION_PENDING' : revoking ? process.state : 'CLOSED';
  const expectedStatus = confirming ? 'pending' : continuing ? 'accepted' : revoking ? process.state === 'READY' ? 'ready' : 'accepted' : 'cancelled';
  const closeReason = action === 'DECLINE_REQUEST' ? 'CUSTOMER_DECLINED_CONTINUATION' : action === 'WITHDRAW_AVAILABILITY' ? 'BUSINESS_WITHDREW_AVAILABILITY' : action === 'CANCEL_PICKUP' ? 'PICKUP_CANCELLED' : null;
  if (!isRecord(raw) || raw.orderId !== orderId || raw.orderStatus !== expectedStatus || !p || !availabilityFlow(p) || p.id !== process.id ||
    p.currentProposalId !== process.currentProposalId || p.version !== process.version + (continuing ? 2 : 1) || p.state !== expectedState || p.allowedActions.length ||
    (continuing ? !p.agreementPublicId : confirming || action === 'DECLINE_REQUEST' || action === 'WITHDRAW_AVAILABILITY' ? p.agreementPublicId !== null : p.agreementPublicId !== process.agreementPublicId) ||
    (confirming ? !p.availability || p.availability.path !== body.fulfillment?.path : p.availability?.availabilityConfirmationId !== process.availability?.availabilityConfirmationId) ||
    (closeReason && (p.closure?.reasonCode !== closeReason || p.closure.actor !== (business ? 'BUSINESS' : 'CUSTOMER'))) ||
    (action === 'CANCEL_PICKUP' && p.closure?.reasonDetail !== body.reasonDetail)) throw new AvailabilityError('No se pudo verificar el recibo. Reintenta la misma operación.',502);
  return {orderId,orderStatus:raw.orderStatus as AvailabilityReceipt['orderStatus'],requestProcess:p};
}
