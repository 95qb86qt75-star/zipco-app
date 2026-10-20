import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as any[], cursor: 0, effects: [] as (() => void)[], dirty: false,
  orders: [] as any[], loading: true, load: vi.fn(), action: vi.fn(), unread: new Set<string>(),
  quotes: [] as any[], focused: vi.fn(), cleanups: [] as (() => void)[], committed: null as React.ReactNode }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useState: (initial: any) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[index], (value: any) => {
      const next = typeof value === 'function' ? value(hooks.slots[index]) : value;
      if (!Object.is(next, hooks.slots[index])) { hooks.slots[index] = next; hooks.dirty = true; }
    }];
  },
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
    const index = hooks.cursor++, previous = hooks.slots[index];
    if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
      hooks.slots[index] = { deps, cleanup: previous?.cleanup };
      hooks.effects.push(() => {
        hooks.slots[index].cleanup?.();
        const cleanup = effect(); hooks.slots[index].cleanup = cleanup;
        if (cleanup) hooks.cleanups.push(cleanup);
      });
    }
  },
}));
vi.mock('motion/react', async (original) => ({ ...await original<typeof import('motion/react')>(), useReducedMotion: () => false }));
vi.mock('./requests/useRequests', () => ({ default: () => ({ myOrders: hooks.orders, requests: hooks.orders, hasBusiness: true,
  isLoading: hooks.loading, loadError: '', updatingOrderIds: new Set(), loadOrders: hooks.load, performAction: hooks.action }) }));
vi.mock('./quotes/useQuotes', () => ({ default: () => ({ myQuotes: hooks.quotes, businessQuotes: hooks.quotes,
  loading: false, error: '', updating: new Set(), load: hooks.load }) }));
vi.mock('../notifications/unreadInteractions', () => ({ useUnreadInteractions: () => ({ unread: hooks.unread }),
  interactionKey: (kind: string, id: number) => `${kind}:${id}`, markInteractionRead: vi.fn(),
  markInteractionUnread: vi.fn(), publishActiveRequestCount: vi.fn() }));
import RequestsScreen from './RequestsScreen';
import RequestStatusTab from './requests/RequestStatusTab';
import CoordinationOrdersSummary from './requests/CoordinationOrdersSummary';
import ReadyOrdersSummary from './requests/ReadyOrdersSummary';
import BusinessOrdersTab from './requests/BusinessOrdersTab';
import MyOrdersTab from './requests/MyOrdersTab';
import { rawOrder, coordinationProcess, pendingProcess } from './requests/requestProcessFixtures';
import { normalizeMyOrdersPayload } from './requests/orderNormalization';
type Node = React.ReactElement<Record<string, any>>;
function nodes(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => React.isValidElement(child)
    ? [child as Node, ...nodes((child as Node).props.children)] : []);
}
const noop = () => {};
function render() {
  let result: React.ReactNode, count = 0;
  do {
    if (++count > 10) throw new Error('Unexpected render loop');
    hooks.cursor = 0; hooks.dirty = false; hooks.effects = [];
    result = RequestsScreen({ activeTab: 'requests', setActiveTab: noop, onBack: noop,
      onSessionExpired: noop, onNotificationFocused: hooks.focused });
    hooks.committed = result;
    hooks.effects.forEach((effect) => effect());
  } while (hooks.dirty);
  return result;
}
let mutate: () => void, session: boolean, doc: any, card: any;
beforeEach(() => {
  hooks.slots = []; hooks.effects = []; hooks.cleanups = []; hooks.orders = [];
  hooks.quotes = [];
  hooks.loading = true; hooks.focused.mockReset(); hooks.action.mockReset(); hooks.load.mockReset();
  session = false; mutate = noop;
  doc = Object.assign(new EventTarget(), { documentElement: {}, visibilityState: 'visible', activeElement: null,
    getElementById: vi.fn(() => null), querySelector: vi.fn(() => null) });
  card = { getClientRects: () => [{}], hasAttribute: () => true,
    focus: vi.fn(() => { doc.activeElement = card; }), scrollIntoView: vi.fn(), closest: () => null,
    classList: { add: vi.fn(), remove: vi.fn() } };
  class Observer { constructor(callback: () => void) { mutate = callback; } observe() {} disconnect() {} }
  vi.stubGlobal('React', React); vi.stubGlobal('document', doc); vi.stubGlobal('MutationObserver', Observer);
  vi.stubGlobal('window', Object.assign(new EventTarget(), { location: new URL('https://zipco.test/') }));
  vi.stubGlobal('localStorage', { getItem: () => session ? 'synthetic-session-value' : null });
});
afterEach(() => { hooks.cleanups.forEach((cleanup) => cleanup()); vi.unstubAllGlobals(); });

