import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import OrderStatusBadge from './OrderStatusBadge';
import type { BusinessRequest, OrderAction } from './types';
import { formatBusinessDeliverySchedule } from './utils';

const REASON_LABELS = {
  no_longer_needed: 'Ya no lo necesitaba.',
  business_took_too_long: 'El negocio tardó demasiado.',
  selected_by_mistake: 'Lo seleccionó por error.'
} as const;

type Props = {
  request: BusinessRequest;
  isUpdating: boolean;
  onAction: (action: OrderAction) => void;
  onRetry: () => void;
};

export default function BusinessOrderCard({ request, isUpdating, onAction, onRetry }: Props) {
  const [showReferencePhoto, setShowReferencePhoto] = useState(false);
  if (request.recordState === 'unavailable') {
    return (
      <div className="rounded-xl border border-gray-300 bg-white/80 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-gray-900">Pedido no disponible</h4>
            <p className="text-xs text-gray-500">No pudimos interpretar el estado de este pedido.</p>
          </div>
          <OrderStatusBadge status="unavailable" />
        </div>
        <button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold text-teal-700">Intentar nuevamente</button>
      </div>
    );
  }

  const canAccept = request.status === 'pending' && request.products.state === 'available';
  const primaryAction: OrderAction | null = request.status === 'accepted'
    ? 'mark-ready'
    : request.status === 'ready'
      ? 'complete-delivery'
      : null;
  const total = request.total;
  const deliverySchedule = formatBusinessDeliverySchedule(request);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <ImageWithFallback src={request.customerImage} alt={request.customerName} className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs font-bold text-gray-900">{request.customerName || 'Cliente'}</h4>
          <p className="text-xs text-gray-500">{request.date}</p>
        </div>
        <OrderStatusBadge status={request.status} />
      </div>

      <div className="mb-2 rounded-lg bg-gray-50 p-2">
        {request.products.state === 'unavailable' ? (
          <p className="text-xs text-red-700">Información de productos no disponible. No puedes aceptar ni preparar este pedido.</p>
        ) : request.products.items.map((product, index) => (
          <div key={`${product.name}-${index}`} className="flex justify-between text-xs">
            <span>{product.quantity}x {product.name}</span>
            <span className="font-semibold">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
          </div>
        ))}
      </div>

      {deliverySchedule && (
        <div className="mb-2 rounded-lg border border-purple-200 bg-purple-50 p-2 text-xs">
          {deliverySchedule}
        </div>
      )}
      {request.note && <p className="mb-2 rounded-lg bg-blue-50 p-2 text-xs italic">“{request.note}”</p>}
      {request.status === 'cancelled' && (
        <p className="mb-2 text-xs text-gray-600">
          Motivo: {request.cancellationReason && request.cancellationReason !== 'unavailable'
            ? REASON_LABELS[request.cancellationReason]
            : 'Motivo no disponible.'}
        </p>
      )}
      {request.referencePhoto && (
        <button type="button" onClick={() => setShowReferencePhoto(true)} className="mb-2 text-xs font-semibold text-teal-700">Ver foto de referencia</button>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
        <span className="text-sm font-bold">{total === null ? 'Total no disponible' : `$${total.toLocaleString('es-CL')}`}</span>
        {request.status === 'pending' && (
          <div className="flex gap-2">
            <button disabled={isUpdating} onClick={() => onAction('reject')} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              <X className="mr-1 inline h-3 w-3" />Rechazar
            </button>
            <button disabled={isUpdating || !canAccept} onClick={() => onAction('accept')} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              <Check className="mr-1 inline h-3 w-3" />Aceptar
            </button>
          </div>
        )}
        {primaryAction && (
          <button disabled={isUpdating || (primaryAction === 'mark-ready' && request.products.state === 'unavailable')} onClick={() => onAction(primaryAction)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {isUpdating ? 'Guardando...' : primaryAction === 'mark-ready' ? 'Marcar pedido listo' : 'Confirmar entrega'}
          </button>
        )}
      </div>

      {showReferencePhoto && request.referencePhoto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black p-4" onClick={() => setShowReferencePhoto(false)}>
          <ImageWithFallback src={request.referencePhoto} alt="Foto de referencia" onClick={(event) => event.stopPropagation()} className="max-h-full w-full object-contain" />
        </div>
      )}
    </div>
  );
}
