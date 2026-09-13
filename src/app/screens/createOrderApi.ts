import { isOwnBusiness } from './businessOwnership';

export const OWN_BUSINESS_ORDER_MESSAGE = 'No puedes realizar pedidos en tu propio negocio.';
export const GENERIC_CREATE_ORDER_MESSAGE = 'No se pudo enviar el pedido.';

export class CreateOrderError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = 'CreateOrderError';
  }
}

type CreateOrderInput = {
  url: string;
  token: string;
  currentUserId: unknown;
  businessUserId: unknown;
  payload: Record<string, unknown>;
  fetchImpl?: typeof fetch;
};

export async function createOrder({
  url,
  token,
  currentUserId,
  businessUserId,
  payload,
  fetchImpl = fetch
}: CreateOrderInput): Promise<void> {
  if (isOwnBusiness(businessUserId, currentUserId)) {
    throw new CreateOrderError(OWN_BUSINESS_ORDER_MESSAGE, null);
  }

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new CreateOrderError(GENERIC_CREATE_ORDER_MESSAGE, null);
  }

  if (response.ok) return;
  if (response.status === 403) {
    throw new CreateOrderError(OWN_BUSINESS_ORDER_MESSAGE, 403);
  }
  throw new CreateOrderError(GENERIC_CREATE_ORDER_MESSAGE, response.status);
}