describe('RequestsScreen notification destination with late session and lists', () => {
  it.each([
    ['customer', 'COORDINATION_PENDING', 'accepted', 'coordination'],
    ['customer', 'READY', 'ready', 'ready'],
    ['business', 'COORDINATION_PENDING', 'accepted', 'coordination'],
    ['business', 'READY', 'ready', 'ready'],
  ])('selects and focuses %s/%s only once the requested card is ready', (view, state, status, selectedView) => {
    window.location.search = `?open=requests-${view}&orderId=20`;
    render(); expect(hooks.focused).not.toHaveBeenCalled();
    // Even available records do not consume the destination while loading.
    hooks.orders = normalizeMyOrdersPayload([{ ...rawOrder, status, requestProcess: { ...coordinationProcess, state } }]);
    render(); expect(hooks.focused).not.toHaveBeenCalled();
    hooks.loading = false;
    const result = render();
    const selected = nodes(result).find((node) => node.type === RequestStatusTab && node.props.selected);
    expect(selected?.props.item.key).toBe(selectedView);
    doc.getElementById.mockReturnValue(card); mutate();
    expect(hooks.focused).not.toHaveBeenCalled(); // Session is still absent.
    session = true; mutate();
    expect(card.focus).toHaveBeenCalledOnce();
    expect(hooks.focused).toHaveBeenCalledExactlyOnceWith(window.location.href);
    mutate(); expect(hooks.focused).toHaveBeenCalledOnce();
    expect(hooks.action).not.toHaveBeenCalled();
    expect(window.location.search).toContain('orderId=20'); // Only App may consume after acknowledgement.
  });
});

