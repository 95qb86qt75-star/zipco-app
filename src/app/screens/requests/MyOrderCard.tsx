import { Calendar, ChevronRight, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import OrderStatusBadge from "./OrderStatusBadge";
import type { MyOrder, OrderAction } from "./types";
import { formatDeliverySchedule } from "./utils";

type Props = {
  order: MyOrder;
  isUpdating: boolean;
  onAction: (action: OrderAction) => void;
  onRetry: () => void;
  isUnread?: boolean;
  onOpen?: () => void;
};

export default function MyOrderCard({
  order,
  isUpdating,
  onAction,
  onRetry,
  isUnread = false,
  onOpen,
}: Props) {
  if (order.recordState === "unavailable")
    return (
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold">Pedido no disponible</p>
          <OrderStatusBadge status="unavailable" />
        </div>
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-bold text-teal-700"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  const action =
    order.status === "pending"
      ? "cancel"
      : order.status === "ready"
        ? "complete-reception"
        : null;
  const schedule = formatDeliverySchedule(order, "customer");
  return (
    <article
      id={`order-${order.id}`}
      onClick={onOpen}
      className={`rounded-2xl border p-3 shadow-sm ${isUnread ? "border-sky-400 bg-sky-100 ring-2 ring-sky-200" : "border-slate-200 bg-white"}`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-start gap-3">
        <ImageWithFallback
          src={order.businessImage}
          alt={order.businessName}
          className="h-[72px] w-[72px] rounded-xl object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-black text-slate-950">
              {order.businessName}
            </h4>
            {isUnread && (
              <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                Nueva
              </span>
            )}
          </div>
          {order.products.state === "available" ? (
            order.products.items.map((product, index) => (
              <p
                key={`${product.name}-${index}`}
                className="truncate text-xs text-slate-700"
              >
                <strong>{product.quantity}x</strong> {product.name}
              </p>
            ))
          ) : (
            <p className="text-xs text-red-600">Producto no disponible</p>
          )}
          {schedule && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1 text-[11px] text-purple-800">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{schedule}</span>
            </p>
          )}
          {order.note && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] italic text-slate-500">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />“{order.note}”
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="whitespace-nowrap text-base font-black text-emerald-600">
            {order.total === null
              ? "—"
              : `$${order.total.toLocaleString("es-CL")}`}
          </span>
        </div>
      </div>
      {order.status === "accepted" && (
        <p className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
          El negocio está preparando tu pedido.
          <ChevronRight className="h-4 w-4" />
        </p>
      )}
      {action && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={(event) => {
            event.stopPropagation();
            onAction(action);
          }}
          className="mt-3 w-full rounded-xl bg-teal-600 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {isUpdating
            ? "Guardando..."
            : action === "cancel"
              ? "Cancelar pedido"
              : "Confirmar recepción"}
        </button>
      )}
    </article>
  );
}
