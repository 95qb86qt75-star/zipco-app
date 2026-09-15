import {
  CANCELLATION_REASONS,
  ORDER_STATUSES,
  type CancellationReason,
  type NormalizedProducts,
  type OrderStatus,
  type Product
} from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const isPresent = (value: unknown) => value !== null && value !== undefined;

export function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)(?:\.00)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseOrderStatus(value: unknown): OrderStatus | null {
  return typeof value === 'string' && ORDER_STATUSES.includes(value as OrderStatus)
    ? value as OrderStatus : null;
}

export function parseCancellationReason(value: unknown): CancellationReason | null {
  return typeof value === 'string' && CANCELLATION_REASONS.includes(value as CancellationReason)
    ? value as CancellationReason : null;
}

export function parseIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
  if (!match || parseCalendarDate(match[1]) === null) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

export function parseCalendarDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? value : null;
}

export function parseTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) <= 23 && Number(match[2]) <= 59 ? value : null;
}

function parseProduct(value: unknown): Product | null {
  if (!isRecord(value) || typeof value.name !== 'string' || !value.name.trim()) return null;
  const quantity = parsePositiveInteger(value.quantity);
  const price = parseNonNegativeNumber(value.price);
  return quantity === null || price === null ? null : { name: value.name.trim(), quantity, price };
}

export function parseProducts(value: unknown): NormalizedProducts {
  let candidate = value;
  if (typeof candidate === 'string') {
    try { candidate = JSON.parse(candidate); } catch { return { state: 'unavailable', items: [] }; }
  }
  if (!Array.isArray(candidate)) return { state: 'unavailable', items: [] };
  const items: Product[] = [];
  for (const item of candidate) {
    const product = parseProduct(item);
    if (!product) return { state: 'unavailable', items: [] };
    items.push(product);
  }
  return { state: 'available', items };
}

export function parseOrderItems(value: unknown): NormalizedProducts {
  if (!Array.isArray(value) || value.length === 0) return { state: 'unavailable', items: [] };
  const items: Product[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) return { state: 'unavailable', items: [] };
    const id = parsePositiveInteger(candidate.id);
    const orderId = parsePositiveInteger(candidate.orderId);
    const catalogItemId = candidate.catalogItemId === null ? null : parsePositiveInteger(candidate.catalogItemId);
    const quantity = parsePositiveInteger(candidate.quantity);
    const price = parsePositiveInteger(candidate.unitPriceClpSnapshot);
    const subtotal = parsePositiveInteger(candidate.subtotalClp);
    if (id === null || orderId === null || (candidate.catalogItemId !== null && catalogItemId === null) || typeof candidate.nameSnapshot !== 'string' || !candidate.nameSnapshot.trim() || quantity === null || quantity > 99 || price === null || subtotal === null || subtotal !== price * quantity) return { state: 'unavailable', items: [] };
    items.push({ name: candidate.nameSnapshot.trim(), quantity, price });
  }
  return { state: 'available', items };
}
