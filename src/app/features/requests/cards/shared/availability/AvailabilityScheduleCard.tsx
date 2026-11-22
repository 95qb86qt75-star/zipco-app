import * as React from 'react';
import {useEffect,useId,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {CalendarClock,RefreshCw,X} from 'lucide-react';
import type {BusinessRequest,MyOrder} from '../../../domain/types';
import type {AvailabilityScheduleReview,RequestedSchedule} from '../../../domain/availabilityScheduleReview';
import type useAvailabilitySchedule from '../../../application/useAvailabilitySchedule';
import {santiagoDraftTime} from '../../../domain/alternativeDraft';
import {BUSINESS_CONTACT_COPY,BUSINESS_CONTACT_VERSION} from '../../../domain/availabilityContract';
import {isAdvisoryOffer,isSimpleOffer} from '../../../domain/simplifiedReservationContract';
import BusinessResponseHoursNotice from '../../../shared/hours/BusinessResponseHoursNotice';
import ProductPreviewControl from '../../../shared/product-preview/ProductPreviewControl';
import {scheduleDraftSlot,readScheduleDraft,saveScheduleDraft,clearScheduleDraft} from '../../../application/availabilityScheduleDraft';
import './availability-schedule.css';

type Operation=ReturnType<typeof useAvailabilitySchedule>;
const when=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short',hourCycle:'h23'}).format(new Date(iso));
export default function AvailabilityScheduleCard({order,business,review,operation,detail,closeAction,continueWithout,busy:otherBusy,error:otherError}:{
  order:BusinessRequest|MyOrder;business:boolean;review:AvailabilityScheduleReview;operation:Operation;
  detail:React.ReactNode;closeAction:React.ReactNode;continueWithout?:React.ReactNode;busy:boolean;error:React.ReactNode;
}){
  const draftSlot=useRef(scheduleDraftSlot(localStorage.getItem('zipco-user-id')??'',order.requestProcess!,business)).current;
  const initial=useRef(readScheduleDraft(draftSlot,order.requestProcess!)).current;
  const trigger=useRef<HTMLButtonElement>(null);
  const detailsId=useId();
  const [open,setOpen]=useState(false),[expanded,setExpanded]=useState(false);
  const [date,setDate]=useState(initial.date??''),[time,setTime]=useState(initial.time??''),[note,setNote]=useState(initial.note??'');
  const [decision,setDecision]=useState<'CONFIRM_REQUESTED_SCHEDULE'|'PROPOSE_OTHER_SCHEDULE'>(initial.decision??'CONFIRM_REQUESTED_SCHEDULE');
  const [mode,setMode]=useState<''|'FREE'|'PREPAYMENT'>(initial.mode??''),[amount,setAmount]=useState(initial.amount??'');
  const [message,setMessage]=useState(initial.message??''),[address,setAddress]=useState(initial.address??''),[contact,setContact]=useState(initial.contact??false),[consent,setConsent]=useState(false);
  const [clock,setClock]=useState(Date.now());const anchor=useRef({serverNow:order.requestProcess?.serverNow,local:Date.now()});
  if(anchor.current.serverNow!==order.requestProcess?.serverNow)anchor.current={serverNow:order.requestProcess?.serverNow,local:Date.now()};
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),15000);return()=>clearInterval(timer);},[]);
  const process=order.requestProcess!,plan=process.availability!,offer=plan.reservationOffer!;
  useEffect(()=>{saveScheduleDraft(draftSlot,process,{date,time,note,decision,mode,amount,message,address,contact});},[date,time,note,decision,mode,amount,message,address,contact]);
  const busy=operation.busy||otherBusy,pending=review.phase==='AWAITING_BUSINESS';
  const permitted=business?review.canRenew:review.canRequest;
  const name=('customerName'in order?order.customerName:order.businessName)|| (business?'Cliente':'Negocio');
  const selected:RequestedSchedule|undefined=business&&decision==='CONFIRM_REQUESTED_SCHEDULE'?review.request?.requestedSchedule:{mode:'SCHEDULED',date,time};
  const selectedTime=selected?santiagoDraftTime(selected.date,selected.time):null;
  // Server time anchors local feedback; authoritative acceptance remains on the server.
  const now=process.serverNow?Date.parse(process.serverNow)+Math.max(0,clock-anchor.current.local):clock;
  const future=selectedTime!==null&&selectedTime>now;
  const paid=mode==='PREPAYMENT',validAmount=/^[1-9]\d*$/.test(amount)&&Number(amount)<=Math.min(order.total??0,50000000);
  const validBusiness=!!mode&&message.trim().length>0&&(!paid||validAmount&&contact)&&(!contact||consent);
  const canSend=permitted&&future&&!busy&&!operation.pending&&!operation.needsRefresh&&(!business||validBusiness);
  const expiredDate=isSimpleOffer(offer)?offer.simplified.scheduledFor:null;
  const send=async()=>{
    if(!canSend||!selected)return;
    const origin={expectedVersion:process.version,proposalId:process.currentProposalId,availabilityConfirmationId:plan.availabilityConfirmationId};
    const ok=business?await operation.submit({...origin,scheduleRequestId:review.request!.scheduleRequestId,decision,
      ...(decision==='PROPOSE_OTHER_SCHEDULE'?{schedule:selected}:{}),fulfillment:{path:'LOCAL_PICKUP',customerMessage:message.trim(),
        ...(address.trim()?{scheduleOrAddress:address.trim()}:{}),allowCustomerWhatsapp:contact,
        ...(contact?{businessContactConsent:{accepted:true,textVersion:BUSINESS_CONTACT_VERSION}}:{}),
        reservationOffer:paid?{mode:'PREPAYMENT',requiredAmountClp:Number(amount),...(isAdvisoryOffer(offer)?{hoursPolicy:'ADVISORY_ONLY' as const}:{})}:
          {mode:'FREE',...(isAdvisoryOffer(offer)?{hoursPolicy:'ADVISORY_ONLY' as const}:{})}}}):
      await operation.submit({...origin,sourceTermsVersion:isSimpleOffer(offer)?offer.simplified.termsVersion:'',schedule:selected,...(note.trim()?{note:note.trim()}:{})});
    if(ok){clearScheduleDraft(draftSlot);setOpen(false);}
  };
  const errors=<>{operation.error&&<p role="alert" className="zipco-as-error">{operation.error}</p>}
    {(operation.error||operation.pending)&&<div className="zipco-as-actions">
      <button type="button" disabled={busy} onClick={()=>void operation.check()}><RefreshCw size={16}/>{busy?'Comprobando…':'Comprobar estado'}</button>
      {operation.pending&&operation.retryAllowed&&<button type="button" disabled={busy} onClick={()=>void operation.retry()}>Reintentar envío original</button>}
    </div>}</>;
  return <article className="zipco-as" data-schedule-review={review.phase}>
    <header><ProductPreviewControl/><div><small>{business?'CLIENTE':'NEGOCIO'}</small><h3>{name}</h3></div>{order.total!==null&&<b>${order.total.toLocaleString('es-CL')}<small>SOLICITADO</small></b>}</header>
    <section><CalendarClock aria-hidden="true"/><div><h3>{pending?(business?'El cliente solicita una nueva fecha':'Horario solicitado; esperando al negocio'):'La fecha de retiro ya pasó'}</h3>
      {review.request?<><p>Fecha solicitada: <strong>{when(review.request.requestedFor)}</strong></p>{review.request.note&&<p>Nota del cliente: {review.request.note}</p>}</>:
        expiredDate&&<p>Retiro anterior: {when(expiredDate)}</p>}
      <p>{pending?'Todavía no hay una nueva reserva.':business?'El cliente puede solicitar otra fecha para que revises las condiciones.':'Solicita otra fecha. El negocio debe revisar la disponibilidad y emitir condiciones nuevas antes de que puedas reservar.'}</p>
    </div></section>
    {permitted&&<button type="button" className="zipco-as-primary" ref={trigger} disabled={busy||operation.pending} onClick={()=>setOpen(true)}>{business?'Revisar fecha y condiciones':'Solicitar nueva fecha'}</button>}
    {pending&&!business&&<p role="status">Ya enviaste tu solicitud. No necesitas volver a enviarla.</p>}
    {!open&&errors}{otherError}
    <div className="zipco-as-actions"><button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={()=>setExpanded(v=>!v)}>{expanded?'Ocultar solicitud original':'Ver solicitud original'}</button>{continueWithout}{closeAction}</div>
    <div id={detailsId} hidden={!expanded}>{detail}</div>
    <Dialog.Root open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}><Dialog.Portal><Dialog.Overlay className="zipco-as-overlay"/>
      <Dialog.Content onCloseAutoFocus={e=>{if(trigger.current?.isConnected){e.preventDefault();trigger.current.focus({preventScroll:true});}}} className="zipco-as-dialog" aria-busy={busy||undefined} onEscapeKeyDown={e=>{if(busy)e.preventDefault();}}>
        <header><div><Dialog.Title>{business?'Revisar fecha y condiciones':'Solicitar nueva fecha'}</Dialog.Title><Dialog.Description>{business?'Enviarás una oferta nueva. El cliente debe aceptarla antes de reservar.':'Conservamos tu solicitud. Pedir otra fecha no reserva ni confirma un pago.'}</Dialog.Description></div><button type="button" aria-label="Cerrar" disabled={busy} onClick={()=>setOpen(false)}><X/></button></header>
        <div className="zipco-as-body">
          {business&&<><p>El cliente pidió: <b>{review.request&&when(review.request.requestedFor)}</b></p>
            <fieldset disabled={busy||operation.pending}><legend>¿Qué fecha propones?</legend>
              <label><input type="radio" name="schedule-decision" checked={decision==='CONFIRM_REQUESTED_SCHEDULE'} onChange={()=>setDecision('CONFIRM_REQUESTED_SCHEDULE')}/>Confirmar la fecha solicitada</label>
              <label><input type="radio" name="schedule-decision" checked={decision==='PROPOSE_OTHER_SCHEDULE'} onChange={()=>setDecision('PROPOSE_OTHER_SCHEDULE')}/>Proponer otra fecha</label></fieldset></>}
          {(!business||decision==='PROPOSE_OTHER_SCHEDULE')&&<div className="zipco-as-date"><label>Fecha<input type="date" value={date} disabled={busy||operation.pending} onChange={e=>setDate(e.target.value)}/></label><label>Hora de Chile<input type="time" value={time} disabled={busy||operation.pending} onChange={e=>setTime(e.target.value)}/></label></div>}
          {selected?.date&&selected.time&&!future&&<p role="alert" className="zipco-as-error">La fecha y hora deben ser futuras y válidas en Chile. Elige otra.</p>}
          {!business?<label>Nota (opcional)<textarea maxLength={300} value={note} disabled={busy||operation.pending} onChange={e=>setNote(e.target.value)}/></label>:<>
            <label>Mensaje al cliente<input maxLength={120} value={message} disabled={busy||operation.pending} onChange={e=>setMessage(e.target.value)}/></label>
            <label>Horario o dirección de retiro (opcional)<input maxLength={80} value={address} disabled={busy||operation.pending} onChange={e=>setAddress(e.target.value)}/></label>
            <fieldset disabled={busy||operation.pending}><legend>Condiciones nuevas de reserva</legend><p>El monto anterior no se aplica automáticamente. Elige la modalidad vigente.</p>
              <label><input type="radio" name="schedule-offer" checked={mode==='FREE'} onChange={()=>setMode('FREE')}/>Reserva sin pago previo</label>
              <label><input type="radio" name="schedule-offer" checked={paid} onChange={()=>setMode('PREPAYMENT')}/>Reserva con pago previo</label>
              {paid&&<label>Monto para reservar<input inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)}/>{amount&&!validAmount&&<span role="alert">Indica un monto entero entre $1 y el total del pedido.</span>}</label>}</fieldset>
            <label><input type="checkbox" checked={contact} disabled={busy||operation.pending} onChange={e=>{setContact(e.target.checked);setConsent(false);}}/>Permitir coordinación por WhatsApp{paid?' (necesario para pago previo)':''}</label>
            {contact&&<label><input type="checkbox" checked={consent} disabled={busy||operation.pending} onChange={e=>setConsent(e.target.checked)}/>{BUSINESS_CONTACT_COPY}</label>}
            <BusinessResponseHoursNotice businessId={Number(localStorage.getItem('zipco-business-id'))} date={selected?.date} time={selected?.time} active={future}/>
            <p className="zipco-as-warning">Se conserva el producto, la cantidad y el total. Esto no declara pago recibido ni pedido apartado.</p>
          </>}
          {errors}
        </div>
        <footer><button type="button" disabled={busy} onClick={()=>setOpen(false)}>Volver</button><button type="button" className="zipco-as-primary" disabled={!canSend} onClick={()=>void send()}>{busy?'Enviando…':business?'Enviar nueva oferta':'Enviar nueva fecha'}</button></footer>
      </Dialog.Content></Dialog.Portal></Dialog.Root>
  </article>;
}
