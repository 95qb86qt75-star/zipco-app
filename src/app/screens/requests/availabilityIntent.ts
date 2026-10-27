import {definitiveHoursRejection} from './serviceHoursPolicy';
import { AvailabilityError, type AvailabilityBody, type AvailabilityReceipt } from './availabilityApi';
import { AVAILABILITY_ACTION_PATHS, type AvailabilityAction } from './availabilityContract';
import type {RequestProcessSummary} from './requestProcess';

export const CHECK_AVAILABILITY_MESSAGE='No pudimos comprobar si tu respuesta se envió. Conservamos lo que escribiste. Pulsa «Comprobar pedido» antes de volver a enviarla.';
const rejectedAvailabilityCodes=new Set(['RESERVATION_OUTSIDE_SERVICE_WINDOW','RESERVATION_AMBIGUOUS_SERVICE_WINDOW','RESERVATION_HOURS_UNAVAILABLE','RESERVATION_PAYMENT_WINDOW_UNAVAILABLE','RESERVATION_SCHEDULE_EXPIRED','RESERVATION_TERMS_CHANGED','RESERVATION_SCHEDULE_CHANGED']);

type Saved = { key:string; action:AvailabilityAction; version:number; fingerprint:string; confirmed:boolean };
type Intent = Saved & { receipt?:AvailabilityReceipt; running?:Promise<AvailabilityReceipt>; uncertain?:boolean };
export function createAvailabilityIntents(storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>,uuid=()=>crypto.randomUUID(),
  hash=async(value:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('')) {
  const memory=new Map<string,Intent>();
  const slot=(scope:string,id:number)=>`zipco-availability:${scope}:${id}`;
  const saved=(name:string):Saved|null=>{
    const raw=storage?.getItem(name);if(!raw)return null;
    try{const v=JSON.parse(raw);if(!v||!Object.hasOwn(AVAILABILITY_ACTION_PATHS,v.action)||!Number.isSafeInteger(v.version)||v.version<1||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v.key)||!/^[a-f0-9]{64}$/.test(v.fingerprint)||typeof v.confirmed!=='boolean')throw Error();return v;}
    catch{throw new AvailabilityError('No se pudo recuperar la operación anterior. Actualiza el pedido antes de continuar.',0);}
  };
  const persist=(name:string,v:Saved)=>storage?.setItem(name,JSON.stringify({key:v.key,action:v.action,version:v.version,fingerprint:v.fingerprint,confirmed:v.confirmed}));
  return {
    hasPending(scope:string,id:number){const name=slot(scope,id);return !!(memory.get(name)??saved(name));},
    async reconcile(scope:string,id:number,version:number){const name=slot(scope,id);const intent=memory.get(name)??saved(name);if(intent&&version>intent.version){storage?.removeItem(name);memory.delete(name);}},
    // Only called after an explicit, fresh authorized GET. No POST is performed.
    // A later send still uses this exact version: the backend lock/version gate
    // prevents a second availability if an older request commits in the meantime.
    async recoverConfirmation(scope:string,id:number,process:RequestProcessSummary){
      const name=slot(scope,id),intent=memory.get(name)??saved(name);
      if(!intent)return false;
      if(intent.action!=='CONFIRM_AVAILABILITY'||intent.confirmed||'receipt' in intent&&intent.receipt||'running' in intent&&intent.running||process.id!==id||process.version!==intent.version||process.state!=='AWAITING_BUSINESS_RESPONSE'||process.agreementPublicId!==null||process.availability||!process.allowedActions.includes('CONFIRM_AVAILABILITY'))return false;
      storage?.removeItem(name);memory.delete(name);return true;
    },
    async run(scope:string,id:number,action:AvailabilityAction,body:AvailabilityBody,send:(key:string)=>Promise<AvailabilityReceipt>) {
      const name=slot(scope,id),fingerprint=await hash(JSON.stringify({action,body}));
      const restored=memory.has(name)?null:saved(name);
      let current:Intent|null|undefined=memory.get(name)??(restored?{...restored,uncertain:true}:null);
      if(current&&(current.version!==body.expectedVersion||current.action!==action||current.fingerprint!==fingerprint))
        throw new AvailabilityError(CHECK_AVAILABILITY_MESSAGE,0,'CHECK_AVAILABILITY_REQUIRED',true);
      if(current?.receipt)return current.receipt;
      if(current?.confirmed)throw new AvailabilityError('Tu respuesta ya está confirmada. Pulsa «Comprobar pedido» para ver cómo quedó; no la enviaremos otra vez.',0,'ALREADY_CONFIRMED',true);
      if(current?.running)return current.running;
      if(!current){current={key:uuid(),action,version:body.expectedVersion,fingerprint,confirmed:false};try{persist(name,current);}catch{throw new AvailabilityError('No se pudo proteger el reintento. No enviamos la operación.',0);}}
      const intent=current;memory.set(name,intent);
      intent.running=send(intent.key).then(receipt=>{intent.receipt=receipt;intent.confirmed=true;try{persist(name,intent);}catch{/* Receipt remains final in memory. */}return receipt;})
        .catch(error=>{if(error instanceof AvailabilityError&&!intent.uncertain&&(error.status===400||definitiveHoursRejection(error.status,error.code)||error.code==='EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED'||action==='CONFIRM_AVAILABILITY'&&error.status===409&&rejectedAvailabilityCodes.has(error.code))){
          try{storage?.removeItem(name);memory.delete(name);}catch{/* Keep the original intent if cleanup is unavailable. */}
        }else intent.uncertain=true;throw error;}).finally(()=>{intent.running=undefined;});
      return intent.running;
    },
  };
}
let shared:ReturnType<typeof createAvailabilityIntents>|undefined;
export const availabilityIntents=()=>shared??=createAvailabilityIntents(typeof sessionStorage==='undefined'?undefined:sessionStorage);
