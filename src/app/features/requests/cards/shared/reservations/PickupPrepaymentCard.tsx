import * as React from 'react';
import {Calendar,Check,ChevronDown,ChevronRight,MapPin,Package,User} from 'lucide-react';
import type {BusinessRequest,MyOrder} from '../../../domain/types';
import type {AgreementReadDto} from '../../../domain/agreement';
import {pickupPrepaymentFor,PREPAYMENT_WAITING_MESSAGE} from '../../../domain/pickupPrepayment';
import type {PickupPrepayment} from '../../../domain/pickupPrepayment';
import {ProgressCardHeader} from '../layout/ProgressCardShell';
import AvailabilityPostActions from '../availability/AvailabilityPostActions';
import ReservationPanel from '../../../shared/reservations/ReservationPanel';
import {ConditionsSheet} from '../../../shared/conditions/CoordinationSheets';
import AgreementSheet from '../../../shared/conditions/AgreementSheet';
import ProductPreviewControl from '../../../shared/product-preview/ProductPreviewControl';
import WhatsAppMark from '../../../shared/icons/WhatsAppMark';
import {ImageWithFallback} from '../../../../../components/figma/ImageWithFallback';

const money=(value:number)=>`$${value.toLocaleString('es-CL')}`;
const RING=213.6;

/** Cuenta animada del monto (≈0,8 s, una sola vez). Con «reducir movimiento» muestra el valor final. */
function Count({value}:{value:number}){
  const [shown,setShown]=React.useState(value);
  React.useEffect(()=>{
    if(typeof window==='undefined'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setShown(value);return;}
    let frame=0;const start=performance.now();
    const step=(now:number)=>{const t=Math.min(1,(now-start)/800);setShown(Math.round(value*(1-Math.pow(1-t,3))));if(t<1)frame=requestAnimationFrame(step);};
    setShown(0);frame=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(frame);
  },[value]);
  return <>{shown.toLocaleString('es-CL')}</>;
}

type Panel='detail'|'options'|null;

/** Variante autorizada: negocio + proyección válida + AWAITING_PAYMENT_AND_HOLD. Los permisos y la acción real los entrega
 *  ReservationPanel (render); aquí solo se compone la presentación. */
