import {useRef,type ReactNode} from 'react';
import {Check,Clock3,ShoppingBag,X} from 'lucide-react';
import {DetailReveal,type CoordinationCardModel} from './AvailabilityWaitingCard';
import ProductPreviewControl from './ProductPreviewControl';
import WhatsAppMark from './WhatsAppMark';
import {scrollToRequestOrder} from './requestSummaryScroll';
import {CustomerCoordinationDisclosure} from './customerCoordinationDisclosure';

/** Client-only presentation (diseño aprobado: cabecera B). Every decision remains in WhatsappCoordinationPanel. */
export default function CustomerCoordinationCard({id,name,price,quantity,model,description,items,children}:{
  id:number;name:string;price:number|null;quantity:number;model:CoordinationCardModel;description:string;
  items:{name:string;quantity:number}[];children:ReactNode;
}){
  const {mode,busy}=model,confirm=mode==='confirm',closed=mode==='declined',own=mode==='ownPending';
  const card=useRef<HTMLElement>(null),revealRequested=useRef(false);
  const toggle=()=>{revealRequested.current=!model.expanded;model.onToggle();};
  const reveal=()=>{
    if(!revealRequested.current||!card.current)return;revealRequested.current=false;
    const scroller=card.current.closest<HTMLElement>('[data-requests-scroll]'),body=card.current.querySelector<HTMLElement>('.zipco-avw-query-body');
    if(scroller&&body&&body.getBoundingClientRect().bottom>scroller.getBoundingClientRect().bottom-12)
      scrollToRequestOrder(card.current,window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true);
  };
  const total=price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL');
  // La banda conserva la pregunta; solo cambia en «confirmar» y «falta coordinar». El estado transitorio va en la línea bajo el producto.
  const title=confirm?<>¿Devolver a <em className="zipco-avw-customer-am">Por coordinar</em>?</>:closed?'Coordinación pendiente':<>¿Coordinación lista por <em>WhatsApp</em>?</>;
  const status=busy?'Guardando respuesta…':confirm?'Solo Devolver guarda':'';
  const detail=<button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded}
    aria-controls={'coordination-detail-'+id} onClick={toggle}><svg className="zipco-avw-detail-hand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>{model.expanded?'Ocultar':'Detalle'}</button>;
  return <article ref={card} id={'order-'+id} tabIndex={-1} className="zipco-avw zipco-avw-query zipco-avw-customer scroll-mb-36" data-expanded={model.expanded} data-mode={mode} data-busy={busy} aria-busy={busy} data-attention={model.attention}>
    {!own&&<div className="zipco-avw-customer-band"><small>COORDINACIÓN</small><div className="zipco-avw-customer-bandrow"><h4>{title}</h4>{detail}</div></div>}
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
        {!own&&status&&<small role={busy?'status':undefined} className="zipco-avw-customer-hint" data-tone={closed?'amber':busy?'violet':'amber'}>{status}</small>}
        {own&&<><b className="zipco-avw-customer-state">En curso · esperando al negocio</b>{detail}</>}
      </div>
      {own?<div className="zipco-avw-customer-total"><b>{total}</b><small>ACORDADO</small></div>:!closed&&<div className="zipco-avw-query-actions">
        {busy?<span className="zipco-avw-query-saving" role="status"><span className="zipco-flow-spinner">◌</span><small>Guardando</small></span>:<>
          <button type="button" className="zipco-avw-query-yes" data-amber={confirm} disabled={!model.canYes||!!model.recovery}
            aria-label={(confirm?'Devolver a Por coordinar':'Sí, ya coordinamos')+': '+name+', pedido '+id} onClick={confirm?model.onReturn:model.onYes}><span><Check size={24} strokeWidth={3}/></span><small>{confirm?'Devolver':'Sí'}</small></button>
          <button type="button" className="zipco-avw-query-no" data-cancel={confirm} disabled={!!model.recovery||!confirm&&!model.canNo}
            aria-label={(confirm?'Cancelar sin responder':'Falta coordinar')+': '+name+', pedido '+id} onClick={confirm?model.onCancel:model.onNo}><span><X size={24} strokeWidth={3}/></span><small>{confirm?'Cancelar':'Falta'}</small></button>
        </>}
      </div>}
    </div>
    {own&&<p className="zipco-avw-customer-pending">{description}</p>}
    {(model.error||model.recovery)&&<div className="zipco-avw-query-recovery">{model.error&&<p role="alert">{model.error}</p>}{model.recovery}</div>}
    <CustomerCoordinationDisclosure.Provider value={closed?{expanded:model.expanded,detailId:'coordination-detail-'+id,onOpened:reveal,
      secondaryAction:model.canYes&&!model.recovery?<button type="button" className="zipco-avw-query-reconfirm" disabled={busy} onClick={model.onYes}>Ya coordinamos</button>:null}:null}>
    <DetailReveal expanded={closed||model.expanded} onOpened={closed?undefined:reveal}><div id={closed?undefined:'coordination-detail-'+id} className="zipco-avw-query-body" {...(busy?{inert:''}:{})}>
      {closed&&<p className="zipco-customer-declined-message">{model.declinedBySelf?'Avisaste al negocio que todavía falta coordinar.':'El negocio indicó que todavía falta coordinar.'}</p>}
      {confirm&&<p className="zipco-avw-query-description">{description}</p>}
      {children}
    </div></DetailReveal></CustomerCoordinationDisclosure.Provider>
  </article>;
}
