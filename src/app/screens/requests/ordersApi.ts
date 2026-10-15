import { API_BASE_URL } from "../../api/apiConfig";
import { isRecord } from "./orderValueParsers";
import { ORDER_STATUSES, type UpdateOrderStatusPayload } from "./types";

export class OrdersApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number, readonly refreshRequired = false) {
    super(message);
    this.name = "OrdersApiError";
    this.status = status;
  }
}

function readBackendMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const messages = Array.isArray(value.message) ? value.message : [value.message];
  return messages.find((message) =>
    message === "La fecha y hora seleccionadas ya pasaron. Elige una fecha y hora futuras." ||
    message === "Esta hora no está disponible debido al cambio de horario. Selecciona otra hora.",
  ) ?? null;
}

function getErrorMessage(status: number, body: unknown): string {
  if (status === 400 || status === 422) {
    const approved = readBackendMessage(body);
    if (approved) return approved;
  }
  const messages: Record<number, string> = {
    400: "La solicitud no es válida. Revisa los datos.",
    401: "Tu sesión venció o no es válida. Ingresa nuevamente.",
    403: "No tienes permiso para realizar esta acción.",
    404: "El pedido o recurso ya no está disponible. Actualiza la pantalla.",
    409: "El pedido cambió. Actualiza la pantalla y revisa sus condiciones.",
  };
  return messages[status] ?? "No se pudo completar la acción. Actualiza la pantalla e intenta nuevamente.";
}

export async function patchOrderStatus(
  requestId: number,
  payload: UpdateOrderStatusPayload,
  token: string,
): Promise<{ id: number; status: UpdateOrderStatusPayload['status'] }> {
  const response = await fetch(`${API_BASE_URL}/orders/${requestId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (response.ok) {
    if (!isRecord(body) || typeof body.id !== 'number' || !Number.isSafeInteger(body.id) ||
      body.id <= 0 || body.id !== requestId || typeof body.status !== 'string' ||
      !ORDER_STATUSES.some((status) => status === body.status) || body.status !== payload.status) {
      throw new OrdersApiError('No se pudo confirmar la actualización del pedido. Actualiza la pantalla y revisa su estado.', 502, true);
    }
    return { id: body.id, status: payload.status };
  }
  throw new OrdersApiError(
    getErrorMessage(response.status, body),
    response.status,
  );
}

export async function archiveOrder(
  requestId: number,
  archived: boolean,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/${requestId}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ archived }),
  });
  if (response.ok) return;
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  throw new OrdersApiError(
    getErrorMessage(response.status, body),
    response.status,
  );
}

export async function deleteOrderPermanently(
  requestId: number,
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/orders/${requestId}/delete-permanently`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.ok) return;
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  throw new OrdersApiError(
    getErrorMessage(response.status, body),
    response.status,
  );
}

export async function proposeOrderAlternative(
  requestId: number,
  payload: {
    date?: string;
    time?: string;
    item?: string;
    quantity?: number;
    priceClp?: number;
    photo?: string;
    message: string;
  },
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/orders/${requestId}/alternative`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (response.ok) return;
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  throw new OrdersApiError(
    getErrorMessage(response.status, body),
    response.status,
  );
}
