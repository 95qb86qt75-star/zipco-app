import {isAdvisoryOffer,isSimpleOffer} from '../../../domain/simplifiedReservationContract';
import * as React from 'react';

import CustomerPickupCard,{NvDoneContext,type NvVariant} from "../local-pickup/CustomerPickupCard";
import CustomerReceiptDetails,{CustomerPickupDetails,NvClosureContext,type NvDetailData} from "./CustomerReceiptDetails";
import {confirmedPrepaymentPickup} from "../../../shared/reservations/ReservationPanel";
import ReservationOfferSummary,{reservationWhen} from "../../../shared/reservations/ReservationOfferSummary";
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
 const description=process?.businessClosure?.status==='DELIVERY_DECLARED'?'El negocio indicó que entregó tu pedido. Confirma recepción solo si lo recibiste.':coordinationPending?'Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.':received?'Producto recibido · Pendiente de finalizar.':ready?'El negocio avisó que tu pedido está listo.':'El negocio está preparando tu pedido.';
 const onContact=coordinationAllowed(process,false,'OPEN_WHATSAPP')?()=>void operation.run('OPEN_WHATSAPP'):undefined;
 // Retiro local: AvailabilityPostActions entrega sus piezas y CustomerPickupDetails las coloca en pestañas (sin hooks dentro del callback).
 // WhatsApp (CustomerCoordinationCard) conserva exactamente la composición anterior.
 const lineDesign=pickup&&process?.state==='IN_PROGRESS'&&process.reservation?.mode==='PREPAYMENT'&&process.reservation.effectiveStatus==='AWAITING_BUSINESS_CONFIRMATION'&&isAdvisoryOffer(process.availability?.reservationOffer);
 const confirmedFreeDesign=pickup&&!lineDesign&&!model&&process?.state==='IN_PROGRESS'&&process.reservation?.mode==='FREE'&&process.reservation.effectiveStatus==='CONFIRMED'&&isAdvisoryOffer(process.availability?.reservationOffer);
 const arrivalDesign=pickup&&!model&&process?.state==='IN_PROGRESS'&&!process.reservation&&(process.reservationChoice?.choice==='NONE'||process.availability?.reservationOffer?.mode==='NONE');
 // «Nuevo · Lista»: A reserva sin pago confirmada · B reserva con pago previo confirmada (misma condición que usa el negocio: confirmedPrepaymentPickup) · C sin reserva.
 // Nunca con `model` (pedido listo / recibido). lineDesign (pago previo pendiente) conserva su diseño.
 const confirmedPrepaymentDesign=pickup&&!lineDesign&&!model&&confirmedPrepaymentPickup(process);
 const nvPickup:NvVariant|null=!pickup||model||lineDesign?null:confirmedFreeDesign?'A':confirmedPrepaymentDesign?'B':arrivalDesign?'C':null;
 // «Producto recibido» (NegW19): cliente + retiro local + READY + recepción ya declarada (RECEIVED_PENDING_FINALIZATION). Mismo contenedor visual para A/B/C.
 // A reserva sin pago confirmada · B reserva con pago previo confirmada · C sin reserva. Cualquier otra combinación conserva la composición anterior.
 const rv=process?.reservation,recOffer=process?.availability?.reservationOffer;
 const recConfirmed=!!rv&&(['CONFIRMED','FULFILLED'] as string[]).includes(rv.effectiveStatus)&&!rv.continuedWithoutReservationAt&&!rv.pickupCancellation;
 const nvRecVariant:NvVariant|null=pickup&&!!model&&ready&&received&&process?(rv?(recConfirmed?(rv.mode==='FREE'?'A':rv.mode==='PREPAYMENT'?'B':null):null):(process.reservationChoice?.choice==='NONE'||recOffer?.mode==='NONE'?'C':null)):null;
 const nvWhatsapp:'D'|'E'|null=!pickup&&!model?(coordinationPending?'E':'D'):null;
 const nvItems=subject.items.map(item=>({name:item.nameSnapshot,description:item.descriptionSnapshot??'',quantity:item.quantity}));
 const itemsText=nvItems.length===1?`${nvItems[0].quantity}× ${nvItems[0].name}`:`${nvItems.length} productos`;
 const offer=process?.availability?.reservationOffer;
 const nvVariant=nvPickup??nvWhatsapp??nvRecVariant;
 const nvData:NvDetailData|undefined=nvVariant?{
  variant:nvVariant,items:nvItems,itemsText,
  note:(pickup?process?.reservationChoice?.note:null)||(negotiated?null:(explanation?String(explanation):null)),
  totalClp:price,reservedClp:offer?.mode==='PREPAYMENT'?offer.requiredAmountClp:null,declaredClp:process?.reservation?.paymentReceiptDeclaration?.amountClp??null,
  pickupWhen:pickup&&offer&&isSimpleOffer(offer)&&offer.simplified.scheduledFor?reservationWhen(offer.simplified.scheduledFor):null,
  message:pickup?process?.availability?.customerMessage??null:null,scheduleOrAddress:pickup?process?.availability?.scheduleOrAddress??null:null,
  ...(nvRecVariant?{note:process?.reservationChoice?.note||null,confirmedAutomatically:rv?.confirmationSource==='AUTO_BUSINESS_OFFER',confirmedAtLabel:rv?.confirmedAt?reservationWhen(rv.confirmedAt):null,originalOffer:recOffer&&recOffer.mode!=='NONE'&&nvRecVariant!=='C'?<ReservationOfferSummary offer={recOffer}/>:null}:{}),
 }:undefined;
 const closure=controller.closure??{canFinish:false,done:null,busy:false,pending:false,pendingChoice:null,error:'',finish:async()=>false,check:async()=>false,retry:async()=>false};
 const finalizeAllowed=!!nvPickup&&closure.canFinish;
 const onFinalize=finalizeAllowed?closure.finish:undefined;
 const finDone=closure.done;
 const nvBusy=operation.busy||closure.busy;
 const nvBlocked=blocked||closure.busy||closure.pending;
 const details=pickup
  ?<AvailabilityPostActions order={order} business={false} refresh={refresh} render={parts=><CustomerPickupDetails nv={nvPickup?nvData:undefined} received={nvRecVariant?nvData:undefined} onAgreement={()=>setSheet('agree')} busy={nvBusy} onFinalize={onFinalize} lineDesign={lineDesign} confirmedFreeDesign={confirmedFreeDesign} arrivalDesign={arrivalDesign} summary={conditionsSummary} onConditions={()=>setSheet('cond')} blocked={nvBlocked} onContact={onContact} parts={parts}/>}/>
  :nvWhatsapp
   ?<AvailabilityPostActions order={order} business={false} refresh={refresh} render={parts=><CustomerReceiptDetails nv={nvData} nvParts={parts} busy={nvBusy} onFinalize={onFinalize} summary={conditionsSummary} onConditions={()=>setSheet('cond')} blocked={blocked} onContact={onContact}/>}/>
   :<CustomerReceiptDetails waitingDesign={!model} summary={conditionsSummary} onConditions={()=>setSheet('cond')} blocked={blocked} onContact={onContact}><AvailabilityPostActions order={order} business={false} refresh={refresh}/></CustomerReceiptDetails>;
 const dialogs=<><ConditionsSheet fullAgreement open={sheet==='cond'} onOpenChange={value=>setSheet(value?'cond':null)} accepted={accepted} title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation} explanationLabel={negotiated?'Explicación de la propuesta aceptada':'Tu nota'} onOpenAgreement={()=>setSheet('agree')}/><AgreementSheet open={sheet==='agree'} onOpenChange={value=>setSheet(value?'agree':null)} processId={process?.id} client={businessName} perspective="customer" accepted={accepted} acceptedAt={acceptedAt}/></>;
 return <NvClosureContext.Provider value={{options:process?.customerPickupClosureOptions??null,error:closure.error,pending:closure.pending,pendingChoice:closure.pendingChoice,check:()=>void closure.check(),retry:()=>void closure.retry()}}><NvDoneContext.Provider value={finDone}><div ref={motion as React.RefObject<HTMLDivElement>}>
  {pickup?<CustomerPickupCard nv={nvPickup?{variant:nvPickup,quantity,itemsText}:null} nvReceived={nvRecVariant?{variant:nvRecVariant,quantity,itemsText}:null} lineDesign={lineDesign} confirmedFreeDesign={confirmedFreeDesign} arrivalDesign={arrivalDesign} id={order.id} name={businessName} product={conditionsTitle} price={price} expanded={expanded} onToggle={()=>{onInspect?.();setExpanded(v=>!v);}} ready={model} busy={nvBusy} recovery={recoveryControls}>{details}</CustomerPickupCard>:<CustomerCoordinationCard id={order.id} name={businessName} price={price} quantity={quantity} items={items} ready={model} preparing={!coordinationPending} description={description} model={{mode:'ownPending',expanded,busy:operation.busy,attention:false,canYes:false,canNo:false,error:ready?'':operation.message,recovery:recoveryControls,onToggle:()=>{onInspect?.();setExpanded(v=>!v);},onYes:()=>{},onNo:()=>{},onReturn:()=>{},onCancel:()=>{}}}>{details}</CustomerCoordinationCard>}
  {dialogs}
  {legacyConfirm&&<CustomerReceiptDialog action={legacyConfirm} busy={operation.busy} message={operation.message} onClose={()=>{if(!operation.busy)setLegacyConfirm(null);}} onConfirm={()=>void submit(legacyConfirm)}/>}
 </div></NvDoneContext.Provider></NvClosureContext.Provider>;

}
