

import { useStatusChangeRecords } from "../../shared/feedback/StatusChangeFlow";
import useReadyTransitions from "../../application/motion/useReadyTransitions";

import { useProposalSentFeedback } from "../../shared/feedback/proposalSentFeedback";

import { announceAction } from "../../shared/feedback/ActionHologram";


import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";



import useRequests from "../../application/useRequests";



import useQuotes from "../../../quotes/application/useQuotes";

import { interactionKey, markInteractionRead, markInteractionUnread, publishActiveRequestCount, useUnreadInteractions } from "../../../../notifications/unreadInteractions";
import { countStatusViews, filterByStatusView, statusViewFor, type HistoryFilter, type StatusView } from "../../domain/requestStatusGrouping";
import { getCustomerAttentionItems, getCustomerCoordinationItems } from "../../domain/requestAttentionSummary";


import { initialRequestViews } from "../../application/agreementNavigation";

import { waitForNotificationCard } from "../../../../notifications/notificationNavigation";
import { traceNotificationClick } from "../../../../notifications/notificationClickTrace";
import { scrollToRequestResults } from "../../application/motion/requestSummaryScroll";
import { isPendingRequestCancelled, isPendingRequestRejected, normalizeRequestProcess } from "../../domain/requestProcess";
import type { AgendaSort } from "../../domain/businessAgenda";
import useAgreedScheduleResolver from './useAgreedScheduleResolver';

