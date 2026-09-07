import { Check, ClipboardList, History, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import BusinessOrderCard from './BusinessOrderCard';
import { classifyBusinessDeliveryDate, type BusinessDateFilter } from './businessOrderDates';
import EmptyRequestsState from './EmptyRequestsState';
import OrderActionModal from './OrderActionModal';
import { classifyBusinessOrders } from './orderPresentation';
import type { BusinessRequest, CancellationReason, OrderAction } from './types';

type Section = 'pending' | 'preparing' | 'ready' | 'history';
type Props = {
  requests: BusinessRequest[];
  updatingOrderIds: Set<number>;
  onAction: (order: BusinessRequest, action: OrderAction, reason?: CancellationReason) => Promise<void>;
  onRetry: () => Promise<boolean>;
};

export default function BusinessOrdersTab({ requests, updatingOrderIds, onAction, onRetry }: Props) {
  const [section, setSection] = useState<Section>('pending');
  const [dateFilter, setDateFilter] = useState<BusinessDateFilter>('today');
  const [selection, setSelection] = useState<{ order: BusinessRequest; action: OrderAction } | null>(null);
  const groups = classifyBusinessOrders(requests);
  const selectedId = selection?.order.recordState === 'available' ? selection.order.id : null;
  const isSubmitting = selectedId !== null && updatingOrderIds.has(selectedId);
  const preparing = groups.preparing.filter((order) => classifyBusinessDeliveryDate(order) === dateFilter);
  const displayed = section === 'pending' ? groups.pending : section === 'preparing' ? preparing : section === 'ready' ? groups.ready : groups.history;

  const confirm = async (reason?: CancellationReason) => {
    if (!selection) return;
    await onAction(selection.order, selection.action, reason);
    setSelection(null);
  };

  const tabs: Array<{ key: Section; label: string; count: number }> = [
    { key: 'pending', label: 'Pendientes', count: groups.pending.length },
    { key: 'preparing', label: 'En preparación', count: groups.preparing.length },
    { key: 'ready', label: 'Listos', count: groups.ready.length },
    { key: 'history', label: 'Historial', count: groups.history.length }
  ];

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setSection(tab.key)} className={`shrink-0 rounded-xl px-3 py-2.5 text-xs font-semibold ${section === tab.key ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {section === 'preparing' && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['today', 'tomorrow', 'upcoming', 'undated'] as const).map((filter) => (
            <button key={filter} onClick={() => setDateFilter(filter)} className={`rounded-xl py-2 text-xs font-semibold ${dateFilter === filter ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'}`}>
              {filter === 'today' ? 'Hoy' : filter === 'tomorrow' ? 'Mañana' : filter === 'upcoming' ? 'Próximos' : 'Sin fecha'} ({groups.preparing.filter((order) => classifyBusinessDeliveryDate(order) === filter).length})
            </button>
          ))}
        </div>
      )}

      {displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((order) => (
            <BusinessOrderCard key={order.clientKey} request={order} isUpdating={order.recordState === 'available' && updatingOrderIds.has(order.id)} onAction={(action) => setSelection({ order, action })} onRetry={() => { void onRetry(); }} />
          ))}
        </div>
      ) : (
        <EmptyRequestsState icon={section === 'pending' ? ClipboardList : section === 'ready' ? PackageCheck : section === 'history' ? History : Check} title="No hay pedidos en esta sección" description="Los pedidos correspondientes aparecerán aquí" />
      )}

      {groups.unavailable.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">No disponibles</h3>
          {groups.unavailable.map((order) => <BusinessOrderCard key={order.clientKey} request={order} isUpdating={false} onAction={() => undefined} onRetry={() => { void onRetry(); }} />)}
        </div>
      )}

      <OrderActionModal key={selection ? `${selection.order.clientKey}-${selection.action}` : 'closed'} action={selection?.action ?? null} isSubmitting={isSubmitting} onClose={() => { if (!isSubmitting) setSelection(null); }} onConfirm={(reason) => { void confirm(reason); }} />
    </>
  );
}
