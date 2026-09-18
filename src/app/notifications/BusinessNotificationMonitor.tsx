import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
import { showAppToast } from '../screens/Toast';

const POLL_INTERVAL_MS = 15_000;
const COUNT_EVENT = 'zipco-pending-business-orders';

type MinimalOrder = { id: number; status: string; customerName?: string | null };

export function parseOrders(value: unknown): MinimalOrder[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (typeof candidate !== 'object' || candidate === null) return [];
    const order = candidate as Record<string, unknown>;
    const id = Number(order.id);
    if (!Number.isInteger(id) || typeof order.status !== 'string') return [];
    return [{
      id,
      status: order.status,
      customerName: typeof order.customerName === 'string' ? order.customerName : null
    }];
  });
}

function publishPendingCount(count: number) {
  localStorage.setItem('zipco-pending-business-orders', String(count));
  window.dispatchEvent(new CustomEvent(COUNT_EVENT, { detail: count }));
}

export default function BusinessNotificationMonitor({ onSessionExpired }: { onSessionExpired: () => void }) {
  const seenOrderIds = useRef(new Set<number>());
  const hasBaseline = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('zipco-token');
    const businessId = localStorage.getItem('zipco-business-id');
    if (!token || !businessId) {
      publishPendingCount(0);
      return;
    }

    let stopped = false;
    const announce = (order: MinimalOrder) => {
      if (seenOrderIds.current.has(order.id)) return;
      seenOrderIds.current.add(order.id);
      showAppToast('', 'info', {
        title: 'Nuevo pedido recibido',
        description: `${order.customerName || 'Un cliente'} envio una nueva solicitud.`,
        dedupeKey: `new-order:${order.id}`,
        durationMs: 7000,
        icon: 'bell'
      });
    };

    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch(`${API_BASE_URL}/orders/business/${businessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        if (!response.ok) return;
        const orders = parseOrders(await response.json());
        if (stopped) return;
        const pending = orders.filter((order) => order.status === 'pending');
        publishPendingCount(pending.length);
        if (hasBaseline.current) pending.forEach(announce);
        orders.forEach((order) => seenOrderIds.current.add(order.id));
        hasBaseline.current = true;
      } catch {
        // El siguiente ciclo vuelve a intentar sin interrumpir la experiencia.
      }
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null;
      if (!data || data.type !== 'new-order') return;
      const id = Number(data.orderId);
      if (!Number.isInteger(id)) return;
      announce({ id, status: 'pending', customerName: typeof data.customerName === 'string' ? data.customerName : null });
      void load();
    };
    const handleVisibility = () => { if (document.visibilityState === 'visible') void load(); };

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
