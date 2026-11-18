import {useEffect,useRef,useState} from 'react';
import type {BusinessRequest,MyOrder} from '../domain/types';
import {paymentProofFor} from '../domain/customerPaymentProof';
import {statusViewFor} from '../domain/requestStatusGrouping';
import type {RequestProcessSummary} from '../domain/requestProcess';
import {readPaymentProofResult,sendPaymentProof,type PaymentProofIntent} from '../api/customerPaymentProofApi';
import {proofSlot,proofLocks,readProofIntent,writeProofIntent} from './intents/paymentProofIntent';
import {readCoordinationSession,subscribeCoordinationSession} from './intents/coordinationSession';

/** Separate command and durable UUID: opening WhatsApp never invokes this hook's send. */
export default function useCustomerPaymentProof(order:BusinessRequest|MyOrder,business:boolean,refresh:()=>void){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false);
  const session=useRef(readCoordinationSession()).current;
  const identity=useRef({orderId:order.id,processId:order.requestProcess?.id,business}).current;
  const latest=useRef(order);latest.current=order;
  const alive=useRef(true),controller=useRef<AbortController|null>(null),lock=useRef(false);
  const slot=session&&identity.processId?proofSlot(session.userId,identity.processId):null;
  const active=()=>alive.current&&!!session&&readCoordinationSession()===session&&latest.current.id===identity.orderId&&
    latest.current.requestProcess?.id===identity.processId&&business===identity.business;
  useEffect(()=>{alive.current=true;const off=subscribeCoordinationSession(()=>{if(!active())controller.current?.abort();});
    return()=>{alive.current=false;controller.current?.abort();off();};},[]);
  useEffect(()=>{if(business||!slot)return;try{setPending(!!readProofIntent(sessionStorage,slot));}catch(e){setPending(true);setError((e as Error).message);}},[slot,business]);
  const publish=(p:RequestProcessSummary)=>{
    if(!active())return;
    // The original receipt can be older than the current recovered state.
    const current=latest.current.requestProcess;
    const next=current&&current.version>p.version?current:p;
    const status=next.state==='READY'?'ready':next.state==='COMPLETED'?'completed':next.state==='CLOSED'||next.state==='COORDINATION_CANCELLED'?'cancelled':latest.current.status;
    window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:{orderId:identity.orderId,orderStatus:status,requestProcess:next}}));
    window.dispatchEvent(new Event('zipco-requests-refresh'));
    window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:false,view:statusViewFor('orders',status,next,false,false),explicit:true}}));
    refresh();
  };
  const perform=async(check:boolean,onSaved?:()=>void)=>{
    const p=latest.current.requestProcess;
    if(business||!active()||!p||!slot||lock.current||proofLocks.has(slot)||!identity.orderId||!session)return false;
    lock.current=true;proofLocks.add(slot);setBusy(true);setError('');const c=new AbortController();controller.current=c;
    const timeout=setTimeout(()=>c.abort(),20000);
    try{
      let intent=readProofIntent(sessionStorage,slot);
      if(check){
        if(!intent){setPending(false);return false;}
        const result=await readPaymentProofResult(intent,p,session.token,c.signal);
        if(!active())return false;
        if(result.recorded){sessionStorage.removeItem(slot);setPending(false);publish(result.requestProcess);return true;}
        setPending(true);publish(result.requestProcess);setError('El servidor aún no confirma el envío. Puedes comprobarlo de nuevo o reintentar con el mismo identificador.');return false;
      }
      if(!paymentProofFor(p)?.canDeclare||!p.allowedActions.includes('DECLARE_PAYMENT_PROOF_SENT'))throw Error('La declaración no está disponible. Actualiza la reserva.');
      if(!intent){intent={key:crypto.randomUUID(),processId:p.id,orderId:identity.orderId,agreementPublicId:p.agreementPublicId!,body:{expectedVersion:p.version,reservationId:p.reservation!.id,proofSentDeclared:true}};
        writeProofIntent(sessionStorage,slot,intent);}
      setPending(true);
      const result=await sendPaymentProof(intent,p,session.token,c.signal);
      if(!active())return false;
      // Only a verified receipt allows the visual exit. Keep the UUID through it.
      onSaved?.();if(onSaved)await new Promise(resolve=>setTimeout(resolve,480));
      if(!active())return false;
      sessionStorage.removeItem(slot);setPending(false);publish(result.requestProcess);return true;
    }catch(e){if(active()){setError(e instanceof Error?e.message:'No pudimos confirmar el envío. Comprueba su estado.');
      if((e as {status?:number}).status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));}return false;
    }finally{clearTimeout(timeout);proofLocks.delete(slot);lock.current=false;if(controller.current===c)controller.current=null;if(active())setBusy(false);}
  };
  const proof=paymentProofFor(order.requestProcess);
  return {busy,error,pending,canDeclare:!business&&!!proof?.canDeclare&&!!order.requestProcess?.allowedActions.includes('DECLARE_PAYMENT_PROOF_SENT'),
    declared:!!proof?.declaration,confirm:(onSaved?:()=>void)=>perform(false,onSaved),check:()=>perform(true)};
}
