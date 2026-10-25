import { AvailabilityError, type AvailabilityBody, type AvailabilityReceipt } from './availabilityApi';
import { AVAILABILITY_ACTION_PATHS, type AvailabilityAction } from './availabilityContract';

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
    async reconcile(scope:string,id:number,version:number){const name=slot(scope,id);const intent=memory.get(name)??saved(name);if(intent&&version>intent.version){storage?.removeItem(name);memory.delete(name);}},
    async run(scope:string,id:number,action:AvailabilityAction,body:AvailabilityBody,send:(key:string)=>Promise<AvailabilityReceipt>) {
      const name=slot(scope,id),fingerprint=await hash(JSON.stringify({action,body}));
      const restored=memory.has(name)?null:saved(name);
      let current:Intent|null|undefined=memory.get(name)??(restored?{...restored,uncertain:true}:null);
      if(current&&(current.version!==body.expectedVersion||current.action!==action||current.fingerprint!==fingerprint))
        throw new AvailabilityError('Hay una operación pendiente. Reintenta sus mismos datos o actualiza el estado antes de cambiarlos.',0);
      if(current?.receipt)return current.receipt;
      if(current?.confirmed)throw new AvailabilityError('La operación ya está confirmada. Actualiza su estado; no se enviará otra vez.',0,'ALREADY_CONFIRMED',true);
      if(current?.running)return current.running;
      if(!current){current={key:uuid(),action,version:body.expectedVersion,fingerprint,confirmed:false};try{persist(name,current);}catch{throw new AvailabilityError('No se pudo proteger el reintento. No enviamos la operación.',0);}}
      const intent=current;memory.set(name,intent);
      intent.running=send(intent.key).then(receipt=>{intent.receipt=receipt;intent.confirmed=true;try{persist(name,intent);}catch{/* Receipt remains final in memory. */}return receipt;})
        .catch(error=>{if(error instanceof AvailabilityError&&!intent.uncertain&&(error.status===400||error.code==='EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED')){
          try{storage?.removeItem(name);memory.delete(name);}catch{/* Keep the original intent if cleanup is unavailable. */}
        }else intent.uncertain=true;throw error;}).finally(()=>{intent.running=undefined;});
      return intent.running;
    },
  };
}
let shared:ReturnType<typeof createAvailabilityIntents>|undefined;
export const availabilityIntents=()=>shared??=createAvailabilityIntents(typeof sessionStorage==='undefined'?undefined:sessionStorage);
