import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, orders: [] as unknown[], action: vi.fn(), load: vi.fn() }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useEffect: () => undefined,
  useState: (initial: unknown) => {
    const slot = hooks.cursor++;
    if (!(slot in hooks.slots)) hooks.slots[slot] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[slot], (value: unknown) => { hooks.slots[slot] = typeof value === 'function' ? value(hooks.slots[slot]) : value; }];
  },
}));
vi.mock('motion/react', async (original) => ({ ...await original<typeof import('motion/react')>(), useReducedMotion: () => false }));
vi.mock('./requests/useRequests', () => ({ default: () => ({ myOrders: hooks.orders, requests: [], hasBusiness: false,
  isLoading: false, loadError: '', updatingOrderIds: new Set(), loadOrders: hooks.load, performAction: hooks.action }) }));
vi.mock('./quotes/useQuotes', () => ({ default: () => ({ myQuotes: [], businessQuotes: [], isLoading: false,
  loadError: '', updatingIds: new Set(), load: hooks.load }) }));
vi.mock('../notifications/unreadInteractions', () => ({ useUnreadInteractions: () => ({ unread: new Set() }),
  interactionKey: (kind: string, id: number) => `${kind}:${id}`, markInteractionRead: vi.fn(),
  markInteractionUnread: vi.fn(), publishActiveRequestCount: vi.fn() }));
import RequestsScreen from './RequestsScreen';
import ReadyOrdersSummary from './requests/ReadyOrdersSummary';
import RequestStatusTab from './requests/RequestStatusTab';
import { normalizeMyOrdersPayload } from './requests/orderNormalization';
import { coordinationProcess, rawOrder } from './requests/requestProcessFixtures';

type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function nodes(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
}
const render = () => { hooks.cursor = 0; return RequestsScreen({ activeTab: 'requests', setActiveTab: vi.fn(), onBack: vi.fn(), onSessionExpired: vi.fn() }); };
const summary = (root: React.ReactNode) => nodes(root).find((node) => node.type === ReadyOrdersSummary)!;
beforeEach(() => {
  hooks.slots = []; hooks.cursor = 0; hooks.action.mockReset(); hooks.load.mockReset();
  hooks.orders = normalizeMyOrdersPayload([{ ...rawOrder, businessName: 'Negocio de prueba', status: 'ready',
    requestProcess: { ...coordinationProcess, state: 'READY', allowedActions: ['ACK_READY_NOTICE'], readyNoticeAcknowledged: false } }]);
  vi.stubGlobal('React', React); vi.stubGlobal('window', { location: { search: '' } });
  vi.stubGlobal('localStorage', { getItem: () => null }); vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('visible customer ready summary in RequestsScreen', () => {
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
    expect(button.props.className).toContain('from-teal-700 to-emerald-800 text-white');
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
