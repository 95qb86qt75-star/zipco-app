import { when, vars, Sparks } from "../../../shared/coordination/CoordinationVisualPrimitives";
import CustomerStepsSheet from "./CustomerStepsSheet";
import * as React from 'react';
import AvailabilityPostActions from "../../../shared/availability/AvailabilityPostActions";
import { availabilityFlow, CONTACT_COPY } from "../../../../domain/availabilityContract";
import { Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, LockKeyhole, ShieldCheck, Trash2 } from 'lucide-react';
import { CoordinationCardHeader } from "../../../shared/coordination/CoordinationCardShell";
import WhatsAppMark from "../../../../shared/icons/WhatsAppMark";
import { RAIL_SPARKS } from "../../../shared/coordination/coordinationSparks";


import "./customer-initial-coordination.css";

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
import type { BusinessCoordinationCardModel } from "../../../shared/coordination/application/useBusinessCoordinationCardController";
/** Complete canonical composition for this coordination variant. */
export default function CustomerInitialCoordinationCard({model}:{model:Pick<BusinessCoordinationCardModel,"accepted"|"acceptedAt"|"allowed"|"authorized"|"canOpen"|"client"|"conditionsSummary"|"counterpartPending"|"deferred"|"dialogs"|"folded"|"fresh"|"go"|"image"|"isUnread"|"motionRef"|"negotiated"|"onInspect"|"operation"|"order"|"pending"|"phase"|"price"|"process"|"recoveryOnly"|"refocus"|"refresh"|"setDeferred"|"setFolded"|"setSheet"|"sheet"|"statusLabel"|"stepsTrigger"|"unlock">&{step2Done:BusinessCoordinationCardModel["authorized"];waLabel:string}}){
const {accepted,acceptedAt,allowed,authorized,canOpen,client,conditionsSummary,counterpartPending,deferred,dialogs,folded,fresh,go,image,isUnread,motionRef,negotiated,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refocus,refresh,setDeferred,setFolded,setSheet,sheet,statusLabel,step2Done,stepsTrigger,unlock,waLabel}=model;

    const whatsappReady=phase==='ready'&&canOpen;
    const qty=accepted.subjectSnapshot.items.reduce((total,item)=>total+item.quantity,0);
    const stepNumber=phase==='idle'||phase==='requesting'?2:3;
    const acceptedLabel=negotiated?'Propuesta aceptada':'Aceptado';
    const authorizeBlocked=operation.busy||!allowed('AUTHORIZE_CONTACT');
    const consentCopy=availabilityFlow(process)?CONTACT_COPY:<>Autorizas compartir con {client} el teléfono de tu perfil solo para este pedido. El consentimiento del negocio es independiente.</>;
    const action=recoveryOnly?<div className="zipco-ci-recovery">
        <p role="alert" className="zipco-co-co2-p">{operation.storageWarning()||(operation.restored()?'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.':'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
        <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>
      </div>:pending?<div className="zipco-ci-recovery">
        <p className="zipco-co-co2-p">Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
        <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button>
      </div>:!step2Done?(deferred?
        <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>setDeferred(false)}>Revisar autorización de contacto</button>:<>
        <div className="zipco-co-wrapb"><Sparks />
          <button type="button" className="zipco-contact-consent" disabled={authorizeBlocked} onClick={()=>void unlock()}>
            <span className="zipco-contact-consent-icon"><WhatsAppMark className="h-[22px] w-[22px]" /></span><span>{phase==='requesting'?'Autorizando contacto…':'Autorizo iniciar coordinación'}</span>
          </button>
        </div>
        <p className="zipco-co-sm zipco-ci-help">{consentCopy}</p>
        <button type="button" className="zipco-ci-lnk" disabled={operation.busy} onClick={()=>setDeferred(true)}>Ahora no</button>
        {!allowed('AUTHORIZE_CONTACT')&&<button type="button" className="zipco-ci-lnk" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>}
      </>):phase==='loading'?<>
        <div className="zipco-co-wrapb">
          <button type="button" className="zipco-co-ld dk" disabled aria-busy="true">
            <span className="zipco-co-ld-l zipco-co-ld-dim"><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true" />{waLabel}</span>
            <span className="zipco-co-ld-l zipco-co-ld-fill d"><span className="zipco-co-wi0"><WhatsAppMark className="h-5 w-5" /></span>{waLabel}</span>
          </button>
          <span className="zipco-co-rail d" aria-hidden="true"><b />{RAIL_SPARKS.map(([c, d, t, dx, dy, s, top], i) => <i key={i} style={{ ...vars({ c, d: `${d}s`, t: `${t}s`, dx: `${dx}px`, dy: `${dy}px`, s }), top }} />)}</span>
        </div><p className="zipco-co-sm zipco-ci-help" role="status">Preparando WhatsApp…</p>
      </>:<>
        <div className="zipco-co-wrapb">{canOpen&&<Sparks />}
          <button type="button" className={`zipco-co-go glowup${fresh?' swell':''}`} style={{marginTop:0}} disabled={operation.busy||!canOpen} onClick={()=>void go()}>
            <span className="zipco-co-wi"><WhatsAppMark className="h-[22px] w-[22px]" /></span><span>{waLabel}</span>
          </button>
        </div>
        <p className="zipco-co-sm zipco-ci-help">{canOpen?`Acuerda los detalles de pago y entrega con ${client}.`:counterpartPending?'Esperando autorización de contacto del negocio.':'Actualiza el pedido para continuar.'}</p>
      </>;
    return <article ref={motionRef} data-coordination-motion="idle" id={`order-${order.id}`} tabIndex={0} data-unread={isUnread} data-aurora-state={process?.state} data-coordination-role="customer" data-customer-initial="true"
      aria-label={`${client}: coordinación pendiente`} className="zipco-co-dk zipco-ci scroll-mb-36"
      onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.currentTarget.classList.remove('zipco-notification-target'); onInspect?.(); setFolded(value => !value); } }}
      onClick={event => { event.currentTarget.classList.remove('zipco-notification-target'); event.stopPropagation(); }}>
      <div style={{ position: 'relative' }}>
        <CoordinationCardHeader variant="customer-initial" name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread} quantity={qty}/>
        <div className="zipco-ci-sr">
          {isUnread&&<span className="zipco-ci-new">Nueva</span>}
          <span className="zipco-co-pill"><i />{statusLabel}</span>
          <button type="button" className="zipco-ci-hide" aria-label="Ocultar tarjeta" data-folded={folded} aria-expanded={!folded} aria-hidden={folded} tabIndex={folded?-1:0} {...(folded?{inert:''}:{})}
            onClick={()=>{refocus.current=true;setFolded(true);}}><ChevronUp size={15} strokeWidth={2.8} aria-hidden="true" /><span>Ocultar</span></button>
        </div>

        <div className="zipco-co-fb" data-folded={folded} aria-hidden={folded} {...(folded?{inert:''}:{})}><div className="zipco-co-fb-in">
          <button type="button" className="zipco-co-strip2" aria-haspopup="dialog" onClick={() => { onInspect?.(); setSheet('cond'); }}>
            <span className="zipco-co-strip2-ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true" /></span>
            <span style={{ minWidth: 0 }}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
            <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
          </button>
          <section className="zipco-ci-act" aria-label="Acciones de coordinación">
            {operation.message&&<p role="alert" className="zipco-co-co2-p">{operation.message}</p>}
            {action}
            <p className="zipco-co-sm zipco-ci-lg"><ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />ZIPCO no procesa ni verifica pagos.</p>
            <button ref={stepsTrigger} type="button" className="zipco-ci-dtl" aria-haspopup="dialog" onClick={()=>{onInspect?.();setSheet('steps');}}>
              <span className="zipco-ci-dots" aria-hidden="true"><i data-on="true" /><i data-on={authorized} /><i data-on={whatsappReady} /></span>
              <span className="zipco-ci-dtl-t">Paso {stepNumber} de 3 · <b>Ver pasos y opciones</b></span><ChevronUp size={16} strokeWidth={2.6} aria-hidden="true" />
            </button>
            {operation.busy && phase !== 'loading' && <p role="status" className="zipco-co-co2-p">Actualizando pedido…</p>}
          </section>
        </div></div>
        <button type="button" className="zipco-co-colrow" data-folded={folded} aria-hidden={!folded} tabIndex={folded?0:-1} aria-expanded={!folded} onClick={() => { onInspect?.(); setFolded(false); }}
          style={{ ['--att' as string]: phase === 'loading' ? 0 : 1 }}>
          <span className="nd" aria-hidden="true">{phase === 'idle' || phase === 'requesting' ? '2' : '3'}</span>
          <span className="tx">
            <b>{phase === 'idle' || phase === 'requesting' ? 'Autorizar contacto' : phase === 'loading' ? 'Preparando WhatsApp…' : 'Ya puedes coordinar por WhatsApp'}</b>
            <small>{phase === 'idle' || phase === 'requesting' ? 'Falta tu acción · toca para abrir' : phase === 'loading' ? 'Paso 3 de 3 · un momento' : 'Paso 3 de 3 · listo para iniciar'}</small>
          </span>
          <span className="chev"><ChevronDown size={15} strokeWidth={2.8} aria-hidden="true" /><span className="sr-only">Mostrar coordinación</span></span>
        </button>
      </div>

      <CustomerStepsSheet open={sheet==='steps'} triggerRef={stepsTrigger} restoreFocus={sheet===null} onClose={()=>setSheet(null)}>
        <h3 className="zipco-ci-sh-t">Pasos y opciones</h3>
        <ol className="zipco-ci-sp" aria-label="Pasos de coordinación">
          <li data-done="true"><span className="zipco-ci-nd"><Check size={14} strokeWidth={3.4} aria-hidden="true" /></span><b>{acceptedLabel}</b>{acceptedAt&&<small>{when(acceptedAt)}</small>}</li>
          <li data-done={authorized} data-current={!authorized}>
            <span className="zipco-ci-ln" aria-hidden="true"><i data-fill={authorized} data-run={fresh&&phase==='loading'} /></span>
            <span className="zipco-ci-nd" data-pop={fresh&&authorized}>{authorized?<Check size={14} strokeWidth={3.4} aria-hidden="true" />:'2'}</span>
            <b>Contacto</b><small>{authorized?'Contacto autorizado':phase==='requesting'?'Autorizando…':'Falta tu acción'}</small>
            {authorized&&<span className="sr-only">El negocio podrá contactarte por WhatsApp</span>}
          </li>
          <li data-done="false" data-current={whatsappReady}>
            <span className="zipco-ci-ln" aria-hidden="true"><i data-fill={whatsappReady} data-late={phase==='loading'} /></span>
            <span className="zipco-ci-nd" data-pulse={whatsappReady&&!operation.busy}>{whatsappReady?'3':<LockKeyhole size={13} strokeWidth={2.6} aria-hidden="true" />}</span>
            <b>WhatsApp</b><small>{whatsappReady?'Listo para iniciar':phase==='loading'?'Preparando…':authorized?'Esperando permiso':'Se activa al autorizar'}</small>
          </li>
        </ol>
        {allowed('ANNUL_COORDINATION') && !recoveryOnly && !pending && <button type="button" className="zipco-co-lk rose zipco-ci-ob" disabled={operation.busy} onClick={() => setSheet('anul')}><Trash2 size={14} strokeWidth={2.3} aria-hidden="true" />Anular solicitud</button>}
        {availabilityFlow(process) && <AvailabilityPostActions order={order} business={false} refresh={refresh}/>}
        <button type="button" className="zipco-ci-close" onClick={()=>setSheet(null)}>Cerrar</button>
      </CustomerStepsSheet>
      {dialogs}
    </article>;

}
