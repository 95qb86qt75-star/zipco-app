import { isRecord } from './orderValueParsers';
import { OrdersApiError } from './ordersApi';

export const PAST_SCHEDULE_MESSAGE = 'La fecha y hora seleccionadas ya pasaron. Elige una fecha y hora futuras.';
export const DST_SCHEDULE_MESSAGE = 'Esta hora no está disponible debido al cambio de horario. Selecciona otra hora.';
export const REFRESH_CONDITIONS_MESSAGE = 'Este pedido cambió o ya fue actualizado. Actualiza la pantalla y revisa sus condiciones.';
export const FLOW_UPDATE_MESSAGE = 'Esta solicitud necesita una versión más reciente de ZIPCO. Actualiza la aplicación para continuar.';
export const RESERVATION_PROFILE_HOURS_MESSAGE = 'Completa y guarda la apertura y el cierre en Mi Negocio → Configuración → Horario. Después actualiza este pedido y vuelve a confirmar. El campo «Horario o dirección» del pedido no reemplaza ese horario.';

function reservationTermsMessage(body: unknown): string | null {
  if (!isRecord(body) || body.code !== 'INVALID_RESERVATION_TERMS') return null;
  const messages = Array.isArray(body.message) ? body.message : [body.message];
  const hours = ['Completa un horario válido del negocio para ofrecer reservas', 'Completa el horario del negocio', 'Revisa las horas de apertura y cierre del negocio'];
  if (messages.some(message => hours.includes(message))) return RESERVATION_PROFILE_HOURS_MESSAGE;
  if (messages.includes('Revisa el horario por el cambio de hora')) return 'El horario del negocio coincide con un cambio de hora. Revisa la apertura y el cierre en Mi Negocio → Configuración → Horario.';
  if (messages.includes('Revisa el monto para reservar')) return 'Revisa el monto para reservar: debe ser un número entero entre $1 y el total del pedido.';
  return 'No se pudieron validar las condiciones de reserva. Revisa la modalidad, el monto y el horario de atención del negocio.';
}
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
  const reservationTerms = status === 400 ? reservationTermsMessage(body) : null;
  if (reservationTerms) return new RequestProcessError(reservationTerms, status, true);
  const schedule = [400, 422].includes(status) ? approvedScheduleMessage(body) : null;
  if (schedule) return new RequestProcessError(schedule, status);
  if (status === 401) return new RequestProcessError('Tu sesión venció. Ingresa nuevamente.', status);
  if (status === 403) return new RequestProcessError('No tienes permiso para realizar esta acción.', status);
  if (status === 404) return new RequestProcessError(agreement ? 'El acuerdo ya no está disponible. Actualiza el pedido.' : 'El pedido ya no está disponible. Actualiza la pantalla.', status, !agreement);
  if (status === 409) {
    const code = isRecord(body) && typeof body.code === 'string' ? body.code : '';
    const lateMessages:Record<string,string>={
      LATE_INITIAL_CONTRACT_REQUIRED:'Actualiza ZIPCO para responder solicitudes fuera de hora.',
      LATE_INITIAL_DISABLED:'La consulta de solicitudes fuera de hora aún no está habilitada.',
      LATE_INITIAL_NOT_APPLICABLE:'Esta solicitud cambió o ya no espera su primera respuesta. Comprueba el pedido.',
      LATE_INITIAL_QUERY_ALREADY_SENT:'La consulta ya fue enviada. Comprueba el pedido para ver la respuesta del cliente.',
      LATE_INITIAL_QUERY_MISMATCH:'Esta consulta ya no espera esa respuesta. Comprueba el pedido.',
      LATE_INITIAL_RESPONSE_REQUIRED:'La hora solicitada ya pasó. Comprueba el pedido para consultar si el cliente aún lo necesita y acordar una nueva hora.',
    };
    if(Object.hasOwn(lateMessages,code))return new RequestProcessError(lateMessages[code],status,true);
    if (code === 'FLOW_CONTRACT_REQUIRED') return new RequestProcessError(FLOW_UPDATE_MESSAGE,status);
    if(code==='RESERVATION_CREATION_DISABLED')return new RequestProcessError('Las nuevas reservas todavía no están habilitadas. Conserva los datos y vuelve a intentarlo cuando se active QA.',status);
    if(code==='OFFER_EXPIRED')return new RequestProcessError('El plazo de la oferta de reserva venció. Actualiza sus condiciones; también puedes elegir ir sin reserva.',status,true);
    if(code==='RESERVATION_MISMATCH')return new RequestProcessError('La reserva cambió. Actualiza el pedido antes de responder.',status,true);
    if(code==='RESERVATION_OUTSIDE_SERVICE_WINDOW')return new RequestProcessError('La fecha y hora de este pedido están fuera del horario de atención. Revisa el horario del negocio o acuerda otra fecha con el cliente. Conservamos lo que escribiste; no cambiamos la fecha del pedido.',status,true);
    if(code==='RESERVATION_AMBIGUOUS_SERVICE_WINDOW')return new RequestProcessError('Hay horarios de atención superpuestos para la fecha y hora de este pedido. Revísalos en Mi Negocio → Configuración → Horario. Después guarda los cambios, comprueba el pedido y vuelve a confirmar.',status,true);
    if(code==='RESERVATION_HOURS_UNAVAILABLE')return new RequestProcessError('La fecha y hora solicitadas no coinciden con una única jornada de atención. Si el pedido es para «Ahora», comprueba que el negocio esté abierto. Revisa su horario en Configuración; si hay jornadas superpuestas, corrígelas. Después actualiza y reintenta, o elige explícitamente retiro sin reserva.',status,true);
    if(code==='RESERVATION_PAYMENT_WINDOW_UNAVAILABLE')return new RequestProcessError('Quedan menos de 30 minutos antes del cierre. Revisa las condiciones con el negocio o elige ir sin reserva.',status,true);
    if(code==='RESERVATION_SCHEDULE_EXPIRED')return new RequestProcessError('La fecha y hora para reservar ya pasaron. El negocio debe revisar la fecha; una nota no la modifica.',status,true);
    if(code==='RESERVATION_TERMS_CHANGED'||code==='RESERVATION_SCHEDULE_CHANGED')return new RequestProcessError('Cambió el horario o la fecha de reserva. Actualiza el pedido y pide al negocio revisar las condiciones.',status,true);
    if(code==='RESERVATION_NOT_CONFIRMED')return new RequestProcessError('Confirma el apartado y, si corresponde, el monto recibido antes de marcar Listo.',status,true);
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
