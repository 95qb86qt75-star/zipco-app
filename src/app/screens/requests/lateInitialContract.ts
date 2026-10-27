import {isRecord,parseIsoDate} from './orderValueParsers';

export const LATE_INITIAL_CONTRACT='late-initial-v1' as const;
export const LATE_INITIAL_PATHS={
  ASK_LATE_REQUEST_NEED:'ask-late-request-need',
  CONFIRM_LATE_REQUEST_NEED:'confirm-late-request-need',
  DECLINE_LATE_REQUEST_NEED:'decline-late-request-need',
  CLOSE_LATE_REQUEST_UNAVAILABLE:'close-late-request-unavailable',
} as const;
export type LateInitialAction=keyof typeof LATE_INITIAL_PATHS;
export const LATE_INITIAL_STATUSES=['OUT_OF_TIME','AWAITING_CUSTOMER','STILL_NEEDED','NO_LONGER_NEEDED','BUSINESS_UNAVAILABLE'] as const;
export type LateInitialView={contract:typeof LATE_INITIAL_CONTRACT;status:typeof LATE_INITIAL_STATUSES[number];scheduledFor:string;serverNow:string;delaySeconds:number;queryId:number|null;askedAt:string|null;answeredAt:string|null;requiresNewSchedule:boolean};
const id=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
export function normalizeLateInitial(value:unknown):LateInitialView|null{
  if(!isRecord(value)||value.contract!==LATE_INITIAL_CONTRACT||!LATE_INITIAL_STATUSES.includes(value.status as LateInitialView['status'])||
    !parseIsoDate(value.scheduledFor)||!parseIsoDate(value.serverNow)||typeof value.delaySeconds!=='number'||!Number.isSafeInteger(value.delaySeconds)||value.delaySeconds<0||
    !(value.queryId===null||id(value.queryId))||!(value.askedAt===null||parseIsoDate(value.askedAt))||!(value.answeredAt===null||parseIsoDate(value.answeredAt))||
    typeof value.requiresNewSchedule!=='boolean'||value.requiresNewSchedule!==(value.status==='STILL_NEEDED'))return null;
  const out=value.status==='OUT_OF_TIME',answered=['STILL_NEEDED','NO_LONGER_NEEDED'].includes(String(value.status));
  if(out&&(value.queryId!==null||value.askedAt!==null||value.answeredAt!==null)||
    ['AWAITING_CUSTOMER','STILL_NEEDED','NO_LONGER_NEEDED'].includes(String(value.status))&&(!id(value.queryId)||!value.askedAt)||
    value.status!=='BUSINESS_UNAVAILABLE'&&answered!==!!value.answeredAt||!!value.queryId!==!!value.askedAt)return null;
  const scheduled=Date.parse(value.scheduledFor as string),now=Date.parse(value.serverNow as string);
  if(now<=scheduled||value.delaySeconds!==Math.max(0,Math.floor((now-scheduled)/1000))||
    value.askedAt&&(Date.parse(value.askedAt as string)<scheduled||Date.parse(value.askedAt as string)>now)||
    value.answeredAt&&(Date.parse(value.answeredAt as string)<Date.parse(value.askedAt as string)||Date.parse(value.answeredAt as string)>now))return null;
  return {contract:LATE_INITIAL_CONTRACT,status:value.status as LateInitialView['status'],scheduledFor:value.scheduledFor as string,serverNow:value.serverNow as string,delaySeconds:value.delaySeconds,queryId:value.queryId as number|null,askedAt:value.askedAt as string|null,answeredAt:value.answeredAt as string|null,requiresNewSchedule:value.requiresNewSchedule};
}
export function lateInitialAllowed(p:{state:string;flowContract?:string;agreementPublicId:string|null;allowedActions:readonly string[];lateInitialResponse?:LateInitialView}|null|undefined,business:boolean,action:LateInitialAction){
  if(!p||p.flowContract!=='AVAILABILITY_V3'||p.state!=='AWAITING_BUSINESS_RESPONSE'||p.agreementPublicId!==null||!p.allowedActions.includes(action))return false;
  const s=p.lateInitialResponse?.status;
  return action==='ASK_LATE_REQUEST_NEED'?business&&s==='OUT_OF_TIME':action==='CLOSE_LATE_REQUEST_UNAVAILABLE'?business&&['OUT_OF_TIME','AWAITING_CUSTOMER','STILL_NEEDED'].includes(s??''):!business&&s==='AWAITING_CUSTOMER'&&!!p.lateInitialResponse?.queryId;
}
export const lateDelayLabel=(seconds:number)=>seconds<60?'menos de un minuto':`${Math.floor(seconds/60)} min de retraso`;
