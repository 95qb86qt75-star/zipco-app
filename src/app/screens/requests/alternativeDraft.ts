import type { BusinessRequest, MyOrder, Product } from './types';
import type { ChangeKey } from './AlternativeProposalFields';

// Release interlock, intentionally not an environment/URL/storage switch.
// No proposals POST, upload or alternatives-v1 read is wired in this block.
export const ALTERNATIVE_RELEASE = Object.freeze({
  processContract: 'alternatives-v1', backendQaConfirmed: false,
  customerDecisionsReady: false, sendingEnabled: false,
});
type Order = BusinessRequest | MyOrder;
export function canPrepareAlternative(order: Order, business: boolean) {
  const p = order.requestProcess;
  return business && order.recordState === 'available' && p?.state === 'AWAITING_BUSINESS_RESPONSE' &&
    p.agreementPublicId === null && p.allowedActions.some(action =>
      ['ACCEPT_FIXED_ORDER', 'REJECT_PENDING_REQUEST', 'PROPOSE_ALTERNATIVE'].includes(action));
}
export function canSubmitAlternative(): false { return false; }
export type AlternativeSource = {
  processId: number; expectedVersion: number; proposalId: number;
  orderType: 'product' | 'service' | null; items: Product[]; total: number | null;
  needNow: boolean; date: string; time: string;
};
export type DraftLine = { selected: Set<ChangeKey>; name: string; description: string; quantity: string; price: string };
export type AlternativeDraft = { lines: DraftLine[]; scheduleChanged: boolean; immediate: boolean; date: string; time: string; message: string };
export function alternativeSource(order: Order): AlternativeSource {
  const p = order.requestProcess!;
  return { processId: p.id, expectedVersion: p.version, proposalId: p.currentProposalId,
    orderType: order.orderType ?? null, items: order.products.state === 'available' ? order.products.items.map(item => ({ ...item })) : [],
    total: order.total, needNow: order.needNow, date: order.deliveryDate ?? '', time: order.deliveryTime ?? '' };
}
export function newAlternativeDraft(source: AlternativeSource): AlternativeDraft {
  return { lines: source.items.map(item => ({ selected: new Set(), name: '', description: '', quantity: String(item.quantity), price: String(item.price) })),
    scheduleChanged: false, immediate: source.needNow, date: source.date, time: source.time, message: '' };
}
export function alternativeSourceCurrent(source: AlternativeSource, order: Order, business: boolean) {
  return canPrepareAlternative(order, business) && source.processId === order.requestProcess?.id &&
    source.expectedVersion === order.requestProcess.version && source.proposalId === order.requestProcess.currentProposalId;
}
const integer = (value: string, max: number) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= max ? Number(value) : null;
const money = (value: string) => integer(value, 50_000_000);
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function santiagoDraftTime(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const local = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(local) || new Date(local).toISOString().slice(0, 10) !== date) return null;
  // Future America/Santiago proposals use UTC-3/-4. Round-trip both to reject
  // nonexistent and ambiguous civil times rather than silently choosing one.
  const matches = [180, 240].map(offset => local + offset * 60_000).filter(instant => {
    const p = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
    return `${p.year}-${p.month}-${p.day}` === date && `${p.hour}:${p.minute}` === time;
  });
  return matches.length === 1 ? matches[0] : null;
}
type LineChange = { originalLineIndex: number; quantity?: number; unitPriceClp?: number;
  replacement?: { source: 'CUSTOM'; name: string; description?: string; lineTotalPriceClp: number } };
export type AlternativeReview = { expectedVersion: number; proposalId: number; lineChanges?: LineChange[]; totalPriceClp: number; message: string;
  schedule?: { mode: 'IMMEDIATE' } | { mode: 'SCHEDULED'; date: string; time: string } };
