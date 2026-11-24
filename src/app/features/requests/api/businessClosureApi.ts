import { API_BASE_URL } from '../../../api/apiConfig';
import { BUSINESS_CLOSURE_HEADERS, closureReason, normalizeDeliveryBlock, validClosureDetail, type BusinessClosureAction, type BusinessClosureReason, type DeliveryBlock } from '../domain/businessClosure';
import { normalizeRequestProcess, type RequestProcessSummary } from '../domain/requestProcess';
import { isRecord } from '../domain/orderValueParsers';
import { RequestProcessError, processApiError } from '../domain/requestProcessErrors';
import { processContractHeaders } from '../domain/reservationContract';
import { participantHeaders } from './participantContractHeaders';
import { businessClosureHeaders } from './businessClosureCapabilities';
export type ClosureBody = { expectedVersion:number; deliveryDeclared:true } |
  { expectedVersion:number; closureConfirmed:true; reasonCode:BusinessClosureReason; reasonDetail?:string };
export type ClosureIntent = { key:string; action:BusinessClosureAction; body:ClosureBody; agreementPublicId:string; processId:number; orderId:number; confirmed?:boolean };
export type ClosureReceipt = { orderId:number; orderStatus:'ready'|'cancelled'; requestProcess:RequestProcessSummary };
export class BusinessClosureError extends RequestProcessError {
  constructor(message:string,status:number,readonly code:string,readonly block:DeliveryBlock|null=null) { super(message,status,true); }
}
export function closureBody(action:BusinessClosureAction,version:number,reason?:BusinessClosureReason,detail=''):ClosureBody {
  if(!Number.isSafeInteger(version)||version<1)throw new RequestProcessError('Actualiza el pedido.',400);
  if(action==='BUSINESS_DECLARE_DELIVERY')return {expectedVersion:version,deliveryDeclared:true};
  if(!closureReason(reason)||!validClosureDetail(reason,reason==='OTHER'?detail.trim():null))throw new RequestProcessError('Selecciona un motivo. En Otro escribe de 3 a 1000 caracteres.',400);
  return {expectedVersion:version,closureConfirmed:true,reasonCode:reason,...(reason==='OTHER'?{reasonDetail:detail.trim()}:{})};
}
export function verifyClosureReceipt(raw:unknown,intent:ClosureIntent):ClosureReceipt {
  const p=isRecord(raw)?normalizeRequestProcess(raw.requestProcess):null;
  const closure=p?.businessClosure, delivered=intent.action==='BUSINESS_DECLARE_DELIVERY';
  if(!isRecord(raw)||raw.orderId!==intent.orderId||raw.orderStatus!==(delivered?'ready':'cancelled')||!p||p.id!==intent.processId||
    p.agreementPublicId!==intent.agreementPublicId||p.version!==intent.body.expectedVersion+1||!closure||
    closure.status!==(delivered?'DELIVERY_DECLARED':'CLOSED_WITHOUT_DELIVERY')||
    (!delivered&&'reasonCode'in intent.body&&(closure.reasonCode!==intent.body.reasonCode||closure.reasonDetail!==(intent.body.reasonDetail??null))))
    throw new RequestProcessError('No pudimos verificar el cierre. Comprueba su estado antes de continuar.',502);
  return {orderId:intent.orderId,orderStatus:raw.orderStatus as ClosureReceipt['orderStatus'],requestProcess:p};
}
async function headers(token:string,p:RequestProcessSummary,key:string){
  const capability=await businessClosureHeaders(token,true);
  if(!capability['X-Business-Order-Closure-Contract'])throw new BusinessClosureError('El cierre de solicitudes no está habilitado. Actualiza ZIPCO.',409,'FLOW_CONTRACT_REQUIRED');
  return {Authorization:`Bearer ${token}`,'Idempotency-Key':key,...await participantHeaders(token,true),...processContractHeaders(p),...BUSINESS_CLOSURE_HEADERS};
}
async function read(response:Response){let value:unknown;try{value=await response.json();}catch{value=null;}return value;}
export async function sendBusinessClosure(intent:ClosureIntent,p:RequestProcessSummary,token:string){
  const path=intent.action==='BUSINESS_DECLARE_DELIVERY'?'declare-delivery':'close-without-delivery';
  const response=await fetch(`${API_BASE_URL}/request-processes/${intent.processId}/actions/${path}`,{
    method:'POST',headers:{...await headers(token,p,intent.key),'Content-Type':'application/json'},body:JSON.stringify(intent.body),cache:'no-store',signal:AbortSignal.timeout(20000),
  });
  const raw=await read(response);
  if(!response.ok){
    const code=isRecord(raw)&&typeof raw.code==='string'?raw.code:'';
    const block=normalizeDeliveryBlock(raw);
    const message=block?'Regulariza las condiciones de la reserva antes de declarar entrega.':processApiError(response.status,raw).message;
    throw new BusinessClosureError(message,response.status,code,block);
  }
  return verifyClosureReceipt(raw,intent);
}
export async function readBusinessClosureResult(intent:ClosureIntent,p:RequestProcessSummary,token:string){
  const response=await fetch(`${API_BASE_URL}/request-processes/${intent.processId}/business-closure-result`,{
    headers:await headers(token,p,intent.key),cache:'no-store',signal:AbortSignal.timeout(15000),
  });
  const raw=await read(response);
  if(!response.ok)throw processApiError(response.status,raw);
  if(!isRecord(raw)||typeof raw.recorded!=='boolean'||!Number.isSafeInteger(raw.currentVersion)||Number(raw.currentVersion)<intent.body.expectedVersion)
    throw new RequestProcessError('No pudimos comprobar el resultado. Conservamos el envío original.',502);
  return raw.recorded?verifyClosureReceipt(raw.result,intent):null;
}
