// Synthetic contract fixtures only; no customer data.
import { pendingProcess, rawOrder } from './requestProcessFixtures';
import type { RequestProcessSummary } from './requestProcess';
export const cancelPendingProcess: RequestProcessSummary = { ...pendingProcess, allowedActions: ['CANCEL_PENDING_REQUEST'] };
export const cancelledPendingProcess: RequestProcessSummary = {
  ...pendingProcess, state: 'CLOSED', version: 2, allowedActions: [],
  closure: { reasonCode: 'CUSTOMER_CANCELLED_BEFORE_RESPONSE', reasonDetail: null,
    actor: 'CUSTOMER', actorUserId: 1, closedAt: '2026-10-20T12:00:00.000Z' },
};
export const cancelPendingOrder = { ...rawOrder, businessName: 'Negocio de prueba', requestProcess: cancelPendingProcess };
export const cancelledPendingOrder = { ...cancelPendingOrder, status: 'cancelled', requestProcess: cancelledPendingProcess };
export const cancelledPendingReceipt = { orderId: 20, orderStatus: 'cancelled', requestProcess: cancelledPendingProcess };