// This is only a local comparison, NOT a confirmed/submittable body. Canonical
// proposal snapshots, catalog replacements, photo URL and confirmation remain gated.
export function reviewAlternative(source: AlternativeSource, draft: AlternativeDraft, now = Date.now()): { error: string; review: AlternativeReview | null } {
  const fail = (error: string) => ({ error, review: null });
  if (![source.processId, source.expectedVersion, source.proposalId].every(n => Number.isInteger(n) && n > 0 && n <= 2147483647)) return fail('Actualiza la solicitud para preparar una alternativa.');
  if (!source.orderType || !source.items.length || source.items.length > 20 || source.items.length !== draft.lines.length) return fail('No se pudieron verificar los productos o servicios originales. Actualiza la solicitud.');
  if (source.orderType === 'service' && (source.items.length !== 1 || source.items[0].quantity !== 1)) return fail('El servicio debe conservar una sola línea y cantidad 1.');
  if (source.total !== source.items.reduce((total, item) => total + item.quantity * item.price, 0)) return fail('No coincide el total original. Actualiza la solicitud.');
  const message = draft.message.trim();
  if (message.length < 3 || message.length > 1000) return fail('Explica los cambios en 3 a 1000 caracteres. Si cambia el precio, explica el motivo.');
  const lineChanges: LineChange[] = []; let total = 0;
  for (let index = 0; index < source.items.length; index++) {
    const original = source.items[index], line = draft.lines[index];
    const quantity = line.selected.has('quantity') ? integer(line.quantity, 99) : original.quantity;
    if (!quantity || quantity > 99 || (source.orderType === 'service' && quantity !== 1)) return fail('La cantidad debe ser un entero entre 1 y 99; los servicios conservan cantidad 1.');
    if (line.selected.has('item')) {
      const name = line.name.trim(), description = line.description.trim(), price = money(line.price);
      if (!name || name.length > 120 || description.length > 500) return fail('La opción escrita requiere nombre de hasta 120 caracteres y descripción de hasta 500.');
      if (!price) return fail('Indica el precio total de la opción escrita, en pesos enteros entre 1 y 50.000.000.');
      lineChanges.push({ originalLineIndex: index, ...(quantity !== original.quantity ? { quantity } : {}), replacement: {
        source: 'CUSTOM', name, ...(description ? { description } : {}), lineTotalPriceClp: price,
      } }); total += price;
    } else {
      const price = line.selected.has('price') ? money(line.price) : original.price;
      if (!price || !Number.isInteger(price) || price > 50_000_000) return fail('El precio por unidad debe ser un entero entre 1 y 50.000.000.');
      const change: LineChange = { originalLineIndex: index };
      if (quantity !== original.quantity) change.quantity = quantity;
      if (price !== original.price) change.unitPriceClp = price;
      if (change.quantity !== undefined || change.unitPriceClp !== undefined) lineChanges.push(change);
      total += quantity * price;
    }
  }
  if (!Number.isSafeInteger(total) || total < 1 || total > 50_000_000) return fail('El total debe ser un entero entre 1 y 50.000.000.');
  const immediate = draft.scheduleChanged ? draft.immediate : source.needNow;
  const date = draft.scheduleChanged ? draft.date : source.date, time = draft.scheduleChanged ? draft.time : source.time;
  if (!immediate) {
    const instant = santiagoDraftTime(date, time);
    if (instant === null || instant <= now) return fail('Selecciona una fecha y hora futuras válidas de Chile; no puede ser una hora ambigua o inexistente.');
  }
  const scheduleChanged = draft.scheduleChanged && (immediate !== source.needNow || (!immediate && (date !== source.date || time !== source.time)));
  if (!lineChanges.length && !scheduleChanged) return fail('Cambia una condición del pedido: producto o servicio, cantidad, precio o fecha y hora.');
  return { error: '', review: { expectedVersion: source.expectedVersion, proposalId: source.proposalId,
    ...(lineChanges.length ? { lineChanges } : {}), totalPriceClp: total, message,
    ...(scheduleChanged ? { schedule: immediate ? { mode: 'IMMEDIATE' as const } : { mode: 'SCHEDULED' as const, date, time } } : {}),
  } };
}
