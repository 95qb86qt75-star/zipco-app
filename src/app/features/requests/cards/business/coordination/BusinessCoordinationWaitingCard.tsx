import * as React from 'react';
import {useEffect,useRef} from 'react';

import { Check, ChevronDown, CircleCheck, Clock3, Hourglass, LockKeyhole, ShoppingBag, X } from 'lucide-react';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";

import { BusinessCoordinationDisclosure } from "./businessCoordinationDisclosure";
import { BusinessPendingNote } from "./BusinessPendingCoordinationDetail";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import "../../shared/layout/availability-card-styles.css";
import "../../shared/layout/coordination-card-styles.css";
import {DetailReveal} from '../../shared/layout/DetailReveal';
import type {CoordinationWaitingCardProps} from '../../shared/coordination/coordinationCardModel';

/** Manito del acceso «Ver detalle»: solo dibujo (sin botón propio); las ondas se animan por CSS. */
const TapHand=()=><svg width="24" height="28" viewBox="0 -5 24 29" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <g className="zipco-business-ask-w1" stroke="#5eead4"><path d="M6.2 1.2a3.4 3.4 0 0 1 3.6 0"/></g><g className="zipco-business-ask-w2" stroke="#5eead4"><path d="M4.2 -1.4a6.6 6.6 0 0 1 7.6 0"/></g>
  <path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M18 11v-1a2 2 0 0 0-4 0v1"/>
  <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
</svg>;

