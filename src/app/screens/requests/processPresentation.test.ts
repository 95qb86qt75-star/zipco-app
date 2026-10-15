import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyOrderCard from './MyOrderCard';
import BusinessOrderCard from './BusinessOrderCard';
import OrderActionModal from './OrderActionModal';
import { AgreementContent } from './AcceptedConditions';
import { OrderHistoryList } from './CompactHistoryList';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { pendingProcess, coordinationProcess, rawOrder, agreementFixture } from './requestProcessFixtures';
import { normalizeAgreement } from './agreement';

beforeEach(() => {
  vi.stubGlobal('React', React);
  vi.stubGlobal('localStorage', { getItem: () => null });
});
afterEach(() => vi.unstubAllGlobals());
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const callbacks = { isUpdating: false, onRetry: () => undefined, onAction: () => undefined };

describe('2A presentation and legacy compatibility', () => {
  it('shows one accept button to the business and hides later actions', () => {
    const request = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: pendingProcess }])[0];
    const html = render(React.createElement(BusinessOrderCard, { request, ...callbacks, expanded: true }));
    expect(html.match(/Aceptar pedido/g)).toHaveLength(1);
    expect(html).toContain('Nota de prueba'); expect(html).toContain('photo.jpg');
    for (const text of ['Proponer alternativa', 'Rechazar pedido', 'Marcar como listo', 'Cancelar pedido', 'Confirmar entrega']) expect(html).not.toContain(text);
  });
  it('hides all customer actions for 2A', () => {
    const order = normalizeMyOrdersPayload([{ ...rawOrder, requestProcess: pendingProcess }])[0];
    const html = render(React.createElement(MyOrderCard, { order, ...callbacks }));
    expect(html).not.toContain('Cancelar pedido'); expect(html).not.toContain('Aceptar propuesta');
  });
  it('never displays preparation for coordination, even with stale list conditions', () => {
    const request = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const order = normalizeMyOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }])[0];
    for (const element of [React.createElement(BusinessOrderCard, { request, ...callbacks }), React.createElement(MyOrderCard, { order, ...callbacks })]) {
      const html = render(element);
      expect(html).toContain('Coordinación pendiente'); expect(html).toContain('Condiciones aceptadas');
      expect(html).toContain('Cargando condiciones');
      expect(html).not.toMatch(/preparando|Preparación|preparación/);
      expect(html).not.toContain('Nota de prueba');
      expect(html).not.toContain('photo.jpg');
    }
  });
  it.each([undefined, null])('preserves legacy preparation, rejection, alternatives and cancellation (%s)', (requestProcess) => {
    const order = normalizeMyOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess }])[0];
    expect(render(React.createElement(MyOrderCard, { order, ...callbacks }))).toContain('Preparación');
    const request = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess }])[0];
    const html = render(React.createElement(BusinessOrderCard, { request, ...callbacks, expanded: true }));
    expect(html).toContain('Proponer alternativa'); expect(html).toContain('Rechazar pedido');
    const pending = normalizeMyOrdersPayload([{ ...rawOrder, requestProcess }])[0];
    expect(render(React.createElement(MyOrderCard, { order: pending, ...callbacks }))).toContain('Cancelar pedido');
  });
  it('shows only refresh for a malformed process, never historical actions', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const request = normalizeBusinessOrdersPayload([{ ...rawOrder, requestProcess: {} }])[0];
    const order = normalizeMyOrdersPayload([{ ...rawOrder, requestProcess: {} }])[0];
    for (const element of [React.createElement(BusinessOrderCard, { request, ...callbacks, expanded: true }), React.createElement(MyOrderCard, { order, ...callbacks })]) {
      const html = render(element);
      expect(html).toContain('Actualizar pedido');
      for (const text of ['Aceptar pedido', 'Rechazar pedido', 'Cancelar pedido', 'Proponer alternativa']) expect(html).not.toContain(text);
    }
    vi.restoreAllMocks();
  });
  it('shows a safe unknown process state and refresh instead of preparation', () => {
    const order = normalizeMyOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: { ...pendingProcess, state: 'FUTURE' } }])[0];
    const html = render(React.createElement(MyOrderCard, { order, ...callbacks }));
    expect(html).toContain('Actualizar pedido'); expect(html).not.toContain('Preparación');
  });
  it('confirms acceptance without promising preparation', () => {
    const html = render(React.createElement(OrderActionModal, { action: 'accept', processAcceptance: true,
      isSubmitting: false, onClose: () => undefined, onConfirm: () => undefined }));
    expect(html).toContain('Coordinación pendiente'); expect(html).not.toContain('preparación');
  });
  it('keeps agreements accessible in future history without later actions', () => {
    const orders = normalizeMyOrdersPayload([{ ...rawOrder, status: 'completed', requestProcess: coordinationProcess }]);
    const html = render(React.createElement(OrderHistoryList, { orders, owner: 'customer', deleted: false, onArchive: () => undefined }));
    expect(html).toContain('Condiciones aceptadas'); expect(html).not.toContain('Eliminar');
  });
  it('renders accepted snapshots, prices, quantities and Chilean schedule', () => {
    const html = render(React.createElement(AgreementContent, { state: { status: 'loaded', agreement: agreementFixture }, retry: () => undefined }));
    for (const text of ['Producto acordado', 'Descripción acordada', 'Subtotal', 'Total:', 'Fecha y hora:', 'Nota acordada', 'agreement.jpg']) expect(html).toContain(text);
    expect(html).not.toContain('Reserva');
  });
  it('omits absent note and photo without replacing them with list values', () => {
    const agreement = { ...agreementFixture, subjectSnapshot: { ...agreementFixture.subjectSnapshot, note: null, referencePhoto: null } };
    const html = render(React.createElement(AgreementContent, { state: { status: 'loaded', agreement }, retry: () => undefined }));
    expect(html).not.toContain('Nota:'); expect(html).not.toContain('Foto de referencia');
  });
  it('separates loading, absent and recoverable error presentation', () => {
    expect(render(React.createElement(AgreementContent, { state: { status: 'loading' }, retry: () => undefined }))).toContain('Cargando');
    expect(render(React.createElement(AgreementContent, { state: { status: 'absent' }, retry: () => undefined }))).toContain('Actualiza');
    const retry = vi.fn();
    const view = AgreementContent({ state: { status: 'error', message: 'Error recuperable' }, retry });
    const html = render(view!); expect(html).toContain('Reintentar'); expect(html).toContain('role="alert"');
    // Exercise the exact handler passed to the retry control.
    const button = React.Children.toArray(view!.props.children).find((child) => React.isValidElement(child) && child.type === 'button') as React.ReactElement<{ onClick: () => void }>;
    button.props.onClick(); expect(retry).toHaveBeenCalledOnce();
  });
  it('validates agreement identity, schema, totals and excludes contacts', () => {
    const agreement = normalizeAgreement({ ...agreementFixture, customerPhone: 'test' });
    expect(agreement).toEqual(agreementFixture); expect(agreement).not.toHaveProperty('customerPhone');
    expect(normalizeAgreement({ ...agreementFixture, totalPriceClp: 1 })).toBeNull();
    expect(normalizeAgreement({ ...agreementFixture, subjectSchemaVersion: 2 })).toBeNull();
  });
});
