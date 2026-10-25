import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord} from './orderValueParsers';
import {processApiError} from './requestProcessErrors';
import {CreateOrderError} from '../createOrderApi';
export async function readReservationCapabilities(token:string,signal?:AbortSignal){
  const response=await fetch(`${API_BASE_URL}/request-process-capabilities`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
  const raw:unknown=await response.json().catch(()=>null);
  if(!response.ok)throw new CreateOrderError(processApiError(response.status,raw).message,response.status,'not-created');
  if(!isRecord(raw)||!Array.isArray(raw.supportedContracts)||raw.supportedContracts.some(c=>typeof c!=='string')||typeof raw.reservationCreationEnabled!=='boolean')throw Error('No se pudo verificar la disponibilidad del flujo de pedidos. Intenta nuevamente.');
  return {reservationCreationEnabled:raw.reservationCreationEnabled&&raw.supportedContracts.includes('availability-v2')};
}