function BusinessPrepaymentView({order,accepted,stage,name,image,isUnread,refresh,expanded,onToggle}:{
  order:BusinessRequest|MyOrder;accepted:AgreementReadDto;stage:PickupPrepayment;name:string;image?:string;isUnread:boolean;refresh:()=>void;expanded:boolean;onToggle:()=>void;
}){
  const [panel,setPanel]=React.useState<Panel>(null);
  const [more,setMore]=React.useState(false);
  const [sheet,setSheet]=React.useState<'agreement'|null>(null);
  const cardRef=React.useRef<HTMLElement>(null),footRef=React.useRef<HTMLDivElement>(null),accRef=React.useRef<HTMLDivElement>(null),aciRef=React.useRef<HTMLDivElement>(null);
  const piRef=React.useRef<Record<string,HTMLDivElement|null>>({});
  const baseRef=React.useRef(0),roomRef=React.useRef(0),panelRef=React.useRef<Panel>(null),timer=React.useRef(0);
  const measureRef=React.useRef<()=>void>(()=>{});
  const detailBtn=React.useRef<HTMLButtonElement>(null),optionsBtn=React.useRef<HTMLButtonElement>(null);
  const agreementBtn=React.useRef<HTMLButtonElement>(null);
  panelRef.current=panel;
  const process=order.requestProcess;
  const local=process?.availability?.path==='LOCAL_PICKUP';
  const subject=accepted.subjectSnapshot;
  const title=subject.items.map(item=>`${item.quantity}× ${item.nameSnapshot}`).join(' · ');
  const units=subject.items.reduce((sum,item)=>sum+item.quantity,0);
  const when=accepted.scheduledFor?new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(accepted.scheduledFor)):subject.needNow?'Lo antes posible':'Sin horario acordado';
  const total=typeof accepted.totalPriceClp==='number'&&accepted.totalPriceClp>0?accepted.totalPriceClp:null;
  const ratio=total?Math.min(1,stage.requiredAmountClp/total):1;
  const clientNote=process?.reservationChoice?.note;
  const ids={detail:`prepayment-detail-${order.id}`,options:`prepayment-options-${order.id}`,more:`prepayment-more-${order.id}`};

  // El panel crece hacia arriba: la tarjeta sube su borde superior, los botones de abajo no se mueven y no ocupa más espacio hacia abajo.
  const openPanel=(next:Exclude<Panel,null>,toggle:boolean,notify=true)=>{
    const card=cardRef.current;
    if(card&&!panelRef.current&&!card.style.height){
      baseRef.current=card.offsetHeight;
      // Reserve the closed height before moving the footer out of document flow.
      // Otherwise the browser can clamp scrollTop during the intermediate layout.
      card.style.height=`${baseRef.current}px`;
    }
    const result=toggle&&panelRef.current===next?null:next;
    if(notify&&Boolean(result)!==Boolean(panelRef.current))onToggle();
    setMore(false);
    setPanel(result);
  };
  const closePanel=()=>{const target=panel==='options'?optionsBtn.current:detailBtn.current;if(panel)onToggle();setMore(false);setPanel(null);target?.focus({preventScroll:true});};
  const measure=()=>{
    const card=cardRef.current;if(!card)return;
    window.clearTimeout(timer.current);
    const foot=footRef.current;
    if(foot)card.style.setProperty('--bpp-foot',`${foot.offsetHeight}px`);
    const base=baseRef.current;
    if(panel){
      const pi=piRef.current[panel];if(!pi||!base)return;
      if(!card.style.height){card.style.transition='none';card.style.height=`${base}px`;void card.offsetHeight;card.style.transition='';}
      const acc=panel==='detail'?accRef.current:null;
      const aci=aciRef.current;
      const need=pi.offsetHeight-(acc?acc.offsetHeight:0)+(acc&&aci&&more?aci.scrollHeight:0);
      const scroller=card.closest<HTMLElement>('[data-requests-scroll]');
      const top=Math.max(scroller?.getBoundingClientRect().top??0,window.visualViewport?.offsetTop??0);
      roomRef.current=Math.max(0,card.getBoundingClientRect().bottom-base-top-8);
      // Options size to their contents instead of keeping the closed card's empty
      // body. Opposite margin keeps the footer and following requests anchored.
      const grow=Math.min(panel==='options'?need-base:Math.max(0,need-base),roomRef.current);
      const height=`${base+grow}px`,margin=`${-grow}px`;
      if(card.style.height!==height)card.style.height=height;
      if(card.style.marginTop!==margin)card.style.marginTop=margin;
    }else if(card.style.height){
      card.style.height=`${base}px`;card.style.marginTop='0px';
      timer.current=window.setTimeout(()=>{card.style.height='';card.style.marginTop='';},340);
    }
  };
  measureRef.current=measure;
  React.useLayoutEffect(()=>{
    const card=cardRef.current;
    const coveredFocus=card?.querySelector('.zipco-bpp-flow')?.contains(document.activeElement)&&!footRef.current?.contains(document.activeElement);
    const lostFocus=document.activeElement===document.body&&!document.querySelector('[role="dialog"],[role="alertdialog"]');
    if(panel&&(coveredFocus||lostFocus)){
      (panel==='options'?optionsBtn:detailBtn).current?.focus({preventScroll:true});
    }
    card?.querySelectorAll<HTMLElement>('.zipco-bpp-flow > :not(.zipco-bpp-foot)').forEach(node=>{
      node.inert=!!panel;if(panel)node.setAttribute('aria-hidden','true');else node.removeAttribute('aria-hidden');
    });
    card?.querySelectorAll<HTMLElement>('.zipco-bpp-pn').forEach(node=>{node.inert=node.id!==(panel?ids[panel]:'');});
    if(aciRef.current)aciRef.current.inert=!more;
    measure();
  });
  React.useEffect(()=>{
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>measureRef.current());
    [footRef.current,...Object.values(piRef.current)].forEach(node=>{if(node)observer?.observe(node);});
    const resize=()=>measureRef.current();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
    return()=>{observer?.disconnect();window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);};
  },[]);
  React.useEffect(()=>{
    if(expanded&&!panelRef.current)openPanel('detail',false,false);
    else if(!expanded&&panelRef.current){setMore(false);setPanel(null);}
  },[expanded]);
  React.useEffect(()=>()=>window.clearTimeout(timer.current),[]);

  // Hoy pickupPrepaymentFor solo produce esta tarjeta con retiro en el local; la rama de WhatsApp queda lista por si el flujo la reutiliza.
  const channel=local?
    {label:'Retiro en el local',icon:<MapPin size={14} aria-hidden="true"/>,chip:`Retiro ${when}`}:
    {label:'Coordinación por WhatsApp',icon:<WhatsAppMark className="h-3.5 w-3.5"/>,chip:`Retiro en local ${when}`};
  const ringStyle={strokeDashoffset:RING*(1-ratio)} as React.CSSProperties;

  return <article ref={cardRef} id={`order-${order.id}`} tabIndex={0} data-pickup-prepayment={stage.phase} data-unread={isUnread} data-open={panel??undefined}
    className="zipco-business-prepayment zipco-bpp-card scroll-mb-36"
    onKeyDown={event=>{if(event.key==='Escape'&&panel&&!(event.target as Element).closest('[role="dialog"],[role="alertdialog"]')){event.preventDefault();event.stopPropagation();closePanel();}}}>
    <i className="zipco-bpp-au1" aria-hidden="true"/><i className="zipco-bpp-au2" aria-hidden="true"/>
    <AvailabilityPostActions order={order} business={true} refresh={refresh} render={parts=>
      <ReservationPanel order={order} business={true} refresh={refresh} render={rp=><>
        <div className="zipco-bpp-flow">
          <header className="zipco-bpp-hd">
            <span className="zipco-bpp-th">
              <ProductPreviewControl fallback={<span className="zipco-bpp-fb">{image?<ImageWithFallback src={image} alt="" className="h-full w-full object-cover"/>:<User size={24} aria-hidden="true"/>}</span>}/>
              <em aria-hidden="true">{units}×</em>
            </span>
            <div className="zipco-bpp-id">
              <small>CLIENTE{isUnread?<em>Nueva</em>:null}</small>
              <b className="zipco-co-client-name">{name}</b>
              <span className="zipco-bpp-pill"><i aria-hidden="true"/>Pago y apartado pendientes</span>
            </div>
          </header>
          <div className="zipco-bpp-rg">
            <div className="zipco-bpp-ring">
              <svg viewBox="0 0 84 84" aria-hidden="true"><defs><linearGradient id={`bpp-g-${order.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#10b981"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
                <circle className="zipco-bpp-trk" cx="42" cy="42" r="34" fill="none" strokeWidth="7"/>
                <circle className="zipco-bpp-arc" cx="42" cy="42" r="34" fill="none" strokeWidth="7" stroke={`url(#bpp-g-${order.id})`} style={ringStyle}/></svg>
              <div className="zipco-bpp-rc"><small>RESERVA</small><b>$<Count value={stage.requiredAmountClp}/></b></div>
            </div>
            <div className="zipco-bpp-rq">
              <h3>{stage.canConfirmPaymentAndHold?'¿Recibiste el pago?':'Revisa el estado de la reserva'}</h3>
              <i className="zipco-bpp-bar" aria-hidden="true"/>
              <p>{total?(stage.requiredAmountClp>=total?<>Cubre el <b>total del pedido: {money(total)}</b></>:<>Es una parte del <b>total del pedido: {money(total)}</b></>):'Reserva con pago previo. ZIPCO no verifica transferencias.'}</p>
            </div>
          </div>
          <div className="zipco-bpp-ch">
            <span className="zipco-bpp-c1"><Calendar size={14} aria-hidden="true"/>{channel.chip}</span>
            {!local&&<span className="zipco-bpp-c1"><WhatsAppMark className="h-3.5 w-3.5"/>Coordinación por WhatsApp</span>}
            <span className="zipco-bpp-c1"><Package size={14} aria-hidden="true"/>Incluye apartar</span>
          </div>
          {rp.confirm&&<div className="zipco-bpp-yn">
            <button type="button" className="zipco-bpp-go" disabled={rp.confirm.busy} onClick={rp.confirm.onClick}><Check aria-hidden="true"/>{rp.confirm.label}</button>
            <button type="button" className="zipco-bpp-no" disabled={rp.busy} aria-controls={ids.options} aria-expanded={panel==='options'} onClick={()=>openPanel('options',false)}>Aún no</button>
          </div>}
          <div className="zipco-bpp-foot" ref={footRef}>
            {parts?.alerts&&<div className="zipco-bpp-alerts">{parts.alerts}</div>}
            {rp.error}
            <div className="zipco-bpp-fr">
              <button ref={detailBtn} type="button" className="zipco-bpp-fold" aria-expanded={panel==='detail'} aria-controls={ids.detail} onClick={()=>openPanel('detail',true)}><span className="t">Detalle</span><span className="c"><ChevronDown size={15} aria-hidden="true"/></span></button>
              <button ref={optionsBtn} type="button" className="zipco-bpp-fold" aria-expanded={panel==='options'} aria-controls={ids.options} onClick={()=>openPanel('options',true)}><span className="t">Más opciones</span><span className="n">{rp.options.length+(parts?.has.cancel?1:0)}</span><span className="c"><ChevronDown size={15} aria-hidden="true"/></span></button>
            </div>
          </div>
        </div>
        <div className="zipco-bpp-pn" id={ids.detail} role="region" aria-label="Detalle de la reserva" aria-hidden={panel!=='detail'} data-on={panel==='detail'}>
          <div className="zipco-bpp-pi" ref={node=>{piRef.current.detail=node;}}><div className="zipco-bpp-in">
            {clientNote&&<div className="zipco-bpp-note"><small>NOTA DEL CLIENTE</small>{clientNote}</div>}
            <section className="zipco-bpp-cond" aria-label="Condiciones aceptadas">
              <div className="zipco-bpp-ch2"><span className="zipco-bpp-ck" aria-hidden="true"><Check size={15} strokeWidth={3}/></span>
                <span className="zipco-bpp-tx"><small>Condiciones aceptadas</small><b>{title}</b></span>
                {total&&<span className="zipco-bpp-pr"><small>Total acordado</small><b>{money(total)}</b></span>}</div>
              <ul className="zipco-bpp-items">{subject.items.map((item,index)=><li key={index}>
                {subject.items.length>1&&<strong>{item.quantity}× {item.nameSnapshot}</strong>}
                <span>{item.unitPriceClpSnapshot===null?'Precio total de esta línea':`${money(item.unitPriceClpSnapshot)} por unidad`} · Subtotal {money(item.subtotalClp)}</span></li>)}</ul>
              <div className="zipco-bpp-tile"><span aria-hidden="true"><Calendar size={14}/></span><div><small>Fecha y hora</small><b>{when}</b></div></div>
              {subject.note&&<div className="zipco-bpp-tile"><span aria-hidden="true"><Package size={14}/></span><div><small>Nota</small><b>{subject.note}</b></div></div>}
              <button ref={agreementBtn} type="button" className="zipco-bpp-all" onClick={()=>setSheet('agreement')}>Ver acuerdo completo<ChevronRight size={14} aria-hidden="true"/></button>
            </section>
            <button type="button" className="zipco-bpp-mini" aria-expanded={more} aria-controls={ids.more} onClick={()=>setMore(value=>!value)}>
              <span className="mt">{channel.icon}{channel.label}</span><span className="cc"><ChevronDown size={13} aria-hidden="true"/></span></button>
            <div className="zipco-bpp-ac" id={ids.more} data-on={more} ref={accRef}><div className="zipco-bpp-aci" ref={aciRef}>
              {parts?.instructions}
              {rp.notices}
              {parts?.has.contact&&parts.contact}
            </div></div>
          </div></div>
        </div>
        <div className="zipco-bpp-pn zipco-bpp-options-panel" id={ids.options} role="region" aria-label="Más opciones" aria-hidden={panel!=='options'} data-on={panel==='options'}>
          <div className="zipco-bpp-pi" ref={node=>{piRef.current.options=node;}}><div className="zipco-bpp-ops">
            {rp.options}
            {parts?.cancel}
          </div></div>
        </div>
      </>}/>}/>
    <AgreementSheet open={sheet==='agreement'} onOpenChange={value=>{setSheet(value?'agreement':null);if(!value)requestAnimationFrame(()=>requestAnimationFrame(()=>agreementBtn.current?.focus({preventScroll:true})));}}
      processId={order.requestProcess?.id} client={name} accepted={accepted} acceptedAt={accepted.confirmedAt}/>
  </article>;
}

/** E209 composition. ReservationPanel owns the existing command and all recovery controls. */
export default function PickupPrepaymentCard({order,business,accepted,name,image,isUnread,expanded,onToggle,refresh}:{
  order:BusinessRequest|MyOrder;business:boolean;accepted:AgreementReadDto;name:string;image?:string;
  isUnread:boolean;expanded:boolean;onToggle:()=>void;refresh:()=>void;
}){
  const [sheet,setSheet]=React.useState<'conditions'|'agreement'|null>(null);
  const stage=pickupPrepaymentFor(order.requestProcess);
  if(!stage)return null;
  const awaitingPayment=stage.phase==='AWAITING_PAYMENT_AND_HOLD';
  // Variante nueva: solo negocio + proyección válida + fase AWAITING_PAYMENT_AND_HOLD. El resto de los casos queda igual que siempre.
  if(business&&awaitingPayment)return <BusinessPrepaymentView order={order} accepted={accepted} stage={stage} name={name} image={image} isUnread={isUnread} refresh={refresh} expanded={expanded} onToggle={onToggle}/>;
  const businessLabel=awaitingPayment?'Pago y apartado pendientes':'Reserva por revisar';
  const subject=accepted.subjectSnapshot;
  const title=subject.items.map(item=>`${item.quantity}× ${item.nameSnapshot}`).join(' · ');
  const when=accepted.scheduledFor?new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(accepted.scheduledFor)):subject.needNow?'Lo antes posible':'Sin horario acordado';
  const detailId=`prepayment-detail-${order.id}`;
  return <article id={`order-${order.id}`} tabIndex={0} data-pickup-prepayment={stage.phase}
    data-unread={isUnread} className="zipco-co-dk zipco-ec-dk scroll-mb-36 p-4">
    <ProgressCardHeader business={business} name={name} image={image} price={accepted.totalPriceClp}
      statusLabel={business?businessLabel:'Por responder'} isUnread={isUnread}/>
    <p className="mt-3 text-sm font-bold">{business?awaitingPayment?'Pendiente de confirmar pago y apartado':'Revisa la incidencia de esta reserva':PREPAYMENT_WAITING_MESSAGE}</p>
    <p className="mt-2 text-xs">Reserva con pago previo de <b>${stage.requiredAmountClp.toLocaleString('es-CL')}</b>. ZIPCO no verifica transferencias.</p>
    <AvailabilityPostActions order={order} business={business} refresh={refresh} render={parts=><>
      {parts?.alerts}
      {parts?.reservation}
      <button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 text-sm font-bold"
        aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>{expanded?'Ocultar detalle':'Ver instrucciones y condiciones'}</button>
      <div id={detailId} hidden={!expanded} className="space-y-3">
        {parts?.instructions}
        <button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 text-sm font-bold" onClick={()=>setSheet('conditions')}>Condiciones aceptadas · {title}</button>
        {parts?.contact}{parts?.cancel}
      </div>
    </>}/>
    <ConditionsSheet open={sheet==='conditions'} onOpenChange={value=>setSheet(value?'conditions':null)} accepted={accepted}
      title={title} subtitle="" when={when} explanation={subject.note} explanationLabel="Nota" onOpenAgreement={()=>setSheet('agreement')}/>
    <AgreementSheet open={sheet==='agreement'} onOpenChange={value=>setSheet(value?'agreement':null)}
      processId={order.requestProcess?.id} client={name} accepted={accepted} acceptedAt={accepted.confirmedAt}/>
  </article>;
}
