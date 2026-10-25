import { isRecord } from './orderValueParsers';
import { OrdersApiError } from './ordersApi';

export const PAST_SCHEDULE_MESSAGE = 'La fecha y hora seleccionadas ya pasaron. Elige una fecha y hora futuras.';
export const DST_SCHEDULE_MESSAGE = 'Esta hora no está disponible debido al cambio de horario. Selecciona otra hora.';
export const REFRESH_CONDITIONS_MESSAGE = 'Este pedido cambió o ya fue actualizado. Actualiza la pantalla y revisa sus condiciones.';
export const FLOW_UPDATE_MESSAGE = 'Esta solicitud necesita una versión más reciente de ZIPCO. Actualiza la aplicación para continuar.';

export function approvedScheduleMessage(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const messages = Array.isArray(body.message) ? body.message : [body.message];
  return messages.find((message) => message === PAST_SCHEDULE_MESSAGE || message === DST_SCHEDULE_MESSAGE) ?? null;
}

export class RequestProcessError extends OrdersApiError {
  constructor(message: string, status: number, readonly refreshConditions = false) {
    super(message, status);
  }
}

export function processApiError(status: number, body: unknown, agreement = false): RequestProcessError {
  const schedule = [400, 422].includes(status) ? approvedScheduleMessage(body) : null;
  if (schedule) return new RequestProcessError(schedule, status);
  if (status === 401) return new RequestProcessError('Tu sesión venció. Ingresa nuevamente.', status);
  if (status === 403) return new RequestProcessError('No tienes permiso para realizar esta acción.', status);
  if (status === 404) return new RequestProcessError(agreement ? 'El acuerdo ya no está disponible. Actualiza el pedido.' : 'El pedido ya no está disponible. Actualiza la pantalla.', status, !agreement);
  if (status === 409) {
    const code = isRecord(body) && typeof body.code === 'string' ? body.code : '';
    if (code === 'FLOW_CONTRACT_REQUIRED') return new RequestProcessError(FLOW_UPDATE_MESSAGE,status);
    if (code === 'FLOW_CONTRACT_MISMATCH') return new RequestProcessError('Esta acción no corresponde al flujo de este pedido. Actualiza su estado.',status,true);
    if (code === 'AVAILABILITY_MISMATCH') return new RequestProcessError('La disponibilidad cambió. Actualiza el pedido y revisa la confirmación vigente.',status,true);
    if (code === 'INVALID_PROFILE_CONTACT') return new RequestProcessError('Revisa el teléfono internacional de tu perfil antes de continuar.', status, true);
    if (code === 'CONTACT_CONSENT_REQUIRED') return new RequestProcessError('La otra parte todavía debe autorizar compartir su teléfono para este pedido.', status, true);
    if (code === 'ACTION_NOT_AVAILABLE_IN_2A') return new RequestProcessError('Disponible en una próxima etapa de prueba.', status, true);
    if (code === 'INVALID_REQUEST_PROCESS') return new RequestProcessError('No se pudo validar el proceso. Actualiza la pantalla.', status, true);
    // STALE_VERSION, INCOMPATIBLE_STATE, PROPOSAL_MISMATCH and IDEMPOTENCY_KEY_REUSED
    // share approved copy; unknown conflicts also require refresh without exposing message.
    return new RequestProcessError(REFRESH_CONDITIONS_MESSAGE, status, true);
  }
  if (agreement) return new RequestProcessError('No se pudieron cargar las condiciones aceptadas. Intenta nuevamente.', status);
  if (status === 422) return new RequestProcessError(REFRESH_CONDITIONS_MESSAGE, status, true);
  if (status === 400) return new RequestProcessError('El proceso o la propuesta no están disponibles. Actualiza las condiciones del pedido.', status, true);
  return new RequestProcessError('No se pudo confirmar la aceptación. Intenta nuevamente.', status);
}
