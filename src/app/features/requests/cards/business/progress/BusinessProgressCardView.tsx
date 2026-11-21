import * as React from 'react';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import { ProgressCardHeader, ProgressTapHand } from "../../shared/layout/ProgressCardShell";
import AvailabilityPostActions from "../../shared/availability/AvailabilityPostActions";
import type {AvailabilityPostActionParts} from "../../shared/availability/AvailabilityPostActionsView";
import ReservationPanel,{pickupDetailVariant} from "../../../shared/reservations/ReservationPanel";
import type {ReservationPanelParts} from "../../../shared/reservations/ReservationPanel";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import { availabilityFlow } from "../../../domain/availabilityContract";


import { Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, CircleX, ClipboardCheck, Clock, Hourglass, Info, ListChecks, Package, PackageCheck, Quote, Receipt, RefreshCw, ShieldCheck, Store } from 'lucide-react';
import {CloseRequestContext, CloseRequest, useCloseRequestAvailable} from './CloseRequest';
import useBusinessClosure from '../../../application/useBusinessClosure';



import { ConditionsSheet } from "../../../shared/conditions/CoordinationSheets";
import AgreementSheet from "../../../shared/conditions/AgreementSheet";
import SlideToNotify from "./SlideToNotify";



/**
 * Tarjeta del NEGOCIO para pedidos en IN_PROGRESS y READY (diseño R, aprobado). Reemplaza el bloque genérico
 * ("Condiciones aceptadas" + CoordinationActions) SOLO para el negocio y SOLO en esos dos estados.
 *  - IN_PROGRESS: "Preparando el pedido" + tracker + "Desliza para avisar" (única acción permitida: MARK_READY).
 *  - READY: "Pedido notificado" + estado de la confirmación del cliente (ack) + tarjeta plegable.
 * Línea de tiempo del aviso (t0 = el negocio completa el deslizamiento): ver INSTRUCCIONES §Secuencia.
 */

/**
 * Tarjeta del NEGOCIO para pedidos en IN_PROGRESS y READY (diseño R, aprobado). Reemplaza el bloque genérico
 * ("Condiciones aceptadas" + CoordinationActions) SOLO para el negocio y SOLO en esos dos estados.
 *  - IN_PROGRESS: "Preparando el pedido" + tracker + "Desliza para avisar" (única acción permitida: MARK_READY).
 *  - READY: "Pedido notificado" + estado de la confirmación del cliente (ack) + tarjeta plegable.
 * Línea de tiempo del aviso (t0 = el negocio completa el deslizamiento): ver INSTRUCCIONES §Secuencia.
 */
