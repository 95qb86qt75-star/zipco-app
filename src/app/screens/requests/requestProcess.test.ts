import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload, canSubmitOrderStatus } from './orderNormalization';
import { normalizeRequestProcess, processStatusLabel, orderNotificationState, COORDINATION_ACCEPTED_MESSAGE } from './requestProcess';
import { countStatusViews, filterByStatusView, statusViewFor } from './requestStatusGrouping';
import { getCustomerAttentionItems } from './requestAttentionSummary';
import { normalizeCreatedOrder } from '../createOrderApi';
import { pendingProcess, coordinationProcess, rawOrder } from './requestProcessFixtures';

afterEach(() => vi.restoreAllMocks());
describe('2A normalization and compatibility', () => {
  it('normalizes the optional acknowledgment without inventing it for historical receipts', () => {
    expect(normalizeRequestProcess(coordinationProcess)).not.toHaveProperty('readyNoticeAcknowledged');
    for (const readyNoticeAcknowledged of [true, false])
      expect(normalizeRequestProcess({ ...coordinationProcess, readyNoticeAcknowledged })?.readyNoticeAcknowledged).toBe(readyNoticeAcknowledged);
    for (const readyNoticeAcknowledged of [null, 1, 'true'])
      expect(normalizeRequestProcess({ ...coordinationProcess, readyNoticeAcknowledged })).toBeNull();
  });
  it('keeps acknowledged READY in Listos until explicit receipt completes it and retains legacy filters', () => {
    const base = { ...coordinationProcess, state: 'READY', readyNoticeAcknowledged: false };
    const acknowledged = { ...base, readyNoticeAcknowledged: true };
    expect(processStatusLabel({ requestProcess: base })).toBe('Pedido listo');
    expect(processStatusLabel({ requestProcess: acknowledged })).toBe('Pendiente de retiro');
    expect(statusViewFor('orders', 'ready', acknowledged)).toBe('ready');
    const completed = { ...acknowledged, state: 'COMPLETED' };
    expect(processStatusLabel({ requestProcess: completed })).toBe('Completado');
    expect(statusViewFor('orders', 'completed', completed)).toBe('history');
    expect(countStatusViews([{ status: 'ready', requestProcess: acknowledged }, { status: 'completed', requestProcess: completed }], 'orders'))
      .toMatchObject({ ready: 1, history: 1, active: 0 });
    expect(statusViewFor('orders', 'ready', null)).toBe('ready');
    expect(statusViewFor('orders', 'completed', null)).toBe('history');
  });
  it('keeps legacy orders and their allowed actions before backend publication', () => {
    const [order] = normalizeBusinessOrdersPayload([rawOrder]);
    expect(order.requestProcess).toBeUndefined();
    expect(canSubmitOrderStatus(order, 'business', 'accept')).toBe(true);
    expect(canSubmitOrderStatus(order, 'business', 'reject')).toBe(true);
    expect(canSubmitOrderStatus(order, 'customer', 'cancel')).toBe(true);
    expect(statusViewFor('orders', 'accepted')).toBe('active');
  });
  it('treats explicit null as legacy in lists, grouping, actions and notification state', () => {
    const [order] = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: null }]);
    expect(order.requestProcess).toBeNull();
    expect(order.dataIssues).not.toContain('requestProcess');
    expect(order.requestProcessInvalid).toBeUndefined();
    expect(canSubmitOrderStatus(order, 'business', 'accept')).toBe(true);
    expect(canSubmitOrderStatus(order, 'business', 'reject')).toBe(true);
    expect(canSubmitOrderStatus(order, 'customer', 'cancel')).toBe(true);
    expect(statusViewFor('orders', 'accepted', null)).toBe('active');
    expect(orderNotificationState({ ...order, status: 'accepted' })).toBe('accepted');
    expect(countStatusViews([{ ...order, status: 'accepted' }], 'orders').active).toBe(1);
  });
  it('keeps a validated optional process in list and creation responses', () => {
    expect(normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: pendingProcess }])[0].requestProcess).toEqual(pendingProcess);
    const created = normalizeCreatedOrder({ id: 20, total: 2000, requestProcess: pendingProcess,
      items: [{ id: 1, orderId: 20, catalogItemId: 5, nameSnapshot: 'Producto', quantity: 2, unitPriceClpSnapshot: 1000, subtotalClp: 2000 }] });
    expect(created.requestProcess).toEqual(pendingProcess);
  });
  it('removes customerPhone and never falls back to user.phone', () => {
    const [order] = normalizeBusinessOrdersPayload([{ ...rawOrder, customerPhone: 'test', user: { phone: 'test' } }]);
    expect(order).not.toHaveProperty('customerPhone');
    expect(order.dataIssues).not.toContain('customerPhone');
  });
  it.each([{}, { ...pendingProcess, id: '7' }, { ...pendingProcess, version: -1 },
    { ...pendingProcess, allowedActions: ['UNKNOWN'] }, { ...pendingProcess, agreementPublicId: 4 }])('fails closed for malformed processes', (requestProcess) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [order] = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess }]);
    expect(order.requestProcess).toBeNull();
    expect(order.requestProcessInvalid).toBe(true);
    for (const action of ['accept', 'reject', 'cancel', 'mark-ready', 'accept-alternative', 'reject-alternative', 'complete-delivery', 'complete-reception'] as const) {
      expect(canSubmitOrderStatus(order, 'business', action)).toBe(false);
      expect(canSubmitOrderStatus(order, 'customer', action)).toBe(false);
    }
    expect(canSubmitOrderStatus(order, 'business', 'mark-ready')).toBe(false);
    expect(statusViewFor('orders', order.status, order.requestProcess, order.requestProcessInvalid)).toBe('coordination');
  });
  it('blocks every later action and customer action for process orders', () => {
    const [order] = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: pendingProcess }]);
    expect(canSubmitOrderStatus(order, 'business', 'accept')).toBe(true);
    for (const action of ['reject', 'cancel', 'mark-ready', 'accept-alternative', 'reject-alternative', 'complete-delivery', 'complete-reception'] as const) {
      expect(canSubmitOrderStatus(order, 'business', action)).toBe(false);
      expect(canSubmitOrderStatus(order, 'customer', action)).toBe(false);
    }
    expect(canSubmitOrderStatus(order, 'customer', 'accept')).toBe(false);
  });
  it('requires the server allowed action even in the known pending state', () => {
    const [order] = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: { ...pendingProcess, allowedActions: [] } }]);
    expect(canSubmitOrderStatus(order, 'business', 'accept')).toBe(false);
  });
  it('groups coordination independently, retaining future history access', () => {
    const orders = normalizeMyOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    expect(filterByStatusView(orders, 'orders', 'coordination')).toEqual(orders);
    expect(filterByStatusView(orders, 'orders', 'active')).toEqual([]);
    expect(countStatusViews(orders, 'orders').coordination).toBe(1);
    expect(statusViewFor('orders', 'completed', coordinationProcess)).toBe('history');
    expect(statusViewFor('orders', 'pending', pendingProcess)).toBe('pending');
  });
  it('never interprets an unknown process state as preparation or authorizes an action', () => {
    const process = normalizeRequestProcess({ ...pendingProcess, state: 'FUTURE_STATE' });
    expect(process).not.toBeNull();
    expect(statusViewFor('orders', 'accepted', process)).toBe('coordination');
    expect(processStatusLabel({ requestProcess: process })).toContain('Actualiza');
    expect(processStatusLabel({ requestProcess: process })).not.toContain('prepar');
  });
  it('tracks process transitions even when the Order status does not change', () => {
    expect(orderNotificationState({ status: 'accepted', requestProcess: pendingProcess }))
      .not.toBe(orderNotificationState({ status: 'accepted', requestProcess: coordinationProcess }));
    expect(COORDINATION_ACCEPTED_MESSAGE).toBe('El negocio aceptó tu pedido. Falta coordinar los siguientes pasos.');
    const result = getCustomerAttentionItems([{ id: 20, status: 'accepted', requestProcess: coordinationProcess }], 'orders', new Set(['order:20']));
    expect(result.responses[0].requestProcess).toEqual(coordinationProcess);
  });
});
