import { API_BASE_URL } from '../../api/apiConfig';
import { isRecord } from './orderValueParsers';
import { normalizeRequestProcess, type RequestProcessSummary } from './requestProcess';
import { normalizeAgreement } from './agreement';
import { processApiError, RequestProcessError } from './requestProcessErrors';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { AVAILABILITY_QUERY } from './availabilityContract';

export type AcceptFixedOrderResult = { orderId: number; orderStatus: 'accepted'; requestProcess: RequestProcessSummary };
async function bodyOf(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

export async function acceptFixedOrder(process: RequestProcessSummary, orderId: number, token: string, key: string): Promise<AcceptFixedOrderResult> {
  const response = await fetch(`${API_BASE_URL}/request-processes/${process.id}/actions/accept-fixed-order`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expectedVersion: process.version, proposalId: process.currentProposalId }),
  });
  const body = await bodyOf(response);
  if (!response.ok) throw processApiError(response.status, body);
  const confirmed = isRecord(body) ? normalizeRequestProcess(body.requestProcess) : null;
  if (!isRecord(body) || body.orderId !== orderId || body.orderStatus !== 'accepted' ||
    !confirmed || confirmed.id !== process.id || confirmed.state !== 'COORDINATION_PENDING' ||
    confirmed.version <= process.version || confirmed.currentProposalId !== process.currentProposalId ||
    !confirmed.agreementPublicId || confirmed.allowedActions.length !== 0)
    throw new RequestProcessError('No se pudo confirmar la aceptación. Intenta nuevamente con la misma solicitud.', 502);
  return { orderId, orderStatus: 'accepted', requestProcess: confirmed };
}

export async function readAgreement(processId: number, agreementPublicId: string | null, token: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/request-processes/${processId}/agreement${AVAILABILITY_QUERY}`, {
    headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store',
  });
  const body = await bodyOf(response);
  if (!response.ok) throw processApiError(response.status, body, true);
  const agreement = normalizeAgreement(body);
  if (!agreement || agreement.requestProcessId !== processId || (agreementPublicId !== null && agreement.agreementPublicId !== agreementPublicId))
    throw new RequestProcessError('No se pudieron verificar las condiciones aceptadas. Intenta nuevamente.', 502);
  return agreement;
}

export async function readBusinessOrderForRecovery(orderId: number, businessId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/orders/business/${businessId}${AVAILABILITY_QUERY}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await bodyOf(response);
  if (!response.ok) throw processApiError(response.status, body);
  return normalizeBusinessOrdersPayload(body).find((order) => order.recordState === 'available' && order.id === orderId) ?? null;
}