import type {BusinessProgressCardModel} from './application/useBusinessProgressCardController';
export default function BusinessProgressCardView({model}:{model:BusinessProgressCardModel}){
 const closure=useBusinessClosure(model);
 return <CloseRequestContext.Provider value={closure}><BusinessProgressContent model={model}/></CloseRequestContext.Provider>;
}
function BusinessProgressContent({model}:{model:BusinessProgressCardModel}){
const {accepted,acceptedAt,ack,allowed,client,colSub,colTitle,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,embedded,explanation,folded,image,isUnread,motionRef,negotiated,noteId,notify,onInspect,operation,order,pending,phase,price,process,ready,received,recoveryOnly,refresh,service,setFolded,setSheet,sheet,statusLabel,title}=model;
const closeAvailable=useCloseRequestAvailable(embedded);
// Una composición para el producto en curso, con textos y controles propios de cada modalidad.
// Listo, recibido, servicios, pedidos sin modalidad y tarjetas embebidas conservan su composición.
// Retiro en el local: A = reserva confirmada con pago previo, B = sin reserva activa (diseño aprobado). Rol, estado, modalidad y reserva se comprueban aquí.
const pickupVariant=process?.state==='IN_PROGRESS'&&!ready&&!received&&!service&&!embedded&&process.availability?.path==='LOCAL_PICKUP'?pickupDetailVariant(process):null;
if(pickupVariant)return <BusinessPickupCard model={model} variant={pickupVariant}/>;
if(process?.state==='IN_PROGRESS'&&!ready&&!received&&!service&&!embedded&&['WHATSAPP','LOCAL_PICKUP'].includes(process.availability?.path??''))return <BusinessInProgressCard model={model}/>;
return <article ref={motionRef} tabIndex={0} id={embedded?undefined:`order-${order.id}`} data-coordination-embedded={embedded||undefined} data-close-request={closeAvailable.available||undefined} aria-label={`${client}: ${ready ? 'pedido notificado' : 'pedido en curso'}`} className="zipco-co-dk zipco-ec-dk scroll-mb-36" onClick={event => event.stopPropagation()}>
    <span className="zipco-co-a1" aria-hidden="true" /><span className="zipco-co-a2" aria-hidden="true" />
    <div style={{ position: 'relative' }}>
      <ProgressCardHeader business name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread} ready={ready} />

      <div className="zipco-co-fb" data-folded={folded} aria-hidden={folded} ref={element=>{if(element)element.inert=folded;}}><div className="zipco-co-fb-in">
        <button type="button" className="zipco-co-strip2" aria-haspopup="dialog" style={{ marginTop: 12 }} onClick={() => setSheet('cond')}>
          <span className="zipco-co-strip2-ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true" /></span>
          <span style={{ minWidth: 0 }}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
          <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
        </button>

        <section className="zipco-ec" aria-label="Estado del pedido">
          <div className="zipco-ec-h">Estado del pedido</div>
          <div className="zipco-ec-top">
            <div className="zipco-ec-orbw">
              <span className={`zipco-ec-orb${ready ? ' d' : ''}`}><span className="zipco-ec-ring" />
                <span className="zipco-ec-ico" style={ready ? { animation: 'none' } : undefined}>{ready ? <PackageCheck size={26} strokeWidth={2.1} aria-hidden="true" /> : <Package size={24} strokeWidth={2.1} aria-hidden="true" />}</span></span>
              <i className="zipco-ec-tw" style={{ top: -6, right: -4, animationDelay: '.2s' }} /><i className="zipco-ec-tw" style={{ top: 6, left: -10, animationDelay: '1.1s', width: 4, height: 4 }} /><i className="zipco-ec-tw" style={{ bottom: -8, right: 4, animationDelay: '1.7s', width: 5, height: 5 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="zipco-ec-t">{title}</div>
              <div className="zipco-ec-s">{received?'El cliente indicó que recibió el producto. Solo falta finalizar.':ready ? <>Aviso enviado a <b>{client}</b>.</> : <>Cuando esté listo, avísale a <b>{client}</b>.</>}</div>
            </div>
          </div>

          <div className="zipco-ec-trk"><span className="zipco-ec-line"><i className="zipco-ec-fill" style={{ ['--w' as string]: ready ? '100%' : '66.67%' }} /></span>
            <span className="zipco-ec-nd done"><Check size={14} strokeWidth={3.4} aria-hidden="true" /></span>
            <span className="zipco-ec-nd done"><Check size={14} strokeWidth={3.4} aria-hidden="true" /></span>
            {ready ? <span className="zipco-ec-nd done pop"><Check size={14} strokeWidth={3.4} aria-hidden="true" /></span> : <span className="zipco-ec-nd act"><Package size={14} strokeWidth={2.6} aria-hidden="true" /></span>}
            {ready ? <span className="zipco-ec-nd done pop"><PackageCheck size={14} strokeWidth={2.6} aria-hidden="true" /></span> : <span className="zipco-ec-nd lock"><PackageCheck size={14} strokeWidth={2.4} aria-hidden="true" /></span>}
          </div>
          <div className="zipco-ec-lbl"><span>Aceptado</span><span>Coordinado</span>
            <span style={{ color: ready ? '#6ee7b7' : '#5eead4' }}>{ready ? 'Preparado' : 'Preparando'}</span><span style={{ color: ready ? '#6ee7b7' : '#94a3b8' }}>Listo</span></div>

          {operation.message && <p role="alert" className="zipco-co-co2-p" style={{ marginTop: 12 }}>{operation.message}</p>}

          {recoveryOnly ? <div style={{ marginTop: 12 }}>
            <p role="alert" className="zipco-co-co2-p" style={{ margin: 0 }}>{operation.storageWarning() || (operation.restored()
              ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
            <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
          </div> : pending ? <div style={{ marginTop: 12 }}>
            <p className="zipco-co-co2-p" style={{ margin: 0 }}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
            <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
          </div> : !ready ? <>
            <SlideToNotify phase={phase} disabled={!allowed || operation.busy || closeAvailable.busy} onComplete={() => void notify()} describedBy={noteId} />
            <div className="zipco-ec-note" id={noteId}>{allowed ? (service ? 'El cliente recibirá un aviso de que el servicio está listo.' : 'El cliente recibirá un aviso para coordinar el retiro.') : 'Actualiza el pedido para continuar.'}</div>
          </> : <div className="zipco-ec-st" role="status">
            {service || ack === true
              ? <span className="zipco-ec-st-ic ok"><Check size={17} strokeWidth={3.2} aria-hidden="true" /></span>
              : <span className="zipco-ec-st-ic w"><Hourglass size={17} strokeWidth={2.3} aria-hidden="true" /></span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              {received?<><div className="zipco-ec-st-t">Producto recibido</div><div className="zipco-ec-st-s">Pendiente de finalizar por el cliente.</div></>:service ? <><div className="zipco-ec-st-t">Cliente avisado</div><div className="zipco-ec-st-s">Verá el servicio como listo.</div></>
                : ack === true ? <><div className="zipco-ec-st-t">El cliente confirmó el aviso</div><div className="zipco-ec-st-s">Pendiente de retiro.</div></>
                  : ack === false ? <div className="zipco-ec-st-t">Esperando confirmación del cliente<span className="zipco-ec-dots" aria-hidden="true"><i /><i /><i /></span></div>
                    : <><div className="zipco-ec-st-t">No pudimos leer el estado del aviso</div>
                      <button type="button" className="zipco-co-go2" style={{ marginTop: 8 }} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado del aviso</button></>}
            </div>
          </div>}
        </section>

        {availabilityFlow(process)&&<AvailabilityPostActions order={order} business refresh={refresh}/>}
        <CloseRequest model={model} />
        <button type="button" className="zipco-co-fold" style={{ marginTop: 12 }} aria-expanded={!folded} onClick={() => setFolded(true)}><ChevronUp size={16} strokeWidth={2.8} aria-hidden="true" />Ocultar tarjeta</button>
      </div></div>

      <button type="button" className="zipco-co-colrow" data-folded={folded} aria-expanded={!folded} aria-hidden={!folded} tabIndex={folded ? 0 : -1} onClick={() => { onInspect?.(); setFolded(false); }}
        style={{ ['--att' as string]: ready ? 0 : 1 }}>
        <span className="nd" aria-hidden="true">{ready ? <Check size={16} strokeWidth={3.4} /> : <Package size={15} strokeWidth={2.4} />}</span>
        <span className="tx"><b>{colTitle}</b><small>{colSub}</small></span>
        <span className="chev"><ChevronDown size={15} strokeWidth={2.8} aria-hidden="true" /><span className="sr-only">Mostrar estado del pedido</span></span>
      </button>
    </div>

    <ConditionsSheet fullAgreement open={sheet === 'cond'} onOpenChange={value => setSheet(value ? 'cond' : null)} accepted={accepted}
      title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation}
      explanationLabel={negotiated ? 'Explicación de la propuesta aceptada' : 'Nota del cliente'}
      onOpenAgreement={() => setSheet('agree')} />
    <AgreementSheet open={sheet === 'agree'} onOpenChange={value => setSheet(value ? 'agree' : null)} processId={process?.id} client={client} accepted={accepted} acceptedAt={acceptedAt} />
  </article>;

}

/** Producto en curso del negocio, WhatsApp/retiro. Una composición, datos y acciones originales. */
function BusinessInProgressCard({model}:{model:BusinessProgressCardModel}){
const {accepted,acceptedAt,allowed,client,colSub,colTitle,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,explanation,folded,image,isUnread,motionRef,negotiated,noteId,notify,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refresh,setFolded,setSheet,sheet,statusLabel,title}=model;
const detailId=`business-progress-detail-${order.id}`;
const toggle=()=>{onInspect?.();setFolded(value=>!value);};
const recovery=!!(recoveryOnly||pending||operation.message);
const closeAvailable=useCloseRequestAvailable(false);
const pickup=process?.availability?.path==='LOCAL_PICKUP';
return <article ref={motionRef} tabIndex={0} id={`order-${order.id}`} data-close-request={closeAvailable.available||undefined} data-bp-recovery={recovery||undefined} aria-label={`${client}: pedido en curso`} className="zipco-co-dk zipco-ec-dk zipco-bp scroll-mb-36"
    onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); toggle(); } }}
    onClick={event => event.stopPropagation()}>
    <span className="zipco-bp-glow zipco-bp-ga" aria-hidden="true" /><span className="zipco-bp-glow zipco-bp-gb" aria-hidden="true" />
    <div style={{ position: 'relative' }}>
      <ProgressCardHeader variant="business-progress" channel={pickup?'LOCAL_PICKUP':'WHATSAPP'} business name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread} folded={folded} detailId={detailId} onToggle={toggle} />

      <div id={detailId} className="zipco-co-fb zipco-bp-fold" data-folded={folded} aria-hidden={folded} ref={element=>{if(element)element.inert=folded;}}><div className="zipco-co-fb-in"><div className="zipco-bp-dt">
        <section className="zipco-bp-panel" aria-label="Estado del pedido">
          <div className="zipco-bp-t zipco-bp-sr">{title}</div>

          {operation.message && <p role="alert" className="zipco-co-co2-p zipco-bp-alert">{operation.message}</p>}

          {recoveryOnly ? <div className="zipco-bp-rec">
            <p role="alert" className="zipco-co-co2-p" style={{ margin: 0 }}>{operation.storageWarning() || (operation.restored()
              ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
            <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
          </div> : pending ? <div className="zipco-bp-rec">
            <p className="zipco-co-co2-p" style={{ margin: 0 }}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
            <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
          </div> : <>
            <div className="zipco-bp-q"><span className="zipco-bp-orb" aria-hidden="true"><i /><span><Package size={14} strokeWidth={2.1} /></span></span><div className="zipco-bp-qt"><b>¿Ya está listo el pedido?</b><span>Desliza para avisar a <em>{client}</em></span></div></div>
            <SlideToNotify phase={phase} disabled={!allowed || operation.busy || closeAvailable.busy} onComplete={() => void notify()} describedBy={noteId} />
            <div className="zipco-ec-note" id={noteId}>{allowed ? 'El cliente recibirá un aviso para coordinar el retiro.' : 'Actualiza el pedido para continuar.'}</div>
          </>}

          <div className="zipco-bp-trk" aria-hidden="true">
            <span className="zipco-bp-line"><i className="zipco-bp-fill" /></span>
            <span className="zipco-bp-nd done"><Check size={9} strokeWidth={3.6} /></span>
            <span className="zipco-bp-nd done"><Check size={9} strokeWidth={3.6} /></span>
            <span className="zipco-bp-nd act" />
            <span className="zipco-bp-nd lock" />
          </div>
          <div className="zipco-bp-lbl"><span>Aceptado</span><span>Coordinado</span><span className="on">Preparando</span><span>Listo</span></div>
        </section>

        <button type="button" className="zipco-co-strip2 zipco-bp-cond" aria-haspopup="dialog" onClick={() => setSheet('cond')}>
          <span className="zipco-bp-ico"><CircleCheck size={16} strokeWidth={2.4} aria-hidden="true" /></span>
          <span style={{ minWidth: 0 }}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
          <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
        </button>

        {availabilityFlow(process) && <div className={pickup?undefined:'zipco-bp-opts'}><AvailabilityPostActions order={order} business refresh={refresh} /></div>}
        <CloseRequest model={model} />
        <p className="zipco-bp-legal">ZIPCO no procesa ni verifica pagos.</p>
        <button type="button" className="zipco-co-fold zipco-bp-hide" aria-expanded={!folded} onClick={() => setFolded(true)}><ChevronUp size={14} strokeWidth={2.8} aria-hidden="true" />Ocultar tarjeta</button>
      </div></div></div>

      <button type="button" className="zipco-co-colrow zipco-bp-next" data-folded={folded} data-cta={recovery ? undefined : true} data-recovery={recovery || undefined} aria-expanded={!folded} aria-controls={detailId} aria-hidden={!folded} tabIndex={folded ? 0 : -1}
        onClick={() => { onInspect?.(); setFolded(false); }} style={{ ['--att' as string]: 1 }}>
        <span className="nd" aria-hidden="true">{recovery ? '!' : <Package size={17} strokeWidth={2.4} />}</span>
        <span className="tx"><b>{recovery ? 'Operación por resolver' : colTitle}</b><small>{recovery ? 'Toca aquí para actualizar o reintentar' : colSub}</small>{!recovery && <span className="zipco-bp-sg" aria-hidden="true"><i className="d" /><i className="d" /><i className="a" /><i /></span>}</span>
        <span className="chev"><span className="zipco-bp-go" aria-hidden="true"><ProgressTapHand /></span><span className="sr-only">Mostrar estado del pedido</span></span>
      </button>
    </div>

    <ConditionsSheet fullAgreement open={sheet === 'cond'} onOpenChange={value => setSheet(value ? 'cond' : null)} accepted={accepted}
      title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation}
      explanationLabel={negotiated ? 'Explicación de la propuesta aceptada' : 'Nota del cliente'}
      onOpenAgreement={() => setSheet('agree')} />
    <AgreementSheet open={sheet === 'agree'} onOpenChange={value => setSheet(value ? 'agree' : null)} processId={process?.id} client={client} accepted={accepted} acceptedAt={acceptedAt} />
  </article>;
}

