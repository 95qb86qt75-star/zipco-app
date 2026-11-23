import {PICKUP_CHOICE_LABELS} from '../../../domain/customerPickupClosure';
import CustomerReceiptFlowCard from '../../customer/progress/CustomerReceiptFlowCard';
import {NOTIFICATION_CARD_OPEN_EVENT} from '../../../../../notifications/notificationNavigation';
import {BUSINESS_CLOSURE_REASONS} from '../../../domain/businessClosure';
import * as React from 'react';
import LocalPickupInformationCard from '../local-pickup-information/LocalPickupInformationCard';
import { AcceptedConditionsPanel } from "../../../shared/conditions/AcceptedConditions";
import useAgreement from "../../../application/useAgreement";
import { AuroraProposalHeader } from "../layout/OrderCardAurora";
import type { BusinessRequest, MyOrder } from "../../../domain/types";
import { useEffect, useState } from 'react';
import { markInteractionRead } from "../../../../../notifications/unreadInteractions";
import { isPendingRequestCancelled, isPendingRequestRejected, PENDING_REJECTION_REASONS, type PendingRejectionReason } from "../../../domain/requestProcess";
import OrderReferencePhoto from "../../../shared/photos/OrderReferencePhoto";
import { safePhoto } from "../../../domain/agreement";
import { formatDeliverySchedule } from "../../../domain/utils";
import { isProposalRejected, isAvailabilityClosed } from "../../../domain/requestProcess";
import ProposalNegotiation from "../../../forms/proposal/ProposalNegotiation";
import ReservationPanel from "../../../shared/reservations/ReservationPanel";
import { ProductPreviewScope } from "../../../shared/product-preview/ProductPreviewControl";

