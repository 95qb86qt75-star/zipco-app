import {API_BASE_URL} from '../../../api/apiConfig';
import {isRecord} from '../domain/orderValueParsers';
import {normalizeRequestProcess,isProposalRejected,isPendingRequestRejected,type RequestProcessSummary} from '../domain/requestProcess';
import {processContractHeaders} from '../domain/reservationContract';
import {SERVICE_HOURS_HEADERS} from '../domain/serviceHoursPolicy';
import {SCHEDULE_ACTION_PATHS,scheduleUuid,scheduleHash,validRequestedSchedule,type ScheduleAction,type RequestedSchedule} from '../domain/availabilityScheduleReview';
import {BUSINESS_CONTACT_VERSION,type FulfillmentChoice} from '../domain/availabilityContract';
import {isSimpleOffer} from '../domain/simplifiedReservationContract';
import {santiagoDraftTime} from '../domain/alternativeDraft';
import {participantHeaders} from './participantContractHeaders';
import {processApiError,RequestProcessError} from '../domain/requestProcessErrors';

type Origin={expectedVersion:number;proposalId:number;availabilityConfirmationId:number};
export type ScheduleRequestBody=Origin&{sourceTermsVersion:string;schedule:RequestedSchedule;note?:string};
export type ScheduleRenewBody=Origin&{scheduleRequestId:string;decision:'CONFIRM_REQUESTED_SCHEDULE'|'PROPOSE_OTHER_SCHEDULE';schedule?:RequestedSchedule;fulfillment:Extract<FulfillmentChoice,{path:'LOCAL_PICKUP'}>};
export type ScheduleIntent={key:string;processId:number;orderId:number;business:boolean;action:ScheduleAction;body:ScheduleRequestBody|ScheduleRenewBody};
export const scheduleSlot=(user:string,process:number,business:boolean)=>`zipco:availability-schedule:${user}:${business?'business':'customer'}:${process}`;
export const scheduleLocks=new Set<string>();
export function scheduleOrderStatus(p:RequestProcessSummary){
  if(isProposalRejected(p)||isPendingRequestRejected(p))return 'rejected';
  if(p.state==='CLOSED'||p.state==='COORDINATION_CANCELLED')return 'cancelled';
  if(p.state==='COMPLETED')return 'completed';
  if(p.state==='READY')return 'ready';
  if(p.agreementPublicId)return 'accepted';
  return p.state==='AWAITING_CUSTOMER_CONTINUATION'?'pending':'alternative_proposed';
}
const id=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>0&&v<=2147483647;
function validFulfillment(f:unknown){
  if(!isRecord(f)||f.path!=='LOCAL_PICKUP'||typeof f.customerMessage!=='string'||!f.customerMessage.trim()||f.customerMessage.length>120||
    typeof f.allowCustomerWhatsapp!=='boolean'||!isRecord(f.reservationOffer)||
    !(f.scheduleOrAddress===undefined||typeof f.scheduleOrAddress==='string'&&f.scheduleOrAddress.length<=80))return false;
  const o=f.reservationOffer;
  if(!['FREE','PREPAYMENT'].includes(String(o.mode))||o.mode==='PREPAYMENT'&&(!id(o.requiredAmountClp)||o.requiredAmountClp>50000000)||
    o.mode==='FREE'&&o.requiredAmountClp!==undefined||o.hoursPolicy!==undefined&&o.hoursPolicy!=='ADVISORY_ONLY')return false;
  if(o.mode==='PREPAYMENT'&&!f.allowCustomerWhatsapp)return false;
  return !f.allowCustomerWhatsapp||isRecord(f.businessContactConsent)&&f.businessContactConsent.accepted===true&&f.businessContactConsent.textVersion===BUSINESS_CONTACT_VERSION;
}
export function validScheduleIntent(v:unknown):v is ScheduleIntent{
  if(!isRecord(v)||!scheduleUuid.test(String(v.key))||!id(v.processId)||!id(v.orderId)||typeof v.business!=='boolean'||!isRecord(v.body))return false;
  const b=v.body;
  if(!id(b.expectedVersion)||!id(b.proposalId)||!id(b.availabilityConfirmationId))return false;
  if(v.action==='REQUEST_AVAILABILITY_SCHEDULE')return !v.business&&typeof b.sourceTermsVersion==='string'&&scheduleHash.test(b.sourceTermsVersion)&&
    validRequestedSchedule(b.schedule)&&(b.note===undefined||typeof b.note==='string'&&b.note===b.note.trim()&&b.note.length<=300)&&
    Object.keys(b).every(k=>['expectedVersion','proposalId','availabilityConfirmationId','sourceTermsVersion','schedule','note'].includes(k));
  return v.action==='RENEW_AVAILABILITY_SCHEDULE'&&v.business&&scheduleUuid.test(String(b.scheduleRequestId))&&
    (b.decision==='CONFIRM_REQUESTED_SCHEDULE'?b.schedule===undefined:b.decision==='PROPOSE_OTHER_SCHEDULE'&&validRequestedSchedule(b.schedule))&&
    validFulfillment(b.fulfillment)&&Object.keys(b).every(k=>['expectedVersion','proposalId','availabilityConfirmationId','scheduleRequestId','decision','schedule','fulfillment'].includes(k));
}
export function readScheduleIntent(storage:Pick<Storage,'getItem'>,slot:string){
  const raw=storage.getItem(slot);if(!raw)return null;
  let v:unknown;try{v=JSON.parse(raw);}catch{throw Error('No pudimos recuperar el envío anterior. No enviaremos otra solicitud.');}
  if(!validScheduleIntent(v))throw Error('No pudimos verificar el envío anterior. No enviaremos otra solicitud.');
  return v;
}
export function writeScheduleIntent(storage:Pick<Storage,'getItem'|'setItem'>,slot:string,intent:ScheduleIntent){
  if(!validScheduleIntent(intent))throw Error('Revisa la fecha y las condiciones antes de enviar.');
  const raw=JSON.stringify(intent);storage.setItem(slot,raw);if(storage.getItem(slot)!==raw)throw Error('No pudimos proteger el envío. No se envió nada.');
}
function receipt(raw:unknown,i:ScheduleIntent){
  const p=isRecord(raw)?normalizeRequestProcess(raw.requestProcess):null;
  const requesting=i.action==='REQUEST_AVAILABILITY_SCHEDULE';
  const review=p?.availabilityScheduleReview;
  if(!isRecord(raw)||raw.orderId!==i.orderId||raw.orderStatus!==(requesting?'pending':'alternative_proposed')||!p||p.id!==i.processId||
    p.version!==i.body.expectedVersion+1||p.agreementPublicId||p.reservation||
    p.state!==(requesting?'AWAITING_CUSTOMER_CONTINUATION':'AWAITING_CUSTOMER_DECISION')||review?.phase!==(requesting?'AWAITING_BUSINESS':'RENEWED_OFFER')||
    review.request?.sourceProposalId!==i.body.proposalId||review.request?.sourceOfferId!==i.body.availabilityConfirmationId||
    (requesting?(p.currentProposalId!==i.body.proposalId||review.request.sourceTermsVersion!==(i.body as ScheduleRequestBody).sourceTermsVersion||
      (review.request.requestedSchedule.date!==(i.body as ScheduleRequestBody).schedule.date||review.request.requestedSchedule.time!==(i.body as ScheduleRequestBody).schedule.time)):
      (p.currentProposalId===i.body.proposalId||review.request.scheduleRequestId!==(i.body as ScheduleRenewBody).scheduleRequestId)))
    throw Error('No pudimos verificar el resultado. Conservamos el identificador original; comprueba el estado.');
  if(requesting){
    const body=i.body as ScheduleRequestBody;
    if(review.request!.note!==(body.note??null)||review.request!.requestedVersion!==p.version)throw Error('No pudimos verificar la fecha solicitada. Comprueba el estado.');
  }else{
    const body=i.body as ScheduleRenewBody,plan=p.availability,offer=plan?.reservationOffer;
    const expectedTime=body.decision==='CONFIRM_REQUESTED_SCHEDULE'?Date.parse(review.request!.requestedFor):santiagoDraftTime(body.schedule!.date,body.schedule!.time);
    if(!plan||plan.availabilityConfirmationId===i.body.availabilityConfirmationId||!isSimpleOffer(offer)||
      offer.simplified.termsVersion===review.request!.sourceTermsVersion||
      !p.proposalSummary?.scheduledFor||Date.parse(p.proposalSummary.scheduledFor)!==expectedTime||
      plan.customerMessage!==body.fulfillment.customerMessage||plan.allowCustomerWhatsapp!==body.fulfillment.allowCustomerWhatsapp||
      (plan.scheduleOrAddress??'')!==(body.fulfillment.scheduleOrAddress??'')||offer.mode!==body.fulfillment.reservationOffer?.mode||
      offer.mode==='PREPAYMENT'&&(body.fulfillment.reservationOffer?.mode!=='PREPAYMENT'||offer.requiredAmountClp!==body.fulfillment.reservationOffer.requiredAmountClp))
      throw Error('No pudimos verificar las condiciones nuevas. Comprueba el resultado antes de continuar.');
  }
  return {orderId:i.orderId,orderStatus:raw.orderStatus as string,requestProcess:p};
}
async function request(i:ScheduleIntent,token:string,signal:AbortSignal,post:boolean){
  const headers=await participantHeaders(token,true);
  if(!validScheduleIntent(i)||!headers['X-Availability-Schedule-Contract'])throw Error('Esta sesión todavía no tiene disponible la revisión de fecha. Actualiza el pedido.');
  return fetch(`${API_BASE_URL}/request-processes/${i.processId}/${post?`actions/${SCHEDULE_ACTION_PATHS[i.action]}`:'availability-schedule-result'}`,{
    method:post?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...headers,...processContractHeaders({flowContract:'AVAILABILITY_V3'}),...SERVICE_HOURS_HEADERS,
      'Idempotency-Key':i.key,...(post?{'Content-Type':'application/json'}:{})},...(post?{body:JSON.stringify(i.body)}:{}),cache:'no-store',signal});
}
export async function sendAvailabilitySchedule(i:ScheduleIntent,p:RequestProcessSummary,token:string,signal:AbortSignal){
  if(p.id!==i.processId||p.version!==i.body.expectedVersion||p.currentProposalId!==i.body.proposalId||
    p.availability?.availabilityConfirmationId!==i.body.availabilityConfirmationId||!p.allowedActions.includes(i.action))throw Error('Las condiciones cambiaron. Comprueba el estado antes de continuar.');
  const response=await request(i,token,signal,true),raw:unknown=await response.json().catch(()=>null);
  if(!response.ok)throw response.status>=500?new RequestProcessError('No pudimos confirmar el envío. Comprueba su estado antes de reintentar.',response.status):processApiError(response.status,raw);
  return receipt(raw,i);
}
export async function readAvailabilityScheduleResult(i:ScheduleIntent,token:string,signal:AbortSignal){
  const response=await request(i,token,signal,false),raw:unknown=await response.json().catch(()=>null);
  if(response.status===404&&isRecord(raw)&&raw.code==='ACTION_RESULT_NOT_FOUND')return {recorded:false as const};
  if(!response.ok)throw response.status>=500?new RequestProcessError('No pudimos comprobar el estado. Conservamos el envío original.',response.status):processApiError(response.status,raw);
  const current=isRecord(raw)?normalizeRequestProcess(raw.currentRequestProcess):null;
  if(!isRecord(raw)||raw.recorded!==true||!current||current.id!==i.processId||raw.currentVersion!==current.version)throw Error('No pudimos verificar el estado actual. Conservamos el envío original.');
  const original=receipt(raw.result,i);
  if(current.version<original.requestProcess.version)throw Error('La lectura actual está incompleta.');
  // The historic receipt is proof of saving, never a replacement for the current state.
  return {recorded:true as const,requestProcess:current};
}