/** `authorized` es opcional: si el contenedor lo entrega, el recorrido añade el paso «Contacto». Sin él se muestran solo «Aceptado» y «Tu respuesta». */
export default function BusinessCoordinationWaitingCard({id,name,price,quantity,model,children,items=[],description,authorized}:Omit<CoordinationWaitingCardProps,'business'>&{description:string;authorized?:boolean}){
  const {mode,busy}=model,confirm=mode==='confirm',closed=mode==='declined',own=mode==='ownPending';
  const bodyRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!closed&&bodyRef.current)bodyRef.current.inert=busy;},[busy,closed]);
  const total=price===null?'Total por comprobar':`$${price.toLocaleString('es-CL')}`;
  // Solo «declined» («falta coordinar»): el aviso se entrega al detalle, que lo dibuja bajo el recorrido y sobre las acciones.
  const note=closed?<p className="zipco-business-pending-message"><em aria-hidden="true">{model.declinedBySelf?'Tú':'U'}</em><span>{model.declinedBySelf?'Avisaste al cliente que todavía falta coordinar.':'El cliente indicó que todavía falta coordinar.'}</span></p>:null;
  const productChip=items.length===1?items[0].quantity+'× '+items[0].name:items.length+' productos';
  return <article id={`order-${id}`} tabIndex={-1} className={'zipco-avw zipco-avw-query scroll-mb-36'+(closed?' zipco-business-pending':' zipco-business-ask')} data-expanded={model.expanded} data-attention={model.attention} data-mode={mode}>
    {closed&&<div className="zipco-business-pending-band"><span className="zipco-business-pending-pill"><i aria-hidden="true"><Hourglass size={13} strokeWidth={2.6}/></i><h4 className="zipco-business-pending-title">Coordinación pendiente</h4></span><button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded} aria-controls={`coordination-detail-${id}`} onClick={model.onToggle}>{model.expanded?'Ocultar':'Ver detalle'}<ChevronDown size={14} strokeWidth={2.4} aria-hidden="true"/></button></div>}
    {!closed&&<div className="zipco-business-ask-band"><span className="zipco-business-ask-pill"><i aria-hidden="true"><WhatsAppMark className="h-3.5 w-3.5"/></i><b>Coordinación</b></span><button type="button" className="zipco-business-ask-toggle zipco-avw-query-detail" aria-expanded={model.expanded} aria-controls={`coordination-detail-${id}`} onClick={model.onToggle}><span className="zipco-business-ask-hand"><TapHand/></span>{model.expanded?'Ocultar':'Ver detalle'}<ChevronDown size={14} strokeWidth={2.4} aria-hidden="true"/></button></div>}
    {closed?<div className="zipco-avw-query-head zipco-business-pending-head">
      <span className="zipco-avw-ring"><ProductPreviewControl fallback={<span className="zipco-avw-thumb"><ShoppingBag size={22}/></span>}/><i className="zipco-avw-quantity">{quantity}×</i></span>
      <div className="zipco-avw-query-copy"><small className="zipco-business-pending-label">CLIENTE</small><h4>{name}</h4><span className="zipco-business-pending-product">{productChip}</span></div>
      <div className="zipco-business-pending-total"><b className="zipco-business-pending-price" data-unknown={price===null}>{total}</b>{price!==null&&<small>TOTAL</small>}</div>
    </div>:<div className="zipco-avw-query-head zipco-business-ask-head">
      <span className="zipco-avw-ring"><ProductPreviewControl fallback={<span className="zipco-avw-thumb"><ShoppingBag size={22}/></span>}/><i className="zipco-avw-quantity">{quantity}×</i></span>
      <div className="zipco-avw-query-copy"><small className="zipco-business-ask-label">CLIENTE</small><strong className="zipco-business-ask-name">{name}</strong><span className="zipco-business-ask-product">{productChip}</span></div>
      <div className="zipco-business-ask-total"><b className="zipco-business-ask-price" data-unknown={price===null}>{total}</b>{price!==null&&<small>ACORDADO</small>}</div>
    </div>}
    {!closed&&<ol className="zipco-business-ask-track" aria-label="Recorrido del pedido">
      {own?<>
        <li className="done"><i aria-hidden="true"><Check size={12} strokeWidth={3.4}/></i><b>Tú</b></li>
        <li className="on" aria-current="step"><i aria-hidden="true"><Hourglass size={12} strokeWidth={2.6}/></i><b>Decide la otra parte</b></li>
      </>:<>
        <li className="done"><i aria-hidden="true"><Check size={12} strokeWidth={3.4}/></i><b>Aceptado</b></li>
        {authorized!==undefined&&<li className={authorized?'done':undefined}><i aria-hidden="true">{authorized?<Check size={12} strokeWidth={3.4}/>:<Hourglass size={11} strokeWidth={2.6}/>}</i><b>Contacto<span className="zipco-business-ask-sr">{authorized?' autorizado':' por autorizar'}</span></b></li>}
        <li className="on" aria-current="step"><i aria-hidden="true"><Hourglass size={12} strokeWidth={2.6}/></i><b>Tu respuesta</b></li>
      </>}
    </ol>}
    {(model.error||model.recovery)&&<div className="zipco-avw-query-recovery">{model.error&&<p role="alert">{model.error}</p>}{model.recovery}</div>}
    {!closed&&<div className="zipco-business-ask-row">
      <h4 className="zipco-business-ask-q">{busy?'Guardando respuesta…':confirm?'¿Devolver a Por coordinar?':own?'Esperando a la otra parte':<>¿Coordinación lista por <em>WhatsApp</em>?</>}</h4>
      {busy?<span className="zipco-business-ask-saving" role="status"><span className="zipco-business-ask-spin" aria-hidden="true"/>Guardando</span>:own?null:<div className="zipco-business-ask-btns">
        <button type="button" className="zipco-business-ask-yes zipco-avw-query-yes" data-amber={confirm} aria-label={`${confirm?'Devolver a Por coordinar':'Sí, ya coordinamos'}: ${name}, pedido ${id}`} disabled={!model.canYes||!!model.recovery} onClick={confirm?model.onReturn:model.onYes}><span className="ib"><Check size={22} strokeWidth={3}/></span><span className="lb">{confirm?'Devolver':'Sí'}</span></button>
        <button type="button" className="zipco-business-ask-no zipco-avw-query-no" data-cancel={confirm} aria-label={`${confirm?'Cancelar sin responder':'Falta coordinar'}: ${name}, pedido ${id}`} disabled={!!model.recovery||!confirm&&!model.canNo} onClick={confirm?model.onCancel:model.onNo}><span className="ib"><X size={21} strokeWidth={3}/></span><span className="lb">{confirm?'Cancelar':'Falta'}</span></button>
      </div>}
    </div>}
    <BusinessCoordinationDisclosure.Provider value={closed?{expanded:model.expanded,detailId:`coordination-detail-${id}`,secondaryAction:model.canYes&&!model.recovery?<button className="zipco-avw-query-reconfirm" type="button" disabled={busy} onClick={model.onYes}><CircleCheck size={15} strokeWidth={2.4} aria-hidden="true"/>Ya coordinamos</button>:null}:{expanded:model.expanded,detailId:`coordination-detail-${id}`,secondaryAction:null}}>
    <BusinessPendingNote.Provider value={note}>
    <DetailReveal expanded={closed||model.expanded}><div ref={bodyRef} id={closed?undefined:`coordination-detail-${id}`} className="zipco-avw-query-body" {...(busy?{inert:''}:{})}>
      {!closed&&<p className="zipco-avw-query-description">{description}</p>}
      {children}
    </div></DetailReveal>
    </BusinessPendingNote.Provider></BusinessCoordinationDisclosure.Provider>
  </article>;
}
