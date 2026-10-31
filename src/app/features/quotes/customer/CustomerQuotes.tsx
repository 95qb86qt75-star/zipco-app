import * as React from 'react';

import { Fragment, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bell, Ban, Check, AlertTriangle, ChevronRight, ChevronsRight, LoaderCircle, Send, X, XCircle } from "lucide-react";


import type { QuoteCancellationReason, QuoteRequest, QuoteStatus } from "../domain/quoteApi";
import { interactionKey, useUnreadInteractions } from "../../../notifications/unreadInteractions";




import { QuoteCard } from "../cards/QuoteCard";
import { QuoteDateDivider } from "../shared/QuoteDateDivider";
import { Empty } from "../shared/EmptyQuotes";
import {labels,money,proposalPrice,formatQuoteDay} from '../shared/quotePresentation';

export function CustomerQuotes({
  quotes,
  updating,
  onStatus,
  emptyText = "Tus cotizaciones aparecerán aquí",
}: {
  quotes: QuoteRequest[];
  updating: Set<number>;
  onStatus: (
    quote: QuoteRequest,
    status: QuoteStatus,
    reason?: QuoteCancellationReason,
    detail?: string,
  ) => void | Promise<void>;
  emptyText?: string;
}) {
  const { unread, markRead } = useUnreadInteractions();
  const [cancelling, setCancelling] = useState<QuoteRequest | null>(null);
  const [decliningAlternative, setDecliningAlternative] =
    useState<QuoteRequest | null>(null);
  const [cancelReason, setCancelReason] = useState<
    QuoteCancellationReason | ""
  >("");
  const [cancelDetail, setCancelDetail] = useState("");
  const [expandedProposalId, setExpandedProposalId] = useState<number | null>(
    () => {
      const targetId = Number(
        new URLSearchParams(window.location.search).get("quoteId"),
      );
      return Number.isInteger(targetId) && targetId > 0 ? targetId : null;
    },
  );
  const rejectSliderRef = useRef<HTMLDivElement>(null);
  if (!quotes.length) return <Empty text={emptyText} />;
  return (
    <div className="space-y-2">
      {quotes.map((quote, index) => (
        <Fragment key={quote.id}>
          {(index === 0 ||
            formatQuoteDay(quotes[index - 1]) !== formatQuoteDay(quote)) && (
            <QuoteDateDivider label={formatQuoteDay(quote)} />
          )}
          <QuoteCard
            quote={quote}
            owner="customer"
            statusLabel={
              quote.status === "accepted" && quote.alternativeMessage
                ? "Alternativa aceptada por ti"
                : quote.status === "accepted"
                  ? "Aceptada por ti"
                  : labels[quote.status]
            }
            unread={unread.has(interactionKey("quote", quote.id))}
            onOpen={() => markRead("quote", quote.id)}
            expanded={expandedProposalId === quote.id}
            onToggle={() =>
              setExpandedProposalId((current) =>
                current === quote.id ? null : quote.id,
              )
            }
          >
            {quote.status === "alternative_proposed" && (
              <div className="mt-4 space-y-3">
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "accepted");
                  }}
                  className="zipco-proposal-accept flex min-h-14 w-full items-center rounded-[20px] border-2 border-emerald-300 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 text-white shadow-[0_10px_24px_rgba(16,185,129,0.24)] disabled:opacity-50"
                >
                  <span className="flex w-11 shrink-0 items-center justify-center border-r border-white/35 pr-3">
                    <Send className="zipco-accept-icon h-5 w-5" />
                  </span>
                  <span className="flex-1 px-3 text-center text-base font-black">
                    {proposalPrice(quote) === null
                      ? "Aceptar propuesta"
                      : `Aceptar por ${money(proposalPrice(quote)!)}`}
                  </span>
                  <ChevronRight className="h-6 w-6 shrink-0" />
                </button>
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    setDecliningAlternative(quote);
                  }}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-5 w-5" /> Rechazar propuesta
                </button>
              </div>
            )}
            {quote.status === "quoted" && (
              <div className="mt-3 grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] gap-2.5">
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "declined");
                  }}
                  className="zipco-proposal-reject flex min-h-14 items-center justify-center gap-2.5 rounded-[20px] border-2 border-rose-500 bg-gradient-to-r from-rose-950/15 to-fuchsia-950/10 px-2.5 py-2 text-sm font-black leading-tight text-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.12)] transition-transform active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-slate-950 shadow-[0_0_18px_rgba(244,63,94,0.35)]">
                    <X className="h-5 w-5" strokeWidth={3} />
                  </span>
                  <span>Rechazar propuesta</span>
                </button>
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "accepted");
                  }}
                  className="zipco-proposal-accept flex min-h-14 items-center justify-center gap-2.5 rounded-[20px] border-2 border-cyan-300 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-2.5 py-2 text-sm font-black leading-tight text-white shadow-[0_0_22px_rgba(20,184,166,0.3)] transition-transform active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-[#115e59] shadow-[0_0_20px_rgba(207,250,254,0.55)] dark:border-cyan-100 dark:bg-cyan-50 dark:text-[#115e59]">
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </span>
                  <span>Aceptar propuesta</span>
                </button>
              </div>
            )}
            {(quote.status === "requested" || quote.status === "quoted") && (
              <button
                disabled={updating.has(quote.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  markRead("quote", quote.id);
                  setCancelling(quote);
                  setCancelReason("");
                  setCancelDetail("");
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/60 bg-transparent py-2.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" /> Cancelar completamente la solicitud
              </button>
            )}
            {quote.status === "accepted" && (
              <div className="mt-3 rounded-2xl border border-cyan-300/70 bg-cyan-50/90 p-3 shadow-[0_8px_22px_rgba(6,182,212,0.10)] dark:bg-cyan-950/35">
                <p className="flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-200">
                  <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />
                  Servicio en curso
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  El negocio está realizando el servicio. Te avisaremos cuando
                  lo marque como realizado.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-white shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                    Propuesta aceptada
                  </span>
                  <span className="h-px flex-1 bg-cyan-300" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-600 px-2 py-1 text-white shadow-sm">
                    <LoaderCircle className="h-3 w-3 motion-safe:animate-spin" />
                    En curso
                  </span>
                  <span className="h-px flex-1 bg-slate-300" />
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    Confirmar
                  </span>
                </div>
              </div>
            )}
            {quote.status === "ready" && (
              <div className="mt-3 rounded-2xl border border-amber-400 bg-amber-50/95 p-3 shadow-[0_8px_24px_rgba(245,158,11,0.20)] dark:bg-amber-950/40">
                <p className="flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-200">
                  <Bell className="zipco-attention-bell h-4 w-4" />
                  Servicio listo para confirmar
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  El negocio informó que terminó. Confirma cuando lo hayas
                  recibido conforme.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} /> Aceptada
                  </span>
                  <span className="h-px flex-1 bg-emerald-300" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-600 px-2 py-1 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} /> Realizado
                  </span>
                  <span className="h-px flex-1 bg-amber-400" />
                  <span className="rounded-full bg-amber-400 px-2 py-1 text-slate-950 shadow-sm">
                    Confirmar
                  </span>
                </div>
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "completed");
                  }}
                  className="zipco-confirm-action mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-2.5 text-xs font-black text-slate-950 shadow-[0_0_22px_rgba(250,204,21,0.38)] disabled:opacity-50"
                >
                  <Bell className="zipco-attention-bell h-4 w-4" />
                  Confirmar servicio realizado conforme
                </button>
              </div>
            )}
          </QuoteCard>
        </Fragment>
      ))}
      {cancelling && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="text-lg font-black">Cancelar cotización</h3>
            <p className="mt-1 text-sm text-slate-600">
              Selecciona el motivo. La cotización pasará al historial.
            </p>
            <div className="mt-4 space-y-2">
              {(
                [
                  ["no_longer_needed", "Ya no lo necesito"],
                  ["sent_by_mistake", "La envié por error"],
                  ["requirements_changed", "Cambiaron mis necesidades"],
                  ["business_took_too_long", "El negocio tardó demasiado"],
                  ["other", "Otro motivo"],
                ] as Array<[QuoteCancellationReason, string]>
              ).map(([code, label]) => (
                <label
                  key={code}
                  className="flex gap-3 rounded-xl border p-3 text-sm"
                >
                  <input
                    type="radio"
                    checked={cancelReason === code}
                    onChange={() => setCancelReason(code)}
                  />
                  {label}
                </label>
              ))}
              {cancelReason === "other" && (
                <textarea
                  value={cancelDetail}
                  onChange={(event) => setCancelDetail(event.target.value)}
                  rows={3}
                  placeholder="Escribe el motivo"
                  className="w-full rounded-xl border p-3 text-sm"
                />
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setCancelling(null)}
                className="rounded-xl border py-3 font-bold"
              >
                Volver
              </button>
              <button
                disabled={
                  !cancelReason ||
                  (cancelReason === "other" && cancelDetail.trim().length < 3)
                }
                onClick={() => {
                  onStatus(
                    cancelling,
                    "cancelled",
                    cancelReason || undefined,
                    cancelDetail.trim() || undefined,
                  );
                  setCancelling(null);
                }}
                className="rounded-xl bg-red-500 py-3 font-bold text-white disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {decliningAlternative && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.32)]"
          >
            <div className="flex items-center gap-3 rounded-[20px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3.5 text-red-700">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-black">
                  Esta acción finalizará la solicitud.
                </p>
                <p className="mt-0.5 text-xs leading-4 text-red-600">
                  No podrá enviarse otra propuesta.
                </p>
              </div>
            </div>
            <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
              ¿Rechazar esta propuesta?
            </h3>
            <p className="mt-2 text-sm leading-5 text-slate-500">
              La solicitud pasará a Historial y el negocio no podrá enviar otra
              propuesta.
            </p>
            <div
              ref={rejectSliderRef}
              className="relative mt-5 h-16 overflow-hidden rounded-[22px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-100 shadow-inner"
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-black text-red-500">
                Desliza para rechazar
              </span>
              <motion.button
                type="button"
                drag="x"
                dragConstraints={rejectSliderRef}
                dragElastic={0.04}
                dragSnapToOrigin
                disabled={updating.has(decliningAlternative.id)}
                aria-label="Desliza a la derecha para rechazar la propuesta. Presiona Enter para confirmar con teclado."
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    !updating.has(decliningAlternative.id)
                  ) {
                    event.preventDefault();
                    onStatus(decliningAlternative, "declined");
                    setDecliningAlternative(null);
                  }
                }}
                onDragEnd={(_, info) => {
                  const maxTravel = Math.max(
                    1,
                    (rejectSliderRef.current?.clientWidth ?? 0) - 72,
                  );
                  if (
                    info.offset.x >= maxTravel * 0.88 &&
                    !updating.has(decliningAlternative.id)
                  ) {
                    if ("vibrate" in navigator) navigator.vibrate?.(35);
                    onStatus(decliningAlternative, "declined");
                    setDecliningAlternative(null);
                  }
                }}
                className="absolute left-1 top-1 flex h-14 w-14 touch-none items-center justify-center rounded-[18px] bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_8px_22px_rgba(239,68,68,0.38)] disabled:opacity-50"
              >
                <ChevronsRight className="h-7 w-7" />
              </motion.button>
            </div>
            <button
              onClick={() => setDecliningAlternative(null)}
              className="mt-3 min-h-12 w-full rounded-[18px] border border-slate-200 bg-white text-sm font-black text-slate-600 transition-colors hover:bg-slate-50"
            >
              Volver
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
