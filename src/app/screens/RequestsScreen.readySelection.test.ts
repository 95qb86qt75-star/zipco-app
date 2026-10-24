vi.mock('./requests/useReadyTransitions', () => ({ default: () => ({ chipBump:false, tip:false }) }));
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, orders: [] as unknown[], action: vi.fn(), load: vi.fn(),
  unread: new Set<string>(), loading: false, error: '', businessOrders: [] as unknown[], hasBusiness: false }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useEffect: () => undefined,
  useState: (initial: unknown) => {
    const slot = hooks.cursor++;
    if (!(slot in hooks.slots)) hooks.slots[slot] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[slot], (value: unknown) => { hooks.slots[slot] = typeof value === 'function' ? value(hooks.slots[slot]) : value; }];
  },
}));
vi.mock('motion/react', async (original) => ({ ...await original<typeof import('motion/react')>(), useReducedMotion: () => false }));
vi.mock('./requests/useRequests', () => ({ default: () => ({ myOrders: hooks.orders, requests: hooks.businessOrders, hasBusiness: hooks.hasBusiness,
  isLoading: hooks.loading, loadError: hooks.error, updatingOrderIds: new Set(), loadOrders: hooks.load, performAction: hooks.action }) }));
vi.mock('./quotes/useQuotes', () => ({ default: () => ({ myQuotes: [], businessQuotes: [], isLoading: false,
  loadError: '', updatingIds: new Set(), load: hooks.load }) }));
vi.mock('../notifications/unreadInteractions', () => ({ useUnreadInteractions: () => ({ unread: hooks.unread }),
  interactionKey: (kind: string, id: number) => `${kind}:${id}`, markInteractionRead: vi.fn(),
  markInteractionUnread: vi.fn(), publishActiveRequestCount: vi.fn() }));
import RequestsScreen from './RequestsScreen';
import ReadyOrdersSummary from './requests/ReadyOrdersSummary';
import CoordinationOrdersSummary from './requests/CoordinationOrdersSummary';
import MyOrdersTab from './requests/MyOrdersTab';
import BusinessOrdersTab from './requests/BusinessOrdersTab';
import RequestStatusTab from './requests/RequestStatusTab';
import { normalizeMyOrdersPayload, normalizeBusinessOrdersPayload } from './requests/orderNormalization';
import { coordinationProcess, rawOrder } from './requests/requestProcessFixtures';
import AcceptedProposalHost from './requests/AcceptedProposalHost';

