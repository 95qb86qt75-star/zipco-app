import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import OrderStatusBadge from './OrderStatusBadge';
import type { MyOrder, OrderAction } from './types';

const REASON_LABELS = {
  no_longer_needed: 'Ya no lo necesitaba.',
  business_took_too_long: 'El negocio tardó demasiado.',
  selected_by_mistake: 'Lo seleccionó por error.'
} as const;

type Props = {
  order: MyOrder;
  isUpdating: boolean;
  onAction: (action: OrderAction) => void;
  onRetry: () => void;
};

export default function MyOrderCard({ order, isUpdating, onAction, onRetry }: Props) {
  if (order.recordState === 'unavailable') {
    return (
      <div className="bg-white/80 rounded-2xl p-4 border border-gray-300 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Pedido no disponible</h4>
            <p className="text-xs text-gray-500">No pudimos interpretar el estado de este pedido.</p>
          </div>
          <OrderStatusBadge status="unavailable" />
        </div>
        <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold text-teal-700">
          Intentar nuevamente
        </button>
      </div>
    );
  }

  const action = order.status === 'pending'
    ? 'cancel'
    : order.status === 'ready'
      ? 'complete-reception'
      : null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
        <ImageWithFallback src={order.businessImage} alt={order.businessName} className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{order.businessName}</h4>
          <p className="text-xs text-gray-500">{order.date}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.products.state === 'unavailable' ? (
        <p className="mb-3 text-sm text-red-700">Información de productos no disponible.</p>
      ) : (
        <div className="mb-3 space-y-1">
          {order.products.items.map((product, index) => (
            <div key={`${product.name}-${index}`} className="flex justify-between text-sm">
              <span>{product.quantity}x {product.name}</span>
              <span className="font-semibold">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
            </div>
          ))}
        </div>
      )}

      {order.status === 'accepted' && (
        <p className="mb-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">El negocio está preparando tu pedido.</p>
      )}
      {order.status === 'cancelled' && (
        <p className="mb-3 text-sm text-gray-600">
          Motivo: {order.cancellationReason && order.cancellationReason !== 'unavailable'
            ? REASON_LABELS[order.cancellationReason]
            : 'Motivo no disponible.'}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="font-bold">{order.total === null ? 'Total no disponible' : `$${order.total.toLocaleString('es-CL')}`}</span>
        {action && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onAction(action)}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isUpdating ? 'Guardando...' : action === 'cancel' ? 'Cancelar pedido' : 'Confirmar recepción'}
          </button>
        )}
      </div>
    </div>
  );
}
