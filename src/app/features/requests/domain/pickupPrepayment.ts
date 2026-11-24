import {isRecord} from './orderValueParsers';
import type {RequestProcessSummary} from './requestProcess';

export const PICKUP_PREPAYMENT_CONTRACT='pickup-prepayment-stage-v1' as const;
export const PREPAYMENT_WAITING_MESSAGE='Pendiente de confirmación del pago y apartado por el negocio';
export const PREPAYMENT_PHASES=['AWAITING_PAYMENT_AND_HOLD','READY_FOR_PREPARATION','NEEDS_CLARIFICATION','CANCELLED','DECLINED','EXPIRED','INCONSISTENT'] as const;
export type PickupPrepayment={
  contract:typeof PICKUP_PREPAYMENT_CONTRACT;phase:typeof PREPAYMENT_PHASES[number];
  reservationId:number;requiredAmountClp:number;
  businessCategory:'WAITING_RESPONSE'|'IN_PROGRESS';customerCategory:'AWAITING_BUSINESS'|'IN_PROGRESS';
  customerMessage:string|null;canConfirmPaymentAndHold:boolean;
};

/** Unknown additive contracts remain ignored; malformed recognized projections fail validation. */
export function normalizePickupPrepayment(value:unknown):PickupPrepayment|null|undefined{
  if(!isRecord(value)||value.contract!==PICKUP_PREPAYMENT_CONTRACT)return undefined;
  const ready=value.phase==='READY_FOR_PREPARATION';
  if(!PREPAYMENT_PHASES.includes(value.phase as PickupPrepayment['phase'])||
    typeof value.reservationId!=='number'||!Number.isSafeInteger(value.reservationId)||value.reservationId<=0||
    typeof value.requiredAmountClp!=='number'||!Number.isSafeInteger(value.requiredAmountClp)||value.requiredAmountClp<=0||
    typeof value.canConfirmPaymentAndHold!=='boolean'||
    value.businessCategory!==(ready?'IN_PROGRESS':'WAITING_RESPONSE')||
    value.customerCategory!==(ready?'IN_PROGRESS':'AWAITING_BUSINESS')||
    value.customerMessage!==(ready?null:PREPAYMENT_WAITING_MESSAGE))return null;
  return value as PickupPrepayment;
}

/** Capability knowledge belongs to the authenticated token, never a persisted global flag. */
let capability:{token:string;enabled:boolean}|undefined;
export function rememberPickupPrepaymentCapability(token:string,body:unknown){
  const cap=isRecord(body)?body.pickupPrepaymentStage:null;
  capability={token,enabled:isRecord(cap)&&cap.contract===PICKUP_PREPAYMENT_CONTRACT&&cap.enabled===true};
}
export function pickupPrepaymentFor(process:RequestProcessSummary|null|undefined):PickupPrepayment|undefined{
  let token:string|null=null;
  try{token=localStorage.getItem('zipco-token');}catch{return undefined;}
  if(!token||capability?.token!==token||!capability.enabled||process?.state!=='IN_PROGRESS'||
    process.businessClosure||process.customerReceipt||process.localPickupInformation||
    !['AVAILABILITY_V2','AVAILABILITY_V3'].includes(process.flowContract??'')||
    process.availability?.path!=='LOCAL_PICKUP'||process.reservationChoice?.choice!=='REQUEST_RESERVATION'||
    process.reservation?.mode!=='PREPAYMENT')return undefined;
  const stage=process.pickupPrepayment;
  return stage?.reservationId===process.reservation.id?stage:undefined;
}
