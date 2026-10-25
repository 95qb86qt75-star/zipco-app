import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProcessOrderCard from './ProcessOrderCard';
import { normalizeMyOrdersPayload } from './orderNormalization';
import { cancelPendingOrder } from './pendingCancellationFixtures';

vi.mock('./useAgreement', () => ({ default: () => ({ state: { status: 'absent' }, retry: vi.fn() }) }));
vi.mock('./useCoordination', () => ({ default: () => ({ busy: false, message: '', needsUpdate: false,
  pending: () => null, restored: () => false, storageWarning: () => '', run: vi.fn(), retry: vi.fn(), update: vi.fn() }) }));
vi.mock('./ProposalNegotiation', () => ({ default: () => null }));
const preference = { allowed: true, textVersion: 'availability-customer-whatsapp-v1',
  recordedAt: '2026-10-24T20:00:00.000Z', effective: false, requiresReconfirmation: false };
const render = (changes: Record<string, unknown> = {}, expanded = false, business = false) => {
  const order = normalizeMyOrdersPayload([{ ...cancelPendingOrder, ...changes }])[0];
  return renderToStaticMarkup(React.createElement(ProcessOrderCard, { order, business, expanded,
    onToggle: () => undefined, onRetry: () => undefined, isUpdating: false }));
};
beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

describe('real customer pending card', () => {
  it('selects the waiting ticket only for the customer initial process and starts collapsed', () => {
    const html = render();
    expect(html).toContain('EN ESPERA');
    expect(html).toContain('Pendiente de respuesta');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('hidden=""');
    expect(html).toContain('Ver detalle');
    expect(html).toContain('Anular solicitud');
    expect(html).not.toContain('zipco-av-contact-intent');
    expect(render({}, false, true)).not.toContain('EN ESPERA');
  });

  it('preserves the existing note, schedule and products in the expanded detail', () => {
    const html = render({ note: 'Nota conservada de prueba' }, true);
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain('hidden=""');
    expect(html).toContain('Nota conservada de prueba');
    expect(html).toContain('data-pending-order-detail');
    expect(html).toContain('Total solicitado');
    expect(html).toContain('Ocultar detalle');
  });

  it('uses only the recorded preference and distinguishes reconfirmation without authorizing contact', () => {
    const withPreference = (p: unknown) => render({ requestProcess: { ...cancelPendingOrder.requestProcess, customerContactPreference: p } }, true);
    expect(withPreference(preference)).toContain('Permitiste que el negocio te escriba por WhatsApp si compras');
    expect(withPreference(preference)).toContain('Esta elección todavía no comparte tu teléfono.');
    expect(withPreference({ ...preference, allowed: false })).toContain('Sin autorizar el contacto');
    expect(withPreference({ ...preference, requiresReconfirmation: true })).toContain('necesita una nueva confirmación');
    expect(withPreference(preference)).not.toContain('wa.me');
  });

  it('does not offer cancellation without the server action or fabricate unavailable products', () => {
    const html = render({ requestProcess: { ...cancelPendingOrder.requestProcess, allowedActions: [] } });
    expect(html).not.toContain('Anular solicitud');
    const unavailable = render({ products: null, items: null, total: null }, true);
    expect(unavailable).toContain('Productos no disponibles');
    expect(unavailable).not.toContain('$0');
  });
});
