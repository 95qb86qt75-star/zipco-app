import { isOwnBusiness } from './businessOwnership';
import { parseNonNegativeInteger } from './requests/orderValueParsers';

export const OWN_BUSINESS_ORDER_MESSAGE = 'No puedes realizar pedidos en tu propio negocio.';
export const GENERIC_CREATE_ORDER_MESSAGE = 'No se pudo enviar el pedido.';
export const CATALOG_CHANGED_MESSAGE = 'El catálogo cambió. Revisa nuevamente tu pedido.';

export type CreateOrderPayload = { businessId: number; items: Array<{ catalogItemId: number; quantity: number }>; note: string; needNow: boolean; deliveryDate: string | null; deliveryTime: string | null; referencePhoto: string | null };
export type CreateOrderDraft = Omit<CreateOrderPayload, 'deliveryDate' | 'deliveryTime'> & { deliveryDate: string; deliveryTime: string };

export function buildCreateOrderPayload(draft: CreateOrderDraft): CreateOrderPayload {
  return {
    businessId: draft.businessId,
    items: draft.items,
    note: draft.note,
    needNow: draft.needNow,
    deliveryDate: draft.deliveryDate === '' ? null : draft.deliveryDate,
    deliveryTime: draft.deliveryTime === '' ? null : draft.deliveryTime,
    referencePhoto: draft.referencePhoto
  };
}
export type CreatedOrder = { id: number; total: number; items: OrderItemResponse[] };
export type OrderItemResponse = { id: number; orderId: number; catalogItemId: number | null; nameSnapshot: string; unitPriceClpSnapshot: number; quantity: number; subtotalClp: number };

export class CreateOrderError extends Error { constructor(message: string, readonly status: number | null) { super(message); this.name = 'CreateOrderError'; } }
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function normalizeItem(value: unknown): OrderItemResponse | null {
  if (!record(value) || !positive(value.id) || !positive(value.orderId) || !(value.catalogItemId === null || positive(value.catalogItemId)) || typeof value.nameSnapshot !== 'string' || !value.nameSnapshot.trim() || !positive(value.unitPriceClpSnapshot) || !positive(value.quantity) || value.quantity > 99 || !positive(value.subtotalClp)) return null;
  if (value.subtotalClp !== value.unitPriceClpSnapshot * value.quantity) return null;
  return value as OrderItemResponse;
}
export function normalizeCreatedOrder(value: unknown): CreatedOrder {
  if (!record(value) || !positive(value.id) || !Array.isArray(value.items) || value.items.length === 0) throw new CreateOrderError('La respuesta del pedido no tiene un formato válido.', null);
  const total = parseNonNegativeInteger(value.total); const items = value.items.map(normalizeItem);
  if (total === null || items.some((item) => item === null)) throw new CreateOrderError('La respuesta del pedido no tiene un formato válido.', null);
  const validItems = items as OrderItemResponse[];
  const itemIds = new Set(validItems.map((item) => item.id));
  const matchingOrder = validItems.every((item) => item.orderId === value.id);
  const matchingTotal = validItems.reduce((sum, item) => sum + item.subtotalClp, 0) === total;
  if (itemIds.size !== validItems.length || !matchingOrder || !matchingTotal) throw new CreateOrderError('La respuesta del pedido no tiene un formato válido.', null);
  return { id: value.id, total, items: validItems };
}

type Input = { url: string; token: string; currentUserId: unknown; businessUserId: unknown; payload: CreateOrderPayload; fetchImpl?: typeof fetch };
export async function createOrder({ url, token, currentUserId, businessUserId, payload, fetchImpl = fetch }: Input): Promise<CreatedOrder> {
  if (isOwnBusiness(businessUserId, currentUserId)) throw new CreateOrderError(OWN_BUSINESS_ORDER_MESSAGE, null);
  let response: Response;
  try { response = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
  catch { throw new CreateOrderError('No se pudo conectar. Intenta nuevamente.', null); }
  if (!response.ok) {
    const messages: Record<number, string> = { 400: 'Revisa los datos del pedido.', 401: 'Tu sesión venció. Ingresa nuevamente.', 403: OWN_BUSINESS_ORDER_MESSAGE, 404: 'El negocio o uno de sus artículos ya no está disponible.', 409: CATALOG_CHANGED_MESSAGE };
    throw new CreateOrderError(messages[response.status] ?? GENERIC_CREATE_ORDER_MESSAGE, response.status);
  }
  try { return normalizeCreatedOrder(await response.json() as unknown); }
  catch (error) { if (error instanceof CreateOrderError) throw error; throw new CreateOrderError('La respuesta del pedido no tiene un formato válido.', response.status); }
}
