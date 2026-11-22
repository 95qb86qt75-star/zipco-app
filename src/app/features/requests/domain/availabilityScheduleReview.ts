import {isRecord,parseIsoDate} from './orderValueParsers';
import type {RequestProcessSummary} from './requestProcess';
import {isSimpleOffer} from './simplifiedReservationContract';
import {santiagoDraftTime} from './alternativeDraft';

export const SCHEDULE_REVIEW_CONTRACT='availability-schedule-review-v1' as const;
export const SCHEDULE_REVIEW_HEADERS={'X-Availability-Schedule-Contract':SCHEDULE_REVIEW_CONTRACT};
export const SCHEDULE_ACTION_PATHS={REQUEST_AVAILABILITY_SCHEDULE:'request-availability-schedule',RENEW_AVAILABILITY_SCHEDULE:'renew-availability-schedule'} as const;
export type ScheduleAction=keyof typeof SCHEDULE_ACTION_PATHS;
export type RequestedSchedule={mode:'SCHEDULED';date:string;time:string};
export type AvailabilityScheduleReview={
  contract:typeof SCHEDULE_REVIEW_CONTRACT;
  phase:'EXPIRED_OFFER'|'AWAITING_BUSINESS'|'RENEWED_OFFER';
  request:null|{scheduleRequestId:string;sourceProposalId:number;sourceOfferId:number;sourceTermsVersion:string;
    requestedSchedule:RequestedSchedule;requestedFor:string;note:string|null;requestedAt:string;requestedVersion:number};
  canRequest:boolean;canRenew:boolean;reservationAvailable:boolean;blockingReason:string|null;
  categories:{customer:'WAITING_RESPONSE'|'AWAITING_BUSINESS';business:'WAITING_RESPONSE'|'PENDING'};
};
export const scheduleUuid=/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
export const scheduleHash=/^[a-f\d]{64}$/;
const id=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0&&v<=2147483647;
export function validRequestedSchedule(v:unknown):v is RequestedSchedule{
  return isRecord(v)&&v.mode==='SCHEDULED'&&typeof v.date==='string'&&typeof v.time==='string'&&
    Object.keys(v).length===3&&santiagoDraftTime(v.date,v.time)!==null;
}
export function normalizeAvailabilityScheduleReview(v:unknown,p:RequestProcessSummary):AvailabilityScheduleReview|null|undefined{
  if(v===undefined)return undefined;
  if(!isRecord(v)||v.contract!==SCHEDULE_REVIEW_CONTRACT)return null;
  if(p.flowContract!=='AVAILABILITY_V3'||p.agreementPublicId||p.reservation||p.availability?.path!=='LOCAL_PICKUP'||
    !isSimpleOffer(p.availability.reservationOffer)||!['FREE','PREPAYMENT'].includes(p.availability.reservationOffer!.mode)||
    !['EXPIRED_OFFER','AWAITING_BUSINESS','RENEWED_OFFER'].includes(String(v.phase))||
    typeof v.canRequest!=='boolean'||typeof v.canRenew!=='boolean'||typeof v.reservationAvailable!=='boolean'||
    !(v.blockingReason===null||typeof v.blockingReason==='string')||!isRecord(v.categories))return null;
  const pending=v.phase==='AWAITING_BUSINESS',renewed=v.phase==='RENEWED_OFFER',r=v.request;
  if(v.categories.customer!==(pending?'AWAITING_BUSINESS':'WAITING_RESPONSE')||v.categories.business!==(pending?'PENDING':'WAITING_RESPONSE')||
    p.state!==(renewed?'AWAITING_CUSTOMER_DECISION':'AWAITING_CUSTOMER_CONTINUATION')||
    pending&&(v.reservationAvailable||p.allowedActions.includes('CONTINUE_REQUEST'))||
    v.phase==='EXPIRED_OFFER'&&(v.reservationAvailable||v.blockingReason!=='RESERVATION_SCHEDULE_EXPIRED')||
    v.canRequest&&v.phase!=='EXPIRED_OFFER'||v.canRenew&&!pending||v.canRequest&&v.canRenew)return null;
  if((pending||renewed)&&r===null)return null;
  if(r!==null){
    if(!isRecord(r)||typeof r.scheduleRequestId!=='string'||!scheduleUuid.test(r.scheduleRequestId)||
      !id(r.sourceProposalId)||!id(r.sourceOfferId)||typeof r.sourceTermsVersion!=='string'||!scheduleHash.test(r.sourceTermsVersion)||
      !validRequestedSchedule(r.requestedSchedule)||!parseIsoDate(r.requestedFor)||!parseIsoDate(r.requestedAt)||
      !id(r.requestedVersion)||r.requestedVersion>p.version||!(r.note===null||typeof r.note==='string'&&r.note.length<=300)||
      santiagoDraftTime(r.requestedSchedule.date,r.requestedSchedule.time)!==Date.parse(r.requestedFor as string))return null;
    if(!renewed&&(r.sourceProposalId!==p.currentProposalId||r.sourceOfferId!==p.availability.availabilityConfirmationId||r.sourceTermsVersion!==p.availability.reservationOffer!.simplified.termsVersion))return null;
  }
  if(v.canRequest!==p.allowedActions.includes('REQUEST_AVAILABILITY_SCHEDULE')||v.canRenew!==p.allowedActions.includes('RENEW_AVAILABILITY_SCHEDULE'))return null;
  return v as AvailabilityScheduleReview;
}
let capability:{token:string;enabled:boolean}|undefined;
export function rememberScheduleReviewCapability(token:string,body:unknown){
  const cap=isRecord(body)?body.availabilityScheduleReview:null;
  capability={token,enabled:isRecord(cap)&&cap.contract===SCHEDULE_REVIEW_CONTRACT&&cap.enabled===true};
}
export const knownScheduleReviewHeaders=(token:string):Record<string,string>=>capability?.token===token&&capability.enabled?SCHEDULE_REVIEW_HEADERS:{};
export function scheduleReviewFor(p:RequestProcessSummary|null|undefined){
  try{const token=localStorage.getItem('zipco-token');return token&&knownScheduleReviewHeaders(token)['X-Availability-Schedule-Contract']?p?.availabilityScheduleReview:undefined;}catch{return undefined;}
}
