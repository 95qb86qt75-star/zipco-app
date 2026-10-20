import { afterEach, describe, expect, it, vi } from 'vitest';
import { coordinationAllowed, coordinationBody, sendCoordination } from './coordinationApi';
import { isPendingRequestCancelled, normalizeRequestProcess, processStatusLabel } from './requestProcess';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { countStatusViews, statusViewFor } from './requestStatusGrouping';
import { customerOrderNotice } from '../../notifications/orderNotice';
import { cancelPendingProcess, cancelledPendingProcess, cancelledPendingOrder, cancelledPendingReceipt } from './pendingCancellationFixtures';

const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const action = 'CANCEL_PENDING_REQUEST';
const body = { expectedVersion: 1, confirmationAccepted: true as const };
const send = () => sendCoordination(7, 20, action, body, 'synthetic', key, undefined, 123);
afterEach(() => vi.unstubAllGlobals());

describe('CANCEL_PENDING_REQUEST public contract', () => {
  it('requires the customer permission in the initial phase, without agreement or contact', () => {
    expect(coordinationAllowed(cancelPendingProcess, false, action)).toBe(true);
    expect(coordinationAllowed(cancelPendingProcess, true, action)).toBe(false);
    expect(coordinationAllowed({ ...cancelPendingProcess, allowedActions: [] }, false, action)).toBe(false);
    expect(coordinationAllowed(null, false, action)).toBe(false);
    for (const state of ['COORDINATION_PENDING', 'COORDINATING', 'IN_PROGRESS', 'READY', 'CLOSED'])
      expect(coordinationAllowed({ ...cancelPendingProcess, state }, false, action)).toBe(false);
  });

  it('sends the exact body and route and validates a CLOSED receipt with no agreement', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(cancelledPendingReceipt)));
    vi.stubGlobal('fetch', fetcher);
    expect(coordinationBody(action, 1, 'OTHER', 'must not send')).toEqual(body);
    expect(await send()).toEqual({ result: cancelledPendingReceipt, navigation: null });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain('/request-processes/7/actions/cancel-pending-request');
    expect(init.method).toBe('POST'); expect(init.headers['Idempotency-Key']).toBe(key);
    expect(JSON.parse(init.body)).toEqual(body); expect(fetcher).toHaveBeenCalledOnce();
  });

  it.each([
    { ...cancelledPendingReceipt, orderId: 21 },
    { ...cancelledPendingReceipt, orderStatus: 'accepted' },
    ...[
      { version: 1 }, { version: 3 }, { currentProposalId: 124 }, { agreementPublicId: 'unaccepted-agreement' },
      { state: 'COORDINATION_CANCELLED' }, { allowedActions: ['CANCEL_PENDING_REQUEST'] }, { closure: null },
      { closure: { ...cancelledPendingProcess.closure, actor: 'BUSINESS' } },
      { closure: { ...cancelledPendingProcess.closure, reasonCode: 'OTHER' } },
      { closure: { ...cancelledPendingProcess.closure, closedAt: 'invalid' } },
    ].map(change => ({ ...cancelledPendingReceipt, requestProcess: { ...cancelledPendingProcess, ...change } })),
  ])('rejects contradictory receipts instead of assuming cancellation', async receipt => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt))));
    await expect(send()).rejects.toMatchObject({ status: 502 });
  });

  it.each([0, -1, 1.5, 2147483648])('rejects invalid PostgreSQL integers before requesting (%s)', async version => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(sendCoordination(7, 20, action, { ...body, expectedVersion: version }, 'synthetic', key, undefined, 123)).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(['STALE_VERSION', 'INCOMPATIBLE_STATE', 'IDEMPOTENCY_KEY_REUSED', 'INVALID_REQUEST_PROCESS'])('handles public conflict %s without exposing raw server messages', async code => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code, message: 'private-internal' }), { status: 409 })));
    await expect(send()).rejects.toMatchObject({ status: 409, refreshConditions: true });
    await expect(send()).rejects.not.toThrow('private-internal');
  });

  it('normalizes closure idempotently, groups both lists in Historial and emits no new customer notice', () => {
    expect(normalizeRequestProcess(normalizeRequestProcess(cancelledPendingProcess))).toEqual(cancelledPendingProcess);
    for (const orders of [normalizeMyOrdersPayload([cancelledPendingOrder]), normalizeBusinessOrdersPayload([cancelledPendingOrder])]) {
      expect(orders[0].requestProcess).toEqual(cancelledPendingProcess);
      expect(countStatusViews(orders, 'orders')).toMatchObject({ pending: 0, coordination: 0, history: 1 });
      expect(processStatusLabel(orders[0])).toBe('Anulada por el cliente');
    }
    expect(isPendingRequestCancelled(cancelledPendingProcess)).toBe(true);
    expect(statusViewFor('orders', 'pending', cancelledPendingProcess)).toBeNull();
    expect(customerOrderNotice(cancelledPendingOrder)).toBeNull();
  });
});
