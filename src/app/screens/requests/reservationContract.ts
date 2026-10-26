import {isRecord,parseIsoDate} from './orderValueParsers';
import {simplifiedReservationFlow,normalizeSimpleOffer,normalizeReservationTiming,type SimpleReservationOffer,type SimpleReservationInput,type ReservationTiming} from './simplifiedReservationContract';

export const RESERVATION_FLOW='AVAILABILITY_V2' as const;
export const RESERVATION_QUERY='?processContract=availability-v3';
export const reservationFlow=(p:{flowContract?:unknown}|null|undefined)=>p?.flowContract===RESERVATION_FLOW||simplifiedReservationFlow(p);
export const processContractHeaders=(p:{flowContract?:unknown}|null|undefined):Record<string,string>=>simplifiedReservationFlow(p)?{'X-Process-Contract':'availability-v3'}:reservationFlow(p)?{'X-Process-Contract':'availability-v2'}:{};
export const RESERVATION_PATHS={CONFIRM_PICKUP_RESERVATION:'confirm-pickup-reservation',DECLINE_PICKUP_RESERVATION:'decline-pickup-reservation',
  CONTINUE_WITHOUT_RESERVATION:'continue-without-reservation',REPORT_RESERVATION_ISSUE:'report-reservation-issue',
  FINISH_OWN_RESERVATION_FOLLOW_UP:'finish-own-reservation-follow-up',OPEN_RESERVATION_WHATSAPP:'open-reservation-whatsapp',
  AUTHORIZE_RESERVATION_CONTACT:'authorize-reservation-contact',REVOKE_RESERVATION_CONTACT:'revoke-reservation-contact',CANCEL_PICKUP_RESERVATION:'cancel-pickup-reservation'} as const;
export type ReservationAction=keyof typeof RESERVATION_PATHS;
export type ReservationOffer={mode:'NONE'}|{mode:'FREE';confirmationDueAt:string;pickupBy:string}
  |{mode:'PREPAYMENT';confirmationDueAt:string;pickupBy:string;paymentDueAt:string;paymentKind:'DEPOSIT'|'FULL';requiredAmountClp:number;paymentInstructions:string}|SimpleReservationOffer;
export type ReservationOfferInput=ReservationOffer|SimpleReservationInput;
export type ReservationChoice={offerId:number;choice:'NONE'|'REQUEST_RESERVATION';note?:string;termsVersion?:string;noReservationAcknowledged?:true};
export const RESERVATION_STATUSES=['REQUESTED','AWAITING_BUSINESS_CONFIRMATION','CONFIRMED','DECLINED','EXPIRED','CANCELLED','NEEDS_CLARIFICATION','FULFILLED'] as const;
export type ReservationStatus=typeof RESERVATION_STATUSES[number];
export type Reservation={id:number;mode:'FREE'|'PREPAYMENT';status:ReservationStatus;effectiveStatus:ReservationStatus;requestedAt:string;timing?:ReservationTiming;confirmationSource?:'AUTO_BUSINESS_OFFER'|'BUSINESS_ACTION'|null;
  confirmedAt:string|null;confirmedByUserId:number|null;paymentReceiptDeclaration:{actorUserId:number;declaredAt:string;amountClp:number}|null;
  pickupCancellation:{actorUserId:number;cancelledAt:string;reasonDetail:string}|null;reasonDetail:string|null;continuedWithoutReservationAt:string|null};
