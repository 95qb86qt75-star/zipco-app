import AcceptedConditions from './AcceptedConditions';
import type { BusinessRequest, MyOrder } from './types';
import { useState } from 'react';
import { markInteractionRead } from '../../notifications/unreadInteractions';
import { isPendingRequestCancelled, isPendingRequestRejected, PENDING_REJECTION_REASONS, type PendingRejectionReason } from './requestProcess';
import OrderReferencePhoto from './OrderReferencePhoto';
import { safePhoto } from './agreement';
import { formatDeliverySchedule } from './utils';
import { isProposalRejected } from './requestProcess';
import ProposalNegotiation from './ProposalNegotiation';

export default function ProcessHistoryCard({ order }: { order: MyOrder | BusinessRequest }) {
  const [expanded, setExpanded] = useState(false);
  const pendingCancelled = isPendingRequestCancelled(order.requestProcess);
  const pendingRejected = isPendingRequestRejected(order.requestProcess);
  const originalRequest = pendingCancelled || pendingRejected;
  const proposalRejected = isProposalRejected(order.requestProcess);
  const closure = pendingRejected ? order.requestProcess?.closure : null;
  const label = pendingRejected ? 'Rechazada' : pendingCancelled ? 'Anulada por el cliente' : order.requestProcess?.state === 'COORDINATION_CANCELLED' ? 'Anulada' : order.requestProcess?.state === 'COMPLETED' || order.status === 'completed' ? 'Completado'
    : order.status === 'cancelled' ? 'Cancelado' : order.status === 'rejected' ? 'Rechazado' : 'Estado no disponible';
  return <article id={`order-${order.id}`} className="rounded-2xl border bg-white p-4 dark:bg-slate-900">
    <p className="text-xs text-slate-500">{order.date}</p>
    <h4 className="font-black">{'businessName' in order ? order.businessName : order.customerName}</h4>
    <p>{label}</p>
    {proposalRejected && <ProposalNegotiation order={order} business={'customerName' in order} refresh={() => window.dispatchEvent(new CustomEvent('zipco-requests-refresh'))} />}
    {closure && <div className="mt-2 text-sm"><p className="font-bold">Motivo: {PENDING_REJECTION_REASONS[closure.reasonCode as PendingRejectionReason]}</p>
      {closure.reasonDetail && <p className="whitespace-pre-wrap break-words">{closure.reasonDetail}</p>}</div>}
    {!proposalRejected && <button type="button" aria-expanded={expanded} className="mt-3 rounded-xl border px-3 py-2 font-bold"
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
    </div> : <AcceptedConditions process={order.requestProcess} business={'customerName' in order} history />)}
  </article>;
}
