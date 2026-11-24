import {useEffect,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import type {CoordinationCardModel} from './AvailabilityWaitingCard';
import useCoordination from './useCoordination';
import {coordinationAllowed} from './coordinationApi';
import {readCoordinationSession,subscribeCoordinationSession} from './coordinationSession';
import {readWhatsappCoordinationCapabilities,type WhatsappCapabilities} from './whatsappCoordinationCapability';
import useStartWorkPrompt from './useStartWorkPrompt';
import {isWhatsappPresentationHeld,subscribeWhatsappPresentation,whatsappReturnKey} from './whatsappReturn';
import {NOTIFICATION_CARD_OPEN_EVENT} from '../../notifications/notificationNavigation';
const capabilities=new WeakMap<object,Promise<WhatsappCapabilities>>();
export default function WhatsappCoordinationPanel({order,business,refresh,children}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void;children:(model:CoordinationCardModel|null)=>ReactNode}){
  const session=readCoordinationSession(),binding=useRef(session);
  const[,sessionChanged]=useState(0),[cap,setCap]=useState<WhatsappCapabilities|null>(null),[capError,setCapError]=useState(''),[attempt,setAttempt]=useState(0);
  const[confirming,setConfirming]=useState<string|null>(null),[expanded,setExpanded]=useState(false),[attention,setAttention]=useState(false);
  const operation=useCoordination(order,business,refresh),process=order.requestProcess,round=process?.whatsappCoordination,negative=process?.whatsappCoordinationInitialDecline;
  const confirm=coordinationAllowed(process,business,'CONFIRM_WHATSAPP_COORDINATION'),respond=coordinationAllowed(process,business,'RESPOND_WHATSAPP_COORDINATION'),decline=coordinationAllowed(process,business,'DECLINE_WHATSAPP_COORDINATION');
  const context=[process?.id,process?.agreementPublicId,process?.version,round?.confirmationId,negative?.id,respond?'respond':'confirm'].join(':');
  const sameSession=!!session&&session===binding.current,ownPending=round?.status==='PENDING'&&round.initiatedBy===(business?'BUSINESS':'CUSTOMER')&&process?.state==='IN_PROGRESS';
  const closed=process?.state==='COORDINATING'&&(negative?.active===true||round?.status==='DECLINED');
  useEffect(()=>{if(closed)setExpanded(false);},[closed]);
  // DECLINE or COORDINATING alone does not prove shared access. CONFIRM is the
  // server's authority for the first question, regardless of who opened WhatsApp.
  const relevant=order.recordState==='available'&&order.orderType==='product'&&['COORDINATING','IN_PROGRESS'].includes(process?.state??'')&&(confirm||respond||ownPending||closed);
  const key=whatsappReturnKey(order,business),promptKey=respond&&key?`${key}:confirmation:${round?.confirmationId}`:key;
  const held=useSyncExternalStore(subscribeWhatsappPresentation,()=>!!key&&isWhatsappPresentationHeld(key),()=>false);
  const presentation=useRef({key,shown:false});
  if(presentation.current.key!==key)presentation.current={key,shown:false};
  if(!held)presentation.current.shown=relevant;
  const pending=operation.pending(),recovery=operation.needsUpdate||operation.restored()||!!operation.storageWarning(),operationBlocked=operation.busy||!!pending||!!recovery,blocked=operationBlocked||held;
  useEffect(()=>subscribeCoordinationSession(()=>{if(readCoordinationSession()!==binding.current){sessionChanged(v=>v+1);setConfirming(null);}}),[]);
  useEffect(()=>{let active=true;setCapError('');if(!sameSession||!session||!relevant)return;
    let request=capabilities.get(session);if(!request){request=readWhatsappCoordinationCapabilities(session.token);capabilities.set(session,request);request.catch(()=>capabilities.delete(session));}
    request.then(value=>{if(active&&readCoordinationSession()===session)setCap(value);}).catch(error=>{if(active&&readCoordinationSession()===session)setCapError(error.message);});return()=>{active=false;};
  },[session,sameSession,relevant,attempt]);
  const release=useStartWorkPrompt({key:promptKey,enabled:sameSession&&cap?.enabled===true&&relevant&&!closed&&!ownPending,blocked:blocked||attention,
    onOpen:()=>setAttention(true),onInvalidate:()=>setAttention(false)});
  useEffect(()=>{setConfirming(null);setAttention(false);release();},[context]);
  useEffect(()=>{const show=(event:Event)=>{if((event as CustomEvent).detail?.id===`order-${order.id}`)setExpanded(true);};window.addEventListener(NOTIFICATION_CARD_OPEN_EVENT,show);return()=>window.removeEventListener(NOTIFICATION_CARD_OPEN_EVENT,show);},[order.id]);
  const update=async()=>{if(session)capabilities.delete(session);setAttempt(v=>v+1);await operation.update();};
  const canYes=sameSession&&cap?.enabled===true&&(confirm||respond)&&!blocked;
  const canNo=sameSession&&cap?.enabled===true&&(respond||cap.initialDecline&&decline)&&!blocked;
  const send=async(accepted:boolean)=>{
    if(!sameSession||blocked||(accepted?!canYes:!canNo))return;
    if(!accepted&&confirming!==context)return;
    const action=respond?'RESPOND_WHATSAPP_COORDINATION':accepted?'CONFIRM_WHATSAPP_COORDINATION':'DECLINE_WHATSAPP_COORDINATION';
    if(await operation.run(action,undefined,undefined,false,respond?accepted:undefined))setConfirming(null);
  };
  const recoveryControls=operationBlocked&&!operation.busy?<div className="zipco-avw-query-recovery-actions"><button type="button" onClick={()=>void update()}>Actualizar estado</button>{pending&&!recovery&&<button type="button" disabled={cap?.enabled!==true||pending.action==='DECLINE_WHATSAPP_COORDINATION'&&!cap?.initialDecline} onClick={()=>void operation.retry()}>Reintentar el mismo envío</button>}</div>:capError?<button type="button" onClick={()=>void update()}>Comprobar coordinación</button>:undefined;
  if(!sameSession||!relevant||!presentation.current.shown||cap?.enabled===false)return <>{children(null)}</>;
  const model:CoordinationCardModel={declinedBySelf:negative?.active?negative.declinedBy===(business?'BUSINESS':'CUSTOMER'):round?.respondedBy===(business?'BUSINESS':'CUSTOMER'),mode:ownPending?'ownPending':closed?'declined':confirming===context?'confirm':'question',expanded,attention,busy:operation.busy,canYes:confirming===context?canNo:canYes,canNo,error:capError||operation.message,recovery:recoveryControls,onToggle:()=>setExpanded(v=>!v),onYes:()=>void send(true),onNo:()=>{if(canNo)setConfirming(context);},onCancel:()=>setConfirming(null),onReturn:()=>void send(false)};
  return <>{children(model)}</>;
}
