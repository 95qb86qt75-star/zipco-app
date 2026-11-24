import {useEffect,useRef,useState} from 'react';
import type {MyOrder,BusinessRequest} from '../domain/types';
import type {RequestProcessSummary} from '../domain/requestProcess';
import {canFinishPickup,knownPickupClosureHeaders,PICKUP_CHOICE_LABELS,type PickupClosureChoice} from '../domain/customerPickupClosure';
import {pickupIntent,validPickupIntent,sendPickupClosure,readPickupClosure} from '../api/customerPickupClosureApi';
import {readCoordinationSession,subscribeCoordinationSession} from './intents/coordinationSession';
import {showStatusToast} from '../shared/feedback/statusToast';

const locks=new Set<string>();
export const pickupSlot=(user:string,process:number)=>`zipco:customer-pickup:${user}:${process}`;
export default function useCustomerPickupClosure(order:MyOrder|BusinessRequest,refresh:()=>void){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false),[pendingChoice,setPendingChoice]=useState<PickupClosureChoice|null>(null),[done,setDone]=useState<{label:string;out:boolean;requestFinished?:boolean}|null>(null);
 const session=useRef(readCoordinationSession()).current,identity=useRef({orderId:order.id,processId:order.requestProcess?.id}).current;
 const latest=useRef(order);latest.current=order;const alive=useRef(true),lock=useRef(false),controller=useRef<AbortController|null>(null);
 const slot=session&&identity.processId?pickupSlot(session.userId,identity.processId):null;
 const active=()=>alive.current&&!!session&&readCoordinationSession()===session&&latest.current.id===identity.orderId&&latest.current.requestProcess?.id===identity.processId;
 const read=()=>{const raw=slot?sessionStorage.getItem(slot):null;if(!raw)return null;const intent:unknown=JSON.parse(raw);if(!validPickupIntent(intent))throw Error('No pudimos recuperar la decisión anterior. No enviaremos otra.');return intent;};
 useEffect(()=>{alive.current=true;const off=subscribeCoordinationSession(()=>{if(!active())controller.current?.abort();});return()=>{alive.current=false;controller.current?.abort();off();};},[]);
 useEffect(()=>{if(!slot)return;try{const saved=read();setPending(!!saved);setPendingChoice(saved?.body.choice??null);}catch(e){setPending(true);setError((e as Error).message);}},[slot]);
 const publish=(p:RequestProcessSummary)=>{
  if(!active())return;const old=latest.current.requestProcess,next=old&&old.version>p.version?old:p;
  const status=next.state==='COMPLETED'?'completed':next.state==='READY'?'ready':next.state==='CLOSED'?'cancelled':latest.current.status;
  window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:{orderId:identity.orderId,orderStatus:status,requestProcess:next}}));refresh();window.dispatchEvent(new Event('zipco-requests-refresh'));
  showStatusToast({tone:'green',title:'Solicitud en tu Historial',line:next.customerPickupClosure?.scope==='REQUEST'?'Confirmaste recepción y finalización.':'Cerraste solo tu seguimiento. El negocio conserva su recorrido.',actionLabel:'Ver Historial',onAction:()=>window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:false,view:'history',explicit:true}}))});
 };
 const perform=async(kind:'send'|'retry'|'check',choice?:PickupClosureChoice)=>{
  const p=latest.current.requestProcess;if(!active()||!p||!slot||!session||lock.current||locks.has(slot)||!identity.orderId)return false;
  lock.current=true;locks.add(slot);setBusy(true);setError('');const c=new AbortController();controller.current=c;const timer=setTimeout(()=>c.abort(),20000);
  try{
   let intent=read();
   if(kind==='send'){
    if(intent)throw Error('Hay un envío pendiente. Comprueba su estado antes de decidir de nuevo.');
    if(!canFinishPickup(p)||!choice||!p.customerPickupClosureOptions?.choices.includes(choice)||choice==='RECEIVED'&&p.customerPickupClosureOptions.receiptBlock)throw Error('Actualiza las condiciones antes de confirmar esta decisión.');
    intent=await pickupIntent(p,identity.orderId,choice,session.token);if(!active())return false;
    const text=JSON.stringify(intent);sessionStorage.setItem(slot,text);if(sessionStorage.getItem(slot)!==text)throw Error('No pudimos proteger el envío. No se envió nada.');setPending(true);setPendingChoice(choice);
   }
   if(!intent)throw Error('No hay un envío original que comprobar.');
   if(kind==='check'){
    const result=await readPickupClosure(intent,session.token,c.signal);if(!active())return false;
    if(!result.recorded){setPending(true);setError('El servidor aún no confirma el envío. Comprueba de nuevo o reintenta el envío original.');return false;}
    sessionStorage.removeItem(slot);setPending(false);setPendingChoice(null);publish(result.requestProcess);return true;
   }
   const result=await sendPickupClosure(intent,session.token,c.signal);if(!active())return false;
   // Keep the original UUID through the verified visual exit; never delay writes or
   // infer success from a closed modal. No automatic tab switch.
   setDone({label:PICKUP_CHOICE_LABELS[intent.body.choice],out:false,requestFinished:result.customerPickupClosure?.scope==='REQUEST'});
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(!reduced)await new Promise(resolve=>setTimeout(resolve,1700));if(!active())return false;
   setDone({label:PICKUP_CHOICE_LABELS[intent.body.choice],out:true,requestFinished:result.customerPickupClosure?.scope==='REQUEST'});if(!reduced)await new Promise(resolve=>setTimeout(resolve,600));if(!active())return false;
   sessionStorage.removeItem(slot);setPending(false);setPendingChoice(null);publish(result);return true;
  }catch(e){if(active()){
    if(kind==='send'&&(e as {pickupRejected?:boolean}).pickupRejected){
     // Preserve the rejected UUID/body for audit; this is not an uncertain retry.
     // Refresh permits another explicit decision, never an automatic POST.
     try{const original=sessionStorage.getItem(slot);if(original){const rejected=read(),archive=slot+':rejected:'+rejected!.key;sessionStorage.setItem(archive,original);if(sessionStorage.getItem(archive)!==original)throw Error('No se pudo conservar el envío rechazado.');sessionStorage.removeItem(slot);}setPending(false);setPendingChoice(null);}catch{setPending(true);}
     refresh();window.dispatchEvent(new Event('zipco-requests-refresh'));
    }
    setError(e instanceof Error?e.message:'No pudimos verificar la decisión. Conservamos el envío original.');if((e as {status?:number}).status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));
   }return false;
  }finally{clearTimeout(timer);locks.delete(slot);lock.current=false;if(active())setBusy(false);}
 };
 return {busy,error,pending,pendingChoice,done,canFinish:!!session&&!!knownPickupClosureHeaders(session.token)['X-Customer-Pickup-Closure-Contract']&&canFinishPickup(order.requestProcess),finish:(choice:PickupClosureChoice)=>perform('send',choice),check:()=>perform('check'),retry:()=>perform('retry')};
}
