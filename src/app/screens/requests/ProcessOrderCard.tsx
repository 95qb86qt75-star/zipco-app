import type { BusinessRequest, MyOrder } from './types';
import { canAcceptFixedOrder, processStatusLabel } from './requestProcess';
import AcceptedConditions from './AcceptedConditions';
import { formatDeliverySchedule } from './utils';
import { safePhoto } from './agreement';

export default function ProcessOrderCard({ order, business = false, isUpdating, onAccept, onRetry, onOpen }: {
  order: BusinessRequest | MyOrder; business?: boolean; isUpdating: boolean;
  onAccept?: () => void; onRetry: () => void; onOpen?: () => void;
}) {
  const process = order.requestProcess;
  const awaiting = process?.state === 'AWAITING_BUSINESS_RESPONSE';
  const coordination = process?.state === 'COORDINATION_PENDING';
  const schedule = formatDeliverySchedule(order, business ? 'business' : 'customer');
  return <article id={`order-${order.id}`} onClick={onOpen}
    className="rounded-2xl border border-teal-200 bg-white p-4 text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100">
    <h4 className="font-black">{'customerName' in order ? order.customerName : order.businessName}</h4>
    <p className="mt-2 font-bold" role="status">{processStatusLabel(order)}</p>
    {awaiting && <div className="mt-3 space-y-2 text-sm">
      {order.products.state === 'available' ? order.products.items.map((item, i) =>
        <p key={i}>{item.quantity} × {item.name} · ${item.price.toLocaleString('es-CL')}</p>) : <p>Productos no disponibles. Actualiza el pedido.</p>}
      {order.total !== null && <p className="font-bold">Total: ${order.total.toLocaleString('es-CL')}</p>}
      {schedule && <p>{schedule}</p>}
      {order.note && <p className="whitespace-pre-wrap">Nota: {order.note}</p>}
      {order.referencePhoto && safePhoto(order.referencePhoto) &&
        <a href={order.referencePhoto} target="_blank" rel="noreferrer">Abrir foto de referencia
          <img src={order.referencePhoto} alt="Foto de referencia" className="max-h-48 rounded-xl object-contain" />
        </a>}
      {business && order.recordState === 'available' && canAcceptFixedOrder(order) && order.products.state === 'available' &&
        <button type="button" disabled={isUpdating} onClick={(event) => { event.stopPropagation(); onAccept?.(); }}
          className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white disabled:opacity-50">
          {isUpdating ? 'Guardando…' : 'Aceptar pedido'}
        </button>}
    </div>}
    {(coordination || process?.agreementPublicId) && <AcceptedConditions process={process} />}
    {(!process || (!awaiting && !coordination) || (coordination && !process.agreementPublicId)) && <button type="button" onClick={onRetry}
      className="mt-3 rounded-xl border px-3 py-2">Actualizar pedido</button>}
  </article>;
}
