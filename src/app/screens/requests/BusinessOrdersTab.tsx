import { CalendarDays, ClipboardList, Sparkles } from "lucide-react";
import { Fragment, useState } from "react";
import BusinessOrderCard from "./BusinessOrderCard";
import EmptyRequestsState from "./EmptyRequestsState";
import OrderActionModal from "./OrderActionModal";
import AlternativeProposalFields from "./AlternativeProposalFields";
import type { BusinessRequest, ClosureReason, OrderAction } from "./types";
import {
  interactionKey,
  useUnreadInteractions,
} from "../../notifications/unreadInteractions";

type Props = {
  requests: BusinessRequest[];
  updatingOrderIds: Set<number>;
  onAction: (
    order: BusinessRequest,
    action: OrderAction,
    reason?: ClosureReason,
    detail?: string,
  ) => Promise<void>;
  onRetry: () => Promise<boolean>;
  emptyTitle: string;
  emptyDescription: string;
  onProposeAlternative: (
    id: number,
    payload: {
      date?: string;
      time?: string;
      item?: string;
      quantity?: number;
      priceClp?: number;
      photo?: string;
      message: string;
    },
  ) => Promise<void>;
};

export default function BusinessOrdersTab({
  requests,
  updatingOrderIds,
  onAction,
  onRetry,
  emptyTitle,
  emptyDescription,
  onProposeAlternative,
}: Props) {
  const { unread, markRead } = useUnreadInteractions();
  const [selection, setSelection] = useState<{
    order: BusinessRequest;
    action: OrderAction;
  } | null>(null);
  const [alternative, setAlternative] = useState<BusinessRequest | null>(null);
  const [alternativeMessage, setAlternativeMessage] = useState("");
  const [alternativeItem, setAlternativeItem] = useState("");
  const [alternativePrice, setAlternativePrice] = useState("");
  const [alternativeQuantity, setAlternativeQuantity] = useState("");
  const [alternativeDate, setAlternativeDate] = useState("");
  const [alternativeTime, setAlternativeTime] = useState("");
  const [alternativePhoto, setAlternativePhoto] = useState("");
  const [sendingAlternative, setSendingAlternative] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(() => {
    const targetId = Number(
      new URLSearchParams(window.location.search).get("orderId"),
    );
    return Number.isInteger(targetId) && targetId > 0 ? targetId : null;
  });
  const displayed = requests.filter(
    (order) => order.recordState === "available",
  );
  const unavailable = requests.filter(
    (order) => order.recordState === "unavailable",
  );
  const selectedId =
    selection?.order.recordState === "available" ? selection.order.id : null;
  const isSubmitting = selectedId !== null && updatingOrderIds.has(selectedId);

  const confirm = async (reason?: ClosureReason, detail?: string) => {
    if (!selection) return;
    await onAction(selection.order, selection.action, reason, detail);
    setSelection(null);
  };

  return (
    <>
      {displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((order, index) => (
            <Fragment key={order.clientKey}>
              {(index === 0 || displayed[index - 1].date !== order.date) && (
                <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  <span>{order.date}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <BusinessOrderCard
                request={order}
                isUpdating={
                  order.recordState === "available" &&
                  updatingOrderIds.has(order.id)
                }
                onAction={(action) => setSelection({ order, action })}
                onRetry={() => {
                  void onRetry();
                }}
                onProposeAlternative={() => {
                  setAlternative(order);
                  setAlternativeMessage("");
                  setAlternativeItem("");
                  setAlternativePrice("");
                  setAlternativeQuantity("");
                  setAlternativeDate("");
                  setAlternativeTime("");
                  setAlternativePhoto("");
                }}
                isUnread={
                  order.recordState === "available" &&
                  unread.has(interactionKey("order", order.id))
                }
                onOpen={() => {
                  if (order.recordState === "available")
                    markRead("order", order.id);
                }}
                expanded={
                  order.recordState === "available" &&
                  expandedOrderId === order.id
                }
                onToggle={() => {
                  if (order.recordState === "available")
                    setExpandedOrderId((current) =>
                      current === order.id ? null : order.id,
                    );
                }}
              />
            </Fragment>
          ))}
        </div>
      ) : (
        <EmptyRequestsState
          icon={ClipboardList}
          title={emptyTitle}
          description={emptyDescription}
        />
      )}

      {unavailable.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">No disponibles</h3>
          {unavailable.map((order) => (
            <BusinessOrderCard
              key={order.clientKey}
              request={order}
              isUpdating={false}
              onAction={() => undefined}
              onRetry={() => {
                void onRetry();
              }}
            />
          ))}
        </div>
      )}

      <OrderActionModal
        key={
          selection
            ? `${selection.order.clientKey}-${selection.action}`
            : "closed"
        }
        action={selection?.action ?? null}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) setSelection(null);
        }}
        onConfirm={(reason, detail) => {
          void confirm(reason, detail);
        }}
      />
      {alternative?.recordState === "available" && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="relative max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 dark:bg-slate-900">
            <h3 className="text-lg font-black">Proponer una alternativa</h3>
            <p className="mt-1 text-sm text-slate-600">
              Selecciona qué aspectos quieres modificar. El cliente podrá
              aceptarla o rechazarla.
            </p>
            <AlternativeProposalFields
              original={`${alternative.products.state === "available" ? alternative.products.items.map((item) => `${item.quantity}x ${item.name}`).join(" · ") : "Pedido"} · $${Number(alternative.total).toLocaleString("es-CL")}`}
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
                  alternativeMessage.trim().length < 3 || sendingAlternative
                }
                onClick={async () => {
                  setSendingAlternative(true);
                  const minimumAnimation = new Promise((resolve) =>
                    window.setTimeout(resolve, 950),
                  );
                  await Promise.all([
                    onProposeAlternative(alternative.id, {
                      message: alternativeMessage.trim(),
                      item: alternativeItem.trim() || undefined,
                      quantity: Number(alternativeQuantity) || undefined,
                      priceClp:
                        Number(alternativePrice) >= 100
                          ? Number(alternativePrice)
                          : undefined,
                      date: alternativeDate || undefined,
                      time: alternativeTime || undefined,
                      photo: alternativePhoto || undefined,
                    }),
                    minimumAnimation,
                  ]);
                  setSendingAlternative(false);
                  setAlternative(null);
                }}
                className="zipco-confirm-action rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-bold text-white disabled:opacity-50"
              >
                {sendingAlternative
                  ? "Enviando propuesta…"
                  : "Enviar alternativa"}
              </button>
            </div>
            {sendingAlternative && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/65 backdrop-blur-sm">
                <div className="zipco-hologram-card rounded-3xl border border-violet-300 bg-slate-950/90 p-5 text-center text-white shadow-[0_0_45px_rgba(139,92,246,.45)]">
                  <Sparkles className="mx-auto h-9 w-9 text-violet-300" />
                  <p className="mt-2 font-black">
                    Alternativa enviada al cliente
                  </p>
                  <p className="text-xs text-slate-300">Moviendo a Esperando</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
