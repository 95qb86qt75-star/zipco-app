import {useEffect,useRef,type ReactNode} from 'react';
import {Check,Clock3,MessageCircle,ShoppingBag,Store,X} from 'lucide-react';
import ProductPreviewControl from './ProductPreviewControl';
import CustomerCoordinationCard from './CustomerCoordinationCard';
import WhatsAppMark from './WhatsAppMark';
import './availability-waiting.css';
import './coordination-v2.css';

type Item={name:string;quantity:number;unitPrice:number};

export function DetailReveal({children,expanded}:{children:ReactNode;expanded:boolean}){
  const element=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(element.current)element.current.inert=!expanded;},[expanded]);
  // One fold clips a fixed-size body: no parallel layout animations or scaled text.
  return <div className="zipco-avw-reveal" data-folded={!expanded} aria-hidden={!expanded} ref={element}>
    <div className="zipco-avw-reveal-inner">{children}</div>
  </div>;
}

/**
 * Tarjeta del NEGOCIO: «Esperando al cliente» después de confirmar disponibilidad
 * (maqueta aprobada: tablero «tarjeta limpia y tocable», variante D).
 * Solo presentación: el retiro (WITHDRAW_AVAILABILITY) y su confirmación siguen en AvailabilityFlowCard.
 * Toda la tarjeta cierra/abre el detalle; la miniatura abre la vista del producto; «Retirar disponibilidad» solo existe dentro del detalle.
 */
export default function AvailabilityWaitingCard({name,price,items,schedule,note,reference,path,customerMessage,scheduleOrAddress,
  expanded,onToggle,canRetire,busy,onRetire,error,isUnread=false}:{
  name:string;price:number|null;items:Item[];schedule:string;note?:string|null;reference?:ReactNode;
  path?:string;customerMessage?:string|null;scheduleOrAddress?:string|null;
  expanded:boolean;onToggle:()=>void;canRetire:boolean;busy:boolean;onRetire:()=>void;error?:ReactNode;isUnread?:boolean;
}){
  const local=path==='LOCAL_PICKUP';
  const quantity=items.reduce((sum,i)=>sum+i.quantity,0);
  const message=local?customerMessage?.trim():'';
  const hours=local?scheduleOrAddress?.trim():'';
  const pathLabel=local?'Retiro en el local':'Coordinar por WhatsApp';
  const PathIcon=local?Store:MessageCircle;
  return <article className="zipco-avw" data-unread={isUnread} data-expanded={expanded}>
    {/* Botón que cubre toda la tarjeta; el contenido va encima sin capturar clics, salvo miniatura y retirar. */}
    <button type="button" className="zipco-avw-toggle" aria-expanded={expanded} onClick={onToggle}
      aria-label={`${name}: esperando al cliente. ${expanded?'Ocultar detalle':'Ver detalle'}`}/>
    <div className="zipco-avw-body">
      <div className="zipco-avw-top">
      <div className="zipco-avw-head">
        <span className="zipco-avw-ring">
          <ProductPreviewControl fallback={<span className="zipco-avw-thumb">
            <ShoppingBag size={24} strokeWidth={2} aria-hidden="true"/>
            </span>}/>
          <i className="zipco-avw-quantity">{quantity}×</i>
          <span className="zipco-avw-check" aria-hidden="true"><Check size={11} strokeWidth={3.6}/></span>
        </span>
        <div className="zipco-avw-name">
          <h4>{name||'Cliente'}</h4>
          {isUnread&&<span className="zipco-avw-new">Nueva</span>}
          <span role="status" className="zipco-avw-chip"><span className="zipco-avw-dot" aria-hidden="true"/>Esperando al cliente</span>
        </div>
        <div className="zipco-avw-price"><b>{price===null?'—':`$${price.toLocaleString('es-CL')}`}</b><small>SOLICITADO</small></div>
      </div>
      <span className="zipco-avw-hint" aria-hidden="true">
        <svg width="26" height="30" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path className="zipco-avw-wave1" d="M5.6 4.6a3.6 3.6 0 0 1 4.8 0"/><path className="zipco-avw-wave2" d="M3.4 2.2a6.8 6.8 0 0 1 9.2 0" stroke="#6ee7b7"/>
          <g transform="translate(0,5)"><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></g>
        </svg>{expanded?'Ocultar detalle':'Ver detalle'}
      </span>
      </div>
      <DetailReveal expanded={expanded}><div className="zipco-avw-detail zipco-avw-detail-top">
        <p className="zipco-avw-summary">Confirmaste disponibilidad. El cliente debe decidir si continúa.</p>
        <div className="zipco-avw-chips">
          <span><PathIcon size={13} strokeWidth={2.4}/>{pathLabel}</span>
        </div>
        {items.map((item,index)=><p className="zipco-avw-line" key={index}><span className="q">{item.quantity}×</span><span className="n">{item.name}</span><b>${(item.quantity*item.unitPrice).toLocaleString('es-CL')}</b></p>)}
      </div>
        <div className="zipco-avw-perf" aria-hidden="true"/>
        <div className="zipco-avw-bottom">
        <dl className="zipco-avw-rows">
          <div><Clock3 size={15} strokeWidth={2.3}/><dt>Pedido para</dt><dd>{schedule}</dd></div>
          <div><PathIcon size={15} strokeWidth={2.3}/><dt>Cómo continúan</dt><dd>{pathLabel}</dd></div>
          {message&&<div><MessageCircle size={15} strokeWidth={2.3}/><dt>Mensaje</dt><dd>{message}</dd></div>}
          {hours&&<div><Clock3 size={15} strokeWidth={2.3}/><dt>Dónde y cuándo</dt><dd>{hours}</dd></div>}
        </dl>
        {note&&<p className="zipco-avw-note">Nota: {note}</p>}
        {reference&&<div className="zipco-avw-ref">{reference}</div>}
        {canRetire&&<p className="zipco-avw-fine">Mientras el cliente decide, puedes retirar la disponibilidad.</p>}
        {canRetire&&<button type="button" className="zipco-avw-withdraw" disabled={busy} onClick={onRetire}><X size={14} strokeWidth={2.6}/>Retirar disponibilidad</button>}
        <div className="zipco-avw-error">{error}</div>
      </div></DetailReveal>
    </div>
  </article>;
}

