import * as React from 'react';
import BusinessResponseHoursNotice from "../../requests/shared/hours/BusinessResponseHoursNotice";
import { Fragment, useState } from "react";

import { Bell, MessageSquareText } from "lucide-react";

import AlternativeProposalFields from "../../requests/forms/proposal/AlternativeProposalFields";
import type { QuoteCancellationReason, QuoteRequest, QuoteStatus } from "../domain/quoteApi";
import { interactionKey, useUnreadInteractions } from "../../../notifications/unreadInteractions";




import { QuoteCard } from "../cards/QuoteCard";
import { QuoteDateDivider } from "../shared/QuoteDateDivider";
import { Empty } from "../shared/EmptyQuotes";
import {labels,money,proposalPrice,formatQuoteDay} from '../shared/quotePresentation';

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
            <BusinessResponseHoursNotice businessId={selected.businessId} date={selected.needNow?undefined:selected.requestedDate} time={selected.needNow?undefined:selected.requestedTime}/>
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
            <BusinessResponseHoursNotice businessId={alternative.businessId} date={alternativeDate||(!alternative.needNow?alternative.requestedDate:undefined)} time={alternativeTime||(!alternative.needNow?alternative.requestedTime:undefined)}/>
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
