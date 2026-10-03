import { useState } from "react";
import {
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Minus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import type { QuoteRequest } from "../quotes/quoteApi";
import type { BusinessRequest, MyOrder } from "./types";
import {
  interactionKey,
  useUnreadInteractions,
  type InteractionKind,
} from "../../notifications/unreadInteractions";

type HistoryItem = {
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

const reasonLabels = {
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

const statusPresentation = {
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

const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

function formatDate(value: string | null) {
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

function normalizeOrder(
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

function normalizeQuote(
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

export function OrderHistoryList({
  orders,
  owner,
  deleted,
  onArchive,
  onDelete,
}: {
  orders: Array<MyOrder | BusinessRequest>;
  owner: "customer" | "business";
  deleted: boolean;
  onArchive: (id: number, archived: boolean) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <CompactHistoryList
      items={orders.map((order) => normalizeOrder(order, owner))}
      deleted={deleted}
      onArchive={onArchive}
      onDelete={onDelete}
    />
  );
}

export function QuoteHistoryList({
  quotes,
  owner,
  deleted,
  onArchive,
  onDelete,
}: {
  quotes: QuoteRequest[];
  owner: "customer" | "business";
  deleted: boolean;
  onArchive: (quote: QuoteRequest, archived: boolean) => void;
  onDelete?: (quote: QuoteRequest) => void;
}) {
  const byId = new Map(quotes.map((quote) => [quote.id, quote]));
  return (
    <CompactHistoryList
      items={quotes.map((quote) => normalizeQuote(quote, owner))}
      deleted={deleted}
      onArchive={(id, archived) => {
        const quote = byId.get(id);
        if (quote) onArchive(quote, archived);
      }}
      onDelete={(id) => {
        const quote = byId.get(id);
        if (quote) onDelete?.(quote);
      }}
    />
  );
}

function CompactHistoryList({
  items,
  deleted,
  onArchive,
  onDelete,
}: {
  items: HistoryItem[];
  deleted: boolean;
  onArchive: (id: number, archived: boolean) => void;
  onDelete?: (id: number) => void;
}) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [pendingArchive, setPendingArchive] = useState<HistoryItem | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<HistoryItem | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkAction, setBulkAction] = useState<
    "archive" | "restore" | "delete" | null
  >(null);
  const [swipedKey, setSwipedKey] = useState<string | null>(null);
  const { unread, markRead } = useUnreadInteractions();
  return (
    <>
      {items.length > 0 && (
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={selectedKeys.size === items.length}
                onChange={(event) =>
                  setSelectedKeys(
                    event.target.checked
                      ? new Set(items.map((item) => item.key))
                      : new Set(),
                  )
                }
              />
              Seleccionar todo
            </label>
            {selectedKeys.size > 0 && (
              <div className="flex gap-1">
                {deleted ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setBulkAction("restore")}
                      className="rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] font-black text-emerald-700"
                    >
                      Restaurar ({selectedKeys.size})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAction("delete")}
                      className="rounded-lg bg-red-50 px-2 py-1.5 text-[10px] font-black text-red-600"
                    >
                      Definitivo ({selectedKeys.size})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBulkAction("archive")}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-black text-red-600"
                  >
                    Mover {selectedKeys.size} a Eliminados
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const presentation = statusPresentation[item.status];
          const StatusIcon = presentation.icon;
          const isUnread = unread.has(interactionKey(item.kind, item.id));
          const isSwiped = swipedKey === item.key;
          return (
            <div key={item.key} className="relative">
              {(index === 0 || items[index - 1].date !== item.date) && (
                <div className="mb-2 flex items-center gap-2 pt-1 text-xs font-bold text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  <span>{item.date}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <div className="relative overflow-hidden rounded-2xl">
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${item.title}`}
                  checked={selectedKeys.has(item.key)}
                  onChange={(event) =>
                    setSelectedKeys((current) => {
                      const next = new Set(current);
                      event.target.checked
                        ? next.add(item.key)
                        : next.delete(item.key);
                      return next;
                    })
                  }
                  className="absolute left-2 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 accent-teal-600"
                />
                <div className="absolute inset-y-0 right-0 flex">
                  {deleted && (
                    <button
                      type="button"
                      onClick={() => setPendingArchive(item)}
                      className="flex w-24 flex-col items-center justify-center gap-1 bg-emerald-600 text-xs font-black text-white"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Restaurar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      deleted ? setPendingDelete(item) : setPendingArchive(item)
                    }
                    className="flex w-24 flex-col items-center justify-center gap-1 bg-red-500 text-xs font-black text-white"
                  >
                    <Trash2 className="h-5 w-5" />
                    {deleted ? "Definitivo" : "Eliminar"}
                  </button>
                </div>
                <motion.button
                  id={`${item.kind}-${item.id}`}
                  type="button"
                  drag="x"
                  dragConstraints={{ left: deleted ? -192 : -96, right: 0 }}
                  dragElastic={0.08}
                  animate={{ x: isSwiped ? (deleted ? -192 : -96) : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  onDragEnd={(_, info) =>
                    setSwipedKey(info.offset.x < -45 ? item.key : null)
                  }
                  onClick={(event) => {
                    if (isSwiped) {
                      setSwipedKey(null);
                    } else {
                      event.currentTarget.classList.remove(
                        "zipco-notification-target",
                      );
                      markRead(item.kind, item.id);
                    }
                  }}
                  className={`relative grid min-h-[76px] w-full grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border py-2.5 pl-8 pr-2.5 text-left shadow-sm transition-colors ${isUnread ? "border-cyan-400 bg-cyan-50 ring-1 ring-cyan-200 dark:border-cyan-400/80 dark:bg-cyan-950/35 dark:ring-cyan-500/30" : "border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                >
                  {item.image ? (
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <ImageIcon className="h-6 w-6" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                      {isUnread && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-sky-500"
                          aria-label="Nueva"
                        />
                      )}
                    </span>
                    <span className="mt-1 block text-sm font-black text-emerald-700">
                      {item.price === null
                        ? "—"
                        : `${item.priceIsStarting ? "Desde " : ""}${money(item.price)}`}
                    </span>
                  </span>
                  <span className="flex min-w-[108px] items-center justify-end gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${presentation.classes}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {item.statusLabel ?? presentation.label}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Abrir detalle"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.currentTarget
                          .closest(".zipco-notification-target")
                          ?.classList.remove("zipco-notification-target");
                        markRead(item.kind, item.id);
                        setSelected(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          event.currentTarget
                            .closest(".zipco-notification-target")
                            ?.classList.remove("zipco-notification-target");
                          markRead(item.kind, item.id);
                          setSelected(item);
                        }
                      }}
                    >
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    </span>
                  </span>
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
      {bulkAction && (
        <div className="absolute inset-0 z-[70] flex items-end bg-slate-950/45 p-3 sm:items-center">
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="text-center text-lg font-black">
              {bulkAction === "archive"
                ? "Mover a Eliminados"
                : bulkAction === "restore"
                  ? "Restaurar solicitudes"
                  : "Eliminar definitivamente"}
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600">
              {bulkAction === "delete"
                ? `Eliminarás definitivamente ${selectedKeys.size} solicitudes. Esta acción no se puede deshacer.`
                : `${bulkAction === "restore" ? "Restaurarás" : "Moverás"} ${selectedKeys.size} solicitudes seleccionadas.`}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setBulkAction(null)}
                className="rounded-xl border py-3 text-sm font-bold"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  items
                    .filter((item) => selectedKeys.has(item.key))
                    .forEach((item) =>
                      bulkAction === "delete"
                        ? onDelete?.(item.id)
                        : onArchive(item.id, bulkAction === "archive"),
                    );
                  setSelectedKeys(new Set());
                  setBulkAction(null);
                }}
                className={`rounded-xl py-3 text-sm font-bold text-white ${bulkAction === "restore" ? "bg-emerald-600" : "bg-red-500"}`}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingArchive && (
        <div className="absolute inset-0 z-[60] flex items-end bg-slate-950/45 p-3 sm:items-center">
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${deleted ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
            >
              {deleted ? (
                <RotateCcw className="h-7 w-7" />
              ) : (
                <Trash2 className="h-7 w-7" />
              )}
            </div>
            <h3 className="mt-4 text-center text-lg font-black text-slate-900">
              {deleted ? "Restaurar solicitud" : "Mover a Eliminados"}
            </h3>
            <p className="mt-2 text-center text-sm leading-5 text-slate-600">
              {deleted
                ? "¿Deseas restaurar esta solicitud para que vuelva al historial?"
                : "¿Deseas mover esta solicitud a Eliminados? Podrás restaurarla después."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingArchive(null)}
                className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onArchive(pendingArchive.id, !deleted);
                  setPendingArchive(null);
                }}
                className={`rounded-xl py-3 text-sm font-bold text-white ${deleted ? "bg-emerald-600" : "bg-red-500"}`}
              >
                {deleted ? "Restaurar" : "Mover"}
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingDelete && (
        <div className="absolute inset-0 z-[70] flex items-end bg-slate-950/45 p-3 sm:items-center">
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <Trash2 className="mx-auto h-12 w-12 rounded-full bg-red-50 p-3 text-red-500" />
            <h3 className="mt-4 text-center text-lg font-black">
              Eliminar definitivamente
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600">
              Esta solicitud dejará de aparecer en tu cuenta y no podrás
              restaurarla. La otra persona conservará su propio registro.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border py-3 text-sm font-bold"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  onDelete?.(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="rounded-xl bg-red-500 py-3 text-sm font-bold text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
                  Detalle del historial
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {selected.title}
                </h3>
                <p className="text-sm text-slate-500">{selected.subtitle}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-slate-100 p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusPresentation[selected.status].classes}`}
              >
                {selected.statusLabel ??
                  statusPresentation[selected.status].label}
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                {selected.date}
              </p>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Entrega o atención
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selected.schedule}
                </p>
              </div>
              {selected.details.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Detalle
                  </p>
                  {selected.details.map((detail, index) => (
                    <p
                      key={`${detail}-${index}`}
                      className="mt-1 text-sm text-slate-700"
                    >
                      {detail}
                    </p>
                  ))}
                </div>
              )}
              {selected.note && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Nota del cliente
                  </p>
                  <p className="mt-1 rounded-xl bg-white p-3 text-sm italic text-slate-700">
                    “{selected.note}”
                  </p>
                </div>
              )}
              {selected.response && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Respuesta del proveedor
                  </p>
                  <p className="mt-1 rounded-xl bg-white p-3 text-sm text-slate-700">
                    {selected.response}
                  </p>
                </div>
              )}
              {selected.reason && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Motivo
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selected.reason}
                  </p>
                </div>
              )}
              {selected.referencePhoto && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Foto de referencia
                  </p>
                  <ImageWithFallback
                    src={selected.referencePhoto}
                    alt="Foto de referencia"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                </div>
              )}
              <p className="pt-1 text-xl font-black text-emerald-600">
                {selected.price === null
                  ? "Precio no disponible"
                  : `${selected.priceIsStarting ? "Desde " : ""}${money(selected.price)}`}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-bold text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
