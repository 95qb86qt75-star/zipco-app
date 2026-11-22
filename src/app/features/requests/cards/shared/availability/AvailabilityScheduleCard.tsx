import * as React from 'react';
import {useEffect,useId,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {CalendarClock,ChevronDown,Clock,Image as ImageIcon,Info,List,Quote,RefreshCw,Store,X} from 'lucide-react';
import type {BusinessRequest,MyOrder,Product} from '../../../domain/types';
import type {AvailabilityScheduleReview,RequestedSchedule} from '../../../domain/availabilityScheduleReview';
import type useAvailabilitySchedule from '../../../application/useAvailabilitySchedule';
import {santiagoDraftTime} from '../../../domain/alternativeDraft';
import {BUSINESS_CONTACT_COPY,BUSINESS_CONTACT_VERSION} from '../../../domain/availabilityContract';
import {isAdvisoryOffer,isSimpleOffer} from '../../../domain/simplifiedReservationContract';
import BusinessResponseHoursNotice from '../../../shared/hours/BusinessResponseHoursNotice';
import ProductPreviewControl from '../../../shared/product-preview/ProductPreviewControl';
import OrderReferencePhoto from '../../../shared/photos/OrderReferencePhoto';
import {safePhoto} from '../../../domain/agreement';
import {formatDeliverySchedule} from '../../../domain/utils';
import {scheduleDraftSlot,readScheduleDraft,saveScheduleDraft,clearScheduleDraft} from '../../../application/availabilityScheduleDraft';
import './availability-schedule.css';

type Operation=ReturnType<typeof useAvailabilitySchedule>;
const when=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short',hourCycle:'h23'}).format(new Date(iso));
const clp=(n:number)=>`$${n.toLocaleString('es-CL')}`;
// Fecha/hora del retiro vencido, siempre en hora de Chile.
const santiagoParts=(iso:string|null)=>{
  if(!iso||Number.isNaN(Date.parse(iso)))return null;
  const parts=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));
  const get=(type:string)=>parts.find(part=>part.type===type)?.value??'';
  const clean=(value:string)=>value.replace('.','').toUpperCase();
  return {weekday:clean(get('weekday')),day:get('day'),month:clean(get('month')),year:get('year'),time:`${get('hour')}:${get('minute')}`};
};
const reducedMotion=()=>typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export default function AvailabilityScheduleCard({order,business,review,operation,detail,closeAction,continueWithout,leaving=false,busy:otherBusy,error:otherError}:{
  order:BusinessRequest|MyOrder;business:boolean;review:AvailabilityScheduleReview;operation:Operation;
  detail:React.ReactNode;closeAction:React.ReactNode;continueWithout?:React.ReactNode;leaving?:boolean;busy:boolean;error:React.ReactNode;
}){
  const draftSlot=useRef(scheduleDraftSlot(localStorage.getItem('zipco-user-id')??'',order.requestProcess!,business)).current;
  const initial=useRef(readScheduleDraft(draftSlot,order.requestProcess!)).current;
  const trigger=useRef<HTMLButtonElement>(null);
  const detailsId=useId();
  const [open,setOpen]=useState(false),[expanded,setExpanded]=useState(false);
  // Cliente · EXPIRED_OFFER: hoja «Solicitud original», chips y resaltado de la foto.
  const sheetRef=useRef<HTMLElement>(null),photoRef=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null),highlightTimer=useRef<number>();
  const firstRender=useRef(true);
  const [highlight,setHighlight]=useState(0);
  const [date,setDate]=useState(initial.date??''),[time,setTime]=useState(initial.time??''),[note,setNote]=useState(initial.note??'');
  const [decision,setDecision]=useState<'CONFIRM_REQUESTED_SCHEDULE'|'PROPOSE_OTHER_SCHEDULE'>(initial.decision??'CONFIRM_REQUESTED_SCHEDULE');
  const [mode,setMode]=useState<''|'FREE'|'PREPAYMENT'>(initial.mode??''),[amount,setAmount]=useState(initial.amount??'');
  const [message,setMessage]=useState(initial.message??''),[address,setAddress]=useState(initial.address??''),[contact,setContact]=useState(initial.contact??false),[consent,setConsent]=useState(false);
  const [clock,setClock]=useState(Date.now());const anchor=useRef({serverNow:order.requestProcess?.serverNow,local:Date.now()});
  if(anchor.current.serverNow!==order.requestProcess?.serverNow)anchor.current={serverNow:order.requestProcess?.serverNow,local:Date.now()};
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),15000);return()=>clearInterval(timer);},[]);
  useEffect(()=>()=>window.clearTimeout(highlightTimer.current),[]);
  useEffect(()=>{
    if(firstRender.current){firstRender.current=false;return;}
    if(expanded)sheetRef.current?.focus({preventScroll:true});
    else if(opener.current?.isConnected)opener.current.focus({preventScroll:true});
  },[expanded]);
  useEffect(()=>{
    if(!highlight)return;
    photoRef.current?.scrollIntoView({block:'nearest',behavior:reducedMotion()?'auto':'smooth'});
    photoRef.current?.focus({preventScroll:true});
  },[highlight]);
  useEffect(()=>{
    // Updating recovery disables/replaces its controls. Keep keyboard navigation
    // in the open sheet if the browser dropped focus to the document body.
    if(!business&&review.phase==='EXPIRED_OFFER'&&expanded&&!open&&!operation.busy&&document.activeElement===document.body)
      sheetRef.current?.focus({preventScroll:true});
  },[business,review.phase,expanded,open,operation.busy,operation.error]);
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
  const dialog=<>
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
  </>;
  // Cliente · fecha de retiro vencida: presentación nueva. El resto de fases y el negocio conservan su tarjeta.
  if(!business&&review.phase==='EXPIRED_OFFER'){
    const items:Product[]=order.products.items,many=items.length>1,units=items.reduce((sum,item)=>sum+item.quantity,0),first=items[0];
    const photo=order.referencePhoto&&safePhoto(order.referencePhoto)?order.referencePhoto:null;
    const expired=santiagoParts(expiredDate),previous=isSimpleOffer(offer)&&offer.mode==='PREPAYMENT'?offer.requiredAmountClp:null;
    const originalSchedule=formatDeliverySchedule(order,'customer')??'Sin horario solicitado';
    const openOriginal=(from:HTMLElement,focusPhoto:boolean)=>{
      opener.current=from;setExpanded(true);window.clearTimeout(highlightTimer.current);
    if(focusPhoto){
      setHighlight(0);
      highlightTimer.current=window.setTimeout(()=>{
        // A real photo/product dialog may already be open. Do not steal its focus.
        if(sheetRef.current?.contains(document.activeElement))setHighlight(n=>n+1);
      },reducedMotion()?0:900);
    }
    };
    const closeOriginal=()=>{window.clearTimeout(highlightTimer.current);setHighlight(0);setExpanded(false);};
    return <article className="zipco-asx" data-role="customer" data-phase="EXPIRED_OFFER" data-schedule-review={review.phase} data-open={expanded} data-leaving={leaving?'true':undefined}
      aria-label={`${name}: la fecha de retiro ya pasó`} aria-busy={operation.busy||undefined} {...(leaving?{inert:''}:{})}
      onKeyDown={event=>{if(event.key==='Escape'&&expanded&&!open&&event.currentTarget.contains(event.target as Node)){event.stopPropagation();closeOriginal();}}}>
      <i className="zipco-asx-glow zipco-asx-glow-a" aria-hidden="true"/><i className="zipco-asx-glow zipco-asx-glow-b" aria-hidden="true"/>
      <div className="zipco-asx-main" {...(expanded?{inert:'','aria-hidden':true}:{})}>
        <div className="zipco-asx-banner">
          <div className="zipco-asx-title"><small className="zipco-asx-biz">{name}</small><h3>La fecha de retiro ya pasó</h3>
            <span className="zipco-asx-pill"><i aria-hidden="true"><Clock/></i>PIDE UNA NUEVA FECHA</span></div>
          <span className="zipco-asx-thumbs" data-many={many||undefined}><ProductPreviewControl thumbnailLoading="eager"/>{many&&<b className="zipco-asx-more" aria-hidden="true">+{items.length-1}</b>}</span>
        </div>
        <div className="zipco-asx-product">
          <span className="zipco-asx-name"><b>{first?.name}</b>{many?`+ ${items.length-1} ${items.length-1===1?'producto más':'productos más'} · ${units} ${units===1?'unidad':'unidades'}`:`Cantidad: ${first?.quantity}×`}
            <span className="zipco-asx-mode"><Store aria-hidden="true"/>Retiro en el local</span></span>
          {order.total!==null&&<span className="zipco-asx-total"><b>{clp(order.total)}</b><small>SOLICITADO</small></span>}
          <span className="zipco-asx-chips">
            {photo&&<button type="button" className="zipco-asx-chip" data-delay="0" aria-controls={detailsId} aria-expanded={expanded} aria-label="Ver imagen adjunta en la solicitud original" onClick={event=>openOriginal(event.currentTarget,true)}>
              <span><ImageIcon aria-hidden="true"/>Imagen adjunta<em>Ver</em></span></button>}
            <button type="button" className="zipco-asx-chip" data-delay="1" aria-controls={detailsId} aria-expanded={expanded} aria-label="Ver solicitud original" onClick={event=>openOriginal(event.currentTarget,false)}>
              <span><List aria-hidden="true"/>Solicitud original<em>Ver</em></span></button>
          </span>
        </div>
        <section className="zipco-asx-offer" aria-label="Fecha de retiro vencida">
          {expired&&<div className="zipco-asx-date"><span className="zipco-asx-cal" aria-hidden="true"><small>{expired.weekday}</small><b>{expired.day}</b><i>{expired.month}</i></span>
            <div className="zipco-asx-time"><span>FECHA DE RETIRO</span><strong>{expired.time}</strong><small>{expired.year} · hora de Chile</small></div>
            <span className="zipco-asx-stamp">VENCIDA</span></div>}
          {previous!==null&&<p className="zipco-asx-old"><Info aria-hidden="true"/><span><b>Oferta vencida:</b> reserva con pago previo de {clp(previous)}. No sigue vigente: el negocio debe indicar de nuevo la modalidad y el monto.</span></p>}
        </section>
        {operation.busy&&!open&&!operation.error&&!operation.pending&&<p role="status" className="zipco-asx-status"><i aria-hidden="true"/>Comprobando estado…</p>}
        {permitted&&<button type="button" className="zipco-asx-primary" ref={trigger} disabled={busy||operation.pending} onClick={()=>setOpen(true)}><CalendarClock aria-hidden="true"/>Solicitar nueva fecha</button>}
        <div className="zipco-asx-rw">{continueWithout}{closeAction}</div>
      </div>
      <i className="zipco-asx-line" aria-hidden="true"/>
      <aside id={detailsId} ref={sheetRef} tabIndex={-1} className="zipco-asx-sheet" aria-label="Solicitud original" {...(!expanded?{inert:'','aria-hidden':true}:{})}>
        <div className="zipco-asx-sh"><b>Solicitud original</b><small>{order.total!==null&&`${clp(order.total)} solicitado · `}{units} {units===1?'unidad':'unidades'}</small></div>
        <div className="zipco-asx-body">
          <section className="zipco-asx-items" aria-label="Productos de la solicitud original"><small><List aria-hidden="true"/>SOLICITUD ORIGINAL</small>
            <ul>{items.map((item,index)=><li key={index}><i>{item.quantity}×</i><span>{item.name}</span><em>{clp(item.quantity*item.price)}</em></li>)}</ul>
            {order.total!==null&&<div className="zipco-asx-sum"><span>Total solicitado · no es un pago</span><b>{clp(order.total)}</b></div>}
            <p className="zipco-asx-when"><Clock aria-hidden="true"/><span><b>Fecha original:</b> {originalSchedule}</span></p></section>
          {order.note&&<div className="zipco-asx-note"><Quote aria-hidden="true"/><span><small>NOTA DE LA SOLICITUD</small>{order.note}</span></div>}
          {photo&&<div ref={photoRef} tabIndex={-1} className={`zipco-asx-photo${highlight?' is-hl':''}`}><OrderReferencePhoto src={photo} business={false}/></div>}
        </div>
        <button type="button" className="zipco-asx-close" onClick={closeOriginal}><ChevronDown aria-hidden="true"/>Ocultar solicitud original</button>
      </aside>
      {(!open&&(operation.error||operation.pending)||otherError)&&<div className="zipco-asx-feedback">{!open&&errors}{otherError}</div>}
      {dialog}
    </article>;
  }
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
    {dialog}
  </article>;
}
