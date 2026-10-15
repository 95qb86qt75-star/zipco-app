import { describe, expect, it } from 'vitest';
import { customerOrderNotice } from './orderNotice';
import { parseOrders } from './BusinessNotificationMonitor';
import { pendingProcess, coordinationProcess } from '../screens/requests/requestProcessFixtures';

describe('customer acceptance notice', () => {
  it('uses approved coordination copy after parsing the list response', () => {
    const [order] = parseOrders([{ id: 20, status: 'accepted', requestProcess: coordinationProcess }]);
    expect(customerOrderNotice(order)).toEqual(['Pedido aceptado', 'El negocio aceptó tu pedido. Falta coordinar los siguientes pasos.']);
  });
  it('keeps the legacy notice and does not announce preparation for unknown processes', () => {
    expect(customerOrderNotice({ status: 'accepted' })).toEqual(['Pedido aceptado', 'El negocio acepto tu pedido.']);
    expect(customerOrderNotice({ status: 'accepted', requestProcess: { ...pendingProcess, state: 'UNKNOWN' } })).toBeNull();
    expect(customerOrderNotice({ status: 'accepted', requestProcess: null })).toEqual(['Pedido aceptado', 'El negocio acepto tu pedido.']);
    const [malformed] = parseOrders([{ id: 20, status: 'accepted', requestProcess: {} }]);
    expect(customerOrderNotice(malformed)).toBeNull();
    const [legacyNull] = parseOrders([{ id: 20, status: 'accepted', requestProcess: null }]);
    expect(customerOrderNotice(legacyNull)).toEqual(['Pedido aceptado', 'El negocio acepto tu pedido.']);
    expect(customerOrderNotice({ status: 'pending', requestProcess: pendingProcess })).toBeNull();
  });
});
