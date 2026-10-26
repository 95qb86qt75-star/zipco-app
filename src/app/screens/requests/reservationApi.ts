import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord} from './orderValueParsers';
import {normalizeRequestProcess,type RequestProcessSummary} from './requestProcess';
import {AvailabilityError} from './availabilityApi';
import {processApiError} from './requestProcessErrors';
import {whatsappUrl} from './coordinationApi';
import {RESERVATION_PATHS,reservationFlow,processContractHeaders,type ReservationAction} from './reservationContract';
import {simplifiedReservationFlow} from './simplifiedReservationContract';
export type ReservationBody={expectedVersion:number;reservationId:number;entireOrderHeldDeclared?:true;requiredPaymentReceivedDeclared?:true;
  reasonDetail?:string;confirmationAccepted?:true;consentAccepted?:true;consentTextVersion?:'availability-contact-v1';purpose?:'RECEIPT'|'CLARIFICATION'};
export type ReservationReceipt={orderId:number;orderStatus:string;requestProcess:RequestProcessSummary};
export function reservationAllowed(p:RequestProcessSummary|null|undefined,business:boolean,action:ReservationAction){
  if(!p||!reservationFlow(p)||!p.reservation||!p.agreementPublicId)return false;
  const actions=p.reservation.mode==='PREPAYMENT'?p.reservationFollowUp?.allowedActions:p.allowedActions;
  if(!actions?.includes(action as never))return false;
  if(['CONFIRM_PICKUP_RESERVATION','DECLINE_PICKUP_RESERVATION','CANCEL_PICKUP_RESERVATION'].includes(action)&&!business)return false;
  if(action==='CANCEL_PICKUP_RESERVATION'&&!simplifiedReservationFlow(p)||simplifiedReservationFlow(p)&&p.reservation.mode==='FREE'&&['CONFIRM_PICKUP_RESERVATION','DECLINE_PICKUP_RESERVATION'].includes(action))return false;
  if(action==='CONTINUE_WITHOUT_RESERVATION'&&business)return false;
  return true;
}
export async function sendReservationAction(p:RequestProcessSummary,orderId:number,business:boolean,action:ReservationAction,body:ReservationBody,token:string,key:string,signal?:AbortSignal){
  if(!reservationAllowed(p,business,action)||body.expectedVersion!==p.version||body.reservationId!==p.reservation?.id||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key))throw new AvailabilityError('Actualiza la reserva antes de confirmar.',0);
  const response=await fetch(`${API_BASE_URL}/request-processes/${p.id}/actions/${RESERVATION_PATHS[action]}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Idempotency-Key':key,...processContractHeaders(p)},body:JSON.stringify(body),signal});
  const value:unknown=await response.json().catch(()=>null);
  if(!response.ok){const error=processApiError(response.status,value);throw new AvailabilityError(response.status>=500?'No se pudo confirmar el resultado. Reintenta los mismos datos.':error.message,response.status,isRecord(value)&&typeof value.code==='string'?value.code:'',error.refreshConditions);}
  const raw=action==='OPEN_RESERVATION_WHATSAPP'&&isRecord(value)?value.result:value;
  const next=isRecord(raw)?normalizeRequestProcess(raw.requestProcess):null;
  const expectedStatus=p.state==='CLOSED'?'cancelled':p.state==='READY'?'ready':'accepted';
  if(!isRecord(raw)||raw.orderId!==orderId||raw.orderStatus!==expectedStatus||!next||next.flowContract!==p.flowContract||next.id!==p.id||next.version!==p.version+1||next.state!==p.state||next.currentProposalId!==p.currentProposalId||next.agreementPublicId!==p.agreementPublicId||next.availability?.availabilityConfirmationId!==p.availability?.availabilityConfirmationId||next.allowedActions.length)
    throw new AvailabilityError('No se pudo verificar la respuesta. Reintenta la misma operación.',502);
  const receipt:ReservationReceipt={orderId,orderStatus:expectedStatus,requestProcess:next};
  let navigation:string|null=null;
  if(action==='OPEN_RESERVATION_WHATSAPP'){
    if(!isRecord(value))throw new AvailabilityError('No se pudo verificar el acceso a WhatsApp.',502);
    if(value.navigation===null&&value.navigationUnavailableReason==='CONTACT_NOT_AVAILABLE')return {receipt,navigation};
    navigation=isRecord(value.navigation)?whatsappUrl(value.navigation.url):null;
    if(!navigation)throw new AvailabilityError('No se pudo verificar el acceso a WhatsApp.',502);
  }
  return {receipt,navigation};
}
