

import * as React from 'react';
import AvailabilityPostActions from "../../shared/availability/AvailabilityPostActions";
import { availabilityFlow, CONTACT_COPY } from "../../../domain/availabilityContract";
import { ChevronRight, CircleCheck, Trash2 } from 'lucide-react';




import BusinessPendingCoordinationDetail from "./BusinessPendingCoordinationDetail";
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
import type { BusinessCoordinationCardModel } from "../../shared/coordination/application/useBusinessCoordinationCardController";
/** Complete canonical composition for this coordination variant. */
export default function BusinessEmbeddedCoordinationDetail({model}:{model:Pick<BusinessCoordinationCardModel,"acceptedAt"|"allowed"|"authorized"|"business"|"canOpen"|"client"|"conditionsSummary"|"dialogs"|"go"|"onInspect"|"operation"|"order"|"pending"|"phase"|"process"|"recoveryOnly"|"refresh"|"setSheet"|"sheet"|"unlock">}){
const {acceptedAt,allowed,authorized,business,canOpen,client,conditionsSummary,dialogs,go,onInspect,operation,order,pending,phase,process,recoveryOnly,refresh,setSheet,sheet,unlock}=model;
return <>
    <BusinessPendingCoordinationDetail covered={sheet!==null} authorized={authorized} canOpen={canOpen} canAuthorize={allowed('AUTHORIZE_CONTACT')} busy={operation.busy} phase={phase} acceptedAt={acceptedAt}
      error={operation.message} onOpen={()=>void go()} onAuthorize={()=>void unlock()} onUpdate={()=>void operation.update()}
      consent={availabilityFlow(process)?CONTACT_COPY:<>Autorizas compartir con {client} el teléfono de tu perfil solo para este pedido. El consentimiento del cliente es independiente.</>}
      recovery={recoveryOnly?<div><p role="alert">{operation.storageWarning()||'Actualiza el estado antes de continuar.'}</p><button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button></div>
        :pending?<div><p>Hay una operación pendiente de confirmación.</p><button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button></div>:undefined}
      conditions={<button type="button" className="zipco-co-strip2" aria-haspopup="dialog" onClick={()=>{onInspect?.();setSheet('cond');}}>
        <span className="zipco-co-strip2-ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true"/></span>
        <span style={{minWidth:0}}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
        <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true"/></span>
      </button>}
      options={<>
        {allowed('ANNUL_COORDINATION')&&!recoveryOnly&&!pending&&<button type="button" className="zipco-co-lk rose" disabled={operation.busy} onClick={()=>setSheet('anul')}><Trash2 size={14}/>Anular solicitud</button>}
        {availabilityFlow(process)&&<AvailabilityPostActions order={order} business={business} refresh={refresh}/>}
      </>}/>
    {dialogs}
  </>;
}