export function ProcessHistoryCardContent({ order }: { order: MyOrder | BusinessRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [notificationOpen,setNotificationOpen]=useState(0);
  useEffect(()=>{
    if('customerName' in order||!order.requestProcess?.customerPickupClosure)return;
    const open=(event:Event)=>{if((event as CustomEvent).detail?.id===`order-${order.id}`){setExpanded(true);setNotificationOpen(n=>n+1);}};
    window.addEventListener(NOTIFICATION_CARD_OPEN_EVENT,open);return()=>window.removeEventListener(NOTIFICATION_CARD_OPEN_EVENT,open);
  },[order.id,order.requestProcess?.customerPickupClosure]);
  const pendingCancelled = isPendingRequestCancelled(order.requestProcess);
  const pendingRejected = isPendingRequestRejected(order.requestProcess);
  const availabilityClosed = isAvailabilityClosed(order.requestProcess);
  const originalRequest = pendingCancelled || pendingRejected || availabilityClosed && !order.requestProcess?.agreementPublicId;
  const proposalRejected = isProposalRejected(order.requestProcess);
  const agreement = useAgreement(expanded ? order.requestProcess : null);
  const accepted = agreement.state.status === 'loaded' ? agreement.state.agreement : null;
  const price = accepted?.totalPriceClp ?? (order.requestProcess?.agreementPublicId
    ? order.requestProcess.proposalSummary?.totalPriceClp ?? null
    : proposalRejected ? order.requestProcess?.proposalSummary?.totalPriceClp ?? null : originalRequest ? order.total : null);
  const closure = pendingRejected || availabilityClosed ? order.requestProcess?.closure : null;
  const businessClosure=order.requestProcess?.businessClosure;
  const customerPickupClosure=!('customerName' in order)?order.requestProcess?.customerPickupClosure:undefined;
  const label = businessClosure?.status==='CLOSED_WITHOUT_DELIVERY'?'No se concretó · Declarado por el negocio':businessClosure?.status==='DELIVERY_DECLARED'?'Entrega declarada':pendingRejected ? 'Rechazada' : pendingCancelled ? 'Anulada por el cliente' : order.requestProcess?.state === 'COORDINATION_CANCELLED' ? 'Anulada' : order.requestProcess?.state === 'COMPLETED' || order.status === 'completed' ? 'Completado'
    : order.status === 'cancelled' ? 'Cancelado' : order.status === 'rejected' ? 'Rechazado' : 'Estado no disponible';
  return <article id={`order-${order.id}`} data-aurora-state={order.requestProcess?.state ?? 'history'} className="zipco-aurora-card scroll-mb-36 rounded-[24px] p-4">
    {order.requestProcess?.lateInitialResponse&&<p className="mb-3 text-sm font-bold">{order.requestProcess.lateInitialResponse.status==='NO_LONGER_NEEDED'?'El cliente indicó que ya no necesita este pedido.':'El negocio avisó que no podrá atender esta solicitud.'}</p>}
    <AuroraProposalHeader name={'businessName' in order ? order.businessName : order.customerName}
      image={'businessImage' in order ? order.businessImage : order.customerImage} price={price} statusLabel={customerPickupClosure?.scope==='CUSTOMER_FOLLOW_UP'&&order.requestProcess?.state!=='COMPLETED'?'Seguimiento cerrado':label}
      priceLabel={originalRequest ? 'Solicitado' : proposalRejected ? 'Última propuesta' : 'Acordado'}
      summaryText={order.date} items={accepted ? accepted.subjectSnapshot.items.map(item => ({ name: item.nameSnapshot, quantity: item.quantity }))
        : originalRequest && order.products.state === 'available' ? order.products.items : undefined} />
    {customerPickupClosure&&<div className="mt-3 text-sm" data-customer-pickup-history><b>{PICKUP_CHOICE_LABELS[customerPickupClosure.choice]}</b><p>{customerPickupClosure.scope==='CUSTOMER_FOLLOW_UP'?'Cerraste solo tu seguimiento. No confirma retiro, entrega ni pago. El negocio conserva su recorrido.':'Confirmaste recepción y finalización del pedido.'}</p></div>}
    {businessClosure&&<div className="mt-3 text-sm"><p>{businessClosure.status==='DELIVERY_DECLARED'?'El negocio declaró la entrega. La recepción y finalización del cliente se conservan por separado.':BUSINESS_CLOSURE_REASONS[businessClosure.reasonCode!]}</p>{businessClosure.reasonDetail&&<p className="whitespace-pre-wrap break-words">{businessClosure.reasonDetail}</p>}</div>}
    {proposalRejected && <ProposalNegotiation order={order} business={'customerName' in order} variant="aurora" refresh={() => window.dispatchEvent(new CustomEvent('zipco-requests-refresh'))} />}
    {closure && <div className="mt-2 text-sm"><p className="font-bold">Motivo: {closure.reasonCode === 'PICKUP_CANCELLED' ? `Retiro cancelado por ${closure.actor === 'CUSTOMER' ? 'el cliente' : 'el negocio'}`
      : closure.reasonCode === 'CUSTOMER_DECLINED_CONTINUATION' ? 'El cliente decidió no continuar' : closure.reasonCode === 'BUSINESS_WITHDREW_AVAILABILITY' ? 'El negocio retiró la disponibilidad'
      : PENDING_REJECTION_REASONS[closure.reasonCode as PendingRejectionReason]}</p>
      {closure.reasonDetail && <p className="whitespace-pre-wrap break-words">{closure.reasonDetail}</p>}</div>}
    {!proposalRejected && <button type="button" aria-expanded={expanded} className="zipco-glass-btn mt-3 px-3 py-2 font-bold"
      onClick={() => {
        setExpanded((value) => !value);
        if (order.recordState === 'available') markInteractionRead('order', order.id);
      }}>{originalRequest ? 'Ver solicitud' : customerPickupClosure?'Ver detalle e instrucciones':'Condiciones aceptadas'}</button>}
    {expanded&&customerPickupClosure&&accepted&&'businessName' in order&&['IN_PROGRESS','READY'].includes(order.requestProcess?.state??'')&&<CustomerReceiptFlowCard
      order={order} businessName={order.businessName} price={accepted.totalPriceClp} statusLabel="Seguimiento cerrado" accepted={accepted} acceptedAt={accepted.confirmedAt} notificationOpen={notificationOpen}
      conditionsTitle={accepted.subjectSnapshot.items.map(i=>i.quantity+'× '+i.nameSnapshot).join(' · ')} conditionsSubtitle="Condiciones aceptadas"
      conditionsWhen={accepted.scheduledFor??'Lo antes posible'} conditionsSummary="Condiciones del pedido" negotiated={accepted.subjectSchemaVersion===2}
      explanation={accepted.subjectSnapshot.note} refresh={()=>window.dispatchEvent(new Event('zipco-requests-refresh'))}/>}
    {expanded && (originalRequest ? <div className="mt-3 space-y-2 text-sm">
      <p className="font-bold">Solicitud original</p>
      {order.products.state === 'available' && order.products.items.map((item, index) => <p key={index}>{item.quantity}x {item.name} · ${(item.price * item.quantity).toLocaleString('es-CL')}</p>)}
      {order.total !== null && <p className="font-bold">Total: ${order.total.toLocaleString('es-CL')}</p>}
      <p>{formatDeliverySchedule(order, 'customerName' in order ? 'business' : 'customer')}</p>
      {order.note && <p className="whitespace-pre-wrap break-words">Nota: {order.note}</p>}
      {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business={'customerName' in order} />}
    </div> : <><AcceptedConditionsPanel state={agreement.state} retry={agreement.retry} business={'customerName' in order} history />{order.requestProcess?.reservation&&!(customerPickupClosure&&['IN_PROGRESS','READY'].includes(order.requestProcess.state))&&<ReservationPanel order={order} business={'customerName' in order} refresh={()=>window.dispatchEvent(new CustomEvent('zipco-requests-refresh'))}/>}</>)}
  </article>;
}

export default function ProcessHistoryCard(props:{order:MyOrder|BusinessRequest}){
  const process=props.order.requestProcess;
  if(!process)return <ProcessHistoryCardContent {...props}/>;
  return <ProductPreviewScope preview={props.order.orderType==='service'?undefined:process.productPreview} proposalId={process.currentProposalId} processId={process.id} caption={process.agreementPublicId?'PRODUCTO ACORDADO':process.proposalSummary?'PRODUCTO PROPUESTO':'PRODUCTO SOLICITADO'} enabled={props.order.orderType==='product'}>{process.localPickupInformation?<LocalPickupInformationCard order={props.order} business={'customerName'in props.order} refresh={()=>window.dispatchEvent(new CustomEvent('zipco-requests-refresh'))}/>:<ProcessHistoryCardContent {...props}/>}</ProductPreviewScope>;
}
