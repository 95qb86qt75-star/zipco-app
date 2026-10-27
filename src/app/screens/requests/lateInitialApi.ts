import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord} from './orderValueParsers';
import {normalizeRequestProcess,type RequestProcessSummary} from './requestProcess';
import {processApiError,RequestProcessError} from './requestProcessErrors';
import {processContractHeaders} from './reservationContract';
import {LATE_INITIAL_PATHS,lateInitialAllowed,type LateInitialAction} from './lateInitialContract';

export type LateInitialBody={expectedVersion:number;proposalId:number;confirmationAccepted:true;queryId?:number};
export type LateInitialReceipt={orderId:number;orderStatus:'pending'|'cancelled'|'rejected';requestProcess:RequestProcessSummary};
export class LateInitialError extends RequestProcessError{constructor(message:string,status:number,readonly code=''){super(message,status,true);}}
export async function readLateInitialCapability(token:string,signal?:AbortSignal){
  const response=await fetch(`${API_BASE_URL}/request-process-capabilities`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
  const raw:unknown=await response.json().catch(()=>null);
  if(!response.ok)throw processApiError(response.status,raw);
  if(!isRecord(raw)||raw.lateInitialResponse===undefined)return false;
  if(!isRecord(raw.lateInitialResponse)||raw.lateInitialResponse.contract!=='late-initial-v1'||typeof raw.lateInitialResponse.creationEnabled!=='boolean')throw new LateInitialError('No se pudo comprobar la consulta de solicitudes fuera de hora.',502);
  return raw.lateInitialResponse.creationEnabled;
}
export async function sendLateInitialAction(process:RequestProcessSummary,orderId:number,business:boolean,action:LateInitialAction,body:LateInitialBody,token:string,key:string,signal?:AbortSignal):Promise<LateInitialReceipt>{
  const responding=action==='CONFIRM_LATE_REQUEST_NEED'||action==='DECLINE_LATE_REQUEST_NEED';
  if(!lateInitialAllowed(process,business,action)||body.expectedVersion!==process.version||body.proposalId!==process.currentProposalId||body.confirmationAccepted!==true||
    Object.keys(body).sort().join(',')!==(responding?'confirmationAccepted,expectedVersion,proposalId,queryId':'confirmationAccepted,expectedVersion,proposalId')||
    responding&&body.queryId!==process.lateInitialResponse?.queryId||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key))throw new LateInitialError('Comprueba el pedido antes de responder.',0);
  const response=await fetch(`${API_BASE_URL}/request-processes/${process.id}/actions/${LATE_INITIAL_PATHS[action]}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Idempotency-Key':key,...processContractHeaders(process)},body:JSON.stringify(body),signal});
  const raw:unknown=await response.json().catch(()=>null);
  if(!response.ok){const error=processApiError(response.status,raw);throw new LateInitialError(response.status>=500?'No pudimos comprobar si tu respuesta se envió. Pulsa «Comprobar pedido» antes de reintentar.':error.message,response.status,isRecord(raw)&&typeof raw.code==='string'?raw.code:'');}
  const p=isRecord(raw)?normalizeRequestProcess(raw.requestProcess):null,late=p?.lateInitialResponse;
  const expected=action==='ASK_LATE_REQUEST_NEED'?'AWAITING_CUSTOMER':action==='CONFIRM_LATE_REQUEST_NEED'?'STILL_NEEDED':action==='DECLINE_LATE_REQUEST_NEED'?'NO_LONGER_NEEDED':'BUSINESS_UNAVAILABLE';
  const orderStatus=action==='DECLINE_LATE_REQUEST_NEED'?'cancelled':action==='CLOSE_LATE_REQUEST_UNAVAILABLE'?'rejected':'pending',closing=orderStatus!=='pending';
  if(!isRecord(raw)||raw.orderId!==orderId||raw.orderStatus!==orderStatus||!p||p.flowContract!=='AVAILABILITY_V3'||p.id!==process.id||p.version!==process.version+1||p.currentProposalId!==process.currentProposalId||p.agreementPublicId!==null||p.allowedActions.length||p.state!==(closing?'CLOSED':'AWAITING_BUSINESS_RESPONSE')||!late||late.status!==expected||late.scheduledFor!==process.lateInitialResponse?.scheduledFor||
    (action==='ASK_LATE_REQUEST_NEED'? !late.queryId||!late.askedAt||late.answeredAt!==null:late.queryId!==process.lateInitialResponse?.queryId)||
    responding&&!late.answeredAt||action==='DECLINE_LATE_REQUEST_NEED'&&p.closure?.actor!=='CUSTOMER'||action==='CLOSE_LATE_REQUEST_UNAVAILABLE'&&p.closure?.actor!=='BUSINESS')throw new LateInitialError('No pudimos comprobar el recibo. Pulsa «Comprobar pedido»; no enviaremos otra respuesta automáticamente.',502);
  return {orderId,orderStatus,requestProcess:p};
}
