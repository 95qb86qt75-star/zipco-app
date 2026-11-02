import { when, vars, Sparks, Step } from "./CoordinationVisualPrimitives";

import * as React from 'react';
import {useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import { BusinessCoordinationDisclosure } from "../../business/coordination/businessCoordinationDisclosure";
import AvailabilityPostActions from "../availability/AvailabilityPostActions";
import { availabilityFlow, CONTACT_COPY } from "../../../domain/availabilityContract";
import { Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, LockKeyhole, MoreHorizontal, Trash2 } from 'lucide-react';
import { CoordinationCardHeader } from "./CoordinationCardShell";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import { LINE_SPARKS, RAIL_SPARKS } from "./coordinationSparks";


import "../../customer/whatsapp/initial/customer-initial-coordination.css";

/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
import type { BusinessCoordinationCardModel } from "./application/useBusinessCoordinationCardController";
/** Complete canonical composition for this coordination variant. */
export default function InitialCoordinationCardView({model}:{model:Pick<BusinessCoordinationCardModel,"accepted"|"acceptedAt"|"allowed"|"business"|"canOpen"|"client"|"conditionsSummary"|"counterpartPending"|"deferred"|"dialogs"|"embedded"|"folded"|"fresh"|"go"|"image"|"isUnread"|"motionRef"|"negotiated"|"onInspect"|"operation"|"order"|"pending"|"phase"|"price"|"process"|"recoveryOnly"|"refresh"|"setDeferred"|"setFolded"|"setSheet"|"sheet"|"statusLabel"|"unlock">&{step2Done:BusinessCoordinationCardModel["authorized"];waLabel:string}}){
const {accepted,acceptedAt,allowed,business,canOpen,client,conditionsSummary,counterpartPending,deferred,dialogs,embedded,folded,fresh,go,image,isUnread,motionRef,negotiated,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refresh,setDeferred,setFolded,setSheet,statusLabel,step2Done,unlock,waLabel}=model;
// Solo la consulta del negocio «¿Coordinación lista por WhatsApp?» (BusinessCoordinationWaitingCard) entrega este contexto: ahí el detalle es una sola tarjeta.
// Los demás consumidores (cliente, tarjeta plegable propia) siguen con la composición original de abajo.
const layout=useContext(BusinessCoordinationDisclosure);
if(business&&embedded&&layout)return <BusinessAskDetail model={model}/>;
return <article ref={motionRef} data-coordination-motion="idle" id={embedded?undefined:`order-${order.id}`} data-coordination-embedded={embedded||undefined} tabIndex={0} data-unread={isUnread} data-aurora-state={process?.state} data-coordination-role={business ? 'business' : 'customer'}
    aria-label={`${client}: coordinación pendiente`} className="zipco-co-dk scroll-mb-36"
    onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.currentTarget.classList.remove('zipco-notification-target'); onInspect?.(); setFolded(value => !value); } }}
    onClick={event => { event.currentTarget.classList.remove('zipco-notification-target'); event.stopPropagation(); }}>
    <span className="zipco-co-a1" aria-hidden="true" /><span className="zipco-co-a2" aria-hidden="true" />
    <div style={{ position: 'relative' }}>
      <CoordinationCardHeader name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread}/>

      <div className="zipco-co-fb" data-folded={folded} aria-hidden={folded} {...(folded?{inert:''}:{})}><div className="zipco-co-fb-in">
      <button type="button" className="zipco-co-strip2" aria-haspopup="dialog" onClick={() => { onInspect?.(); setSheet('cond'); }}>
        <span className="zipco-co-strip2-ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true" /></span>
        <span style={{ minWidth: 0 }}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
        <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
      </button>

      <section className="zipco-co-co2" aria-label="Acciones de coordinación">
        <div className="zipco-co-co2-top">
          <span className="zipco-co-co2-orb"><Check size={24} strokeWidth={3} aria-hidden="true" /></span>
          <div style={{ minWidth: 0 }}>
            <div className="zipco-co-co2-t">{negotiated ? 'Propuesta aceptada' : 'Pedido aceptado'} · <span style={{ color: '#5eead4' }}>{client}</span></div>
            <div className="zipco-co-co2-s">Todo listo para coordinar el pedido.</div>
          </div>
        </div>

        {operation.message && <p role="alert" className="zipco-co-co2-p" style={{ marginTop: 12 }}>{operation.message}</p>}

        {recoveryOnly ? <div className="zipco-co-steps">
          <p role="alert" className="zipco-co-co2-p" style={{ margin: 0 }}>{operation.storageWarning() || (operation.restored()
            ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
          <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
        </div> : pending ? <div className="zipco-co-steps">
          <p className="zipco-co-co2-p" style={{ margin: 0 }}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
          <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
        </div> : <div className="zipco-co-steps">
          <Step className="done" node={<span className="zipco-co-sd"><Check size={13} strokeWidth={3.4} aria-hidden="true" /></span>}>
            <div className="zipco-co-sl">{negotiated ? 'Propuesta aceptada' : 'Pedido aceptado'}</div>
            {acceptedAt && <div className="zipco-co-sm">{when(acceptedAt)}</div>}
          </Step>

          {!step2Done ? <Step node={<span className="zipco-co-sd on">2</span>}>
            {!business && deferred ? <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={() => setDeferred(false)}>Revisar autorización de contacto</button> : <>
            <div className="zipco-co-wrapb"><Sparks />
              <button type="button" className={business ? 'zipco-co-go glowup' : 'zipco-contact-consent'} style={{ marginTop: 0 }} disabled={operation.busy || !allowed('AUTHORIZE_CONTACT')} onClick={() => void unlock()}>
                <span className={business ? 'zipco-co-wi' : 'zipco-contact-consent-icon'}><WhatsAppMark className="h-[22px] w-[22px]" /></span><span>{phase === 'requesting' ? 'Autorizando contacto…' : business ? 'Autorizo comenzar coordinación' : 'Autorizo iniciar coordinación'}</span>
              </button>
            </div>
            <div className="zipco-co-sm" style={{ marginTop: 6 }}>{availabilityFlow(process) ? CONTACT_COPY : <>Autorizas compartir con {client} el teléfono de tu perfil solo para este pedido. El consentimiento {business ? 'del cliente' : 'del negocio'} es independiente.</>}</div>
            {!business && <button type="button" className="zipco-co-go2 zipco-co-defer" disabled={operation.busy} onClick={() => setDeferred(true)}>Ahora no</button>}
            </>}
            {!allowed('AUTHORIZE_CONTACT') && <button type="button" className="zipco-co-lnk" disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>}
          </Step> : fresh ? <div className="zipco-co-st vstep">
            <span className="zipco-co-vl" aria-hidden="true"><b />{LINE_SPARKS.map(([c, d, t, dx, dy, s], i) => <i key={i} style={vars({ c, d: `${d}s`, t: `${t}s`, dx: `${dx}px`, dy: `${dy}px`, s })} />)}</span>
            <span className="zipco-co-sd donepop"><Check size={13} strokeWidth={3.4} aria-hidden="true" /></span>
            <div className="zipco-co-sb"><div className="zipco-co-sl">Coordinación autorizada</div><div className="zipco-co-sm">{business ? 'El cliente' : 'El negocio'} podrá contactarte por WhatsApp</div></div>
          </div> : <Step className="done" node={<span className="zipco-co-sd"><Check size={13} strokeWidth={3.4} aria-hidden="true" /></span>}>
            <div className="zipco-co-sl">Coordinación autorizada</div><div className="zipco-co-sm">{business ? 'El cliente' : 'El negocio'} podrá contactarte por WhatsApp</div>
          </Step>}

          <Step className="last" node={phase === 'ready'
            ? <span className="zipco-co-sd on zipco-co-sdpulse">3</span>
            : <span className="zipco-co-sd"><LockKeyhole size={12} strokeWidth={2.6} aria-hidden="true" /></span>}>
            {(phase === 'idle' || phase === 'requesting') && <><button type="button" className="zipco-co-go2 lock" disabled><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true" /><span>{waLabel}</span></button>
              <div className="zipco-co-sm" style={{ marginTop: 6 }}>Se activa al autorizar el contacto.</div></>}
            {phase === 'loading' && <><div className="zipco-co-wrapb">
              <button type="button" className="zipco-co-ld dk" disabled aria-busy="true">
                <span className="zipco-co-ld-l zipco-co-ld-dim"><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true" />{waLabel}</span>
                <span className="zipco-co-ld-l zipco-co-ld-fill d"><span className="zipco-co-wi0"><WhatsAppMark className="h-5 w-5" /></span>{waLabel}</span>
              </button>
              <span className="zipco-co-rail d" aria-hidden="true"><b />{RAIL_SPARKS.map(([c, d, t, dx, dy, s, top], i) => <i key={i} style={{ ...vars({ c, d: `${d}s`, t: `${t}s`, dx: `${dx}px`, dy: `${dy}px`, s }), top }} />)}</span>
            </div><div className="zipco-co-sm" style={{ marginTop: 6 }} role="status">Preparando WhatsApp…</div></>}
            {phase === 'ready' && <><div className="zipco-co-wrapb">{canOpen && <Sparks />}
              <button type="button" className={`zipco-co-go glowup${fresh ? ' swell' : ''}`} style={{ marginTop: 0 }} disabled={operation.busy || !canOpen} onClick={() => void go()}>
                <span className="zipco-co-wi"><WhatsAppMark className="h-[22px] w-[22px]" /></span><span>{waLabel}</span>
              </button>
            </div><div className="zipco-co-sm" style={{ marginTop: 6 }}>{canOpen ? `Acuerda los detalles de pago y ${accepted.subjectSnapshot.orderType === 'service' ? 'realización del servicio' : 'entrega'} con ${client}.` : counterpartPending ? `Esperando autorización de contacto ${business ? 'del cliente' : 'del negocio'}.` : 'Actualiza el pedido para continuar.'}</div></>}
          </Step>
        </div>}

        <p className="zipco-co-sm">ZIPCO no procesa ni verifica pagos.</p>
        {allowed('ANNUL_COORDINATION') && !recoveryOnly && !pending && <div className="zipco-co-lks">
          <button type="button" className="zipco-co-lk rose" disabled={operation.busy} onClick={() => setSheet('anul')}><Trash2 size={14} strokeWidth={2.3} aria-hidden="true" />Anular solicitud</button>
        </div>}
        {availabilityFlow(process) && <AvailabilityPostActions order={order} business={business} refresh={refresh}/>}
        <button type="button" className="zipco-co-fold" aria-expanded={true} onClick={() => setFolded(true)}><ChevronUp size={16} strokeWidth={2.8} aria-hidden="true" />Ocultar tarjeta</button>
        {operation.busy && phase !== 'loading' && <p role="status" className="zipco-co-co2-p">Actualizando pedido…</p>}
      </section>
      </div></div>
      <button type="button" className="zipco-co-colrow" data-folded={folded} aria-hidden={!folded} tabIndex={folded?0:-1} aria-expanded={!folded} onClick={() => { onInspect?.(); setFolded(false); }}
        style={{ ['--att' as string]: phase === 'loading' ? 0 : 1 }}>
        <span className="nd" aria-hidden="true">{phase === 'idle' ? '2' : '3'}</span>
        <span className="tx">
          <b>{phase === 'idle' ? 'Autorizar contacto' : phase === 'loading' ? 'Preparando WhatsApp…' : 'Ya puedes coordinar por WhatsApp'}</b>
          <small>{phase === 'idle' ? 'Falta tu acción · toca para abrir' : phase === 'loading' ? 'Paso 3 de 3 · un momento' : 'Paso 3 de 3 · listo para iniciar'}</small>
        </span>
        <span className="chev"><ChevronDown size={15} strokeWidth={2.8} aria-hidden="true" /><span className="sr-only">Mostrar coordinación</span></span>
      </button>
    </div>

    {dialogs}
  </article>;
}

type InitialModel=React.ComponentProps<typeof InitialCoordinationCardView>["model"];

/** Detalle de la consulta del negocio: una sola tarjeta (condiciones + pasos + acciones) y pie con aviso legal y «Más opciones». Mismas acciones y permisos que la composición original. */
function BusinessAskDetail({model}:{model:InitialModel}){
  const {accepted,acceptedAt,allowed,business,canOpen,client,conditionsSummary,counterpartPending,dialogs,fresh,go,motionRef,negotiated,onInspect,operation,order,pending,phase,process,recoveryOnly,refresh,setSheet,step2Done,unlock,waLabel}=model;
  const layout=useContext(BusinessCoordinationDisclosure);
  const [more,setMore]=useState(false);
  const canAnnul=allowed('ANNUL_COORDINATION')&&!recoveryOnly&&!pending;
  const footRef=useRef<HTMLDivElement>(null),moreRef=useRef<HTMLButtonElement>(null),menuRef=useRef<HTMLDivElement>(null);
  const [hasOptions,setHasOptions]=useState(true),[position,setPosition]=useState({left:12,bottom:12,width:260,maxHeight:300});
  const [sourceInert,setSourceInert]=useState(false);
  const busy=operation.busy,waiting=phase==='loading'||phase==='requesting',covered=model.sheet!==null;
  const optionsId=layout?.detailId+'-options';
  const menuVisible=more&&layout?.expanded===true&&!covered&&!busy&&!waiting&&!sourceInert&&hasOptions;
  useEffect(()=>{
    const root=motionRef.current;if(!root)return;
    const inspect=()=>setSourceInert(!!root.closest('[inert]'));
    const observer=new MutationObserver(inspect);let node:HTMLElement|null=root;
    while(node){observer.observe(node,{attributes:true,attributeFilter:['inert']});node=node.parentElement;}
    inspect();return()=>observer.disconnect();
  },[]);
  // Keep real controls mounted: closing the popover must not erase recovery/dialog state.
  useEffect(()=>{
    const menu=menuRef.current;if(!menu)return;
    const inspect=()=>setHasOptions(!!menu.textContent?.trim()||!!menu.querySelector('button,a,input,select,textarea'));
    inspect();const observer=new MutationObserver(inspect);observer.observe(menu,{childList:true,subtree:true,characterData:true});return()=>observer.disconnect();
  },[]);
  const placeMenu=()=>{
    const rect=moreRef.current?.getBoundingClientRect();if(!rect)return;
    const width=Math.min(280,window.innerWidth-24);
    setPosition({left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),bottom:Math.max(12,window.innerHeight-rect.top+6),width,maxHeight:Math.max(44,Math.min(320,rect.top-12))});
  };
  // Menú «Más opciones»: se cierra con Escape (devuelve el foco al botón) o al tocar fuera. No cierra con el pliegue del detalle.
  useEffect(()=>{
    if(!menuVisible)return;
    const modal=()=>!!document.querySelector('[role="dialog"],[role="alertdialog"]');
    const down=(event:PointerEvent)=>{if(!modal()&&!footRef.current?.contains(event.target as Node)&&!menuRef.current?.contains(event.target as Node))setMore(false);};
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!modal()){event.preventDefault();setMore(false);moreRef.current?.focus();}};
    const scroll=(event:Event)=>{if(!menuRef.current?.contains(event.target as Node)&&!modal())setMore(false);};
    document.addEventListener('pointerdown',down);document.addEventListener('keydown',key,true);
    window.addEventListener('resize',placeMenu);document.addEventListener('scroll',scroll,true);
    const frame=requestAnimationFrame(()=>menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled),a[href]')?.focus({preventScroll:true}));
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',placeMenu);document.removeEventListener('scroll',scroll,true);};
  },[menuVisible]);
  const dateLabel=acceptedAt?when(acceptedAt):'';
  return <article ref={motionRef} data-coordination-motion="idle" className="zipco-business-ask-detail" data-coordination-embedded="true" data-coordination-role="business">
    <section className="zipco-business-ask-card" aria-label="Pasos del pedido">
      <button type="button" className="zipco-co-strip2 zipco-business-ask-cond" aria-haspopup="dialog" onClick={()=>{onInspect?.();setSheet('cond');}}>
        <span className="zipco-co-strip2-ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true"/></span>
        <span style={{minWidth:0}}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
        <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true"/></span>
      </button>
      {operation.message&&<p role="alert" className="zipco-co-co2-p zipco-business-ask-alert">{operation.message}</p>}
      {recoveryOnly?<div className="zipco-co-steps">
        <p role="alert" className="zipco-co-co2-p" style={{margin:0}}>{operation.storageWarning()||(operation.restored()?'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.':'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
        <button type="button" className="zipco-co-go2" style={{marginTop:10}} disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>
      </div>:pending?<div className="zipco-co-steps">
        <p className="zipco-co-co2-p" style={{margin:0}}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
        <button type="button" className="zipco-co-go2" style={{marginTop:10}} disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button>
      </div>:<div className="zipco-co-steps">
        <Step className="done" node={<span className="zipco-co-sd"><Check size={13} strokeWidth={3.4} aria-hidden="true"/></span>}>
          <div className="zipco-co-sl">{negotiated?'Propuesta aceptada':'Pedido aceptado'}</div>
          {dateLabel&&<div className="zipco-co-sm">{dateLabel}</div>}
        </Step>
        {!step2Done?<Step node={<span className="zipco-co-sd on">2</span>}>
          <div className="zipco-co-sl">Contacto por autorizar</div>
          <div className="zipco-co-wrapb"><Sparks/>
            <button type="button" className="zipco-co-go glowup" style={{marginTop:0}} disabled={operation.busy||!allowed('AUTHORIZE_CONTACT')} onClick={()=>void unlock()}>
              <span className="zipco-co-wi"><WhatsAppMark className="h-[22px] w-[22px]"/></span><span>{phase==='requesting'?'Autorizando contacto…':'Autorizo comenzar coordinación'}</span>
            </button>
          </div>
          <div className="zipco-co-sm" style={{marginTop:6}}>{availabilityFlow(process)?CONTACT_COPY:<>Autorizas compartir con {client} el teléfono de tu perfil solo para este pedido. El consentimiento del cliente es independiente.</>}</div>
          {!allowed('AUTHORIZE_CONTACT')&&<button type="button" className="zipco-co-lnk" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>}
        </Step>:fresh?<div className="zipco-co-st vstep">
          <span className="zipco-co-vl" aria-hidden="true"><b/>{LINE_SPARKS.map(([c,d,t,dx,dy,s],i)=><i key={i} style={vars({c,d:`${d}s`,t:`${t}s`,dx:`${dx}px`,dy:`${dy}px`,s})}/>)}</span>
          <span className="zipco-co-sd donepop"><Check size={13} strokeWidth={3.4} aria-hidden="true"/></span>
          <div className="zipco-co-sb"><div className="zipco-co-sl">Coordinación autorizada</div><div className="zipco-co-sm">El cliente podrá contactarte por WhatsApp</div></div>
        </div>:<Step className="done" node={<span className="zipco-co-sd"><Check size={13} strokeWidth={3.4} aria-hidden="true"/></span>}>
          <div className="zipco-co-sl">Coordinación autorizada</div><div className="zipco-co-sm">El cliente podrá contactarte por WhatsApp</div>
        </Step>}
        <Step className="last" node={phase==='ready'?<span className="zipco-co-sd on zipco-co-sdpulse">3</span>:<span className="zipco-co-sd"><LockKeyhole size={12} strokeWidth={2.6} aria-hidden="true"/></span>}>
          <div className="zipco-co-sl">Iniciar coordinación</div>
          {(phase==='idle'||phase==='requesting')&&<><button type="button" className="zipco-co-go2 lock" disabled><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true"/><span>{waLabel}</span></button>
            <div className="zipco-co-sm" style={{marginTop:6}}>Se activa al autorizar el contacto.</div></>}
          {phase==='loading'&&<><div className="zipco-co-wrapb">
            <button type="button" className="zipco-co-ld dk" disabled aria-busy="true">
              <span className="zipco-co-ld-l zipco-co-ld-dim"><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true"/>{waLabel}</span>
              <span className="zipco-co-ld-l zipco-co-ld-fill d"><span className="zipco-co-wi0"><WhatsAppMark className="h-5 w-5"/></span>{waLabel}</span>
            </button>
            <span className="zipco-co-rail d" aria-hidden="true"><b/>{RAIL_SPARKS.map(([c,d,t,dx,dy,s,top],i)=><i key={i} style={{...vars({c,d:`${d}s`,t:`${t}s`,dx:`${dx}px`,dy:`${dy}px`,s}),top}}/>)}</span>
          </div><div className="zipco-co-sm" style={{marginTop:6}} role="status">Preparando WhatsApp…</div></>}
          {phase==='ready'&&<><div className="zipco-co-wrapb">{canOpen&&<Sparks/>}
            <button type="button" className={`zipco-co-go glowup${fresh?' swell':''}`} style={{marginTop:0}} disabled={operation.busy||!canOpen} onClick={()=>void go()}>
              <span className="zipco-co-wi"><WhatsAppMark className="h-[22px] w-[22px]"/></span><span>{waLabel}</span>
            </button>
          </div><div className="zipco-co-sm" style={{marginTop:6}}>{canOpen?`Acuerda los detalles de pago y ${accepted.subjectSnapshot.orderType==='service'?'realización del servicio':'entrega'} con ${client}.`:counterpartPending?'Esperando autorización de contacto del cliente.':'Actualiza el pedido para continuar.'}</div></>}
        </Step>
      </div>}
      {availabilityFlow(process)&&<AvailabilityPostActions order={order} business={business} refresh={refresh}/>}
      {operation.busy&&phase!=='loading'&&<p role="status" className="zipco-co-co2-p">Actualizando pedido…</p>}
    </section>
    <div className="zipco-business-ask-foot" ref={footRef}>
      <p className="zipco-business-ask-legal">ZIPCO no procesa ni verifica pagos.</p>
      {canAnnul&&<button type="button" ref={moreRef} className="zipco-business-ask-more" disabled={busy||waiting} aria-expanded={menuVisible} aria-controls={optionsId} onClick={()=>{placeMenu();setMore(value=>!value);}}><MoreHorizontal size={16} strokeWidth={2.6} aria-hidden="true"/>Más opciones<ChevronUp size={13} strokeWidth={2.6} aria-hidden="true"/></button>}
      {typeof document!=='undefined'&&createPortal(<div ref={menuRef} id={optionsId} className="zipco-business-ask-menu" role="region" aria-label="Opciones de coordinación" hidden={!menuVisible} {...(!menuVisible?{inert:''}:{})} style={position}>
        {canAnnul&&<button type="button" className="rose zipco-co-lk" disabled={operation.busy} onClick={()=>{setMore(false);setSheet('anul');}}><Trash2 size={14} strokeWidth={2.3} aria-hidden="true"/>Anular solicitud</button>}
      </div>,document.body)}
    </div>
    {dialogs}
  </article>;
}
