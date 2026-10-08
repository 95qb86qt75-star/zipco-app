export type AttentionKind = "orders" | "quotes";

type AttentionRecord = {
  id: number;
  status: string;
  recordState?: string;
};

export type AttentionItem = {
  kind: AttentionKind;
  id: number;
  status: string;
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
        ? record.status === "alternative_proposed" ||
          (record.status === "accepted" &&
            unreadInteractions.has(`order:${record.id}`))
        : record.status === "quoted" ||
          record.status === "alternative_proposed",
    )
    .map((record) => ({ kind, id: record.id, status: record.status }));
  const ready = available
    .filter((record) => record.status === "ready")
    .map((record) => ({ kind, id: record.id, status: record.status }));

  return { responses, ready, count: responses.length + ready.length };
}
