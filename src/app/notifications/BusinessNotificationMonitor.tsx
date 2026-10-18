import { useEffect, useRef } from "react";
import { normalizeOrderProcess, orderNotificationState, type RequestProcessSummary } from '../screens/requests/requestProcess';
import { createCustomerOrderNotices } from './orderNotice';
import { createNotificationRefreshQueue } from './notificationRefreshQueue';
import { presentationKey, readSystemPresentations, rememberOpenedPresentation } from './notificationDelivery';
import { API_BASE_URL } from "../api/apiConfig";
import { showAppToast } from "../screens/Toast";
import { updatePushPresence } from "./pushNotifications";
import {
  markInteractionUnread,
  publishActiveRequestCount,
  publishUnreadCount,
  type InteractionKind,
} from "./unreadInteractions";

const POLL_INTERVAL_MS = 15_000;
const PRESENCE_INTERVAL_MS = 5_000;
const STATUS_SNAPSHOT_KEY = "zipco-request-status-snapshot-v1";

type Interaction = {
  requestProcess?: RequestProcessSummary | null; requestProcessInvalid?: boolean;
  id: number;
  status: string;
  customerName?: string | null;
  itemNameSnapshot?: string;
};

type StatusSnapshot = {
  customerOrders: Array<[number, string]>;
  customerQuotes: Array<[number, string]>;
};

function readStatusSnapshot(): StatusSnapshot | null {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STATUS_SNAPSHOT_KEY) ?? "null",
    ) as Partial<StatusSnapshot> | null;
    if (
      !parsed ||
      !Array.isArray(parsed.customerOrders) ||
      !Array.isArray(parsed.customerQuotes)
    )
      return null;
    return {
      customerOrders: parsed.customerOrders,
      customerQuotes: parsed.customerQuotes,
    };
  } catch {
    return null;
  }
}

export function parseOrders(value: unknown): Interaction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (typeof candidate !== "object" || candidate === null) return [];
    const record = candidate as Record<string, unknown>;
    const id = Number(record.id);
    if (!Number.isInteger(id) || typeof record.status !== "string") return [];
    return [
      {
        id,
        status: record.status,
        ...(Object.prototype.hasOwnProperty.call(record, 'requestProcess') ? normalizeOrderProcess(record.requestProcess) : {}),
        customerName:
          typeof record.customerName === "string" ? record.customerName : null,
        ...(typeof record.itemNameSnapshot === "string"
          ? { itemNameSnapshot: record.itemNameSnapshot }
          : {}),
      },
    ];
  });
}

export const parseQuotes = parseOrders;

export function shouldAnnouncePendingOrders(
  hasBaseline: boolean,
  announceNewOrders: boolean,
) {
  return hasBaseline && announceNewOrders;
}

async function loadJson(
  path: string,
  token: string,
  onSessionExpired: () => void,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    onSessionExpired();
    throw new Error("session-expired");
  }
  if (!response.ok) throw new Error(`request-failed:${response.status}`);
  return response.json() as Promise<unknown>;
}