export type ReservationFollowUp={ownFollowUpClosedAt:string|null;allowedActions:ReservationAction[];paymentConfirmationReminder?:{eligible:boolean;reservationId:number;expectedVersion:number}};
export const reservationId=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>0&&v<=2147483647;
const nullableDate=(v:unknown)=>v===null||!!parseIsoDate(v);
const text=(v:unknown,min:number,max:number):v is string=>typeof v==='string'&&v===v.trim()&&Array.from(v).length>=min&&Array.from(v).length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const utc=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v)&&!!parseIsoDate(v)&&new Date(v).toISOString().replace('.000Z','Z')===v.replace('.000Z','Z');
export function normalizeReservationOffer(v:unknown,total?:number):ReservationOffer|null{
  if(!isRecord(v))return null;
  if(v.simplified!==undefined)return normalizeSimpleOffer(v,total);
  if(v.mode==='NONE')return Object.keys(v).every(k=>k==='mode')?{mode:'NONE'}:null;
  if(!['FREE','PREPAYMENT'].includes(String(v.mode))||!utc(v.confirmationDueAt)||!utc(v.pickupBy)||Date.parse(v.confirmationDueAt)>Date.parse(v.pickupBy))return null;
  const base={confirmationDueAt:v.confirmationDueAt,pickupBy:v.pickupBy};
  if(v.mode==='FREE')return Object.keys(v).every(k=>['mode','confirmationDueAt','pickupBy'].includes(k))?{mode:'FREE',...base}:null;
  if(!utc(v.paymentDueAt)||Date.parse(v.paymentDueAt)>=Date.parse(v.confirmationDueAt)||!['DEPOSIT','FULL'].includes(String(v.paymentKind))||
    !reservationId(v.requiredAmountClp)||v.requiredAmountClp>50000000||!text(v.paymentInstructions,1,500)||
    Object.keys(v).some(k=>!['mode','confirmationDueAt','pickupBy','paymentDueAt','paymentKind','requiredAmountClp','paymentInstructions'].includes(k))||
    total!==undefined&&(v.paymentKind==='FULL'?v.requiredAmountClp!==total:v.requiredAmountClp>=total))return null;
  return {mode:'PREPAYMENT',...base,paymentDueAt:v.paymentDueAt,paymentKind:v.paymentKind as 'FULL'|'DEPOSIT',requiredAmountClp:v.requiredAmountClp,paymentInstructions:v.paymentInstructions};
}
export function normalizeReservationChoice(v:unknown):ReservationChoice|null{
  if(!isRecord(v)||!reservationId(v.offerId)||!['NONE','REQUEST_RESERVATION'].includes(String(v.choice))||(v.note!==undefined&&!text(v.note,0,300)))return null;
  if(v.termsVersion!==undefined&&(typeof v.termsVersion!=='string'||!/^[a-f0-9]{64}$/.test(v.termsVersion))||v.noReservationAcknowledged!==undefined&&v.noReservationAcknowledged!==true)return null;
  return {offerId:v.offerId,choice:v.choice as ReservationChoice['choice'],...(v.note!==undefined?{note:v.note as string}:{}),...(v.termsVersion!==undefined?{termsVersion:v.termsVersion as string}:{}),...(v.noReservationAcknowledged===true?{noReservationAcknowledged:true as const}:{})};
}
export function normalizeReservation(v:unknown,simple=false):Reservation|null{
  if(!isRecord(v)||!reservationId(v.id)||!['FREE','PREPAYMENT'].includes(String(v.mode))||!RESERVATION_STATUSES.includes(v.status as ReservationStatus)||
    !RESERVATION_STATUSES.includes(v.effectiveStatus as ReservationStatus)||!parseIsoDate(v.requestedAt)||!nullableDate(v.confirmedAt)||!nullableDate(v.continuedWithoutReservationAt)||
    !(v.confirmedByUserId===null||reservationId(v.confirmedByUserId))||!(v.reasonDetail===null||text(v.reasonDetail,3,1000)))return null;
  const timing=v.timing===undefined?undefined:normalizeReservationTiming(v.timing);
  if(simple?(!timing||!['AUTO_BUSINESS_OFFER','BUSINESS_ACTION',null].includes(v.confirmationSource as string|null)||v.mode==='FREE'&&(v.confirmationSource!=='AUTO_BUSINESS_OFFER'||v.confirmedAt===null||v.confirmedByUserId!==null)||v.mode==='PREPAYMENT'&&(v.confirmedAt===null?v.confirmationSource!==null||v.confirmedByUserId!==null:v.confirmationSource!=='BUSINESS_ACTION'||v.confirmedByUserId===null)):(v.timing!==undefined||v.confirmationSource!==undefined||!((v.confirmedAt===null)===(v.confirmedByUserId===null))))return null;
  let paymentReceiptDeclaration:Reservation['paymentReceiptDeclaration']=null,pickupCancellation:Reservation['pickupCancellation']=null;
  if(v.paymentReceiptDeclaration!==null){const d=v.paymentReceiptDeclaration;if(v.mode!=='PREPAYMENT'||!isRecord(d)||!reservationId(d.actorUserId)||!parseIsoDate(d.declaredAt)||!reservationId(d.amountClp)||d.amountClp>50000000)return null;paymentReceiptDeclaration={actorUserId:d.actorUserId,declaredAt:d.declaredAt as string,amountClp:d.amountClp};}
  if(v.pickupCancellation!==null){const c=v.pickupCancellation;if(!isRecord(c)||!reservationId(c.actorUserId)||!parseIsoDate(c.cancelledAt)||!text(c.reasonDetail,3,1000))return null;pickupCancellation={actorUserId:c.actorUserId,cancelledAt:c.cancelledAt as string,reasonDetail:c.reasonDetail};}
  return {id:v.id,mode:v.mode as Reservation['mode'],status:v.status as ReservationStatus,effectiveStatus:v.effectiveStatus as ReservationStatus,requestedAt:v.requestedAt as string,...(timing?{timing,confirmationSource:v.confirmationSource as Reservation['confirmationSource']}:{}),
    confirmedAt:v.confirmedAt as string|null,confirmedByUserId:v.confirmedByUserId as number|null,paymentReceiptDeclaration,pickupCancellation,reasonDetail:v.reasonDetail as string|null,continuedWithoutReservationAt:v.continuedWithoutReservationAt as string|null};
}
export function normalizeReservationFollowUp(v:unknown):ReservationFollowUp|null{
  if(!isRecord(v)||!nullableDate(v.ownFollowUpClosedAt)||!Array.isArray(v.allowedActions)||v.allowedActions.some(a=>!Object.hasOwn(RESERVATION_PATHS,String(a))))return null;
  const r=v.paymentConfirmationReminder;
  if(r!==undefined&&(!isRecord(r)||typeof r.eligible!=='boolean'||!reservationId(r.reservationId)||!reservationId(r.expectedVersion)))return null;
  return {ownFollowUpClosedAt:v.ownFollowUpClosedAt as string|null,allowedActions:[...v.allowedActions] as ReservationAction[],...(isRecord(r)?{paymentConfirmationReminder:{eligible:r.eligible as boolean,reservationId:r.reservationId as number,expectedVersion:r.expectedVersion as number}}:{})};
}
