import type { BusinessRequest, RequestStatus } from './types';

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
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{request.customerName || 'Cliente'}</h3>
          <p className="text-xs text-gray-500">Pedido del {request.date}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getRequestStatusClass(request.status)}`}>
          {getRequestStatusLabel(request.status)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {request.products.map((product, index) => (
          <div key={`${product.name}-${index}`} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              {product.quantity}x {product.name}
            </span>
            <span className="font-semibold text-gray-900">
              ${(product.price * product.quantity).toLocaleString('es-CL')}
            </span>
          </div>
        ))}
      </div>

      {request.note && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Nota del cliente</p>
          <p className="text-sm text-blue-900">{request.note}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-600">Total</span>
        <span className="text-lg font-bold text-teal-600">
          ${getRequestTotal(request).toLocaleString('es-CL')}
        </span>
      </div>

      {request.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => onReject?.(request.id)}
            className="py-2.5 px-4 rounded-xl font-semibold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={() => onAccept?.(request.id)}
            className="py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md transition-all"
          >
            Aceptar
          </button>
        </div>
      )}
    </div>
  );
}