/** Total y reserva en pesos chilenos, igual que el resto de las tarjetas. */
const clp=(value:number)=>`$${value.toLocaleString('es-CL')}`;

/** Texto largo con «Ver más / Ver menos». El texto completo siempre está en el DOM; solo se recorta a 2 líneas. */
function ClampText({text,className}:{text:string;className?:string}){
const [open,setOpen]=useState(false);
const long=text.length>60;
return <>
  <p className={`zipco-pk-cl${className?` ${className}`:''}`} data-c={long&&!open?'true':undefined}>{text}</p>
  {long&&<button type="button" className="zipco-pk-lm" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?'Ver menos':'Ver más'}</button>}
</>;
}

/** Bloque de contacto del negocio: usa las piezas reales (texto de consentimiento, Autorizo…, Retirar mi permiso…). */
function PickupContactBox({children}:{children:React.ReactNode}){
const [open,setOpen]=useState(false);
return <section className="zipco-pk-ct" aria-label="Contacto" data-c={open?undefined:'true'}>
  <span className="zipco-pk-ct-ic" aria-hidden="true"><ShieldCheck size={17} strokeWidth={2.3} /></span>
  <div className="zipco-pk-ct-in"><span className="zipco-pk-lab">CONTACTO · TU TELÉFONO PARA ESTE PEDIDO</span>{children}
    <button type="button" className="zipco-pk-lm" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?'Ver menos':'Ver más'}</button></div>
