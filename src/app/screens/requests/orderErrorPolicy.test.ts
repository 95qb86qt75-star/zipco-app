import { describe, expect, it } from 'vitest';
import { OrdersApiError } from './ordersApi';
import { getOrderErrorPolicy } from './orderErrorPolicy';

describe('order error policy', () => {
  it.each([400, 403])('shows the safe API message for %s', (status) => {
    expect(getOrderErrorPolicy(new OrdersApiError('Mensaje seguro', status))).toEqual({
      message: 'Mensaje seguro', reload: false, expireSession: false
    });
  });

  it('expires the session after a 401', () => {
    expect(getOrderErrorPolicy(new OrdersApiError('ignored', 401))).toEqual({
      message: 'Tu sesión venció. Ingresa nuevamente por SMS.', reload: false, expireSession: true
    });
  });

  it('requests a reload after a 409', () => {
    expect(getOrderErrorPolicy(new OrdersApiError('El pedido cambió.', 409))).toEqual({
      message: 'El pedido cambió.', reload: true, expireSession: false
    });
  });

  it('uses a generic retryable message for network errors', () => {
    expect(getOrderErrorPolicy(new TypeError('private network detail'))).toEqual({
      message: 'No se pudo actualizar el pedido. Intenta nuevamente.', reload: false, expireSession: false
    });
  });
});
