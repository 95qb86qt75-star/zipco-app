import {
  isPresent,
  isRecord,
  parseCalendarDate,
  parseCancellationReason,
  parseIsoDate,
  parseNonNegativeNumber,
  parseOrderStatus,
  parsePositiveInteger,
  parseProducts,
  parseTime
} from './orderValueParsers';
import type {
  ActionableOrder,
  BusinessRequest,
  IdentityIssue,
  MyOrder,
  NormalizedCancellationReason,
  OrderDataIssue,
  OrderActor,
  OrderAction,
  OrderIdentity,
  OrderStatus
} from './types';

type OrderContext = 'customer' | 'business';
type ApiRecord = Record<string, unknown>;

function extractCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [payload];
  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.results)) return payload.results;
  return [payload];
}

function getNestedRecord(record: ApiRecord, key: string): ApiRecord | null {
  return isRecord(record[key]) ? record[key] as ApiRecord : null;
}

function readOptionalText(value: unknown, issue: OrderDataIssue, issues: OrderDataIssue[]): string {
  if (!isPresent(value)) return '';
  if (typeof value === 'string') return value;
  issues.push(issue);
  return '';
}

function readOptionalImage(value: unknown, issue: OrderDataIssue, issues: OrderDataIssue[]): string | null {
  const text = readOptionalText(value, issue, issues).trim();
  return text || null;
}

