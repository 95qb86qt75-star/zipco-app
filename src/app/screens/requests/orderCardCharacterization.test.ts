import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessOrderCard from './BusinessOrderCard';
import MyOrderCard from './MyOrderCard';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { rawOrder, pendingProcess, coordinationProcess } from './requestProcessFixtures';

beforeEach(() => { vi.stubGlobal('React', React); vi.stubGlobal('localStorage', { getItem: () => null }); });
afterEach(() => vi.unstubAllGlobals());
const props = { isUpdating: false, onAction: () => undefined, onRetry: () => undefined };
const raw = { ...rawOrder, customerName: 'Cliente de prueba', customerImage: 'https://example.test/customer.jpg',
  businessName: 'Negocio de prueba', businessImage: 'https://example.test/business.jpg' };

describe('card behavior preserved under the shared Aurora presentation', () => {
  it.each([undefined, null])('retains the legacy business compact header and expansion (%s)', (requestProcess) => {
    const request = normalizeBusinessOrdersPayload([{ ...raw, requestProcess }])[0];
    const compact = renderToStaticMarkup(React.createElement(BusinessOrderCard, { request, ...props, isUnread: true }));
    expect(compact).toContain('customer.jpg'); expect(compact).not.toContain('src="https://example.test/photo.jpg"');
    for (const text of ['Cliente de prueba', 'Nueva', 'Nuevo pedido', 'Revisar y responder', 'zipco-aurora-card', 'zipco-open-panel']) expect(compact).toContain(text);
    const expanded = renderToStaticMarkup(React.createElement(BusinessOrderCard, { request, ...props, expanded: true }));
    for (const text of ['Nota de prueba', 'Precio total', 'Imagen adjunta', 'Aceptar pedido', 'Proponer alternativa', 'Rechazar pedido', 'Ocultar detalle']) expect(expanded).toContain(text);
  });
  it.each([undefined, null])('retains the legacy customer identity, progress and actions (%s)', (requestProcess) => {
    const order = normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess }])[0];
    const html = renderToStaticMarkup(React.createElement(MyOrderCard, { order, ...props, isUnread: true }));
    for (const text of ['business.jpg', 'Negocio de prueba', 'Nueva', 'Nota de prueba', 'Preparación', 'Listo', 'zipco-aurora-card']) expect(html).toContain(text);
  });
  it('keeps process pending acceptance exclusive and coordination separate from legacy progress', () => {
    const pending = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const accepted = normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const html = renderToStaticMarkup(React.createElement(BusinessOrderCard, { request: pending, ...props, expanded: true }));
    expect(html.match(/Aceptar pedido/g)).toHaveLength(1);
    expect(html).toContain('Proponer alternativa');
    for (const action of ['Rechazar pedido', 'Marcar como listo']) expect(html).not.toContain(action);
    expect(renderToStaticMarkup(React.createElement(MyOrderCard, { order: accepted, ...props }))).not.toContain('Preparación');
  });
});
