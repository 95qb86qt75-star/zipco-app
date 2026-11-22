import {useEffect,useRef,useState} from 'react';
import type {BusinessRequest,MyOrder} from '../domain/types';
import {scheduleReviewFor,type ScheduleAction} from '../domain/availabilityScheduleReview';
import type {RequestProcessSummary} from '../domain/requestProcess';
import {statusViewFor} from '../domain/requestStatusGrouping';
import {readAvailabilityScheduleResult,readScheduleIntent,writeScheduleIntent,sendAvailabilitySchedule,scheduleSlot,scheduleLocks,scheduleOrderStatus,
  type ScheduleIntent,type ScheduleRequestBody,type ScheduleRenewBody} from '../api/availabilityScheduleApi';
import {readCoordinationSession,subscribeCoordinationSession} from './intents/coordinationSession';
import {refreshCoordinationOrder} from '../api/coordinationApi';

/** No POST on mount, focus or refresh. An uncertain operation retains its body and UUID. */
export default function useAvailabilitySchedule(order:BusinessRequest|MyOrder,business:boolean,refresh:()=>void){
  const [busy,setBusy]=useState(false),[pending,setPending]=useState(false),[retryAllowed,setRetryAllowed]=useState(false),[error,setError]=useState(''),[needsRefresh,setNeedsRefresh]=useState(false);
  const session=useRef(readCoordinationSession()).current,identity=useRef({id:order.id,processId:order.requestProcess?.id,business}).current;
  const latest=useRef(order);latest.current=order;
  const alive=useRef(true),locked=useRef(false),controller=useRef<AbortController|null>(null);
  const slot=session&&identity.processId?scheduleSlot(session.userId,identity.processId,business):null;
  const active=()=>alive.current&&!!session&&readCoordinationSession()===session&&latest.current.id===identity.id&&latest.current.requestProcess?.id===identity.processId;
  useEffect(()=>{alive.current=true;const off=subscribeCoordinationSession(()=>{if(!active())controller.current?.abort();});
    return()=>{alive.current=false;controller.current?.abort();off();};},[]);
  useEffect(()=>{if(!slot)return;try{setPending(!!readScheduleIntent(sessionStorage,slot));}catch(e){setPending(true);setError((e as Error).message);}},[slot]);
  const publish=(p:RequestProcessSummary,status:string,navigate:boolean)=>{
    if(!active())return;
    const current=latest.current.requestProcess;
    if(current&&current.version>p.version)return;
    window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:{orderId:identity.id,orderStatus:status,requestProcess:p}}));
    refresh();window.dispatchEvent(new Event('zipco-requests-refresh'));
    if(navigate)window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business,view:statusViewFor('orders',status,p,false,business),explicit:true}}));
  };
  useEffect(()=>{setNeedsRefresh(false);},[order.requestProcess?.version]);
  const perform=async(kind:'send'|'check'|'retry',body?:ScheduleRequestBody|ScheduleRenewBody)=>{
    const p=latest.current.requestProcess;
    if(!active()||!p||!slot||!session||!identity.id||locked.current||scheduleLocks.has(slot))return false;
    locked.current=true;scheduleLocks.add(slot);setBusy(true);setError('');
    const c=new AbortController();controller.current=c;const timer=setTimeout(()=>c.abort(),20000);
    let sent=false;
    try{
      let intent=readScheduleIntent(sessionStorage,slot);
      if(kind==='check'){
        if(intent){
          const result=await readAvailabilityScheduleResult(intent,session.token,c.signal);
          if(!active())return false;
          if(result.recorded){
            sessionStorage.removeItem(slot);setPending(false);setRetryAllowed(false);
            const next=result.requestProcess;
            publish(next,scheduleOrderStatus(next),true);return true;
          }
          const current=await refreshCoordinationOrder(identity.id,business,session.token,session.businessId,c.signal);
          if(!active())return false;
          setRetryAllowed(!!current?.requestProcess&&current.requestProcess.version===intent.body.expectedVersion&&current.requestProcess.allowedActions.includes(intent.action));
          if(current?.requestProcess)publish(current.requestProcess,current.status,false);
          setError('Aún no hay recibo del envío. Esto no demuestra que haya fallado. Puedes comprobar de nuevo; un reintento conserva el mismo identificador y los mismos datos.');return false;
        }
        const current=await refreshCoordinationOrder(identity.id,business,session.token,session.businessId,c.signal);
        if(!active())return false;
        if(!current?.requestProcess)throw Error('No pudimos recuperar el pedido.');
        publish(current.requestProcess,current.status,false);setNeedsRefresh(false);return true;
      }
      if(kind==='send'&&needsRefresh)throw Error('Actualiza el pedido antes de preparar otro envío.');
      if(kind==='send'&&intent)throw Error('Hay un envío pendiente de comprobar. No enviaremos otra solicitud.');
      if(kind==='retry'&&(!intent||!retryAllowed))throw Error('Comprueba el envío original antes de reintentar.');
      if(!intent){
        const review=scheduleReviewFor(p),action:ScheduleAction=business?'RENEW_AVAILABILITY_SCHEDULE':'REQUEST_AVAILABILITY_SCHEDULE';
        if(!body||!review||(business?!review.canRenew:!review.canRequest)||!p.allowedActions.includes(action))throw Error('Esta acción ya no está disponible. Actualiza el pedido.');
        intent={key:crypto.randomUUID(),processId:p.id,orderId:identity.id,business,action,body};
        writeScheduleIntent(sessionStorage,slot,intent);
      }
      setPending(true);setRetryAllowed(false);sent=true;
      const result=await sendAvailabilitySchedule(intent,p,session.token,c.signal);
      if(!active())return false;
      sessionStorage.removeItem(slot);setPending(false);publish(result.requestProcess,result.orderStatus,true);return true;
    }catch(e){if(active()){
      const status=(e as {status?:number}).status;
      // Definitive validation/conflict responses are not uncertain successes. Require rereading.
      if(sent&&status&&[400,403,404,409,422].includes(status)){sessionStorage.removeItem(slot);setPending(false);setRetryAllowed(false);setNeedsRefresh(true);}
      const network=e instanceof TypeError||(e instanceof Error&&e.name==='AbortError');
      setError(network?(kind==='check'?'No pudimos comprobar el estado. Conservamos el envío original.':'No pudimos confirmar el envío. Conservamos los datos; pulsa «Comprobar estado» antes de reenviar.'):
        e instanceof Error?e.message:'No pudimos confirmar el resultado. Comprueba el estado antes de continuar.');
      if(status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));
    }return false;}finally{
      clearTimeout(timer);scheduleLocks.delete(slot);locked.current=false;if(controller.current===c)controller.current=null;if(active())setBusy(false);
    }
  };
  return {busy,pending,error,retryAllowed,needsRefresh,submit:(body:ScheduleRequestBody|ScheduleRenewBody)=>perform('send',body),check:()=>perform('check'),retry:()=>perform('retry')};
}
