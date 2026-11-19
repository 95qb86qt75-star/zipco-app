import {API_BASE_URL} from '../../../api/apiConfig';
import {isRecord,parseIsoDate} from '../domain/orderValueParsers';
import {chileSchedule,HoursAdvisoryError,type HoursWindow} from './serviceHoursAdvisory';

export const REQUESTED_HOURS_CONTRACT='request-submission-advisory-v2' as const;
export type RequestedMoment={mode:'IMMEDIATE'}|{mode:'SCHEDULED';requestedDate:string;requestedTime:string};
const weekdays=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
export type WeeklyHours={days:typeof weekdays[number][];open:string;close:string;crossesMidnight:boolean};
export type RequestedMomentAdvisory={
  contract:typeof REQUESTED_HOURS_CONTRACT;businessId:number;businessName:string;
  checkedAt:string;evaluatedAt:string;timeZone:'America/Santiago';localDate:string;
  mode:RequestedMoment['mode'];requestedDate:string|null;requestedTime:string|null;
  status:'IN_SERVICE_HOURS'|'OUTSIDE_SERVICE_HOURS'|'UNKNOWN';reason:string;requiresConfirmation:boolean;
  activeWindow:HoursWindow|null;dayWindow:HoursWindow|null;nextWindow:HoursWindow|null;weeklyHours:WeeklyHours[]|null;
};
const time=(s:unknown):s is string=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const day=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const windowValue=(v:unknown)=>v===null||isRecord(v)&&!!parseIsoDate(v.opensAt)&&!!parseIsoDate(v.closesAt)&&Date.parse(String(v.opensAt))<Date.parse(String(v.closesAt));
export const sameRequestedMoment=(a:RequestedMoment,b:RequestedMoment)=>a.mode===b.mode&&(a.mode==='IMMEDIATE'||b.mode==='SCHEDULED'&&a.requestedDate===b.requestedDate&&a.requestedTime===b.requestedTime);
export function requestedMoment(delivery:{needNow:boolean;deliveryDate:string;deliveryTime:string}):RequestedMoment{
  if(delivery.needNow)return {mode:'IMMEDIATE'};
  if(!day(delivery.deliveryDate)||!time(delivery.deliveryTime))throw new RequestedHoursError('Selecciona una fecha y hora válidas.',400,'REQUEST_ADVISORY_INVALID_SCHEDULE');
  return {mode:'SCHEDULED',requestedDate:delivery.deliveryDate,requestedTime:delivery.deliveryTime};
}
export class RequestedHoursError extends HoursAdvisoryError{
  constructor(message:string,status:number,readonly code:string){super(message,status);}
}
export function normalizeRequestedMomentAdvisory(v:unknown,businessId:number,selection:RequestedMoment):RequestedMomentAdvisory|null{
  if(!isRecord(v)||v.contract!==REQUESTED_HOURS_CONTRACT||v.businessId!==businessId||typeof v.businessName!=='string'||!v.businessName.trim()||
    !parseIsoDate(v.checkedAt)||!parseIsoDate(v.evaluatedAt)||v.timeZone!=='America/Santiago'||v.localDate!==chileSchedule(String(v.evaluatedAt))?.date||
    v.mode!==selection.mode||!['IN_SERVICE_HOURS','OUTSIDE_SERVICE_HOURS','UNKNOWN'].includes(String(v.status))||
    !['WITHIN_WINDOW','BEFORE_OPENING','AFTER_CLOSING','CLOSED_DAY','INVALID_SCHEDULE','AMBIGUOUS_SCHEDULE','CLOCK_CHANGE'].includes(String(v.reason))||
    v.requiresConfirmation!==(v.status==='OUTSIDE_SERVICE_HOURS')||!windowValue(v.dayWindow)||!windowValue(v.activeWindow)||!windowValue(v.nextWindow))return null;
  if(selection.mode==='IMMEDIATE'){
    if(v.requestedDate!==null||v.requestedTime!==null||Date.parse(String(v.evaluatedAt))!==Date.parse(String(v.checkedAt)))return null;
  }else if(v.requestedDate!==selection.requestedDate||v.requestedTime!==selection.requestedTime||
    chileSchedule(String(v.evaluatedAt))?.date!==selection.requestedDate||chileSchedule(String(v.evaluatedAt))?.time!==selection.requestedTime||
    Date.parse(String(v.evaluatedAt))<=Date.parse(String(v.checkedAt)))return null;
  if(v.status==='UNKNOWN'){if(v.weeklyHours!==null)return null;}
  else{
    if(!Array.isArray(v.weeklyHours)||v.weeklyHours.length>7)return null;
    const seen=new Set<string>();
    for(const group of v.weeklyHours){
      if(!isRecord(group)||!Array.isArray(group.days)||!group.days.length||!time(group.open)||!time(group.close)||group.open===group.close||group.crossesMidnight!==(group.close<group.open))return null;
      let previous=-1;
      for(const d of group.days){const index=weekdays.indexOf(d as typeof weekdays[number]);if(index<=previous||seen.has(String(d)))return null;previous=index;seen.add(String(d));}
    }
  }
  return v as RequestedMomentAdvisory;
}
const invalidMessages:Record<string,string>={
  REQUEST_ADVISORY_INVALID_QUERY:'Revisa la opción de fecha y hora de la solicitud.',
  REQUEST_ADVISORY_INVALID_SCHEDULE:'Selecciona una fecha y hora válidas.',
  REQUEST_ADVISORY_SCHEDULE_PAST:'La fecha y hora seleccionadas ya pasaron. Elige una fecha y hora futuras.',
  REQUEST_ADVISORY_CLOCK_CHANGE:'Esta hora no está disponible debido al cambio de horario. Selecciona otra hora.',
};
export async function readRequestedMomentAdvisory(id:number,token:string,selection:RequestedMoment,signal?:AbortSignal){
  const query=new URLSearchParams({contract:REQUESTED_HOURS_CONTRACT,mode:selection.mode,...(selection.mode==='SCHEDULED'?{requestedDate:selection.requestedDate,requestedTime:selection.requestedTime}:{})});
  const response=await fetch(`${API_BASE_URL}/businesses/${id}/submission-advisory?${query}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
  const raw:unknown=await response.json().catch(()=>null);
  if(!response.ok){const code=isRecord(raw)&&typeof raw.code==='string'?raw.code:'';
    throw new RequestedHoursError(invalidMessages[code]??(response.status===401?'Tu sesión venció. Ingresa nuevamente.':response.status===404?'El negocio no está disponible.':response.status===403?'No tienes permiso para consultar este horario.':'No pudimos comprobar el horario solicitado.'),response.status,code);}
  const result=normalizeRequestedMomentAdvisory(raw,id,selection);
  if(!result)throw new RequestedHoursError('No pudimos verificar el horario elegido con esta versión del servidor. Reintenta la consulta.',502,'ADVISORY_CONTRACT_MISMATCH');
  return result;
}
const names:Record<typeof weekdays[number],string>={monday:'lunes',tuesday:'martes',wednesday:'miércoles',thursday:'jueves',friday:'viernes',saturday:'sábado',sunday:'domingo'};
export function weeklyHoursText(groups:WeeklyHours[]){
  return groups.map(g=>{
    const contiguous=g.days.length>2&&g.days.every((d,i)=>i===0||weekdays.indexOf(d)===weekdays.indexOf(g.days[i-1])+1);
    const days=g.days.length===7?'todos los días':contiguous?`de ${names[g.days[0]]} a ${names[g.days.at(-1)!]}`:g.days.length===1?`los ${names[g.days[0]]}`:g.days.map(d=>names[d]).join(', ').replace(/, ([^,]*)$/,' y $1');
    return `${days}, de ${g.open} a ${g.close}${g.crossesMidnight?' del día siguiente':''}`;
  }).join('; ');
}
export function requestedHoursMessage(a:RequestedMomentAdvisory){
  const hours=a.weeklyHours?.length?`${a.businessName} atiende ${weeklyHoursText(a.weeklyHours)}. `:`${a.businessName}: `;
  return hours+(a.mode==='IMMEDIATE'?'En este momento estás fuera del horario informado.':a.reason==='CLOSED_DAY'?'El día elegido no tiene atención informada.':'La fecha y hora de tu solicitud están fuera del horario informado.');
}