</section>;
}

/** Variante A: reserva confirmada con pago previo. Datos reales de ReservationPanel (parts.pickup); nada se calcula aquí. */
function PickupConfirmedDetail({rp,total,instructions,contact,cancel,alertsHost}:{rp:ReservationPanelParts;total:string|null;instructions:React.ReactNode;contact:React.ReactNode;cancel:React.ReactNode;alertsHost:HTMLElement|null}){
const [conditions,setConditions]=useState(false),[more,setMore]=useState(false);
const pk=rp.pickup;
const alerts=alertsHost?createPortal(<div className="zipco-pk-al">{rp.error}</div>,alertsHost):null;
if(!pk)return <>{<section className="zipco-pk-rv" aria-label="Reserva">{rp.notices}</section>}{instructions}{contact}{rp.options.length>0&&<div className="zipco-pk-mol">{rp.options}</div>}{cancel}{alerts}</>;
return <>
  <section className="zipco-pk-rv" aria-label="Reserva confirmada">
    <div className="zipco-pk-rv-h">
      <span className="zipco-pk-rv-o" aria-hidden="true"><Check size={20} strokeWidth={3} /></span>
      <div className="zipco-pk-rv-t"><span className="zipco-pk-lab">RESERVA</span><h4>{pk.title}</h4><p>{pk.subtitle}</p></div>
      <button type="button" className="zipco-pk-rv-b" aria-expanded={conditions} aria-label="Condiciones originales de la oferta" onClick={()=>setConditions(value=>!value)}><Info size={18} strokeWidth={2.3} aria-hidden="true" /></button>
      <button type="button" className="zipco-pk-rv-b" disabled={pk.refresh.busy} aria-busy={pk.refresh.busy||undefined} onClick={pk.refresh.onClick}><RefreshCw size={18} strokeWidth={2.3} aria-hidden="true" /><span className="zipco-pk-sr">Actualizar reserva</span></button>
    </div>
    {conditions&&<div className="zipco-pk-oc-b"><span className="zipco-pk-lab">CONDICIONES ORIGINALES · YA NO ES UNA TAREA PENDIENTE</span>{pk.offer}</div>}
    <div className="zipco-pk-mn">
      {total&&<div><small>TOTAL ACORDADO</small><b>{total}</b></div>}
      {pk.reservedAmountClp!=null&&<div className="zipco-pk-res"><small>RESERVA · PAGO PREVIO</small><b>{clp(pk.reservedAmountClp)}</b></div>}
    </div>
    <ul className="zipco-pk-fx">
      {pk.pickupBy&&<li><i aria-hidden="true"><Clock size={14} strokeWidth={2.4} /></i><span>{pk.pickupLabel} <b>{pk.pickupBy}</b></span></li>}
      {pk.confirmedAt&&<li><i aria-hidden="true"><Check size={14} strokeWidth={2.6} /></i><span>{pk.confirmedAutomatically?'Registrada automáticamente':'Apartado confirmado'}<b>{pk.confirmedAt}</b></span></li>}
      {pk.declaredAmountClp!=null&&<li className="zipco-pk-decl"><i aria-hidden="true"><Receipt size={14} strokeWidth={2.4} /></i><span>Declaraste recibido <b>{clp(pk.declaredAmountClp)}</b><em>ZIPCO no verificó la transferencia.</em></span></li>}
    </ul>
    {pk.note&&<blockquote className="zipco-pk-nq"><small><Quote size={12} strokeWidth={2.4} aria-hidden="true" />NOTA DE RESERVA DEL CLIENTE</small><ClampText text={pk.note} /></blockquote>}
  </section>
  {instructions}
  {contact}
  {(pk.whatsapp||rp.options.length>0||pk.waNotice)&&<div className="zipco-pk-ac">
    <div className="zipco-pk-acr">
      {pk.whatsapp&&<button type="button" className="zipco-pk-wa" disabled={pk.whatsapp.busy} aria-busy={pk.whatsapp.busy||undefined} onClick={pk.whatsapp.onClick}><i aria-hidden="true">{pk.whatsapp.busy?<span className="zipco-pk-sp" />:<WhatsAppMark className="h-4 w-4" />}</i><span>{pk.whatsapp.busy?'Guardando…':pk.whatsapp.label}</span></button>}
      {rp.options.length>0&&<button type="button" className="zipco-pk-mh" aria-expanded={more} onClick={()=>setMore(value=>!value)}>Más opciones<span className="n" aria-hidden="true">{rp.options.length}</span><span className="cv" aria-hidden="true"><ChevronDown size={14} strokeWidth={2.8} /></span></button>}
    </div>
    {pk.waNotice&&<div className="zipco-pk-wn">{pk.waNotice}</div>}
    {more&&<div className="zipco-pk-mol">{rp.options}</div>}
  </div>}
  {cancel}
  <p className="zipco-pk-lg">ZIPCO no procesa ni verifica pagos.</p>
  {alerts}
</>;
}

