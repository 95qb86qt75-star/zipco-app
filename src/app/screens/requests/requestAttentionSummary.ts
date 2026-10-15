import { hasRequestProcess, type RequestProcessSummary } from './requestProcess';
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
          ? record.requestProcess?.state === 'COORDINATION_PENDING' && unreadInteractions.has(`order:${record.id}`)
          : record.status === "alternative_proposed" ||
          (record.status === "accepted" &&
            unreadInteractions.has(`order:${record.id}`))
        : record.status === "quoted" ||
          record.status === "alternative_proposed",
    )
    .map((record) => ({ kind, id: record.id, status: record.status,
      ...(hasRequestProcess(record) ? { requestProcess: record.requestProcess } : {}) }));
  const ready: AttentionItem[] = available
    .filter((record) => record.status === "ready" && !hasRequestProcess(record))
    .map((record) => ({ kind, id: record.id, status: record.status }));

  return { responses, ready, count: responses.length + ready.length };
}
