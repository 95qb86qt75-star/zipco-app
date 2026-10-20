import { afterEach, describe, expect, it, vi } from 'vitest';
import { coordinationAllowed, coordinationBody, sendCoordination } from './coordinationApi';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload, canSubmitOrderStatus } from './orderNormalization';
import { isPendingRequestRejected, normalizeRequestProcess, PENDING_REJECTION_REASONS, processStatusLabel, type PendingRejectionReason } from './requestProcess';
import { countStatusViews, statusViewFor } from './requestStatusGrouping';
import { rejectPendingOrder, rejectPendingProcess, rejectedPendingOrder, rejectedPendingProcess, rejectedPendingReceipt } from './pendingRejectionFixtures';
import { createCustomerOrderNotices } from '../../notifications/orderNotice';
import { presentationKey } from '../../notifications/notificationDelivery';

const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const action = 'REJECT_PENDING_REQUEST';
const send = (body = coordinationBody(action, 1, 'unavailable')) => sendCoordination(7, 20, action, body, 'synthetic', key, undefined, 123);
afterEach(() => vi.unstubAllGlobals());

describe('Backend 772b78a pending rejection compatibility', () => {
  it('keeps the valid business response in Pendientes with accept and reject permissions', () => {
    const [order] = normalizeBusinessOrdersPayload([rejectPendingOrder]);
    expect(order.requestProcessInvalid).toBeUndefined(); expect(order.requestProcess).toEqual(rejectPendingProcess);
    expect(countStatusViews([order], 'orders')).toMatchObject({ pending: 1, coordination: 0 });
    expect(processStatusLabel(order)).toBe('Pendiente de respuesta');
    expect(canSubmitOrderStatus(order, 'business', 'accept')).toBe(true);
    expect(coordinationAllowed(order.requestProcess, true, action)).toBe(true);
    expect(coordinationAllowed(order.requestProcess, false, action)).toBe(false);
    expect(coordinationAllowed({ ...rejectPendingProcess, allowedActions: ['ACCEPT_FIXED_ORDER'] }, true, action)).toBe(false);
    expect(coordinationAllowed({ ...rejectPendingProcess, state: 'COORDINATION_PENDING' }, true, action)).toBe(false);
    expect(normalizeRequestProcess({ ...rejectPendingProcess, allowedActions: ['FUTURE_ACTION'] })).toBeNull();
    expect(rejectPendingOrder.status).toBe('pending');
  });

  it.each(Object.keys(PENDING_REJECTION_REASONS) as PendingRejectionReason[])('sends exact route and body for %s, preserves closure and both histories', async reason => {
    const detail = reason === 'other' ? 'Explicación sintética' : null;
    const process = { ...rejectedPendingProcess, closure: { ...rejectedPendingProcess.closure!, reasonCode: reason, reasonDetail: detail } };
    const receipt = { ...rejectedPendingReceipt, requestProcess: process };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt))); vi.stubGlobal('fetch', fetcher);
    const body = coordinationBody(action, 1, reason, `  ${detail ?? 'omit this'}  `);
    expect(body).toEqual({ expectedVersion: 1, confirmationAccepted: true, reasonCode: reason, ...(detail ? { reasonDetail: detail } : {}) });
    expect(await send(body)).toEqual({ result: receipt, navigation: null });
    expect(fetcher.mock.calls[0][0]).toContain('/request-processes/7/actions/reject-pending-request');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': key } });
    expect(normalizeRequestProcess(normalizeRequestProcess(process))).toEqual(process);
    for (const normalize of [normalizeBusinessOrdersPayload, normalizeMyOrdersPayload]) {
      const [order] = normalize([{ ...rejectedPendingOrder, requestProcess: process }]);
      expect(countStatusViews([order], 'orders')).toMatchObject({ history: 1, pending: 0, coordination: 0 });
      expect(processStatusLabel(order)).toBe('Rechazada'); expect(order.note).toBe(rejectedPendingOrder.note);
    }
    expect(statusViewFor('orders', 'pending', process)).toBeNull();
  });

  it.each(['', '   ', 'x'.repeat(1001)])('requires a valid trimmed other explanation', detail => {
    expect(() => coordinationBody(action, 1, 'other', detail)).toThrow();
  });

  it.each([
    { orderStatus: 'cancelled' }, { orderId: 21 },
    ...[{ version: 1 }, { version: 3 }, { currentProposalId: 124 }, { agreementPublicId: 'unexpected' },
      { allowedActions: ['REJECT_PENDING_REQUEST'] }, { closure: null },
      { closure: { ...rejectedPendingProcess.closure, actor: 'CUSTOMER' } },
      { closure: { ...rejectedPendingProcess.closure, reasonCode: 'no_capacity' } },
      { closure: { ...rejectedPendingProcess.closure, reasonDetail: 'not allowed' } },
      { closure: { ...rejectedPendingProcess.closure, closedAt: 'bad' } },
    ].map(change => ({ requestProcess: { ...rejectedPendingProcess, ...change } })),
  ])('rejects inconsistent receipts', async change => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...rejectedPendingReceipt, ...change }))));
    await expect(send()).rejects.toMatchObject({ status: 502 });
  });

  it('rejects invalid request fields before fetch', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    for (const body of [{ expectedVersion: 1, confirmationAccepted: true, reasonCode: 'unavailable', reasonDetail: 'extra' },
      { expectedVersion: 1, confirmationAccepted: true, reasonCode: 'other' },
      { expectedVersion: 0, confirmationAccepted: true, reasonCode: 'unavailable' }])
      await expect(send(body as any)).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(['STALE_VERSION', 'INCOMPATIBLE_STATE', 'IDEMPOTENCY_KEY_REUSED', 'INVALID_REQUEST_PROCESS'])('refreshes public conflict %s without raw messages', async code => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code, message: 'private-internal' }), { status: 409 })));
    await expect(send()).rejects.toMatchObject({ status: 409, refreshConditions: true });
    await expect(send()).rejects.not.toThrow('private-internal');
  });

  it('uses the existing rejection event identity and generic copy, without including the reason', () => {
    const emit = vi.fn();
    createCustomerOrderNotices(emit)([{ id: 20, status: 'rejected', requestProcess: rejectedPendingProcess }], new Map([[20, 'process:AWAITING_BUSINESS_RESPONSE']]), true, new Set());
    expect(emit).toHaveBeenCalledExactlyOnceWith('order-20-rejected', ['El negocio no pudo aceptar tu solicitud', 'Revisa el motivo en ZIPCO.'], 20);
    expect(presentationKey(emit.mock.calls[0][0], '/?open=requests-customer&orderId=20', 'https://qa.test')).toBe('requests-customer:order-20-rejected');
    expect(isPendingRequestRejected(rejectedPendingProcess)).toBe(true);
  });
});
