import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import type { MyOrder } from './types';

type MyOrderCardProps = {
  order: MyOrder;
  variant: 'pending' | 'history';
};

export default function MyOrderCard({ order, variant }: MyOrderCardProps) {
  if (variant === 'pending') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-200 shadow-md">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <ImageWithFallback src={order.businessImage} alt={order.businessName} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{order.businessName}</h4>
            <p className="text-xs text-gray-500">{order.date}</p>
          </div>
          <div className="px-2 py-1 bg-amber-100 rounded-full">
            <span className="text-xs font-semibold text-amber-700">En espera</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="space-y-1">
            {order.products.map((product, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  {product.quantity}x {product.name}
                </span>
                <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>

        {order.note && (
          <div className="mb-3 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-gray-600 italic">"{order.note}"</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-teal-600">${order.total.toLocaleString('es-CL')}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/60 backdrop-blur-sm rounded-2xl p-4 border ${
        order.status === 'accepted' ? 'border-green-200' : 'border-red-200'
      } shadow-sm`}
    >
      <div className="flex items-center gap-3 mb-2">
        <ImageWithFallback src={order.businessImage} alt={order.businessName} className="w-10 h-10 rounded-full object-cover opacity-70" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-700 text-sm">{order.businessName}</h4>
          <p className="text-xs text-gray-500">{order.date}</p>
        </div>
        <div className={`px-2 py-1 rounded-full ${order.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className={`text-xs font-semibold ${order.status === 'accepted' ? 'text-green-700' : 'text-red-700'}`}>
            {order.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {order.products.length} {order.products.length === 1 ? 'producto' : 'productos'} •
        <span className="font-semibold text-gray-900 ml-1">${order.total.toLocaleString('es-CL')}</span>
      </p>
    </div>
  );
}
