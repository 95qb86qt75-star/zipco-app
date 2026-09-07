import { Package } from 'lucide-react';
import { useState } from 'react';
import EmptyRequestsState from './EmptyRequestsState';
import MyOrderCard from './MyOrderCard';
import OrderActionModal from './OrderActionModal';
import { classifyCustomerOrders } from './orderPresentation';
import type { CancellationReason, MyOrder, OrderAction } from './types';

type Props = {
  myOrders: MyOrder[];
  updatingOrderIds: Set<number>;
  onAction: (order: MyOrder, action: OrderAction, reason?: CancellationReason) => Promise<void>;
  onRetry: () => Promise<boolean>;
};

export default function MyOrdersTab({ myOrders, updatingOrderIds, onAction, onRetry }: Props) {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [selection, setSelection] = useState<{ order: MyOrder; action: OrderAction } | null>(null);
  const { active, history, unavailable } = classifyCustomerOrders(myOrders);
  const displayed = tab === 'active' ? active : history;
  const selectedId = selection?.order.recordState === 'available' ? selection.order.id : null;
  const isSubmitting = selectedId !== null && updatingOrderIds.has(selectedId);

  const confirm = async (reason?: CancellationReason) => {
    if (!selection) return;
    await onAction(selection.order, selection.action, reason);
    setSelection(null);
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button onClick={() => setTab('active')} className={`rounded-xl py-2.5 text-sm font-semibold ${tab === 'active' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}>
          Activos ({active.length})
        </button>
        <button onClick={() => setTab('history')} className={`rounded-xl py-2.5 text-sm font-semibold ${tab === 'history' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}>
          Historial ({history.length})
        </button>
      </div>

      {displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((order) => (
            <MyOrderCard
              key={order.clientKey}
              order={order}
              isUpdating={order.recordState === 'available' && updatingOrderIds.has(order.id)}
              onAction={(action) => setSelection({ order, action })}
              onRetry={() => { void onRetry(); }}
            />
          ))}
        </div>
      ) : (
        <EmptyRequestsState icon={Package} title={tab === 'active' ? 'No tienes pedidos activos' : 'Tu historial está vacío'} description="Tus pedidos aparecerán aquí" />
      )}

      {unavailable.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">No disponibles</h3>
          {unavailable.map((order) => (
            <MyOrderCard key={order.clientKey} order={order} isUpdating={false} onAction={() => undefined} onRetry={() => { void onRetry(); }} />
          ))}
        </div>
      )}

      <OrderActionModal
        key={selection ? `${selection.order.clientKey}-${selection.action}` : 'closed'}
        action={selection?.action ?? null}
        isSubmitting={isSubmitting}
        onClose={() => { if (!isSubmitting) setSelection(null); }}
        onConfirm={(reason) => { void confirm(reason); }}
      />
    </>
  );
}
