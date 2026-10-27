import {API_BASE_URL} from '../../api/apiConfig';
import {isRecord,parseIsoDate} from './orderValueParsers';
export type HoursWindow={opensAt:string;closesAt:string};
export type SubmissionAdvisory={contract:'request-submission-advisory-v1';businessId:number;businessName:string;checkedAt:string;timeZone:'America/Santiago';localDate:string;
  status:'IN_SERVICE_HOURS'|'OUTSIDE_SERVICE_HOURS'|'UNKNOWN';reason:string;requiresConfirmation:boolean;todayWindow:HoursWindow|null;activeWindow:HoursWindow|null;nextWindow:HoursWindow|null};
export type ResponseAdvisory={contract:'business-response-hours-advisory-v1';current:SubmissionAdvisory;requested:null|{requestedFor:string;advisory:SubmissionAdvisory};canContinue:true};
export class HoursAdvisoryError extends Error{constructor(message:string,readonly status=0){super(message);}}
const windowValue=(v:unknown):v is HoursWindow|null=>v===null||isRecord(v)&&!!parseIsoDate(v.opensAt)&&!!parseIsoDate(v.closesAt)&&Date.parse(v.opensAt as string)<Date.parse(v.closesAt as string);
export function normalizeSubmissionAdvisory(v:unknown,businessId:number):SubmissionAdvisory|null{
  if(!isRecord(v)||v.contract!=='request-submission-advisory-v1'||v.businessId!==businessId||typeof v.businessName!=='string'||!v.businessName.trim()||!parseIsoDate(v.checkedAt)||v.timeZone!=='America/Santiago'||typeof v.localDate!=='string'||!/^\d{4}-\d\d-\d\d$/.test(v.localDate)||!['IN_SERVICE_HOURS','OUTSIDE_SERVICE_HOURS','UNKNOWN'].includes(String(v.status))||!['WITHIN_WINDOW','BEFORE_OPENING','AFTER_CLOSING','CLOSED_DAY','INVALID_SCHEDULE','AMBIGUOUS_SCHEDULE','CLOCK_CHANGE'].includes(String(v.reason))||v.requiresConfirmation!==(v.status==='OUTSIDE_SERVICE_HOURS')||!windowValue(v.todayWindow)||!windowValue(v.activeWindow)||!windowValue(v.nextWindow))return null;
  return v as SubmissionAdvisory;
}
async function read(path:string,token:string,signal?:AbortSignal){
  const response=await fetch(`${API_BASE_URL}${path}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
  if(!response.ok)throw new HoursAdvisoryError(response.status===401?'Tu sesión venció. Ingresa nuevamente.':response.status===404?'El negocio no está disponible.':response.status===403?'No tienes permiso para consultar este horario.':'No pudimos determinar el horario informado.',response.status);
  return response.json();
}
export async function readSubmissionAdvisory(id:number,token:string,signal?:AbortSignal){
  const value=normalizeSubmissionAdvisory(await read(`/businesses/${id}/submission-advisory`,token,signal),id);
  if(!value)throw new HoursAdvisoryError('No pudimos determinar el horario informado.');return value;
}
export async function readResponseAdvisory(id:number,token:string,schedule?:{date:string;time:string},signal?:AbortSignal):Promise<ResponseAdvisory>{
  const query=schedule?'?'+new URLSearchParams({requestedDate:schedule.date,requestedTime:schedule.time}):'';
  const raw:unknown=await read(`/businesses/${id}/response-advisory${query}`,token,signal);
  if(!isRecord(raw)||raw.contract!=='business-response-hours-advisory-v1'||raw.canContinue!==true)throw new HoursAdvisoryError('No pudimos determinar el horario informado.');
  const current=normalizeSubmissionAdvisory(raw.current,id),requested=raw.requested;
  const requestedAdvice=isRecord(requested)?normalizeSubmissionAdvisory(requested.advisory,id):null;
  if(!current||requested!==null&&(!isRecord(requested)||!parseIsoDate(requested.requestedFor)||!requestedAdvice||requestedAdvice.checkedAt!==requested.requestedFor)||!!schedule!==(requested!==null))throw new HoursAdvisoryError('No pudimos determinar el horario informado.');
  return {contract:'business-response-hours-advisory-v1',current,requested:requested as ResponseAdvisory['requested'],canContinue:true};
}
export function responseHoursText(value:ResponseAdvisory):string|null{
  const now=value.current.status,out=value.requested?.advisory.status;
  if(now==='OUTSIDE_SERVICE_HOURS'&&out==='OUTSIDE_SERVICE_HOURS')return 'Estás respondiendo y la hora solicitada también está fuera del horario de atención que configuraste en ZIPCO. Puedes continuar; tu horario habitual no cambia.';
  if(out==='OUTSIDE_SERVICE_HOURS')return 'La hora solicitada está fuera del horario de atención que configuraste en ZIPCO. Puedes continuar; tu horario habitual no cambia.';
  if(now==='OUTSIDE_SERVICE_HOURS')return 'Estás respondiendo fuera del horario de atención que configuraste en ZIPCO. Puedes continuar; tu horario habitual no cambia.';
  if(now==='UNKNOWN'||out==='UNKNOWN')return 'No pudimos determinar el horario informado. Puedes continuar.';
  return null;
}
export const hoursWhen=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));
export function chileSchedule(iso?:string|null){
  if(!iso||!parseIsoDate(iso))return undefined;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));
  const part=(name:string)=>parts.find(p=>p.type===name)!.value;
  return {date:`${part('year')}-${part('month')}-${part('day')}`,time:`${part('hour')}:${part('minute')}`};
}
