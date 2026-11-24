import * as React from 'react';
import ReadyOrdersSummary from "./ReadyOrdersSummary";










import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronRight } from "lucide-react";









import { statusViewFor } from "../../domain/requestStatusGrouping";









import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function CustomerAttentionSummary({model}:{model:Pick<RequestsScreenModel,"attentionFilter"|"readyCustomerItems"|"requestType"|"responseCustomerItems"|"setAttentionFilter"|"setStatusViews"|"viewKey">}){
const {attentionFilter,readyCustomerItems,requestType,responseCustomerItems,setAttentionFilter,setStatusViews,viewKey}=model;
return (<div className="mb-3 space-y-2">
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
            </div>);
}
