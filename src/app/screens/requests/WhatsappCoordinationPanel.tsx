import {useEffect,useRef,useState} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import {StartWorkSheet} from './CoordinationSheets';
import useCoordination from './useCoordination';
import {coordinationAllowed} from './coordinationApi';
import {readCoordinationSession,subscribeCoordinationSession} from './coordinationSession';
import {readWhatsappCoordinationCapability} from './whatsappCoordinationCapability';
import useStartWorkPrompt from './useStartWorkPrompt';
import {dismissWhatsappReturn,whatsappReturnKey} from './whatsappReturn';

// Shared capability request per authenticated session; no credentials are persisted.
const capabilities=new WeakMap<object,Promise<boolean>>();
export default function WhatsappCoordinationPanel({order,business,refresh}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void}){
  const session=readCoordinationSession();
  const binding=useRef(session);
  const [,sessionChanged]=useState(0);
  const [cap,setCap]=useState<boolean|null>(null),[capError,setCapError]=useState(''),[attempt,setAttempt]=useState(0);
  const [open,setOpen]=useState(false);
  const openedContext=useRef<string|null>(null);
  const operation=useCoordination(order,business,refresh);
  const process=order.requestProcess,round=process?.whatsappCoordination;
  const confirm=coordinationAllowed(process,business,'CONFIRM_WHATSAPP_COORDINATION');
  const respond=coordinationAllowed(process,business,'RESPOND_WHATSAPP_COORDINATION');
  const context=[process?.id,process?.agreementPublicId,process?.version,round?.confirmationId,respond?'respond':'confirm'].join(':');
  const show=()=>{openedContext.current=context;setOpen(true);};
  const sameSession=!!session&&session===binding.current;
  const eligible=sameSession&&order.recordState==='available'&&order.orderType==='product'&&cap===true&&(confirm||respond);
  const key=whatsappReturnKey(order,business);
  const promptKey=respond&&key?`${key}:confirmation:${round?.confirmationId}`:key;
  const pending=operation.pending();
  const recovery=operation.needsUpdate||operation.restored()||!!operation.storageWarning();
  const blocked=operation.busy||!!pending||!!recovery;
  useEffect(()=>subscribeCoordinationSession(()=>{if(readCoordinationSession()!==binding.current){sessionChanged(v=>v+1);setOpen(false);}}),[]);
  useEffect(()=>{
    let active=true;setCap(null);setCapError('');
    if(!sameSession||!session||(!confirm&&!respond&&!round))return;
    let request=capabilities.get(session);
    if(!request){request=readWhatsappCoordinationCapability(session.token);capabilities.set(session,request);request.catch(()=>capabilities.delete(session));}
    request.then(value=>{if(active&&readCoordinationSession()===session)setCap(value);}).catch(error=>{if(active&&readCoordinationSession()===session)setCapError(error.message);});
    return()=>{active=false;};
  },[session,sameSession,confirm,respond,!!round,attempt]);
  const release=useStartWorkPrompt({key:promptKey,enabled:eligible,requireOpened:!respond,blocked:blocked||open,
    onOpen:show,onInvalidate:()=>setOpen(false)});
  useEffect(()=>{if(!eligible&&!operation.busy){setOpen(false);release();}},[eligible,operation.busy]);
  useEffect(()=>{setOpen(false);release();},[context]);
  const close=()=>{if(operation.busy)return;if(promptKey)dismissWhatsappReturn(promptKey);setOpen(false);release();};
  const send=async(decision:boolean)=>{
    if(!eligible||blocked||openedContext.current!==context)return;
    const applied=await operation.run(respond?'RESPOND_WHATSAPP_COORDINATION':'CONFIRM_WHATSAPP_COORDINATION',undefined,undefined,false,respond?decision:undefined);
    if(applied)close();
  };
  const update=async()=>{if(session)capabilities.delete(session);setAttempt(v=>v+1);await operation.update();};
  // Once answered, keep the authoritative round visible without presenting an obsolete question.
  const ownPending=round?.status==='PENDING'&&round.initiatedBy===(business?'BUSINESS':'CUSTOMER')&&process?.state==='IN_PROGRESS';
  if(!sameSession||order.orderType!=='product'||(!confirm&&!respond&&!ownPending&&!recovery&&!pending&&!operation.message))return null;
  if(cap===false&&!recovery&&!pending)return null;
  const counterpart=business?'El cliente':'El negocio';
  const recoveryControls=blocked&&!operation.busy?<div className="mt-3 flex flex-wrap gap-2">
    <button type="button" className="zipco-co-no" onClick={()=>void update()}>Actualizar estado</button>
    {pending&&!recovery&&<button type="button" className="zipco-co-no" disabled={cap!==true} onClick={()=>void operation.retry()}>Reintentar el mismo envío</button>}
  </div>:undefined;
  return <aside aria-label="Coordinación por WhatsApp" className="mb-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-slate-800" onClick={event=>event.stopPropagation()}>
    <p>{ownPending?'Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.':respond?`${counterpart} indicó que ya coordinaron. ¿Es correcto?`:'¿Coordinación lista por WhatsApp?'}</p>
    {(capError||operation.message)&&<p role="alert" className="mt-2 text-rose-700">{capError||operation.message}</p>}
    {capError?<button type="button" className="mt-2 min-h-11 underline" onClick={()=>void update()}>Comprobar coordinación</button>:eligible&&!ownPending&&<button type="button" className="mt-2 min-h-11 font-semibold text-emerald-800 underline" disabled={blocked} onClick={show}>{respond?'Revisar y responder':'Confirmar coordinación'}</button>}
    {recoveryControls}
    <StartWorkSheet open={open&&eligible&&openedContext.current===context} onOpenChange={value=>{if(!value)close();}} busy={operation.busy} client={business?'El cliente':'El negocio'} mode={respond?'respond':'confirm'} error={operation.message} recovery={recoveryControls} onConfirm={()=>void send(true)} onReject={()=>void send(false)}/>
  </aside>;
}
