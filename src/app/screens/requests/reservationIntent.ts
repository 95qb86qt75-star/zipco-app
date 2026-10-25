import {AvailabilityError} from './availabilityApi';
import {RESERVATION_PATHS,type ReservationAction} from './reservationContract';
import type {ReservationBody,ReservationReceipt} from './reservationApi';
type Saved={key:string;action:ReservationAction;version:number;fingerprint:string;confirmed:boolean};
type Intent=Saved&{receipt?:ReservationReceipt;running?:Promise<ReservationReceipt>;uncertain?:boolean};
export function createReservationIntents(storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>,uuid=()=>crypto.randomUUID(),hash=async(value:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('')){
  const memory=new Map<string,Intent>(),slot=(scope:string,id:number)=>`zipco-reservation:${scope}:${id}`;
  const read=(name:string):Intent|null=>{const raw=storage?.getItem(name);if(!raw)return null;try{const v=JSON.parse(raw);if(!v||!Object.hasOwn(RESERVATION_PATHS,v.action)||!Number.isSafeInteger(v.version)||v.version<1||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v.key)||!/^[a-f0-9]{64}$/.test(v.fingerprint)||typeof v.confirmed!=='boolean')throw Error();return {key:v.key,action:v.action,version:v.version,fingerprint:v.fingerprint,confirmed:v.confirmed,uncertain:true};}catch{throw new AvailabilityError('No se pudo recuperar la operación anterior. Actualiza el estado de la reserva.',0);}};
  const persist=(name:string,v:Intent)=>storage?.setItem(name,JSON.stringify({key:v.key,action:v.action,version:v.version,fingerprint:v.fingerprint,confirmed:v.confirmed}));
  return {
    async reconcile(scope:string,id:number,version:number){const name=slot(scope,id),v=memory.get(name)??read(name);if(v&&version>v.version){storage?.removeItem(name);memory.delete(name);}},
    async run(scope:string,id:number,action:ReservationAction,body:ReservationBody,send:(key:string)=>Promise<ReservationReceipt>){
      const name=slot(scope,id),fingerprint=await hash(JSON.stringify({action,body}));let current=memory.get(name)??read(name);
      if(current&&(current.version!==body.expectedVersion||current.fingerprint!==fingerprint||current.action!==action))throw new AvailabilityError('Hay una operación pendiente. Reintenta sus mismos datos o actualiza el estado antes de cambiarlos.',0);
      if(current?.receipt)return current.receipt;
      if(current?.confirmed)throw new AvailabilityError('La operación ya está confirmada. Actualiza su estado; no se enviará otra vez.',0,'ALREADY_CONFIRMED',true);
      if(current?.running)return current.running;
      if(!current){current={key:uuid(),action,version:body.expectedVersion,fingerprint,confirmed:false};try{persist(name,current);}catch{throw new AvailabilityError('No se pudo proteger el reintento. No enviamos la operación.',0);}}
      const intent=current;memory.set(name,intent);
      intent.running=send(intent.key).then(receipt=>{intent.receipt=receipt;intent.confirmed=true;try{persist(name,intent);}catch{/* Memory receipt is final. */}return receipt;}).catch(error=>{
        if(error instanceof AvailabilityError&&error.status===400&&!intent.uncertain){try{storage?.removeItem(name);memory.delete(name);}catch{/* Keep protected key. */}}else intent.uncertain=true;throw error;
      }).finally(()=>{intent.running=undefined;});return intent.running;
    },
  };
}
let shared:ReturnType<typeof createReservationIntents>|undefined;
export const reservationIntents=()=>shared??=createReservationIntents(typeof sessionStorage==='undefined'?undefined:sessionStorage);
