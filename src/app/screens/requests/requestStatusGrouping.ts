export type RequestKind = 'orders' | 'quotes';
export type StatusView = 'pending' | 'waiting' | 'active' | 'history';
export type HistoryFilter = 'all' | 'completed' | 'cancelled' | 'rejected';

type StatusRecord = { status: string };

export function statusViewFor(kind: RequestKind, status: string): StatusView | null {
  if (kind === 'orders') {
    if (status === 'pending') return 'pending';
    if (status === 'accepted' || status === 'ready') return 'active';
    if (status === 'completed' || status === 'rejected' || status === 'cancelled') return 'history';
    return null;
  }
  if (status === 'requested') return 'pending';
  if (status === 'quoted') return 'waiting';
  if (status === 'accepted') return 'active';
  if (status === 'declined' || status === 'cancelled') return 'history';
  return null;
}

export function countStatusViews(records: StatusRecord[], kind: RequestKind) {
  return records.reduce((counts, record) => {
    const view = statusViewFor(kind, record.status);
    if (view) counts[view] += 1;
    return counts;
  }, { pending: 0, waiting: 0, active: 0, history: 0 });
}

export function filterByStatusView<T extends StatusRecord>(
  records: T[],
  kind: RequestKind,
  view: StatusView,
  historyFilter: HistoryFilter = 'all'
) {
  return records.filter((record) => {
    if (statusViewFor(kind, record.status) !== view) return false;
    if (view !== 'history' || historyFilter === 'all') return true;
    if (historyFilter === 'rejected') {
      return record.status === (kind === 'quotes' ? 'declined' : 'rejected');
    }
    return record.status === historyFilter;
  });
}
