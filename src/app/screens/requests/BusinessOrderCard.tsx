import {
  Calendar,
  Check,
  Image as ImageIcon,
  MessageCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import OrderStatusBadge from "./OrderStatusBadge";
import type { BusinessRequest, OrderAction } from "./types";
import { formatBusinessDeliverySchedule } from "./utils";

type Props = {
  request: BusinessRequest;
  isUpdating: boolean;
  onAction: (action: OrderAction) => void;
  onRetry: () => void;
  isUnread?: boolean;
  onOpen?: () => void;
};

export default function BusinessOrderCard({
  request,
  isUpdating,
  onAction,
  onRetry,
  isUnread = false,
  onOpen,
}: Props) {
  const [showPhoto, setShowPhoto] = useState(false);
  if (request.recordState === "unavailable")
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
  const canAccept =
    request.status === "pending" && request.products.state === "available";
  const action: OrderAction | null =
    request.status === "accepted"
      ? "mark-ready"
      : request.status === "ready"
        ? "complete-delivery"
        : null;
  const schedule = formatBusinessDeliverySchedule(request);
  return (
    <article
      id={`order-${request.id}`}
      onClick={onOpen}
      className={`rounded-2xl border p-3 shadow-sm ${isUnread ? "border-sky-400 bg-sky-100 ring-2 ring-sky-200" : "border-slate-200 bg-white"}`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-start gap-3">
        {request.referencePhoto ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowPhoto(true);
            }}
          >
            <ImageWithFallback
              src={request.referencePhoto}
              alt="Foto de referencia"
              className="h-[72px] w-[72px] rounded-xl object-cover"
            />
          </button>
        ) : (
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ImageIcon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-black text-slate-950">
              {request.customerName || "Cliente"}
            </h4>
            {isUnread && (
              <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                Nueva
              </span>
            )}
          </div>
          {request.products.state === "available" ? (
            request.products.items.map((product, index) => (
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
          {request.note && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] italic text-slate-500">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />“{request.note}”
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={request.status} />
          <span className="whitespace-nowrap text-base font-black text-emerald-600">
            {request.total === null
              ? "—"
              : `$${request.total.toLocaleString("es-CL")}`}
          </span>
        </div>
      </div>
      {request.status === "pending" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              onAction("reject");
            }}
            className="rounded-xl bg-red-500 py-2 text-xs font-bold text-white"
          >
            <X className="mr-1 inline h-3.5 w-3.5" />
            Rechazar
          </button>
          <button
            disabled={isUpdating || !canAccept}
            onClick={(event) => {
              event.stopPropagation();
              onAction("accept");
            }}
            className="rounded-xl bg-teal-600 py-2 text-xs font-bold text-white"
          >
            <Check className="mr-1 inline h-3.5 w-3.5" />
            Aceptar
          </button>
        </div>
      )}
      {action && (
        <button
          disabled={isUpdating}
          onClick={(event) => {
            event.stopPropagation();
            onAction(action);
          }}
          className="mt-3 w-full rounded-xl bg-teal-600 py-2 text-xs font-bold text-white"
        >
          {isUpdating
            ? "Guardando..."
            : action === "mark-ready"
              ? "Marcar pedido listo"
              : "Confirmar entrega"}
        </button>
      )}
      {showPhoto && request.referencePhoto && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black p-4"
          onClick={() => setShowPhoto(false)}
        >
          <ImageWithFallback
            src={request.referencePhoto}
            alt="Foto de referencia"
            className="max-h-full w-full object-contain"
          />
        </div>
      )}
    </article>
  );
}
