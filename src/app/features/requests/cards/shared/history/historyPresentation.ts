



import { hasRequestProcess } from "../../../domain/requestProcess";
import { Check, Minus, X } from "lucide-react";


import type { QuoteRequest } from "../../../../quotes/domain/quoteApi";
import type { BusinessRequest, MyOrder } from "../../../domain/types";
import { type InteractionKind } from "../../../../../notifications/unreadInteractions";
export type HistoryItem = {
  processOrder?: MyOrder | BusinessRequest;
  key: string;
  id: number;
  kind: InteractionKind;
  title: string;
  subtitle: string;
  date: string;
  image: string | null;
  status: "completed" | "cancelled" | "rejected";
  statusLabel?: string;
  price: number | null;
  priceIsStarting: boolean;
  details: string[];
  schedule: string;
  note: string;
  response: string;
  reason: string;
  referencePhoto: string | null;
};
export const reasonLabels = {
  no_longer_needed: "Ya no lo necesitaba.",
  business_took_too_long: "El negocio tardó demasiado.",
  selected_by_mistake: "Fue seleccionado por error.",
  requirements_changed: "Cambiaron las necesidades.",
  unavailable: "Producto o servicio no disponible.",
  cannot_meet_schedule: "No podía cumplir la fecha u horario solicitado.",
  outside_service_area: "Solicitud fuera de su zona de atención.",
  insufficient_information: "Información insuficiente para procesarla.",
  no_capacity: "Sin capacidad disponible.",
  sent_by_mistake: "La cotización fue enviada por error.",
  other: "Otro motivo.",
} as const;
export const statusPresentation = {
  completed: {
    label: "Completada",
    classes: "bg-emerald-50 text-emerald-600",
    icon: Check,
  },
  cancelled: { label: "Cancelada", classes: "bg-red-50 text-red-500", icon: X },
  rejected: {
    label: "Rechazada",
    classes: "bg-red-50 text-red-500",
    icon: Minus,
  },
} as const;
export const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
export function formatDate(value: string | null) {
  if (!value) return "Fecha no disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
export function normalizeOrder(
  order: MyOrder | BusinessRequest,
  owner: "customer" | "business",
): HistoryItem {
  const products =
    order.products.state === "available" ? order.products.items : [];
  const status =
    order.recordState === "available" && order.status === "completed"
      ? "completed"
      : order.recordState === "available" && order.status === "cancelled"
        ? "cancelled"
        : "rejected";
  const isCustomer = owner === "customer";
  const identity = isCustomer ? (order as MyOrder) : (order as BusinessRequest);
  return {
    key: order.clientKey,
    ...(hasRequestProcess(order) ? { processOrder: order } : {}),
    id: order.recordState === "available" ? order.id : 0,
    kind: "order",
    title: products.map((product) => product.name).join(", ") || "Pedido",
    subtitle: isCustomer
      ? (identity as MyOrder).businessName
      : (identity as BusinessRequest).customerName,
    date: order.date || formatDate(order.createdAt),
    image: isCustomer
      ? (identity as MyOrder).businessImage
      : (identity as BusinessRequest).customerImage,
    status,
    statusLabel: undefined,
    price: order.total,
    priceIsStarting: false,
    details: products.map(
      (product) =>
        `${product.quantity}x ${product.name} — ${money(product.price * product.quantity)}`,
    ),
    schedule: order.needNow
      ? isCustomer
        ? "Lo necesitabas ahora"
        : "Lo necesitaba ahora"
      : order.deliveryDate && order.deliveryTime
        ? `${order.deliveryDate} · ${order.deliveryTime}`
        : "Horario no disponible",
    note: order.note,
    response: "",
    reason:
      order.cancellationReasonDetail ||
      (order.cancellationReason && order.cancellationReason !== "unavailable"
        ? reasonLabels[order.cancellationReason]
        : ""),
    referencePhoto: order.referencePhoto,
  };
}
export function normalizeQuote(
  quote: QuoteRequest,
  owner: "customer" | "business",
): HistoryItem {
  return {
    key: `quote-${quote.id}`,
    id: quote.id,
    kind: "quote",
    title: quote.itemNameSnapshot,
    subtitle: owner === "business" ? quote.customerName : "Tu cotización",
    date: formatDate(quote.updatedAt || quote.createdAt),
    image: quote.referencePhoto,
    status:
      quote.status === "completed"
        ? "completed"
        : quote.status === "cancelled"
          ? "cancelled"
          : "rejected",
    statusLabel:
      quote.status === "declined" && quote.alternativeMessage
        ? "Alternativa rechazada"
        : undefined,
    price:
      quote.alternativePriceClp ??
      quote.quotedPriceClp ??
      quote.startingPriceClpSnapshot,
    priceIsStarting:
      quote.alternativePriceClp === null &&
      quote.quotedPriceClp === null &&
      quote.startingPriceClpSnapshot !== null,
    details: quote.alternativeMessage
      ? [
          `Alternativa propuesta${quote.alternativeItem ? `: ${quote.alternativeItem}` : ""}`,
          ...(quote.alternativeQuantity
            ? [`Cantidad: ${quote.alternativeQuantity}`]
            : []),
          ...(quote.alternativeDate
            ? [
                `Fecha y hora: ${quote.alternativeDate}${quote.alternativeTime ? ` · ${quote.alternativeTime}` : ""}`,
              ]
            : []),
          ...(quote.alternativePriceClp
            ? [`Precio alternativo: ${money(quote.alternativePriceClp)}`]
            : []),
        ]
      : [],
    schedule: quote.alternativeDate
      ? `${quote.alternativeDate}${quote.alternativeTime ? ` · ${quote.alternativeTime}` : ""}`
      : quote.needNow
        ? "Lo necesita ahora"
        : quote.requestedDate && quote.requestedTime
          ? `${quote.requestedDate} · ${quote.requestedTime}`
          : "Horario no disponible",
    note: quote.message,
    response: quote.alternativeMessage ?? quote.businessMessage ?? "",
    reason:
      quote.closureReasonDetail ||
      (quote.closureReason && quote.closureReason in reasonLabels
        ? reasonLabels[quote.closureReason as keyof typeof reasonLabels]
        : ""),
    referencePhoto: quote.referencePhoto,
  };
}
