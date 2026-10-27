import {useEffect,useRef} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import {readProposals} from './proposalApi';
import {readCoordinationSession} from './coordinationSession';
import {readLateInitialCapability} from './lateInitialApi';

// The clock only schedules a fresh GET. It never decides lateness or permissions.
export default function useLateInitialDeadline(order:BusinessRequest|MyOrder,refresh:()=>void){
  const refreshRef=useRef(refresh);refreshRef.current=refresh;
  const p=order.requestProcess;
  useEffect(()=>{
    if(order.recordState!=='available'||order.needNow||p?.flowContract!=='AVAILABILITY_V3'||p.state!=='AWAITING_BUSINESS_RESPONSE'||p.lateInitialResponse||p.availability||p.agreementPublicId)return;
    const session=readCoordinationSession();if(!session)return;
    const controller=new AbortController();let stopped=false,timer:ReturnType<typeof setTimeout>|undefined;
    const load=async()=>{try{
      if(!await readLateInitialCapability(session.token,controller.signal)||stopped||readCoordinationSession()!==session)return;
      const read=await readProposals(p.id,session.token,controller.signal);
      if(stopped||readCoordinationSession()!==session||read.process.version<p.version)return;
      if(read.process.lateInitialResponse){refreshRef.current();return;}
      const original=read.proposals.length===1&&read.proposals[0].sequence===0?read.proposals[0]:null;
      if(!original?.scheduledFor||!read.process.serverNow)return;
      const remaining=Date.parse(original.scheduledFor)-Date.parse(read.process.serverNow);
      // An already-past snapshot is projected by the current list. Avoid loops
      // while QA creation is disabled or a participant has an obsolete read.
      if(remaining<0)return;
      timer=setTimeout(()=>{if(!stopped&&readCoordinationSession()===session&&document.visibilityState==='visible')refreshRef.current();},Math.min(remaining+100,2147483647));
    }catch{/* Existing foreground/manual reads recover without issuing a mutation. */}};
    void load();return()=>{stopped=true;controller.abort();clearTimeout(timer);};
  },[order.id,order.recordState,order.needNow,p?.id,p?.version,p?.state,p?.flowContract,p?.lateInitialResponse?.status]);
}
