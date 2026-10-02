import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Image as ImageIcon,
  MessageCircle,
  MousePointerClick,
  PackageCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
  onProposeAlternative?: () => void;
  isUnread?: boolean;
  onOpen?: () => void;
  expanded?: boolean;
  onToggle?: () => void;
};

export default function BusinessOrderCard({
  request,
  isUpdating,
  onAction,
  onRetry,
  onProposeAlternative,
  isUnread = false,
  onOpen,
  expanded = false,
  onToggle,
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
  const price = request.alternativePriceClp ?? request.total;
  const statusLabel =
    request.status === "pending"
      ? "Nuevo pedido"
      : request.status === "alternative_proposed"
        ? "Alternativa enviada"
        : request.status === "accepted"
          ? "Pedido aceptado"
          : request.status === "ready"
            ? "Cliente notificado"
            : request.status === "completed"
              ? "Completado"
              : request.status === "rejected"
                ? "Rechazado"
                : "Cancelado";
  const tone =
    request.status === "pending"
      ? {
          badge: "bg-orange-50 text-orange-700",
          panel:
            "border-orange-200 from-amber-50 via-orange-50 to-orange-100/70",
          accent: "text-orange-700",
        }
      : request.status === "accepted"
        ? {
            badge: "bg-emerald-50 text-emerald-700",
            panel:
              "border-emerald-200 from-emerald-50 via-teal-50 to-emerald-100/70",
            accent: "text-emerald-700",
          }
        : request.status === "ready"
          ? {
              badge: "bg-teal-50 text-teal-700",
              panel: "border-teal-200 from-cyan-50 via-teal-50 to-teal-100/70",
              accent: "text-teal-700",
            }
          : {
              badge: "bg-violet-50 text-violet-700",
              panel:
                "border-violet-200 from-violet-50 via-fuchsia-50 to-violet-100/70",
              accent: "text-violet-700",
            };
  const handleOpen = (element: HTMLElement) => {
    element.classList.remove("zipco-notification-target");
    onOpen?.();
  };

  return (
    <article
      id={`order-${request.id}`}
      onClick={(event) => {
        handleOpen(event.currentTarget);
        onToggle?.();
      }}
      className={`zipco-provider-card scroll-mb-36 rounded-[22px] border p-3 transition-colors ${isUnread ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-200"}`}
    >
      <div className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-start gap-2.5">
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
              className="h-[62px] w-[62px] rounded-[14px] object-cover"
            />
          </button>
        ) : (
          <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
            <ImageIcon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-[15px] font-black leading-[18px] text-slate-950">
              {request.customerName || "Cliente"}
            </h4>
            {isUnread && (
              <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                Nueva
              </span>
            )}
          </div>
          {request.products.state === "available" ? (
            request.products.items.slice(0, 2).map((product, index) => (
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
        </div>
        <span
          className={`inline-flex max-w-[98px] items-center justify-center gap-1 rounded-full px-2 py-1.5 text-center text-[10px] font-black leading-tight ${tone.badge}`}
        >
          {request.status === "pending" && (
            <PackageCheck className="zipco-attention-bell h-3.5 w-3.5 shrink-0" />
          )}
          {statusLabel}
        </span>
      </div>
      {schedule && (
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{schedule}</span>
        </p>
      )}

      <AnimatePresence initial={false} mode="wait">
        {!expanded ? (
          <motion.button
            key="business-order-collapsed"
            type="button"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onClick={(event) => {
              event.stopPropagation();
              handleOpen(event.currentTarget.closest("article") as HTMLElement);
              onToggle?.();
            }}
            className={`mt-2.5 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[15px] border bg-gradient-to-r px-3 py-2 text-left ${tone.panel}`}
          >
            <span className="min-w-0">
              <span
                className={`block text-[9px] font-black uppercase tracking-[0.15em] ${tone.accent}`}
              >
                {request.status === "pending"
                  ? "Pedido del cliente"
                  : request.status === "ready"
                    ? "Pedido preparado"
                    : "Seguimiento del pedido"}
              </span>
              <span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">
                <MousePointerClick className="h-3.5 w-3.5" />
                Toca para abrir
              </span>
            </span>
            {price !== null && (
              <span className="whitespace-nowrap text-lg font-black text-teal-800">
                ${price.toLocaleString("es-CL")}
              </span>
            )}
            <ChevronDown className={`h-5 w-5 ${tone.accent}`} />
          </motion.button>
        ) : (
          <motion.div
            key="business-order-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-3 rounded-[16px] border bg-gradient-to-br p-3 ${tone.panel}`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className={`h-4 w-4 ${tone.accent}`} />
                <p
                  className={`text-[9px] font-black uppercase tracking-[0.16em] ${tone.accent}`}
                >
                  {request.status === "pending"
                    ? "Detalle del nuevo pedido"
                    : request.status === "ready"
                      ? "Pedido listo"
                      : "Detalle del pedido"}
                </p>
              </div>
              {request.products.state === "available" && (
                <div className="mt-2 space-y-1">
                  {request.products.items.map((product, index) => (
                    <div
                      key={`${product.name}-${index}`}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <span className="min-w-0 font-semibold text-slate-800">
                        <strong>{product.quantity}x</strong> {product.name}
                      </span>
                      <span className="shrink-0 font-black text-teal-800">
                        $
                        {(product.price * product.quantity).toLocaleString(
                          "es-CL",
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {request.note && (
                <p className="mt-2 flex items-start gap-1.5 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />“
                  {request.note}”
                </p>
              )}
              {request.alternativeMessage && (
                <div className="mt-2 border-t border-black/5 pt-2 text-xs text-slate-600">
                  <p className="font-black text-slate-800">
                    Alternativa enviada
                  </p>
                  <p className="mt-1">{request.alternativeMessage}</p>
                  {request.alternativeItem && (
                    <p className="mt-1">
                      Opción: {request.alternativeItem}
                      {request.alternativeQuantity
                        ? ` · Cantidad ${request.alternativeQuantity}`
                        : ""}
                    </p>
                  )}
                </div>
              )}
              {price !== null && (
                <div className="mt-2 flex items-end justify-between border-t border-black/5 pt-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">
                    Precio total
                  </span>
                  <span className="text-xl font-black text-teal-800">
                    ${price.toLocaleString("es-CL")}
                  </span>
                </div>
              )}
            </div>
            {request.status === "pending" && (
              <div className="mt-3 grid gap-2">
                <button
                  disabled={isUpdating || !canAccept}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("accept");
                  }}
                  className="zipco-proposal-accept flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-emerald-300 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(16,185,129,0.22)] disabled:opacity-50"
                >
                  <Check className="zipco-accept-icon h-4 w-4" />
                  Aceptar pedido
                  {price === null
                    ? ""
                    : ` por $${price.toLocaleString("es-CL")}`}
                </button>
                <button
                  disabled={isUpdating}
                  onClick={(event) => {
                    event.stopPropagation();
                    onProposeAlternative?.();
                  }}
                  className="rounded-[16px] border border-violet-200 bg-violet-50 py-2.5 text-xs font-black text-violet-700"
                >
                  Proponer alternativa
                </button>
                <button
                  disabled={isUpdating}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("reject");
                  }}
                  className="rounded-[16px] border border-red-200 bg-white py-2.5 text-xs font-bold text-red-600"
                >
                  <X className="mr-1 inline h-3.5 w-3.5" />
                  Rechazar pedido
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
                className="zipco-confirm-action mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] border-2 border-amber-300 bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-black text-white"
              >
                <Bell className="zipco-attention-bell h-4 w-4" />
                {isUpdating
                  ? "Guardando..."
                  : action === "mark-ready"
                    ? "Marcar pedido listo"
                    : "Confirmar entrega"}
              </button>
            )}
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
