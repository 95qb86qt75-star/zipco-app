import * as React from 'react';
import {DetailReveal} from '../../shared/layout/DetailReveal';
import { type ReactNode } from 'react';
import {ChevronDown,ChevronUp,Clock3,Hourglass,MessageCircle,ShoppingBag,Store,X} from 'lucide-react';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";



import "../../shared/layout/availability-card-styles.css";
import "../../shared/layout/coordination-card-styles.css";

type Item={name:string;quantity:number;unitPrice:number};



/**
 * Tarjeta del NEGOCIO: «Esperando al cliente» después de confirmar disponibilidad
 * (maqueta aprobada: tablero «tarjeta limpia y tocable», variante D).
 * Solo presentación: el retiro (WITHDRAW_AVAILABILITY) y su confirmación siguen en AvailabilityFlowCard.
 * Toda la tarjeta cierra/abre el detalle; la miniatura abre la vista del producto; «Retirar disponibilidad» solo existe dentro del detalle.
 * Rediseño `.zipco-aw` (tablero CliU27): mismos datos y callbacks; el error queda siempre visible, también plegada.
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
  const modality=local?'RETIRO EN EL LOCAL':'COORDINACIÓN POR WHATSAPP';
  return <article className="zipco-avw zipco-aw" data-unread={isUnread} data-expanded={expanded} data-modality={local?'local':'whatsapp'} data-aw-error={error?true:undefined}>
    {/* Botón que cubre toda la tarjeta; el contenido va encima sin capturar clics, salvo miniatura, foto, retirar, ocultar y errores. */}
    <button type="button" className="zipco-avw-toggle" aria-expanded={expanded} onClick={onToggle}
      aria-label={`${name}: esperando al cliente. ${expanded?'Ocultar detalle':'Ver detalle'}`}/>
    <div className="zipco-avw-body">
      <div className="zipco-aw-mod"><span className="zipco-aw-mi" aria-hidden="true">{local?<Store size={12} strokeWidth={2.4}/>:<WhatsAppMark className="h-3 w-3"/>}</span><b>{modality}</b></div>
      <div className="zipco-aw-tp">
        <span role="status" className="zipco-aw-pill"><i aria-hidden="true"/><b>Esperando al cliente</b></span>
        <span className="zipco-aw-hint" aria-hidden="true">
          <svg width="26" height="30" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path className="zipco-avw-wave1" d="M5.6 4.6a3.6 3.6 0 0 1 4.8 0"/><path className="zipco-avw-wave2" d="M3.4 2.2a6.8 6.8 0 0 1 9.2 0"/>
            <g transform="translate(0,5)"><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v14"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></g>
          </svg>{expanded?'Ocultar detalle':'Ver detalle'}<ChevronDown className="zipco-aw-chv" size={14} strokeWidth={2.4}/>
        </span>
      </div>
      <div className="zipco-aw-r">
        <span className="zipco-aw-th">
          <ProductPreviewControl fallback={<span className="zipco-aw-fb"><ShoppingBag size={22} strokeWidth={2} aria-hidden="true"/></span>}/>
          <i className="zipco-aw-q">{quantity}×</i>
        </span>
        <div className="zipco-aw-id">
          <small>CLIENTE{isUnread&&<em>Nueva</em>}</small>
          <h4>{name||'Cliente'}</h4>
        </div>
        <div className="zipco-aw-pr"><b>{price===null?'—':`$${price.toLocaleString('es-CL')}`}</b><small>SOLICITADO</small></div>
      </div>
      {/* Errores y recuperación: siempre visibles (también plegada). Es el mismo nodo `error` del contenedor. */}
      <div className="zipco-avw-error zipco-aw-err">{error}</div>
      <div className="zipco-aw-row" aria-hidden="true"><span className="zipco-aw-nd"><Hourglass size={15} strokeWidth={2.3}/></span><span className="zipco-aw-tx"><b>Confirmaste disponibilidad</b><small>Falta la decisión del cliente · toca para abrir</small></span><ChevronDown className="zipco-aw-rchv" size={15} strokeWidth={2.6}/></div>
      <DetailReveal expanded={expanded}><div className="zipco-aw-dt">
        <div className="zipco-aw-sum"><span className="zipco-aw-sumi" aria-hidden="true"><Hourglass size={15} strokeWidth={2.3}/></span>
          <div><p><b>Confirmaste disponibilidad.</b> El cliente debe decidir si continúa.</p>
            {!local&&<p>Si el cliente continúa, podrán coordinar los siguientes pasos por WhatsApp según los permisos.</p>}</div></div>
        <div className="zipco-aw-one">
          <div className="zipco-aw-items">{items.map((item,index)=><p className="zipco-aw-li" key={index}><span className="q">{item.quantity}×</span><span className="n">{item.name}</span><b>${(item.quantity*item.unitPrice).toLocaleString('es-CL')}</b></p>)}</div>
          <dl className="zipco-aw-rows">
            <div><span className="i"><Clock3 size={14} strokeWidth={2.3}/></span><span><dt>Pedido para</dt><dd>{schedule}</dd></span></div>
            {message&&<div><span className="i"><MessageCircle size={14} strokeWidth={2.3}/></span><span><dt>Mensaje del negocio</dt><dd>{message}</dd></span></div>}
            {hours&&<div><span className="i"><Store size={14} strokeWidth={2.3}/></span><span><dt>Horario o dirección de retiro</dt><dd>{hours}</dd></span></div>}
          </dl>
        </div>
        {note&&<p className="zipco-aw-note"><b>Nota:</b> {note}</p>}
        {reference&&<div className="zipco-avw-ref zipco-aw-ref">{reference}</div>}
        <div className="zipco-aw-foot">
          <div className="zipco-aw-acts">
            {canRetire&&<button type="button" className="zipco-avw-withdraw zipco-aw-wd" disabled={busy} onClick={onRetire}><X size={14} strokeWidth={2.6}/>Retirar disponibilidad</button>}
            <button type="button" className="zipco-aw-hide" aria-label="Ocultar detalle" onClick={event=>{onToggle();event.currentTarget.closest('.zipco-aw')?.querySelector<HTMLButtonElement>('.zipco-avw-toggle')?.focus({preventScroll:true});}}>Ocultar<ChevronUp size={14} strokeWidth={2.6} aria-hidden="true"/></button>
          </div>
          {canRetire&&<p className="zipco-aw-fine">Mientras el cliente decide, puedes retirar la disponibilidad.</p>}
        </div>
      </div></DetailReveal>
    </div>
  </article>;
}
