import { Fragment, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Image as ImageIcon,
  MessageSquareText,
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
  alternative_proposed: "Alternativa recibida",
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
            statusLabel={labels[quote.status]}
            unread={unread.has(interactionKey("quote", quote.id))}
            onOpen={() => markRead("quote", quote.id)}
          >
            {(quote.status === "quoted" || quote.status === "alternative_proposed") && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    if (quote.status === "alternative_proposed") setDecliningAlternative(quote);
                    else onStatus(quote, "declined");
                  }}
                  className="rounded-xl border border-red-200 py-2 text-sm font-bold text-red-600"
                >
                  {quote.status === "alternative_proposed" ? "Rechazar alternativa" : "Rechazar"}
                </button>
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "accepted");
                  }}
                  className="rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white"
                >
                  {quote.status === "alternative_proposed" ? "Aceptar alternativa" : "Aceptar"}
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
              <button disabled={updating.has(quote.id)} onClick={(event) => { event.stopPropagation(); markRead("quote", quote.id); onStatus(quote, "completed"); }} className="mt-2 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white">
                Confirmar recepción o servicio realizado
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"><div className="w-full max-w-sm rounded-2xl bg-white p-5"><h3 className="text-lg font-black">¿Rechazar esta alternativa?</h3><p className="mt-2 text-sm text-slate-600">La solicitud finalizará y pasará al Historial. El negocio no podrá enviar otra alternativa.</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setDecliningAlternative(null)} className="rounded-xl border py-3 font-bold">Volver</button><button onClick={() => { onStatus(decliningAlternative, "declined"); setDecliningAlternative(null); }} className="rounded-xl bg-red-500 py-3 font-bold text-white">Rechazar alternativa</button></div></div></div>
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
              statusLabel={quote.status === "requested" ? "Esperando tu respuesta" : quote.status === "accepted" ? "Aceptaste" : quote.status === "ready" ? "Esperando confirmación" : labels[quote.status]}
              unread={unread.has(interactionKey("quote", quote.id))}
              onOpen={() => markRead("quote", quote.id)}
            >
              {quote.status === "requested" && (
                <div className="mt-2 grid grid-cols-2 gap-2"><button
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    setSelected(quote);
                    setPrice("");
                    setMessage("");
                  }}
                  className="rounded-lg bg-violet-600 py-2 text-xs font-bold text-white"
                >
                  Responder con precio
                </button>
                <button onClick={(event) => { event.stopPropagation(); markRead("quote", quote.id); setAlternative(quote); setAlternativeMessage(""); setAlternativeItem(""); setAlternativePrice(""); setAlternativeQuantity(""); setAlternativeDate(""); setAlternativeTime(""); setAlternativeSchedule("original"); }} className="rounded-lg border border-teal-300 bg-teal-50 py-2 text-xs font-bold text-teal-700">Proponer alternativa</button><button onClick={(event) => { event.stopPropagation(); setRejecting(quote); setRejectReason(""); setRejectDetail(""); }} className="col-span-2 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600">Rechazar solicitud</button></div>
              )}
              {quote.status === "accepted" && (
                <button disabled={updating.has(quote.id)} onClick={(event) => { event.stopPropagation(); markRead("quote", quote.id); onStatus(quote, "ready"); }} className="mt-2 w-full rounded-lg bg-teal-600 py-2 text-xs font-bold text-white">
                  Marcar como listo o realizado
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
}: {
  quote: QuoteRequest;
  children?: React.ReactNode;
  unread: boolean;
  onOpen: () => void;
  statusLabel: string;
}) {
  return (
    <article
      id={`quote-${quote.id}`}
      onClick={onOpen}
      className={`rounded-2xl border p-3 shadow-sm transition-colors ${unread ? "border-sky-400 bg-sky-100 ring-2 ring-sky-200" : "border-violet-100 bg-white"}`}
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
          <p className="mt-1 truncate text-xs text-slate-700">
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
      {quote.alternativeMessage && (
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
