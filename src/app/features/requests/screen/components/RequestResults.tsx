import * as React from 'react';

import { FLOW_UPDATE_MESSAGE } from "../../domain/requestProcessErrors";









import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import BusinessOrdersTab from "./BusinessOrdersTab";
import MyOrdersTab from "./MyOrdersTab";


import { BusinessQuotes } from "../../../quotes/business/BusinessQuotes";
import { CustomerQuotes } from "../../../quotes/customer/CustomerQuotes";

import { OrderHistoryList } from "../../cards/shared/history/OrderHistoryList";
import { QuoteHistoryList } from "../../cards/shared/history/QuoteHistoryList";











import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function RequestResults({model}:{model:Pick<RequestsScreenModel,"agendaActive"|"agreedScheduleOf"|"setSortDirections"|"sortDirection"|"attentionFilter"|"changeQuoteStatusAndFollow"|"completeCustomerOrder"|"confirmedCancellationInHistory"|"confirmedRejectionInHistory"|"deleteOrderPermanently"|"emptyCopy"|"filteredBusinessOrders"|"filteredMyOrders"|"filteredQuotes"|"hasBusiness"|"historyFilter"|"isLoading"|"loadError"|"loadOrders"|"performAction"|"prefersReducedMotion"|"proposeOrderAlternative"|"quotes"|"refreshError"|"requestType"|"selectStatusView"|"selectedRead"|"setActiveTransfer"|"setOrderArchived"|"setStatusViews"|"statusView"|"subTab"|"suppressAttentionResults"|"updatingOrderIds"|"viewKey">}){
const {agendaActive,agreedScheduleOf,setSortDirections,sortDirection,attentionFilter,changeQuoteStatusAndFollow,completeCustomerOrder,confirmedCancellationInHistory,confirmedRejectionInHistory,deleteOrderPermanently,emptyCopy,filteredBusinessOrders,filteredMyOrders,filteredQuotes,hasBusiness,historyFilter,isLoading,loadError,loadOrders,performAction,prefersReducedMotion,proposeOrderAlternative,quotes,refreshError,requestType,selectStatusView,selectedRead,setActiveTransfer,setOrderArchived,setStatusViews,statusView,subTab,suppressAttentionResults,updatingOrderIds,viewKey}=model;
return (<div data-request-results>
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
        {requestType === 'orders' && refreshError && (
          <div role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>No pudimos actualizar. Mostramos la última información disponible.</p>
            <button type="button" disabled={selectedRead.loading} onClick={() => void loadOrders(true)}
              className="mt-2 inline-flex items-center gap-2 font-bold disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> {selectedRead.loading ? 'Actualizando…' : 'Intentar nuevamente'}
            </button>
          </div>
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
                    if (loadError === FLOW_UPDATE_MESSAGE) window.location.reload(); else void loadOrders();
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm ring-1 ring-red-200"
                >
                  <RefreshCw className="h-4 w-4" /> {loadError === FLOW_UPDATE_MESSAGE ? 'Actualizar aplicación' : 'Intentar nuevamente'}
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
                    key={`customer-orders-${statusView}-${attentionFilter ?? 'all'}`}
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
                                description: 'La solicitud se conservará en Historial.',
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
                      if (action === 'cancel' || action === 'reject-alternative') return;
                      setStatusViews((current) => ({
                        ...current,
                        [viewKey]: 'active',
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
                  key={`business-orders-${statusView}-${attentionFilter ?? 'all'}`}
                  requests={filteredBusinessOrders}
                  updatingOrderIds={updatingOrderIds}
                  onRetry={loadOrders}
                  agenda={agendaActive && agreedScheduleOf ? {
                    resolve: agreedScheduleOf,
                    sort: sortDirection,
                    onSort: (next) => setSortDirections((current) => ({ ...current, [`${viewKey}:active`]: next })),
                  } : undefined}
                  onAction={async (order, action, reason, detail) => {
                    if (order.requestProcess !== undefined) {
                      const accepted = await performAction(order, 'business', action, reason, detail);
                      if (accepted) selectStatusView('coordination');
                      return;
                    }
                    const confirmed = await performAction(order, "business", action, reason, detail);
                    if (!confirmed) return;
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
        </div>);
}
