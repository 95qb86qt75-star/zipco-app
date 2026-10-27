import {useEffect,useRef,useState} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import {readCoordinationSession,operationScope,subscribeCoordinationSession} from './coordinationSession';
import {refreshCoordinationOrder} from './coordinationApi';
import {lateInitialIntents} from './lateInitialIntent';
import {lateInitialAllowed,type LateInitialAction} from './lateInitialContract';
import {sendLateInitialAction,LateInitialError,type LateInitialReceipt} from './lateInitialApi';
import {announceAction} from './ActionHologram';

export default function useLateInitial(order:BusinessRequest|MyOrder,business:boolean,refresh:()=>void){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[,setRecoveryRevision]=useState(0);
  const session=useRef(readCoordinationSession()).current,identity=useRef({id:order.id,process:order.requestProcess?.id,business}).current;
  const current=useRef(order);current.current=order;
  const alive=useRef(true),lock=useRef(false),controllers=useRef(new Set<AbortController>());
  const active=()=>alive.current&&!!session&&readCoordinationSession()===session&&current.current.id===identity.id&&current.current.requestProcess?.id===identity.process;
  useEffect(()=>{alive.current=true;const off=subscribeCoordinationSession(()=>{if(!active()){controllers.current.forEach(c=>c.abort());setError('La sesión cambió. Vuelve a abrir el pedido.');}});return()=>{alive.current=false;off();controllers.current.forEach(c=>c.abort());};},[]);
  const publish=(receipt:LateInitialReceipt|{orderId:number;orderStatus:string;requestProcess:NonNullable<typeof order.requestProcess>})=>{window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:receipt}));window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));refresh();};
  const pending=()=>{try{return session&&identity.process?lateInitialIntents().pending(operationScope(session,business),identity.process):null;}catch{return null;}};
  useEffect(()=>{
    const p=order.requestProcess;
    if(!active()||!p||!p.allowedActions.length)return;
    try{const saved=pending();if(saved&&p.version>saved.version){lateInitialIntents().reconcile(operationScope(session!,business),p.id,p.version);setRecoveryRevision(v=>v+1);}}
    catch{setError('No pudimos recuperar la respuesta anterior. Comprueba el pedido antes de continuar.');}
  },[order.requestProcess?.version,order.requestProcess?.allowedActions.join(',')]);
  const update=async()=>{
    if(!active()||lock.current||order.id===null)return;lock.current=true;setBusy(true);setError('');setMessage('');const controller=new AbortController();controllers.current.add(controller);
    try{const latest=await refreshCoordinationOrder(order.id,business,session!.token,session!.businessId,controller.signal);
      if(!active())return;
      if(!latest?.requestProcess||latest.id!==identity.id||latest.requestProcess.id!==identity.process||latest.requestProcess.version<(current.current.requestProcess?.version??0))throw Error();
      lateInitialIntents().reconcile(operationScope(session!,business),latest.requestProcess.id,latest.requestProcess.version);
      setMessage(pending()?'El pedido sigue esperando esa respuesta. Puedes reintentar la misma elección; no la enviamos automáticamente.':'Pedido actualizado. Revisa su estado antes de continuar.');
      publish({orderId:latest.id!,orderStatus:latest.status,requestProcess:latest.requestProcess});
    }catch{if(active())setError('No pudimos comprobar el pedido. Conservamos tu elección y no enviamos ninguna respuesta. Intenta nuevamente.');}
    finally{controllers.current.delete(controller);lock.current=false;if(active())setBusy(false);}
  };
  const run=async(action:LateInitialAction)=>{
    const p=current.current.requestProcess;
    if(!active()||lock.current||order.id===null||!p||!lateInitialAllowed(p,business,action))return false;
    lock.current=true;setBusy(true);setError('');setMessage('');const controller=new AbortController();controllers.current.add(controller);
    try{
      const body={expectedVersion:p.version,proposalId:p.currentProposalId,confirmationAccepted:true as const,...(['CONFIRM_LATE_REQUEST_NEED','DECLINE_LATE_REQUEST_NEED'].includes(action)?{queryId:p.lateInitialResponse!.queryId!}:{})};
      const receipt=await lateInitialIntents().run(operationScope(session!,business),p.id,action,body,key=>{
        if(!active()||controller.signal.aborted||current.current.requestProcess?.version!==p.version)throw new LateInitialError('El pedido cambió. Comprueba su estado antes de responder.',0);
        return sendLateInitialAction(p,order.id!,business,action,body,session!.token,key,controller.signal);
      });
      if(!active())return false;
      if(lateInitialIntents().claimFeedback(operationScope(session!,business),p.id,receipt,action))announceAction(action==='ASK_LATE_REQUEST_NEED'?'lateQuerySent':action==='CONFIRM_LATE_REQUEST_NEED'?'accepted':'annulled',{
        title:action==='ASK_LATE_REQUEST_NEED'?'Consulta enviada':action==='CONFIRM_LATE_REQUEST_NEED'?'Avisamos al negocio':'Solicitud finalizada',
        description:action==='ASK_LATE_REQUEST_NEED'?'Le preguntamos al cliente si aún lo requiere. Quedó esperando su respuesta.':action==='CONFIRM_LATE_REQUEST_NEED'?'Falta acordar una nueva hora. Tu respuesta no confirma disponibilidad ni reserva.':'La solicitud quedó en el historial de ambos.',
        key:`late:${p.id}:${receipt.requestProcess.lateInitialResponse?.queryId??'none'}:${receipt.requestProcess.version}:${action}`,
      });
      publish(receipt);window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business,view:receipt.orderStatus==='pending'?'pending':'history'}}));return true;
    }catch(e){if(active()){setError(e instanceof LateInitialError?e.message:'No pudimos comprobar si tu respuesta se envió. Pulsa «Comprobar pedido» antes de reintentar.');if(e instanceof LateInitialError&&e.status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));}return false;}
    finally{controllers.current.delete(controller);lock.current=false;if(active())setBusy(false);}
  };
  return {busy,error,message,pending,update,run};
}
