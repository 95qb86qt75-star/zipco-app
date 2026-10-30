import type {ReactNode} from 'react';
import {Check,Clock3,ShoppingBag,X} from 'lucide-react';
import {DetailReveal,type CoordinationCardModel} from './AvailabilityWaitingCard';
import ProductPreviewControl from './ProductPreviewControl';
import WhatsAppMark from './WhatsAppMark';

/** Client-only presentation; every decision remains in WhatsappCoordinationPanel. */
export default function CustomerCoordinationCard({id,name,price,quantity,model,description,items,children}:{
  id:number;name:string;price:number|null;quantity:number;model:CoordinationCardModel;description:string;
  items:{name:string;quantity:number}[];children:ReactNode;
}){
  const {mode,busy}=model,confirm=mode==='confirm',closed=mode==='declined',own=mode==='ownPending';
  const total=price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL');
  const title=busy?'Guardando respuesta…':confirm?'¿Devolver a Por coordinar?':closed?'Falta coordinar':<>¿Coordinación lista por <em>WhatsApp</em>?</>;
  const detail=<button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded}
    aria-controls={'coordination-detail-'+id} onClick={model.onToggle}><span aria-hidden="true">☝</span> {model.expanded?'Ocultar':'Detalle'}</button>;
  return <article id={'order-'+id} tabIndex={-1} className="zipco-avw zipco-avw-query zipco-avw-customer scroll-mb-36" data-expanded={model.expanded} data-mode={mode} data-attention={model.attention}>
    {!own&&<div className="zipco-avw-customer-band"><div><small>COORDINACIÓN</small><h4>{title}</h4></div>{detail}</div>}
    <div className="zipco-avw-query-head">
      <span className="zipco-avw-ring">
        <ProductPreviewControl fallback={<span className="zipco-avw-thumb"><ShoppingBag size={26}/></span>}/>
        <i className="zipco-avw-quantity">{quantity}×</i>
        <span className="zipco-avw-query-orbit" aria-hidden="true"><span className="zipco-avw-query-badge">{own?<Check size={16}/>:closed?<Clock3 size={16}/>:<WhatsAppMark className="h-4 w-4"/>}</span></span>
      </span>
      <div className="zipco-avw-customer-identity">
        <h3>{name}</h3>
        <span className="zipco-avw-customer-product"><ShoppingBag size={12}/>{items.length===1?items[0].quantity+'× '+items[0].name:items.length?items.length+' productos':'Producto del pedido'}</span>
        {!own&&<b className="zipco-avw-customer-price">{total}</b>}
        {confirm&&<small className="zipco-avw-customer-hint">Solo Devolver guarda</small>}
        {own&&<><b className="zipco-avw-customer-state">En curso · esperando al negocio</b>{detail}</>}
      </div>
      {own?<div className="zipco-avw-customer-total"><b>{total}</b><small>ACORDADO</small></div>:<div className="zipco-avw-query-actions">
        {busy?<span className="zipco-avw-query-saving" role="status"><span className="zipco-flow-spinner">◌</span><small>Guardando</small></span>:closed?<button type="button" className="zipco-avw-query-resume" onClick={model.onToggle}>Ya coordinamos</button>:<>
          <button type="button" className="zipco-avw-query-yes" data-amber={confirm} disabled={!model.canYes||!!model.recovery}
            aria-label={(confirm?'Devolver a Por coordinar':'Sí, ya coordinamos')+': '+name+', pedido '+id} onClick={confirm?model.onReturn:model.onYes}><span><Check size={24} strokeWidth={3}/></span><small>{confirm?'Devolver':'Sí'}</small></button>
          <button type="button" className="zipco-avw-query-no" data-cancel={confirm} disabled={!!model.recovery||!confirm&&!model.canNo}
            aria-label={(confirm?'Cancelar sin responder':'Falta coordinar')+': '+name+', pedido '+id} onClick={confirm?model.onCancel:model.onNo}><span><X size={24} strokeWidth={3}/></span><small>{confirm?'Cancelar':'Falta'}</small></button>
        </>}
      </div>}
    </div>
    {own&&<p className="zipco-avw-customer-pending">{description}</p>}
    {(model.error||model.recovery)&&<div className="zipco-avw-query-recovery">{model.error&&<p role="alert">{model.error}</p>}{model.recovery}</div>}
    <DetailReveal expanded={model.expanded}><div id={'coordination-detail-'+id} className="zipco-avw-query-body">
      {(closed||confirm)&&<p className="zipco-avw-query-description">{description}</p>}
      {closed&&model.canYes&&!model.recovery&&<button type="button" className="zipco-avw-query-reconfirm" disabled={busy} onClick={model.onYes}>Ya coordinamos: confirmar</button>}
      {children}
    </div></DetailReveal>
  </article>;
}
