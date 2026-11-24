import type { BusinessRequest, MyOrder } from './types';
import { contactAuthorized, type CoordinationAction, type CoordinationReceipt } from './coordinationApi';
import type { ActionKind } from './ActionHologram';
import { isPendingRequestRejected } from './requestProcess';

// POST confirmation alone cannot prove the current consent or recovered navigation.
export function coordinationFeedback(action: CoordinationAction, receipt: CoordinationReceipt,
  latest: BusinessRequest | MyOrder | null, business: boolean): { kind: ActionKind; key: string } | null {
  const process = latest?.requestProcess;
  if (latest?.recordState !== 'available' || latest.id !== receipt.orderId || !process ||
    process.id !== receipt.requestProcess.id || process.version < receipt.requestProcess.version) return null;
  const kind = action === 'AUTHORIZE_CONTACT' && contactAuthorized(process, business) ? 'authorized'
    : action === 'REJECT_PENDING_REQUEST' && business && isPendingRequestRejected(process) ? 'rejected'
    : action === 'START_WORK' && business && process.state === 'IN_PROGRESS' ? 'started'
    : action === 'MARK_READY' && process.state === 'READY' ? 'ready'
      : action === 'ANNUL_COORDINATION' && process.state === 'COORDINATION_CANCELLED' ? 'annulled' : null;
  return kind ? { kind, key: `${business}:${process.id}:${receipt.requestProcess.version}:${action}` } : null;
}
