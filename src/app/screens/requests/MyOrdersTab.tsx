import { Package } from 'lucide-react';
import { useState } from 'react';
import EmptyRequestsState from './EmptyRequestsState';
import MyOrderCard from './MyOrderCard';
import OrderActionModal from './OrderActionModal';
import type { CancellationReason, MyOrder, OrderAction } from './types';

type Props = {
  myOrders: MyOrder[];
  updatingOrderIds: Set<number>;
  onAction: (order: MyOrder, action: OrderAction, reason?: CancellationReason) => Promise<void>;
  onRetry: () => Promise<boolean>;
  emptyTitle: string;
  emptyDescription: string;
};

export default function MyOrdersTab({ myOrders, updatingOrderIds, onAction, onRetry, emptyTitle, emptyDescription }: Props) {
  const [selection, setSelection] = useState<{ order: MyOrder; action: OrderAction } | null>(null);
  const displayed = myOrders.filter((order) => order.recordState === 'available');
  const unavailable = myOrders.filter((order) => order.recordState === 'unavailable');
  const selectedId = selection?.order.recordState === 'available' ? selection.order.id : null;
  const isSubmitting = selectedId !== null && updatingOrderIds.has(selectedId);

  const confirm = async (reason?: CancellationReason) => {
    if (!selection) return;
    await onAction(selection.order, selection.action, reason);
    setSelection(null);
  };

  return (
    <>
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
        <EmptyRequestsState icon={Package} title={emptyTitle} description={emptyDescription} />
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