export default function BusinessNotificationMonitor({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}) {
  const orderStatuses = useRef(new Map<number, string>());
  const customerOrderStatuses = useRef(new Map<number, string>());
  const businessQuoteStatuses = useRef(new Map<number, string>());
  const customerQuoteStatuses = useRef(new Map<number, string>());
  const announcedKeys = useRef(new Set<string>());
  const hasBaseline = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("zipco-token");
    const businessId = localStorage.getItem("zipco-business-id");
    if (!token) {
      publishUnreadCount();
      return;
    }

    const storedSnapshot = readStatusSnapshot();
    if (storedSnapshot) {
      customerOrderStatuses.current = new Map(storedSnapshot.customerOrders);
      customerQuoteStatuses.current = new Map(storedSnapshot.customerQuotes);
      hasBaseline.current = true;
    }

    let stopped = false;
    let systemPresentations = new Set<string>();
    const reportPresence = (isForeground: boolean) => {
      void updatePushPresence(token, isForeground).catch(() => {
        // El siguiente heartbeat vuelve a intentar.
      });
    };
    const announce = (
      key: string,
      title: string,
      description: string,
      interaction?: { kind: InteractionKind; id: number },
      actionUrl?: string,
    ) => {
      if (announcedKeys.current.has(key)) return;
      announcedKeys.current.add(key);
      if (interaction) markInteractionUnread(interaction.kind, interaction.id);
      const presentedKey = actionUrl ? presentationKey(key, actionUrl) : null;
      if (presentedKey && systemPresentations.has(presentedKey)) return;
      showAppToast("", "info", {
        title,
        description,
        dedupeKey: key,
        durationMs: 10000,
        icon: "bell",
        actionUrl,
      });
    };

    const customerNotices = createCustomerOrderNotices((key, [title, description], orderId) => {
      announce(key, title, description, { kind: 'order', id: orderId },
        `/?open=requests-customer&orderId=${orderId}`);
    });
    const load = createNotificationRefreshQueue(async ({ pushedOrderIds }) => {
      if (stopped || document.visibilityState !== "visible") return false;
      try {
        const [
          ordersValue,
          customerOrdersValue,
          businessQuotesValue,
          customerQuotesValue,
        ] = await Promise.all([
          businessId
            ? loadJson(
                `/orders/business/${businessId}`,
                token,
                onSessionExpired,
              )
            : Promise.resolve([]),
          loadJson("/orders/my-orders", token, onSessionExpired),
          businessId
            ? loadJson(
                `/quotes/business/${businessId}`,
                token,
                onSessionExpired,
              )
            : Promise.resolve([]),
          loadJson("/quotes/my-quotes", token, onSessionExpired),
        ]);
        if (stopped) return false;
        systemPresentations = await readSystemPresentations();
        if (stopped) return false;
        const orders = parseOrders(ordersValue);
        const customerOrders = parseOrders(customerOrdersValue);
        const businessQuotes = parseQuotes(businessQuotesValue);
        const customerQuotes = parseQuotes(customerQuotesValue);
        const activeOrderStatuses = new Set([
          "pending",
          "alternative_proposed",
          "accepted",
          "ready",
        ]);
        const activeQuoteStatuses = new Set([
          "requested",
          "quoted",
          "alternative_proposed",
          "accepted",
          "ready",
        ]);
        publishActiveRequestCount(
          orders.filter((record) => activeOrderStatuses.has(record.status))
            .length +
            customerOrders.filter((record) =>
              activeOrderStatuses.has(record.status),
            ).length +
            businessQuotes.filter((record) =>
              activeQuoteStatuses.has(record.status),
            ).length +
            customerQuotes.filter((record) =>
              activeQuoteStatuses.has(record.status),
            ).length,
        );

        if (hasBaseline.current) {
          orders
            .filter(
              (order) =>
                order.status === "pending" &&
                !orderStatuses.current.has(order.id),
            )
            .forEach((order) =>
              announce(
                `order-${order.id}-created`,
                "Nuevo pedido recibido",
                `${order.customerName || "Un cliente"} envio una nueva solicitud.`,
                { kind: "order", id: order.id },
                `/?open=requests-business&orderId=${order.id}`,
              ),
            );
          orders.forEach((order) => {
            const previous = orderStatuses.current.get(order.id);
            if (
              previous !== "alternative_proposed" ||
              !["accepted", "rejected"].includes(order.status)
            )
              return;
            announce(
              `order-${order.id}-${order.status}`,
              order.status === "accepted"
                ? "Alternativa aceptada"
                : "Alternativa rechazada",
              `El cliente ${order.status === "accepted" ? "aceptó" : "rechazó"} la alternativa propuesta.`,
              { kind: "order", id: order.id },
              `/?open=requests-business&orderId=${order.id}`,
            );
          });
          businessQuotes.forEach((quote) => {
            const previous = businessQuoteStatuses.current.get(quote.id);
            if (!previous && quote.status === "requested") {
              announce(
                `quote-${quote.id}-created`,
                "Nueva cotizacion recibida",
                `${quote.customerName || "Un cliente"} solicito ${quote.itemNameSnapshot || "una cotizacion"}.`,
                { kind: "quote", id: quote.id },
                `/?open=requests-business-quotes&quoteId=${quote.id}`,
              );
            } else if (
              previous &&
              previous !== quote.status &&
              ["accepted", "declined", "cancelled", "completed"].includes(
                quote.status,
              )
            ) {
              const labels = {
                accepted: "aceptó",
                declined: "rechazó",
                cancelled: "canceló",
                completed: "confirmó como completada",
              } as const;
              const titles = {
                accepted: "Cotización aceptada",
                declined: "Cotización rechazada",
                cancelled: "Cotización cancelada",
                completed: "Cotización completada",
              } as const;
              const status = quote.status as keyof typeof labels;
              announce(
                `quote-${quote.id}-${status}`,
                titles[status],
                `El cliente ${labels[status]} la cotizacion.`,
                { kind: "quote", id: quote.id },
                `/?open=requests-business-quotes&quoteId=${quote.id}`,
              );
            }
          });
          customerQuotes.forEach((quote) => {
            const previous = customerQuoteStatuses.current.get(quote.id);
            if (
              previous === "requested" &&
              (quote.status === "quoted" ||
                quote.status === "alternative_proposed")
            ) {
              announce(
                `quote-${quote.id}-${quote.status === "alternative_proposed" ? "alternative" : "responded"}`,
                quote.status === "alternative_proposed"
                  ? "Nueva alternativa del negocio"
                  : "Respondieron tu cotización",
                quote.status === "alternative_proposed"
                  ? `El negocio propuso otra opción para ${quote.itemNameSnapshot || "tu solicitud"}.`
                  : `Recibiste un precio para ${quote.itemNameSnapshot || "tu solicitud"}.`,
                { kind: "quote", id: quote.id },
                `/?open=requests-customer-quotes&quoteId=${quote.id}`,
              );
            } else if (previous === "accepted" && quote.status === "ready") {
              announce(
                `quote-${quote.id}-ready`,
                "Servicio realizado",
                `El negocio marcó ${quote.itemNameSnapshot || "tu servicio"} como realizado. Confirma cuando lo hayas recibido conforme.`,
                { kind: "quote", id: quote.id },
                `/?open=requests-customer-quotes&quoteId=${quote.id}`,
              );
            }
          });
        }

        customerNotices(customerOrders, customerOrderStatuses.current, hasBaseline.current, pushedOrderIds);
        publishUnreadCount();
        window.dispatchEvent(new CustomEvent("zipco-requests-refresh"));
        orderStatuses.current = new Map(
          orders.map((order) => [order.id, order.status]),
        );
        customerOrderStatuses.current = new Map(
          customerOrders.map((order) => [order.id, orderNotificationState(order)]),
        );
        businessQuoteStatuses.current = new Map(
          businessQuotes.map((quote) => [quote.id, quote.status]),
        );
        customerQuoteStatuses.current = new Map(
          customerQuotes.map((quote) => [quote.id, quote.status]),
        );
        localStorage.setItem(
          STATUS_SNAPSHOT_KEY,
          JSON.stringify({
            customerOrders: [...customerOrderStatuses.current],
            customerQuotes: [...customerQuoteStatuses.current],
          } satisfies StatusSnapshot),
        );
        hasBaseline.current = true;
        return true;
      } catch {
        // El siguiente ciclo vuelve a intentar sin interrumpir la experiencia.
        return false;
      }
    });

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED' && typeof event.data.eventKey === 'string') {
        rememberOpenedPresentation(event.data.eventKey);
      }
      void load(false, event.data);
    };
    const handleVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      reportPresence(isVisible);
      if (isVisible) void load();
    };
    const handlePageHide = () => reportPresence(false);

    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    reportPresence(true);
    // Destinations are recovered by App, never inferred from a changed status
    // which might belong to an order other than the one explicitly opened.
    void load();
    const interval = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const presenceInterval = window.setInterval(
      () => reportPresence(document.visibilityState === "visible"),
      PRESENCE_INTERVAL_MS,
    );
    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.clearInterval(presenceInterval);
      reportPresence(false);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, [onSessionExpired]);

  return null;
}
