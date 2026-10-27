import {SERVICE_HOURS_HEADERS} from './serviceHoursPolicy';
import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord,parseIsoDate} from './orderValueParsers';
import {normalizeReservationOffer,reservationId,type ReservationOffer} from './reservationContract';
import {normalizeReservationTiming,isAdvisoryOffer,type ReservationTiming} from './simplifiedReservationContract';
import {processApiError} from './requestProcessErrors';

export type ReservationOptions={serverNow:string;version:number;reservationOffer:ReservationOffer;offerId?:number;previewTiming?:ReservationTiming;paymentAvailable?:boolean};
export class ReservationOptionsError extends Error{
  constructor(message:string,readonly code:string,readonly status:number){super(message);}
}
export const canChooseWithoutPreview=(error:unknown)=>error instanceof ReservationOptionsError&&error.status===409&&['OFFER_EXPIRED','RESERVATION_PAYMENT_WINDOW_UNAVAILABLE','RESERVATION_SCHEDULE_EXPIRED','RESERVATION_HOURS_UNAVAILABLE','RESERVATION_OUTSIDE_SERVICE_WINDOW','RESERVATION_AMBIGUOUS_SERVICE_WINDOW'].includes(error.code);
export async function readReservationOptions(processId:number,version:number,token:string,business:boolean,offerId?:number,signal?:AbortSignal):Promise<ReservationOptions>{
  const response=await fetch(`${API_BASE_URL}/request-processes/${processId}/reservation-options?processContract=availability-v3`,{headers:{Authorization:`Bearer ${token}`,...SERVICE_HOURS_HEADERS},cache:'no-store',signal});
  const raw:unknown=await response.json().catch(()=>null);
  if(!response.ok)throw new ReservationOptionsError(processApiError(response.status,raw).message,isRecord(raw)&&typeof raw.code==='string'?raw.code:'',response.status);
  const offer=isRecord(raw)?normalizeReservationOffer(raw.reservationOffer):null;
  if(!isRecord(raw)||!parseIsoDate(raw.serverNow)||raw.version!==version||!offer||
    (business?typeof raw.paymentAvailable!=='boolean':raw.offerId!==offerId||!reservationId(raw.offerId)))throw Error('El pedido cambió o no se pudieron verificar sus condiciones. Actualiza el pedido.');
  const timing=raw.previewTiming===undefined?undefined:normalizeReservationTiming(raw.previewTiming);
  if(timing&& (isAdvisoryOffer(offer)?timing.pickupBy!==null||timing.paymentDueAt!==null:timing.pickupBy===null))throw Error('No se pudieron verificar las condiciones de esta reserva.');
  if(timing===null||!business&&offer.mode!=='NONE'&&!timing)throw Error('No se pudieron verificar los plazos de esta reserva. Actualiza el pedido.');
  return {serverNow:raw.serverNow as string,version, reservationOffer:offer!,...(business?{paymentAvailable:raw.paymentAvailable as boolean}:{offerId:raw.offerId as number,...(timing?{previewTiming:timing}:{})})};
}
