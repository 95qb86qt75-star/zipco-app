import { COORDINATION_ACCEPTED_MESSAGE, hasRequestProcess, orderNotificationState, type ProcessOrder } from '../screens/requests/requestProcess';

export function customerOrderNotice(order: { status: string } & ProcessOrder): readonly [string, string] | null {
  if (hasRequestProcess(order)) {
    return order.requestProcess?.state === 'COORDINATION_PENDING'
      ? ['Pedido aceptado', COORDINATION_ACCEPTED_MESSAGE] : null;
  }
  const notices: Record<string, readonly [string, string]> = {
    alternative_proposed: ['Nueva alternativa del negocio', 'El negocio propuso otra opción para tu pedido.'],
    accepted: ['Pedido aceptado', 'El negocio acepto tu pedido.'],
    rejected: ['Pedido rechazado', 'El negocio rechazo tu pedido.'],
    ready: ['Tu pedido esta listo', 'El negocio marco tu pedido como listo.'],
    completed: ['Pedido completado', 'Tu pedido fue marcado como completado.'],
  };
  return notices[order.status] ?? null;
}

type NoticeOrder = { id: number; status: string } & ProcessOrder;
export function createCustomerOrderNotices(
  emit: (key: string, notice: readonly [string, string], orderId: number) => void,
) {
  const announced = new Set<string>();
  return (orders: NoticeOrder[], previous: ReadonlyMap<number, string>, hasBaseline: boolean, pushedOrderIds: ReadonlySet<number>) => {
    let firstNotifiedId: number | null = null;
    for (const order of orders) {
      const state = orderNotificationState(order);
      const changed = hasBaseline && previous.has(order.id) && previous.get(order.id) !== state;
      if (!changed && !pushedOrderIds.has(order.id)) continue;
      const notice = customerOrderNotice(order);
      const key = `order-${order.id}-${state}`;
      if (!notice || announced.has(key)) continue;
      announced.add(key);
      emit(key, notice, order.id);
      firstNotifiedId ??= order.id;
    }
    return firstNotifiedId;
  };
}
