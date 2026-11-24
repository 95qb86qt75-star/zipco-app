import {readCoordinationSession} from '../../../application/intents/coordinationSession';
import {paymentProofFor} from '../../../domain/customerPaymentProof';
import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Calendar,Check,ChevronDown,ChevronRight,DollarSign,Info,Package,User,X} from 'lucide-react';
import type {BusinessRequest,MyOrder} from '../../../domain/types';
import type {AgreementReadDto} from '../../../domain/agreement';
import type {PickupPrepayment} from '../../../domain/pickupPrepayment';
import AvailabilityPostActions from '../availability/AvailabilityPostActions';
import ReservationPanel from '../../../shared/reservations/ReservationPanel';
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

export default function CustomerPrepaymentView({order,accepted,stage,name,image,isUnread,refresh,expanded,onToggle}:{
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
  const subject=accepted.subjectSnapshot;
  const title=subject.items.map(item=>`${item.quantity}× ${item.nameSnapshot}`).join(' · ');
  const units=subject.items.reduce((sum,item)=>sum+item.quantity,0);
  const when=accepted.scheduledFor?new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(accepted.scheduledFor)):subject.needNow?'Lo antes posible':'Sin horario acordado';
  const total=typeof accepted.totalPriceClp==='number'&&accepted.totalPriceClp>0?accepted.totalPriceClp:null;
  const ratio=total?Math.min(1,stage.requiredAmountClp/total):1;
  const clientNote=process?.reservationChoice?.note;
  const session=React.useRef(readCoordinationSession()).current;
  const declared=!!paymentProofFor(process)?.declaration;
  const askKey=`zipco-cpp-ask:${session?.userId}:${process?.id}:${process?.reservation?.id}:${process?.agreementPublicId}`;
  const [asking,setAsking]=React.useState(()=>{try{return sessionStorage.getItem(askKey)==='1';}catch{return false;}});
  const [receiptOpen,setReceiptOpen]=React.useState(false);
  const [leaving,setLeaving]=React.useState(false);
  const yesBtn=React.useRef<HTMLButtonElement>(null);
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
    if(foot)card.style.setProperty('--cpp-foot',`${foot.offsetHeight}px`);
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
    const coveredFocus=card?.querySelector('.zipco-cpp-flow')?.contains(document.activeElement)&&!footRef.current?.contains(document.activeElement);
    const lostFocus=document.activeElement===document.body&&!document.querySelector('[role="dialog"],[role="alertdialog"]');
    if(panel&&(coveredFocus||lostFocus)){
      (panel==='options'?optionsBtn:detailBtn).current?.focus({preventScroll:true});
    }
    card?.querySelectorAll<HTMLElement>('.zipco-cpp-flow > :not(.zipco-cpp-foot)').forEach(node=>{
      node.inert=!!panel;if(panel)node.setAttribute('aria-hidden','true');else node.removeAttribute('aria-hidden');
    });
    card?.querySelectorAll<HTMLElement>('.zipco-cpp-pn').forEach(node=>{node.inert=node.id!==(panel?ids[panel]:'');});
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
  // «Volver de WhatsApp»: la pregunta aparece solo después de que ESTA tarjeta abrió WhatsApp (botón «Abrir WhatsApp») y la persona salió y regresó a ZIPCO.
  // A verified return from the shared host only offers the question; it never sends.
  React.useEffect(()=>{
    const back=(event:Event)=>{const d=(event as CustomEvent).detail;
      if(readCoordinationSession()!==session||d?.orderId!==order.id||d?.processId!==process?.id)return;
      try{sessionStorage.setItem(askKey,'1');}catch{/* UI only. */}setAsking(true);
    };
    window.addEventListener('zipco-reservation-receipt-return',back);
    return()=>window.removeEventListener('zipco-reservation-receipt-return',back);
  },[askKey,session,order.id,process?.id]);

  const chipWhen=`Retiro ${when}`;
  const ringStyle={strokeDashoffset:RING*(1-ratio)} as React.CSSProperties;
  const gid=`cpp-g-${order.id}`;

  return <article ref={cardRef} id={`order-${order.id}`} tabIndex={0} data-pickup-prepayment={stage.phase} data-unread={isUnread} data-open={panel??undefined} data-leaving={leaving||undefined}
    className="zipco-customer-prepayment zipco-cpp-card scroll-mb-36"
    onKeyDown={event=>{if(event.key==='Escape'&&panel&&!(event.target as Element).closest('[role="dialog"],[role="alertdialog"]')){event.preventDefault();event.stopPropagation();closePanel();}}}>
    <i className="zipco-cpp-au1" aria-hidden="true"/><i className="zipco-cpp-au2" aria-hidden="true"/>
    <AvailabilityPostActions order={order} business={false} refresh={refresh} render={parts=>
      <ReservationPanel order={order} business={false} refresh={refresh} render={rp=>{
        // La pregunta solo existe si el servidor puede registrar la declaración (rp.receipt); si no, la tarjeta se queda en su estado de espera.
        const ask=!declared&&asking&&!!rp.receipt;
        const optionCount=rp.options.length+(parts?.has.cancel?1:0);
        return <>
        <div className="zipco-cpp-flow">
          <header className="zipco-cpp-hd">
            <span className="zipco-cpp-th">
              <ProductPreviewControl fallback={<span className="zipco-cpp-fb">{image?<ImageWithFallback src={image} alt="" className="h-full w-full object-cover"/>:<User size={24} aria-hidden="true"/>}</span>}/>
              <em aria-hidden="true">{units}×</em>
            </span>
            <div className="zipco-cpp-id">
              <small>NEGOCIO{isUnread?<em>Nueva</em>:null}</small>
              <b>{name}</b>
              <span className="zipco-cpp-pill"><i aria-hidden="true"/>{declared?'En espera':'Por responder'}</span>
            </div>
          </header>
          <div className="zipco-cpp-rg">
            <div className="zipco-cpp-ring">
              <svg viewBox="0 0 84 84" aria-hidden="true"><defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#10b981"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
                <circle className="zipco-cpp-trk" cx="42" cy="42" r="34" fill="none" strokeWidth="7"/>
                <circle className="zipco-cpp-arc" cx="42" cy="42" r="34" fill="none" strokeWidth="7" stroke={`url(#${gid})`} style={ringStyle}/></svg>
              <div className="zipco-cpp-rc"><small>RESERVA</small><b>$<Count value={stage.requiredAmountClp}/></b></div>
            </div>
            <div className="zipco-cpp-rq" aria-live="polite">
              <h3>{ask?'¿Enviaste el comprobante por WhatsApp?':declared?'En espera del negocio':'Pendiente de confirmación'}</h3>
              <i className="zipco-cpp-bar" aria-hidden="true"/>
              <p>{ask?'Confirma solo si ya enviaste el comprobante por WhatsApp':declared?'Declaraste el envío del comprobante. Falta confirmar el pago recibido y el apartado':'del pago y apartado por el negocio'}</p>
            </div>
          </div>
          <div className="zipco-cpp-ch">
            {total&&<span className="zipco-cpp-c1"><DollarSign size={14} aria-hidden="true"/>Total acordado&nbsp;<b>{money(total)}</b></span>}
            <span className="zipco-cpp-c1"><Calendar size={14} aria-hidden="true"/>{chipWhen}</span>
          </div>
          {ask?<div className="zipco-cpp-yn">
            <button ref={yesBtn} type="button" className="zipco-cpp-go" disabled={rp.receipt?.busy} onClick={()=>setReceiptOpen(true)}>Sí, confirmar envío</button>
            <button type="button" className="zipco-cpp-no" disabled={rp.busy} aria-controls={ids.options} aria-expanded={panel==='options'} onClick={()=>openPanel('options',false)}>No, aún no</button>
          </div>:<>
            {!rp.whatsapp&&rp.waNotice&&<div className="zipco-cpp-wan">{rp.waNotice}</div>}
            {(rp.whatsapp||rp.refreshNow)&&<div className="zipco-cpp-yn" data-solo={!rp.whatsapp||!rp.refreshNow||undefined}>
              {rp.whatsapp&&<button type="button" className="zipco-cpp-go" disabled={rp.whatsapp.busy} onClick={()=>rp.whatsapp?.onClick()}><WhatsAppMark className="h-4 w-4"/>{rp.whatsapp.label}</button>}
              {rp.refreshNow&&<button type="button" className="zipco-cpp-no" disabled={rp.refreshNow.busy} onClick={rp.refreshNow.onClick}>Actualizar reserva</button>}
            </div>}
          </>}
          {!ask&&rp.receipt&&!declared&&<button ref={yesBtn} type="button" className="zipco-cpp-mini" disabled={rp.busy} onClick={()=>setReceiptOpen(true)}>Ya envié el comprobante</button>}
          <div className="zipco-cpp-foot" ref={footRef}>
            {parts?.alerts&&<div className="zipco-cpp-alerts">{parts.alerts}</div>}
            {rp.error}
            <div className="zipco-cpp-fr">
              <button ref={detailBtn} type="button" className="zipco-cpp-fold" aria-expanded={panel==='detail'} aria-controls={ids.detail} onClick={()=>openPanel('detail',true)}><span className="t">Detalle</span><span className="c"><ChevronDown size={15} aria-hidden="true"/></span></button>
              <button ref={optionsBtn} type="button" className="zipco-cpp-fold" aria-expanded={panel==='options'} aria-controls={ids.options} onClick={()=>openPanel('options',true)}><span className="t">Más opciones</span><span className="n">{optionCount}</span><span className="c"><ChevronDown size={15} aria-hidden="true"/></span></button>
            </div>
          </div>
        </div>
        <div className="zipco-cpp-pn" id={ids.detail} role="region" aria-label="Detalle de la reserva" aria-hidden={panel!=='detail'} data-on={panel==='detail'}>
          <div className="zipco-cpp-pi" ref={node=>{piRef.current.detail=node;}}><div className="zipco-cpp-in">
            {clientNote&&<div className="zipco-cpp-note"><small>MI NOTA DE RESERVA</small>{clientNote}</div>}
            {parts?.has.instructions&&<div className="zipco-cpp-biz">{parts.instructions}</div>}
            <section className="zipco-cpp-cond" aria-label="Condiciones aceptadas">
              <div className="zipco-cpp-ch2"><span className="zipco-cpp-ck" aria-hidden="true"><Check size={15} strokeWidth={3}/></span>
                <span className="zipco-cpp-tx"><small>Condiciones aceptadas</small><b>{title}</b></span>
                {total&&<span className="zipco-cpp-pr"><small>Total acordado</small><b>{money(total)}</b></span>}</div>
              <ul className="zipco-cpp-items">{subject.items.map((item,index)=><li key={index}>
                {subject.items.length>1&&<strong>{item.quantity}× {item.nameSnapshot}</strong>}
                <span>{item.unitPriceClpSnapshot===null?'Precio total de esta línea':`${money(item.unitPriceClpSnapshot)} por unidad`} · Subtotal {money(item.subtotalClp)}</span></li>)}</ul>
              <div className="zipco-cpp-tile"><span aria-hidden="true"><Calendar size={14}/></span><div><small>Fecha y hora</small><b>{when}</b></div></div>
              {subject.note&&<div className="zipco-cpp-tile"><span aria-hidden="true"><Package size={14}/></span><div><small>Nota</small><b>{subject.note}</b></div></div>}
              <button ref={agreementBtn} type="button" className="zipco-cpp-all" onClick={()=>setSheet('agreement')}>Ver acuerdo completo<ChevronRight size={14} aria-hidden="true"/></button>
            </section>
            <button type="button" className="zipco-cpp-mini" aria-expanded={more} aria-controls={ids.more} onClick={()=>setMore(value=>!value)}>
              <span className="mt"><Info size={14} aria-hidden="true"/>Avisos de la reserva</span><span className="cc"><ChevronDown size={13} aria-hidden="true"/></span></button>
            <div className="zipco-cpp-ac" id={ids.more} data-on={more} ref={accRef}><div className="zipco-cpp-aci" ref={aciRef}>
              {rp.notices}
              {parts?.has.contact&&parts.contact}
            </div></div>
          </div></div>
        </div>
        <div className="zipco-cpp-pn zipco-cpp-options-panel" id={ids.options} role="region" aria-label="Más opciones" aria-hidden={panel!=='options'} data-on={panel==='options'}>
          <div className="zipco-cpp-pi" ref={node=>{piRef.current.options=node;}}><div className="zipco-cpp-ops">
            {rp.options}
            {parts?.cancel}
          </div></div>
        </div>
        {rp.receipt&&<Dialog.Root open={receiptOpen} onOpenChange={value=>{if(!value&&!rp.receipt?.busy)setReceiptOpen(false);}}><Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[1100] bg-slate-950/60 backdrop-blur-sm"/>
          <Dialog.Content data-prepayment-dialog="RECEIPT_SENT" onCloseAutoFocus={event=>{if(yesBtn.current?.isConnected){event.preventDefault();yesBtn.current.focus({preventScroll:true});}}}
            className="zipco-customer-prepayment zipco-cpp-dialog fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <div className="zipco-cpp-dtop"><span>Reserva con pago</span><Dialog.Close className="zipco-cpp-dx" aria-label="Cerrar" disabled={rp.receipt.busy}><X size={18} aria-hidden="true"/></Dialog.Close></div>
            <span className="zipco-cpp-orb" aria-hidden="true"><WhatsAppMark className="h-5 w-5"/></span>
            <Dialog.Title className="zipco-cpp-dt">¿Enviaste el comprobante por WhatsApp?</Dialog.Title>
            <Dialog.Description className="zipco-cpp-dd">Al confirmar declaras que enviaste el comprobante de <b>{money(stage.requiredAmountClp)}</b> al negocio. El negocio debe confirmar que recibió el pago y apartó el pedido. ZIPCO no verifica la transferencia.</Dialog.Description>
            {rp.receipt.error&&<p role="alert" className="zipco-cpp-derr">{rp.receipt.error}</p>}
            <div className="zipco-cpp-dyn"><button type="button" className="zipco-cpp-dy" disabled={rp.receipt.busy} onClick={()=>{void rp.receipt?.confirm(()=>{setReceiptOpen(false);setLeaving(true);}).then(ok=>{
              if(!ok){setLeaving(false);return;}
              try{sessionStorage.removeItem(askKey);}catch{/* nada que limpiar */}
              setReceiptOpen(false);
            });}}>{rp.receipt.busy?'Guardando…':'Sí, confirmar envío'}</button><button type="button" className="zipco-cpp-dn" disabled={rp.receipt.busy} onClick={()=>setReceiptOpen(false)}>Aún no</button></div>
          </Dialog.Content></Dialog.Portal></Dialog.Root>}
        </>;}}/>}/>
    <AgreementSheet open={sheet==='agreement'} onOpenChange={value=>{setSheet(value?'agreement':null);if(!value)requestAnimationFrame(()=>requestAnimationFrame(()=>agreementBtn.current?.focus({preventScroll:true})));}}
      processId={order.requestProcess?.id} client={name} accepted={accepted} acceptedAt={accepted.confirmedAt}/>
  </article>;
}

