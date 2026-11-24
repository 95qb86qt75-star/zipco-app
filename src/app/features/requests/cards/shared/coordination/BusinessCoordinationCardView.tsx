import BusinessEmbeddedCoordinationDetail from '../../business/coordination/BusinessEmbeddedCoordinationDetail';
import CustomerEmbeddedCoordinationDetail from '../../customer/whatsapp/CustomerEmbeddedCoordinationDetail';
import CustomerInitialCoordinationCard from '../../customer/whatsapp/initial/CustomerInitialCoordinationCard';
import InitialCoordinationCardView from './InitialCoordinationCardView';


import * as React from 'react';





















import "../../customer/whatsapp/initial/customer-initial-coordination.css";

/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
import type {BusinessCoordinationCardModel} from './application/useBusinessCoordinationCardController';
export default function BusinessCoordinationCardView({model}:{model:BusinessCoordinationCardModel}){
const {accepted,acceptedAt,allowed,authorized,business,canOpen,client,conditionsSummary,counterpartPending,deferred,dialogs,embedded,folded,fresh,go,image,isUnread,motionRef,negotiated,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refocus,refresh,setDeferred,setFolded,setSheet,sheet,statusLabel,stepsTrigger,unlock}=model;
if(business&&embedded&&process?.state==='COORDINATING'&&(process.whatsappCoordinationInitialDecline?.active===true||process.whatsappCoordination?.status==='DECLINED'))return <BusinessEmbeddedCoordinationDetail model={{acceptedAt,allowed,authorized,business,canOpen,client,conditionsSummary,dialogs,go,onInspect,operation,order,pending,phase,process,recoveryOnly,refresh,setSheet,sheet,unlock}}/>;
  if(!business&&embedded)return <CustomerEmbeddedCoordinationDetail model={{accepted,acceptedAt,allowed,authorized,canOpen,client,dialogs,go,motionRef,onInspect,operation,order,pending,phase,process,recoveryOnly,refresh,setSheet,unlock}}/>;
  const step2Done = authorized;
  const waLabel = 'Iniciar coordinación por WhatsApp';
  const customerInitial = !business && !embedded && accepted.subjectSnapshot.orderType === 'product' && process?.availability?.path === 'WHATSAPP';
  if(customerInitial)return <CustomerInitialCoordinationCard model={{accepted,acceptedAt,allowed,authorized,canOpen,client,conditionsSummary,counterpartPending,deferred,dialogs,folded,fresh,go,image,isUnread,motionRef,negotiated,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refocus,refresh,setDeferred,setFolded,setSheet,sheet,statusLabel,step2Done,stepsTrigger,unlock,waLabel}}/>;
  return <InitialCoordinationCardView model={{accepted,acceptedAt,allowed,business,canOpen,client,conditionsSummary,counterpartPending,deferred,dialogs,embedded,folded,fresh,go,image,isUnread,motionRef,negotiated,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refresh,setDeferred,setFolded,setSheet,sheet,statusLabel,step2Done,unlock,waLabel}}/>;

}
