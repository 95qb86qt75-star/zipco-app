import { Fragment, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  AlertTriangle,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  Image as ImageIcon,
  MessageSquareText,
  MousePointerClick,
  Send,
  XCircle,
} from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import type { QuoteCancellationReason, QuoteRequest, QuoteStatus } from "./quoteApi";
import {
  interactionKey,
  useUnreadInteractions,
} from "../../notifications/unreadInteractions";

const labels = {
  requested: "Esperando respuesta",
  quoted: "Cotización recibida",
  alternative_proposed: "Esperando tu respuesta",
  accepted: "Aceptada",
  ready: "Lista",
  completed: "Completada",
  declined: "Rechazada",
  cancelled: "Cancelada",
} as const;
const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
const proposalPrice = (quote: QuoteRequest) =>
  quote.alternativePriceClp ?? quote.quotedPriceClp ?? quote.startingPriceClpSnapshot;

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
  ) => void;
  emptyText?: string;
}) {
  const { unread, markRead } = useUnreadInteractions();
  const [cancelling, setCancelling] = useState<QuoteRequest | null>(null);
  const [decliningAlternative, setDecliningAlternative] = useState<QuoteRequest | null>(null);
  const [cancelReason, setCancelReason] = useState<QuoteCancellationReason | "">("");
  const [cancelDetail, setCancelDetail] = useState("");
  const [expandedProposalId, setExpandedProposalId] = useState<number | null>(() => {
    const targetId = Number(new URLSearchParams(window.location.search).get("quoteId"));
    return Number.isInteger(targetId) && targetId > 0 ? targetId : null;
  });
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
            statusLabel={quote.status === "accepted" && quote.alternativeMessage ? "Alternativa aceptada por ti" : quote.status === "accepted" ? "Aceptada por ti" : labels[quote.status]}
            unread={unread.has(interactionKey("quote", quote.id))}
            onOpen={() => markRead("quote", quote.id)}
            expanded={expandedProposalId === quote.id}
            onToggle={() => setExpandedProposalId((current) => current === quote.id ? null : quote.id)}
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
                  <span className="flex w-11 shrink-0 items-center justify-center border-r border-white/35 pr-3"><Send className="zipco-accept-icon h-5 w-5" /></span>
                  <span className="flex-1 px-3 text-center text-base font-black">{proposalPrice(quote) === null ? "Aceptar propuesta" : `Aceptar por ${money(proposalPrice(quote)!)}`}</span>
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
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "declined");
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-red-300 bg-red-50 py-2 text-sm font-bold text-red-600"
                >
                  Rechazar
                </button>
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "accepted");
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-300 bg-emerald-500 py-2 text-sm font-bold text-white"
                >
                  Aceptar
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
                className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                Cancelar solicitud
              </button>
            )}
            {quote.status === "ready" && (
              <button disabled={updating.has(quote.id)} onClick={(event) => { event.stopPropagation(); markRead("quote", quote.id); onStatus(quote, "completed"); }} className="zipco-confirm-action mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(245,158,11,0.30)]">
                <Bell className="zipco-attention-bell h-4 w-4" />
                Confirmar servicio realizado conforme
              </button>
            )}
          </QuoteCard>
        </Fragment>
      ))}
      {cancelling && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="text-lg font-black">Cancelar cotización</h3>
            <p className="mt-1 text-sm text-slate-600">Selecciona el motivo. La cotización pasará al historial.</p>
            <div className="mt-4 space-y-2">
              {([
                ["no_longer_needed", "Ya no lo necesito"], ["sent_by_mistake", "La envié por error"],
                ["requirements_changed", "Cambiaron mis necesidades"], ["business_took_too_long", "El negocio tardó demasiado"],
                ["other", "Otro motivo"],
              ] as Array<[QuoteCancellationReason, string]>).map(([code, label]) => (
                <label key={code} className="flex gap-3 rounded-xl border p-3 text-sm"><input type="radio" checked={cancelReason === code} onChange={() => setCancelReason(code)} />{label}</label>
              ))}
              {cancelReason === "other" && <textarea value={cancelDetail} onChange={(event) => setCancelDetail(event.target.value)} rows={3} placeholder="Escribe el motivo" className="w-full rounded-xl border p-3 text-sm" />}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setCancelling(null)} className="rounded-xl border py-3 font-bold">Volver</button>
              <button disabled={!cancelReason || (cancelReason === "other" && cancelDetail.trim().length < 3)} onClick={() => { onStatus(cancelling, "cancelled", cancelReason || undefined, cancelDetail.trim() || undefined); setCancelling(null); }} className="rounded-xl bg-red-500 py-3 font-bold text-white disabled:opacity-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {decliningAlternative && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center">
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.32)]">
            <div className="flex items-center gap-3 rounded-[20px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3.5 text-red-700">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-6 w-6" /></span>
              <div><p className="text-sm font-black">Esta acción finalizará la solicitud.</p><p className="mt-0.5 text-xs leading-4 text-red-600">No podrá enviarse otra propuesta.</p></div>
            </div>
            <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">¿Rechazar esta propuesta?</h3>
            <p className="mt-2 text-sm leading-5 text-slate-500">La solicitud pasará a Historial y el negocio no podrá enviar otra propuesta.</p>
            <div ref={rejectSliderRef} className="relative mt-5 h-16 overflow-hidden rounded-[22px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-100 shadow-inner">
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-black text-red-500">Desliza para rechazar</span>
              <motion.button
                type="button"
                drag="x"
                dragConstraints={rejectSliderRef}
                dragElastic={0.04}
                dragSnapToOrigin
                disabled={updating.has(decliningAlternative.id)}
                aria-label="Desliza a la derecha para rechazar la propuesta. Presiona Enter para confirmar con teclado."
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !updating.has(decliningAlternative.id)) {
                    event.preventDefault();
                    onStatus(decliningAlternative, "declined");
                    setDecliningAlternative(null);
                  }
                }}
                onDragEnd={(_, info) => {
                  const maxTravel = Math.max(1, (rejectSliderRef.current?.clientWidth ?? 0) - 72);
                  if (info.offset.x >= maxTravel * 0.88 && !updating.has(decliningAlternative.id)) {
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
            <button onClick={() => setDecliningAlternative(null)} className="mt-3 min-h-12 w-full rounded-[18px] border border-slate-200 bg-white text-sm font-black text-slate-600 transition-colors hover:bg-slate-50">Volver</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export function BusinessQuotes({
  quotes,
  updating,
  onRespond,
  onStatus,
  onAlternative,
  emptyText = "Las solicitudes de cotización aparecerán aquí",
}: {
  quotes: QuoteRequest[];
  updating: Set<number>;
  onRespond: (quote: QuoteRequest, price: number, message: string) => void;
  onStatus: (quote: QuoteRequest, status: QuoteStatus, reason?: QuoteCancellationReason, detail?: string) => void;
  onAlternative: (quote: QuoteRequest, payload: { date?: string; time?: string; item?: string; quantity?: number; priceClp?: number; message: string }) => void;
  emptyText?: string;
}) {
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [alternative, setAlternative] = useState<QuoteRequest | null>(null);
  const [alternativeMessage, setAlternativeMessage] = useState("");
  const [alternativeItem, setAlternativeItem] = useState("");
  const [alternativePrice, setAlternativePrice] = useState("");
  const [alternativeQuantity, setAlternativeQuantity] = useState("");
  const [alternativeDate, setAlternativeDate] = useState("");
  const [alternativeTime, setAlternativeTime] = useState("");
  const [alternativeSchedule, setAlternativeSchedule] = useState<"original" | "new">("original");
  const [rejecting, setRejecting] = useState<QuoteRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<QuoteCancellationReason | "">("");
  const [rejectDetail, setRejectDetail] = useState("");
  const [expandedBusinessQuoteId, setExpandedBusinessQuoteId] = useState<number | null>(() => {
    const targetId = Number(new URLSearchParams(window.location.search).get("quoteId"));
    return Number.isInteger(targetId) && targetId > 0 ? targetId : null;
  });
  const { unread, markRead } = useUnreadInteractions();
  if (!quotes.length) return <Empty text={emptyText} />;
  return (
    <>
      <div className="space-y-2">
        {quotes.map((quote, index) => (
          <Fragment key={quote.id}>
            {(index === 0 ||
              formatQuoteDay(quotes[index - 1]) !== formatQuoteDay(quote)) && (
              <QuoteDateDivider label={formatQuoteDay(quote)} />
            )}
            <QuoteCard
              quote={quote}
              owner="business"
              statusLabel={quote.status === "requested" ? "Esperando tu respuesta" : quote.status === "alternative_proposed" ? "Alternativa enviada" : quote.status === "accepted" ? "Cliente aceptó" : quote.status === "ready" ? "Esperando confirmación" : labels[quote.status]}
              unread={unread.has(interactionKey("quote", quote.id))}
              onOpen={() => markRead("quote", quote.id)}
              expanded={expandedBusinessQuoteId === quote.id}
              onToggle={() => setExpandedBusinessQuoteId((current) => current === quote.id ? null : quote.id)}
            >
              {quote.status === "requested" && (
                <div className="mt-3 grid gap-2"><button
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    setSelected(quote);
                    setPrice("");
                    setMessage("");
                  }}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(13,148,136,0.22)]"
                >
                  Responder con precio
                </button>
                <button onClick={(event) => { event.stopPropagation(); markRead("quote", quote.id); setAlternative(quote); setAlternativeMessage(""); setAlternativeItem(""); setAlternativePrice(""); setAlternativeQuantity(""); setAlternativeDate(""); setAlternativeTime(""); setAlternativeSchedule("original"); }} className="rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-black text-violet-700">Proponer alternativa</button><button onClick={(event) => { event.stopPropagation(); setRejecting(quote); setRejectReason(""); setRejectDetail(""); }} className="rounded-xl border border-red-200 bg-white py-2.5 text-xs font-bold text-red-600">Rechazar solicitud</button></div>
              )}
              {quote.status === "accepted" && (
                <button disabled={updating.has(quote.id)} onClick={(event) => { event.stopPropagation(); markRead("quote", quote.id); onStatus(quote, "ready"); }} className="zipco-confirm-action mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-black text-white">
                  <Bell className="zipco-attention-bell h-4 w-4" /> Marcar como listo o realizado
                </button>
              )}
            </QuoteCard>
          </Fragment>
        ))}
      </div>
      {selected && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
            <h3 className="text-lg font-black">Responder cotización</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selected.itemNameSnapshot} · {selected.customerName}
            </p>
            <label className="mt-4 block text-sm font-bold">
              Precio final
              <input
                inputMode="numeric"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value.replace(/\D/g, ""))
                }
                className="mt-2 w-full rounded-xl border p-3 font-normal"
                placeholder="Ej: 25000"
              />
            </label>
            <label className="mt-3 block text-sm font-bold">
              Mensaje{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-2 w-full rounded-xl border p-3 font-normal"
                rows={3}
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border py-3 font-bold"
              >
                Volver
              </button>
              <button
                disabled={updating.has(selected.id) || Number(price) < 100}
                onClick={() => {
                  onRespond(selected, Number(price), message);
                  setSelected(null);
                }}
                className="rounded-xl bg-violet-600 py-3 font-bold text-white disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
      {alternative && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3"><div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
          <h3 className="text-lg font-black">Proponer una alternativa</h3><p className="mt-1 text-sm text-slate-500">El cliente solo podrá aceptarla o rechazarla.</p>
          <label className="mt-4 block text-sm font-bold">Explicación obligatoria<textarea value={alternativeMessage} onChange={(event) => setAlternativeMessage(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
          <label className="mt-3 block text-sm font-bold">Producto o servicio alternativo<input value={alternativeItem} onChange={(event) => setAlternativeItem(event.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
          <label className="mt-3 block text-sm font-bold">Precio alternativo<input inputMode="numeric" value={alternativePrice} onChange={(event) => setAlternativePrice(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
          <label className="mt-3 block text-sm font-bold">Cantidad<input inputMode="numeric" value={alternativeQuantity} onChange={(event) => setAlternativeQuantity(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
          <fieldset className="mt-4"><legend className="text-sm font-bold">¿Deseas mantener la fecha solicitada o proponer una nueva disponibilidad?</legend><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setAlternativeSchedule("original")} className={`rounded-xl border p-3 text-xs font-bold ${alternativeSchedule === "original" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200"}`}>Mantener fecha original</button><button type="button" onClick={() => setAlternativeSchedule("new")} className={`rounded-xl border p-3 text-xs font-bold ${alternativeSchedule === "new" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200"}`}>Proponer nueva fecha y hora</button></div></fieldset>
          {alternativeSchedule === "new" && <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-bold">Nueva fecha<input type="date" value={alternativeDate} onChange={(event) => setAlternativeDate(event.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" /></label><label className="text-xs font-bold">Nueva hora<input type="time" value={alternativeTime} onChange={(event) => setAlternativeTime(event.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" /></label></div>}
          <div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setAlternative(null)} className="rounded-xl border py-3 font-bold">Volver</button><button disabled={alternativeMessage.trim().length < 3 || (alternativeSchedule === "new" && (!alternativeDate || !alternativeTime))} onClick={() => { onAlternative(alternative, { message: alternativeMessage.trim(), item: alternativeItem.trim() || undefined, priceClp: Number(alternativePrice) >= 100 ? Number(alternativePrice) : undefined, quantity: Number(alternativeQuantity) || undefined, date: alternativeSchedule === "new" ? alternativeDate : undefined, time: alternativeSchedule === "new" ? alternativeTime : undefined }); setAlternative(null); }} className="rounded-xl bg-teal-600 py-3 font-bold text-white disabled:opacity-50">Enviar alternativa</button></div>
        </div></div>
      )}
      {rejecting && <div className="absolute inset-0 z-[60] flex items-end bg-slate-950/45 p-3"><div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5"><h3 className="text-lg font-black">Rechazar solicitud</h3><p className="mt-1 text-sm text-slate-500">Selecciona el motivo del rechazo.</p><div className="mt-4 space-y-2">{([['unavailable','Producto o servicio no disponible'],['cannot_meet_schedule','No puedo cumplir la fecha u horario solicitado'],['outside_service_area','Solicitud fuera de mi zona de atención'],['insufficient_information','Información insuficiente para procesarla'],['no_capacity','Sin capacidad disponible'],['other','Otro motivo']] as Array<[QuoteCancellationReason,string]>).map(([code,label]) => <label key={code} className="flex gap-3 rounded-xl border p-3 text-sm"><input type="radio" checked={rejectReason === code} onChange={() => setRejectReason(code)} />{label}</label>)}{rejectReason === 'other' && <textarea value={rejectDetail} onChange={(event) => setRejectDetail(event.target.value)} rows={3} placeholder="Escribe el motivo" className="w-full rounded-xl border p-3 text-sm" />}</div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setRejecting(null)} className="rounded-xl border py-3 font-bold">Volver</button><button disabled={!rejectReason || (rejectReason === 'other' && rejectDetail.trim().length < 3)} onClick={() => { onStatus(rejecting, 'declined', rejectReason || undefined, rejectDetail.trim() || undefined); setRejecting(null); }} className="rounded-xl bg-red-500 py-3 font-bold text-white disabled:opacity-50">Rechazar</button></div></div></div>}
    </>
  );
}

function QuoteCard({
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
  const handleOpen = (element: HTMLElement) => {
    element.classList.remove("zipco-notification-target");
    onOpen();
  };
  if (owner === "customer" && quote.status === "alternative_proposed") {
    const price = proposalPrice(quote);
    return (
      <article
        id={`quote-${quote.id}`}
        onClick={(event) => { handleOpen(event.currentTarget); onToggle?.(); }}
        className={`zipco-proposal-card scroll-mb-36 rounded-[22px] border p-3 transition-colors ${unread ? "border-sky-300 ring-2 ring-sky-100" : "border-violet-100"}`}
      >
        <div className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-start gap-2.5">
          {quote.referencePhoto ? (
            <ImageWithFallback src={quote.referencePhoto} alt={quote.itemNameSnapshot} className="h-[62px] w-[62px] rounded-[14px] object-cover" />
          ) : (
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400"><ImageIcon className="h-5 w-5" /></span>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-black leading-[18px] text-slate-950">{quote.itemNameSnapshot}</h3>
            <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-slate-500">Propuesta recibida</p>
            <p className="mt-0.5 line-clamp-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">{quote.message}</p>
          </div>
          <span className="inline-flex max-w-[92px] items-center justify-center gap-1 rounded-full bg-violet-50 px-2 py-1.5 text-center text-[10px] font-black leading-tight text-violet-700">
            <MessageSquareText className="h-3.5 w-3.5 shrink-0" /> Nueva propuesta
          </span>
        </div>
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{quote.needNow ? "Lo necesitas ahora" : `Lo necesitas: ${quote.requestedDate} · ${quote.requestedTime}`}</span>
        </p>
        <AnimatePresence initial={false} mode="wait">
          {!expanded ? (
            <motion.button
              key="proposal-collapsed"
              type="button"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={(event) => { event.stopPropagation(); handleOpen(event.currentTarget.closest("article") as HTMLElement); onToggle?.(); }}
              className="mt-2.5 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[15px] border border-teal-200 bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-100/70 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            >
              <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-[0.15em] text-teal-700">Propuesta del negocio</span><span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700"><MousePointerClick className="h-3.5 w-3.5" />Toca para abrir</span></span>
              <span className="whitespace-nowrap text-lg font-black text-teal-800">{price === null ? "—" : money(price)}</span>
              <ChevronDown className="h-5 w-5 text-teal-700" />
            </motion.button>
          ) : (
            <motion.div key="proposal-expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_100px] overflow-hidden rounded-[16px] border border-teal-200 bg-gradient-to-br from-teal-50 via-cyan-50/70 to-emerald-50 p-3 text-teal-950">
                <div className="min-w-0 pr-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-800">Propuesta del negocio</p>
                  <p className="mt-1.5 text-[15px] font-black leading-[18px] text-slate-950">Alternativa del negocio</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">{quote.alternativeMessage}</p>
                  {quote.alternativeItem && <p className="mt-1 break-words text-xs text-slate-600">Opción: {quote.alternativeItem}{quote.alternativeQuantity ? ` · Cantidad ${quote.alternativeQuantity}` : ""}</p>}
                  {quote.alternativeDate && <p className="mt-1 text-xs text-slate-600">Fecha: {quote.alternativeDate}{quote.alternativeTime ? ` · ${quote.alternativeTime}` : ""}</p>}
                </div>
                <div className="flex min-w-0 flex-col justify-center border-l border-teal-200 pl-3 text-right">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">Precio total</p>
                  <p className="mt-1 whitespace-nowrap text-[22px] font-black tracking-tight text-teal-800">{price === null ? "—" : money(price)}</p>
                </div>
              </div>
              {children}
              <button type="button" onClick={(event) => { event.stopPropagation(); onToggle?.(); }} className="mt-2 w-full text-center text-[11px] font-bold text-slate-500">Ocultar propuesta</button>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }
  if (owner === "business") {
    const price = proposalPrice(quote);
    const tone = quote.status === "requested"
      ? { badge: "bg-orange-50 text-orange-700", panel: "border-orange-200 from-amber-50 to-orange-100/70", accent: "text-orange-700" }
      : quote.status === "accepted"
        ? { badge: "bg-emerald-50 text-emerald-700", panel: "border-emerald-200 from-emerald-50 to-teal-100/70", accent: "text-emerald-700" }
        : quote.status === "ready"
          ? { badge: "bg-teal-50 text-teal-700", panel: "border-teal-200 from-cyan-50 to-teal-100/70", accent: "text-teal-700" }
          : { badge: "bg-violet-50 text-violet-700", panel: "border-violet-200 from-violet-50 to-fuchsia-50", accent: "text-violet-700" };
    return (
      <article
        id={`quote-${quote.id}`}
        onClick={(event) => { handleOpen(event.currentTarget); onToggle?.(); }}
        className={`zipco-provider-card scroll-mb-36 rounded-[22px] border p-3 transition-colors ${unread ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-200"}`}
      >
        <div className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-start gap-2.5">
          {quote.referencePhoto ? (
            <ImageWithFallback src={quote.referencePhoto} alt={quote.itemNameSnapshot} className="h-[62px] w-[62px] rounded-[14px] object-cover" />
          ) : (
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400"><ImageIcon className="h-5 w-5" /></span>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-black leading-[18px] text-slate-950">{quote.itemNameSnapshot}</h3>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{quote.customerName}</p>
            <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-slate-600">{quote.message}</p>
          </div>
          <span className={`inline-flex max-w-[98px] items-center justify-center rounded-full px-2 py-1.5 text-center text-[10px] font-black leading-tight ${tone.badge}`}>{statusLabel}</span>
        </div>
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{quote.needNow ? "Lo necesita ahora" : `${quote.requestedDate} · ${quote.requestedTime}`}</span>
        </p>
        <AnimatePresence initial={false} mode="wait">
          {!expanded ? (
            <motion.button
              key="business-quote-collapsed"
              type="button"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={(event) => { event.stopPropagation(); handleOpen(event.currentTarget.closest("article") as HTMLElement); onToggle?.(); }}
              className={`mt-2.5 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[15px] border bg-gradient-to-r px-3 py-2 text-left ${tone.panel}`}
            >
              <span className="min-w-0"><span className={`block text-[9px] font-black uppercase tracking-[0.15em] ${tone.accent}`}>{quote.status === "requested" ? "Solicitud del cliente" : quote.status === "ready" ? "Servicio finalizado" : "Seguimiento de cotización"}</span><span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700"><MousePointerClick className="h-3.5 w-3.5" />Toca para abrir</span></span>
              {price !== null && <span className="whitespace-nowrap text-lg font-black text-teal-800">{money(price)}</span>}
              <ChevronDown className={`h-5 w-5 ${tone.accent}`} />
            </motion.button>
          ) : (
            <motion.div key="business-quote-expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className={`mt-3 rounded-[16px] border bg-gradient-to-br p-3 ${tone.panel}`}>
                <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${tone.accent}`}>{quote.status === "requested" ? "Solicitud del cliente" : quote.status === "ready" ? "Solicitud finalizada" : quote.alternativeMessage ? "Propuesta enviada" : "Cotización enviada"}</p>
                {quote.status === "ready" ? (
                  <><p className="mt-1.5 text-[15px] font-black text-slate-950">Cliente notificado</p><p className="mt-1 text-xs leading-4 text-slate-600">Esperando que confirme la recepción o realización conforme.</p></>
                ) : quote.alternativeMessage ? (
                  <><p className="mt-1.5 text-[15px] font-black text-slate-950">Alternativa del negocio</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">{quote.alternativeMessage}</p>{quote.alternativeItem && <p className="mt-1 text-xs text-slate-600">Opción: {quote.alternativeItem}{quote.alternativeQuantity ? ` · Cantidad ${quote.alternativeQuantity}` : ""}</p>}{quote.alternativeDate && <p className="mt-1 text-xs text-slate-600">Fecha: {quote.alternativeDate}{quote.alternativeTime ? ` · ${quote.alternativeTime}` : ""}</p>}</>
                ) : (
                  <><p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-slate-800">{quote.message}</p>{quote.itemDescriptionSnapshot && <p className="mt-1 text-xs leading-4 text-slate-500">{quote.itemDescriptionSnapshot}</p>}</>
                )}
                {price !== null && <div className="mt-2 flex items-end justify-between border-t border-black/5 pt-2"><span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Precio total</span><span className="text-xl font-black text-teal-800">{money(price)}</span></div>}
              </div>
              {children}
              <button type="button" onClick={(event) => { event.stopPropagation(); onToggle?.(); }} className="mt-2 w-full text-center text-[11px] font-bold text-slate-500">Ocultar detalle</button>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }
  return (
    <article
      id={`quote-${quote.id}`}
      onClick={(event) => handleOpen(event.currentTarget)}
      className={`scroll-mb-36 rounded-2xl border p-3 shadow-sm transition-colors ${unread ? "border-sky-400 bg-sky-100 ring-2 ring-sky-200" : "border-violet-100 bg-white"}`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-start gap-3">
        {quote.referencePhoto ? (
          <ImageWithFallback
            src={quote.referencePhoto}
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
          <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1 text-[11px] text-purple-800">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {quote.needNow
                ? "Lo necesita ahora"
                : `${quote.requestedDate} · ${quote.requestedTime}`}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="max-w-[88px] rounded-full bg-violet-50 px-2.5 py-1 text-center text-[10px] font-bold leading-tight text-violet-700">
            {statusLabel}
          </span>
          {quote.quotedPriceClp !== null && (
            <span className="whitespace-nowrap text-base font-black text-emerald-600">
              {money(quote.quotedPriceClp)}
            </span>
          )}
        </div>
      </div>
      {quote.businessMessage && (
        <p className="mt-3 flex gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-800">
          <MessageSquareText className="h-4 w-4 shrink-0" />
          {quote.businessMessage}
        </p>
      )}
      {owner === "business" && quote.status === "ready" ? (
        <div className="mt-3 w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 text-xs text-emerald-900">
          <p className="font-black">Solicitud finalizada</p>
          <p className="mt-0.5">Cliente notificado. Esperando su confirmación.</p>
        </div>
      ) : quote.alternativeMessage && (
        <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
          <p className="font-black">Alternativa del negocio</p><p className="mt-1">{quote.alternativeMessage}</p>
          {quote.alternativeItem && <p className="mt-1">Opción: {quote.alternativeItem}{quote.alternativeQuantity ? ` · Cantidad ${quote.alternativeQuantity}` : ""}</p>}
          {quote.alternativeDate && <p className="mt-1">Fecha: {quote.alternativeDate}{quote.alternativeTime ? ` · ${quote.alternativeTime}` : ""}</p>}
          {quote.alternativePriceClp && <p className="mt-1 font-black">{money(quote.alternativePriceClp)}</p>}
        </div>
      )}
      {children}
    </article>
  );
}
function formatQuoteDay(quote: QuoteRequest) {
  const parsed = new Date(quote.updatedAt || quote.createdAt);
  return Number.isNaN(parsed.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
}
function QuoteDateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-500">
      <CalendarDays className="h-4 w-4" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="py-16 text-center">
      <MessageSquareText className="mx-auto h-10 w-10 text-violet-300" />
      <p className="mt-3 text-sm font-semibold text-slate-500">{text}</p>
    </div>
  );
}
