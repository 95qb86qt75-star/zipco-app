import * as React from 'react';

import { Check, ShoppingBag } from 'lucide-react';
import { DetailReveal } from "../../shared/layout/DetailReveal";

import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";


import { CustomerCoordinationDisclosure } from "../whatsapp/customerCoordinationDisclosure";
import StatusRail from "../../../shared/feedback/StatusRail";
import ReadyPanel from "../../../shared/feedback/ReadyPanel";

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */
/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */
/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */
import type { CustomerCoordinationCardModel } from "../whatsapp/application/useCustomerCoordinationCardController";
/** One canonical WhatsApp progress composition. */
export default function CustomerWhatsappProgressCard({model:viewModel}:{model:Pick<CustomerCoordinationCardModel,"OWN_RAIL"|"OWN_SR_WAITING"|"OWN_STATE"|"busy"|"card"|"chevron"|"children"|"description"|"finishLeave"|"id"|"isReady"|"itemsText"|"leaving"|"mode"|"model"|"name"|"preparing"|"product"|"quantity"|"railStage"|"readyModel"|"reveal"|"toggle"|"total">}){const {OWN_RAIL,OWN_SR_WAITING,OWN_STATE,busy,card,chevron,children,description,finishLeave,id,isReady,itemsText,leaving,mode,model,name,preparing,product,quantity,railStage,readyModel,reveal,toggle,total}=viewModel;return (<article ref={card} id={'order-' + id} tabIndex={-1} className="zipco-avw zipco-avw-query zipco-avw-customer scroll-mb-36" data-expanded={model.expanded} data-mode={mode} data-busy={busy} aria-busy={busy} data-attention={model.attention} data-ready={isReady} data-leaving={leaving} onAnimationEnd={e => {
  if (leaving && e.target === e.currentTarget) finishLeave();
}}>
    {false}
    <div className="zipco-avw-query-head">
      <span className="zipco-avw-ring">
        <ProductPreviewControl thumbnailLoading="eager" fallback={<span className="zipco-avw-thumb"><ShoppingBag size={26} /></span>} />
        <i className="zipco-avw-quantity">{quantity}×</i>
        <span className="zipco-avw-query-orbit" aria-hidden="true"><span className="zipco-avw-query-badge">{<Check size={16} />}</span></span>
      </span>
      <div className="zipco-avw-customer-identity" {...{
      onClick: toggle
    }}>
        <h3>{name}</h3>
        {false}
        {false}
        {false}
        {<span className="zipco-own-st">{itemsText} · <b>{!readyModel ? preparing ? 'preparando' : OWN_STATE.waiting : railStage === 'ready' ? OWN_STATE.ready : OWN_STATE.received}</b></span>}
        {!readyModel && <span className="sr-only">{preparing ? 'El negocio está preparando tu pedido.' : OWN_SR_WAITING}</span>}
      </div>
      {<><div className="zipco-avw-customer-total"><b>{total}</b><small>ACORDADO</small></div>{chevron}</>}
    </div>
    {<StatusRail theme="dark" stage={railStage} copy={preparing ? {
    ...OWN_RAIL,
    business: {
      ...OWN_RAIL.business,
      waiting: 'Preparando'
    }
  } : OWN_RAIL} />}
    {<ReadyPanel model={readyModel} tone="dark" kind="whatsapp" />}
    {(model.error || model.recovery) && <div className="zipco-avw-query-recovery">{model.error && <p role="alert">{model.error}</p>}{model.recovery}</div>}
    <CustomerCoordinationDisclosure.Provider value={null}>
    <DetailReveal expanded={false || model.expanded} onOpened={reveal}><div id={'coordination-detail-' + id} className="zipco-avw-query-body" {...busy ? {
        inert: ''
      } : {}}>
      {<>{product}<p className="zipco-avw-customer-pending">{description}</p></>}
      {false}
      {false}
      {children}
    </div></DetailReveal></CustomerCoordinationDisclosure.Provider>
  </article>);}
