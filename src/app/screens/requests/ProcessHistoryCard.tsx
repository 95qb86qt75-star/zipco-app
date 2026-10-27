import { AcceptedConditionsPanel } from './AcceptedConditions';
import useAgreement from './useAgreement';
import { AuroraProposalHeader } from './OrderCardAurora';
import type { BusinessRequest, MyOrder } from './types';
import { useState } from 'react';
import { markInteractionRead } from '../../notifications/unreadInteractions';
import { isPendingRequestCancelled, isPendingRequestRejected, PENDING_REJECTION_REASONS, type PendingRejectionReason } from './requestProcess';
import OrderReferencePhoto from './OrderReferencePhoto';
import { safePhoto } from './agreement';
import { formatDeliverySchedule } from './utils';
import { isProposalRejected, isAvailabilityClosed } from './requestProcess';
import ProposalNegotiation from './ProposalNegotiation';
import ReservationPanel from './ReservationPanel';

export default function ProcessHistoryCard({ order }: { order: MyOrder | BusinessRequest }) {
  const [expanded, setExpanded] = useState(false);
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
  const label = pendingRejected ? 'Rechazada' : pendingCancelled ? 'Anulada por el cliente' : order.requestProcess?.state === 'COORDINATION_CANCELLED' ? 'Anulada' : order.requestProcess?.state === 'COMPLETED' || order.status === 'completed' ? 'Completado'
    : order.status === 'cancelled' ? 'Cancelado' : order.status === 'rejected' ? 'Rechazado' : 'Estado no disponible';
  return <article id={`order-${order.id}`} data-aurora-state={order.requestProcess?.state ?? 'history'} className="zipco-aurora-card scroll-mb-36 rounded-[24px] p-4">
    {order.requestProcess?.lateInitialResponse&&<p className="mb-3 text-sm font-bold">{order.requestProcess.lateInitialResponse.status==='NO_LONGER_NEEDED'?'El cliente indicó que ya no necesita este pedido.':'El negocio avisó que no podrá atender esta solicitud.'}</p>}
    <AuroraProposalHeader name={'businessName' in order ? order.businessName : order.customerName}
      image={'businessImage' in order ? order.businessImage : order.customerImage} price={price} statusLabel={label}
      priceLabel={originalRequest ? 'Solicitado' : proposalRejected ? 'Última propuesta' : 'Acordado'}
      summaryText={order.date} items={accepted ? accepted.subjectSnapshot.items.map(item => ({ name: item.nameSnapshot, quantity: item.quantity }))
        : originalRequest && order.products.state === 'available' ? order.products.items : undefined} />
    {proposalRejected && <ProposalNegotiation order={order} business={'customerName' in order} variant="aurora" refresh={() => window.dispatchEvent(new CustomEvent('zipco-requests-refresh'))} />}
    {closure && <div className="mt-2 text-sm"><p className="font-bold">Motivo: {closure.reasonCode === 'PICKUP_CANCELLED' ? `Retiro cancelado por ${closure.actor === 'CUSTOMER' ? 'el cliente' : 'el negocio'}`
      : closure.reasonCode === 'CUSTOMER_DECLINED_CONTINUATION' ? 'El cliente decidió no continuar' : closure.reasonCode === 'BUSINESS_WITHDREW_AVAILABILITY' ? 'El negocio retiró la disponibilidad'
      : PENDING_REJECTION_REASONS[closure.reasonCode as PendingRejectionReason]}</p>
      {closure.reasonDetail && <p className="whitespace-pre-wrap break-words">{closure.reasonDetail}</p>}</div>}
    {!proposalRejected && <button type="button" aria-expanded={expanded} className="zipco-glass-btn mt-3 px-3 py-2 font-bold"
      onClick={() => {
        setExpanded((value) => !value);
        if (order.recordState === 'available') markInteractionRead('order', order.id);
      }}>{originalRequest ? 'Ver solicitud' : 'Condiciones aceptadas'}</button>}
    {expanded && (originalRequest ? <div className="mt-3 space-y-2 text-sm">
      <p className="font-bold">Solicitud original</p>
      {order.products.state === 'available' && order.products.items.map((item, index) => <p key={index}>{item.quantity}x {item.name} · ${(item.price * item.quantity).toLocaleString('es-CL')}</p>)}
      {order.total !== null && <p className="font-bold">Total: ${order.total.toLocaleString('es-CL')}</p>}
      <p>{formatDeliverySchedule(order, 'customerName' in order ? 'business' : 'customer')}</p>
      {order.note && <p className="whitespace-pre-wrap break-words">Nota: {order.note}</p>}
      {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business={'customerName' in order} />}
    </div> : <><AcceptedConditionsPanel state={agreement.state} retry={agreement.retry} business={'customerName' in order} history />{order.requestProcess?.reservation&&<ReservationPanel order={order} business={'customerName' in order} refresh={()=>window.dispatchEvent(new CustomEvent('zipco-requests-refresh'))}/>}</>)}
  </article>;
}
