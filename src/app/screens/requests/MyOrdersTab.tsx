import { Package } from 'lucide-react';
import EmptyRequestsState from './EmptyRequestsState';
import MyOrderCard from './MyOrderCard';
import type { MyOrder } from './types';

type MyOrdersTabProps = {
  myOrders: MyOrder[];
};

export default function MyOrdersTab({ myOrders }: MyOrdersTabProps) {
  const pendingOrders = myOrders.filter((order) => order.status === 'pending');
  const processedOrders = myOrders.filter((order) => order.status !== 'pending');

  return (
    <>
      <p className="text-sm text-gray-600 mb-4">
        {pendingOrders.length} {pendingOrders.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
      </p>

      {pendingOrders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3">Pendientes</h3>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <MyOrderCard key={order.id} order={order} variant="pending" />
            ))}
          </div>
        </div>
      )}

      {processedOrders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3">Historial</h3>
          <div className="space-y-3">
            {processedOrders.map((order) => (
              <MyOrderCard key={order.id} order={order} variant="history" />
            ))}
          </div>
        </div>
      )}

      {myOrders.length === 0 && (
        <EmptyRequestsState icon={Package} title="Aun no tienes pedidos" description="Tus pedidos apareceran aqui" />
      )}
    </>
  );
}
