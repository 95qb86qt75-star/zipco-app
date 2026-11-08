import {isAdvisoryOffer} from '../../../domain/simplifiedReservationContract';
import * as React from 'react';

import CustomerPickupCard from "../local-pickup/CustomerPickupCard";
import CustomerReceiptDetails,{CustomerPickupDetails} from "./CustomerReceiptDetails";
import CustomerReceiptDialog from "./CustomerReceiptDialog";
import CustomerCoordinationCard from "../whatsapp/CustomerCoordinationCard";


import { ConditionsSheet } from "../../../shared/conditions/CoordinationSheets";
import AgreementSheet from "../../../shared/conditions/AgreementSheet";
import AvailabilityPostActions from "../../shared/availability/AvailabilityPostActions";
import { coordinationAllowed } from "../../../api/coordinationApi";







/** One product presentation; existing v2 and legacy controllers keep their semantics. */

/** One product presentation; existing v2 and legacy controllers keep their semantics. */
import type {CustomerReceiptFlowCardModel} from './application/useCustomerReceiptFlowCardController';
export default function CustomerReceiptFlowCardView({model:controller}:{model:CustomerReceiptFlowCardModel}){
const {accepted,acceptedAt,blocked,businessName,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,coordinationPending,expanded,explanation,legacyConfirm,model,motion,negotiated,onInspect,operation,order,pending,pickup,price,process,ready,received,recovery,refresh,setExpanded,setLegacyConfirm,setSheet,sheet,submit,update}=controller;
const recoveryControls=(pending||recovery)&&!operation.busy?<div className="zipco-receipt-recovery"><p>{operation.storageWarning()||'Comprueba el estado del pedido antes de continuar.'}</p><button type="button" onClick={()=>void update()}>Actualizar estado</button>{pending&&!recovery&&['DECLARE_PRODUCT_RECEIVED','FINALIZE_REQUEST','ACK_READY_NOTICE','CONFIRM_RECEIPT'].includes(pending.action)&&<button type="button" onClick={()=>void submit(pending.action as 'DECLARE_PRODUCT_RECEIVED'|'FINALIZE_REQUEST'|'ACK_READY_NOTICE'|'CONFIRM_RECEIPT',true)}>Reintentar el mismo envío</button>}</div>:null;
 const subject=accepted.subjectSnapshot,items=subject.items.map(item=>({name:item.nameSnapshot,quantity:item.quantity})),quantity=items.reduce((sum,i)=>sum+i.quantity,0);
 const description=coordinationPending?'Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.':received?'Producto recibido · Pendiente de finalizar.':ready?'El negocio avisó que tu pedido está listo.':'El negocio está preparando tu pedido.';
 const onContact=coordinationAllowed(process,false,'OPEN_WHATSAPP')?()=>void operation.run('OPEN_WHATSAPP'):undefined;
 // Retiro local: AvailabilityPostActions entrega sus piezas y CustomerPickupDetails las coloca en pestañas (sin hooks dentro del callback).
 // WhatsApp (CustomerCoordinationCard) conserva exactamente la composición anterior.
 const lineDesign=pickup&&process?.state==='IN_PROGRESS'&&process.reservation?.mode==='PREPAYMENT'&&process.reservation.effectiveStatus==='AWAITING_BUSINESS_CONFIRMATION'&&isAdvisoryOffer(process.availability?.reservationOffer);
 const confirmedFreeDesign=pickup&&!lineDesign&&!model&&process?.state==='IN_PROGRESS'&&process.reservation?.mode==='FREE'&&process.reservation.effectiveStatus==='CONFIRMED'&&isAdvisoryOffer(process.availability?.reservationOffer);
 const details=pickup
  ?<AvailabilityPostActions order={order} business={false} refresh={refresh} render={parts=><CustomerPickupDetails lineDesign={lineDesign} confirmedFreeDesign={confirmedFreeDesign} summary={conditionsSummary} onConditions={()=>setSheet('cond')} blocked={blocked} onContact={onContact} parts={parts}/>}/>
  :<CustomerReceiptDetails waitingDesign={!model} summary={conditionsSummary} onConditions={()=>setSheet('cond')} blocked={blocked} onContact={onContact}><AvailabilityPostActions order={order} business={false} refresh={refresh}/></CustomerReceiptDetails>;
 const dialogs=<><ConditionsSheet fullAgreement open={sheet==='cond'} onOpenChange={value=>setSheet(value?'cond':null)} accepted={accepted} title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation} explanationLabel={negotiated?'Explicación de la propuesta aceptada':'Tu nota'} onOpenAgreement={()=>setSheet('agree')}/><AgreementSheet open={sheet==='agree'} onOpenChange={value=>setSheet(value?'agree':null)} processId={process?.id} client={businessName} perspective="customer" accepted={accepted} acceptedAt={acceptedAt}/></>;
 return <div ref={motion as React.RefObject<HTMLDivElement>}>
  {pickup?<CustomerPickupCard lineDesign={lineDesign} confirmedFreeDesign={confirmedFreeDesign} id={order.id} name={businessName} product={conditionsTitle} price={price} expanded={expanded} onToggle={()=>{onInspect?.();setExpanded(v=>!v);}} ready={model} busy={operation.busy} recovery={recoveryControls}>{details}</CustomerPickupCard>:<CustomerCoordinationCard id={order.id} name={businessName} price={price} quantity={quantity} items={items} ready={model} preparing={!coordinationPending} description={description} model={{mode:'ownPending',expanded,busy:operation.busy,attention:false,canYes:false,canNo:false,error:ready?'':operation.message,recovery:recoveryControls,onToggle:()=>{onInspect?.();setExpanded(v=>!v);},onYes:()=>{},onNo:()=>{},onReturn:()=>{},onCancel:()=>{}}}>{details}</CustomerCoordinationCard>}
  {dialogs}
  {legacyConfirm&&<CustomerReceiptDialog action={legacyConfirm} busy={operation.busy} message={operation.message} onClose={()=>{if(!operation.busy)setLegacyConfirm(null);}} onConfirm={()=>void submit(legacyConfirm)}/>}
 </div>;

}
