import ReadyOrdersSummary from './requests/ReadyOrdersSummary';
import CoordinationOrdersSummary from './requests/CoordinationOrdersSummary';
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Archive,
  Check,
  Bell,
  ChevronRight,
  Filter,
  List,
  MessageSquareText,
  Minus,
  PackageCheck,
  RefreshCw,
  Trash2,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import BusinessOrdersTab from "./requests/BusinessOrdersTab";
import MyOrdersTab from "./requests/MyOrdersTab";
import useRequests from "./requests/useRequests";
import NotificationPermissionCard from "../notifications/NotificationPermissionCard";
import { BusinessQuotes, CustomerQuotes } from "./quotes/QuotesPanel";
import useQuotes from "./quotes/useQuotes";
import {
  OrderHistoryList,
  QuoteHistoryList,
} from "./requests/CompactHistoryList";
import {
  interactionKey,
  markInteractionRead,
  markInteractionUnread,
  publishActiveRequestCount,
  useUnreadInteractions,
} from "../notifications/unreadInteractions";
import {
  countStatusViews,
  filterByStatusView,
  statusViewFor,
  type HistoryFilter,
  type StatusView,
} from "./requests/requestStatusGrouping";
import { getCustomerAttentionItems, getCustomerCoordinationItems } from "./requests/requestAttentionSummary";
import { businessOrderTabs } from "./requests/orderTabs";
import RequestStatusTab from "./requests/RequestStatusTab";
import { initialRequestViews } from "./requests/agreementNavigation";
import LoadOrdersDiagnostics from './requests/LoadOrdersDiagnosticsPanel';
import { waitForNotificationCard } from '../notifications/notificationNavigation';
import { traceNotificationClick } from '../notifications/notificationClickTrace';
import { scrollToRequestResults } from './requests/requestSummaryScroll';
import { isPendingRequestCancelled, isPendingRequestRejected, normalizeRequestProcess } from './requests/requestProcess';

