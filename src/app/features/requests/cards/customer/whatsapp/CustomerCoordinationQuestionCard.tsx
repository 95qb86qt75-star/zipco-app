import * as React from 'react';

import { Check, Clock3, ShoppingBag, X } from 'lucide-react';
import { DetailReveal } from "../../shared/layout/DetailReveal";

import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";

import { CustomerCoordinationDisclosure } from "./customerCoordinationDisclosure";



/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */
/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */
import type { CustomerCoordinationCardModel } from "./application/useCustomerCoordinationCardController";
/** One canonical coordination-question composition. */
export default function CustomerCoordinationQuestionCard({model:viewModel}:{model:Pick<CustomerCoordinationCardModel,"busy"|"card"|"children"|"closed"|"confirm"|"description"|"detail"|"finishLeave"|"id"|"isReady"|"leaving"|"mode"|"model"|"name"|"product"|"quantity"|"reveal"|"status"|"title"|"total">}){const {busy,card,children,closed,confirm,description,detail,finishLeave,id,isReady,leaving,mode,model,name,product,quantity,reveal,status,title,total}=viewModel;return (<article ref={card} id={'order-' + id} tabIndex={-1} className="zipco-avw zipco-avw-query zipco-avw-customer scroll-mb-36" data-expanded={model.expanded} data-mode={mode} data-busy={busy} aria-busy={busy} data-attention={model.attention} data-ready={isReady} data-leaving={leaving} onAnimationEnd={e => {
  if (leaving && e.target === e.currentTarget) finishLeave();
}}>
    {<div className="zipco-avw-customer-band"><small>COORDINACIÓN</small><div className="zipco-avw-customer-bandrow"><h4>{title}</h4>{detail}</div></div>}
    <div className="zipco-avw-query-head">
      <span className="zipco-avw-ring">
        <ProductPreviewControl thumbnailLoading="eager" fallback={<span className="zipco-avw-thumb"><ShoppingBag size={26} /></span>} />
        <i className="zipco-avw-quantity">{quantity}×</i>
        <span className="zipco-avw-query-orbit" aria-hidden="true"><span className="zipco-avw-query-badge">{closed ? <Clock3 size={16} /> : <WhatsAppMark className="h-4 w-4" />}</span></span>
      </span>
      <div className="zipco-avw-customer-identity" {...{}}>
        <h3>{name}</h3>
        {product}
        {<b className="zipco-avw-customer-price">{total}</b>}
        {status && <small role={busy ? 'status' : undefined} className="zipco-avw-customer-hint" data-tone={closed ? 'amber' : busy ? 'violet' : 'amber'}>{status}</small>}
        {false}
        {false}
      </div>
      {!closed && <div className="zipco-avw-query-actions">
        {busy ? <span className="zipco-avw-query-saving" role="status"><span className="zipco-flow-spinner">◌</span><small>Guardando</small></span> : <>
          <button type="button" className="zipco-avw-query-yes" data-amber={confirm} disabled={!model.canYes || !!model.recovery} aria-label={(confirm ? 'Devolver a Por coordinar' : 'Sí, ya coordinamos') + ': ' + name + ', pedido ' + id} onClick={confirm ? model.onReturn : model.onYes}><span><Check size={24} strokeWidth={3} /></span><small>{confirm ? 'Devolver' : 'Sí'}</small></button>
          <button type="button" className="zipco-avw-query-no" data-cancel={confirm} disabled={!!model.recovery || !confirm && !model.canNo} aria-label={(confirm ? 'Cancelar sin responder' : 'Falta coordinar') + ': ' + name + ', pedido ' + id} onClick={confirm ? model.onCancel : model.onNo}><span><X size={24} strokeWidth={3} /></span><small>{confirm ? 'Cancelar' : 'Falta'}</small></button>
        </>}
      </div>}
    </div>
    {false}
    {false}
    {(model.error || model.recovery) && <div className="zipco-avw-query-recovery">{model.error && <p role="alert">{model.error}</p>}{model.recovery}</div>}
    <CustomerCoordinationDisclosure.Provider value={closed ? {
    expanded: model.expanded,
    detailId: 'coordination-detail-' + id,
    onOpened: reveal,
    secondaryAction: model.canYes && !model.recovery ? <button type="button" className="zipco-avw-query-reconfirm" disabled={busy} onClick={model.onYes}>Ya coordinamos</button> : null
  } : null}>
    <DetailReveal expanded={closed || model.expanded} onOpened={closed ? undefined : reveal}><div id={closed ? undefined : 'coordination-detail-' + id} className="zipco-avw-query-body" {...busy ? {
        inert: ''
      } : {}}>
      {false}
      {closed && <p className="zipco-customer-declined-message">{model.declinedBySelf ? 'Avisaste al negocio que todavía falta coordinar.' : 'El negocio indicó que todavía falta coordinar.'}</p>}
      {confirm && <p className="zipco-avw-query-description">{description}</p>}
      {children}
    </div></DetailReveal></CustomerCoordinationDisclosure.Provider>
  </article>);}
