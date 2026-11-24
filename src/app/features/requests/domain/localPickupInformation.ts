import {isRecord,parseIsoDate} from './orderValueParsers';
import type {RequestProcessSummary} from './requestProcess';
export const LOCAL_PICKUP_INFORMATION_CONTRACT='local-pickup-information-v1' as const;
export const LOCAL_PICKUP_INFORMATION_HEADERS={'X-Local-Pickup-Information-Contract':LOCAL_PICKUP_INFORMATION_CONTRACT};
export type LocalPickupInformation={contract:typeof LOCAL_PICKUP_INFORMATION_CONTRACT;status:'AWAITING_CUSTOMER_DECISION'|'AWAITING_CUSTOMER_ACK'|'ACKNOWLEDGED';availabilityConfirmationId:number;informedAt:string;acknowledgementId:number|null;acknowledgedAt:string|null};
const id=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0&&v<=2147483647;
/** An explicit server summary is required; NONE or a zero price alone never adopts an old order. */
export function normalizeLocalPickupInformation(raw:unknown,p:Record<string,unknown>,plan:RequestProcessSummary['availability']):LocalPickupInformation|null{
 if(!isRecord(raw)||raw.contract!==LOCAL_PICKUP_INFORMATION_CONTRACT||!['AVAILABILITY_V2','AVAILABILITY_V3'].includes(String(p.flowContract))||plan?.path!=='LOCAL_PICKUP'||plan.reservationOffer?.mode!=='NONE'||p.customerReceipt!==undefined||p.reservation!==undefined||!id(raw.availabilityConfirmationId)||raw.availabilityConfirmationId!==plan.availabilityConfirmationId||!parseIsoDate(raw.informedAt))return null;
 const {status,acknowledgementId,acknowledgedAt}=raw;
 if(status==='AWAITING_CUSTOMER_DECISION'){
  if(p.state!=='AWAITING_CUSTOMER_CONTINUATION'||p.agreementPublicId!==null||acknowledgementId!==null||acknowledgedAt!==null)return null;
 }else if(status==='AWAITING_CUSTOMER_ACK'||status==='ACKNOWLEDGED'){
  if(p.state!=='IN_PROGRESS'||typeof p.agreementPublicId!=='string'||!p.agreementPublicId)return null;
  if(status==='AWAITING_CUSTOMER_ACK'?(acknowledgementId!==null||acknowledgedAt!==null):(!id(acknowledgementId)||!parseIsoDate(acknowledgedAt)||Date.parse(acknowledgedAt as string)<Date.parse(raw.informedAt as string)))return null;
 }else return null;
 if(Array.isArray(p.allowedActions)&&p.allowedActions.some(a=>['MARK_READY','START_WORK','CANCEL_PICKUP','DECLARE_PRODUCT_RECEIVED','ACK_READY_NOTICE','CONFIRM_RECEIPT','FINALIZE_REQUEST'].includes(String(a))||a==='ACK_LOCAL_PICKUP_INFORMATION'&&status!=='AWAITING_CUSTOMER_ACK'))return null;
 return {contract:LOCAL_PICKUP_INFORMATION_CONTRACT,status,availabilityConfirmationId:raw.availabilityConfirmationId,informedAt:raw.informedAt as string,acknowledgementId:acknowledgementId as number|null,acknowledgedAt:acknowledgedAt as string|null};
}
export function informationView(p:Pick<RequestProcessSummary,'localPickupInformation'>|null|undefined,business:boolean){
 const info=p?.localPickupInformation;
 return !info?null:business||info.status==='ACKNOWLEDGED'?'history':info.status==='AWAITING_CUSTOMER_DECISION'?'waiting':'active';
}