describe('coordination bell scroll for both roles, independent of notification navigation', () => {
  function prepare(search = '?open=requests-business') {
    window.location.search = search;
    hooks.loading = false;
    hooks.orders = normalizeMyOrdersPayload([
      { ...rawOrder, status: 'accepted', requestProcess: coordinationProcess },
      { ...rawOrder, id: 21, status: 'accepted', requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS' } },
    ]);
    const scroller = { scrollTop: 90, clientTop: 0, scrollHeight: 2000, clientHeight: 600,
      scrollTo(options: ScrollToOptions) { this.scrollTop = options.top!; },
      contains: () => true, getBoundingClientRect: () => ({ top: 200 }) };
    const start = { closest: () => scroller, getBoundingClientRect: () => ({ top: 710 - scroller.scrollTop }) };
    const spacer = { style: { height: '0px' } };
    doc.querySelector = vi.fn((selector) => selector === '[data-summary-scroll-space]' ? spacer :
      nodes(hooks.committed).some((node) => node.props['data-request-results'] !== undefined) ? start : null);
    return scroller;
  }

  it.each(['?open=requests-business', '?open=requests-business-quotes', '?open=requests-customer', '?open=requests-customer-quotes'])(
    'commits the coordination filter before scrolling from %s and repeats only on another bell click', (search) => {
      const scroller = prepare(search);
      const clickBell = () => (nodes(render()).find((node) => node.type === CoordinationOrdersSummary)!.props.onSelect)();
      clickBell();
      expect(scroller.scrollTop).toBe(90); // No scroll against the old filtered list.
      const selected = render();
      expect(scroller.scrollTop).toBe(498); // Start at 212, below the fixed header.
      const business = search.includes('business');
      const orders = nodes(selected).find((node) => node.type === (business ? BusinessOrdersTab : MyOrdersTab))!;
      expect((business ? orders.props.requests : orders.props.myOrders).map((order: { id: number }) => order.id)).toEqual([20]);
      expect(nodes(selected).find((node) => node.type === CoordinationOrdersSummary)?.props.selected).toBe(true);
      scroller.scrollTop = 60; render();
      expect(scroller.scrollTop).toBe(60); // No continuing repositioning.
      clickBell(); render();
      expect(scroller.scrollTop).toBe(498);
      expect(hooks.focused).not.toHaveBeenCalled();
      expect(card.focus).not.toHaveBeenCalled();
      expect(hooks.action).not.toHaveBeenCalled();
      expect(hooks.load).not.toHaveBeenCalled();
      expect(window.location.search).toBe(search); // No external destination, URL or ACK.
    },
  );

  it.each(['?open=requests-business', '?open=requests-customer'])('waits for an intervening list load without repeating on refresh in %s', (search) => {
    const scroller = prepare(search);
    nodes(render()).find((node) => node.type === CoordinationOrdersSummary)!.props.onSelect();
    hooks.loading = true; render();
    expect(scroller.scrollTop).toBe(90);
    hooks.loading = false; render();
    expect(scroller.scrollTop).toBe(498);
    scroller.scrollTop = 45;
    hooks.loading = true; render(); hooks.loading = false; render();
    expect(scroller.scrollTop).toBe(45);
  });

  it('cancels pending scroll when another category is chosen during loading', () => {
    const scroller = prepare();
    nodes(render()).find((node) => node.type === CoordinationOrdersSummary)!.props.onSelect();
    hooks.loading = true;
    const view = render();
    nodes(view).find((node) => node.type === RequestStatusTab && node.props.item.key === 'active')!.props.onSelect();
    render(); hooks.loading = false; render();
    expect(scroller.scrollTop).toBe(90);
  });

  it('does not transfer a pending business scroll to the customer role', () => {
    const scroller = prepare();
    nodes(render()).find((node) => node.type === CoordinationOrdersSummary)!.props.onSelect();
    hooks.loading = true;
    const view = render();
    nodes(view).find((node) => node.type === 'button' && nodes(node).some((child) =>
      child.type === 'span' && child.props.children === 'Mis Pedidos'))!.props.onClick();
    render(); hooks.loading = false; render();
    expect(scroller.scrollTop).toBe(90);
  });

  it.each([
    ['1 Nuevo Pedido', 'pending'], ['1 pedido en curso', 'active'],
    ['1 pedido listo y notificado', 'ready'], ['1 pedido esperando al cliente', 'waiting'],
  ])('selects and scrolls the business %s bell without performing an action', (label, view) => {
    const scroller = prepare();
    hooks.orders = normalizeMyOrdersPayload([
      { ...rawOrder, status: 'pending', requestProcess: pendingProcess },
      { ...rawOrder, id: 21, status: 'accepted', requestProcess: coordinationProcess },
      { ...rawOrder, id: 22, status: 'accepted', requestProcess: { ...coordinationProcess, state: 'IN_PROGRESS' } },
      { ...rawOrder, id: 23, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY' } },
      { ...rawOrder, id: 24, status: 'alternative_proposed' },
    ]);
    nodes(render()).find((node) => node.props.onClick && nodes(node).some((child) => child.props.children === label))!.props.onClick();
    const result = render();
    expect(nodes(result).find((node) => node.type === RequestStatusTab && node.props.selected)?.props.item.key).toBe(view);
    expect(scroller.scrollTop).toBe(498);
    expect(hooks.load).not.toHaveBeenCalled(); expect(hooks.action).not.toHaveBeenCalled();
  });

  it('scrolls the customer ready bell, including a repeated click, without acknowledging receipt', () => {
    const scroller = prepare('?open=requests-customer');
    hooks.orders = normalizeMyOrdersPayload([{ ...rawOrder, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY' } }]);
    const click = () => nodes(render()).find((node) => node.type === ReadyOrdersSummary)!.props.onToggle();
    click(); render(); expect(scroller.scrollTop).toBe(498);
    scroller.scrollTop = 0; click(); render(); expect(scroller.scrollTop).toBe(498);
    expect(hooks.action).not.toHaveBeenCalled(); expect(hooks.focused).not.toHaveBeenCalled();
  });

  it('scrolls a customer response bell without consuming the response', () => {
    const scroller = prepare('?open=requests-customer');
    hooks.unread.add('order:20');
    nodes(render()).find((node) => node.props.onClick && nodes(node).some((child) =>
      child.props.children === '1 nueva respuesta del negocio'))!.props.onClick();
    render(); expect(scroller.scrollTop).toBe(498);
    expect(hooks.action).not.toHaveBeenCalled(); expect(hooks.focused).not.toHaveBeenCalled();
    expect(hooks.unread.has('order:20')).toBe(true);
  });

  it('scrolls the customer quote ready summary without performing a confirmation', () => {
    const scroller = prepare('?open=requests-customer-quotes');
    hooks.quotes = [{ id: 50, status: 'ready' }];
    nodes(render()).find((node) => node.type === ReadyOrdersSummary)!.props.onToggle();
    render(); expect(scroller.scrollTop).toBe(498);
    expect(hooks.load).not.toHaveBeenCalled(); expect(hooks.action).not.toHaveBeenCalled();
  });

  it.each([
    ['1 cotización nueva', 'pending'], ['1 cotización esperando al cliente', 'waiting'],
    ['1 cotización en curso', 'active'], ['1 cotización lista y notificada', 'ready'],
  ])('scrolls business quote summary %s without loading orders', (label, view) => {
    const scroller = prepare('?open=requests-business-quotes');
    hooks.quotes = ['requested', 'quoted', 'accepted', 'ready'].map((status, index) => ({ id: 50 + index, status }));
    nodes(render()).find((node) => node.props.onClick && nodes(node).some((child) => child.props.children === label))!.props.onClick();
    const result = render();
    expect(nodes(result).find((node) => node.type === RequestStatusTab && node.props.selected)?.props.item.key).toBe(view);
    expect(scroller.scrollTop).toBe(498);
    expect(hooks.load).not.toHaveBeenCalled(); expect(hooks.action).not.toHaveBeenCalled();
  });
});
