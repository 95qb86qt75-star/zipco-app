import {API_BASE_URL} from '../../../api/apiConfig';
import {normalizeRequestProcess,type RequestProcessSummary} from '../domain/requestProcess';
import {paymentProofFor,PAYMENT_PROOF_HEADERS} from '../domain/customerPaymentProof';
import {processContractHeaders} from '../domain/reservationContract';
import {isRecord} from '../domain/orderValueParsers';
import {processApiError} from '../domain/requestProcessErrors';
import {participantHeaders} from './participantContractHeaders';

export type PaymentProofIntent={key:string;processId:number;orderId:number;agreementPublicId:string;
  body:{expectedVersion:number;reservationId:number;proofSentDeclared:true}};
export const proofUuid=/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
export function validProofIntent(v:unknown):v is PaymentProofIntent{
  if(!isRecord(v)||!isRecord(v.body))return false;
  const id=(n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>0&&n<=2147483647;
  return typeof v.key==='string'&&proofUuid.test(v.key)&&id(v.orderId)&&id(v.processId)&&
    typeof v.agreementPublicId==='string'&&!!v.agreementPublicId&&id(v.body.expectedVersion)&&
    id(v.body.reservationId)&&v.body.proofSentDeclared===true&&Object.keys(v.body).length===3;
}
function same(p:RequestProcessSummary,intent:PaymentProofIntent){
  return p.id===intent.processId&&p.agreementPublicId===intent.agreementPublicId&&p.reservation?.id===intent.body.reservationId;
}
function receipt(raw:unknown,i:PaymentProofIntent){
  const p=isRecord(raw)?normalizeRequestProcess(raw.requestProcess):null;
  const d=p?.customerPaymentProof?.declaration;
  if(!isRecord(raw)||raw.orderId!==i.orderId||raw.orderStatus!=='accepted'||!p||!same(p,i)||
    p.state!=='IN_PROGRESS'||p.version!==i.body.expectedVersion+1||!d||d.declaredVersion!==p.version)
    throw Error('No pudimos verificar la declaración. Comprueba su estado; conservamos el envío original.');
  return {orderId:i.orderId,orderStatus:raw.orderStatus,requestProcess:p};
}
async function request(i:PaymentProofIntent,p:RequestProcessSummary,token:string,signal:AbortSignal,post:boolean){
  const negotiated=await participantHeaders(token,true);
  if(!validProofIntent(i)||!same(p,i)||!negotiated['X-Customer-Payment-Proof-Contract'])throw Error('Actualiza el pedido: la declaración no está disponible para esta sesión.');
  const response=await fetch(`${API_BASE_URL}/request-processes/${i.processId}/${post?'actions/declare-payment-proof-sent':'payment-proof-result'}`,{
    method:post?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...negotiated,...processContractHeaders(p),...PAYMENT_PROOF_HEADERS,
      'Idempotency-Key':i.key,...(post?{'Content-Type':'application/json'}:{})},
    ...(post?{body:JSON.stringify(i.body)}:{}),cache:'no-store',signal,
  });
  const raw:unknown=await response.json().catch(()=>null);
  if(!response.ok)throw processApiError(response.status,raw);
  return raw;
}
export async function sendPaymentProof(i:PaymentProofIntent,p:RequestProcessSummary,token:string,signal:AbortSignal){
  if(!paymentProofFor(p)?.canDeclare||!p.allowedActions.includes('DECLARE_PAYMENT_PROOF_SENT')||p.version!==i.body.expectedVersion)
    throw Error('Las condiciones cambiaron. Comprueba el estado antes de continuar.');
  return receipt(await request(i,p,token,signal,true),i);
}
export async function readPaymentProofResult(i:PaymentProofIntent,p:RequestProcessSummary,token:string,signal:AbortSignal){
  const raw=await request(i,p,token,signal,false);
  const current=isRecord(raw)?normalizeRequestProcess(raw.currentRequestProcess):null;
  if(!isRecord(raw)||typeof raw.recorded!=='boolean'||!current||!same(current,i)||
    raw.currentVersion!==current.version||current.version<i.body.expectedVersion)
    throw Error('No pudimos verificar el estado actual. Conservamos el envío original.');
  if(raw.recorded){const original=receipt(raw.result,i);if(current.version<original.requestProcess.version)throw Error('La lectura actual está incompleta.');}
  return {recorded:raw.recorded,requestProcess:current};
}
