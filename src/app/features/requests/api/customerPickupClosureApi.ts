import {API_BASE_URL} from '../../../api/apiConfig';
import {normalizeRequestProcess,type RequestProcessSummary} from '../domain/requestProcess';
import {PICKUP_CLOSURE_HEADERS,PICKUP_CLOSURE_CONTRACT,pickupChoice,type PickupClosureChoice} from '../domain/customerPickupClosure';
import {processContractHeaders} from '../domain/reservationContract';
import {isRecord} from '../domain/orderValueParsers';
import {processApiError} from '../domain/requestProcessErrors';
import {participantHeaders} from './participantContractHeaders';

export const PICKUP_ENDPOINT='actions/finish-customer-pickup';
export type PickupIntent={key:string;processId:number;orderId:number;agreementPublicId:string;endpoint:typeof PICKUP_ENDPOINT;contracts:Record<string,string>;body:{expectedVersion:number;confirmationAccepted:true;choice:PickupClosureChoice}};
const id=(n:unknown):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0&&n<=2147483647;
const allowedHeaders=['X-Customer-Pickup-Closure-Contract','X-Process-Contract','X-Late-Initial-Contract','X-Service-Hours-Contract','X-Customer-Receipt-Contract'];
export function validPickupIntent(v:unknown):v is PickupIntent{
 return isRecord(v)&&typeof v.key==='string'&&/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(v.key)&&id(v.processId)&&id(v.orderId)&&typeof v.agreementPublicId==='string'&&!!v.agreementPublicId&&v.endpoint===PICKUP_ENDPOINT&&isRecord(v.contracts)&&v.contracts['X-Customer-Pickup-Closure-Contract']===PICKUP_CLOSURE_CONTRACT&&Object.entries(v.contracts).every(([k,val])=>allowedHeaders.includes(k)&&typeof val==='string'&&!/[\r\n]/.test(val))&&isRecord(v.body)&&Object.keys(v.body).sort().join(',')==='choice,confirmationAccepted,expectedVersion'&&id(v.body.expectedVersion)&&v.body.confirmationAccepted===true&&pickupChoice(v.body.choice);
}
export async function pickupIntent(p:RequestProcessSummary,orderId:number,choice:PickupClosureChoice,token:string):Promise<PickupIntent>{
 const headers=await participantHeaders(token,true);
 if(!headers['X-Customer-Pickup-Closure-Contract'])throw Error('Actualiza ZIPCO: esta decisión no está disponible en esta sesión.');
 return {key:crypto.randomUUID(),processId:p.id,orderId,agreementPublicId:p.agreementPublicId!,endpoint:PICKUP_ENDPOINT,
  contracts:{...PICKUP_CLOSURE_HEADERS,...processContractHeaders(p),...(headers['X-Customer-Receipt-Contract']?{'X-Customer-Receipt-Contract':headers['X-Customer-Receipt-Contract']}:{})},body:{expectedVersion:p.version,confirmationAccepted:true,choice}};
}
function same(p:RequestProcessSummary,i:PickupIntent){return p.id===i.processId&&p.agreementPublicId===i.agreementPublicId&&p.availability?.path==='LOCAL_PICKUP';}
function saved(raw:unknown,i:PickupIntent){
 const p=isRecord(raw)?normalizeRequestProcess(raw.requestProcess):null,c=p?.customerPickupClosure;
 if(!isRecord(raw)||raw.orderId!==i.orderId||!p||!same(p,i)||!c||c.choice!==i.body.choice||p.version<=i.body.expectedVersion||
  (c.scope==='REQUEST'?(raw.orderStatus!=='completed'||p.state!=='COMPLETED'||p.customerReceipt?.status!=='FINALIZED'):!['accepted','ready'].includes(String(raw.orderStatus))))throw Error('No pudimos verificar la decisión guardada. Comprueba el envío original.');
 return p;
}
async function request(i:PickupIntent,token:string,signal:AbortSignal,post:boolean){
 if(!validPickupIntent(i))throw Error('El envío guardado no es válido. No enviaremos otra decisión.');
 const headers=await participantHeaders(token,true);
 if(!headers['X-Customer-Pickup-Closure-Contract'])throw Error('Actualiza ZIPCO para comprobar tu decisión.');
 const response=await fetch(`${API_BASE_URL}/request-processes/${i.processId}/${post?i.endpoint:'customer-pickup-result'}`,{method:post?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...i.contracts,'Idempotency-Key':i.key,...(post?{'Content-Type':'application/json'}:{})},cache:'no-store',signal,...(post?{body:JSON.stringify(i.body)}:{})});
 const raw:unknown=await response.json().catch(()=>null);
 if(!response.ok){
  const error=processApiError(response.status,raw);
  // Only an explicit rejection of this command permits a new decision. A timeout,
  // malformed receipt or recorded:false never proves that the command was rejected.
  if(post&&response.status===409&&isRecord(raw)&&['STALE_VERSION','INCOMPATIBLE_STATE','CUSTOMER_RECEIPT_RESERVATION_BLOCKED','FLOW_CONTRACT_REQUIRED'].includes(String(raw.code)))Object.assign(error,{pickupRejected:true});
  throw error;
 }
 return raw;
}
export async function sendPickupClosure(i:PickupIntent,token:string,signal:AbortSignal){return saved(await request(i,token,signal,true),i);}
export async function readPickupClosure(i:PickupIntent,token:string,signal:AbortSignal){
 const raw=await request(i,token,signal,false),current=isRecord(raw)?normalizeRequestProcess(raw.current):null;
 if(!isRecord(raw)||typeof raw.recorded!=='boolean'||!current||!same(current,i)||current.version<i.body.expectedVersion)throw Error('No pudimos comprobar el estado actual. Conservamos el envío original.');
 if(raw.recorded){const original=saved(raw.result,i);if(current.version<original.version||current.customerPickupClosure?.eventId!==original.customerPickupClosure?.eventId)throw Error('La lectura actual está incompleta. Conservamos el envío original.');}
 return {recorded:raw.recorded,requestProcess:current};
}
