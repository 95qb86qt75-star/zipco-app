import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Filter, List, Minus, RefreshCw, X } from 'lucide-react';
import BusinessOrdersTab from './requests/BusinessOrdersTab';
import MyOrdersTab from './requests/MyOrdersTab';
import useRequests from './requests/useRequests';
import NotificationPermissionCard from '../notifications/NotificationPermissionCard';
import { BusinessQuotes, CustomerQuotes } from './quotes/QuotesPanel';
import useQuotes from './quotes/useQuotes';
import { OrderHistoryList, QuoteHistoryList } from './requests/CompactHistoryList';
import { markInteractionUnread } from '../notifications/unreadInteractions';
import {
  countStatusViews,
  filterByStatusView,
  statusViewFor,
  type HistoryFilter,
  type StatusView
} from './requests/requestStatusGrouping';

export default function RequestsScreen({
  onBack,
  onSessionExpired
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onSessionExpired: () => void;
}) {
  const openTarget = new URLSearchParams(window.location.search).get('open');
  const [subTab, setSubTab] = useState<'my-orders' | 'my-business'>(() =>
    openTarget === 'requests-business' || openTarget === 'requests-business-quotes' ? 'my-business' : 'my-orders'
  );
  const [requestType, setRequestType] = useState<'orders' | 'quotes'>(() =>
    openTarget?.endsWith('-quotes') ? 'quotes' : 'orders'
  );
  const [statusViews, setStatusViews] = useState<Record<string, StatusView>>({});
  const [historyFilters, setHistoryFilters] = useState<Record<string, HistoryFilter>>({});
  const [sortDirections, setSortDirections] = useState<Record<string, 'newest' | 'oldest'>>({});
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const { hasBusiness, isLoading, loadError, myOrders, requests, updatingOrderIds, loadOrders, performAction } = useRequests(onSessionExpired);
  const quotes = useQuotes(onSessionExpired);
  const viewKey = `${subTab}-${requestType}`;
  const statusView = statusViews[viewKey] ?? 'pending';
  const historyFilter = historyFilters[viewKey] ?? 'all';
  const sortDirection = sortDirections[viewKey] ?? 'newest';
  const orderRecords = subTab === 'my-orders' ? myOrders : requests;
  const quoteRecords = subTab === 'my-orders' ? quotes.myQuotes : quotes.businessQuotes;
  const statusCounts = countStatusViews(
    requestType === 'orders' ? orderRecords : quoteRecords,
    requestType
  );
  const sortRecords = <T extends { createdAt?: string | null; updatedAt?: string | null },>(records: T[]) => [...records].sort((left, right) => {
    const leftTime = new Date(left.createdAt || left.updatedAt || 0).getTime();
    const rightTime = new Date(right.createdAt || right.updatedAt || 0).getTime();
    return sortDirection === 'newest' ? rightTime - leftTime : leftTime - rightTime;
  });
  const filteredMyOrders = sortRecords(filterByStatusView(myOrders, 'orders', statusView, historyFilter));
  const filteredBusinessOrders = sortRecords(filterByStatusView(requests, 'orders', statusView, historyFilter));
  const filteredQuotes = sortRecords(filterByStatusView(quoteRecords, 'quotes', statusView, historyFilter));
  const emptyCopy = {
    pending: {
      title: 'No tienes solicitudes pendientes',
      description: 'Cuando algo requiera atención aparecerá aquí.'
    },
    active: {
      title: 'No tienes solicitudes en curso',
      description: 'Las solicitudes aceptadas que todavía están en proceso aparecerán aquí.'
    },
    waiting: {
      title: 'No tienes cotizaciones esperando respuesta',
      description: 'Las cotizaciones respondidas aparecerán aquí mientras esperan al cliente.'
    },
    history: {
      title: historyFilter === 'all' ? 'Todavía no tienes historial' : 'No hay resultados para este filtro',
      description: historyFilter === 'all' ? 'Las solicitudes finalizadas aparecerán aquí.' : 'Prueba mostrando todo el historial.'
    }
  }[statusView];

  const selectStatusView = (view: StatusView) => {
    setStatusViews((current) => ({ ...current, [viewKey]: view }));
  };
  const historyOptions: Array<{ value: HistoryFilter; label: string; description: string }> = [
    { value: 'all', label: 'Todas', description: 'Muestra todas las solicitudes finalizadas.' },
    ...(requestType === 'orders'
      ? [{ value: 'completed' as const, label: 'Completadas', description: 'Pedidos finalizados correctamente.' }]
      : []),
    { value: 'cancelled', label: 'Canceladas', description: 'Solicitudes que no continuaron.' },
    { value: 'rejected', label: 'Rechazadas', description: 'Solicitudes rechazadas antes de concretarse.' }
  ];
  const historyFilterLabel = historyOptions.find((option) => option.value === historyFilter)?.label ?? 'Todas';

  useEffect(() => {
    if (!hasBusiness && subTab === 'my-business') setSubTab('my-orders');
  }, [hasBusiness, subTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quoteId = Number(params.get('quoteId'));
    const orderId = Number(params.get('orderId'));
    if (Number.isInteger(quoteId) && quoteId > 0) markInteractionUnread('quote', quoteId);
    if (Number.isInteger(orderId) && orderId > 0) markInteractionUnread('order', orderId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quoteId = Number(params.get('quoteId'));
    const orderId = Number(params.get('orderId'));
    const target = Number.isInteger(quoteId) && quoteId > 0
      ? quoteRecords.find((quote) => quote.id === quoteId)
      : Number.isInteger(orderId) && orderId > 0
        ? orderRecords.find((order) => order.recordState === 'available' && order.id === orderId)
        : undefined;
    if (!target) return;
    const targetKind = Number.isInteger(quoteId) && quoteId > 0 ? 'quotes' : 'orders';
    const targetView = statusViewFor(targetKind, target.status);
    if (!targetView) return;
    setRequestType(targetKind);
    setStatusViews((current) => ({ ...current, [`${subTab}-${targetKind}`]: targetView }));
    window.setTimeout(() => document.getElementById(`${targetKind === 'quotes' ? 'quote' : 'order'}-${targetKind === 'quotes' ? quoteId : orderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [orderRecords, quoteRecords, subTab]);

  return (
    <div className="size-full min-h-0 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('my-orders')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-orders' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            Mis Pedidos
          </button>
          {hasBusiness && (
            <button
              onClick={() => setSubTab('my-business')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                subTab === 'my-business' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Mi Negocio
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-24">
        <NotificationPermissionCard />
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1.5 shadow-sm">
          <button onClick={() => setRequestType('orders')} className={`rounded-xl py-2 text-sm font-bold ${requestType === 'orders' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>Pedidos</button>
          <button onClick={() => setRequestType('quotes')} className={`rounded-xl py-2 text-sm font-bold ${requestType === 'quotes' ? 'bg-violet-600 text-white' : 'text-slate-600'}`}>Cotizaciones</button>
        </div>
        <div className={`mb-3 grid gap-2 ${requestType === 'quotes' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {(requestType === 'quotes' ? [
            { key: 'pending', label: subTab === 'my-business' ? 'Solicitudes' : 'Enviadas', count: statusCounts.pending },
            { key: 'waiting', label: subTab === 'my-business' ? 'Esperando cliente' : 'Por responder', count: statusCounts.waiting },
            { key: 'active', label: 'En curso', count: statusCounts.active },
            { key: 'history', label: 'Historial', count: null }
          ] as const : [
            { key: 'pending', label: 'Pendientes', count: statusCounts.pending },
            { key: 'active', label: 'En curso', count: statusCounts.active },
            { key: 'history', label: 'Historial', count: null }
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => selectStatusView(item.key)}
              className={`min-w-0 rounded-xl px-1.5 py-2.5 text-[11px] font-bold leading-tight shadow-sm transition-all ${
                statusView === item.key
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                  : 'bg-white text-slate-600'
              }`}
            >
              {item.label}{item.count !== null ? ` (${item.count})` : ''}
            </button>
          ))}
        </div>
        <div className="mb-4 flex justify-end">
          <button onClick={() => setSortDirections((current) => ({ ...current, [viewKey]: sortDirection === 'newest' ? 'oldest' : 'newest' }))} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
            {sortDirection === 'newest' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
            {sortDirection === 'newest' ? 'Más recientes' : 'Más antiguas'}
          </button>
        </div>
        {statusView === 'history' && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Historial</h3>
              <p className="text-xs text-slate-500">Tus solicitudes finalizadas.</p>
            </div>
            <button onClick={() => setShowHistoryFilter(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <Filter className="h-4 w-4" />
              {historyFilter === 'all' ? 'Filtrar' : historyFilterLabel}
            </button>
          </div>
        )}
        {requestType === 'quotes' && quotes.loading && <div className="py-16 text-center text-sm font-semibold text-slate-500">Cargando cotizaciones…</div>}
        {requestType === 'quotes' && !quotes.loading && quotes.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><p className="text-sm font-semibold text-red-700">{quotes.error}</p><button onClick={() => void quotes.load()} className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-700">Intentar nuevamente</button></div>}
        {requestType === 'quotes' && !quotes.loading && !quotes.error && filteredQuotes.length === 0 && <CustomerQuotes quotes={[]} updating={quotes.updating} onStatus={quotes.changeStatus} emptyText={emptyCopy.description} />}
        {requestType === 'quotes' && !quotes.loading && !quotes.error && filteredQuotes.length > 0 && statusView === 'history' && <QuoteHistoryList quotes={filteredQuotes} owner={subTab === 'my-orders' ? 'customer' : 'business'} />}
        {requestType === 'quotes' && !quotes.loading && !quotes.error && filteredQuotes.length > 0 && statusView !== 'history' && subTab === 'my-orders' && <CustomerQuotes quotes={filteredQuotes} updating={quotes.updating} onStatus={quotes.changeStatus} emptyText={emptyCopy.description} />}
        {requestType === 'quotes' && !quotes.loading && !quotes.error && filteredQuotes.length > 0 && statusView !== 'history' && hasBusiness && subTab === 'my-business' && <BusinessQuotes quotes={filteredQuotes} updating={quotes.updating} onRespond={quotes.respond} emptyText={emptyCopy.description} />}
        {requestType === 'orders' && <>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-600">Cargando pedidos...</p>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-semibold text-red-700">{loadError}</p>
            <button type="button" onClick={() => { void loadOrders(); }} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm ring-1 ring-red-200">
              <RefreshCw className="h-4 w-4" /> Intentar nuevamente
            </button>
          </div>
        )}

        {!isLoading && !loadError && statusView === 'history' && subTab === 'my-orders' && filteredMyOrders.length > 0 && <OrderHistoryList orders={filteredMyOrders} owner="customer" />}
        {!isLoading && !loadError && statusView === 'history' && hasBusiness && subTab === 'my-business' && filteredBusinessOrders.length > 0 && <OrderHistoryList orders={filteredBusinessOrders} owner="business" />}

        {!isLoading && !loadError && statusView !== 'history' && subTab === 'my-orders' && (
          <MyOrdersTab
            myOrders={filteredMyOrders}
            updatingOrderIds={updatingOrderIds}
            onRetry={loadOrders}
            onAction={(order, action, reason) => performAction(order, 'customer', action, reason)}
            emptyTitle={emptyCopy.title}
            emptyDescription={emptyCopy.description}
          />
        )}

        {!isLoading && !loadError && statusView !== 'history' && hasBusiness && subTab === 'my-business' && (
          <BusinessOrdersTab
            requests={filteredBusinessOrders}
            updatingOrderIds={updatingOrderIds}
            onRetry={loadOrders}
            onAction={(order, action, reason) => performAction(order, 'business', action, reason)}
            emptyTitle={emptyCopy.title}
            emptyDescription={emptyCopy.description}
          />
        )}
        {!isLoading && !loadError && statusView === 'history' && (subTab === 'my-orders' ? filteredMyOrders.length === 0 : filteredBusinessOrders.length === 0) && (
          <MyOrdersTab myOrders={[]} updatingOrderIds={updatingOrderIds} onRetry={loadOrders} onAction={async () => undefined} emptyTitle={emptyCopy.title} emptyDescription={emptyCopy.description} />
        )}
        </>}
      </div>
      {showHistoryFilter && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Filtrar historial</h3>
              <button onClick={() => setShowHistoryFilter(false)} className="rounded-full p-2 text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-1">
              {historyOptions.map((option) => {
                const selected = historyFilter === option.value;
                const statusIcon = option.value === 'all'
                  ? <span className="flex h-9 w-9 justify-self-center items-center justify-center rounded-full bg-teal-100 text-teal-600"><List className="h-5 w-5" /></span>
                  : option.value === 'completed'
                    ? <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-4 w-4 stroke-[3]" /></span>
                    : option.value === 'cancelled'
                      ? <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-red-500 text-white"><X className="h-4 w-4 stroke-[3]" /></span>
                      : <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-slate-500 text-white"><Minus className="h-4 w-4 stroke-[3]" /></span>;
                return (
                <button
                  key={option.value}
                  onClick={() => setHistoryFilters((current) => ({ ...current, [viewKey]: option.value }))}
                  className={`grid w-full grid-cols-[24px_40px_1fr] items-center gap-3 rounded-2xl p-4 text-left transition-colors ${selected ? 'bg-gradient-to-r from-teal-50 to-cyan-50' : 'bg-white'}`}
                >
                  <span className={`h-5 w-5 rounded-full border-2 ${
                    selected ? 'border-teal-500 bg-teal-500 shadow-[inset_0_0_0_4px_white]' : 'border-slate-300 bg-white'
                  }`} />
                  {statusIcon}
                  <span><span className="block text-sm font-bold text-slate-900">{option.label}</span><span className="mt-1 block text-xs leading-4 text-slate-500">{option.description}</span></span>
                </button>
                );
              })}
            </div>
            <button onClick={() => setShowHistoryFilter(false)} className="mt-5 w-full rounded-xl bg-teal-600 py-3 font-bold text-white">Aplicar filtro</button>
          </div>
        </div>
      )}
    </div>
  );
}