type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function nodes(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
}
const render = () => { hooks.cursor = 0; return RequestsScreen({ activeTab: 'requests', setActiveTab: vi.fn(), onBack: vi.fn(), onSessionExpired: vi.fn() }); };
const summary = (root: React.ReactNode) => nodes(root).find((node) => node.type === ReadyOrdersSummary)!;
beforeEach(() => {
  hooks.slots = []; hooks.cursor = 0; hooks.action.mockReset(); hooks.load.mockReset();
  hooks.unread = new Set(); hooks.loading = false; hooks.error = '';
  hooks.businessOrders = []; hooks.hasBusiness = false;
  hooks.orders = normalizeMyOrdersPayload([{ ...rawOrder, businessName: 'Negocio de prueba', status: 'ready',
    requestProcess: { ...coordinationProcess, state: 'READY', allowedActions: ['ACK_READY_NOTICE'], readyNoticeAcknowledged: false } }]);
  vi.stubGlobal('React', React); vi.stubGlobal('window', { location: { search: '' } });
  vi.stubGlobal('localStorage', { getItem: () => null }); vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('visible customer ready summary in RequestsScreen', () => {
  it('shows pending business counts during load and updates them without selecting a bell', () => {
    hooks.hasBusiness = true; hooks.orders = []; hooks.loading = true;
    const businessButton = nodes(render()).find(node => node.type === 'button' && nodes(node.props.children).length > 0 &&
      React.Children.toArray(node.props.children).includes('Mi Negocio'))!;
    (businessButton.props.onClick as () => void)();
    const tabs = () => nodes(render()).filter(node => node.type === RequestStatusTab);
    expect(tabs().length).toBeGreaterThan(0);
    expect(tabs().every(node => node.props.countState === 'loading')).toBe(true);
    hooks.businessOrders = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    hooks.loading = false;
    expect(tabs().every(node => node.props.countState === undefined)).toBe(true);
    expect(tabs().find(node => (node.props.item as { key: string }).key === 'coordination')?.props.item).toMatchObject({ count: 1 });
    expect(tabs().find(node => (node.props.item as { key: string }).key === 'pending')?.props.item).toMatchObject({ count: 0 });
    hooks.error = 'No se pudo leer';
    expect(tabs().every(node => node.props.countState === 'unavailable')).toBe(true);
    expect(hooks.action).not.toHaveBeenCalled(); expect(hooks.load).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('selects Coordination after confirmed proposal acceptance for either actor, with no authorization from navigation', () => {
    hooks.hasBusiness = true;
    hooks.orders = normalizeMyOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    hooks.businessOrders = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    const accept = (business: boolean) => {
      const host = nodes(render()).find(node => node.type === AcceptedProposalHost)!;
      (host.props.onAccepted as (business: boolean) => void)(business);
      const screen = render();
      expect(nodes(screen).find(node => node.type === RequestStatusTab && (node.props.item as { key: string }).key === 'coordination')?.props.selected).toBe(true);
      expect(nodes(screen).some(node => node.type === (business ? BusinessOrdersTab : MyOrdersTab))).toBe(true);
    };
    accept(false); accept(true);
    expect(fetch).not.toHaveBeenCalled(); expect(hooks.action).not.toHaveBeenCalled();
  });
  it('shows the business Por coordinar bell, selects that category and filters its orders without executing actions', () => {
    hooks.hasBusiness = true;
    hooks.businessOrders = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess },
      { ...rawOrder, id: 21, status: 'accepted', requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS' } }]);
    vi.stubGlobal('window', { location: { search: '?open=requests-business' } });
    const card = nodes(render()).find((node) => node.type === CoordinationOrdersSummary)!;
    expect(card.props).toMatchObject({ business: true, count: 1, selected: false });
    (card.props.onSelect as () => void)();
    const selected = render();
    expect(nodes(selected).find((node) => node.type === CoordinationOrdersSummary)?.props.selected).toBe(true);
    expect(nodes(selected).find((node) => node.type === RequestStatusTab && (node.props.item as { key: string }).key === 'coordination')?.props.selected).toBe(true);
    const list = nodes(selected).find((node) => node.type === BusinessOrdersTab)!;
    expect((list.props.requests as Array<{ id: number }>).map((order) => order.id)).toEqual([20]);
    expect(hooks.action).not.toHaveBeenCalled(); expect(hooks.load).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps the business bell after reading/consent and hides it only when its category becomes empty', () => {
    hooks.hasBusiness = true; hooks.orders = [];
    vi.stubGlobal('window', { location: { search: '?open=requests-business' } });
    const input = { ...rawOrder, status: 'accepted', requestProcess: coordinationProcess };
    hooks.businessOrders = normalizeBusinessOrdersPayload([input, { ...input, id: 21, requestProcess: { ...coordinationProcess, state: 'COORDINATING' } }]);
    const card = () => nodes(render()).find((node) => node.type === CoordinationOrdersSummary);
    expect(card()?.props.count).toBe(2); hooks.unread.add('order:20'); hooks.unread.clear(); expect(card()?.props.count).toBe(2);
    hooks.businessOrders = normalizeBusinessOrdersPayload([{ ...input, requestProcess: { ...coordinationProcess,
      coordination: { customerContactAuthorized: true, businessContactAuthorized: false } } },
      { ...input, id: 21, requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS' } }]);
    expect(card()?.props.count).toBe(1);
    hooks.businessOrders = normalizeBusinessOrdersPayload([{ ...input, requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS' } }]);
    expect(card()).toBeUndefined(); expect(hooks.action).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('does not use stale business data for its coordination bell during load or error', () => {
    hooks.hasBusiness = true;
    hooks.businessOrders = normalizeBusinessOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    vi.stubGlobal('window', { location: { search: '?open=requests-business' } });
    const visible = () => nodes(render()).some((node) => node.type === CoordinationOrdersSummary);
    expect(visible()).toBe(true); hooks.loading = true; expect(visible()).toBe(false);
    hooks.loading = false; hooks.error = 'Error de lectura'; expect(visible()).toBe(false);
  });
  it('adds a persistent coordination bell alongside Listos and selects only the coordination category', () => {
    hooks.orders.push(...normalizeMyOrdersPayload([{ ...rawOrder, id: 21, status: 'accepted', requestProcess: coordinationProcess }]));
    const view = render();
    expect(nodes(view).filter((node) => node.type === ReadyOrdersSummary)).toHaveLength(1);
    const card = nodes(view).find((node) => node.type === CoordinationOrdersSummary)!;
    expect(card.props.count).toBe(1); (card.props.onSelect as () => void)();
    const selected = render();
    expect(nodes(selected).find((node) => node.type === CoordinationOrdersSummary)?.props.selected).toBe(true);
    expect(summary(selected).props.selected).toBe(false);
    expect(nodes(selected).find((node) => node.type === RequestStatusTab && (node.props.item as { key: string }).key === 'coordination')?.props.selected).toBe(true);
    const list = nodes(selected).find((node) => node.type === MyOrdersTab)!;
    expect((list.props.myOrders as Array<{ id: number }>).map((order) => order.id)).toEqual([21]);
    expect(hooks.action).not.toHaveBeenCalled(); expect(hooks.load).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('survives reading and authorizing contact, reduces its count as orders leave coordination and hides at zero', () => {
    const pending = { ...rawOrder, status: 'accepted', requestProcess: coordinationProcess };
    hooks.orders = normalizeMyOrdersPayload([pending, { ...pending, id: 21, requestProcess: { ...coordinationProcess, state: 'COORDINATING' } }]);
    hooks.unread.add('order:20');
    const count = () => nodes(render()).find((node) => node.type === CoordinationOrdersSummary)?.props.count;
    expect(count()).toBe(2); hooks.unread.clear(); expect(count()).toBe(2);
    hooks.orders = normalizeMyOrdersPayload([{ ...pending, requestProcess: { ...coordinationProcess, coordination: {
      customerContactAuthorized: true, businessContactAuthorized: false } } }, { ...pending, id: 21, requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS' } }]);
    expect(count()).toBe(1);
    hooks.orders = normalizeMyOrdersPayload([{ ...pending, status: 'cancelled', requestProcess: { ...coordinationProcess, state: 'COORDINATION_CANCELLED' } }]);
    expect(count()).toBeUndefined();
    expect(hooks.action).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('does not present old coordination data as a fallback during load or error, or display the customer card in business view', () => {
    hooks.orders = normalizeMyOrdersPayload([{ ...rawOrder, status: 'accepted', requestProcess: coordinationProcess }]);
    const visible = () => nodes(render()).some((node) => node.type === CoordinationOrdersSummary);
    expect(visible()).toBe(true); hooks.loading = true; expect(visible()).toBe(false);
    hooks.loading = false; hooks.error = 'Error de lectura'; expect(visible()).toBe(false);
    hooks.error = ''; hooks.slots = []; vi.stubGlobal('window', { location: { search: '?open=requests-business' } });
    expect(visible()).toBe(false);
  });
  it('selects the visible ready card and changes its color without performing an order action', () => {
    let view = render();
    expect(nodes(view).filter((node) => node.type === ReadyOrdersSummary)).toHaveLength(1);
    let card = summary(view);
    expect(card.props).toMatchObject({ count: 1, kind: 'orders', selected: false });
    (card.props.onToggle as () => void)();
    view = render(); card = summary(view);
    expect(card.props.selected).toBe(true);
    const button = ReadyOrdersSummary(card.props as React.ComponentProps<typeof ReadyOrdersSummary>);
    expect(button.props['aria-pressed']).toBe(true);
    expect(button.props.className).toContain('from-orange-500 to-amber-500 text-white');
    const readyTab = nodes(view).find((node) => node.type === RequestStatusTab && (node.props.item as { key: string }).key === 'ready')!;
    expect(readyTab.props.selected).toBe(true);
    expect(hooks.action).not.toHaveBeenCalled(); expect(hooks.load).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('clears the card highlight when browsing another category and restores it when selecting the card again', () => {
    (summary(render()).props.onToggle as () => void)();
    const view = render();
    const pendingTab = nodes(view).find((node) => node.type === RequestStatusTab && (node.props.item as { key: string }).key === 'pending')!;
    (pendingTab.props.onSelect as () => void)();
    expect(summary(render()).props.selected).toBe(false);
    (summary(render()).props.onToggle as () => void)();
    expect(summary(render()).props.selected).toBe(true);
  });
});
