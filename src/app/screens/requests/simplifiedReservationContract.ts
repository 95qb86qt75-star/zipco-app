import {isRecord,parseIsoDate} from './orderValueParsers';

export const SIMPLIFIED_RESERVATION_FLOW='AVAILABILITY_V3' as const;
export const simplifiedReservationFlow=(p:{flowContract?:unknown}|null|undefined)=>p?.flowContract===SIMPLIFIED_RESERVATION_FLOW;
type TermsBase={version:3;termsVersion:string;scheduleHash:string;scheduledFor:string|null;timeZone:'America/Santiago'};
export type SimpleTerms=TermsBase & ({hoursPolicy?:undefined;opensAt:string;closesAt:string;holdMinutes:30}|{hoursPolicy:'ADVISORY_ONLY';opensAt:null;closesAt:null;holdMinutes:null});
export type SimpleReservationOffer={mode:'FREE';simplified:SimpleTerms}|{mode:'PREPAYMENT';requiredAmountClp:number;paymentKind:'DEPOSIT'|'FULL';simplified:SimpleTerms};
export type SimpleReservationInput={mode:'NONE'}|{mode:'FREE';hoursPolicy?:'ADVISORY_ONLY'}|{mode:'PREPAYMENT';requiredAmountClp:number;hoursPolicy?:'ADVISORY_ONLY'};
export type ReservationTiming={holdStartsAt:string;pickupBy:string|null;paymentDueAt:string|null};
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v)&&!!parseIsoDate(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function normalizeSimpleTerms(v:unknown):SimpleTerms|null{
  if(isRecord(v)&&v.hoursPolicy==='ADVISORY_ONLY'){
    if(v.version!==3||!hash(v.termsVersion)||!hash(v.scheduleHash)||v.timeZone!=='America/Santiago'||v.opensAt!==null||v.closesAt!==null||v.holdMinutes!==null||!(v.scheduledFor===null||date(v.scheduledFor)))return null;
    return {version:3,hoursPolicy:'ADVISORY_ONLY',termsVersion:v.termsVersion,scheduleHash:v.scheduleHash,opensAt:null,closesAt:null,holdMinutes:null,scheduledFor:v.scheduledFor as string|null,timeZone:'America/Santiago'};
  }
  if(!isRecord(v)||v.hoursPolicy!==undefined||v.version!==3||!hash(v.termsVersion)||!hash(v.scheduleHash)||!date(v.opensAt)||!date(v.closesAt)||Date.parse(v.opensAt)>=Date.parse(v.closesAt)||v.timeZone!=='America/Santiago'||v.holdMinutes!==30||!(v.scheduledFor===null||date(v.scheduledFor)&&Date.parse(v.scheduledFor)>=Date.parse(v.opensAt)&&Date.parse(v.scheduledFor)<Date.parse(v.closesAt)))return null;
  return {version:3,termsVersion:v.termsVersion,scheduleHash:v.scheduleHash,opensAt:v.opensAt,closesAt:v.closesAt,scheduledFor:v.scheduledFor as string|null,timeZone:'America/Santiago',holdMinutes:30};
}
export function normalizeSimpleOffer(v:unknown,total?:number):SimpleReservationOffer|null{
  if(!isRecord(v)||!['FREE','PREPAYMENT'].includes(String(v.mode)))return null;
  const simplified=normalizeSimpleTerms(v.simplified);if(!simplified)return null;
  const paid=v.mode==='PREPAYMENT';
  if(Object.keys(v).some(k=>!['mode','simplified',...(paid?['requiredAmountClp','paymentKind']:[])].includes(k)))return null;
  if(!paid)return {mode:'FREE',simplified};
  if(typeof v.requiredAmountClp!=='number'||!Number.isInteger(v.requiredAmountClp)||v.requiredAmountClp<1||v.requiredAmountClp>50000000||!['DEPOSIT','FULL'].includes(String(v.paymentKind))||total!==undefined&&(v.requiredAmountClp>total||(v.paymentKind==='FULL')!==(v.requiredAmountClp===total)))return null;
  return {mode:'PREPAYMENT',requiredAmountClp:v.requiredAmountClp,paymentKind:v.paymentKind as 'DEPOSIT'|'FULL',simplified};
}
export function normalizeReservationTiming(v:unknown):ReservationTiming|null{
  if(isRecord(v)&&date(v.holdStartsAt)&&v.pickupBy===null&&v.paymentDueAt===null)return {holdStartsAt:v.holdStartsAt,pickupBy:null,paymentDueAt:null};
  if(!isRecord(v)||!date(v.holdStartsAt)||!date(v.pickupBy)||Date.parse(v.holdStartsAt)>Date.parse(v.pickupBy)||!(v.paymentDueAt===null||date(v.paymentDueAt)&&Date.parse(v.paymentDueAt)<=Date.parse(v.pickupBy)))return null;
  return {holdStartsAt:v.holdStartsAt,pickupBy:v.pickupBy,paymentDueAt:v.paymentDueAt as string|null};
}
export const isSimpleOffer=(offer:unknown):offer is SimpleReservationOffer=>isRecord(offer)&&offer.simplified!==undefined;
export type AdvisoryReservationOffer=SimpleReservationOffer & {simplified:Extract<SimpleTerms,{hoursPolicy:'ADVISORY_ONLY'}>};
export const isAdvisoryOffer=(offer:unknown):offer is AdvisoryReservationOffer=>isSimpleOffer(offer)&&isRecord(offer.simplified)&&offer.simplified.hoursPolicy==='ADVISORY_ONLY';
export function simpleOfferInput(offer:{mode:string;requiredAmountClp?:number;simplified?:SimpleTerms}):SimpleReservationInput{
  const policy=offer.simplified?.hoursPolicy==='ADVISORY_ONLY'?{hoursPolicy:'ADVISORY_ONLY' as const}:{};
  return offer.mode==='PREPAYMENT'?{mode:'PREPAYMENT',requiredAmountClp:offer.requiredAmountClp!,...policy}:offer.mode==='FREE'?{mode:'FREE',...policy}:{mode:'NONE'};
}
