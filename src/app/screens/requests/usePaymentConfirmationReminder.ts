import {useEffect,useRef} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import {readCoordinationSession,subscribeCoordinationSession} from './coordinationSession';
import {reservationAllowed} from './reservationApi';
import {simplifiedReservationFlow} from './simplifiedReservationContract';
import {claimWhatsappAsk,releaseWhatsappAsk,ASK_DELAY_MS} from './whatsappReturn';

type Order=BusinessRequest|MyOrder;
export function paymentReminderEligible(order:Order,business:boolean){
  const p=order.requestProcess,r=p?.reservation,reminder=p?.reservationFollowUp?.paymentConfirmationReminder;
  return business&&simplifiedReservationFlow(p)&&reminder?.eligible===true&&reminder.reservationId===r?.id&&reminder.expectedVersion===p?.version&&reservationAllowed(p,true,'CONFIRM_PICKUP_RESERVATION');
}
/** Stores only an actor/order return marker. Backgrounding never proves WhatsApp or payment. */
export default function usePaymentConfirmationReminder({order,business,blocked,update,onOpen,onInvalidate}:{order:Order;business:boolean;blocked:boolean;update:()=>Promise<Order|null>;onOpen:()=>void;onInvalidate:()=>void}){
  const owner=useRef({}),current=useRef({order,business,blocked,update,onOpen,onInvalidate});current.current={order,business,blocked,update,onOpen,onInvalidate};
  const session=readCoordinationSession(),p=order.requestProcess,r=p?.reservation;
  const key=session&&business&&simplifiedReservationFlow(p)&&r?.mode==='PREPAYMENT'?`zipco-payment-return:v3:${session.userId}:${session.businessId}:${p?.id}:${r.id}`:null;
  useEffect(()=>{
    if(!key||!session)return;
    let timer:ReturnType<typeof setTimeout>|undefined,disposed=false,working=false;
    const active=()=>!disposed&&readCoordinationSession()===session;
    const read=()=>{try{const v=JSON.parse(sessionStorage.getItem(key)??'null');return v&&typeof v.visit==='string'&&Number.isFinite(v.at)&&Date.now()-v.at>=0&&Date.now()-v.at<12*60*60*1000?v:null;}catch{return null;}};
    const leave=()=>{if(!active()||!paymentReminderEligible(current.current.order,true))return;try{sessionStorage.setItem(key,JSON.stringify({visit:crypto.randomUUID(),at:Date.now(),seen:[]}));}catch{/* Manual confirmation remains available. */}};
    const schedule=()=>{
      if(!active()||document.hidden||timer||working||current.current.blocked||!read())return;
      timer=setTimeout(async()=>{
        timer=undefined;if(!active()||document.hidden||current.current.blocked||document.querySelector('[role="dialog"],[role="alertdialog"],.zipco-ah,.zipco-d-hs'))return;
        const mark=read();if(!mark||mark.seen?.includes(current.current.order.requestProcess?.version))return;
        working=true;
        try{
          const latest=await current.current.update();
          if(!active()||document.hidden||!latest||current.current.blocked||!paymentReminderEligible(latest,true)||latest.requestProcess?.id!==p?.id||latest.requestProcess?.reservation?.id!==r?.id)return;
          const version=latest.requestProcess!.version,newMark=read();
          if(!newMark||newMark.visit!==mark.visit||newMark.seen?.includes(version)||document.querySelector('[role="dialog"],[role="alertdialog"],.zipco-ah,.zipco-d-hs')||!claimWhatsappAsk(key,owner.current))return;
          try{sessionStorage.setItem(key,JSON.stringify({...newMark,seen:[...(newMark.seen??[]),version]}));}catch{releaseWhatsappAsk(owner.current);return;}
          current.current.onOpen();
        }finally{working=false;}
      },ASK_DELAY_MS);
    };
    const visibility=()=>{if(document.hidden){clearTimeout(timer);timer=undefined;leave();}else schedule();};
    const off=subscribeCoordinationSession(()=>{if(!active()){clearTimeout(timer);releaseWhatsappAsk(owner.current);current.current.onInvalidate();}});
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',leave);window.addEventListener('pageshow',schedule);window.addEventListener('focus',schedule);schedule();
    return()=>{disposed=true;clearTimeout(timer);releaseWhatsappAsk(owner.current);off();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',leave);window.removeEventListener('pageshow',schedule);window.removeEventListener('focus',schedule);};
  },[key,session]);
  return ()=>releaseWhatsappAsk(owner.current);
}
