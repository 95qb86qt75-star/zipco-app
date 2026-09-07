import { API_BASE_URL } from '../../api/apiConfig';
import { isRecord } from './orderValueParsers';
import type { UpdateOrderStatusPayload } from './types';

export class OrdersApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'OrdersApiError';
    this.status = status;
  }
}

function readBackendMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.message === 'string' && value.message.trim()) return value.message.trim();
  if (!Array.isArray(value.message)) return null;
  const messages = value.message.filter(
    (message): message is string => typeof message === 'string' && Boolean(message.trim())
  );
  return messages.length > 0 ? messages.join('. ') : null;
}

function getErrorMessage(status: number, body: unknown): string {
  if (status >= 500) return 'El servidor no pudo actualizar el pedido.';
  if ([400, 401, 403, 409].includes(status)) {
    return readBackendMessage(body) ?? 'No se pudo actualizar el pedido.';
  }
  return 'No se pudo actualizar el pedido.';
}

export async function patchOrderStatus(
  requestId: number,
  payload: UpdateOrderStatusPayload,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/${requestId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (response.ok) return;
  let body: unknown = null;
  try { body = await response.json(); } catch { body = null; }
  throw new OrdersApiError(getErrorMessage(response.status, body), response.status);
}
