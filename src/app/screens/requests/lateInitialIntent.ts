import {LateInitialError,type LateInitialBody,type LateInitialReceipt} from './lateInitialApi';
import {LATE_INITIAL_PATHS,type LateInitialAction} from './lateInitialContract';
type Saved={key:string;action:LateInitialAction;version:number;fingerprint:string;confirmed:boolean};
type Intent=Saved&{running?:Promise<LateInitialReceipt>;receipt?:LateInitialReceipt};
export function createLateInitialIntents(storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>,uuid=()=>crypto.randomUUID(),hash=async(v:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(n=>n.toString(16).padStart(2,'0')).join('')){
  const memory=new Map<string,Intent>(),feedback=new Set<string>();
  const slot=(scope:string,id:number)=>`zipco-late-initial:${scope}:${id}`;
  const read=(name:string):Saved|undefined=>{
    try{const raw=storage?.getItem(name);if(!raw)return;const v=JSON.parse(raw);if(!v||!Object.hasOwn(LATE_INITIAL_PATHS,v.action)||!Number.isSafeInteger(v.version)||v.version<1||typeof v.confirmed!=='boolean'||!/^[a-f0-9]{64}$/.test(v.fingerprint)||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v.key))throw Error();return v;}catch{throw new LateInitialError('No pudimos recuperar tu respuesta anterior. Comprueba el pedido antes de continuar.',0);}
  };
  const save=(name:string,v:Saved)=>storage?.setItem(name,JSON.stringify({key:v.key,action:v.action,version:v.version,fingerprint:v.fingerprint,confirmed:v.confirmed}));
  return {
    pending(scope:string,id:number){return memory.get(slot(scope,id))??read(slot(scope,id));},
    // Only after a fresh authorized GET; reads never send an action or celebrate.
    reconcile(scope:string,id:number,version:number){const name=slot(scope,id),v=memory.get(name)??read(name);if(v&&version>v.version&&!('running'in v&&v.running)){storage?.removeItem(name);memory.delete(name);}},
    claimFeedback(scope:string,id:number,receipt:LateInitialReceipt,action:LateInitialAction){const key=`${slot(scope,id)}:feedback:${receipt.requestProcess.lateInitialResponse?.queryId??'none'}:${receipt.requestProcess.version}:${action}`;if(feedback.has(key))return false;try{if(storage?.getItem(key))return false;storage?.setItem(key,'1');}catch{return false;}feedback.add(key);return true;},
    async run(scope:string,id:number,action:LateInitialAction,body:LateInitialBody,send:(key:string)=>Promise<LateInitialReceipt>){
      const name=slot(scope,id),fingerprint=await hash(JSON.stringify({action,body}));let intent:Intent|undefined=memory.get(name)??read(name);
      if(intent&&(intent.action!==action||intent.version!==body.expectedVersion||intent.fingerprint!==fingerprint))throw new LateInitialError('Primero comprueba si tu respuesta anterior quedó registrada. Conservamos tu elección y no enviaremos otra distinta.',0);
      if(intent?.receipt)return intent.receipt;
      if(intent?.confirmed)throw new LateInitialError('Tu respuesta ya está registrada. Pulsa «Comprobar pedido» para ver su estado.',0);
      if(intent?.running)return intent.running;
      if(!intent){intent={key:uuid(),action,version:body.expectedVersion,fingerprint,confirmed:false};try{save(name,intent);}catch{throw new LateInitialError('No pudimos proteger el reintento. No enviamos tu respuesta; vuelve a intentarlo.',0);}}
      const current=intent;memory.set(name,current);
      current.running=send(current.key).then(receipt=>{current.receipt=receipt;current.confirmed=true;try{save(name,current);}catch{/* Final receipt remains in memory. */}return receipt;}).finally(()=>{current.running=undefined;});return current.running;
    },
  };
}
let shared:ReturnType<typeof createLateInitialIntents>|undefined;
export const lateInitialIntents=()=>shared??=createLateInitialIntents(typeof sessionStorage==='undefined'?undefined:sessionStorage);
