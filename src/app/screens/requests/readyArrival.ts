import { readCoordinationSession } from './coordinationSession';
export const HOLOGRAM_MS = 4300;
export const READY_ARRIVAL_EVENT = 'zipco-customer-ready-arrival';
const marks = new Map<string, { until: number; expires: number; consumed: boolean }>();
let session = readCoordinationSession();
function key(orderId: number, agreement: string) {
  const current = readCoordinationSession();
  if (current !== session) { marks.clear(); session = current; }
  return current ? orderId + ':' + agreement : '';
}
export const clearReadyArrival = () => marks.clear();
export function markJustReady(orderId: number, agreement: string, until: number) {
  const id = key(orderId, agreement); if (!id) return;
  for (const [entry, mark] of marks) if (mark.expires < Date.now()) marks.delete(entry);
  marks.set(id, { until, expires: Date.now() + 15000, consumed: false });
  window.dispatchEvent(new CustomEvent(READY_ARRIVAL_EVENT, { detail: { orderId } }));
}
export function readyArrivalDelay(orderId: number, agreement: string): number | null {
  const id = key(orderId, agreement); const mark = marks.get(id);
  if (!mark || mark.consumed) return null;
  if (mark.expires < Date.now()) { marks.delete(id); return null; }
  return Math.max(0, mark.until - Date.now());
}
export function consumeReadyArrival(orderId: number, agreement: string) {
  const mark = marks.get(key(orderId, agreement)); if (mark) mark.consumed = true;
}
