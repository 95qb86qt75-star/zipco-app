import {isRecord,parseIsoDate} from './orderValueParsers';
import type {RequestProcessSummary} from './requestProcess';

export const PAYMENT_PROOF_CONTRACT='customer-payment-proof-v1' as const;
export const PAYMENT_PROOF_HEADERS={'X-Customer-Payment-Proof-Contract':PAYMENT_PROOF_CONTRACT};
export type CustomerPaymentProof={
  contract:typeof PAYMENT_PROOF_CONTRACT;reservationId:number;
  declaration:null|{eventId:number;actor:'CUSTOMER';declaredAt:string;declaredVersion:number};
  canDeclare:boolean;blockingReason:string|null;
  categories:null|{customer:'WAITING_RESPONSE'|'AWAITING_BUSINESS'|'IN_PROGRESS';business:'WAITING_RESPONSE'|'IN_PROGRESS'};
};
const id=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>0&&n<=2147483647;
export function normalizeCustomerPaymentProof(value:unknown,version:number):CustomerPaymentProof|null|undefined{
  if(!isRecord(value)||value.contract!==PAYMENT_PROOF_CONTRACT)return undefined;
  if(!id(value.reservationId)||typeof value.canDeclare!=='boolean'||!(value.blockingReason===null||typeof value.blockingReason==='string'))return null;
  const d=value.declaration,c=value.categories;
  if(d!==null&&(!isRecord(d)||!id(d.eventId)||d.actor!=='CUSTOMER'||!parseIsoDate(d.declaredAt)||!id(d.declaredVersion)||d.declaredVersion>version))return null;
  if(c!==null&&(!isRecord(c)||!['WAITING_RESPONSE','AWAITING_BUSINESS','IN_PROGRESS'].includes(String(c.customer))||!['WAITING_RESPONSE','IN_PROGRESS'].includes(String(c.business))))return null;
  if(isRecord(c)&&(c.business==='IN_PROGRESS'?c.customer!=='IN_PROGRESS':c.customer!==(d?'AWAITING_BUSINESS':'WAITING_RESPONSE')))return null;
  if(value.canDeclare&&(d!==null||value.blockingReason!==null||!isRecord(c)||c.customer!=='WAITING_RESPONSE'||c.business!=='WAITING_RESPONSE'))return null;
  return value as CustomerPaymentProof;
}
let capability:{token:string;enabled:boolean}|undefined;
export function rememberPaymentProofCapability(token:string,body:unknown){
  const v=isRecord(body)?body.customerPaymentProof:null;
  capability={token,enabled:isRecord(v)&&v.contract===PAYMENT_PROOF_CONTRACT&&v.enabled===true};
}
export const knownPaymentProofHeaders=(token:string):Record<string,string>=>capability?.token===token&&capability.enabled?PAYMENT_PROOF_HEADERS:{};
export function paymentProofFor(p:RequestProcessSummary|null|undefined){
  let token:string|null=null;try{token=localStorage.getItem('zipco-token');}catch{return undefined;}
  if(!token||!knownPaymentProofHeaders(token)['X-Customer-Payment-Proof-Contract']||!p?.customerPaymentProof||
    !['AVAILABILITY_V2','AVAILABILITY_V3'].includes(p.flowContract??'')||p.availability?.path!=='LOCAL_PICKUP'||
    p.reservationChoice?.choice!=='REQUEST_RESERVATION'||p.reservation?.mode!=='PREPAYMENT'||p.customerPaymentProof.reservationId!==p.reservation.id)return undefined;
  return p.customerPaymentProof;
}
