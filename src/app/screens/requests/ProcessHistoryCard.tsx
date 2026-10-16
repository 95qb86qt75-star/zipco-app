import AcceptedConditions from './AcceptedConditions';
import type { BusinessRequest, MyOrder } from './types';
import { useState } from 'react';
import { markInteractionRead } from '../../notifications/unreadInteractions';

export default function ProcessHistoryCard({ order }: { order: MyOrder | BusinessRequest }) {
  const [expanded, setExpanded] = useState(false);
  const label = order.requestProcess?.state === 'COORDINATION_CANCELLED' ? 'Anulada' : order.status === 'completed' ? 'Completado'
    : order.status === 'cancelled' ? 'Cancelado' : order.status === 'rejected' ? 'Rechazado' : 'Estado no disponible';
  return <article id={`order-${order.id}`} className="rounded-2xl border bg-white p-4 dark:bg-slate-900">
    <p className="text-xs text-slate-500">{order.date}</p>
    <h4 className="font-black">{'businessName' in order ? order.businessName : order.customerName}</h4>
    <p>{label}</p>
    <button type="button" aria-expanded={expanded} className="mt-3 rounded-xl border px-3 py-2 font-bold"
      onClick={() => {
        setExpanded((value) => !value);
        if (order.recordState === 'available') markInteractionRead('order', order.id);
      }}>Condiciones aceptadas</button>
    {expanded && <AcceptedConditions process={order.requestProcess} business={'customerName' in order} history />}
  </article>;
}
