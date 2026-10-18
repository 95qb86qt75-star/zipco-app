import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as any[], cursor: 0, effects: [] as (() => void)[], dirty: false,
  orders: [] as any[], loading: true, load: vi.fn(), action: vi.fn(), unread: new Set<string>(),
  quotes: [] as any[], focused: vi.fn(), cleanups: [] as (() => void)[] }));
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
import { rawOrder, coordinationProcess } from './requests/requestProcessFixtures';
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
    hooks.effects.forEach((effect) => effect());
  } while (hooks.dirty);
  return result;
}
let mutate: () => void, session: boolean, doc: any, card: any;
beforeEach(() => {
  hooks.slots = []; hooks.effects = []; hooks.cleanups = []; hooks.orders = [];
  hooks.loading = true; hooks.focused.mockReset(); hooks.action.mockReset(); hooks.load.mockReset();
  session = false; mutate = noop;
  doc = Object.assign(new EventTarget(), { documentElement: {}, visibilityState: 'visible', activeElement: null,
    getElementById: vi.fn(() => null) });
  card = { getClientRects: () => [{}], hasAttribute: () => true,
    focus: vi.fn(() => { doc.activeElement = card; }), scrollIntoView: vi.fn(),
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