export function useRequestsScreenController({
  onBack,
  onSessionExpired,
  onNotificationFocused,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onSessionExpired: () => void;
  onNotificationFocused?: (url: string) => void;
}){

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
    Record<string, AgendaSort>
  >({});
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  useEffect(()=>{
    const navigate=(event:Event)=>{
      const detail=(event as CustomEvent).detail;
      if(!detail||typeof detail.business!=='boolean'||!['pending','waiting','awaiting-business','active','coordination','history','ready'].includes(detail.view)||
        (detail.business?'my-business':'my-orders')!==subTab)return;
      if (!detail.business && detail.view === 'history' && !detail.explicit) return;
      if(detail.explicit){setRequestType('orders');setAttentionFilter('browse');}
      setStatusViews(current=>({...current,[`${subTab}-orders`]:detail.view}));
    };
    window.addEventListener('zipco-availability-view',navigate);
    return()=>window.removeEventListener('zipco-availability-view',navigate);
  },[subTab]);
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
    kind?: 'alternative' | 'final';
    title: string;
    description: string;
  } | null>(null);
  useProposalSentFeedback(setActiveTransfer);
  const prefersReducedMotion = useReducedMotion();
  const { unread } = useUnreadInteractions();
  const {
    hasBusiness,
    readStatus,
    myOrders,
    requests,
    updatingOrderIds,
    loadOrders,
    performAction,
    proposeAlternative: proposeOrderAlternative,
    setArchived: setOrderArchived,
    deletePermanently: deleteOrderPermanently,
  } = useRequests(onSessionExpired);
  const selectedRead = subTab === 'my-orders' ? readStatus.customer : readStatus.business;
  const isLoading = selectedRead.loading && !selectedRead.loaded;
  const loadError = selectedRead.loaded ? '' : selectedRead.error;
  const refreshError = selectedRead.loaded ? selectedRead.error : '';
  const quotes = useQuotes(onSessionExpired);
  const viewKey = `${subTab}-${requestType}`;
  const statusView = statusViews[viewKey] ?? "pending";
  const historyFilter = historyFilters[viewKey] ?? "all";
  const agendaActive = subTab === "my-business" && requestType === "orders" && statusView === "active";
  const agreedScheduleOf = useAgreedScheduleResolver(requests, agendaActive);
  const storedSort = sortDirections[agendaActive ? `${viewKey}:active` : viewKey];
  // «Por atender» solo existe en la agenda de En curso; en cualquier otra vista se muestra como «Recientes».
  const sortDirection: AgendaSort = storedSort === "attention" && !agendaActive ? "newest" : (storedSort ?? (agendaActive ? "attention" : "newest"));
  const orderRecords = subTab === "my-orders" ? myOrders : requests;
  const customerReadyArrival = useReadyTransitions(myOrders, id => {
    if (!myOrders.some(order => order.id === id && order.requestProcess?.state === 'READY')) return;
    setAttentionFilter('browse');
    setStatusViews(current => ({ ...current, 'my-orders-orders': 'ready' }));
  }, { active: subTab === 'my-orders' && requestType === 'orders', loaded: !isLoading && !loadError,
    navigationKey: `${subTab}:${requestType}:${statusView}:${attentionFilter}` });
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
    subTab==='my-business',
  );
  const statusCountState = (requestType === 'orders' ? isLoading : quotes.loading)
    ? 'loading' : (requestType === 'orders' ? loadError : quotes.error) ? 'unavailable' : undefined;
  useEffect(() => {
    if (subTab !== 'my-orders' || requestType !== 'orders' || statusView !== 'awaiting-business' ||
      !selectedRead.loaded || selectedRead.loading || selectedRead.error || statusCounts['awaiting-business'] > 0) return;
    setAttentionFilter('browse');
    setStatusViews(current => ({ ...current, [viewKey]: 'waiting' }));
  }, [subTab, requestType, statusView, selectedRead.loaded, selectedRead.loading, selectedRead.error, statusCounts['awaiting-business'], viewKey]);
  const businessOrderStatusCounts = countStatusViews(
    requests.filter((record) => record.recordState === "available"),
    "orders",
    true,
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
        statusViewFor("orders", record.status, record.requestProcess, record.requestProcessInvalid,true) !== null &&
        statusViewFor("orders", record.status, record.requestProcess, record.requestProcessInvalid,true) !== "history",
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
    .filter((record) => statusViewFor(requestType, record.status, 'requestProcess' in record ? record.requestProcess : undefined, 'requestProcessInvalid' in record ? record.requestProcessInvalid : false,subTab==='my-business') === "history")
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
      return sortDirection === "oldest"
        ? leftTime - rightTime
        : rightTime - leftTime;
    });
  const visualMyOrders=useStatusChangeRecords(myOrders,false),visualBusinessOrders=useStatusChangeRecords(requests,true);
  let filteredMyOrders = sortRecords(
    filterByStatusView(visualMyOrders, "orders", statusView, historyFilter),
  );
  const filteredBusinessOrders = sortRecords(
    filterByStatusView(visualBusinessOrders, "orders", statusView, historyFilter,undefined,true),
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
    'awaiting-business': { title: 'No tienes solicitudes en espera', description: 'Aquí aparecerán tus contrapropuestas mientras esperas al negocio.' },
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
        description: "La solicitud se conservará en Historial.",
      });
      const [changed] = await Promise.all([
        quotes.changeStatus(quote, status, reason, detail),
        new Promise((resolve) =>
          window.setTimeout(resolve, prefersReducedMotion ? 700 : 2800),
        ),
      ]);
      setActiveTransfer(null);
      if (changed && subTab === 'my-business')
        setStatusViews((current) => ({ ...current, [viewKey]: "history" }));
      return;
    }
    const changed = await quotes.changeStatus(quote, status, reason, detail);
    if (!changed) return;
    const nextView = statusViewFor("quotes", status);
    if (nextView && !(subTab === 'my-orders' && nextView === 'history'))
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
      if (subTab === 'my-orders') {
        if (receipt.orderStatus === 'cancelled') announceAction('annulled', {
          title: 'Solicitud anulada', description: 'La solicitud quedó en Historial.',
          key: `customer-cancel:${process.id}:${process.version}`,
        });
        return;
      }
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
    const presented = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (subTab !== 'my-business' || requestType !== 'orders' || statusView !== 'active' ||
        typeof detail?.agreementPublicId !== 'string' || !detail.agreementPublicId ||
        !orderRecords.some(order => order.id === detail?.orderId && order.requestProcess?.agreementPublicId === detail.agreementPublicId &&
          ['IN_PROGRESS', 'READY'].includes(order.requestProcess.state))) return;
      setAttentionFilter('browse'); setSelectedBusinessActivity(null);
      setStatusViews(current => ({ ...current, 'my-business-orders': 'ready' }));
    };
    window.addEventListener('zipco-ready-presented', presented);
    return () => window.removeEventListener('zipco-ready-presented', presented);
  }, [subTab, requestType, statusView, orderRecords]);

  useEffect(() => {
    const received = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (subTab !== 'my-orders' || requestType !== 'orders' || statusView !== 'ready' ||
        typeof detail?.agreementPublicId !== 'string' || !detail.agreementPublicId ||
        !myOrders.some(order => order.id === detail.orderId && order.requestProcess?.agreementPublicId === detail.agreementPublicId &&
          ['READY', 'COMPLETED'].includes(order.requestProcess.state))) return;
      setAttentionFilter('browse'); setStatusViews(current => ({ ...current, 'my-orders-orders': 'history' }));
      setHistoryFilters(current => ({ ...current, 'my-orders-orders': 'all' }));
    };
    window.addEventListener('zipco-customer-received-presented', received);
    return () => window.removeEventListener('zipco-customer-received-presented', received);
  }, [subTab, requestType, statusView, myOrders]);

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
      void loadOrders(true, 'refresh-event');
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
    const targetView = statusViewFor(targetKind, target.status, 'requestProcess' in target ? target.requestProcess : undefined, 'requestProcessInvalid' in target ? target.requestProcessInvalid : false,subTab==='my-business');
    if (!targetView) return;
    setRequestType(targetKind);
    if (subTab === 'my-orders') {
      const attention = targetKind === 'orders' ? customerOrderAttention : customerQuoteAttention;
      // A pending late query has status "pending", not alternative_proposed.
      // Choose the visible response filter using the same read model as the
      // category summary; otherwise its cards remain suppressed indefinitely.
      if (targetView === 'waiting' && attention.responses.some(item => item.id === target.id)) setAttentionFilter('responses');
      else if (targetView === 'ready') setAttentionFilter('ready');
      else setAttentionFilter('browse');
    } else if (targetView === 'coordination') setAttentionFilter('browse');
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


