import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {CalendarDays,ChevronDown,ChevronUp,Clock3,Send,UserRound,X} from 'lucide-react';
import type {BusinessRequest,MyOrder} from './types';
import {lateInitialAllowed,lateDelayLabel,type LateInitialAction} from './lateInitialContract';
import useLateInitial from './useLateInitial';
import ProposalNegotiation from './ProposalNegotiation';
import PendingCancellationActions from './PendingCancellationActions';
const reservationWhen=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short',hourCycle:'h23'}).format(new Date(iso));
import OrderReferencePhoto from './OrderReferencePhoto';
import {safePhoto} from './agreement';
import './late-initial.css';

export default function LateInitialCard({order,business,expanded,onToggle,refresh,isUnread=false}:{order:BusinessRequest|MyOrder;business:boolean;expanded:boolean;onToggle:()=>void;refresh:()=>void;isUnread?:boolean}){
  const operation=useLateInitial(order,business,refresh),[closing,setClosing]=useState(false);
  const p=order.requestProcess,late=p?.lateInitialResponse,name='customerName'in order?order.customerName:order.businessName;
  useEffect(()=>{if(closing&&!lateInitialAllowed(p,business,'CLOSE_LATE_REQUEST_UNAVAILABLE'))setClosing(false);},[p?.version,closing,business]);
  if(!p||!late)return null;
  const pending=operation.pending(),can=(a:LateInitialAction)=>lateInitialAllowed(p,business,a),blocked=(a:LateInitialAction)=>operation.busy||!!pending&&(pending.action!==a||pending.confirmed);
  const ask=can('ASK_LATE_REQUEST_NEED'),answer=can('CONFIRM_LATE_REQUEST_NEED'),waiting=late.status==='AWAITING_CUSTOMER';
  return <article id={`order-${order.id}`} tabIndex={0} data-late-initial={late.status} data-unread={isUnread} className="zipco-late-card scroll-mb-36" aria-label={`${name}: ${business?'Fuera de hora':'Consulta del negocio'}`}>
    <header className="zipco-late-header"><span className="zipco-late-avatar"><UserRound size={21}/></span><div><p>{business?'SOLICITUD DE CLIENTE':'RESPUESTA DEL NEGOCIO'}</p><h3>{name|| (business?'Cliente':'Negocio')}</h3></div>{order.total!==null&&<div className="zipco-late-price"><strong>${order.total.toLocaleString('es-CL')}</strong><small>SOLICITADO</small></div>}</header>
    {business?<div className="zipco-late-clock-panel"><span className="zipco-late-clock"><Clock3 aria-hidden="true"/></span><div><strong className="zipco-late-badge">FUERA DE HORA</strong><p className="zipco-late-delay">{lateDelayLabel(late.delaySeconds)}</p><p className="zipco-late-time">Pedido para {reservationWhen(late.scheduledFor)}</p></div></div>:<div className="zipco-late-customer"><Send aria-hidden="true"/><h4>{waiting?'¿Todavía necesitas este pedido?':'Avisamos al negocio'}</h4><p>{waiting?`${name||'El negocio'} pregunta si todavía necesitas este pedido.`:'Falta acordar una nueva hora. Tu respuesta no confirma disponibilidad ni reserva.'}</p></div>}
    {business&&waiting&&<p className="zipco-late-status" role="status">Esperando respuesta del cliente</p>}
    {business&&late.status==='STILL_NEEDED'&&<p className="zipco-late-status">El cliente aún lo necesita. Propón una nueva hora para que la revise.</p>}
    {expanded&&<div className="zipco-late-details">
      {order.products.state==='available'&&order.products.items.map((item,i)=><p className="zipco-late-product" key={i}><span><b>{item.quantity}×</b> {item.name}</span><strong>${(item.price*item.quantity).toLocaleString('es-CL')}</strong></p>)}
      {order.note&&<p className="zipco-late-note">{order.note}</p>}
      {order.referencePhoto&&safePhoto(order.referencePhoto)&&<OrderReferencePhoto src={order.referencePhoto} business={business}/>}
      <dl><div><dt><Clock3 size={14}/>Pedida para</dt><dd>{reservationWhen(late.scheduledFor)}</dd></div>{order.createdAt&&<div><dt><CalendarDays size={14}/>Recibida</dt><dd>{reservationWhen(order.createdAt)}</dd></div>}</dl>
      {business&&<p className="zipco-late-help">{ask?'Consulta si el cliente aún lo necesita o avísale que no podrás atender.':waiting?'Le preguntamos si aún necesita el pedido. Su respuesta no cambia la hora original.':'La nueva fecha y hora necesitan la aceptación del cliente.'}</p>}
      {!business&&late.status==='STILL_NEEDED'&&p.allowedActions.includes('CANCEL_PENDING_REQUEST')&&<PendingCancellationActions order={order} refresh={refresh}/>}
    </div>}
    <div className="zipco-late-actions">
      {ask&&<button type="button" className="zipco-late-primary" disabled={blocked('ASK_LATE_REQUEST_NEED')} onClick={()=>void operation.run('ASK_LATE_REQUEST_NEED')}><Send size={16}/>{operation.busy?'Comprobando…':pending?.action==='ASK_LATE_REQUEST_NEED'?'Reintentar la consulta':'Consultar si aún lo requiere'}</button>}
      {business&&late.status==='STILL_NEEDED'&&p.allowedActions.includes('PROPOSE_ALTERNATIVE')&&<ProposalNegotiation order={order} business refresh={refresh} variant="aurora" initialLabel="Proponer nueva hora"/>}
      {answer&&<><button type="button" className="zipco-late-primary" disabled={blocked('CONFIRM_LATE_REQUEST_NEED')} onClick={()=>void operation.run('CONFIRM_LATE_REQUEST_NEED')}>Sí, aún lo necesito</button><button type="button" className="zipco-late-secondary" disabled={blocked('DECLINE_LATE_REQUEST_NEED')} onClick={()=>void operation.run('DECLINE_LATE_REQUEST_NEED')}>No, ya no lo necesito</button></>}
      {can('CLOSE_LATE_REQUEST_UNAVAILABLE')&&<button type="button" className="zipco-late-secondary" disabled={blocked('CLOSE_LATE_REQUEST_UNAVAILABLE')} onClick={()=>setClosing(true)}><X size={15}/>No podré atender</button>}
    </div>
    {(operation.error||pending)&&<div className="zipco-late-recovery">{operation.error&&<p role="alert">{operation.error}</p>}<button type="button" disabled={operation.busy} onClick={()=>void operation.update()}>Comprobar pedido</button></div>}
    {operation.message&&<p className="zipco-late-help" role="status">{operation.message}</p>}
    <button type="button" className="zipco-late-disclosure" aria-expanded={expanded} onClick={onToggle}>{expanded?'Ocultar detalle':'Ver detalle'}{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
    <Dialog.Root open={closing} onOpenChange={value=>{if(!operation.busy)setClosing(value);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1100] bg-slate-950/65 backdrop-blur-sm"/><Dialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
      <Dialog.Title className="text-xl font-bold">¿Finalizar esta solicitud?</Dialog.Title><Dialog.Description className="mt-2 text-sm">Le avisaremos al cliente que no podrás atenderla. Quedará en el historial de ambos.</Dialog.Description>
      {operation.error&&<p role="alert" className="mt-3 text-sm text-rose-600">{operation.error}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={operation.busy} className="min-h-12 rounded-xl border" onClick={()=>setClosing(false)}>Volver</button><button type="button" disabled={blocked('CLOSE_LATE_REQUEST_UNAVAILABLE')} className="min-h-12 rounded-xl bg-rose-700 px-2 font-bold text-white" onClick={()=>void operation.run('CLOSE_LATE_REQUEST_UNAVAILABLE').then(ok=>{if(ok)setClosing(false);})}>{operation.busy?'Guardando…':'Finalizar solicitud'}</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </article>;
}
