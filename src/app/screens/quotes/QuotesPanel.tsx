import { Fragment, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Ban,
  Check,
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
  Tag,
  Zap,
  X,
  XCircle,
} from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import AlternativeProposalFields from "../requests/AlternativeProposalFields";
import type {
  QuoteCancellationReason,
  QuoteRequest,
  QuoteStatus,
} from "./quoteApi";
import {
  interactionKey,
  useUnreadInteractions,
} from "../../notifications/unreadInteractions";
import ProposalPhotoAttachment from "./ProposalPhotoAttachment";
import AnimatedPhotoIcon from "./AnimatedPhotoIcon";
import { formatQuoteRespondedAt } from "./quoteResponseTime";

const labels = {
  requested: "Esperando respuesta",
  quoted: "Propuesta recibida",
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
  quote.alternativePriceClp ??
  quote.quotedPriceClp ??
  quote.startingPriceClpSnapshot;

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
              <div className="mt-3 rounded-2xl border border-cyan-300/50 bg-cyan-500/10 p-3">
                <p className="flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-200">
                  <Check className="h-4 w-4" /> Servicio en curso
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  El negocio está realizando el servicio. Te avisaremos cuando
                  lo marque como realizado.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold">
                  <span className="rounded-full bg-emerald-500 px-2 py-1 text-white">
                    Propuesta aceptada
                  </span>
                  <span className="h-px flex-1 bg-cyan-300" />
                  <span className="rounded-full bg-cyan-500 px-2 py-1 text-white">
                    En curso
                  </span>
                  <span className="h-px flex-1 bg-slate-300" />
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-500">
                    Confirmar
                  </span>
                </div>
              </div>
            )}
            {quote.status === "ready" && (
              <button
                disabled={updating.has(quote.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  markRead("quote", quote.id);
                  onStatus(quote, "completed");
                }}
                className="zipco-confirm-action mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(245,158,11,0.30)]"
              >
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
  onRespond: (
    quote: QuoteRequest,
    price: number,
    message: string,
  ) => void | Promise<void>;
  onStatus: (
    quote: QuoteRequest,
    status: QuoteStatus,
    reason?: QuoteCancellationReason,
    detail?: string,
  ) => void;
  onAlternative: (
    quote: QuoteRequest,
    payload: {
      date?: string;
      time?: string;
      item?: string;
      quantity?: number;
      priceClp?: number;
      photo?: string;
      message: string;
    },
  ) => void;
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
  const [alternativePhoto, setAlternativePhoto] = useState("");
  const [sendingAlternative, setSendingAlternative] = useState(false);
  const [rejecting, setRejecting] = useState<QuoteRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<
    QuoteCancellationReason | ""
  >("");
  const [rejectDetail, setRejectDetail] = useState("");
  const [expandedBusinessQuoteId, setExpandedBusinessQuoteId] = useState<
    number | null
  >(() => {
    const targetId = Number(
      new URLSearchParams(window.location.search).get("quoteId"),
    );
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
              statusLabel={
                quote.status === "requested"
                  ? "Esperando tu respuesta"
                  : quote.status === "alternative_proposed"
                    ? "Respuesta enviada"
                    : quote.status === "accepted"
                      ? "Servicio en curso"
                      : quote.status === "quoted"
                        ? "Respuesta enviada"
                        : quote.status === "ready"
                          ? "Listo y notificado"
                          : labels[quote.status]
              }
              unread={unread.has(interactionKey("quote", quote.id))}
              onOpen={() => markRead("quote", quote.id)}
              expanded={expandedBusinessQuoteId === quote.id}
              onToggle={() =>
                setExpandedBusinessQuoteId((current) =>
                  current === quote.id ? null : quote.id,
                )
              }
            >
              {quote.status === "requested" && (
                <div className="mt-3 grid gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      markRead("quote", quote.id);
                      setAlternative(quote);
                      setAlternativeMessage("");
                      setAlternativeItem("");
                      setAlternativePrice("");
                      setAlternativeQuantity("");
                      setAlternativeDate("");
                      setAlternativeTime("");
                      setAlternativePhoto("");
                    }}
                    className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(13,148,136,0.22)]"
                  >
                    Responder solicitud
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setRejecting(quote);
                      setRejectReason("");
                      setRejectDetail("");
                    }}
                    className="rounded-xl border border-red-200 bg-white py-2.5 text-xs font-bold text-red-600"
                  >
                    Rechazar solicitud
                  </button>
                </div>
              )}
              {quote.status === "accepted" && (
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "ready");
                  }}
                  className="zipco-confirm-action mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-black text-white"
                >
                  <Bell className="zipco-attention-bell h-4 w-4" /> Marcar
                  servicio como realizado
                </button>
              )}
            </QuoteCard>
          </Fragment>
        ))}
      </div>
      {selected && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="relative mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 dark:bg-slate-900">
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
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="relative mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 dark:bg-slate-900">
            <h3 className="text-lg font-black">Responder solicitud</h3>
            <p className="mt-1 text-sm text-slate-500">
              Define el precio final y selecciona solo lo que necesitas ajustar.
              Lo demás se mantendrá como lo solicitó el cliente.
            </p>
            <AlternativeProposalFields
              original={`${alternative.itemNameSnapshot} · ${proposalPrice(alternative) === null ? "Precio por definir" : money(proposalPrice(alternative)!)}`}
              item={alternativeItem}
              setItem={setAlternativeItem}
              price={alternativePrice}
              setPrice={setAlternativePrice}
              quantity={alternativeQuantity}
              setQuantity={setAlternativeQuantity}
              date={alternativeDate}
              setDate={setAlternativeDate}
              time={alternativeTime}
              setTime={setAlternativeTime}
              message={alternativeMessage}
              setMessage={setAlternativeMessage}
              photo={alternativePhoto}
              setPhoto={setAlternativePhoto}
              priceRequired
              customerName={alternative.customerName}
            />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setAlternative(null)}
                className="rounded-xl border py-3 font-bold"
              >
                Volver
              </button>
              <button
                disabled={
                  Number(alternativePrice) < 100 ||
                  Boolean(alternativeDate) !== Boolean(alternativeTime)
                }
                onClick={async () => {
                  setSendingAlternative(true);
                  const minimumAnimation = new Promise((resolve) =>
                    window.setTimeout(resolve, 2800),
                  );
                  await Promise.all([
                    Promise.resolve(
                      alternativeItem.trim() ||
                        alternativeQuantity ||
                        alternativeDate ||
                        alternativeTime ||
                        alternativePhoto
                        ? onAlternative(alternative, {
                            message:
                              alternativeMessage.trim() ||
                              "Te envío una propuesta actualizada.",
                            item: alternativeItem.trim() || undefined,
                            priceClp: Number(alternativePrice),
                            quantity: Number(alternativeQuantity) || undefined,
                            date: alternativeDate || undefined,
                            time: alternativeTime || undefined,
                            photo: alternativePhoto || undefined,
                          })
                        : onRespond(
                            alternative,
                            Number(alternativePrice),
                            alternativeMessage.trim(),
                          ),
                    ),
                    minimumAnimation,
                  ]);
                  setSendingAlternative(false);
                  setAlternative(null);
                }}
                className="zipco-confirm-action rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-bold text-white disabled:opacity-50"
              >
                {sendingAlternative
                  ? "Enviando respuesta…"
                  : "Enviar respuesta"}
              </button>
            </div>
            {sendingAlternative && (
              <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-6 backdrop-blur-xl">
                <div className="zipco-hologram-card zipco-flow-hologram rounded-3xl border border-violet-300 bg-slate-950/90 p-5 text-center text-white shadow-[0_0_45px_rgba(139,92,246,.45)]">
                  <MessageSquareText className="mx-auto h-9 w-9 text-violet-300" />
                  <p className="mt-2 font-black">
                    Respuesta enviada al cliente
                  </p>
                  <p className="text-xs text-slate-300">
                    Esperando la decisión de{" "}
                    {alternative.customerName || "tu cliente"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {rejecting && (
        <div className="absolute inset-0 z-[60] flex items-end bg-slate-950/45 p-3">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
            <h3 className="text-lg font-black">Rechazar solicitud</h3>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona el motivo del rechazo.
            </p>
            <div className="mt-4 space-y-2">
              {(
                [
                  ["unavailable", "Producto o servicio no disponible"],
                  [
                    "cannot_meet_schedule",
                    "No puedo cumplir la fecha u horario solicitado",
                  ],
                  [
                    "outside_service_area",
                    "Solicitud fuera de mi zona de atención",
                  ],
                  [
                    "insufficient_information",
                    "Información insuficiente para procesarla",
                  ],
                  ["no_capacity", "Sin capacidad disponible"],
                  ["other", "Otro motivo"],
                ] as Array<[QuoteCancellationReason, string]>
              ).map(([code, label]) => (
                <label
                  key={code}
                  className="flex gap-3 rounded-xl border p-3 text-sm"
                >
                  <input
                    type="radio"
                    checked={rejectReason === code}
                    onChange={() => setRejectReason(code)}
                  />
                  {label}
                </label>
              ))}
              {rejectReason === "other" && (
                <textarea
                  value={rejectDetail}
                  onChange={(event) => setRejectDetail(event.target.value)}
                  rows={3}
                  placeholder="Escribe el motivo"
                  className="w-full rounded-xl border p-3 text-sm"
                />
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setRejecting(null)}
                className="rounded-xl border py-3 font-bold"
              >
                Volver
              </button>
              <button
                disabled={
                  !rejectReason ||
                  (rejectReason === "other" && rejectDetail.trim().length < 3)
                }
                onClick={() => {
                  onStatus(
                    rejecting,
                    "declined",
                    rejectReason || undefined,
                    rejectDetail.trim() || undefined,
                  );
                  setRejecting(null);
                }}
                className="rounded-xl bg-red-500 py-3 font-bold text-white disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
          {quote.status !== "quoted" && quote.quotedPriceClp !== null && (
            <span className="text-right">
              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Precio propuesto
              </span>
              <span className="whitespace-nowrap text-base font-black text-emerald-500">
                {money(quote.quotedPriceClp)}
              </span>
            </span>
          )}
        </div>
      </div>
      {quote.status === "quoted" && quote.quotedPriceClp !== null && (
        <div className="mt-2 grid grid-cols-[minmax(112px,1fr)_auto] items-center gap-2 border-t border-slate-300/40 pt-2 min-[360px]:ml-[62px]">
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
                {money(quote.quotedPriceClp)}
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
                {quote.alternativeTime ? ` · ${quote.alternativeTime}` : ""}
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