return {acceptedBusinessQuotes,activeTransfer,agendaActive,agreedScheduleOf,attentionFilter,businessActivityCards,businessRoleBadge,changeQuoteStatusAndFollow,completeCustomerOrder,confirmedCancellationInHistory,confirmedRejectionInHistory,customerAttentionCards,customerCoordinationItems,customerOrderAttention,customerQuoteAttention,customerReadyArrival,customerRoleBadge,deleteOrderPermanently,emptyCopy,filteredBusinessOrders,filteredMyOrders,filteredQuotes,hasBusiness,historyFilter,historyFilterLabel,historyOptions,historyTransfer,isLoading,loadError,loadOrders,onBack,performAction,prefersReducedMotion,proposeOrderAlternative,quotes,readyCustomerItems,refreshError,requestType,requests,responseCustomerItems,selectStatusView,selectedBusinessActivity,selectedRead,setActiveTransfer,setAttentionFilter,setHistoryFilters,setOrderArchived,setRequestType,setSelectedBusinessActivity,setShowHistoryFilter,setSortDirections,setStatusViews,setSubTab,setSummaryScrollPending,showHistoryFilter,sortDirection,statusCountState,statusCounts,statusView,subTab,suppressAttentionResults,unreadHistoryCount,updatingOrderIds,viewKey};
}
export type RequestsScreenModel=ReturnType<typeof useRequestsScreenController>;
