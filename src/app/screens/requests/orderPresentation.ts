import type { BusinessRequest, DisplayOrderStatus, MyOrder, OrderAction, UpdateOrderStatusPayload } from './types';

const historyStatuses = new Set(['completed', 'rejected', 'cancelled']);

export function classifyCustomerOrders(orders: MyOrder[]) {
  const priority = { ready: 0, pending: 1, accepted: 2 } as const;
  const active = orders
    .filter((order) => order.recordState === 'available' && order.status in priority)
    .sort((a, b) => priority[a.status as keyof typeof priority] - priority[b.status as keyof typeof priority]);
  const history = orders.filter(
    (order) => order.recordState === 'available' && historyStatuses.has(order.status)
  );
  const unavailable = orders.filter((order) => order.recordState === 'unavailable');
  return { active, history, unavailable };
}

export function classifyBusinessOrders(orders: BusinessRequest[]) {
  return {
    pending: orders.filter((order) => order.status === 'pending'),
    preparing: orders.filter((order) => order.status === 'accepted'),
    ready: orders.filter((order) => order.status === 'ready'),
    history: orders.filter((order) => order.recordState === 'available' && historyStatuses.has(order.status)),
    unavailable: orders.filter((order) => order.recordState === 'unavailable')
  };
}

export const STATUS_LABELS: Record<DisplayOrderStatus, string> = {
  pending: 'En espera',
  accepted: 'Aceptado',
  ready: 'Listo',
  completed: 'Completado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  unavailable: 'Estado no disponible'
};

export const ORDER_ACTION_COPY: Record<OrderAction, {
  title: string;
  description: string;
  confirmLabel: string;
}> = {
  accept: {
    title: 'Aceptar pedido',
    description: 'Al aceptar, el pedido pasará a “En preparación” y podrás marcarlo como listo cuando corresponda.',
    confirmLabel: 'Aceptar pedido'
  },
  reject: {
    title: 'Rechazar pedido',
    description: 'El pedido será rechazado y pasará al historial. Esta acción no se puede deshacer.',
    confirmLabel: 'Rechazar pedido'
  },
  cancel: {
    title: 'Cancelar pedido',
    description: 'Selecciona el motivo de cancelación. El pedido pasará al historial y esta acción no se puede deshacer.',
    confirmLabel: 'Cancelar pedido'
  },
  'mark-ready': {
    title: 'Marcar pedido listo',
    description: 'Confirma que el pedido está preparado y listo para ser entregado al cliente.',
    confirmLabel: 'Marcar como listo'
  },
  'complete-reception': {
    title: 'Confirmar recepción',
    description: 'Confirma únicamente cuando hayas recibido tu pedido. Después de completar la entrega, no podrás cambiar su estado.',
    confirmLabel: 'Confirmar recepción'
  },
  'complete-delivery': {
    title: 'Confirmar entrega',
    description: 'Confirma que el pedido fue entregado al cliente. Después de completar la entrega, no podrás cambiar su estado.',
    confirmLabel: 'Confirmar entrega'
  }
};

export function actionToPayload(
  action: OrderAction,
  cancellationReason?: UpdateOrderStatusPayload['cancellationReason']
): UpdateOrderStatusPayload | null {
  if (action === 'accept') return { status: 'accepted' };
  if (action === 'reject') return { status: 'rejected' };
  if (action === 'mark-ready') return { status: 'ready' };
  if (action === 'complete-reception' || action === 'complete-delivery') return { status: 'completed' };
  return cancellationReason ? { status: 'cancelled', cancellationReason } : null;
}
