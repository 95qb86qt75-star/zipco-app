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
  it('keeps legacy QA responses without a coordination group', () => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted' }]);
    const html = render();
    expect(html).toContain('En curso'); expect(html).not.toContain('Coordinación');
    expect(html).toContain('Continúa con la preparación del pedido.');
  });
  it('adds the coordination group without creating a preparation activity for 2A', () => {
    state.requests = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    const html = render();
    expect(html).toContain('Coordinación');
    expect(html).not.toContain('Continúa con la preparación del pedido.');
  });
});
