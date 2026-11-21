import * as React from 'react';
import {DetailReveal} from '../../shared/layout/DetailReveal';
import { type ReactNode } from 'react';
import {ChevronDown,Clock3,Hourglass,MapPin,MessageCircle,ShoppingBag,Store,X} from 'lucide-react';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";



import "../../shared/layout/availability-card-styles.css";
import "../../shared/layout/coordination-card-styles.css";

type Item={name:string;quantity:number;unitPrice:number};



/**
 * Tarjeta del NEGOCIO: «Esperando al cliente» después de confirmar disponibilidad
 * (maqueta aprobada: tablero NegW4, variante A «Pulso», Aurora Pro).
 * Solo presentación: el retiro (WITHDRAW_AVAILABILITY) y su confirmación siguen en AvailabilityFlowCard.
 * Toda la tarjeta cierra/abre el detalle (el chevron es solo indicador); la miniatura abre la vista del producto; «Retirar disponibilidad» solo existe dentro del detalle.
 * Rediseño `.zipco-aw`: mismos datos y callbacks; el error queda siempre visible, también plegada.
 * Orden del detalle: modalidad · pedido · nota · foto de referencia · respuesta del negocio (ticket de retiro o aviso de WhatsApp) · retirar.
 */
export default function AvailabilityWaitingCard({name,price,items,schedule,note,reference,path,customerMessage,scheduleOrAddress,
  expanded,onToggle,canRetire,busy,onRetire,error,isUnread=false,conversation}:{
  name:string;price:number|null;items:Item[];schedule:string;note?:string|null;reference?:ReactNode;
  path?:string;customerMessage?:string|null;scheduleOrAddress?:string|null;
  expanded:boolean;onToggle:()=>void;canRetire:boolean;busy:boolean;onRetire:()=>void;error?:ReactNode;isUnread?:boolean;conversation?:ReactNode;
}){
  const local=path==='LOCAL_PICKUP';
  const quantity=items.reduce((sum,i)=>sum+i.quantity,0);
  const message=local?customerMessage?.trim():'';
  const hours=local?scheduleOrAddress?.trim():'';
  const modalityIcon=local?<Store size={13} strokeWidth={2.4} aria-hidden="true"/>:<WhatsAppMark className="h-3 w-3"/>;
  return <article className="zipco-avw zipco-aw" data-unread={isUnread} data-expanded={expanded} data-modality={local?'local':'whatsapp'} data-aw-error={error?true:undefined}>
    {/* Botón que cubre toda la tarjeta; el contenido va encima sin capturar clics, salvo miniatura, foto, retirar y errores. */}
    <button type="button" className="zipco-avw-toggle" aria-expanded={expanded} onClick={onToggle}
      aria-label={`${name}: esperando que el cliente decida si continúa. ${expanded?'Ocultar detalle':'Ver detalle'}`}/>
    <div className="zipco-avw-body">
      <div className="zipco-aw-pa">
        {/* Radar de espera: ondas finitas alrededor de la miniatura real (cuadrada); el reloj de arena indica que se espera. */}
        <div className="zipco-aw-radar">
          <u aria-hidden="true"/><u aria-hidden="true"/><u aria-hidden="true"/>
          <span className="zipco-aw-th">
            <ProductPreviewControl fallback={<span className="zipco-aw-fb"><ShoppingBag size={22} strokeWidth={2} aria-hidden="true"/></span>}/>
            <i className="zipco-aw-q">{quantity}×</i>
          </span>
          <span className="zipco-aw-badge" aria-hidden="true"><Hourglass size={13} strokeWidth={2.6}/></span>
        </div>
        <div className="zipco-aw-t">
          <small>CLIENTE{isUnread&&<em>Nueva</em>}</small>
          <h4>{name||'Cliente'}</h4>
          <span role="status" className="zipco-aw-pill"><i aria-hidden="true"/><b>Esperando al cliente</b></span>
          {/* Qué se espera exactamente: la decisión del cliente de continuar (retiro en el local o coordinación por WhatsApp). */}
          <p className="zipco-aw-ask">{modalityIcon}<span>Debe decidir si continúa {local?'con el retiro':'por WhatsApp'}</span></p>
        </div>
        <div className="zipco-aw-pr">
          <div className="zipco-aw-amt"><b>{price===null?'—':`$${price.toLocaleString('es-CL')}`}</b><small>SOLICITADO</small></div>
          <span className="zipco-aw-cb" aria-hidden="true"><ChevronDown className="zipco-aw-chv" size={18} strokeWidth={2.5}/></span>
        </div>
      </div>
      {/* Errores y recuperación: siempre visibles (también plegada). Es el mismo nodo `error` del contenedor. */}
      <div className="zipco-avw-error zipco-aw-err">{error}</div>
      <DetailReveal expanded={expanded}><div className="zipco-aw-dt">
        <div className="zipco-aw-mdl"><span className="zipco-aw-mode">{modalityIcon}{local?'Retiro en el local':'Por WhatsApp'}</span></div>
        <div className="zipco-aw-one">
          <div className="zipco-aw-items">{items.map((item,index)=><p className="zipco-aw-li" key={index}><span className="q">{item.quantity}×</span><span className="n">{item.name}</span><b>${(item.quantity*item.unitPrice).toLocaleString('es-CL')}</b></p>)}</div>
          <dl className="zipco-aw-rows">
            <div><span className="i"><Clock3 size={14} strokeWidth={2.3}/></span><span><dt>Pedido para</dt><dd>{schedule}</dd></span></div>
          </dl>
        </div>
        {note&&<p className="zipco-aw-note"><b>Nota:</b> {note}</p>}
        {/* La foto de referencia del cliente va arriba, junto al pedido: abajo se perdía. */}
        {reference&&<div className="zipco-avw-ref zipco-aw-ref">{reference}</div>}
        {!local&&<div className="zipco-aw-sum"><span className="zipco-aw-sumi" aria-hidden="true"><WhatsAppMark className="h-[15px] w-[15px]"/></span>
          <p>Si el cliente continúa, podrán coordinar los siguientes pasos por <b>WhatsApp</b> según los permisos.</p></div>}
        {/* Respuesta del negocio (solo retiro en el local): mensaje y horario o dirección, texto libre tal como lo escribió el negocio. */}
        {local&&(message||hours)&&<section className="zipco-aw-pick" aria-label="Retiro en el local">
          <div className="zipco-aw-pkh"><span aria-hidden="true"><Store size={15} strokeWidth={2.3}/></span><h3>Retiro en el local</h3></div>
          <div className="zipco-aw-tk">
            {message&&<div className="zipco-aw-tk-m"><small><MessageCircle size={11} strokeWidth={2.6} aria-hidden="true"/>MENSAJE DEL NEGOCIO</small><p>{message}</p></div>}
            {message&&hours&&<div className="zipco-aw-perf" aria-hidden="true"><i/><span/><i/></div>}
            {hours&&<div className="zipco-aw-tk-s"><span className="si" aria-hidden="true"><MapPin size={15} strokeWidth={2.4}/></span><div><small>HORARIO O DIRECCIÓN DE RETIRO</small><b>{hours}</b></div></div>}
          </div>
        </section>}
        {conversation&&<div className="zipco-aw-conversation">{conversation}</div>}
        {canRetire&&<div className="zipco-aw-foot">
          <button type="button" className="zipco-avw-withdraw zipco-aw-wd" disabled={busy} onClick={onRetire}><X size={14} strokeWidth={2.6}/>Retirar disponibilidad</button>
          <p className="zipco-aw-fine">Mientras el cliente decide, puedes retirar la disponibilidad.</p>
        </div>}
      </div></DetailReveal>
    </div>
  </article>;
}
