import { API_BASE_URL } from '../../api/apiConfig';
import { isRecord } from './orderValueParsers';
import { normalizeRequestProcess, type RequestProcessSummary } from './requestProcess';
import { normalizeProposals, PROPOSAL_PATHS, type ProposalAction } from './proposalContract';
import { processApiError, RequestProcessError } from './requestProcessErrors';
import { getCloudinarySecureImageUrl } from '../profile/business-config/catalogValidation';
import { AVAILABILITY_QUERY,availabilityFlow, type FulfillmentChoice, type BusinessContactConsent } from './availabilityContract';
import {processContractHeaders,type ReservationChoice} from './reservationContract';
import type { CustomerContactPreference } from '../createOrderApi';

export const ALTERNATIVES_QUERY = AVAILABILITY_QUERY;
export class ProposalError extends RequestProcessError {
  constructor(message: string, status: number, readonly code = '', refresh = false) { super(message, status, refresh); }
}
export async function readProposals(processId: number, token: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/request-processes/${processId}/proposals${AVAILABILITY_QUERY}`, {
    headers: { Authorization: `Bearer ${token}`, ...processContractHeaders({flowContract:'AVAILABILITY_V3'}) }, signal, cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw processApiError(response.status, body);
  const read = normalizeProposals(body, processId);
  if (!read) throw new ProposalError('No se pudieron verificar las propuestas. Actualiza el pedido.', 502);
  return read;
}
export async function uploadProposalPhoto(file: File, signal?: AbortSignal) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024)
    throw new ProposalError('Selecciona una imagen JPG, PNG o WebP, hasta 8 MB.', 0);
  const body = new FormData(); body.append('file', file); body.append('upload_preset', 'zipco_products');
  const response = await fetch('https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload', { method: 'POST', body, signal });
  const url = response.ok ? getCloudinarySecureImageUrl(await response.json()) : null;
  if (!url) throw new ProposalError('No se pudo cargar la foto. Conservamos el formulario para reintentar.', 0);
  return url;
}
export type ProposalBody = { expectedVersion: number; proposalId: number; confirmationAccepted: true; acceptPastSchedule?: true;
  fulfillment?: FulfillmentChoice; customerContactPreference?: CustomerContactPreference; businessContactConsent?: BusinessContactConsent;
  reservationChoice?:ReservationChoice;
  totalPriceClp?: number; message?: string; photo?: string | null; lineChanges?: unknown[]; schedule?: unknown };
export type ProposalReceipt = { orderId: number; orderStatus: 'accepted' | 'rejected' | 'alternative_proposed'; requestProcess: RequestProcessSummary };
export async function sendProposalAction(processId: number, orderId: number, action: ProposalAction, body: ProposalBody, token: string, key: string, signal?: AbortSignal, flowContract?: RequestProcessSummary['flowContract'], expectedPlanId?: number): Promise<ProposalReceipt> {
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(key) || body.confirmationAccepted !== true)
    throw new ProposalError('No se pudo preparar la confirmación.', 0);
  const response = await fetch(`${API_BASE_URL}/request-processes/${processId}/actions/${PROPOSAL_PATHS[action]}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key,...processContractHeaders({flowContract}) }, body: JSON.stringify(body), signal,
  });
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = isRecord(value) && typeof value.code === 'string' ? value.code : '';
    if (response.status === 409 && code === 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED')
      throw new ProposalError('La fecha y hora propuestas ya pasaron. ¿Quieres aceptar igualmente?', 409, code);
    const e = processApiError(response.status, value);
    throw new ProposalError(response.status >= 500 ? 'No se pudo confirmar el resultado. Reintenta la misma operación.' : e.message, response.status, code, e.refreshConditions);
  }
  const p = isRecord(value) ? normalizeRequestProcess(value.requestProcess) : null;
  const accepts = action.startsWith('ACCEPT_'); const rejects = action.startsWith('REJECT_');
  const state = accepts ? 'COORDINATION_PENDING' : rejects ? 'CLOSED' : action === 'PROPOSE_ALTERNATIVE' ? 'AWAITING_CUSTOMER_DECISION'
    : action === 'COUNTER_PROPOSAL' ? 'AWAITING_BUSINESS_COUNTER_RESPONSE' : 'AWAITING_CUSTOMER_FINAL_DECISION';
  const status = accepts ? 'accepted' : rejects ? 'rejected' : 'alternative_proposed';
  const acceptedState = accepts && availabilityFlow(p) && p?.availability?.path === 'LOCAL_PICKUP' ? 'IN_PROGRESS' : state;
  if(availabilityFlow({flowContract})&&(p?.flowContract!==flowContract||(accepts||rejects)&&p.availability?.availabilityConfirmationId!==expectedPlanId))
    throw new ProposalError('No se pudo verificar el plan de esta propuesta. Actualiza el pedido sin repetir otra acción.',502);
  if (!isRecord(value) || value.orderId !== orderId || value.orderStatus !== status || !p || p.id !== processId || p.state !== acceptedState ||
    p.version !== body.expectedVersion + (accepts ? 2 : 1) || (accepts ? !p.agreementPublicId : p.agreementPublicId !== null) ||
    p.allowedActions.length !== 0 ||
    (rejects && p.closure?.reasonCode !== (action === 'REJECT_PROPOSAL' ? 'CUSTOMER_REJECTED_PROPOSAL' : 'BUSINESS_REJECTED_COUNTER_PROPOSAL')) ||
    ((accepts || rejects) ? p.currentProposalId !== body.proposalId : p.currentProposalId === body.proposalId))
    throw new ProposalError('No se pudo verificar el recibo. Reintenta la misma operación.', 502);
  return { orderId, orderStatus: status, requestProcess: p };
}
