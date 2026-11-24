import {isRecord,parseIsoDate} from './orderValueParsers';
import {normalizeDeliveryBlock} from './businessClosure';
import type {RequestProcessSummary} from './requestProcess';

export const PICKUP_CLOSURE_CONTRACT='customer-pickup-closure-v1' as const;
export const PICKUP_CLOSURE_HEADERS={'X-Customer-Pickup-Closure-Contract':PICKUP_CLOSURE_CONTRACT};
export const PICKUP_CHOICES=['RECEIVED','WILL_COLLECT','ACKNOWLEDGED'] as const;
export type PickupClosureChoice=typeof PICKUP_CHOICES[number];
export const PICKUP_CHOICE_LABELS:Record<PickupClosureChoice,string>={RECEIVED:'Ya retiré mi pedido',WILL_COLLECT:'Iré al local a retirar',ACKNOWLEDGED:'Entendido, cerrar mi seguimiento'};
export type CustomerPickupClosure={contract:typeof PICKUP_CLOSURE_CONTRACT;choice:PickupClosureChoice;scope:'REQUEST'|'CUSTOMER_FOLLOW_UP';eventId:number;closedAt:string;customerCategory:'HISTORY'};
export type CustomerPickupClosureOptions={choices:PickupClosureChoice[];receiptBlock:null|{code:'CUSTOMER_RECEIPT_RESERVATION_BLOCKED';cause:string;reservationId:number|null;target:'RESERVATION_DETAILS'}};
export const pickupChoice=(v:unknown):v is PickupClosureChoice=>PICKUP_CHOICES.includes(v as PickupClosureChoice);
export function normalizePickupClosure(v:unknown,state:string):CustomerPickupClosure|null{
 if(!isRecord(v)||v.contract!==PICKUP_CLOSURE_CONTRACT||!pickupChoice(v.choice)||!Number.isSafeInteger(v.eventId)||Number(v.eventId)<=0||!parseIsoDate(v.closedAt)||v.customerCategory!=='HISTORY')return null;
 if(v.choice==='RECEIVED'?(v.scope!=='REQUEST'||state!=='COMPLETED'):(v.scope!=='CUSTOMER_FOLLOW_UP'||!['IN_PROGRESS','READY','COMPLETED','CLOSED','COORDINATION_CANCELLED'].includes(state)))return null;
 return v as CustomerPickupClosure;
}
export function normalizePickupClosureOptions(v:unknown):CustomerPickupClosureOptions|null{
 if(!isRecord(v)||!Array.isArray(v.choices)||!v.choices.length||!v.choices.every(pickupChoice)||new Set(v.choices).size!==v.choices.length)return null;
 let block:CustomerPickupClosureOptions['receiptBlock']=null;
 if(v.receiptBlock!==null){
  if(!isRecord(v.receiptBlock)||v.receiptBlock.code!=='CUSTOMER_RECEIPT_RESERVATION_BLOCKED')return null;
  const parsed=normalizeDeliveryBlock({...v.receiptBlock,code:'BUSINESS_DELIVERY_RESERVATION_BLOCKED'});
  if(!parsed)return null;block={...parsed,code:'CUSTOMER_RECEIPT_RESERVATION_BLOCKED'};
 }
 return {choices:[...v.choices],receiptBlock:block};
}
let capability:{token:string;enabled:boolean}|undefined;
export function rememberPickupClosureCapability(token:string,body:unknown){const c=isRecord(body)?body.customerPickupClosure:null;capability={token,enabled:isRecord(c)&&c.contract===PICKUP_CLOSURE_CONTRACT&&c.enabled===true};}
export const knownPickupClosureHeaders=(token:string):Record<string,string>=>capability?.token===token&&capability.enabled?PICKUP_CLOSURE_HEADERS:{};
export function canFinishPickup(p:RequestProcessSummary|null|undefined){return !!p&&p.availability?.path==='LOCAL_PICKUP'&&!!p.agreementPublicId&&!p.localPickupInformation&&!p.customerPickupClosure&&['IN_PROGRESS','READY'].includes(p.state)&&p.allowedActions.includes('FINISH_CUSTOMER_PICKUP')&&!!p.customerPickupClosureOptions;}