export default function RequestsScreen({
  onBack,
  onSessionExpired,
  onNotificationFocused,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onSessionExpired: () => void;
  onNotificationFocused?: (url: string) => void;
}) {
  const openTarget = new URLSearchParams(window.location.search).get("open");
  const [subTab, setSubTab] = useState<"my-orders" | "my-business">(() =>
    openTarget === "requests-business" ||
    openTarget === "requests-business-quotes"
      ? "my-business"
      : "my-orders",
  );
  const [requestType, setRequestType] = useState<"orders" | "quotes">(() =>
    openTarget?.endsWith("-quotes") ? "quotes" : "orders",
  );
  const [statusViews, setStatusViews] = useState<Record<string, StatusView>>(
    () => initialRequestViews(window.location.search),
  );
  const [historyFilters, setHistoryFilters] = useState<
    Record<string, HistoryFilter>
  >({});
  const [sortDirections, setSortDirections] = useState<
    Record<string, "newest" | "oldest">
  >({});
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState<
    "responses" | "ready" | "browse" | null
  >(null);
  const [selectedBusinessActivity, setSelectedBusinessActivity] = useState<
    string | null
  >(null);
  const [summaryScrollPending, setSummaryScrollPending] = useState<{
    role: 'my-orders' | 'my-business'; kind: 'orders' | 'quotes'; view: StatusView;
    attention: 'browse' | 'responses' | 'ready';
  } | null>(null);
  const [historyTransfer, setHistoryTransfer] = useState<{
    kind: "order" | "quote";
    id: number;
    label: string;
  } | null>(null);
  const [activeTransfer, setActiveTransfer] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { unread } = useUnreadInteractions();
  const {
    hasBusiness,
    isLoading,
    loadError,
    myOrders,
    requests,
    updatingOrderIds,
    loadOrders,
    performAction,
    proposeAlternative: proposeOrderAlternative,
    setArchived: setOrderArchived,
    deletePermanently: deleteOrderPermanently,
  } = useRequests(onSessionExpired);
  const quotes = useQuotes(onSessionExpired);
  const viewKey = `${subTab}-${requestType}`;
  const statusView = statusViews[viewKey] ?? "pending";
  const historyFilter = historyFilters[viewKey] ?? "all";
  const sortDirection = sortDirections[viewKey] ?? "newest";
  const orderRecords = subTab === "my-orders" ? myOrders : requests;
  const quoteRecords =
    subTab === "my-orders" ? quotes.myQuotes : quotes.businessQuotes;
  const customerOrderAttention = getCustomerAttentionItems(
    myOrders,
    "orders",
    unread,
  );
  const customerQuoteAttention = getCustomerAttentionItems(
    quotes.myQuotes,
    "quotes",
    unread,
  );
  const selectedCustomerAttention =
    requestType === "orders" ? customerOrderAttention : customerQuoteAttention;
  const readyCustomerItems =
    subTab === "my-orders" ? selectedCustomerAttention.ready : [];
  const responseCustomerItems =
    subTab === "my-orders" ? selectedCustomerAttention.responses : [];
  const statusCounts = countStatusViews(
    requestType === "orders" ? orderRecords : quoteRecords,
    requestType,
  );
  const businessOrderStatusCounts = countStatusViews(
    requests.filter((record) => record.recordState === "available"),
    "orders",
  );
  const businessQuoteStatusCounts = countStatusViews(
    quotes.businessQuotes,
    "quotes",
  );
  const businessActivityCards = (
    [
      ...(["pending", "coordination", "waiting", "active", "ready"] as const).map((view) => ({
        kind: "orders" as const,
        view,
        count: businessOrderStatusCounts[view],
      })),
      ...(["pending", "waiting", "active", "ready"] as const).map((view) => ({
        kind: "quotes" as const,
        view,
        count: businessQuoteStatusCounts[view],
      })),
    ] as const
  ).filter((item) => item.count > 0);
  const customerRoleBadge =
    customerOrderAttention.count + customerQuoteAttention.count;
  const customerCoordinationItems = getCustomerCoordinationItems(myOrders);
  const customerAttentionCards = (
    [
      {
        kind: "orders" as const,
        filter: "responses" as const,
        items: customerOrderAttention.responses,
      },
      {
        kind: "orders" as const,
        filter: "ready" as const,
        items: customerOrderAttention.ready,
      },
      {
        kind: "quotes" as const,
        filter: "responses" as const,
        items: customerQuoteAttention.responses,
      },
      {
        kind: "quotes" as const,
        filter: "ready" as const,
        items: customerQuoteAttention.ready,
      },
    ] as const
  ).filter((card) => card.items.length > 0);
  const businessRoleBadge =
    requests.filter(
      (record) =>
        record.recordState === "available" &&
        statusViewFor("orders", record.status, record.requestProcess, record.requestProcessInvalid) !== null &&
        statusViewFor("orders", record.status, record.requestProcess, record.requestProcessInvalid) !== "history",
    ).length +
    quotes.businessQuotes.filter(
      (record) =>
        statusViewFor("quotes", record.status) !== null &&
        statusViewFor("quotes", record.status) !== "history",
    ).length;
  const activeRequestCount = customerRoleBadge + businessRoleBadge;
  useEffect(() => {
    if (isLoading || quotes.loading) return;
    publishActiveRequestCount(activeRequestCount);
  }, [activeRequestCount, isLoading, quotes.loading]);
  const acceptedBusinessQuotes =
    subTab === "my-business" && requestType === "quotes"
      ? quotes.businessQuotes.filter(
          (quote) =>
            quote.status === "accepted" &&
            unread.has(interactionKey("quote", quote.id)),
        )
      : [];
  const unreadHistoryCount = (
    requestType === "orders" ? orderRecords : quoteRecords
  )
    .filter((record) => statusViewFor(requestType, record.status, 'requestProcess' in record ? record.requestProcess : undefined, 'requestProcessInvalid' in record ? record.requestProcessInvalid : false) === "history")
    .filter((record) =>
      unread.has(
        interactionKey(requestType === "orders" ? "order" : "quote", record.id),
      ),
    ).length;
  const sortRecords = <
    T extends { createdAt?: string | null; updatedAt?: string | null },
  >(
    records: T[],
  ) =>
    [...records].sort((left, right) => {
      const leftTime = new Date(
        left.updatedAt || left.createdAt || 0,
      ).getTime();
      const rightTime = new Date(
        right.updatedAt || right.createdAt || 0,
      ).getTime();
      return sortDirection === "newest"
        ? rightTime - leftTime
        : leftTime - rightTime;
    });
  let filteredMyOrders = sortRecords(
    filterByStatusView(myOrders, "orders", statusView, historyFilter),
  );
  const filteredBusinessOrders = sortRecords(
    filterByStatusView(requests, "orders", statusView, historyFilter),
  );
  let filteredQuotes = sortRecords(
    filterByStatusView(
      quoteRecords,
      "quotes",
      statusView,
      historyFilter,
      (quote) =>
        Boolean(
          subTab === "my-orders"
            ? quote.customerArchivedAt
            : quote.businessArchivedAt,
        ),
    ),
  );
  const hasAttentionChoices =
    subTab === "my-orders" && customerAttentionCards.length > 0;
  const suppressAttentionResults =
    hasAttentionChoices && attentionFilter === null;
  if (
    hasAttentionChoices &&
    (attentionFilter === "responses" || attentionFilter === "ready")
  ) {
    const selectedItems =
      attentionFilter === "ready"
        ? readyCustomerItems
        : attentionFilter === "responses"
          ? responseCustomerItems
          : [];
    const selectedIds = new Set(selectedItems.map((item) => item.id));
    if (requestType === "orders")
      filteredMyOrders = sortRecords(
        myOrders.filter(
          (order) =>
            order.recordState === "available" && selectedIds.has(order.id),
        ),
      );
    else
      filteredQuotes = sortRecords(
        quotes.myQuotes.filter((quote) => selectedIds.has(quote.id)),
      );
  }
  const confirmedCancellationInHistory = subTab === 'my-orders' && requestType === 'orders' && statusView === 'history' &&
    filteredMyOrders.some(order => order.status === 'cancelled' && isPendingRequestCancelled(order.requestProcess));
  const confirmedRejectionInHistory = requestType === 'orders' && statusView === 'history' &&
    (subTab === 'my-orders' ? filteredMyOrders : filteredBusinessOrders).some(order => order.status === 'rejected' && isPendingRequestRejected(order.requestProcess));
  const emptyCopy = {
    coordination: { title: 'No tienes pedidos en Coordinación', description: 'Los pedidos aceptados de esta etapa aparecerán aquí.' },
    pending: {
      title: "No tienes solicitudes pendientes",
      description: "Cuando algo requiera atención aparecerá aquí.",
    },
    active: {
      title: "No tienes solicitudes en curso",
      description:
        "Las solicitudes aceptadas que todavía están en proceso aparecerán aquí.",
    },
    ready: {
      title: requestType === 'orders' ? 'No tienes pedidos listos' : "No tienes solicitudes listas y notificadas",
      description:
        requestType === 'orders' ? 'Los pedidos que el negocio marque como listos aparecerán aquí.' : "Las solicitudes terminadas que esperan confirmación del cliente aparecerán aquí.",
    },
    waiting: {
      title: "No tienes cotizaciones esperando respuesta",
      description:
        "Las cotizaciones respondidas aparecerán aquí mientras esperan al cliente.",
    },
    history: {
      title:
        historyFilter === "all"
          ? "Todavía no tienes historial"
          : "No hay resultados para este filtro",
      description:
        historyFilter === "deleted"
          ? "Las solicitudes que muevas a Eliminados aparecerán aquí."
          : historyFilter === "all"
            ? "Las solicitudes finalizadas aparecerán aquí."
            : "Prueba mostrando todo el historial.",
    },
  }[statusView];

  const selectStatusView = (view: StatusView) => {
    setSelectedBusinessActivity(null);
    setAttentionFilter("browse");
    setStatusViews((current) => ({ ...current, [viewKey]: view }));
  };
  const changeQuoteStatusAndFollow = async (
    quote: Parameters<typeof quotes.changeStatus>[0],
    status: Parameters<typeof quotes.changeStatus>[1],
    reason?: Parameters<typeof quotes.changeStatus>[2],
    detail?: string,
  ) => {
    if (status === "completed") {
      setAttentionFilter(null);
      setHistoryTransfer({
        kind: "quote",
        id: quote.id,
        label: "Servicio recibido conforme",
      });
      const minimumAnimation = new Promise((resolve) =>
        window.setTimeout(resolve, prefersReducedMotion ? 700 : 2800),
      );
      const [completed] = await Promise.all([
        quotes.changeStatus(quote, status, reason, detail),
        minimumAnimation,
      ]);
      setHistoryTransfer(null);
      if (completed) markInteractionUnread("quote", quote.id);
      return;
    }
    if (status === "accepted") {
      setActiveTransfer({
        title: "Cotización aceptada",
        description: "Avisamos al negocio. Tu solicitud pasó a En curso.",
      });
      const minimumAnimation = new Promise((resolve) =>
        window.setTimeout(resolve, prefersReducedMotion ? 700 : 2800),
      );
      const [changed] = await Promise.all([
        quotes.changeStatus(quote, status, reason, detail),
        minimumAnimation,
      ]);
      setActiveTransfer(null);
      if (changed)
        setStatusViews((current) => ({ ...current, [viewKey]: "active" }));
      return;
    }
    if (status === "ready") {
      setActiveTransfer({
        title: "Cliente notificado",
        description:
          "Le avisamos que el servicio fue realizado. Esperamos su confirmación.",
      });
      await Promise.all([
        quotes.changeStatus(quote, status, reason, detail),
        new Promise((resolve) =>
          window.setTimeout(resolve, prefersReducedMotion ? 700 : 2800),
        ),
      ]);
      setActiveTransfer(null);
      // Keep the business in En curso after notifying the customer. The
      // hologram communicates the move and the Listo y notificado counter
      // updates, but changing tabs here interrupts a batch preparation flow.
      return;
    }
    if (status === "declined") {
      setActiveTransfer({
        title: "Propuesta rechazada",
        description: "Avisamos al negocio sobre tu decisión.",
      });
      const [changed] = await Promise.all([
        quotes.changeStatus(quote, status, reason, detail),
        new Promise((resolve) =>
          window.setTimeout(resolve, prefersReducedMotion ? 700 : 2800),
        ),
      ]);
      setActiveTransfer(null);
      if (changed)
        setStatusViews((current) => ({ ...current, [viewKey]: "history" }));
      return;
    }
    const changed = await quotes.changeStatus(quote, status, reason, detail);
    if (!changed) return;
    const nextView = statusViewFor("quotes", status);
    if (nextView)
      setStatusViews((current) => ({ ...current, [viewKey]: nextView }));
  };
  const completeCustomerOrder = async (
    order: Extract<(typeof myOrders)[number], { recordState: "available" }>,
  ) => {
    markInteractionRead("order", order.id);
    setAttentionFilter(null);
    setHistoryTransfer({
      kind: "order",
      id: order.id,
      label: "Pedido recibido conforme",
    });
    const minimumAnimation = new Promise((resolve) =>
      window.setTimeout(resolve, prefersReducedMotion ? 700 : 2800),
    );
    const [completed] = await Promise.all([
      performAction(order, "customer", "complete-reception"),
      minimumAnimation,
    ]);
    setHistoryTransfer(null);
    if (!completed) return;
    markInteractionUnread("order", order.id);
  };
  const historyOptions: Array<{
    value: HistoryFilter;
    label: string;
    description: string;
  }> = [
    {
      value: "all",
      label: "Todas",
      description: "Muestra todas las solicitudes finalizadas.",
    },
    ...(requestType === "orders"
      ? [
          {
            value: "completed" as const,
            label: "Completadas",
            description: "Pedidos finalizados correctamente.",
          },
        ]
      : []),
    {
      value: "cancelled",
      label: "Canceladas",
      description: "Solicitudes que no continuaron.",
    },
    {
      value: "rejected",
      label: "Rechazadas",
      description: "Solicitudes rechazadas antes de concretarse.",
    },
    {
      value: "deleted",
      label: "Eliminados",
      description: "Solicitudes ocultas que todavía puedes restaurar.",
    },
  ];
  const historyFilterLabel =
    historyOptions.find((option) => option.value === historyFilter)?.label ??
    "Todas";

  useEffect(() => {
    if (!hasBusiness && subTab === "my-business") setSubTab("my-orders");
  }, [hasBusiness, subTab]);

  useEffect(() => {
    const cancelled = (event: Event) => {
      const receipt = (event as CustomEvent).detail;
      if (requestType !== 'orders' || !['cancelled', 'rejected'].includes(receipt?.orderStatus)) return;
      const process = normalizeRequestProcess(receipt.requestProcess);
      const terminal = receipt.orderStatus === 'rejected' ? isPendingRequestRejected(process) : subTab === 'my-orders' && isPendingRequestCancelled(process);
      if (!process || !terminal || !orderRecords.some(order =>
        order.id === receipt.orderId && order.requestProcess?.id === process.id && order.requestProcess.version <= process.version)) return;
      setAttentionFilter('browse');
      setStatusViews(current => ({ ...current, [`${subTab}-orders`]: 'history' }));
      setHistoryFilters(current => ({ ...current, [`${subTab}-orders`]: 'all' }));
    };
    window.addEventListener('zipco-process-receipt', cancelled);
    return () => window.removeEventListener('zipco-process-receipt', cancelled);
  }, [subTab, requestType, orderRecords]);

  useEffect(() => {
    const spacer = document.querySelector<HTMLElement>('[data-summary-scroll-space]');
    if (spacer) spacer.style.height = '0px';
  }, [subTab, requestType, statusView, attentionFilter]);

  useEffect(() => {
    if (!summaryScrollPending) return;
    if (subTab !== summaryScrollPending.role || requestType !== summaryScrollPending.kind ||
        statusView !== summaryScrollPending.view || attentionFilter !== summaryScrollPending.attention ||
        (requestType === 'orders' ? loadError : quotes.error)) {
      setSummaryScrollPending(null);
      return;
    }
    if (requestType === 'orders' ? isLoading : quotes.loading) return;
    const start = document.querySelector<HTMLElement>('[data-request-results]');
    const spacer = document.querySelector<HTMLElement>('[data-summary-scroll-space]');
    if (start && spacer && !suppressAttentionResults) scrollToRequestResults(start, spacer, prefersReducedMotion === true);
    setSummaryScrollPending(null);
  }, [summaryScrollPending, subTab, requestType, statusView, attentionFilter, isLoading, loadError, quotes.loading, quotes.error, suppressAttentionResults, prefersReducedMotion]);

  useEffect(() => {
    const refresh = () => {
      void loadOrders(true);
      void quotes.load(true);
    };
    window.addEventListener("zipco-requests-refresh", refresh);
    return () => window.removeEventListener("zipco-requests-refresh", refresh);
  }, [loadOrders, quotes.load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quoteId = Number(params.get("quoteId"));
    const orderId = Number(params.get("orderId"));
    if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('screen-mounted', { hasTarget: params.has('quoteId') || params.has('orderId') });
    if (Number.isInteger(quoteId) && quoteId > 0)
      markInteractionUnread("quote", quoteId);
    if (Number.isInteger(orderId) && orderId > 0)
      markInteractionUnread("order", orderId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quoteId = Number(params.get("quoteId"));
    const orderId = Number(params.get("orderId"));
    const target =
      Number.isInteger(quoteId) && quoteId > 0
        ? quoteRecords.find((quote) => quote.id === quoteId)
        : Number.isInteger(orderId) && orderId > 0
          ? orderRecords.find(
              (order) =>
                order.recordState === "available" && order.id === orderId,
            )
          : undefined;
    if (import.meta.env.QA_NOTIFICATION_TRACE && (params.has('orderId') || params.has('quoteId'))) {
      traceNotificationClick('screen-target', { hasTarget: !!target,
        loading: isLoading || quotes.loading, hasError: !!loadError || !!quotes.error });
    }
    if (!target) return;
    const targetKind =
      Number.isInteger(quoteId) && quoteId > 0 ? "quotes" : "orders";
    const targetView = statusViewFor(targetKind, target.status, 'requestProcess' in target ? target.requestProcess : undefined, 'requestProcessInvalid' in target ? target.requestProcessInvalid : false);
    if (!targetView) return;
    setRequestType(targetKind);
    if (targetView === 'coordination') setAttentionFilter('browse');
    if (
      subTab === "my-orders" &&
      (target.status === "quoted" || target.status === "alternative_proposed")
    ) {
      setAttentionFilter("responses");
    } else if (subTab === "my-orders" && target.status === "ready") {
      setAttentionFilter("ready");
    }
    setStatusViews((current) => ({
      ...current,
      [`${subTab}-${targetKind}`]: targetView,
    }));
    if ((targetKind === 'orders' && (isLoading || loadError)) ||
        (targetKind === 'quotes' && (quotes.loading || quotes.error))) return;
    // Category changes above may render on the next commit. The observer
    // remains pending until the actual card exists and accepts focus.
    const destination = window.location.href;
    return waitForNotificationCard(
      `${targetKind === 'quotes' ? 'quote' : 'order'}-${targetKind === 'quotes' ? quoteId : orderId}`,
      () => {
        if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('card-focused');
        onNotificationFocused?.(destination);
      },
      undefined,
      () => Boolean(localStorage.getItem('zipco-token') && localStorage.getItem('zipco-user-id')),
    );
  }, [orderRecords, quoteRecords, subTab, isLoading, loadError, quotes.loading, quotes.error, onNotificationFocused]);

  return (
    <div className="zipco-theme-surface size-full min-h-0 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      <div className="zipco-safe-header border-b border-slate-200/60 px-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          </div>
          {import.meta.env.QA_LOAD_DIAGNOSTICS && <span aria-label="Versión QA" className="text-[10px] font-mono text-slate-500">
            QA {import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION.slice(0, 7)}
          </span>}
        </div>

        <div
          className={`flex gap-2 ${!hasBusiness ? "rounded-2xl border border-teal-400/20 bg-teal-500/10 p-2" : ""}`}
        >
          <button
            onClick={() => {
              setSubTab("my-orders");
              setAttentionFilter(null);
              setSelectedBusinessActivity(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              subTab === "my-orders"
                ? hasBusiness
                  ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-transparent text-teal-600"
                : "bg-white/60 text-gray-600 hover:bg-white/80"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>Mis Pedidos</span>
              {!hasBusiness && (
                <span className="mt-0.5 text-[10px] font-medium opacity-75">
                  Revisa y gestiona tus solicitudes
                </span>
              )}
            </span>
            {customerRoleBadge > 0 && (
              <span className="zipco-role-badge">
                {customerRoleBadge > 9 ? "9+" : customerRoleBadge}
              </span>
            )}
          </button>
          {hasBusiness && (
            <button
              onClick={() => {
                setSubTab("my-business");
                setAttentionFilter(null);
                setSelectedBusinessActivity(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                subTab === "my-business"
                  ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/60 text-gray-600 hover:bg-white/80"
              }`}
            >
              <Store className="h-4 w-4" />
              Mi Negocio
              {businessRoleBadge > 0 && (
                <span className="zipco-role-badge">
                  {businessRoleBadge > 9 ? "9+" : businessRoleBadge}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div data-requests-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-40">
        {import.meta.env.QA_LOAD_DIAGNOSTICS && <LoadOrdersDiagnostics refresh={() => loadOrders(true)} />}
        <NotificationPermissionCard />
        <div className="zipco-request-kind mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/70 p-1.5 shadow-sm">
          <motion.button
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            onClick={() => {
              setRequestType("orders");
              setAttentionFilter(subTab === "my-orders" ? "browse" : null);
              setSelectedBusinessActivity(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${requestType === "orders" ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/20" : "text-slate-600"}`}
          >
            <ShoppingBag className="h-4 w-4" />
            Pedidos
            {subTab === "my-orders" && customerOrderAttention.count > 0 && (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white">
                {customerOrderAttention.count > 9
                  ? "9+"
                  : customerOrderAttention.count}
              </span>
            )}
          </motion.button>
          <motion.button
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            onClick={() => {
              setRequestType("quotes");
              setAttentionFilter(subTab === "my-orders" ? "browse" : null);
              setSelectedBusinessActivity(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${requestType === "quotes" ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-md shadow-violet-500/20" : "text-slate-600"}`}
          >
            <MessageSquareText className="h-4 w-4" />
            Cotizaciones
            {subTab === "my-orders" && customerQuoteAttention.count > 0 && (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white">
                {customerQuoteAttention.count > 9
                  ? "9+"
                  : customerQuoteAttention.count}
              </span>
            )}
          </motion.button>
        </div>
        {subTab === "my-business" && businessActivityCards.length > 0 && (
          <div className="mb-3 space-y-2">
            {businessActivityCards.map((item) => {
              const activityKey = `${item.kind}-${item.view}`;
              const isSelected = selectedBusinessActivity === activityKey;
              if (item.view === 'coordination') return !isLoading && !loadError ?
                <CoordinationOrdersSummary key={activityKey} business count={item.count} selected={isSelected}
                  reducedMotion={prefersReducedMotion} onSelect={() => {
                    setRequestType('orders');
                    setAttentionFilter('browse');
                    setSelectedBusinessActivity(activityKey);
                    setStatusViews((current) => ({ ...current, 'my-business-orders': 'coordination' }));
                    setSummaryScrollPending({ role: 'my-business', kind: 'orders', view: 'coordination', attention: 'browse' });
                  }} /> : null;
              const singular = item.count === 1;
              const noun =
                item.kind === "orders"
                  ? singular
                    ? "pedido"
                    : "pedidos"
                  : singular
                    ? "cotización"
                    : "cotizaciones";
              const title =
                item.view === "pending"
                  ? item.kind === "orders"
                    ? `${item.count} ${singular ? "Nuevo Pedido" : "Nuevos Pedidos"}`
                    : `${item.count} ${noun} ${singular ? "nueva" : "nuevas"}`
                  : item.view === "waiting"
                    ? `${item.count} ${noun} esperando al cliente`
                    : item.view === "active"
                      ? `${item.count} ${noun} en curso`
                      : `${item.count} ${noun} ${
                          item.kind === "quotes"
                            ? singular
                              ? "lista y notificada"
                              : "listas y notificadas"
                            : singular
                              ? "listo y notificado"
                              : "listos y notificados"
                        }`;
              const description =
                item.view === "pending"
                  ? "Toca para revisar y responder."
                  : item.view === "waiting"
                    ? "Tu respuesta fue enviada; falta la decisión del cliente."
                    : item.view === "active"
                      ? item.kind === "orders"
                        ? requests.some((order) => order.requestProcess?.state === 'IN_PROGRESS')
                          ? 'Revisa el avance de los pedidos en curso.' : "Continúa con la preparación del pedido."
                        : "Ya puedes comenzar el servicio."
                      : "El cliente fue avisado; falta su confirmación.";
              return (
                <motion.button
                  key={activityKey}
                  type="button"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                  onClick={() => {
                    setRequestType(item.kind);
                    setAttentionFilter("browse");
                    setSelectedBusinessActivity(activityKey);
                    setStatusViews((current) => ({
                      ...current,
                      [`my-business-${item.kind}`]: item.view,
                    }));
                    setSummaryScrollPending({ role: 'my-business', kind: item.kind, view: item.view, attention: 'browse' });
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[background-color,border-color,box-shadow,color] duration-300 ${
                    isSelected
                      ? item.view === "pending"
                        ? "border-orange-400 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_12px_28px_rgba(234,88,12,0.28)]"
                        : item.view === "waiting"
                          ? "border-violet-400 bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]"
                          : item.view === "active"
                            ? "border-teal-400 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_12px_28px_rgba(13,148,136,0.26)]"
                            : "border-orange-400 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_12px_28px_rgba(245,158,11,0.25)]"
                      : item.view === "pending"
                        ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-slate-900 shadow-sm dark:border-amber-800/70 dark:from-amber-950/55 dark:to-orange-950/35 dark:text-white"
                        : item.view === "waiting"
                          ? "border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 text-slate-900 shadow-sm dark:border-violet-800/70 dark:from-violet-950/55 dark:to-purple-950/35 dark:text-white"
                          : item.view === "active"
                            ? "border-teal-200 bg-gradient-to-r from-emerald-50 to-cyan-50 text-slate-900 shadow-sm dark:border-teal-800/70 dark:from-emerald-950/50 dark:to-cyan-950/35 dark:text-white"
                            : "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-slate-900 shadow-sm dark:border-amber-800/70 dark:from-amber-950/55 dark:to-orange-950/35 dark:text-white"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : item.view === "active"
                          ? "bg-white text-teal-600 dark:bg-white/10 dark:text-teal-300"
                          : item.view === "waiting"
                            ? "bg-white text-violet-600 dark:bg-white/10 dark:text-violet-300"
                            : "bg-white text-amber-600 dark:bg-white/10 dark:text-amber-300"
                    }`}
                  >
                    <Bell className="zipco-attention-bell h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">{title}</span>
                    <span
                      className={`block text-xs ${isSelected ? "text-white/85" : "text-slate-500 dark:text-slate-300"}`}
                    >
                      {description}
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${isSelected ? "rotate-90 text-white" : "text-slate-600 dark:text-slate-300"}`}
                  />
                </motion.button>
              );
            })}
          </div>
        )}
        {false && acceptedBusinessQuotes.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={() => {
              acceptedBusinessQuotes.forEach((quote) =>
                markInteractionRead("quote", quote.id),
              );
              setRequestType("quotes");
              selectStatusView("active");
            }}
            className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-3 text-left text-white shadow-[0_12px_28px_rgba(16,185,129,0.25)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Check className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">
                {acceptedBusinessQuotes.length}{" "}
                {acceptedBusinessQuotes.length === 1
                  ? "cotización aceptada"
                  : "cotizaciones aceptadas"}
              </span>
              <span className="block text-xs text-white/85">
                El cliente aceptó tu propuesta. Ya puedes comenzar el servicio.
              </span>
            </span>
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
        {subTab === "my-orders" && customerAttentionCards.length > 0 && (
          <div className="mb-3 space-y-2">
            {customerAttentionCards.map((card) => {
              const count = card.items.length;
              const isQuote = card.kind === "quotes";
              const isReady = card.filter === "ready";
              const selectCard = () => {
                setRequestType(card.kind);
                setAttentionFilter(card.filter);
                const nextView = isReady ? "ready"
                  : (statusViewFor(card.kind, card.items[0].status, card.items[0].requestProcess, card.items[0].requestProcessInvalid) ?? "waiting");
                setStatusViews((current) => ({ ...current, [`my-orders-${card.kind}`]: nextView }));
                setSummaryScrollPending({ role: 'my-orders', kind: card.kind, view: nextView, attention: card.filter });
              };
              if (isReady) return <ReadyOrdersSummary key={`${card.kind}-${card.filter}`} count={count} kind={card.kind}
                selected={requestType === card.kind && attentionFilter === card.filter && statusView === 'ready'} onToggle={selectCard} />;
              const title = isQuote
                  ? `${count} ${count === 1 ? "cotización lista" : "cotizaciones listas"} para revisar`
                  : `${count} ${count === 1 ? "nueva respuesta" : "nuevas respuestas"} del negocio`;

              return (
                <motion.button
                  key={`${card.kind}-${card.filter}`}
                  type="button"
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  onClick={selectCard}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-lg ${isQuote ? "border-violet-400 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 text-white" : "border-orange-400 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-white"}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20"
                  >
                    <Bell className="zipco-attention-bell h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">{title}</span>
                    <span
                      className="block text-xs text-white/85"
                    >
                      {`Toca para revisar ${count === 1 ? "la solicitud" : "las solicitudes"}.`}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              );
            })}
          </div>
        )}
        {subTab === 'my-orders' && !isLoading && !loadError && customerCoordinationItems.length > 0 &&
          <CoordinationOrdersSummary count={customerCoordinationItems.length} reducedMotion={prefersReducedMotion}
            selected={requestType === 'orders' && statusView === 'coordination' && attentionFilter === 'browse'}
            onSelect={() => {
              setRequestType('orders');
              setAttentionFilter('browse');
              setStatusViews((current) => ({ ...current, 'my-orders-orders': 'coordination' }));
              setSummaryScrollPending({ role: 'my-orders', kind: 'orders', view: 'coordination', attention: 'browse' });
            }} />}
        <div className="zipco-status-tabs mb-3">
          {(requestType === "quotes"
            ? ([
                {
                  key: "pending",
                  label: subTab === "my-business" ? "Nuevas" : "Enviadas",
                  count: statusCounts.pending,
                },
                {
                  key: "waiting",
                  label:
                    subTab === "my-business"
                      ? "Esperando cliente"
                      : "Por responder",
                  count: statusCounts.waiting,
                },
                {
                  key: "active",
                  label: "En curso",
                  count: statusCounts.active,
                },
                ...(statusCounts.ready > 0
                  ? [
                      {
                        key: "ready",
                        label:
                          subTab === "my-business"
                            ? "Listo y notificado"
                            : "Listos",
                        count: statusCounts.ready,
                      } as const,
                    ]
                  : []),
                {
                  key: "history",
                  label: "Historial",
                  count: unreadHistoryCount,
                },
              ] as const)
            : subTab === "my-business" ? businessOrderTabs(statusCounts, unreadHistoryCount, requests.some((order) => order.requestProcess?.state === 'READY')) : ([
                {
                  key: "pending",
                  label: "Pendientes",
                  count: statusCounts.pending,
                },
                ...(statusCounts.coordination > 0 ? [{ key: 'coordination', label: 'Coordinación', count: statusCounts.coordination } as const] : []),
                {
                  key: "waiting",
                  label: "Por responder",
                  count: statusCounts.waiting,
                },
                {
                  key: "active",
                  label: "En curso",
                  count: statusCounts.active,
                },
                ...(statusCounts.ready > 0
                  ? [
                      {
                        key: "ready",
                        label: "Listos",
                        count: statusCounts.ready,
                      } as const,
                    ]
                  : []),
                {
                  key: "history",
                  label: "Historial",
                  count: unreadHistoryCount,
                },
              ] as const)
          ).map((item) => (
            <RequestStatusTab key={item.key} item={item} selected={statusView === item.key}
              reducedMotion={prefersReducedMotion} onSelect={() => selectStatusView(item.key)} />
          ))}
        </div>
        {false && acceptedBusinessQuotes.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={() => selectStatusView("active")}
            className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-3 text-left text-white shadow-[0_12px_28px_rgba(16,185,129,0.25)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Check className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">
                {acceptedBusinessQuotes.length}{" "}
                {acceptedBusinessQuotes.length === 1
                  ? "cotización aceptada"
                  : "cotizaciones aceptadas"}
              </span>
              <span className="block text-xs text-white/85">
                El cliente aceptó tu propuesta. Ya puedes comenzar el servicio.
              </span>
            </span>
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
        {false &&
          subTab === "my-orders" &&
          (responseCustomerItems.length > 0 ||
            readyCustomerItems.length > 0) && (
            <div className="mb-3 space-y-2">
              {responseCustomerItems.length > 0 && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.995 }}
                  onClick={() => {
                    const next =
                      attentionFilter === "responses" ? null : "responses";
                    setAttentionFilter(next);
                    if (next) {
                      const view =
                        statusViewFor(
                          requestType,
                          responseCustomerItems[0].status,
                          responseCustomerItems[0].requestProcess,
                          responseCustomerItems[0].requestProcessInvalid,
                        ) ?? "pending";
                      setStatusViews((current) => ({
                        ...current,
                        [viewKey]: view,
                      }));
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[background-color,border-color,box-shadow] duration-300 ${attentionFilter === "responses" ? (requestType === "quotes" ? "border-violet-400 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 text-white shadow-[0_12px_30px_rgba(124,58,237,0.30)]" : "border-amber-400 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-white shadow-[0_12px_30px_rgba(234,88,12,0.34)]") : requestType === "quotes" ? "border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 text-slate-900 shadow-sm" : "border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50 text-slate-900 shadow-sm"}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${attentionFilter === "responses" ? "bg-white/20 text-white shadow-inner" : "bg-white text-orange-500"}`}
                  >
                    <Bell className="zipco-attention-bell h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">
                      {responseCustomerItems.length}{" "}
                      {requestType === "quotes"
                        ? responseCustomerItems.length === 1
                          ? "cotización lista para revisar"
                          : "cotizaciones listas para revisar"
                        : responseCustomerItems.length === 1
                          ? "nueva respuesta del negocio"
                          : "nuevas respuestas del negocio"}
                    </span>
                    <span
                      className={`block text-xs ${attentionFilter === "responses" ? "text-white/85" : "text-slate-500"}`}
                    >
                      {requestType === "quotes"
                        ? "El negocio envió una propuesta de precio."
                        : `Tienes ${responseCustomerItems.length} pedido${responseCustomerItems.length === 1 ? "" : "s"} con una nueva respuesta.`}
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${attentionFilter === "responses" ? "rotate-90 text-white" : "text-slate-700"}`}
                  />
                </motion.button>
              )}
              {readyCustomerItems.length > 0 && (
                <ReadyOrdersSummary count={readyCustomerItems.length} kind={requestType} selected={attentionFilter === 'ready'}
                  onToggle={() => {
                    const next = attentionFilter === 'ready' ? null : 'ready';
                    setAttentionFilter(next);
                    if (next) setStatusViews((current) => ({ ...current, [viewKey]: requestType === 'orders' ? 'ready' : 'active' }));
                  }} />
              )}
              <AnimatePresence mode="wait">
                {attentionFilter === null && (
                  <motion.p
                    key="attention-empty"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl bg-white/70 px-3 py-3 text-center text-xs font-semibold text-slate-500"
                  >
                    Selecciona un aviso para ver las solicitudes relacionadas.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        {statusView !== "history" && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() =>
                setSortDirections((current) => ({
                  ...current,
                  [viewKey]: sortDirection === "newest" ? "oldest" : "newest",
                }))
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"
            >
              {sortDirection === "newest" ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
              {sortDirection === "newest" ? "Recientes" : "Antiguas"}
            </button>
          </div>
        )}
        {statusView === "history" && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900">Historial</h3>
              <p className="text-xs text-slate-500">
                Tus solicitudes finalizadas.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() =>
                  setSortDirections((current) => ({
                    ...current,
                    [viewKey]: sortDirection === "newest" ? "oldest" : "newest",
                  }))
                }
                className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 shadow-sm"
              >
                {sortDirection === "newest" ? (
                  <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
                {sortDirection === "newest" ? "Recientes" : "Antiguas"}
              </button>
              <button
                onClick={() => setShowHistoryFilter(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-2 text-[11px] font-bold text-slate-700 shadow-sm"
              >
                <Filter className="h-3.5 w-3.5" />
                {historyFilter === "all" ? "Filtrar" : historyFilterLabel}
              </button>
            </div>
          </div>
        )}
        <div data-request-results>
        {requestType === "quotes" && quotes.loading && (
          <div className="py-16 text-center text-sm font-semibold text-slate-500">
            Cargando cotizaciones…
          </div>
        )}
        {requestType === "quotes" && !quotes.loading && quotes.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-semibold text-red-700">{quotes.error}</p>
            <button
              onClick={() => void quotes.load()}
              className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-700"
            >
              Intentar nuevamente
            </button>
          </div>
        )}
        {requestType === "quotes" &&
          !suppressAttentionResults &&
          !quotes.loading &&
          !quotes.error &&
          filteredQuotes.length === 0 && (
            <CustomerQuotes
              quotes={[]}
              updating={quotes.updating}
              onStatus={changeQuoteStatusAndFollow}
              emptyText={emptyCopy.description}
            />
          )}
        {requestType === "quotes" &&
          !suppressAttentionResults &&
          !quotes.loading &&
          !quotes.error &&
          filteredQuotes.length > 0 &&
          statusView === "history" && (
            <QuoteHistoryList
              quotes={filteredQuotes}
              owner={subTab === "my-orders" ? "customer" : "business"}
              deleted={historyFilter === "deleted"}
              onArchive={quotes.setArchived}
              onDelete={quotes.deletePermanently}
            />
          )}
        {requestType === "quotes" &&
          !suppressAttentionResults &&
          !quotes.loading &&
          !quotes.error &&
          filteredQuotes.length > 0 &&
          statusView !== "history" &&
          subTab === "my-orders" && (
            <motion.div
              key={`quote-attention-${attentionFilter ?? "all"}`}
              initial={attentionFilter ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
            >
              <CustomerQuotes
                quotes={filteredQuotes}
                updating={quotes.updating}
                onStatus={changeQuoteStatusAndFollow}
                emptyText={emptyCopy.description}
              />
            </motion.div>
          )}
        {requestType === "quotes" &&
          !suppressAttentionResults &&
          !quotes.loading &&
          !quotes.error &&
          filteredQuotes.length > 0 &&
          statusView !== "history" &&
          hasBusiness &&
          subTab === "my-business" && (
            <BusinessQuotes
              quotes={filteredQuotes}
              updating={quotes.updating}
              onRespond={(quote, price, message) => {
                const response = quotes.respond(quote, price, message);
                setStatusViews((current) => ({
                  ...current,
                  [viewKey]: "waiting",
                }));
                return response;
              }}
              onStatus={changeQuoteStatusAndFollow}
              onAlternative={async (quote, payload) => {
                await quotes.proposeAlternative(quote, payload);
                setStatusViews((current) => ({
                  ...current,
                  [viewKey]: "waiting",
                }));
              }}
              emptyText={emptyCopy.description}
            />
          )}
        {requestType === "orders" && !suppressAttentionResults && (
          <>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-600">
                  Cargando pedidos...
                </p>
              </div>
            )}

            {!isLoading && loadError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                <p className="text-sm font-semibold text-red-700">
                  {confirmedRejectionInHistory ? 'El rechazo está confirmado. No se pudieron actualizar los pedidos; puedes reintentar la lectura.' : confirmedCancellationInHistory ? 'La anulación está confirmada. No se pudieron actualizar los pedidos; puedes reintentar la lectura.' : loadError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void loadOrders();
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm ring-1 ring-red-200"
                >
                  <RefreshCw className="h-4 w-4" /> Intentar nuevamente
                </button>
              </div>
            )}

            {!isLoading &&
              (!loadError || confirmedCancellationInHistory || confirmedRejectionInHistory) &&
              statusView === "history" &&
              subTab === "my-orders" &&
              filteredMyOrders.length > 0 && (
                <OrderHistoryList
                  orders={filteredMyOrders}
                  owner="customer"
                  deleted={historyFilter === "deleted"}
                  onArchive={setOrderArchived}
                  onDelete={deleteOrderPermanently}
                />
              )}
            {!isLoading &&
              (!loadError || confirmedRejectionInHistory) &&
              statusView === "history" &&
              hasBusiness &&
              subTab === "my-business" &&
              filteredBusinessOrders.length > 0 && (
                <OrderHistoryList
                  orders={filteredBusinessOrders}
                  owner="business"
                  deleted={historyFilter === "deleted"}
                  onArchive={setOrderArchived}
                  onDelete={deleteOrderPermanently}
                />
              )}

            {!isLoading &&
              !loadError &&
              statusView !== "history" &&
              subTab === "my-orders" && (
                <motion.div
                  key={`order-attention-${attentionFilter ?? "all"}`}
                  initial={attentionFilter ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24 }}
                >
                  <MyOrdersTab
                    myOrders={filteredMyOrders}
                    updatingOrderIds={updatingOrderIds}
                    onRetry={loadOrders}
                    onAction={async (order, action, reason, detail) => {
                      if (order.requestProcess !== undefined) return;
                      if (
                        action === "complete-reception" &&
                        order.recordState === "available"
                      ) {
                        await completeCustomerOrder(order);
                        return;
                      }
                      const transfer =
                        action === "accept-alternative"
                          ? {
                              title: "Propuesta aceptada",
                              description: `Avisamos a ${order.businessName}. Tu pedido pasó a En curso.`,
                            }
                          : action === "reject-alternative"
                            ? {
                                title: "Propuesta rechazada",
                                description: `Avisamos a ${order.businessName} sobre tu decisión.`,
                              }
                            : null;
                      if (transfer) setActiveTransfer(transfer);
                      await Promise.all([
                        performAction(
                          order,
                          "customer",
                          action,
                          reason,
                          detail,
                        ),
                        transfer
                          ? new Promise((resolve) =>
                              window.setTimeout(
                                resolve,
                                prefersReducedMotion ? 700 : 2800,
                              ),
                            )
                          : Promise.resolve(),
                      ]);
                      if (transfer) setActiveTransfer(null);
                      const next = action === "cancel" ? "history" : "active";
                      setStatusViews((current) => ({
                        ...current,
                        [viewKey]: next,
                      }));
                    }}
                    emptyTitle={emptyCopy.title}
                    emptyDescription={emptyCopy.description}
                    onProposeAlternative={proposeOrderAlternative}
                  />
                </motion.div>
              )}

            {!isLoading &&
              !loadError &&
              statusView !== "history" &&
              hasBusiness &&
              subTab === "my-business" && (
                <BusinessOrdersTab
                  requests={filteredBusinessOrders}
                  updatingOrderIds={updatingOrderIds}
                  onRetry={loadOrders}
                  onAction={async (order, action, reason, detail) => {
                    if (order.requestProcess !== undefined) {
                      const accepted = await performAction(order, 'business', action, reason, detail);
                      if (accepted) selectStatusView('coordination');
                      return;
                    }
                    const transfer =
                      action === "accept"
                        ? {
                            title: "Pedido aceptado",
                            description:
                              "Pasó a En curso. Cuando esté listo, notifícale al cliente.",
                          }
                        : action === "mark-ready"
                          ? {
                              title: "Cliente notificado",
                              description: `Avisamos a ${order.customerName || "tu cliente"}. Esperamos su confirmación.`,
                            }
                          : null;
                    if (transfer) setActiveTransfer(transfer);
                    await Promise.all([
                      performAction(order, "business", action, reason, detail),
                      transfer
                        ? new Promise((resolve) =>
                            window.setTimeout(
                              resolve,
                              prefersReducedMotion ? 700 : 2800,
                            ),
                          )
                        : Promise.resolve(),
                    ]);
                    if (transfer) setActiveTransfer(null);
                    if (action !== "mark-ready") {
                      const next = action === "reject" ? "history" : "active";
                      setStatusViews((current) => ({
                        ...current,
                        [viewKey]: next,
                      }));
                    }
                  }}
                  emptyTitle={emptyCopy.title}
                  emptyDescription={emptyCopy.description}
                  onProposeAlternative={async (id, payload) => {
                    await proposeOrderAlternative(id, payload);
                    setStatusViews((current) => ({
                      ...current,
                      [viewKey]: "waiting",
                    }));
                  }}
                />
              )}
            {!isLoading &&
              !loadError &&
              statusView === "history" &&
              (subTab === "my-orders"
                ? filteredMyOrders.length === 0
                : filteredBusinessOrders.length === 0) && (
                <MyOrdersTab
                  myOrders={[]}
                  updatingOrderIds={updatingOrderIds}
                  onRetry={loadOrders}
                  onAction={async () => undefined}
                  emptyTitle={emptyCopy.title}
                  emptyDescription={emptyCopy.description}
                />
              )}
          </>
        )}
        </div>
        <div data-summary-scroll-space aria-hidden="true" />
      </div>
      <AnimatePresence>
        {activeTransfer && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="zipco-hologram-card zipco-flow-hologram relative w-[235px] overflow-hidden rounded-[28px] border border-violet-300/70 bg-slate-950/95 p-6 text-center text-white shadow-[0_0_55px_rgba(139,92,246,0.38)]"
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { x: 95, y: -240, scale: 0.25, opacity: 0 }
              }
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-emerald-400 shadow-[0_0_30px_rgba(45,212,191,0.45)]">
                <Check className="h-8 w-8" />
              </span>
              <p className="mt-4 text-base font-black">
                {activeTransfer.title}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {activeTransfer.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {historyTransfer !== null && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex w-[210px] flex-col items-center overflow-hidden rounded-[28px] border border-cyan-200/80 bg-white/95 px-5 py-6 shadow-[0_24px_70px_rgba(8,145,178,0.28)] dark:border-cyan-300/70 dark:bg-slate-50/95 dark:shadow-[0_24px_70px_rgba(34,211,238,0.22)]"
              initial={{ y: 14, scale: 0.94 }}
              animate={{ y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { x: 120, y: -260, scale: 0.28, opacity: 0 }
              }
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-100/65 via-transparent to-emerald-100/70"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: [0.45, 0.9, 0.45] }
                }
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              <div className="relative h-[92px] w-[122px]">
                <motion.div
                  className="absolute left-1/2 top-0 flex h-10 w-20 -translate-x-1/2 items-center gap-2 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-100 px-2 shadow-md"
                  animate={
                    prefersReducedMotion
                      ? { y: 24, scale: 0.82 }
                      : {
                          y: [0, 8, 35],
                          scale: [1, 0.92, 0.72],
                          opacity: [1, 1, 0],
                        }
                  }
                  transition={{ duration: 0.85, ease: "easeInOut" }}
                >
                  <PackageCheck className="h-4 w-4 text-teal-600" />
                  <span className="h-2 w-8 rounded-full bg-slate-300" />
                </motion.div>
                <motion.div
                  className="absolute bottom-0 left-1/2 flex h-12 w-[106px] -translate-x-1/2 items-center justify-center rounded-[16px] border border-teal-300 bg-gradient-to-b from-cyan-100/90 to-emerald-200/90 text-teal-700 shadow-[0_0_24px_rgba(20,184,166,0.34)]"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 12px rgba(20,184,166,.20)",
                            "0 0 30px rgba(20,184,166,.50)",
                            "0 0 12px rgba(20,184,166,.20)",
                          ],
                        }
                  }
                  transition={{ duration: 1.1, repeat: Infinity }}
                >
                  <Archive className="h-7 w-7" />
                </motion.div>
              </div>
              <motion.p
                className="relative mt-3 text-sm font-black text-slate-900"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Guardando en Historial
              </motion.p>
              <p className="relative mt-1 text-center text-[11px] font-semibold text-slate-500">
                {historyTransfer.label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showHistoryFilter && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                Filtrar historial
              </h3>
              <button
                onClick={() => setShowHistoryFilter(false)}
                className="rounded-full p-2 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-1">
              {historyOptions.map((option) => {
                const selected = historyFilter === option.value;
                const statusIcon =
                  option.value === "all" ? (
                    <span className="flex h-9 w-9 justify-self-center items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <List className="h-5 w-5" />
                    </span>
                  ) : option.value === "completed" ? (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  ) : option.value === "cancelled" ? (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-red-500 text-white">
                      <X className="h-4 w-4 stroke-[3]" />
                    </span>
                  ) : option.value === "rejected" ? (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-slate-500 text-white">
                      <Minus className="h-4 w-4 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-red-100 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </span>
                  );
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      setHistoryFilters((current) => ({
                        ...current,
                        [viewKey]: option.value,
                      }))
                    }
                    className={`grid w-full grid-cols-[24px_40px_1fr] items-center gap-3 rounded-2xl p-4 text-left transition-colors ${selected ? "bg-gradient-to-r from-teal-50 to-cyan-50" : "bg-white"}`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full border-2 ${
                        selected
                          ? "border-teal-500 bg-teal-500 shadow-[inset_0_0_0_4px_white]"
                          : "border-slate-300 bg-white"
                      }`}
                    />
                    {statusIcon}
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-4 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowHistoryFilter(false)}
              className="mt-5 w-full rounded-xl bg-teal-600 py-3 font-bold text-white"
            >
              Aplicar filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
