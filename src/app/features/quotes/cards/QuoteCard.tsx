import * as React from 'react';

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, ChevronDown, Image as ImageIcon, MessageSquareText, MousePointerClick, Tag, Zap, X } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";

import type { QuoteRequest } from "../domain/quoteApi";

import ProposalPhotoAttachment from "../shared/ProposalPhotoAttachment";
import AnimatedPhotoIcon from "../shared/AnimatedPhotoIcon";
import { formatQuoteRespondedAt } from "../domain/quoteResponseTime";




import { money, proposalPrice } from '../shared/quotePresentation';

export function QuoteCard({
  quote,
  children,
  unread,
  onOpen,
  statusLabel,
  owner,
  expanded = false,
  onToggle,
}: {
  quote: QuoteRequest;
  children?: React.ReactNode;
  unread: boolean;
  onOpen: () => void;
  statusLabel: string;
  owner: "customer" | "business";
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [showReferencePhoto, setShowReferencePhoto] = useState(false);
  const [showNegotiationDetails, setShowNegotiationDetails] = useState(false);
  const respondedAtLabel = formatQuoteRespondedAt(quote.respondedAt);
  const handleOpen = (element: HTMLElement) => {
    element.classList.remove("zipco-notification-target");
    onOpen();
  };
  const displayPhoto =
    owner === "business" ? quote.customerPhoto : quote.referencePhoto;
  if (owner === "customer" && quote.status === "alternative_proposed") {
    const price = proposalPrice(quote);
    return (
      <article
        id={`quote-${quote.id}`}
        onClick={(event) => {
          handleOpen(event.currentTarget);
          onToggle?.();
        }}
        className={`zipco-proposal-card zipco-state-${quote.status} ${unread ? "zipco-new-card border-sky-300 ring-2 ring-sky-100" : "border-violet-100"} scroll-mb-36 rounded-[22px] border p-3 transition-colors`}
      >
        <div className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-start gap-2.5">
          {displayPhoto ? (
            <ImageWithFallback
              src={displayPhoto}
              alt={quote.itemNameSnapshot}
              className="h-[62px] w-[62px] rounded-[14px] object-cover"
            />
          ) : (
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-black leading-[18px] text-slate-950">
              {quote.itemNameSnapshot}
            </h3>
            <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-slate-500">
              Propuesta recibida
            </p>
            <p className="mt-0.5 line-clamp-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">
              {quote.message}
            </p>
          </div>
          <div className="flex max-w-[112px] flex-col items-end gap-1">
            <span className="inline-flex max-w-[92px] items-center justify-center gap-1 rounded-full bg-violet-50 px-2 py-1.5 text-center text-[10px] font-black leading-tight text-violet-700">
              <MessageSquareText className="h-3.5 w-3.5 shrink-0" /> Nueva
              propuesta
            </span>
            {respondedAtLabel && (
              <span className="whitespace-nowrap text-right text-[9px] font-semibold leading-3 text-slate-500 dark:text-slate-400">
                {respondedAtLabel}
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          {quote.needNow ? (
            <Zap className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Calendar className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">
            {quote.needNow
              ? "Lo necesitas ahora"
              : `Lo necesitas: ${quote.requestedDate} · ${quote.requestedTime}`}
          </span>
        </p>
        <AnimatePresence initial={false} mode="wait">
          {!expanded ? (
            <motion.button
              key="proposal-collapsed"
              type="button"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={(event) => {
                event.stopPropagation();
                handleOpen(
                  event.currentTarget.closest("article") as HTMLElement,
                );
                onToggle?.();
              }}
              className="zipco-open-panel mt-2.5 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[15px] border border-teal-200 bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-100/70 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            >
              <span className="min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-[0.15em] text-teal-700">
                  Propuesta del negocio
                </span>
                <span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Ver propuesta completa
                </span>
              </span>
              <span className="whitespace-nowrap text-lg font-black text-teal-800">
                {price === null ? "—" : money(price)}
              </span>
              <ChevronDown className="h-5 w-5 text-teal-700" />
            </motion.button>
          ) : (
            <motion.div
              key="proposal-expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_100px] overflow-hidden rounded-[16px] border border-teal-200 bg-gradient-to-br from-teal-50 via-cyan-50/70 to-emerald-50 p-3 text-teal-950">
                <div className="min-w-0 pr-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-800">
                    Propuesta del negocio
                  </p>
                  <p className="mt-1.5 text-[15px] font-black leading-[18px] text-slate-950">
                    Alternativa del negocio
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">
                    {quote.alternativeMessage}
                  </p>
                  {quote.alternativeItem && (
                    <p className="mt-1 break-words text-xs text-slate-600">
                      Opción: {quote.alternativeItem}
                      {quote.alternativeQuantity
                        ? ` · Cantidad ${quote.alternativeQuantity}`
                        : ""}
                    </p>
                  )}
                  {quote.alternativeDate && (
                    <p className="mt-1 text-xs text-slate-600">
                      Fecha: {quote.alternativeDate}
                      {quote.alternativeTime
                        ? ` · ${quote.alternativeTime}`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex min-w-0 flex-col justify-center border-l border-teal-200 pl-3 text-right">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {quote.status === "requested"
                      ? "Precio referencial desde"
                      : "Precio total"}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[22px] font-black tracking-tight text-teal-800">
                    {price === null ? "—" : money(price)}
                  </p>
                </div>
              </div>
              <ProposalPhotoAttachment photoUrl={quote.alternativePhoto} />
              {children}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle?.();
                }}
                className="mt-2 w-full text-center text-[11px] font-bold text-slate-500"
              >
                Ocultar propuesta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }
  if (owner === "business") {
    const price = proposalPrice(quote);
    const tone =
      quote.status === "requested"
        ? {
            badge: "bg-orange-50 text-orange-700",
            panel: "border-orange-200 from-amber-50 to-orange-100/70",
            accent: "text-orange-700",
          }
        : quote.status === "accepted"
          ? {
              badge: "bg-emerald-50 text-emerald-700",
              panel: "border-emerald-200 from-emerald-50 to-teal-100/70",
              accent: "text-emerald-700",
            }
          : quote.status === "ready"
            ? {
                badge: "bg-teal-50 text-teal-700",
                panel: "border-teal-200 from-cyan-50 to-teal-100/70",
                accent: "text-teal-700",
              }
            : {
                badge: "bg-violet-50 text-violet-700",
                panel: "border-violet-200 from-violet-50 to-fuchsia-50",
                accent: "text-violet-700",
              };
    return (
      <article
        id={`quote-${quote.id}`}
        onClick={(event) => {
          handleOpen(event.currentTarget);
          onToggle?.();
        }}
        className={`zipco-provider-card zipco-state-${quote.status} ${unread ? "zipco-new-card border-sky-300 ring-2 ring-sky-100" : "border-slate-200"} scroll-mb-36 rounded-[22px] border p-3 transition-colors`}
      >
        <div className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-start gap-2.5">
          {displayPhoto ? (
            <ImageWithFallback
              src={displayPhoto}
              alt={quote.itemNameSnapshot}
              className="h-[62px] w-[62px] rounded-[14px] object-cover"
            />
          ) : (
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-black leading-[18px] text-slate-950">
              {quote.itemNameSnapshot}
            </h3>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {quote.customerName}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-[17px] text-slate-700">
              {quote.message}
            </p>
          </div>
          <div className="flex max-w-[112px] flex-col items-end gap-1">
            <span
              className={`inline-flex max-w-[98px] items-center justify-center rounded-full px-2 py-1.5 text-center text-[10px] font-black leading-tight ${tone.badge}`}
            >
              {statusLabel}
            </span>
            {respondedAtLabel && (
              <span className="whitespace-nowrap text-right text-[9px] font-semibold leading-3 text-slate-500 dark:text-slate-400">
                {respondedAtLabel}
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          {quote.needNow ? (
            <Zap className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Calendar className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">
            {quote.needNow
              ? "Lo necesita ahora"
              : `${quote.requestedDate} · ${quote.requestedTime}`}
          </span>
        </p>
        <AnimatePresence initial={false} mode="wait">
          {!expanded ? (
            <motion.button
              key="business-quote-collapsed"
              type="button"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={(event) => {
                event.stopPropagation();
                handleOpen(
                  event.currentTarget.closest("article") as HTMLElement,
                );
                onToggle?.();
              }}
              className={`zipco-open-panel mt-2.5 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[15px] border bg-gradient-to-r px-3 py-2 text-left ${tone.panel}`}
            >
              <span className="min-w-0">
                <span
                  className={`block text-[9px] font-black uppercase tracking-[0.15em] ${tone.accent}`}
                >
                  {quote.status === "requested"
                    ? "Solicitud del cliente"
                    : quote.status === "ready"
                      ? "Servicio finalizado"
                      : "Seguimiento de cotización"}
                </span>
                <span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {quote.status === "requested"
                    ? "Revisar y responder"
                    : "Ver seguimiento"}
                </span>
              </span>
              {price !== null && (
                <span className="whitespace-nowrap text-lg font-black text-teal-800">
                  {money(price)}
                </span>
              )}
              <ChevronDown className={`h-5 w-5 ${tone.accent}`} />
            </motion.button>
          ) : (
            <motion.div
              key="business-quote-expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className={
                  quote.alternativeMessage
                    ? `mt-3 grid grid-cols-[minmax(0,1fr)_100px] overflow-hidden rounded-[16px] border bg-gradient-to-br p-3 text-violet-950 ${tone.panel}`
                    : `mt-3 rounded-[16px] border bg-gradient-to-br p-3 ${tone.panel}`
                }
              >
                {!quote.alternativeMessage && (
                  <p
                    className={`text-[9px] font-black uppercase tracking-[0.16em] ${tone.accent}`}
                  >
                    {quote.status === "requested"
                      ? "Solicitud del cliente"
                      : quote.status === "ready"
                        ? "Solicitud finalizada"
                        : "Respuesta enviada"}
                  </p>
                )}
                {quote.status === "ready" ? (
                  <>
                    <p className="mt-1.5 text-[15px] font-black text-slate-950">
                      Cliente notificado
                    </p>
                    <p className="mt-1 text-xs leading-4 text-slate-600">
                      Esperando que confirme la recepción o realización
                      conforme.
                    </p>
                  </>
                ) : quote.alternativeMessage ? (
                  <>
                    <div className="min-w-0 pr-3">
                      <p
                        className={`text-[9px] font-black uppercase tracking-[0.16em] ${tone.accent}`}
                      >
                        Propuesta del negocio
                      </p>
                      <p className="mt-1.5 text-[15px] font-black leading-[18px] text-slate-950">
                        Alternativa del negocio
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">
                        {quote.alternativeMessage}
                      </p>
                      {quote.alternativeItem && (
                        <p className="mt-1 break-words text-xs text-slate-600">
                          Opción: {quote.alternativeItem}
                          {quote.alternativeQuantity
                            ? ` · Cantidad ${quote.alternativeQuantity}`
                            : ""}
                        </p>
                      )}
                      {quote.alternativeDate && (
                        <p className="mt-1 text-xs text-slate-600">
                          Fecha: {quote.alternativeDate}
                          {quote.alternativeTime
                            ? ` · ${quote.alternativeTime}`
                            : ""}
                        </p>
                      )}
                    </div>
                    {price !== null && (
                      <div className="flex min-w-0 flex-col justify-center border-l border-violet-200 pl-3 text-right">
                        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Precio total
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[22px] font-black tracking-tight text-violet-800">
                          {money(price)}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-slate-800">
                      {quote.message}
                    </p>
                    {quote.itemDescriptionSnapshot && (
                      <p className="mt-1 text-xs leading-4 text-slate-500">
                        {quote.itemDescriptionSnapshot}
                      </p>
                    )}
                  </>
                )}
                {price !== null && !quote.alternativeMessage && (
                  <div className="mt-2 flex items-end justify-between border-t border-black/5 pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">
                      {quote.status === "requested"
                        ? "Precio referencial desde"
                        : quote.status === "accepted" ||
                            quote.status === "ready"
                          ? "Propuesta aceptada"
                          : "Precio total"}
                    </span>
                    <span className="text-xl font-black text-teal-800">
                      {money(price)}
                    </span>
                  </div>
                )}
              </div>
              <ProposalPhotoAttachment photoUrl={quote.alternativePhoto} />
              {quote.referencePhoto && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowReferencePhoto(true);
                  }}
                  className="relative mt-2.5 flex w-full items-center gap-3 overflow-hidden rounded-[16px] border border-violet-300 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-cyan-50 px-3 py-2.5 text-left shadow-[0_7px_20px_rgba(124,58,237,0.13)]"
                >
                  <AnimatedPhotoIcon />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-violet-950">
                      Imagen adjunta
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-violet-700">
                      El cliente agregó una foto de referencia.
                    </span>
                  </span>
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-violet-700 shadow-sm">
                    Abrir
                  </span>
                </motion.button>
              )}
              {children}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle?.();
                }}
                className="mt-2 w-full text-center text-[11px] font-bold text-slate-500"
              >
                Ocultar detalle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showReferencePhoto && quote.referencePhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(event) => {
                event.stopPropagation();
                setShowReferencePhoto(false);
              }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label="Imagen adjunta por el cliente"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                onClick={(event) => event.stopPropagation()}
                className="relative flex max-h-full w-full max-w-lg items-center justify-center"
              >
                <ImageWithFallback
                  src={quote.referencePhoto}
                  alt={`Imagen adjunta de ${quote.itemNameSnapshot}`}
                  className="max-h-[82vh] w-auto max-w-full rounded-[20px] object-contain shadow-2xl"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowReferencePhoto(false);
                  }}
                  className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-lg backdrop-blur"
                  aria-label="Cerrar imagen"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }
  const canCollapseNegotiation =
    owner === "customer" &&
    (quote.status === "accepted" || quote.status === "ready");
  const showNegotiation = !canCollapseNegotiation || showNegotiationDetails;
  const displayedCustomerPrice =
    quote.status === "accepted" || quote.status === "ready"
      ? proposalPrice(quote)
      : quote.quotedPriceClp;
  return (
    <article
      id={`quote-${quote.id}`}
      onClick={(event) => handleOpen(event.currentTarget)}
      className={`zipco-customer-order-card ${quote.status === "quoted" || quote.status === "alternative_proposed" ? "zipco-quote-metallic" : ""} zipco-state-${quote.status} ${unread ? "zipco-new-card border-sky-400 bg-sky-100 ring-2 ring-sky-200" : "border-violet-100 bg-white"} scroll-mb-36 rounded-2xl border p-3 shadow-sm transition-colors`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-start gap-3">
        {displayPhoto ? (
          <ImageWithFallback
            src={displayPhoto}
            alt={quote.itemNameSnapshot}
            className="h-[72px] w-[72px] rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ImageIcon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-black text-slate-900">
              {quote.itemNameSnapshot}
            </h3>
            {unread && (
              <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-black text-white">
                Nueva
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{quote.customerName}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-700">
            {quote.message}
          </p>
          {quote.status !== "quoted" && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1 text-[11px] text-purple-800">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {quote.needNow
                  ? "Lo necesita ahora"
                  : `${quote.requestedDate} · ${quote.requestedTime}`}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="max-w-[88px] rounded-full bg-violet-50 px-2.5 py-1 text-center text-[10px] font-bold leading-tight text-violet-700">
            {statusLabel}
          </span>
          {quote.status !== "quoted" && displayedCustomerPrice !== null && (
            <span className="text-right">
              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Precio propuesto
              </span>
              <span className="whitespace-nowrap text-base font-black text-emerald-500">
                {money(displayedCustomerPrice)}
              </span>
            </span>
          )}
        </div>
      </div>
      {quote.status === "quoted" && displayedCustomerPrice !== null && (
        <div className="mt-2 grid grid-cols-[minmax(120px,1fr)_auto] items-center gap-2 border-t border-slate-300/40 pt-2 min-[360px]:ml-[44px]">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="relative h-5 w-5 shrink-0" aria-hidden="true">
              <Tag className="h-5 w-5 fill-emerald-400 text-emerald-400" />
              <span className="absolute left-[4px] top-[4px] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(15,23,42,0.2)] dark:bg-[#15172b]" />
            </span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Precio propuesto
              </span>
              <span className="mt-0.5 block whitespace-nowrap text-base font-black text-emerald-400">
                {money(displayedCustomerPrice)}
              </span>
            </span>
          </span>
          <span className="flex min-w-0 items-center border-l border-slate-400/60 pl-2">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-violet-500/60 bg-violet-500/10 px-2 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-200 min-[390px]:px-2.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>
                {quote.needNow
                  ? "Lo necesita ahora"
                  : `${quote.requestedDate} · ${quote.requestedTime}`}
              </span>
            </span>
          </span>
        </div>
      )}
      {canCollapseNegotiation && children}
      {canCollapseNegotiation && (
        <button
          type="button"
          aria-expanded={showNegotiationDetails}
          onClick={(event) => {
            event.stopPropagation();
            setShowNegotiationDetails((current) => !current);
          }}
          className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-300/70 bg-violet-500/10 px-3 text-xs font-black text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-200"
        >
          {showNegotiationDetails
            ? "Ocultar detalle de la negociación"
            : "Ver detalle de la negociación"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showNegotiationDetails ? "rotate-180" : ""}`}
          />
        </button>
      )}
      <AnimatePresence initial={false}>
        {showNegotiation && (
          <motion.div
            key="negotiation-details"
            initial={canCollapseNegotiation ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {canCollapseNegotiation && displayedCustomerPrice !== null && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-300/60 bg-emerald-50/80 px-3 py-2 dark:bg-emerald-950/35">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Precio final acordado
                </span>
                <strong className="whitespace-nowrap text-base font-black text-emerald-600 dark:text-emerald-300">
                  {money(displayedCustomerPrice)}
                </strong>
              </div>
            )}
            {quote.businessMessage && (
              <p className="mt-3 flex gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-800 dark:text-violet-200">
                <MessageSquareText className="h-4 w-4 shrink-0" />
                <span>
                  <strong className="block">Respuesta del negocio</strong>
                  {quote.businessMessage}
                </span>
              </p>
            )}
            {quote.alternativePhoto && (
              <ImageWithFallback
                src={quote.alternativePhoto}
                alt="Referencia de la alternativa"
                className="mt-3 h-36 w-full rounded-xl border border-violet-300/50 object-cover"
              />
            )}
            {owner === "business" && quote.status === "ready" ? (
              <div className="mt-3 w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 text-xs text-emerald-900">
                <p className="font-black">Solicitud finalizada</p>
                <p className="mt-0.5">
                  Cliente notificado. Esperando su confirmación.
                </p>
              </div>
            ) : (
              quote.alternativeMessage && (
                <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
                  <p className="font-black">Alternativa del negocio</p>
                  <p className="mt-1">{quote.alternativeMessage}</p>
                  {quote.alternativeItem && (
                    <p className="mt-1">
                      Opción: {quote.alternativeItem}
                      {quote.alternativeQuantity
                        ? ` · Cantidad ${quote.alternativeQuantity}`
                        : ""}
                    </p>
                  )}
                  {quote.alternativeDate && (
                    <p className="mt-1">
                      Fecha: {quote.alternativeDate}
                      {quote.alternativeTime
                        ? ` · ${quote.alternativeTime}`
                        : ""}
                    </p>
                  )}
                  {quote.alternativePriceClp && (
                    <p className="mt-1 font-black">
                      {money(quote.alternativePriceClp)}
                    </p>
                  )}
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!canCollapseNegotiation && children}
    </article>
  );
}
