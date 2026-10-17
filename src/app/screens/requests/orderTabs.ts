import type { StatusView } from './requestStatusGrouping';

type Counts = { pending: number; coordination: number; waiting: number; active: number; ready: number };
type OrderTab = { key: StatusView; label: string; count: number };

// Presentation only: preserve the existing filter keys and legacy ready orders.
export function businessOrderTabs(counts: Counts, historyCount: number, hasReadyProcess = false): OrderTab[] {
  return [
    { key: 'pending', label: 'Pendientes', count: counts.pending },
    { key: 'coordination', label: 'Por coordinar', count: counts.coordination },
    { key: 'waiting', label: 'Esperando respuesta', count: counts.waiting },
    { key: 'active', label: 'En curso', count: counts.active },
    ...(counts.ready > 0 ? [{ key: 'ready' as const, label: hasReadyProcess ? 'Listos' : 'Listo y notificado', count: counts.ready }] : []),
    { key: 'history', label: 'Historial', count: historyCount },
  ];
}
