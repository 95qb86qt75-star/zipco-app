import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessNotificationMonitor from './BusinessNotificationMonitor';
import { showAppToast } from '../screens/Toast';
import { orderNotificationState } from '../screens/requests/requestProcess';
import { publishActiveRequestCount, markInteractionUnread } from './unreadInteractions';
import { pendingProcess, coordinationProcess } from '../screens/requests/requestProcessFixtures';

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
    if (url.endsWith('/orders/my-orders')) return new Response(JSON.stringify([serverOrder]));
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

describe('monitor acceptance flow across service worker and polling', () => {
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
});