function formatCreatedAt(createdAt: string | null): string {
  return createdAt
    ? new Date(createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    : 'Fecha no disponible';
}

function normalizeIdentity(
  candidate: unknown,
  duplicateIds: Set<number>
): { identity: OrderIdentity; rawStatus: OrderStatus | null } {
  if (!isRecord(candidate)) {
    return {
      identity: { recordState: 'unavailable', id: null, status: 'unavailable', identityIssues: ['record'] },
      rawStatus: null
    };
  }

  const parsedId = parsePositiveInteger(candidate.id);
  const rawStatus = parseOrderStatus(candidate.status);
  const identityIssues: IdentityIssue[] = [];
  if (parsedId === null || duplicateIds.has(parsedId)) identityIssues.push('id');
  if (rawStatus === null) identityIssues.push('status');

  return identityIssues.length === 0
    ? { identity: { recordState: 'available', id: parsedId as number, status: rawStatus as OrderStatus, identityIssues: [] }, rawStatus }
    : { identity: { recordState: 'unavailable', id: null, status: 'unavailable', identityIssues }, rawStatus };
}

function normalizeReason(
  value: unknown,
  status: OrderStatus | null,
  issues: OrderDataIssue[]
): NormalizedCancellationReason {
  if (status === 'cancelled') {
    const reason = parseCancellationReason(value);
    if (reason) return reason;
    issues.push('cancellationReason');
    return 'unavailable';
  }
  if (isPresent(value)) issues.push('cancellationReason');
  return null;
}

function uniqueIssues(issues: OrderDataIssue[]): OrderDataIssue[] {
  return [...new Set(issues)];
}

function normalizeCandidate(
  candidate: unknown,
  context: OrderContext,
  index: number,
  duplicateIds: Set<number>
): BusinessRequest | MyOrder {
  if (!isRecord(candidate)) {
    const unavailable = {
      recordState: 'unavailable' as const,
      id: null,
      status: 'unavailable' as const,
      identityIssues: ['record'] as IdentityIssue[],
      clientKey: `${context}-invalid-${index}`,
      businessId: null,
      userId: null,
      createdAt: null,
      date: 'Fecha no disponible',
      products: { state: 'unavailable' as const, items: [] as [] },
      note: '',
      total: null,
      deliveryDate: null,
      deliveryTime: null,
      needNow: false,
      referencePhoto: null,
      cancellationReason: null,
      dataIssues: []
    };
    console.warn('Invalid order response fields', {
      context,
      index,
      identityIssues: unavailable.identityIssues,
      dataIssues: unavailable.dataIssues
    });
    return context === 'customer'
      ? { ...unavailable, businessName: '', businessPhone: '', businessImage: '' }
      : { ...unavailable, customerName: 'Cliente', customerPhone: '', customerImage: '', distance: '' };
  }

  const { identity, rawStatus } = normalizeIdentity(candidate, duplicateIds);
  const record = candidate;
  const business = getNestedRecord(record, 'business');
  const user = getNestedRecord(record, 'user');
  const dataIssues: OrderDataIssue[] = [];

  const businessIdValue = record.businessId ?? business?.id;
  const userIdValue = record.userId ?? user?.id;
  const businessId = isPresent(businessIdValue) ? parsePositiveInteger(businessIdValue) : null;
  const userId = isPresent(userIdValue) ? parsePositiveInteger(userIdValue) : null;
  if (isPresent(businessIdValue) && businessId === null) dataIssues.push('businessId');
  if (isPresent(userIdValue) && userId === null) dataIssues.push('userId');

  const createdAt = parseIsoDate(record.createdAt);
  if (createdAt === null) dataIssues.push('createdAt');

  const deliveryDate = isPresent(record.deliveryDate) ? parseCalendarDate(record.deliveryDate) : null;
  const deliveryTime = isPresent(record.deliveryTime) ? parseTime(record.deliveryTime) : null;
  if (isPresent(record.deliveryDate) && deliveryDate === null) dataIssues.push('deliveryDate');
  if (isPresent(record.deliveryTime) && deliveryTime === null) dataIssues.push('deliveryTime');

  const total = parseNonNegativeNumber(record.total);
  if (total === null) dataIssues.push('total');
  const products = parseProducts(record.products);
  if (products.state === 'unavailable') dataIssues.push('products');

  const note = readOptionalText(record.note, 'note', dataIssues);
  const referencePhoto = readOptionalImage(record.referencePhoto, 'referencePhoto', dataIssues);
  const needNow = record.needNow === true;
  if (typeof record.needNow !== 'boolean') dataIssues.push('needNow');

  const clientKey = identity.recordState === 'available'
    ? `${context}-${identity.id}`
    : `${context}-invalid-${index}`;

  const common = {
    ...identity,
    clientKey,
    businessId,
    userId,
    createdAt,
    date: formatCreatedAt(createdAt),
    products,
    note,
    total,
    deliveryDate,
    deliveryTime,
    needNow,
    referencePhoto,
    cancellationReason: normalizeReason(record.cancellationReason, rawStatus, dataIssues),
    dataIssues: uniqueIssues(dataIssues)
  };

  const normalized = context === 'customer'
    ? {
        ...common,
        businessName: readOptionalText(record.businessName ?? business?.name, 'businessName', dataIssues),
        businessPhone: readOptionalText(record.businessPhone ?? business?.phone, 'businessPhone', dataIssues),
        businessImage: readOptionalImage(
          record.businessImage ?? business?.image ?? business?.photo,
          'businessImage',
          dataIssues
        ) ?? ''
      } satisfies MyOrder
    : {
        ...common,
        customerName: readOptionalText(record.customerName ?? user?.name, 'customerName', dataIssues) || 'Cliente',
        customerPhone: readOptionalText(record.customerPhone ?? user?.phone, 'customerPhone', dataIssues),
        customerImage: readOptionalImage(
          record.customerImage ?? user?.profileImage ?? user?.photo,
          'customerImage',
          dataIssues
        ) ?? '',
        distance: ''
      } satisfies BusinessRequest;

  normalized.dataIssues = uniqueIssues(dataIssues);
  if (normalized.identityIssues.length > 0 || normalized.dataIssues.length > 0) {
    console.warn('Invalid order response fields', {
      context,
      index,
      identityIssues: normalized.identityIssues,
      dataIssues: normalized.dataIssues
    });
  }
  return normalized;
}

export function normalizeOrdersPayload(payload: unknown, context: OrderContext): Array<BusinessRequest | MyOrder> {
  const candidates = extractCandidates(payload);
  const counts = new Map<number, number>();
  for (const candidate of candidates) {
    const id = isRecord(candidate) ? parsePositiveInteger(candidate.id) : null;
    if (id !== null) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const duplicateIds = new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
  return candidates.map((candidate, index) => normalizeCandidate(candidate, context, index, duplicateIds));
}

export const normalizeMyOrdersPayload = (payload: unknown) =>
  normalizeOrdersPayload(payload, 'customer') as MyOrder[];

export const normalizeBusinessOrdersPayload = (payload: unknown) =>
  normalizeOrdersPayload(payload, 'business') as BusinessRequest[];

export function getActionableOrder(order: BusinessRequest | MyOrder): ActionableOrder | null {
  return order.recordState === 'available' ? { id: order.id, status: order.status } : null;
}

export function canSubmitOrderStatus(
  order: BusinessRequest | MyOrder,
  actor: OrderActor,
  action: OrderAction
): boolean {
  if (order.recordState !== 'available') return false;
  if (actor === 'customer') {
    return (action === 'cancel' && order.status === 'pending')
      || (action === 'complete-reception' && order.status === 'ready');
  }
  if (action === 'reject') return order.status === 'pending';
  if (action === 'accept') return order.status === 'pending' && order.products.state === 'available';
  if (action === 'mark-ready') return order.status === 'accepted' && order.products.state === 'available';
  return action === 'complete-delivery' && order.status === 'ready';
}
