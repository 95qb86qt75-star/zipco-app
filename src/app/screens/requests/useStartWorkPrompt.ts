import { useEffect, useRef } from 'react';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
import { ASK_DELAY_MS, claimWhatsappAsk, releaseWhatsappAsk, shouldAskWhatsappReturn, subscribeWhatsappReturn } from './whatsappReturn';

export default function useStartWorkPrompt({key,enabled,blocked,onOpen,onInvalidate}:{key:string|null;enabled:boolean;blocked:boolean;onOpen:()=>void;onInvalidate?:()=>void}) {
  const owner=useRef({});
  const current=useRef({enabled,blocked,onOpen,onInvalidate}); current.current={enabled,blocked,onOpen,onInvalidate};
  useEffect(()=>{
    const release=()=>releaseWhatsappAsk(owner.current);
    const session=readCoordinationSession();
    const unsubscribe=subscribeCoordinationSession(()=>{if(readCoordinationSession()!==session){release();current.current.onInvalidate?.();}});
    return ()=>{unsubscribe();release();};
  },[key]);
  useEffect(()=>{
    if(!key||!enabled) return;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const session=readCoordinationSession();
    const cancel=()=>{clearTimeout(timer);timer=undefined;};
    const eligible=()=>readCoordinationSession()===session&&!document.hidden&&current.current.enabled&&!current.current.blocked&&shouldAskWhatsappReturn(key);
    const schedule=()=>{
      if(!eligible()){cancel();return;}
      if(timer!==undefined)return;
      timer=setTimeout(()=>{
        timer=undefined;
        if(eligible()&&!document.querySelector('[role="dialog"],[role="alertdialog"],.zipco-ah,.zipco-d-hs')&&claimWhatsappAsk(key,owner.current))current.current.onOpen();
      },ASK_DELAY_MS);
    };
    const unmark=subscribeWhatsappReturn(schedule);
    const unsession=subscribeCoordinationSession(()=>{if(readCoordinationSession()!==session){cancel();releaseWhatsappAsk(owner.current);}});
    document.addEventListener('visibilitychange',schedule);window.addEventListener('focus',schedule);
    schedule();
    return ()=>{cancel();unmark();unsession();document.removeEventListener('visibilitychange',schedule);window.removeEventListener('focus',schedule);};
  },[key,enabled,blocked]);
  return ()=>releaseWhatsappAsk(owner.current);
}
