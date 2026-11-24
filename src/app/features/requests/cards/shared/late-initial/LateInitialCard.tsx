import * as React from 'react';
import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {CalendarDays,Check,ChevronDown,ChevronUp,Clock3,RefreshCw,Send,ShoppingBag,Store,Trash2,UserRound,X} from 'lucide-react';
import type { BusinessRequest, MyOrder } from "../../../domain/types";
import { lateInitialAllowed, lateDelayLabel, type LateInitialAction } from "../../../domain/lateInitialContract";
import useLateInitial from "../../../application/useLateInitial";
import ProposalNegotiation from "../../../forms/proposal/ProposalNegotiation";
import PendingCancellationActions from "../../customer/pending/PendingCancellationActions";
const reservationFormat=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short',hourCycle:'h23'});
const reservationWhen=(iso:string)=>reservationFormat.format(new Date(iso));
import OrderReferencePhoto from "../../../shared/photos/OrderReferencePhoto";
import { safePhoto } from "../../../domain/agreement";
import "./late-initial.css";
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";

// Share immutable formatters across cards instead of constructing three per render.

// Share immutable formatters across cards instead of constructing three per render.
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago'});
const hourFormat=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const santiagoDay=(d:Date)=>dayFormat.format(d);
const requestedFor=(iso:string,serverNow:string)=>{const d=new Date(iso);return santiagoDay(d)===santiagoDay(new Date(serverNow))?`Solicitado para las ${hourFormat.format(d)}`:`Solicitado para el ${reservationWhen(iso)}`;};
// <60 min: «57 min»; desde 60 min: «1 h 5 min»; desde 24 h: «1 d 3 h». Si el dato no es numérico, usa el texto del contrato.
const delayParts=(seconds:unknown,fallback:string)=>{const s=typeof seconds==='number'&&Number.isFinite(seconds)&&seconds>=0?Math.floor(seconds):null;if(s===null)return{parts:[{v:fallback,u:''}],tail:'',text:fallback};const m=Math.floor(s/60),d=Math.floor(m/1440),h=Math.floor((m%1440)/60),mi=m%60;const parts=d>0?[{v:String(d),u:'d'},...(h?[{v:String(h),u:'h'}]:[])]:m>=60?[{v:String(h),u:'h'},...(mi?[{v:String(mi),u:'min'}]:[])]:[{v:String(m),u:'min'}];return{parts,tail:'de retraso',text:`${parts.map(x=>`${x.v} ${x.u}`).join(' ')} de retraso`};};
function LateClock(){return <svg className="zipco-late-clock-svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false"><circle cx="40" cy="40" r="34" fill="#fbbf2414" stroke="#fbbf24" strokeWidth="3"/><path d="M40 10v5M40 65v5M10 40h5M65 40h5" stroke="#fde68a" strokeWidth="2" strokeLinecap="round"/><path className="zipco-late-arc" d="M40 40 L40 12 A28 28 0 0 1 61 21 Z"/><line className="zipco-late-min" x1="40" y1="40" x2="40" y2="16" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><line className="zipco-late-hr" x1="40" y1="40" x2="40" y2="26" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round"/><circle cx="40" cy="40" r="3.5" fill="#fbbf24"/></svg>;}

type LateOperation=ReturnType<typeof useLateInitial>;
// Resumen de una línea bajo el nombre: solo datos del pedido (sin calcular demoras con el reloj del teléfono).
const querySummary=(order:BusinessRequest|MyOrder,scheduledFor:string)=>{
  const first=order.products.state==='available'?order.products.items[0]:undefined,extra=order.products.state==='available'?order.products.items.length-1:0;
  return [first?`${first.quantity}× ${first.name}${extra>0?` +${extra} más`:''}`:'',`Pedida para ${reservationWhen(scheduledFor)}`].filter(Boolean).join(' · ');
};
function CustomerQuery({order,p,late,name,expanded,onToggle,isUnread,operation,pending,can,blocked,answering,setAnswering}:{order:BusinessRequest|MyOrder;p:NonNullable<(BusinessRequest|MyOrder)['requestProcess']>;late:NonNullable<NonNullable<(BusinessRequest|MyOrder)['requestProcess']>['lateInitialResponse']>;name:string;expanded:boolean;onToggle:()=>void;isUnread:boolean;operation:LateOperation;pending:ReturnType<LateOperation['pending']>;can:(a:LateInitialAction)=>boolean;blocked:(a:LateInitialAction)=>boolean;answering:LateInitialAction|null;setAnswering:(a:LateInitialAction|null)=>void}){
  const yes=can('CONFIRM_LATE_REQUEST_NEED'),no=can('DECLINE_LATE_REQUEST_NEED'),answer=yes||no,detailId=`late-detail-${order.id}`;
  const respond=(a:LateInitialAction)=>{setAnswering(a);void operation.run(a).finally(()=>setAnswering(null));};
  const wait=(a:LateInitialAction)=>operation.busy&&answering===a;
  return <article id={`order-${order.id}`} tabIndex={0} data-late-initial={late.status} data-unread={isUnread} className="zipco-late-card zipco-late-card--query scroll-mb-36" aria-label={`${name}: Consulta del negocio`}>
    <div className="zipco-lq-top">
      <span className="zipco-lq-tag"><span className="zipco-lq-mi" aria-hidden="true"><Store size={12} strokeWidth={2.4}/></span><b>RESPUESTA DEL NEGOCIO</b></span>
      <button type="button" className="zipco-lq-vd" aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>
        <svg className="zipco-lq-hand" width="22" height="26" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path className="zipco-lq-w1" d="M5.6 4.6a3.6 3.6 0 0 1 4.8 0"/><path className="zipco-lq-w2" d="M3.4 2.2a6.8 6.8 0 0 1 9.2 0"/><g transform="translate(0,5)"><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v14"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></g></svg>
        {expanded?'Ocultar detalle':'Ver detalle'}{expanded?<ChevronUp size={14} strokeWidth={2.4} aria-hidden="true"/>:<ChevronDown size={14} strokeWidth={2.4} aria-hidden="true"/>}
      </button>
    </div>
    <div className="zipco-lq-row">
      <span className="zipco-lq-th"><ProductPreviewControl fallback={<span className="zipco-lq-fb"><ShoppingBag size={22} strokeWidth={2} aria-hidden="true"/></span>}/></span>
      <div className="zipco-lq-id"><small>NEGOCIO</small><h3>{name||'Negocio'}</h3><span className="zipco-lq-sub">{querySummary(order,late.scheduledFor)}</span></div>
      {order.total!==null&&<div className="zipco-lq-price"><strong>${order.total.toLocaleString('es-CL')}</strong><small>SOLICITADO</small></div>}
    </div>
    <div className="zipco-lq-q"><span className="zipco-lq-orb" aria-hidden="true"><Send size={18} strokeWidth={2.2}/></span><div><h4>¿Todavía necesitas este pedido?</h4><p><b>{name||'El negocio'}</b> quiere saber si aún lo necesitas. La hora solicitada ya pasó.</p></div></div>
    {answer&&<>
      <div className="zipco-lq-acts">
        {yes&&<button type="button" className="zipco-lq-yes" data-waiting={wait('CONFIRM_LATE_REQUEST_NEED')} disabled={blocked('CONFIRM_LATE_REQUEST_NEED')} onClick={()=>respond('CONFIRM_LATE_REQUEST_NEED')}><span className="zipco-lq-ic" aria-hidden="true">{wait('CONFIRM_LATE_REQUEST_NEED')?<i className="zipco-lq-sp"/>:<Check size={12} strokeWidth={3}/>}</span>Sí, aún lo necesito</button>}
        {no&&<button type="button" className="zipco-lq-no" data-waiting={wait('DECLINE_LATE_REQUEST_NEED')} disabled={blocked('DECLINE_LATE_REQUEST_NEED')} onClick={()=>respond('DECLINE_LATE_REQUEST_NEED')}><span className="zipco-lq-ic" aria-hidden="true">{wait('DECLINE_LATE_REQUEST_NEED')?<i className="zipco-lq-sp"/>:<X size={12} strokeWidth={3}/>}</span>No, ya no lo necesito</button>}
      </div>
      <p className="zipco-lq-fine">«Sí» no confirma disponibilidad ni reserva.</p>
    </>}
    {(operation.error||pending)&&<div className="zipco-late-recovery zipco-lq-rec">{operation.error&&<p role="alert">{operation.error}</p>}<button type="button" disabled={operation.busy} onClick={()=>void operation.update()}><RefreshCw size={14} strokeWidth={2.4} aria-hidden="true"/>Comprobar pedido</button></div>}
    {operation.message&&<p className="zipco-late-help zipco-lq-msg" role="status">{operation.message}</p>}
    <div id={detailId} hidden={!expanded}>{expanded&&<div className="zipco-late-details zipco-lq-details">
      {(order.products.state==='available'&&order.products.items.length>0||order.note||order.referencePhoto&&safePhoto(order.referencePhoto))&&<div className="zipco-lq-tile">
        {order.products.state==='available'&&order.products.items.map((item,i)=><p className="zipco-late-product" key={i}><span><b>{item.quantity}×</b> {item.name}</span><strong>${(item.price*item.quantity).toLocaleString('es-CL')}</strong></p>)}
        {order.note&&<p className="zipco-late-note">{order.note}</p>}
        {order.referencePhoto&&safePhoto(order.referencePhoto)&&<OrderReferencePhoto src={order.referencePhoto} business={false}/>}
      </div>}
      <dl><div><dt><Clock3 size={14}/>Pedida para</dt><dd>{reservationWhen(late.scheduledFor)}</dd></div>{order.createdAt&&<div><dt><CalendarDays size={14}/>Recibida</dt><dd>{reservationWhen(order.createdAt)}</dd></div>}</dl>
      <button type="button" className="zipco-lq-hide" onClick={event=>{const toggle=event.currentTarget.closest('.zipco-late-card--query')?.querySelector<HTMLButtonElement>('.zipco-lq-vd');onToggle();toggle?.focus({preventScroll:true});}}>Ocultar detalle<ChevronUp size={14} strokeWidth={2.4} aria-hidden="true"/></button>
    </div>}</div>
  </article>;
}

export default function LateInitialCard({order,business,expanded,onToggle,refresh,isUnread=false}:{order:BusinessRequest|MyOrder;business:boolean;expanded:boolean;onToggle:()=>void;refresh:()=>void;isUnread?:boolean}){
  const operation=useLateInitial(order,business,refresh),[closing,setClosing]=useState(false),[answering,setAnswering]=useState<LateInitialAction|null>(null);
  const p=order.requestProcess,late=p?.lateInitialResponse,name='customerName'in order?order.customerName:order.businessName;
  useEffect(()=>{if(closing&&!lateInitialAllowed(p,business,'CLOSE_LATE_REQUEST_UNAVAILABLE'))setClosing(false);},[p?.version,closing,business]);
  if(!p||!late)return null;
  const pending=operation.pending(),can=(a:LateInitialAction)=>lateInitialAllowed(p,business,a),blocked=(a:LateInitialAction)=>operation.busy||!!pending&&(pending.action!==a||pending.confirmed);
  const ask=can('ASK_LATE_REQUEST_NEED'),answer=can('CONFIRM_LATE_REQUEST_NEED'),waiting=late.status==='AWAITING_CUSTOMER';
  // Cliente · «¿Todavía necesitas este pedido?»: tarjeta propia (minimalista). Negocio y los demás estados del cliente siguen abajo sin cambios.
  if(!business&&waiting)return <CustomerQuery order={order} p={p} late={late} name={name} expanded={expanded} onToggle={onToggle} isUnread={isUnread} operation={operation} pending={pending} can={can} blocked={blocked} answering={answering} setAnswering={setAnswering}/>;
  const delay=delayParts(late.delaySeconds,lateDelayLabel(late.delaySeconds));
  return <article id={`order-${order.id}`} tabIndex={0} data-late-initial={late.status} data-unread={isUnread} className={`zipco-late-card scroll-mb-36${business?' zipco-late-card--business':''}`} aria-label={`${name}: ${business?'Fuera de hora':'Consulta del negocio'}`}>
    <header className="zipco-late-header"><ProductPreviewControl fallback={<span className="zipco-late-avatar"><UserRound size={21}/></span>}/><div><p>{business?'SOLICITUD DE CLIENTE':'RESPUESTA DEL NEGOCIO'}</p><h3>{name|| (business?'Cliente':'Negocio')}</h3></div>{order.total!==null&&<div className="zipco-late-price"><strong>${order.total.toLocaleString('es-CL')}</strong><small>SOLICITADO</small></div>}</header>
    {business?<div className="zipco-late-clock-panel"><span className="zipco-late-clock"><LateClock/></span><div className="zipco-late-info"><p className="zipco-late-delay" aria-label={delay.text}>{delay.parts.map((x,i)=><span key={i} aria-hidden="true"><b>{x.v}</b>{x.u&&<em>{x.u}</em>}</span>)}{delay.tail&&<em className="zipco-late-tail" aria-hidden="true">{delay.tail}</em>}</p><strong className="zipco-late-badge">FUERA DE HORA</strong><p className="zipco-late-time">{requestedFor(late.scheduledFor,late.serverNow)}</p></div></div>:<div className="zipco-late-customer"><Send aria-hidden="true"/><h4>{waiting?'¿Todavía necesitas este pedido?':'Avisamos al negocio'}</h4><p>{waiting?`${name||'El negocio'} pregunta si todavía necesitas este pedido.`:'Falta acordar una nueva hora. Tu respuesta no confirma disponibilidad ni reserva.'}</p></div>}
    {business&&waiting&&<p className="zipco-late-status" role="status">Consulta enviada. Esperando la respuesta del cliente.</p>}
    {business&&late.status==='STILL_NEEDED'&&<p className="zipco-late-status">El cliente aún lo necesita. Propón una nueva hora para que la revise.</p>}
    {expanded&&<div className="zipco-late-details">
      {order.products.state==='available'&&order.products.items.map((item,i)=><p className="zipco-late-product" key={i}><span><b>{item.quantity}×</b> {item.name}</span><strong>${(item.price*item.quantity).toLocaleString('es-CL')}</strong></p>)}
      {order.note&&<p className="zipco-late-note">{order.note}</p>}
      {order.referencePhoto&&safePhoto(order.referencePhoto)&&<OrderReferencePhoto src={order.referencePhoto} business={business}/>}
      <dl><div><dt><Clock3 size={14}/>Pedida para</dt><dd>{reservationWhen(late.scheduledFor)}</dd></div>{order.createdAt&&<div><dt><CalendarDays size={14}/>Recibida</dt><dd>{reservationWhen(order.createdAt)}</dd></div>}</dl>
      {business&&<p className="zipco-late-help">{ask?'Consulta si el cliente aún lo necesita o elimina la solicitud.':waiting?'Le preguntamos si aún necesita el pedido. Su respuesta no cambia la hora original.':'La nueva fecha y hora necesitan la aceptación del cliente.'}</p>}
      {!business&&late.status==='STILL_NEEDED'&&p.allowedActions.includes('CANCEL_PENDING_REQUEST')&&<PendingCancellationActions order={order} refresh={refresh}/>}
    </div>}
    <div className="zipco-late-actions">
      {ask&&<button type="button" className="zipco-late-primary" disabled={blocked('ASK_LATE_REQUEST_NEED')} onClick={()=>void operation.run('ASK_LATE_REQUEST_NEED')}><Send size={16}/>{operation.busy?'Comprobando…':pending?.action==='ASK_LATE_REQUEST_NEED'?'Reintentar la consulta':'Consultar si aún lo requiere'}</button>}
      {business&&late.status==='STILL_NEEDED'&&p.allowedActions.includes('PROPOSE_ALTERNATIVE')&&<ProposalNegotiation order={order} business refresh={refresh} variant="aurora" initialLabel="Proponer nueva hora"/>}
      {answer&&<><button type="button" className="zipco-late-primary" disabled={blocked('CONFIRM_LATE_REQUEST_NEED')} onClick={()=>void operation.run('CONFIRM_LATE_REQUEST_NEED')}>Sí, aún lo necesito</button><button type="button" className="zipco-late-secondary" disabled={blocked('DECLINE_LATE_REQUEST_NEED')} onClick={()=>void operation.run('DECLINE_LATE_REQUEST_NEED')}>No, ya no lo necesito</button></>}
      {can('CLOSE_LATE_REQUEST_UNAVAILABLE')&&<button type="button" className="zipco-late-secondary" disabled={blocked('CLOSE_LATE_REQUEST_UNAVAILABLE')} onClick={()=>setClosing(true)}><Trash2 size={15}/>Eliminar solicitud</button>}
    </div>
    {(operation.error||pending)&&<div className="zipco-late-recovery">{operation.error&&<p role="alert">{operation.error}</p>}<button type="button" disabled={operation.busy} onClick={()=>void operation.update()}>Comprobar pedido</button></div>}
    {operation.message&&<p className="zipco-late-help" role="status">{operation.message}</p>}
    <button type="button" className="zipco-late-disclosure" aria-expanded={expanded} onClick={onToggle}>{expanded?'Ocultar detalle':'Ver detalle'}{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
    <Dialog.Root open={closing} onOpenChange={value=>{if(!operation.busy)setClosing(value);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1100] bg-slate-950/65 backdrop-blur-sm"/><Dialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
      <Dialog.Title className="text-xl font-bold">¿Eliminar esta solicitud?</Dialog.Title><Dialog.Description className="mt-2 text-sm">Le avisaremos al cliente que no podrás atenderla. Quedará en el historial de ambos.</Dialog.Description>
      {operation.error&&<p role="alert" className="mt-3 text-sm text-rose-600">{operation.error}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={operation.busy} className="min-h-12 rounded-xl border" onClick={()=>setClosing(false)}>Volver</button><button type="button" disabled={blocked('CLOSE_LATE_REQUEST_UNAVAILABLE')} className="min-h-12 rounded-xl bg-rose-700 px-2 font-bold text-white" onClick={()=>void operation.run('CLOSE_LATE_REQUEST_UNAVAILABLE').then(ok=>{if(ok)setClosing(false);})}>{operation.busy?'Guardando…':'Eliminar solicitud'}</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </article>;
}
