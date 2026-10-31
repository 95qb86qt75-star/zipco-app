

import * as React from 'react';
import AvailabilityPostActions from "../../shared/availability/AvailabilityPostActions";
import { availabilityFlow, CONTACT_COPY } from "../../../domain/availabilityContract";
import { Trash2 } from 'lucide-react';



import CustomerCoordinationDetail from "./CustomerCoordinationDetail";

import "./initial/customer-initial-coordination.css";

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
export default function CustomerEmbeddedCoordinationDetail({model}:{model:Pick<BusinessCoordinationCardModel,"accepted"|"acceptedAt"|"allowed"|"authorized"|"canOpen"|"client"|"dialogs"|"go"|"motionRef"|"onInspect"|"operation"|"order"|"pending"|"phase"|"process"|"recoveryOnly"|"refresh"|"setSheet"|"unlock">}){
const {accepted,acceptedAt,allowed,authorized,canOpen,client,dialogs,go,motionRef,onInspect,operation,order,pending,phase,process,recoveryOnly,refresh,setSheet,unlock}=model;
return <>
    <CustomerCoordinationDetail motionRef={motionRef} accepted={accepted} name={client} acceptedAt={acceptedAt} authorized={authorized} phase={phase}
      canOpen={canOpen} canAuthorize={allowed('AUTHORIZE_CONTACT')} busy={operation.busy} error={operation.message} onUpdate={()=>void operation.update()} onAuthorize={()=>void unlock()} onOpen={()=>void go()} onConditions={()=>{onInspect?.();setSheet('cond');}}
      recovery={recoveryOnly?<div><p role="alert">{operation.storageWarning()||'Actualiza el estado antes de continuar.'}</p>
        <button className="zipco-customer-coordination-open" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button></div>
        :pending?<div><p>Hay una operación pendiente de confirmación.</p><button className="zipco-customer-coordination-open" disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button></div>:undefined}
      options={<>
        {!authorized&&<p>{availabilityFlow(process)?CONTACT_COPY:<>Autorizas compartir con {client} el teléfono de tu perfil solo para este pedido. El consentimiento del negocio es independiente.</>}</p>}
        {allowed('ANNUL_COORDINATION')&&!recoveryOnly&&!pending&&<button type="button" className="zipco-co-lk rose" disabled={operation.busy} onClick={()=>setSheet('anul')}><Trash2 size={14}/>Anular solicitud</button>}
        {availabilityFlow(process)&&<AvailabilityPostActions order={order} business={false} refresh={refresh}/>}
      </>}/>
    {dialogs}
  </>;
}
