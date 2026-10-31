import {receiptPending} from './customerReceiptContract';
import { hasRequestProcess, isPendingRequestCancelled, isPendingRequestRejected, isProposalRejected, isAvailabilityClosed, type RequestProcessSummary } from './requestProcess';
export type RequestKind = "orders" | "quotes";
export type StatusView = "pending" | "waiting" | "active" | "ready" | "history" | "coordination";
export type HistoryFilter =
  "all" | "completed" | "cancelled" | "rejected" | "deleted";

type StatusRecord = { status: string; archivedAt?: string | null; requestProcess?: RequestProcessSummary | null; requestProcessInvalid?: boolean };

export function statusViewFor(
  kind: RequestKind,
  status: string,
  requestProcess?: RequestProcessSummary | null,
  requestProcessInvalid = false,
  business = false,
): StatusView | null {
  if (kind === "orders") {
    if(requestProcess?.state==='AWAITING_BUSINESS_RESPONSE'&&requestProcess.lateInitialResponse?.status==='AWAITING_CUSTOMER')return business?'pending':'waiting';
    if (['AWAITING_CUSTOMER_CONTINUATION', 'AWAITING_CUSTOMER_DECISION', 'AWAITING_BUSINESS_COUNTER_RESPONSE', 'AWAITING_CUSTOMER_FINAL_DECISION'].includes(requestProcess?.state ?? '')) return 'waiting';
    if (requestProcess?.state === 'CLOSED') return (status === 'cancelled' && (isPendingRequestCancelled(requestProcess) || isAvailabilityClosed(requestProcess))) ||
      (status === 'rejected' && (isPendingRequestRejected(requestProcess) || isProposalRejected(requestProcess))) ? 'history' : null;
    if (requestProcess?.state === 'COMPLETED' || requestProcess?.state === 'COORDINATION_CANCELLED') return 'history';
    if (receiptPending(requestProcess)) return 'active';
    if (requestProcess?.state === 'IN_PROGRESS') return 'active';
    if (requestProcess?.state === 'READY') return 'ready';
    if (hasRequestProcess({ requestProcess, requestProcessInvalid }) && !['completed', 'rejected', 'cancelled'].includes(status)) {
      return requestProcess?.state === 'AWAITING_BUSINESS_RESPONSE' ? 'pending' : 'coordination';
    }
    if (status === "pending") return "pending";
    if (status === "alternative_proposed") return "waiting";
    if (status === "accepted") return "active";
    if (status === "ready") return "ready";
    if (
      status === "completed" ||
      status === "rejected" ||
      status === "cancelled"
    )
      return "history";
    return null;
  }
  if (status === "requested") return "pending";
  if (status === "quoted" || status === "alternative_proposed")
    return "waiting";
  if (status === "accepted") return "active";
  if (status === "ready") return "ready";
  if (status === "completed" || status === "declined" || status === "cancelled")
    return "history";
  return null;
}

export function countStatusViews(records: StatusRecord[], kind: RequestKind, business=false) {
  return records.reduce(
    (counts, record) => {
      const view = statusViewFor(kind, record.status, record.requestProcess, record.requestProcessInvalid,business);
      if (view) counts[view] += 1;
      return counts;
    },
    { pending: 0, waiting: 0, active: 0, ready: 0, history: 0, coordination: 0 },
  );
}

export function filterByStatusView<T extends StatusRecord>(
  records: T[],
  kind: RequestKind,
  view: StatusView,
  historyFilter: HistoryFilter = "all",
  isArchived: (record: T) => boolean = (record) => Boolean(record.archivedAt),
  business=false,
) {
  return records.filter((record) => {
    if (statusViewFor(kind, record.status, record.requestProcess, record.requestProcessInvalid,business) !== view) return false;
    if (view !== "history") return true;
    const archived = isArchived(record);
    if (historyFilter === "deleted") return archived;
    if (archived) return false;
    if (historyFilter === "all") return true;
    if (historyFilter === "rejected") {
      return record.status === (kind === "quotes" ? "declined" : "rejected");
    }
    return record.status === historyFilter;
  });
}
