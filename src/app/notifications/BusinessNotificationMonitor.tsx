import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
import { showAppToast } from '../screens/Toast';

const POLL_INTERVAL_MS = 15_000;
const COUNT_EVENT = 'zipco-pending-interactions';

type Interaction = {
  id: number;
  status: string;
  customerName?: string | null;
  itemNameSnapshot?: string;
};

export function parseOrders(value: unknown): Interaction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (typeof candidate !== 'object' || candidate === null) return [];
    const record = candidate as Record<string, unknown>;
    const id = Number(record.id);
    if (!Number.isInteger(id) || typeof record.status !== 'string') return [];
    return [{
      id,
      status: record.status,
      customerName: typeof record.customerName === 'string' ? record.customerName : null,
      ...(typeof record.itemNameSnapshot === 'string' ? { itemNameSnapshot: record.itemNameSnapshot } : {})
    }];
  });
}

export const parseQuotes = parseOrders;

export function shouldAnnouncePendingOrders(hasBaseline: boolean, announceNewOrders: boolean) {
  return hasBaseline && announceNewOrders;
}

function publishPendingCount(count: number) {
  localStorage.setItem('zipco-pending-interactions', String(count));
  localStorage.removeItem('zipco-pending-business-orders');
  window.dispatchEvent(new CustomEvent(COUNT_EVENT, { detail: count }));
}

async function loadJson(path: string, token: string, onSessionExpired: () => void) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 401) {
    onSessionExpired();
    throw new Error('session-expired');
  }
  if (!response.ok) throw new Error(`request-failed:${response.status}`);
  return response.json() as Promise<unknown>;
}

export default function BusinessNotificationMonitor({ onSessionExpired }: { onSessionExpired: () => void }) {
  const orderStatuses = useRef(new Map<number, string>());
  const businessQuoteStatuses = useRef(new Map<number, string>());
  const customerQuoteStatuses = useRef(new Map<number, string>());
  const announcedKeys = useRef(new Set<string>());
  const hasBaseline = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('zipco-token');
    const businessId = localStorage.getItem('zipco-business-id');
    if (!token) {
      publishPendingCount(0);
      return;
    }

    let stopped = false;
    const announce = (key: string, title: string, description: string) => {
      if (announcedKeys.current.has(key)) return;
      announcedKeys.current.add(key);
      showAppToast('', 'info', { title, description, dedupeKey: key, durationMs: 7000, icon: 'bell' });
    };

    const load = async (announceChanges = true) => {
      if (document.visibilityState !== 'visible') return;
      try {
        const [ordersValue, businessQuotesValue, customerQuotesValue] = await Promise.all([
          businessId ? loadJson(`/orders/business/${businessId}`, token, onSessionExpired) : Promise.resolve([]),
          businessId ? loadJson(`/quotes/business/${businessId}`, token, onSessionExpired) : Promise.resolve([]),
          loadJson('/quotes/my-quotes', token, onSessionExpired)
        ]);
        if (stopped) return;
        const orders = parseOrders(ordersValue);
        const businessQuotes = parseQuotes(businessQuotesValue);
        const customerQuotes = parseQuotes(customerQuotesValue);

        if (hasBaseline.current && announceChanges) {
          orders
            .filter((order) => order.status === 'pending' && !orderStatuses.current.has(order.id))
            .forEach((order) => announce(
              `order-${order.id}-created`,
              'Nuevo pedido recibido',
              `${order.customerName || 'Un cliente'} envio una nueva solicitud.`
            ));
          businessQuotes.forEach((quote) => {
            const previous = businessQuoteStatuses.current.get(quote.id);
            if (!previous && quote.status === 'requested') {
              announce(
                `quote-${quote.id}-created`,
                'Nueva cotizacion recibida',
                `${quote.customerName || 'Un cliente'} solicito ${quote.itemNameSnapshot || 'una cotizacion'}.`
              );
            } else if (previous && previous !== quote.status && ['accepted', 'declined', 'cancelled'].includes(quote.status)) {
              const labels = { accepted: 'acepto', declined: 'rechazo', cancelled: 'cancelo' } as const;
              const titles = { accepted: 'Cotizacion aceptada', declined: 'Cotizacion rechazada', cancelled: 'Cotizacion cancelada' } as const;
              const status = quote.status as keyof typeof labels;
              announce(`quote-${quote.id}-${status}`, titles[status], `El cliente ${labels[status]} la cotizacion.`);
            }
          });
          customerQuotes.forEach((quote) => {
            const previous = customerQuoteStatuses.current.get(quote.id);
            if (previous === 'requested' && quote.status === 'quoted') {
              announce(
                `quote-${quote.id}-responded`,
                'Respondieron tu cotizacion',
                `Recibiste un precio para ${quote.itemNameSnapshot || 'tu solicitud'}.`
              );
            }
          });
        }

        publishPendingCount(
          orders.filter((order) => order.status === 'pending').length
          + businessQuotes.filter((quote) => quote.status === 'requested').length
          + customerQuotes.filter((quote) => quote.status === 'quoted').length
        );
        orderStatuses.current = new Map(orders.map((order) => [order.id, order.status]));
        businessQuoteStatuses.current = new Map(businessQuotes.map((quote) => [quote.id, quote.status]));
        customerQuoteStatuses.current = new Map(customerQuotes.map((quote) => [quote.id, quote.status]));
        hasBaseline.current = true;
      } catch {
        // El siguiente ciclo vuelve a intentar sin interrumpir la experiencia.
      }
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null;
      if (!data || typeof data.type !== 'string') return;
      const key = typeof data.tag === 'string' ? data.tag : `${data.type}:${String(data.orderId ?? data.quoteId ?? '')}`;
      announce(
        key,
        typeof data.title === 'string' ? data.title : 'Nueva actividad en ZIPCO',
        typeof data.body === 'string' ? data.body : 'Revisa tus Solicitudes.'
      );
      void load(false);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void load(false);
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    document.addEventListener('visibilitychange', handleVisibility);
    void load();
    const interval = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [onSessionExpired]);

  return null;
}
