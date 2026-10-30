import {beginStatusChange,completeStatusChange,failStatusChange} from './statusChangePresentation';
import {useEffect,useRef,useState} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import {readCoordinationSession,subscribeCoordinationSession,operationScope} from './coordinationSession';
import {refreshCoordinationOrder} from './coordinationApi';
import {reservationAllowed,sendReservationAction,type ReservationBody} from './reservationApi';
import {reservationIntents} from './reservationIntent';
import type {ReservationAction} from './reservationContract';
import {AvailabilityError} from './availabilityApi';
export default function useReservation(order:BusinessRequest|MyOrder,business:boolean,refresh:()=>void){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const alive=useRef(true),lock=useRef(false),controllers=useRef(new Set<AbortController>());
  const session=useRef(readCoordinationSession()).current,initial=useRef({orderId:order.id,processId:order.requestProcess?.id,business}).current;
  const visible=useRef({order,business});visible.current={order,business};
  const active=()=>alive.current&&!!session&&readCoordinationSession()===session&&visible.current.order.id===initial.orderId&&visible.current.order.requestProcess?.id===initial.processId&&visible.current.business===initial.business;
  useEffect(()=>{alive.current=true;const off=subscribeCoordinationSession(()=>{if(!active())controllers.current.forEach(c=>c.abort());});return()=>{alive.current=false;off();controllers.current.forEach(c=>c.abort());};},[]);
  const read=async(signal:AbortSignal,minVersion=0)=>{
    const latest=await refreshCoordinationOrder(order.id!,business,session!.token,session!.businessId,signal),p=latest?.requestProcess;
    if(!active())return null;
    if(!latest||!p||p.id!==initial.processId||p.version<minVersion||p.agreementPublicId!==order.requestProcess?.agreementPublicId||p.reservation?.id!==order.requestProcess?.reservation?.id)throw new Error('No se pudo recuperar el estado confirmado. Actualiza la reserva; no se repetirá una acción confirmada.');
    await reservationIntents().reconcile(operationScope(session!,business),p.id,p.version);
    window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:{orderId:latest.id,orderStatus:latest.status,requestProcess:p}}));window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));refresh();return latest;
  };
  const update=async()=>{if(!active()||lock.current||order.id===null)return null;lock.current=true;setBusy(true);setError('');const c=new AbortController();controllers.current.add(c);try{return await read(c.signal);}catch(e){if(active())setError(e instanceof Error?e.message:'No se pudo actualizar la reserva.');return null;}finally{controllers.current.delete(c);lock.current=false;if(active())setBusy(false);}};
  const run=async(action:ReservationAction,details:Omit<ReservationBody,'expectedVersion'|'reservationId'>={})=>{
    const p=order.requestProcess;if(!active()||lock.current||order.id===null||!p?.reservation||!reservationAllowed(p,business,action))return false;
    lock.current=true;setBusy(true);setError('');const c=new AbortController();controllers.current.add(c);
    const flow=action==='CANCEL_PICKUP_RESERVATION'?beginStatusChange(order,business):null;
    try{const body:ReservationBody={expectedVersion:p.version,reservationId:p.reservation.id,...details};let navigation:string|null=null;
      const receipt=await reservationIntents().run(operationScope(session!,business),p.id,action,body,async key=>{if(!active()||c.signal.aborted)throw Error('La sesión cambió. Actualiza el pedido.');const response=await sendReservationAction(p,order.id!,business,action,body,session!.token,key,c.signal);navigation=response.navigation;return response.receipt;});
      if(!active())return false;
      const latest=await read(c.signal,receipt.requestProcess.version);if(!active()||!latest)return false;
      if(flow)completeStatusChange(flow,latest);
      if(action==='OPEN_RESERVATION_WHATSAPP'){
        const allowed=reservationAllowed(latest.requestProcess,business,action),validPurpose=body.purpose!=='RECEIPT'||!business&&latest.requestProcess?.state==='IN_PROGRESS';
        if(!navigation||!allowed||!validPurpose){setError('El acceso a WhatsApp ya no está disponible. Revisa los permisos de contacto.');return false;}
        window.location.assign(navigation);
      }
      return true;
    }catch(e){if(active()){setError(e instanceof Error?e.message:'No se pudo confirmar el resultado. Reintenta los mismos datos.');if(e instanceof AvailabilityError&&e.status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));}return false;}
    finally{if(flow?.stage==='saving')failStatusChange(flow);controllers.current.delete(c);lock.current=false;if(active())setBusy(false);}
  };
  return {busy,error,run,update};
}