/** Retiro en el local · En curso · negocio. A = reserva confirmada con pago previo, B = sin reserva activa.
 *  Abrir con la manita llega hasta «Condiciones aceptadas»; «Ver detalle de solicitud» sube una hoja sobre TODA la tarjeta. Abrir o cerrar no guarda nada. */
function BusinessPickupCard({model,variant}:{model:BusinessProgressCardModel;variant:'A'|'B'}){
const {accepted,acceptedAt,allowed,client,colSub,colTitle,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,explanation,folded,image,isUnread,motionRef,negotiated,noteId,notify,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refresh,setFolded,setSheet,sheet,statusLabel,title}=model;
const detailId=`business-progress-detail-${order.id}`,sheetId=`business-pickup-sheet-${order.id}`;
const toggle=()=>{onInspect?.();setFolded(value=>!value);};
const recovery=!!(recoveryOnly||pending||operation.message);
const closeAvailable=useCloseRequestAvailable(false);
const [detail,setDetail]=useState(false),[closing,setClosing]=useState(false);
const [sheetHost,setSheetHost]=useState<HTMLElement|null>(null),[alertsHost,setAlertsHost]=useState<HTMLElement|null>(null);
const openerRef=useRef<HTMLButtonElement|null>(null),titleRef=useRef<HTMLHeadingElement|null>(null),timerRef=useRef<number|undefined>(undefined),mountedRef=useRef(false);
// Plegar la tarjeta también cierra la hoja. Nada se envía.
useEffect(()=>{if(folded){setDetail(false);setClosing(false);}},[folded]);
// Foco: al abrir va al título de la hoja; al cerrar vuelve a «Ver detalle de solicitud».
useEffect(()=>{if(!mountedRef.current){mountedRef.current=true;return;}if(detail)titleRef.current?.focus({preventScroll:true});else openerRef.current?.focus({preventScroll:true});},[detail]);
useEffect(()=>()=>window.clearTimeout(timerRef.current),[]);
// Escape cierra la hoja. Listener nativo: el contenido va por portal y sus eventos de React no pasan por el <aside>.
const closeRef=useRef<()=>void>(()=>{});
useEffect(()=>{
  if(!detail)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key!=='Escape'||event.defaultPrevented)return;const host=document.getElementById(sheetId);if(host&&event.target instanceof Node&&host.contains(event.target)){event.stopPropagation();closeRef.current();}};
  document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);
},[detail,sheetId]);
const openDetail=()=>{window.clearTimeout(timerRef.current);setClosing(false);setDetail(true);};
const closeDetail=()=>{
  if(closing)return;
  if(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){setDetail(false);return;}
  setClosing(true);timerRef.current=window.setTimeout(()=>{setDetail(false);setClosing(false);},220);
};
closeRef.current=closeDetail;
const A=variant==='A';
const offer=process?.availability?.reservationOffer;
const reserved=A&&offer&&offer.mode==='PREPAYMENT'?offer.requiredAmountClp:null;
const declared=A?process?.reservation?.paymentReceiptDeclaration?.amountClp:undefined;
const product=String(conditionsSummary??'').split(' · ')[0];
const priceValue:unknown=price;
const total=typeof priceValue==='number'?clp(priceValue):typeof priceValue==='string'&&priceValue.trim()?priceValue:null;
const summary=A?(reserved!=null?`Reserva confirmada · ${clp(reserved)} · pago previo`:'Reserva confirmada · pago previo'):'Instrucciones · contacto · opciones';
// Piezas reales que se colocan en la hoja. Alertas y errores salen SIEMPRE fuera de la hoja (pie de la tarjeta), plegada o no.
const renderParts=(parts:AvailabilityPostActionParts|null)=>{
  if(!parts)return null;
  const instructions=parts.has.instructions?<section className="zipco-pk-pi" aria-label="Instrucciones de retiro"><i aria-hidden="true"><Store size={17} strokeWidth={2.3} /></i><div className="zipco-pk-pi-in"><span className="zipco-pk-lab">INSTRUCCIONES DE RETIRO</span>{parts.instructions}</div></section>:null;
  const contact=parts.has.contact?<PickupContactBox>{parts.contact}</PickupContactBox>:null;
  const cancel=parts.has.cancel?<div className="zipco-pk-cz">{parts.cancel}</div>:null;
  const body=A
    ?<ReservationPanel order={order} business refresh={refresh} render={rp=><PickupConfirmedDetail rp={rp} total={total} instructions={instructions} contact={contact} cancel={cancel} alertsHost={alertsHost} />} />
    :<>{instructions}{contact}{cancel}<p className="zipco-pk-lg">ZIPCO no procesa ni verifica pagos.</p></>;
  return <>{sheetHost&&createPortal(body,sheetHost)}{alertsHost&&parts.has.alerts&&createPortal(<div className="zipco-pk-al">{parts.alerts}</div>,alertsHost)}</>;
};
return <article ref={motionRef} tabIndex={0} id={`order-${order.id}`} data-close-request={closeAvailable.available||undefined} data-bp-recovery={recovery||undefined} data-pk={variant} aria-label={`${client}: pedido en curso`} className="zipco-co-dk zipco-ec-dk zipco-bp zipco-pk scroll-mb-36"
    onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); toggle(); } }}
    onClick={event => event.stopPropagation()}>
    <div className="zipco-pk-stack">
    <div className="zipco-pk-main" ref={element=>{if(element)element.inert=detail;}} aria-hidden={detail||undefined}>
    <span className="zipco-bp-glow zipco-bp-ga" aria-hidden="true" /><span className="zipco-bp-glow zipco-bp-gb" aria-hidden="true" />
    <div style={{ position: 'relative' }}>
      <ProgressCardHeader variant="business-progress" channel="LOCAL_PICKUP" business name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread} folded={folded} detailId={detailId} onToggle={toggle} />

      <div id={detailId} className="zipco-co-fb zipco-bp-fold" data-folded={folded} aria-hidden={folded} ref={element=>{if(element)element.inert=folded;}}><div className="zipco-co-fb-in"><div className="zipco-bp-dt">
        {A&&reserved!=null&&<div className="zipco-pk-rs" role="group" aria-label="Reserva del producto">
          <span className="zipco-pk-rs-ic" aria-hidden="true"><ShieldCheck size={15} strokeWidth={2.4} /></span>
          <span className="zipco-pk-rs-l"><small>RESERVADO</small><b>{product}</b><em>{declared!=null?'Pago previo declarado por ti':'Pago previo sin declarar'}</em></span>
          <span className="zipco-pk-rs-r"><small>RESERVA</small><b>{clp(reserved)}</b></span>
        </div>}
        <section className="zipco-bp-panel" aria-label="Estado del pedido">
          <div className="zipco-bp-t zipco-bp-sr">{title}</div>

          {operation.message && <p role="alert" className="zipco-co-co2-p zipco-bp-alert">{operation.message}</p>}

          {recoveryOnly ? <div className="zipco-bp-rec">
            <p role="alert" className="zipco-co-co2-p" style={{ margin: 0 }}>{operation.storageWarning() || (operation.restored()
              ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
            <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
          </div> : pending ? <div className="zipco-bp-rec">
            <p className="zipco-co-co2-p" style={{ margin: 0 }}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
            <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
          </div> : <>
            <div className="zipco-bp-q"><span className="zipco-bp-orb" aria-hidden="true"><i /><span><Package size={14} strokeWidth={2.1} /></span></span><div className="zipco-bp-qt">
              {A?<><b>¿Ya está listo para retiro?</b><span>Si ya apartaste este producto para <em>{client}</em>, desliza para avisarle</span></>
                :<><b>¿Ya puede acercarse al local?</b><span>Desliza para avisar a <em>{client}</em></span></>}</div></div>
            <SlideToNotify phase={phase} disabled={!allowed || operation.busy || closeAvailable.busy} onComplete={() => void notify()} describedBy={noteId} />
            <div className="zipco-ec-note" id={noteId}>{allowed ? 'El cliente recibirá un aviso para coordinar el retiro.' : 'Actualiza el pedido para continuar.'}</div>
          </>}

          <div className="zipco-bp-trk" aria-hidden="true">
            <span className="zipco-bp-line"><i className="zipco-bp-fill" /></span>
            <span className="zipco-bp-nd done"><Check size={9} strokeWidth={3.6} /></span>
            <span className="zipco-bp-nd done"><Check size={9} strokeWidth={3.6} /></span>
            <span className="zipco-bp-nd act" />
            <span className="zipco-bp-nd lock" />
          </div>
          <div className="zipco-bp-lbl"><span>Aceptado</span><span>Coordinado</span><span className="on">Preparando</span><span>Listo</span></div>
        </section>

        <button type="button" className="zipco-co-strip2 zipco-bp-cond" aria-haspopup="dialog" onClick={() => setSheet('cond')}>
          <span className="zipco-bp-ico"><CircleCheck size={16} strokeWidth={2.4} aria-hidden="true" /></span>
          <span style={{ minWidth: 0 }}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
          <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
        </button>

        <button type="button" ref={openerRef} className="zipco-pk-vd" aria-expanded={detail} aria-controls={sheetId} onClick={openDetail}>
          <i aria-hidden="true"><ListChecks size={17} strokeWidth={2.3} /></i>
          <span><b>Ver detalle de solicitud</b><small>{summary}</small></span>
          <span className="cv" aria-hidden="true"><ChevronUp size={16} strokeWidth={2.8} /></span>
        </button>
        <div className="zipco-pk-ft"><span>ZIPCO no procesa ni verifica pagos.</span>
          <button type="button" className="zipco-co-fold zipco-bp-hide" aria-expanded={!folded} onClick={() => setFolded(true)}><ChevronUp size={14} strokeWidth={2.8} aria-hidden="true" />Ocultar tarjeta</button></div>
      </div></div></div>

      <button type="button" className="zipco-co-colrow zipco-bp-next" data-folded={folded} data-cta={recovery ? undefined : true} data-recovery={recovery || undefined} aria-expanded={!folded} aria-controls={detailId} aria-hidden={!folded} tabIndex={folded ? 0 : -1}
        onClick={() => { onInspect?.(); setFolded(false); }} style={{ ['--att' as string]: 1 }}>
        <span className="nd" aria-hidden="true">{recovery ? '!' : <Package size={17} strokeWidth={2.4} />}</span>
        <span className="tx"><b>{recovery ? 'Operación por resolver' : colTitle}</b><small>{recovery ? 'Toca aquí para actualizar o reintentar' : colSub}</small>{!recovery && <span className="zipco-bp-sg" aria-hidden="true"><i className="d" /><i className="d" /><i className="a" /><i /></span>}</span>
        <span className="chev"><span className="zipco-bp-go" aria-hidden="true"><ProgressTapHand /></span><span className="sr-only">Mostrar estado del pedido</span></span>
      </button>
    </div>
    </div>

    <aside id={sheetId} className="zipco-pk-sheet" hidden={!detail} data-closing={closing||undefined} aria-label="Detalle de solicitud">
      <div className="zipco-pk-sh-h">
        <span><h3 ref={titleRef} tabIndex={-1}>Detalle de solicitud</h3><small>{client}{total?` · ${total}`:''}</small></span>
        <button type="button" className="zipco-pk-xd" aria-expanded={detail} aria-controls={sheetId} onClick={closeDetail}>Ocultar detalle<ChevronDown size={15} strokeWidth={2.6} aria-hidden="true" /></button>
      </div>
      <div className="zipco-pk-dt" ref={setSheetHost} />
    </aside>
    </div>

    {/* Avisos, errores y recuperación: siempre visibles, con la hoja abierta o cerrada. */}
    <div className="zipco-pk-alerts" ref={setAlertsHost} />
    {/* Las piezas reales (instrucciones, contacto, cancelar, diálogos) siguen montadas aunque la hoja esté cerrada. */}
    <AvailabilityPostActions order={order} business refresh={refresh} render={renderParts} />
    <CloseRequest model={model} />

    <ConditionsSheet fullAgreement open={sheet === 'cond'} onOpenChange={value => setSheet(value ? 'cond' : null)} accepted={accepted}
      title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation}
      explanationLabel={negotiated ? 'Explicación de la propuesta aceptada' : 'Nota del cliente'}
      onOpenAgreement={() => setSheet('agree')} />
    <AgreementSheet open={sheet === 'agree'} onOpenChange={value => setSheet(value ? 'agree' : null)} processId={process?.id} client={client} accepted={accepted} acceptedAt={acceptedAt} />
  </article>;
}
