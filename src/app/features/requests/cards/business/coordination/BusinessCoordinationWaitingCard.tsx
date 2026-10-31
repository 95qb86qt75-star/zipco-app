import * as React from 'react';

import { Check, Clock3, ShoppingBag, X } from 'lucide-react';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";

import { BusinessCoordinationDisclosure } from "./businessCoordinationDisclosure";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import "../../shared/layout/availability-card-styles.css";
import "../../shared/layout/coordination-card-styles.css";
import {DetailReveal} from '../../shared/layout/DetailReveal';
import type {CoordinationWaitingCardProps} from '../../shared/coordination/coordinationCardModel';
export default function BusinessCoordinationWaitingCard({id,name,price,quantity,model,children,items=[],description}:Omit<CoordinationWaitingCardProps,'business'>&{description:string}){
  const {mode,busy}=model,confirm=mode==='confirm',closed=mode==='declined',own=mode==='ownPending';
  return <article id={`order-${id}`} tabIndex={-1} className={'zipco-avw zipco-avw-query scroll-mb-36'+(closed?' zipco-business-pending':'')} data-expanded={model.expanded} data-attention={model.attention} data-mode={mode}>
    {closed&&<div className="zipco-business-pending-band"><div><small>COORDINACIÓN</small><h4>Coordinación pendiente</h4></div><button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded} aria-controls={`coordination-detail-${id}`} onClick={model.onToggle}>{model.expanded?'Ocultar':'Ver detalle'}</button></div>}
    <div className="zipco-avw-query-head">
      <span className="zipco-avw-ring"><ProductPreviewControl fallback={<span className="zipco-avw-thumb"><ShoppingBag size={24}/></span>}/><i className="zipco-avw-quantity">{quantity}×</i><span className="zipco-avw-query-orbit" aria-hidden="true"><span className="zipco-avw-query-badge">{closed?<Clock3 size={15}/>:<WhatsAppMark className="h-4 w-4"/>}</span></span></span>
      <div className="zipco-avw-query-copy">{!closed&&<div className="zipco-avw-query-top"><small>COORDINACIÓN</small><button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded} aria-controls={`coordination-detail-${id}`} onClick={model.onToggle}>{model.expanded?'Ocultar':'Detalle'} <span aria-hidden="true">☝</span></button></div>}
        <h4>{closed?name:busy?'Guardando respuesta…':confirm?'¿Devolver a Por coordinar?':own?'Esperando a la otra parte':<>¿Coordinación lista por <em>WhatsApp</em>?</>}</h4>
        {closed?<><span className="zipco-business-pending-product">{items.length===1?items[0].quantity+'× '+items[0].name:items.length+' productos'}</span><b className="zipco-business-pending-price">{price===null?'Total por comprobar':`$${price.toLocaleString('es-CL')}`}</b></>:<p>{name} · {price===null?'Total por comprobar':`$${price.toLocaleString('es-CL')}`}</p>}
      </div>
      {!closed&&<div className="zipco-avw-query-actions">
        {busy?<span className="zipco-avw-query-saving" role="status"><span className="zipco-flow-spinner">◌</span><small>Guardando</small></span>:own?null:<>
          <button type="button" className="zipco-avw-query-yes" data-amber={confirm} aria-label={`${confirm?'Devolver a Por coordinar':'Sí, ya coordinamos'}: ${name}, pedido ${id}`} disabled={!model.canYes||!!model.recovery} onClick={confirm?model.onReturn:model.onYes}><span><Check size={24}/></span><small>{confirm?'Devolver':'Sí'}</small></button>
          <button type="button" className="zipco-avw-query-no" data-cancel={confirm} aria-label={`${confirm?'Cancelar sin responder':'Falta coordinar'}: ${name}, pedido ${id}`} disabled={!!model.recovery||!confirm&&!model.canNo} onClick={confirm?model.onCancel:model.onNo}><span><X size={23} strokeWidth={3}/></span><small>{confirm?'Cancelar':'Falta'}</small></button>
        </>}
      </div>}
    </div>
    {(model.error||model.recovery)&&<div className="zipco-avw-query-recovery">{model.error&&<p role="alert">{model.error}</p>}{model.recovery}</div>}
    <BusinessCoordinationDisclosure.Provider value={closed?{expanded:model.expanded,detailId:`coordination-detail-${id}`,secondaryAction:model.canYes&&!model.recovery?<button className="zipco-avw-query-reconfirm" type="button" disabled={busy} onClick={model.onYes}>Ya coordinamos</button>:null}:null}>
    <DetailReveal expanded={closed||model.expanded}><div id={closed?undefined:`coordination-detail-${id}`} className="zipco-avw-query-body" {...(busy?{inert:''}:{})}>
      {closed?<p className="zipco-business-pending-message">{model.declinedBySelf?'Avisaste al cliente que todavía falta coordinar.':'El cliente indicó que todavía falta coordinar.'}</p>:<><p className="zipco-avw-query-description">{description}</p><p className="zipco-avw-query-legal">ZIPCO no recibe ni verifica pagos.</p></>}
      {children}
    </div></DetailReveal></BusinessCoordinationDisclosure.Provider>
  </article>;
}
