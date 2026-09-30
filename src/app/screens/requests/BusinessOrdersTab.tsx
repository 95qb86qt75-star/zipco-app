import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import BusinessOrderCard from './BusinessOrderCard';
import EmptyRequestsState from './EmptyRequestsState';
import OrderActionModal from './OrderActionModal';
import type { BusinessRequest, CancellationReason, OrderAction } from './types';
import { interactionKey, useUnreadInteractions } from '../../notifications/unreadInteractions';

type Props = {
  requests: BusinessRequest[];
  updatingOrderIds: Set<number>;
  onAction: (order: BusinessRequest, action: OrderAction, reason?: CancellationReason) => Promise<void>;
  onRetry: () => Promise<boolean>;
  emptyTitle: string;
  emptyDescription: string;
};

export default function BusinessOrdersTab({ requests, updatingOrderIds, onAction, onRetry, emptyTitle, emptyDescription }: Props) {
  const { unread, markRead } = useUnreadInteractions();
  const [selection, setSelection] = useState<{ order: BusinessRequest; action: OrderAction } | null>(null);
  const displayed = requests.filter((order) => order.recordState === 'available');
  const unavailable = requests.filter((order) => order.recordState === 'unavailable');
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
            <BusinessOrderCard key={order.clientKey} request={order} isUpdating={order.recordState === 'available' && updatingOrderIds.has(order.id)} onAction={(action) => setSelection({ order, action })} onRetry={() => { void onRetry(); }} isUnread={order.recordState === 'available' && unread.has(interactionKey('order', order.id))} onOpen={() => { if (order.recordState === 'available') markRead('order', order.id); }} />
          ))}
        </div>
      ) : (
        <EmptyRequestsState icon={ClipboardList} title={emptyTitle} description={emptyDescription} />
      )}

      {unavailable.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">No disponibles</h3>
          {unavailable.map((order) => <BusinessOrderCard key={order.clientKey} request={order} isUpdating={false} onAction={() => undefined} onRetry={() => { void onRetry(); }} />)}
        </div>
      )}

      <OrderActionModal key={selection ? `${selection.order.clientKey}-${selection.action}` : 'closed'} action={selection?.action ?? null} isSubmitting={isSubmitting} onClose={() => { if (!isSubmitting) setSelection(null); }} onConfirm={(reason) => { void confirm(reason); }} />
    </>
  );
}
