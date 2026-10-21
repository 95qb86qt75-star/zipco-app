import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessNotificationMonitor from './BusinessNotificationMonitor';
import { showAppToast } from '../screens/Toast';
import { orderNotificationState } from '../screens/requests/requestProcess';
import { publishActiveRequestCount, markInteractionUnread } from './unreadInteractions';
import { pendingProcess, coordinationProcess } from '../screens/requests/requestProcessFixtures';
import { cancelledPendingOrder } from '../screens/requests/pendingCancellationFixtures';
import { proposalsFixture } from '../screens/requests/proposalFixtures';
import { normalizeRequestProcess } from '../screens/requests/requestProcess';
import { rememberOpenedPresentation } from './notificationDelivery';

const runtime = vi.hoisted(() => ({ cleanup: undefined as undefined | (() => void) }));
// Exercise the monitor's real effect, event listeners and timers without adding a DOM dependency.
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useRef: (value: unknown) => ({ current: value }),
  useEffect: (effect: () => void | (() => void)) => { runtime.cleanup = effect() || undefined; },
}));
vi.mock('../screens/Toast', () => ({ showAppToast: vi.fn() }));
vi.mock('./pushNotifications', () => ({ updatePushPresence: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./unreadInteractions', () => ({
  markInteractionUnread: vi.fn(), publishActiveRequestCount: vi.fn(), publishUnreadCount: vi.fn(),
}));

const pending = { id: 20, status: 'pending', requestProcess: pendingProcess };
const accepted = { id: 20, status: 'accepted', requestProcess: coordinationProcess };
let serverOrder: typeof pending | { id: number; status: string };
let serviceWorker: EventTarget;
const tick = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers(); vi.mocked(showAppToast).mockClear();
  serverOrder = pending;
  serviceWorker = new EventTarget();
  const windowEvents = Object.assign(new EventTarget(), {
    location: { origin: 'https://zipco.test', search: '' },
    setInterval: (...args: Parameters<typeof setInterval>) => setInterval(...args),
    clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
  });
  vi.stubGlobal('window', windowEvents);
  vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }));
  vi.stubGlobal('navigator', { serviceWorker });
  vi.stubGlobal('CustomEvent', class extends Event {
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) { super(type); this.detail = init?.detail; }
  });
  const values = new Map<string, string>([['zipco-token', 'test-session']]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/orders/my-orders?processContract=alternatives-v1')) return new Response(JSON.stringify([serverOrder]));
    if (url.endsWith('/quotes/my-quotes')) return new Response('[]');
    throw new Error('Unexpected test request');
  }));
});
afterEach(() => {
  runtime.cleanup?.(); runtime.cleanup = undefined;
  vi.useRealTimers(); vi.unstubAllGlobals();
});

async function mount(initial: typeof serverOrder = pending) {
  serverOrder = initial;
  localStorage.setItem('zipco-request-status-snapshot-v1', JSON.stringify({
    customerOrders: [[20, orderNotificationState(initial)]], customerQuotes: [],
  }));
  BusinessNotificationMonitor({ onSessionExpired: vi.fn() });
  await tick();
  expect(showAppToast).not.toHaveBeenCalled();
}
function push(data: unknown = { type: 'ORDER_ACCEPTED', orderId: 20, title: 'Old', body: 'Preparando pedido' }) {
  serviceWorker.dispatchEvent(new MessageEvent('message', { data }));
}
function expectCoordinationOnce() {
  expect(showAppToast).toHaveBeenCalledTimes(1);
  expect(showAppToast).toHaveBeenCalledWith('', 'info', expect.objectContaining({
    title: 'Pedido aceptado',
    description: 'El negocio aceptó tu pedido. Falta coordinar los siguientes pasos.',
  }));
  expect(JSON.stringify(vi.mocked(showAppToast).mock.calls)).not.toContain('Preparando pedido');
}

