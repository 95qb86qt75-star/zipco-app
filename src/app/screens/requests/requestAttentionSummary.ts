import { hasRequestProcess, type RequestProcessSummary } from './requestProcess';
import { statusViewFor } from './requestStatusGrouping';
export type AttentionKind = "orders" | "quotes";

type AttentionRecord = {
  id: number;
  status: string;
  recordState?: string;
  requestProcess?: RequestProcessSummary | null; requestProcessInvalid?: boolean;
};

export type AttentionItem = {
  kind: AttentionKind;
  id: number;
  status: string;
  requestProcess?: RequestProcessSummary | null; requestProcessInvalid?: boolean;
};

// Persistent category summary: reading a card does not complete coordination.
// Keep this separate from unread response alerts and their notification badges.
export function getCustomerCoordinationItems(records: AttentionRecord[]) {
  return records.filter((record) =>
    (record.recordState === undefined || record.recordState === 'available') &&
    ['COORDINATION_PENDING', 'COORDINATING'].includes(record.requestProcess?.state ?? '') &&
    statusViewFor('orders', record.status, record.requestProcess, record.requestProcessInvalid) === 'coordination');
}

export function getCustomerAttentionItems(
  records: AttentionRecord[],
  kind: AttentionKind,
  unreadInteractions: ReadonlySet<string>,
) {
  const available = records.filter(
    (record) =>
      record.recordState === undefined || record.recordState === "available",
  );
  const responses = available
    .filter((record) =>
      kind === "orders"
        ? hasRequestProcess(record)
          ? record.requestProcess?.lateInitialResponse?.status==='AWAITING_CUSTOMER' || record.requestProcess?.state === 'AWAITING_CUSTOMER_CONTINUATION' || record.requestProcess?.state === 'COORDINATION_PENDING' && unreadInteractions.has(`order:${record.id}`)
          : record.status === "alternative_proposed" ||
          (record.status === "accepted" &&
            unreadInteractions.has(`order:${record.id}`))
        : record.status === "quoted" ||
          record.status === "alternative_proposed",
    )
    .map((record) => ({ kind, id: record.id, status: record.status,
      ...(hasRequestProcess(record) ? { requestProcess: record.requestProcess } : {}) }));
  const ready: AttentionItem[] = available
    .filter((record) => hasRequestProcess(record) ? record.requestProcess?.state === 'READY' : record.status === "ready")
    .map((record) => ({ kind, id: record.id, status: record.status,
      ...(hasRequestProcess(record) ? { requestProcess: record.requestProcess } : {}) }));

  return { responses, ready, count: responses.length + ready.length };
}