export type CoordinationCardModel={mode:'question'|'confirm'|'ownPending'|'declined';declinedBySelf?:boolean;expanded:boolean;attention:boolean;busy:boolean;canYes:boolean;canNo:boolean;error:string;recovery?:ReactNode;onToggle:()=>void;onYes:()=>void;onNo:()=>void;onCancel:()=>void;onReturn:()=>void};
export function CoordinationWaitingCard({id,name,price,quantity,model,children,business=true,items=[]}:{id:number;name:string;price:number|null;quantity:number;model:CoordinationCardModel;children:ReactNode;business?:boolean;items?:{name:string;quantity:number}[]}){
  const {mode,busy}=model,confirm=mode==='confirm',closed=mode==='declined',own=mode==='ownPending';
  const description=own?'Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.':closed?'Se indicó que todavía falta coordinar. El pedido sigue en Por coordinar.':confirm?'Solo Devolver guarda tu respuesta y avisa a la otra parte.':'Confirma si ya acordaron el pago y la entrega de este pedido por WhatsApp.';
  if(!business)return <CustomerCoordinationCard id={id} name={name} price={price} quantity={quantity} model={model} description={description} items={items}>{children}</CustomerCoordinationCard>;
  return <article id={`order-${id}`} tabIndex={-1} className="zipco-avw zipco-avw-query scroll-mb-36" data-expanded={model.expanded} data-attention={model.attention} data-mode={mode}>
    <div className="zipco-avw-query-head">
      <span className="zipco-avw-ring"><ProductPreviewControl fallback={<span className="zipco-avw-thumb"><ShoppingBag size={24}/></span>}/><i className="zipco-avw-quantity">{quantity}×</i><span className="zipco-avw-query-orbit" aria-hidden="true"><span className="zipco-avw-query-badge">{closed?<Clock3 size={15}/>:<WhatsAppMark className="h-4 w-4"/>}</span></span></span>
      <div className="zipco-avw-query-copy"><div className="zipco-avw-query-top"><small>COORDINACIÓN</small><button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded} aria-controls={`coordination-detail-${id}`} onClick={model.onToggle}>{model.expanded?'Ocultar':'Detalle'} <span aria-hidden="true">☝</span></button></div>
        <h4>{busy?'Guardando respuesta…':confirm?'¿Devolver a Por coordinar?':closed?'Falta coordinar':own?'Esperando a la otra parte':<>¿Coordinación lista por <em>WhatsApp</em>?</>}</h4>
        <p>{name} · {price===null?'Total por comprobar':`$${price.toLocaleString('es-CL')}`}</p>
      </div>
      <div className="zipco-avw-query-actions">
        {busy?<span className="zipco-avw-query-saving" role="status"><span className="zipco-flow-spinner">◌</span><small>Guardando</small></span>:own?null:closed?<button type="button" className="zipco-avw-query-resume" onClick={model.onToggle}>Coordinar después</button>:<>
          <button type="button" className="zipco-avw-query-yes" data-amber={confirm} aria-label={`${confirm?'Devolver a Por coordinar':'Sí, ya coordinamos'}: ${name}, pedido ${id}`} disabled={!model.canYes||!!model.recovery} onClick={confirm?model.onReturn:model.onYes}><span><Check size={24}/></span><small>{confirm?'Devolver':'Sí'}</small></button>
          <button type="button" className="zipco-avw-query-no" data-cancel={confirm} aria-label={`${confirm?'Cancelar sin responder':'Falta coordinar'}: ${name}, pedido ${id}`} disabled={!!model.recovery||!confirm&&!model.canNo} onClick={confirm?model.onCancel:model.onNo}><span><X size={23} strokeWidth={3}/></span><small>{confirm?'Cancelar':'Falta'}</small></button>
        </>}
      </div>
    </div>
    {(model.error||model.recovery)&&<div className="zipco-avw-query-recovery">{model.error&&<p role="alert">{model.error}</p>}{model.recovery}</div>}
    <DetailReveal expanded={model.expanded}><div id={`coordination-detail-${id}`} className="zipco-avw-query-body" {...(busy?{inert:''}:{})}>
      <p className="zipco-avw-query-description">{description}</p><p className="zipco-avw-query-legal">ZIPCO no recibe ni verifica pagos.</p>
      {closed&&model.canYes&&!model.recovery&&<button className="zipco-avw-query-reconfirm" type="button" disabled={busy} onClick={model.onYes}>Ya coordinamos: confirmar</button>}
      {children}
    </div></DetailReveal>
  </article>;
}