function businessServer(initial: Array<{ id: number; status: string }>) {
  let orders = initial;
  localStorage.setItem('zipco-business-id', '42');
  localStorage.setItem('zipco-request-status-snapshot-v1', JSON.stringify({ customerOrders: [], customerQuotes: [] }));
  vi.mocked(fetch).mockImplementation(async (url) => new Response(JSON.stringify(
    String(url).endsWith('/orders/business/42?processContract=alternatives-v1') ? orders : [],
  )));
  return { setOrders: (next: typeof orders) => { orders = next; } };
}

describe('monitor acceptance flow across service worker and polling', () => {
  it('suppresses an opened proposal while updating counts, then announces a distinct final proposal and READY', async () => {
    await mount({ id: 20, status: 'pending', requestProcess: pendingProcess });
    serverOrder = { id: 20, status: 'alternative_proposed', requestProcess: normalizeRequestProcess(proposalsFixture(1, false).process)! };
    rememberOpenedPresentation('requests-customer:order-20-proposal-124-propose-alternative');
    push({ type: 'order-proposal-event', orderId: 20 }); await tick();
    expect(showAppToast).not.toHaveBeenCalled(); expect(publishActiveRequestCount).toHaveBeenLastCalledWith(1);
    serverOrder = { ...serverOrder, requestProcess: normalizeRequestProcess(proposalsFixture(3, false).process)! };
    push({ type: 'order-proposal-event', orderId: 20 }); await tick();
    expect(showAppToast).toHaveBeenCalledWith('', 'info', expect.objectContaining({ dedupeKey: 'order-20-proposal-126-propose-final' }));
    vi.mocked(showAppToast).mockClear();
    serverOrder = { ...serverOrder, status: 'ready', requestProcess: { ...serverOrder.requestProcess!, state: 'READY', agreementPublicId: 'agreement' } };
    push(); await tick(); expect(showAppToast).toHaveBeenCalledWith('', 'info', expect.objectContaining({ title: 'Tu pedido está listo' }));
  });
  it('announces the customer counter to business without replaying its own proposal', async () => {
    const first = { id: 20, status: 'alternative_proposed', requestProcess: normalizeRequestProcess(proposalsFixture(1).process)! };
    const server = businessServer([first]); BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(showAppToast).not.toHaveBeenCalled();
    server.setOrders([{ ...first, requestProcess: normalizeRequestProcess(proposalsFixture(2).process)! }]);
    push({ type: 'order-proposal-event', orderId: 20 }); await tick();
    expect(showAppToast).toHaveBeenCalledExactlyOnceWith('', 'info', expect.objectContaining({ dedupeKey: 'order-20-proposal-125-counter-proposal' }));
  });
  it('updates business counts after customer pending cancellation without a new internal notice', async () => {
    const server = businessServer([pending]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    vi.mocked(showAppToast).mockClear(); vi.mocked(markInteractionUnread).mockClear();
    server.setOrders([cancelledPendingOrder]);
    document.dispatchEvent(new Event('visibilitychange')); await tick();
    expect(publishActiveRequestCount).toHaveBeenLastCalledWith(0);
    expect(showAppToast).not.toHaveBeenCalled(); expect(markInteractionUnread).not.toHaveBeenCalled();
  });
  it('does not announce old pending business orders when opening a different order from a system notification', async () => {
    localStorage.setItem('zipco-business-id', '42');
    localStorage.setItem('zipco-request-status-snapshot-v1', JSON.stringify({ customerOrders: [], customerQuotes: [] }));
    window.location.search = '?open=requests-business&orderId=92&notificationEvent=requests-business%3Aorder-92-created';
    vi.mocked(fetch).mockImplementation(async (url) => new Response(JSON.stringify(
      String(url).endsWith('/orders/business/42?processContract=alternatives-v1') ? [{ id: 91, status: 'pending' }, { id: 92, status: 'pending' }] : [],
    )));
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(publishActiveRequestCount).toHaveBeenCalledWith(2);
    expect(showAppToast).not.toHaveBeenCalled();
  });
  it('announces a genuinely new business order after the silent initial baseline and keeps counts current', async () => {
    const server = businessServer([{ id: 101, status: 'pending' }]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(showAppToast).not.toHaveBeenCalled();
    server.setOrders([{ id: 101, status: 'pending' }, { id: 102, status: 'pending' }]);
    push({ type: 'new-order', orderId: 102 }); await tick();
    expect(showAppToast).toHaveBeenCalledExactlyOnceWith('', 'info', expect.objectContaining({
      title: 'Nuevo pedido recibido', dedupeKey: 'order-102-created', actionUrl: '/?open=requests-business&orderId=102',
    }));
    expect(publishActiveRequestCount).toHaveBeenCalledWith(2);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(showAppToast).toHaveBeenCalledOnce();
  });
  it('preserves an explicit new-order push during the first read without announcing the other pending orders', async () => {
    businessServer([{ id: 111, status: 'pending' }, { id: 112, status: 'pending' }]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() });
    push({ type: 'new-order', orderId: 112 }); await tick();
    expect(showAppToast).toHaveBeenCalledExactlyOnceWith('', 'info', expect.objectContaining({ dedupeKey: 'order-112-created' }));
    await vi.advanceTimersByTimeAsync(15_000); expect(showAppToast).toHaveBeenCalledOnce();
  });
  it('does not treat a consent push as evidence that pending orders are new', async () => {
    businessServer([{ id: 113, status: 'pending' }, { id: 114, status: 'pending' }]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() });
    push({ type: 'order-contact-authorized', orderId: 114 }); await tick();
    expect(showAppToast).not.toHaveBeenCalled();
  });
  it('restores the business baseline after remount instead of replaying all pending orders', async () => {
    const server = businessServer([{ id: 103, status: 'pending' }]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    const saved = JSON.parse(localStorage.getItem('zipco-request-status-snapshot-v1')!);
    expect(saved.business).toEqual({ id: '42', orders: [[103, 'pending']], quotes: [] });
    runtime.cleanup?.();
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(showAppToast).not.toHaveBeenCalled();
    runtime.cleanup?.(); server.setOrders([{ id: 103, status: 'pending' }, { id: 104, status: 'pending' }]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(showAppToast).toHaveBeenCalledExactlyOnceWith('', 'info', expect.objectContaining({ dedupeKey: 'order-104-created' }));
  });
  it('opens a new system-presented order after remount without replaying that order or older pending ones', async () => {
    const server = businessServer([{ id: 105, status: 'pending' }]);
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick(); runtime.cleanup?.();
    server.setOrders([{ id: 105, status: 'pending' }, { id: 106, status: 'pending' }]);
    window.location.search = '?open=requests-business&orderId=106&notificationEvent=requests-business%3Aorder-106-created';
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(showAppToast).not.toHaveBeenCalled();
    expect(publishActiveRequestCount).toHaveBeenCalledWith(2);
    window.location.search = '';
    server.setOrders([{ id: 105, status: 'pending' }, { id: 106, status: 'pending' }, { id: 107, status: 'pending' }]);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(showAppToast).toHaveBeenCalledExactlyOnceWith('', 'info', expect.objectContaining({ dedupeKey: 'order-107-created' }));
  });
  it.each([
    { id: 'another-business', orders: [], quotes: [] },
    { id: '42', orders: [[null, 'pending']], quotes: [] },
  ])('does not trust another business or malformed business snapshot as an empty baseline', async (business) => {
    businessServer([{ id: 108, status: 'pending' }]);
    localStorage.setItem('zipco-request-status-snapshot-v1', JSON.stringify({ customerOrders: [], customerQuotes: [], business }));
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(showAppToast).not.toHaveBeenCalled();
  });
  it('does not establish an empty business baseline from an invalid list response', async () => {
    businessServer([{ id: 109, status: 'pending' }]);
    vi.mocked(fetch).mockResolvedValue(new Response('{"invalid":true}'));
    BusinessNotificationMonitor({ onSessionExpired: vi.fn() }); await tick();
    expect(JSON.parse(localStorage.getItem('zipco-request-status-snapshot-v1')!).business).toBeUndefined();
    vi.mocked(fetch).mockImplementation(async (url) => new Response(JSON.stringify(
      String(url).endsWith('/orders/business/42?processContract=alternatives-v1') ? [{ id: 109, status: 'pending' }] : [],
    )));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(showAppToast).not.toHaveBeenCalled();
    expect(publishActiveRequestCount).toHaveBeenCalledWith(1);
  });
  it('refreshes after a push before selecting the approved 2A copy', async () => {
    await mount(); serverOrder = accepted; push(); await tick(); expectCoordinationOnce();
  });
  it('announces coordination through polling with no push', async () => {
    await mount(); serverOrder = accepted;
    await vi.advanceTimersByTimeAsync(15_000); expectCoordinationOnce();
  });
  it('deduplicates push plus polling plus returning to foreground', async () => {
    await mount(); serverOrder = accepted;
    vi.advanceTimersByTime(15_000); push(); document.dispatchEvent(new Event('visibilitychange'));
    await tick(); expectCoordinationOnce();
    push(); await vi.advanceTimersByTimeAsync(15_000); expectCoordinationOnce();
  });
  it('retains the legacy order notice after updating its data', async () => {
    await mount({ id: 20, status: 'pending' }); serverOrder = { id: 20, status: 'accepted' };
    push(); await tick();
    expect(showAppToast).toHaveBeenCalledOnce();
    expect(showAppToast).toHaveBeenCalledWith('', 'info', expect.objectContaining({
      title: 'Pedido aceptado', description: 'El negocio acepto tu pedido.',
    }));
  });
  it('never echoes unknown payload messages or links', async () => {
    await mount();
    push({ type: 'UNKNOWN', title: 'internal', body: 'internal', url: 'https://unknown.test' });
    await tick(); expect(showAppToast).not.toHaveBeenCalled();
  });
  it('suppresses a system-presented acceptance but refreshes counts and announces later READY', async () => {
    await mount(); serverOrder = accepted;
    const refresh = vi.fn(); window.addEventListener('zipco-requests-refresh', refresh);
    push({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED', eventKey: 'requests-customer:order-20-accepted' });
    await tick();
    expect(showAppToast).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    expect(markInteractionUnread).toHaveBeenCalledWith('order', 20);
    expect(publishActiveRequestCount).toHaveBeenCalledWith(1);
    serverOrder = { ...accepted, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY', version: 4 } };
    push({ type: 'order-ready', orderId: 20 }); await tick();
    expect(showAppToast).toHaveBeenCalledOnce();
    expect(showAppToast).toHaveBeenCalledWith('', 'info', expect.objectContaining({ title: 'Tu pedido está listo' }));
  });
  it('does not invent a navigation destination on an ordinary return to foreground', async () => {
    await mount(); serverOrder = { id: 99, status: 'ready' };
    const navigate = vi.fn(); window.addEventListener('zipco-notification-open', navigate);
    document.dispatchEvent(new Event('visibilitychange')); await tick();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('refreshes the business lists and count after contact authorization without replaying push copy', async () => {
    localStorage.setItem('zipco-business-id', '42');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (url) => new Response(JSON.stringify(
      String(url).endsWith('/orders/business/42?processContract=alternatives-v1') ? [{ id: 66, status: 'accepted', requestProcess: coordinationProcess }] : [],
    )));
    await mount();
    const refresh = vi.fn(); window.addEventListener('zipco-requests-refresh', refresh);
    const before = fetchMock.mock.calls.length;
    push({ type: 'order-contact-authorized', orderId: 66,
      tag: 'order-66-coordination-contact-authorized', title: 'push-copy-must-not-replay' });
    await tick();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
    expect(refresh).toHaveBeenCalled();
    expect(publishActiveRequestCount).toHaveBeenCalledWith(1);
    expect(showAppToast).not.toHaveBeenCalled();
  });
});
