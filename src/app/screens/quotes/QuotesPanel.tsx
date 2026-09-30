import { Fragment, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Image as ImageIcon,
  MessageSquareText,
} from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import type { QuoteRequest } from "./quoteApi";
import {
  interactionKey,
  useUnreadInteractions,
} from "../../notifications/unreadInteractions";

const labels = {
  requested: "Esperando respuesta",
  quoted: "Cotización recibida",
  accepted: "Aceptada",
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
    status: "accepted" | "declined" | "cancelled",
  ) => void;
  emptyText?: string;
}) {
  const { unread, markRead } = useUnreadInteractions();
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
            unread={unread.has(interactionKey("quote", quote.id))}
            onOpen={() => markRead("quote", quote.id)}
          >
            {quote.status === "quoted" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  disabled={updating.has(quote.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    onStatus(quote, "declined");
                  }}
                  className="rounded-xl border border-red-200 py-2 text-sm font-bold text-red-600"
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
                  className="rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white"
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
                  onStatus(quote, "cancelled");
                }}
                className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                Cancelar solicitud
              </button>
            )}
          </QuoteCard>
        </Fragment>
      ))}
    </div>
  );
}

export function BusinessQuotes({
  quotes,
  updating,
  onRespond,
  emptyText = "Las solicitudes de cotización aparecerán aquí",
}: {
  quotes: QuoteRequest[];
  updating: Set<number>;
  onRespond: (quote: QuoteRequest, price: number, message: string) => void;
  emptyText?: string;
}) {
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
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
              unread={unread.has(interactionKey("quote", quote.id))}
              onOpen={() => markRead("quote", quote.id)}
            >
              {quote.status === "requested" && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead("quote", quote.id);
                    setSelected(quote);
                    setPrice("");
                    setMessage("");
                  }}
                  className="mt-2 w-full rounded-lg bg-violet-600 py-2 text-xs font-bold text-white"
                >
                  Responder con precio
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
    </>
  );
}

function QuoteCard({
  quote,
  children,
  unread,
  onOpen,
}: {
  quote: QuoteRequest;
  children?: React.ReactNode;
  unread: boolean;
  onOpen: () => void;
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
            {labels[quote.status]}
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
      {children}
    </article>
  );
}
function formatQuoteDay(quote: QuoteRequest) {
  const parsed = new Date(quote.createdAt);
  return Number.isNaN(parsed.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
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
