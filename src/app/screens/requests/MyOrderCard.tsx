import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
  const [showAgreementDetails, setShowAgreementDetails] = useState(false);
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
  const hasConfirmedAlternative =
    Boolean(order.alternativeMessage) &&
    order.status !== "alternative_proposed";
  const effectiveTotal =
    hasConfirmedAlternative && order.alternativePriceClp
      ? order.alternativePriceClp
      : order.total;
  return (
    <article
      id={`order-${order.id}`}
      onClick={(event) => {
        event.currentTarget.classList.remove("zipco-notification-target");
        onOpen?.();
      }}
      className={`zipco-customer-order-card zipco-order-${order.status} scroll-mb-36 rounded-2xl border p-3 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${isUnread ? "border-sky-400 bg-sky-100 ring-2 ring-sky-200" : "border-slate-200 bg-gradient-to-br from-white to-slate-50"}`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3">
        <ImageWithFallback
          src={order.businessImage}
          alt={order.businessName}
          className="h-[72px] w-[72px] rounded-xl object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-black leading-tight text-slate-950">
              {order.businessName}
            </h4>
            <span className="shrink-0 whitespace-nowrap text-base font-black text-emerald-600">
              {effectiveTotal === null
                ? "—"
                : `$${effectiveTotal.toLocaleString("es-CL")}`}
            </span>
          </div>
          {order.products.state === "available" ? (
            order.products.items.map((product, index) => (
              <p
                key={`${product.name}-${index}`}
                className="line-clamp-2 text-xs leading-4 text-slate-700"
              >
                <strong>{product.quantity}x</strong> {product.name}
              </p>
            ))
          ) : (
            <p className="text-xs text-red-600">Producto no disponible</p>
          )}
          {isUnread && (
            <span className="mt-1 inline-flex rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-black text-white">
              Nueva
            </span>
          )}
          {schedule && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-800">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-normal leading-tight">
                {schedule}
              </span>
            </p>
          )}
          {order.note && (
            <p className="mt-1 flex items-start gap-1.5 whitespace-pre-wrap break-words text-[11px] italic leading-4 text-slate-500">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />“{order.note}”
            </p>
          )}
        </div>
        <div className="col-span-2 mt-1 flex items-center">
          <OrderStatusBadge status={order.status} />
          <span className="hidden whitespace-nowrap text-base font-black text-emerald-600">
            {effectiveTotal === null
              ? "—"
              : `$${effectiveTotal.toLocaleString("es-CL")}`}
          </span>
        </div>
      </div>
      {order.status === "accepted" && (
        <div className="mt-3 rounded-2xl border border-cyan-300/55 bg-gradient-to-r from-cyan-50 via-sky-50 to-teal-50 p-3 dark:from-cyan-950/50 dark:via-slate-900 dark:to-teal-950/40">
          <p className="flex items-center justify-between text-xs font-black text-cyan-700 dark:text-cyan-200">
            <span className="flex items-center gap-2">
              <PackageCheck className="zipco-ready-wave h-4 w-4" /> El negocio
              está preparando tu pedido
            </span>
            <ChevronRight className="h-4 w-4" />
          </p>
          <div className="mt-3 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-1 text-[9px] font-bold">
            <span className="rounded-full bg-emerald-500 px-2 py-1 text-white">
              Aceptado
            </span>
            <span className="h-px bg-cyan-300" />
            <span className="zipco-working-step rounded-full bg-cyan-500 px-2 py-1 text-white">
              Preparación
            </span>
            <span className="h-px bg-slate-300 dark:bg-slate-600" />
            <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              Listo
            </span>
          </div>
        </div>
      )}
      {order.alternativeMessage && (
        <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
          {hasConfirmedAlternative ? (
            <button
              type="button"
              aria-expanded={showAgreementDetails}
              onClick={(event) => {
                event.stopPropagation();
                setShowAgreementDetails((current) => !current);
              }}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="min-w-0 truncate font-bold">
                Acuerdo confirmado
                {order.alternativePriceClp
                  ? ` · $${order.alternativePriceClp.toLocaleString("es-CL")}`
                  : ""}
              </span>
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${showAgreementDetails ? "rotate-90" : ""}`}
              />
            </button>
          ) : (
            <p className="font-black">Alternativa del negocio</p>
          )}
          {(!hasConfirmedAlternative || showAgreementDetails) && (
            <div
              className={
                hasConfirmedAlternative
                  ? "mt-2 border-t border-teal-200 pt-2"
                  : ""
              }
            >
              <p>{order.alternativeMessage}</p>
              {order.alternativeItem && (
                <p>
                  Opción: {order.alternativeItem}
                  {order.alternativeQuantity
                    ? ` · Cantidad ${order.alternativeQuantity}`
                    : ""}
                </p>
              )}
              {order.alternativeDate && (
                <p>
                  Fecha: {order.alternativeDate}
                  {order.alternativeTime ? ` · ${order.alternativeTime}` : ""}
                </p>
              )}
              {order.alternativePriceClp && !hasConfirmedAlternative && (
                <p className="font-black">
                  ${order.alternativePriceClp.toLocaleString("es-CL")}
                </p>
              )}
              {order.alternativePhoto && (
                <ImageWithFallback
                  src={order.alternativePhoto}
                  alt="Referencia de la alternativa"
                  className="mt-2 h-32 w-full rounded-xl object-cover"
                />
              )}
            </div>
          )}
        </div>
      )}
      {order.status === "alternative_proposed" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              onAction("reject-alternative");
            }}
            className="zipco-proposal-reject flex items-center justify-center gap-1.5 rounded-xl border-2 border-red-300 bg-red-50 py-2 text-xs font-bold text-red-600"
          >
            <XCircle className="zipco-reject-icon h-4 w-4" />
            Rechazar propuesta
          </button>
          <button
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              onAction("accept-alternative");
            }}
            className="zipco-proposal-accept flex items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-300 bg-emerald-500 py-2 text-xs font-bold text-white"
          >
            <CheckCircle2 className="zipco-accept-icon h-4 w-4" />
            Aceptar propuesta
          </button>
        </div>
      )}
      {action && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={(event) => {
            event.stopPropagation();
            onAction(action);
          }}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold disabled:opacity-50 ${action === "complete-reception" ? "zipco-confirm-action border-2 border-amber-300 bg-gradient-to-r from-teal-600 to-emerald-500 text-white" : "border border-red-400/70 bg-red-950/10 text-red-500"}`}
        >
          {action === "complete-reception" && (
            <Bell className="zipco-attention-bell h-4 w-4" />
          )}
          {action === "cancel" && <XCircle className="h-4 w-4" />}
          {isUpdating
            ? "Guardando..."
            : action === "cancel"
              ? "Cancelar pedido"
              : "Confirmar pedido recibido conforme"}
        </button>
      )}
    </article>
  );
}
