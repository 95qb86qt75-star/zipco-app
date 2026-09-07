import { OrdersApiError } from './ordersApi';

export type OrderErrorPolicy = {
  message: string;
  reload: boolean;
  expireSession: boolean;
};

export function getOrderErrorPolicy(error: unknown): OrderErrorPolicy {
  if (!(error instanceof OrdersApiError)) {
    return { message: 'No se pudo actualizar el pedido. Intenta nuevamente.', reload: false, expireSession: false };
  }
  if (error.status === 401) {
    return { message: 'Tu sesión venció. Ingresa nuevamente por SMS.', reload: false, expireSession: true };
  }
  return { message: error.message, reload: error.status === 409, expireSession: false };
}
