import * as React from 'react';
import { ProgressCardHeader } from "../../shared/layout/ProgressCardShell";
import AvailabilityPostActions from "../../shared/availability/AvailabilityPostActions";
import { availabilityFlow } from "../../../domain/availabilityContract";


import { Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, Hourglass, Package, PackageCheck } from 'lucide-react';



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
const {accepted,acceptedAt,ack,allowed,client,colSub,colTitle,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,embedded,explanation,folded,image,isUnread,motionRef,negotiated,noteId,notify,onInspect,operation,order,pending,phase,price,process,ready,received,recoveryOnly,refresh,service,setFolded,setSheet,sheet,statusLabel,title}=model;
return <article ref={motionRef} tabIndex={0} id={embedded?undefined:`order-${order.id}`} data-coordination-embedded={embedded||undefined} aria-label={`${client}: ${ready ? 'pedido notificado' : 'pedido en curso'}`} className="zipco-co-dk zipco-ec-dk scroll-mb-36" onClick={event => event.stopPropagation()}>
    <span className="zipco-co-a1" aria-hidden="true" /><span className="zipco-co-a2" aria-hidden="true" />
    <div style={{ position: 'relative' }}>
      <ProgressCardHeader business name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread} ready={ready} />

      <div className="zipco-co-fb" data-folded={folded} aria-hidden={folded} {...(folded ? { inert: '' } : {})}><div className="zipco-co-fb-in">
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
            <SlideToNotify phase={phase} disabled={!allowed || operation.busy} onComplete={() => void notify()} describedBy={noteId} />
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
