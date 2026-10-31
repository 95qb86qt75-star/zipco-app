import * as React from 'react';
import RequestsHeader from './components/RequestsHeader';
import BusinessAttentionSummary from './components/BusinessAttentionSummary';
import RequestStatusTabs from './components/RequestStatusTabs';
import CustomerAttentionSummary from './components/CustomerAttentionSummary';
import RequestResults from './components/RequestResults';
import HistoryTransferOverlay from './components/HistoryTransferOverlay';
import HistoryFilterDialog from './components/HistoryFilterDialog';
import ReadyOrdersSummary from "./components/ReadyOrdersSummary";

import { StatusChangeHost } from "../shared/feedback/StatusChangeFlow";

import CoordinationOrdersSummary from "./components/CoordinationOrdersSummary";

import DealSuccessHost from "../shared/feedback/DealSuccess";
import { ActionHologram } from "../shared/feedback/ActionHologram";
import { WhatsappReturnTracker } from "../application/whatsappReturn";
import AcceptedProposalHost from "../shared/feedback/AcceptedProposalHost";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Check, Bell, ChevronRight, Filter, MessageSquareText, ShoppingBag } from "lucide-react";



import NotificationPermissionCard from "../../../notifications/NotificationPermissionCard";




import { markInteractionRead } from "../../../notifications/unreadInteractions";
import { statusViewFor } from "../domain/requestStatusGrouping";




import LoadOrdersDiagnostics from "./diagnostics/LoadOrdersDiagnosticsPanel";




import type {RequestsScreenModel} from './application/useRequestsScreenController';
export default function RequestsScreenView({model}:{model:RequestsScreenModel}){
const {acceptedBusinessQuotes,activeTransfer,attentionFilter,businessActivityCards,businessRoleBadge,changeQuoteStatusAndFollow,completeCustomerOrder,confirmedCancellationInHistory,confirmedRejectionInHistory,customerAttentionCards,customerCoordinationItems,customerOrderAttention,customerQuoteAttention,customerReadyArrival,customerRoleBadge,deleteOrderPermanently,emptyCopy,filteredBusinessOrders,filteredMyOrders,filteredQuotes,hasBusiness,historyFilter,historyFilterLabel,historyOptions,historyTransfer,isLoading,loadError,loadOrders,onBack,performAction,prefersReducedMotion,proposeOrderAlternative,quotes,readyCustomerItems,refreshError,requestType,requests,responseCustomerItems,selectStatusView,selectedBusinessActivity,selectedRead,setActiveTransfer,setAttentionFilter,setHistoryFilters,setOrderArchived,setRequestType,setSelectedBusinessActivity,setShowHistoryFilter,setSortDirections,setStatusViews,setSubTab,setSummaryScrollPending,showHistoryFilter,sortDirection,statusCountState,statusCounts,statusView,subTab,suppressAttentionResults,unreadHistoryCount,updatingOrderIds,viewKey}=model;
return (
    <div className="zipco-theme-surface size-full min-h-0 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      <StatusChangeHost business={subTab==='my-business'} view={statusView} orders={requestType==='orders'}/>
      <DealSuccessHost />
      <WhatsappReturnTracker />
      <AcceptedProposalHost refresh={() => void loadOrders(true)} onAccepted={business => {
        const role = business ? 'my-business' : 'my-orders';
        setSubTab(role); setRequestType('orders'); setAttentionFilter('browse'); setSummaryScrollPending(null);
        setStatusViews(current => ({ ...current, [`${role}-orders`]: 'coordination' }));
      }} />
      <RequestsHeader model={{businessRoleBadge,customerRoleBadge,hasBusiness,onBack,setAttentionFilter,setSelectedBusinessActivity,setSubTab,subTab}}/>

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
          <BusinessAttentionSummary model={{businessActivityCards,isLoading,loadError,prefersReducedMotion,requests,selectedBusinessActivity,setAttentionFilter,setRequestType,setSelectedBusinessActivity,setStatusViews,setSummaryScrollPending}}/>
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
        <RequestStatusTabs model={{customerReadyArrival,prefersReducedMotion,requestType,requests,selectStatusView,statusCountState,statusCounts,statusView,subTab,unreadHistoryCount}}/>
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
            <CustomerAttentionSummary model={{attentionFilter,readyCustomerItems,requestType,responseCustomerItems,setAttentionFilter,setStatusViews,viewKey}}/>
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
        <RequestResults model={{attentionFilter,changeQuoteStatusAndFollow,completeCustomerOrder,confirmedCancellationInHistory,confirmedRejectionInHistory,deleteOrderPermanently,emptyCopy,filteredBusinessOrders,filteredMyOrders,filteredQuotes,hasBusiness,historyFilter,isLoading,loadError,loadOrders,performAction,prefersReducedMotion,proposeOrderAlternative,quotes,refreshError,requestType,selectStatusView,selectedRead,setActiveTransfer,setOrderArchived,setStatusViews,statusView,subTab,suppressAttentionResults,updatingOrderIds,viewKey}}/>
        <div data-summary-scroll-space aria-hidden="true" />
      </div>
      <AnimatePresence>
        {activeTransfer && ('kind' in activeTransfer && (activeTransfer.kind === 'alternative' || activeTransfer.kind === 'final') ?
          <ActionHologram kind={activeTransfer.kind} title={activeTransfer.title} description={activeTransfer.description} /> : (
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
        ))}
      </AnimatePresence>
      <HistoryTransferOverlay model={{historyTransfer,prefersReducedMotion}}/>
      {showHistoryFilter && (
        <HistoryFilterDialog model={{historyFilter,historyOptions,setHistoryFilters,setShowHistoryFilter,viewKey}}/>
      )}
    </div>
  );

}
