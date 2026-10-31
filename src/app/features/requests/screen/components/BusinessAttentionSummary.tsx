import * as React from 'react';




import CoordinationOrdersSummary from "./CoordinationOrdersSummary";






import { motion } from "motion/react";
import { Bell, ChevronRight } from "lucide-react";



















import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function BusinessAttentionSummary({model}:{model:Pick<RequestsScreenModel,"businessActivityCards"|"isLoading"|"loadError"|"prefersReducedMotion"|"requests"|"selectedBusinessActivity"|"setAttentionFilter"|"setRequestType"|"setSelectedBusinessActivity"|"setStatusViews"|"setSummaryScrollPending">}){
const {businessActivityCards,isLoading,loadError,prefersReducedMotion,requests,selectedBusinessActivity,setAttentionFilter,setRequestType,setSelectedBusinessActivity,setStatusViews,setSummaryScrollPending}=model;
return (<div className="mb-3 space-y-2">
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
          </div>);
}
