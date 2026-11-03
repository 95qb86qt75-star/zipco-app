import * as React from 'react';

import { Check, ChevronDown, Hourglass, ShoppingBag } from 'lucide-react';
import { DetailReveal } from "../../shared/layout/DetailReveal";

import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";


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
/** Elementos propios que NO deben plegar la tarjeta al tocar la cabecera (el botón «Ver detalle» sí). */
const OWN_CLICK='button,a,input,textarea,select,summary,[role="button"],[role="tab"],[role="dialog"]';
/** Manito de «Ver detalle» (solo presentación). */
const HAND=<svg width="24" height="28" viewBox="0 -5 24 29" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g className="zipco-wa-w-w1" stroke="#f59e0b"><path d="M6.2 1.2a3.4 3.4 0 0 1 3.6 0"/></g><g className="zipco-wa-w-w2" stroke="#f59e0b"><path d="M4.2 -1.4a6.6 6.6 0 0 1 7.6 0"/></g><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M18 11v-1a2 2 0 0 0-4 0v1"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>;
/** One canonical WhatsApp progress composition.
 *  Espera de respuesta del negocio (sin readyModel y preparing===false): composición propia «zipco-wa-w».
 *  Preparando, listo, recibido y finalización conservan exactamente la composición anterior. */
export default function CustomerWhatsappProgressCard({model:viewModel}:{model:Pick<CustomerCoordinationCardModel,"OWN_RAIL"|"OWN_SR_WAITING"|"OWN_STATE"|"busy"|"card"|"chevron"|"children"|"description"|"finishLeave"|"id"|"isReady"|"itemsText"|"leaving"|"mode"|"model"|"name"|"preparing"|"product"|"quantity"|"railStage"|"readyModel"|"reveal"|"toggle"|"total">}){const {OWN_RAIL,OWN_SR_WAITING,OWN_STATE,busy,card,chevron,children,description,finishLeave,id,isReady,itemsText,leaving,mode,model,name,preparing,product,quantity,railStage,readyModel,reveal,toggle,total}=viewModel;
const waiting=!readyModel&&!preparing;
/** Cabecera de la espera: tocar cualquier zona que no sea un control propio ejecuta el MISMO toggle de siempre. */
const onHeader=(e:React.MouseEvent<HTMLElement>)=>{
  const own=(e.target as HTMLElement).closest(OWN_CLICK);
  if(own&&!own.classList.contains('zipco-wa-w-toggle'))return;
  if(typeof window!=='undefined'&&window.getSelection?.()?.toString())return;
  toggle();
};
const totalText=String(total);
return (<article ref={card} id={'order-' + id} tabIndex={-1} className={"zipco-avw zipco-avw-query zipco-avw-customer scroll-mb-36"+(waiting?" zipco-wa-w":"")} data-expanded={model.expanded} data-mode={mode} data-busy={busy} aria-busy={busy} data-attention={model.attention} data-ready={isReady} data-leaving={leaving} onClick={waiting?event=>{if((event.target as Element).closest('.zipco-own-rail'))onHeader(event);}:undefined} onAnimationEnd={e => {
  if (leaving && e.target === e.currentTarget) finishLeave();
}}>
    {waiting?<>
    <div className="zipco-wa-w-hd" onClick={onHeader}>
      <div className="zipco-wa-w-mod"><span className="zipco-wa-w-mi" aria-hidden="true"><WhatsAppMark className="h-3 w-3"/></span><b>COORDINACIÓN POR WHATSAPP</b></div>
      <div className="zipco-wa-w-tp">
        <span className="zipco-wa-w-pill"><i aria-hidden="true"><Hourglass size={13} strokeWidth={2.8}/></i><b>ESPERANDO AL NEGOCIO</b></span>
        <button type="button" className="zipco-wa-w-toggle" aria-expanded={model.expanded} aria-controls={'coordination-detail-' + id}><span className="zipco-wa-w-fg">{HAND}</span><span>{model.expanded?'Ocultar':'Ver detalle'}</span><span className="zipco-wa-w-chv" aria-hidden="true"><ChevronDown size={14} strokeWidth={2.4}/></span></button>
      </div>
      <div className="zipco-wa-w-h">
        <span className="zipco-avw-ring">
          <ProductPreviewControl thumbnailLoading="eager" fallback={<span className="zipco-avw-thumb"><ShoppingBag size={26} /></span>} />
          <i className="zipco-avw-quantity">{quantity}×</i>
        </span>
        <div className="zipco-wa-w-id">
          <small>NEGOCIO</small>
          <h3>{name}</h3>
          <span className="zipco-wa-w-pc">{itemsText}</span>
          <span className="sr-only">{OWN_SR_WAITING}</span>
        </div>
        <div className="zipco-wa-w-total"><b data-long={totalText.length>9}>{total}</b><small>ACORDADO</small></div>
      </div>

    </div>
    </>:<div className="zipco-avw-query-head">
      <span className="zipco-avw-ring">
        <ProductPreviewControl thumbnailLoading="eager" fallback={<span className="zipco-avw-thumb"><ShoppingBag size={26} /></span>} />
        <i className="zipco-avw-quantity">{quantity}×</i>
        <span className="zipco-avw-query-orbit" aria-hidden="true"><span className="zipco-avw-query-badge">{<Check size={16} />}</span></span>
      </span>
      <div className="zipco-avw-customer-identity" {...{
      onClick: toggle
    }}>
        <h3>{name}</h3>
        {<span className="zipco-own-st">{itemsText} · <b>{!readyModel ? preparing ? 'preparando' : OWN_STATE.waiting : railStage === 'ready' ? OWN_STATE.ready : OWN_STATE.received}</b></span>}
        {!readyModel && <span className="sr-only">{preparing ? 'El negocio está preparando tu pedido.' : OWN_SR_WAITING}</span>}
      </div>
      {<><div className="zipco-avw-customer-total"><b>{total}</b><small>ACORDADO</small></div>{chevron}</>}
    </div>}
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
    <DetailReveal key="whatsapp-progress-detail" expanded={model.expanded} onOpened={reveal}><div id={'coordination-detail-' + id} className={"zipco-avw-query-body"+(waiting?" zipco-wa-w-body":"")} ref={element=>{if(element)element.inert=busy;}}>
      {waiting?<>
        <div className="zipco-wa-w-state"><span className="zipco-wa-w-ico" data-kind="state" aria-hidden="true"><Hourglass size={15} strokeWidth={2.4}/></span><div className="zipco-wa-w-bd"><p className="zipco-wa-w-ey">ESTADO</p><p className="zipco-wa-w-msg">{description}</p></div></div>
      </>:<>
      {<>{product}<p className="zipco-avw-customer-pending">{description}</p></>}
      </>}
      <React.Fragment key="receipt-controls">{children}</React.Fragment>
    </div></DetailReveal></CustomerCoordinationDisclosure.Provider>
  </article>);}
