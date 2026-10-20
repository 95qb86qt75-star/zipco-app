// Synthetic contract data only.
import { pendingProcess, rawOrder } from './requestProcessFixtures';
import type { RequestProcessSummary } from './requestProcess';
export const rejectPendingProcess: RequestProcessSummary = { ...pendingProcess, allowedActions: ['ACCEPT_FIXED_ORDER', 'REJECT_PENDING_REQUEST'] };
export const rejectedPendingProcess: RequestProcessSummary = { ...pendingProcess, state: 'CLOSED', version: 2, allowedActions: [],
  closure: { actor: 'BUSINESS', actorUserId: 2, reasonCode: 'unavailable', reasonDetail: null, closedAt: '2026-10-20T12:00:00Z' } };
export const rejectPendingOrder = { ...rawOrder, requestProcess: rejectPendingProcess };
export const rejectedPendingOrder = { ...rawOrder, status: 'rejected', requestProcess: rejectedPendingProcess };
export const rejectedPendingReceipt = { orderId: 20, orderStatus: 'rejected', requestProcess: rejectedPendingProcess };
