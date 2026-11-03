import * as React from 'react';

import { Check, ChevronDown, CircleCheck, Clock3, Hourglass, ShoppingBag, X } from 'lucide-react';
import { DetailReveal } from "../../shared/layout/DetailReveal";

import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";

import { CustomerCoordinationDisclosure } from "./customerCoordinationDisclosure";
import { CustomerDeclinedNote } from "./CustomerCoordinationDetail";



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
/** Hand + label of the «Detalle» control. The control itself (onClick with its scroll-on-open, aria-expanded, aria-controls) is the one built by the controller; only its look changes. */
const DeclinedHand=()=><svg className="zipco-customer-declined-hand" width="24" height="28" viewBox="0 -5 24 29" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <g className="zipco-customer-declined-w1" stroke="#fcd34d"><path d="M6.2 1.2a3.4 3.4 0 0 1 3.6 0"/></g><g className="zipco-customer-declined-w2" stroke="#fcd34d"><path d="M4.2 -1.4a6.6 6.6 0 0 1 7.6 0"/></g>
  <path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M18 11v-1a2 2 0 0 0-4 0v1"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
</svg>;
export default function CustomerCoordinationQuestionCard({model:viewModel}:{model:Pick<CustomerCoordinationCardModel,"busy"|"card"|"children"|"closed"|"confirm"|"description"|"detail"|"finishLeave"|"id"|"isReady"|"leaving"|"mode"|"model"|"name"|"product"|"quantity"|"reveal"|"status"|"title"|"total">}){const {busy,card,children,closed,confirm,description,detail,finishLeave,id,isReady,leaving,mode,model,name,product,quantity,reveal,status,title,total}=viewModel;
  // Saved negative («falta coordinar»): one single composition (band + header + route + actions + one detail card). The other modes keep the original markup below.
  if(closed){
    const unknownTotal=!total.startsWith('$');
    const toggle=React.cloneElement(detail as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>,{className:'zipco-customer-declined-toggle zipco-avw-query-detail',children:<><span className="zipco-customer-declined-handwrap"><DeclinedHand/></span>{model.expanded?'Ocultar':'Ver detalle'}<ChevronDown size={14} strokeWidth={2.4} aria-hidden="true"/></>});
    const note=<p className="zipco-customer-declined-message"><em aria-hidden="true">{model.declinedBySelf?'Tú':'N'}</em><span>{model.declinedBySelf?'Avisaste al negocio que todavía falta coordinar.':'El negocio indicó que todavía falta coordinar.'}</span></p>;
    return (<article ref={card} id={'order-' + id} tabIndex={-1} className="zipco-avw zipco-avw-query zipco-avw-customer zipco-customer-declined scroll-mb-36" data-expanded={model.expanded} data-mode={mode} data-busy={busy} aria-busy={busy} data-attention={model.attention} data-ready={isReady} data-leaving={leaving} onAnimationEnd={e => {
      if (leaving && e.target === e.currentTarget) finishLeave();
    }}>
      <div className="zipco-customer-declined-band"><span className="zipco-customer-declined-pill"><i aria-hidden="true"><Hourglass size={13} strokeWidth={2.6}/></i><h4>{title}</h4></span>{toggle}</div>
      <div className="zipco-customer-declined-head">
        <span className="zipco-avw-ring">
          <ProductPreviewControl thumbnailLoading="eager" fallback={<span className="zipco-avw-thumb"><ShoppingBag size={24} /></span>} />
          <i className="zipco-avw-quantity">{quantity}×</i>
        </span>
        <div className="zipco-customer-declined-id"><small>NEGOCIO</small><h3>{name}</h3>{product}</div>
        <div className="zipco-customer-declined-total"><b data-unknown={unknownTotal}>{total}</b>{!unknownTotal&&<small>TOTAL</small>}</div>
      </div>
      {(model.error || model.recovery) && <div className="zipco-avw-query-recovery">{model.error && <p role="alert">{model.error}</p>}{model.recovery}</div>}
      <CustomerCoordinationDisclosure.Provider key="customer-coordination-layout" value={{
        expanded: model.expanded,
        detailId: 'coordination-detail-' + id,
        onOpened: reveal,
        secondaryAction: model.canYes && !model.recovery ? <button type="button" className="zipco-avw-query-reconfirm" disabled={busy} onClick={model.onYes}><CircleCheck size={15} strokeWidth={2.4} aria-hidden="true" />Ya coordinamos</button> : null
      }}>
      <CustomerDeclinedNote.Provider value={note}>
      <DetailReveal expanded={true}><div ref={el=>{if(el)el.inert=busy;}} className="zipco-avw-query-body zipco-customer-declined-body">
        {children}
      </div></DetailReveal>
      </CustomerDeclinedNote.Provider></CustomerCoordinationDisclosure.Provider>
    </article>);
  }
  return (<article ref={card} id={'order-' + id} tabIndex={-1} className="zipco-avw zipco-avw-query zipco-avw-customer scroll-mb-36" data-expanded={model.expanded} data-mode={mode} data-busy={busy} aria-busy={busy} data-attention={model.attention} data-ready={isReady} data-leaving={leaving} onAnimationEnd={e => {
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
    <CustomerCoordinationDisclosure.Provider key="customer-coordination-layout" value={closed ? {
    expanded: model.expanded,
    detailId: 'coordination-detail-' + id,
    onOpened: reveal,
    secondaryAction: model.canYes && !model.recovery ? <button type="button" className="zipco-avw-query-reconfirm" disabled={busy} onClick={model.onYes}>Ya coordinamos</button> : null
  } : null}>
    <CustomerDeclinedNote.Provider value={null}>
    <DetailReveal expanded={closed || model.expanded} onOpened={closed ? undefined : reveal}><div id={closed ? undefined : 'coordination-detail-' + id} className="zipco-avw-query-body" {...busy ? {
        inert: ''
      } : {}}>
      {false}
      {closed && <p className="zipco-customer-declined-message">{model.declinedBySelf ? 'Avisaste al negocio que todavía falta coordinar.' : 'El negocio indicó que todavía falta coordinar.'}</p>}
      {confirm && <p className="zipco-avw-query-description">{description}</p>}
      {children}
    </div></DetailReveal></CustomerDeclinedNote.Provider></CustomerCoordinationDisclosure.Provider>
  </article>);}
