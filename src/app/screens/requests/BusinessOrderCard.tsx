import { Check, X } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import type { BusinessRequest, RequestStatus } from './types';
import { formatDate } from './utils';

type BusinessOrderCardProps = {
  request: BusinessRequest;
  onAccept?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
};

const getRequestTotal = (request: BusinessRequest) => (
  request.products.reduce((total, product) => total + product.price * product.quantity, 0)
);

const getRequestStatusLabel = (status: RequestStatus) => {
  if (status === 'accepted') return 'Aceptado';
  if (status === 'rejected') return 'Rechazado';
  return 'En espera';
};

const getRequestStatusClass = (status: RequestStatus) => {
  if (status === 'accepted') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
};

export default function BusinessOrderCard({ request, onAccept, onReject }: BusinessOrderCardProps) {
  const isPending = request.status === 'pending';
  const isAccepted = request.status === 'accepted';
  const borderClass = isPending ? 'border-2 border-amber-200' : 'border border-green-200';
  const deliveryClass = isPending ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-green-50 border-green-200 text-green-900';
  const totalClass = isPending ? 'text-teal-600' : 'text-green-600';

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-3 ${borderClass} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <ImageWithFallback src={request.customerImage} alt={request.customerName} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName || 'Cliente'}</h4>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>{request.date}</span>
            {request.needNow && (
              <>
                <span>•</span>
                <span className="text-orange-600 font-bold">Urgente</span>
              </>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getRequestStatusClass(request.status)}`}>
          {getRequestStatusLabel(request.status)}
        </span>
      </div>

      <div className="mb-2 bg-gray-50 rounded-lg p-2">
        {request.products.map((product, index) => (
          <div key={`${product.name}-${index}`} className="flex items-center justify-between text-xs">
            <span className="text-gray-700">
              {product.quantity}x {product.name}
            </span>
            <span className="font-semibold text-gray-900">
              ${(product.price * product.quantity).toLocaleString('es-CL')}
            </span>
          </div>
        ))}
      </div>

      <div className={`mb-2 p-2 border rounded-lg ${deliveryClass}`}>
        <p className="text-xs">
          {request.needNow ? (
            <span className="font-bold">Lo necesita ahora</span>
          ) : (
            <span>{formatDate(request.deliveryDate)} • {request.deliveryTime}</span>
          )}
        </p>
      </div>

      {isPending && request.note && (
        <div className="mb-2 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 mb-1">Nota del cliente</p>
          <p className="text-xs text-gray-600 italic line-clamp-2">"{request.note}"</p>
        </div>
      )}

      <div className={`flex items-center justify-between ${isPending ? 'gap-2' : ''} pt-2 border-t border-gray-100`}>
        {isPending ? (
          <>
            <span className={`text-sm font-bold ${totalClass}`}>${getRequestTotal(request).toLocaleString('es-CL')}</span>
            <div className="flex gap-2">
              <button
                onClick={() => onReject?.(request.id)}
                className="flex items-center gap-1 py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
              >
                <X className="w-3 h-3" />
                Rechazar
              </button>
              <button
                onClick={() => onAccept?.(request.id)}
                className="flex items-center gap-1 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
              >
                <Check className="w-3 h-3" />
                Aceptar
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-600">Total</span>
            <span className={`text-sm font-bold ${isAccepted ? totalClass : 'text-red-600'}`}>
              ${getRequestTotal(request).toLocaleString('es-CL')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
