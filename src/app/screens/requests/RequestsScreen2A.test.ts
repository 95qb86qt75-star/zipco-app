import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RequestsScreen from '../RequestsScreen';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { coordinationProcess, rawOrder } from './requestProcessFixtures';

const state = vi.hoisted(() => ({ requests: [] as unknown[] }));
vi.mock('./useRequests', () => ({ default: () => ({
  requests: state.requests, myOrders: state.requests, hasBusiness: true,
  isLoading: false, loadError: '', updatingOrderIds: new Set(), loadOrders: vi.fn(),
  performAction: vi.fn(), proposeAlternative: vi.fn(), setArchived: vi.fn(), deletePermanently: vi.fn(),
}) }));
vi.mock('../quotes/useQuotes', () => ({ default: () => ({
  myQuotes: [], businessQuotes: [], loading: false, error: '', updating: new Set(),
  load: vi.fn(), changeStatus: vi.fn(), setArchived: vi.fn(), deletePermanently: vi.fn(),
  respond: vi.fn(), proposeAlternative: vi.fn(),
}) }));
vi.mock('../../notifications/NotificationPermissionCard', () => ({ default: () => null }));

beforeEach(() => {
  vi.stubGlobal('React', React);
  vi.stubGlobal('window', { location: { search: '?open=requests-business' }, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('localStorage', { getItem: () => null });
});
afterEach(() => vi.unstubAllGlobals());

describe('Requests screen with mixed server generations', () => {
  const render = () => renderToStaticMarkup(React.createElement(RequestsScreen, {
    activeTab: 'requests', setActiveTab: () => undefined, onBack: () => undefined, onSessionExpired: () => undefined,
  }));
  it.each(['customer', 'business'])('restores the agreement origin category for %s', (participant) => {
    for (const [view, label] of [['coordination', participant === 'business' ? 'Por coordinar' : 'Coordinación'], ['active', 'En curso'], ['history', 'Historial']]) {
      state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
      window.location.search = `?open=requests-${participant}&view=${view}`;
      const html = render();
      const selected = html.match(/<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?<\/button>/g) ?? [];
      expect(selected).toHaveLength(1);
      expect(selected[0]).toContain(`<span>${label}</span>`);
    }
  });
  it('keeps legacy QA responses and preparation activity with the new business tab labels', () => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted' }]);
    const html = render();
    expect(html).toContain('En curso'); expect(html).toContain('Por coordinar');
    expect(html).toContain('Continúa con la preparación del pedido.');
  });
  it('adds the coordination group without creating a preparation activity for 2A', () => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    const html = render();
    expect(html).toContain('Por coordinar');
    expect(html).not.toContain('Continúa con la preparación del pedido.');
  });
  it('renders the approved business order and preserves the legacy ready tab', () => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'ready' }]);
    const html = render();
    const tabs = html.slice(html.indexOf('zipco-status-tabs'));
    const labels = ['Pendientes', 'Por coordinar', 'Esperando respuesta', 'En curso', 'Listo y notificado', 'Historial'];
    const positions = labels.map((label) => tabs.indexOf(`<span>${label}</span>`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
  it.each(['?open=requests-customer', '?open=requests-business-quotes'])('preserves the other tab presentations (%s)', (search) => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    window.location.search = search;
    const html = render();
    expect(html).not.toContain('Por coordinar');
    expect(html).toContain(search.includes('quotes') ? 'Esperando cliente' : 'Por responder');
  });
  it('puts customer waiting between pending and coordination without changing the other filters', () => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    window.location.search = '?open=requests-customer';
    const html = render();
    const tabs = html.slice(html.indexOf('zipco-status-tabs'));
    const positions = ['Pendientes', 'Por responder', 'Coordinación', 'En curso', 'Historial']
      .map((label) => tabs.indexOf(`<span>${label}</span>`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
  it.each(['?open=requests-customer', '?open=requests-business'])('uses the shared compact categories without a scrolling row (%s)', (search) => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    window.location.search = search;
    const html = render();
    const tabs = html.slice(html.indexOf('zipco-status-tabs')).split('</button>')[0];
    expect(tabs).toContain('zipco-status-tab-surface');
    expect(tabs).toContain('zipco-status-tab-count');
    expect(tabs).not.toContain('overflow-x-auto');
    expect(tabs).not.toContain('flex-col');
  });
});
