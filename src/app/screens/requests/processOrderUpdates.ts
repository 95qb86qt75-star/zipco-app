import { hasRequestProcess, type ProcessOrder } from './requestProcess';

type IdentifiedOrder = ProcessOrder & { id: number | null };

// A poll started before acceptance can finish after it. Never roll a confirmed
// process back to an older version (or to the legacy flow).
export function mergeProcessOrderUpdates<T extends IdentifiedOrder>(incoming: T[], current: T[]): T[] {
  const byId = new Map(current.filter((order) => order.id !== null).map((order) => [order.id, order]));
  return incoming.map((order) => {
    const previous = order.id === null ? undefined : byId.get(order.id);
    if (!previous?.requestProcess) return order;
    if (!hasRequestProcess(order) || (order.requestProcess &&
      order.requestProcess.id === previous.requestProcess.id &&
      order.requestProcess.version < previous.requestProcess.version)) return previous;
    return order;
  });
}
