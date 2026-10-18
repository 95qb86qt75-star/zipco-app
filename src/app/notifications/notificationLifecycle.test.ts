import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNotificationNavigation, parseNotificationTarget, waitForNotificationCard } from './notificationNavigation';
import { presentationKey, readSystemPresentations, PRESENTATION_CACHE, PRESENTATION_PATH } from './notificationDelivery';
import { customerOrderNotice } from './orderNotice';
import { coordinationProcess } from '../screens/requests/requestProcessFixtures';
import { statusViewFor } from '../screens/requests/requestStatusGrouping';

const origin = 'https://zipco.test';
const workerSource = readFileSync(new URL('../../../public/push-sw.js', import.meta.url), 'utf8');
function memoryCaches() {
  const stores = new Map<string, Map<string, Response>>();
  return { open: async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    const key = (request: Request | string) => typeof request === 'string' ? request : request.url;
    return {
      match: async (request: Request | string) => store.get(key(request))?.clone(),
      put: async (request: Request | string, response: Response) => { store.set(key(request), response.clone()); },
      delete: async (request: Request | string) => store.delete(key(request)),
    };
  } };
}
function worker(userAgent = 'Android', existingClients: any[] = [], cache = memoryCaches()) {
  const listeners = new Map<string, (event: any) => void>();
  const client = { postMessage: vi.fn(), focus: vi.fn(async () => client) };
  const registration = { showNotification: vi.fn(async () => {}) };
  const clients = { matchAll: vi.fn(async () => existingClients), openWindow: vi.fn(async () => client) };
  runInNewContext(workerSource, {
    self: { location: { origin }, navigator: { userAgent }, registration, clients,
      addEventListener: (type: string, callback: (event: any) => void) => listeners.set(type, callback) },
    caches: cache, URL, Request, Response, Date, setTimeout: (fn: () => void) => { queueMicrotask(fn); },
  });
  return { cache, client, clients, registration,
    async fire(type: string, payload: Record<string, unknown>) {
      let work: Promise<unknown> = Promise.resolve();
      listeners.get(type)!({ ...payload, waitUntil: (promise: Promise<unknown>) => { work = promise; } });
      await work;
    },
  };
}
function domHarness() {
  let mutation = () => {};
  const doc = Object.assign(new EventTarget(), {
    visibilityState: 'visible', documentElement: {}, activeElement: null as any,
    getElementById: vi.fn((): any => null),
  });
  const element = {
    getClientRects: () => [{}], hasAttribute: () => true, setAttribute: vi.fn(),
    focus: vi.fn(() => { doc.activeElement = element; }), scrollIntoView: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn() },
  };
  class Observer {
    constructor(callback: () => void) { mutation = callback; }
    observe() {} disconnect() {}
  }
  return { doc, element, environment: { document: doc, MutationObserver: Observer } as any,
    render() { doc.getElementById.mockReturnValue(element); mutation(); }, mutation: () => mutation() };
}
afterEach(() => vi.unstubAllGlobals());

describe('system presentation and explicit notification navigation', () => {
  it.each(['accepted', 'ready'])('cold-start %s waits for session, lists and mounted card before acknowledgement', async (state) => {
    const sw = worker('iPhone');
    const data = { type: `order-${state}`, tag: `order-20-${state === 'ready' ? 'coordination-ready' : state}`,
      orderId: 20, url: '/?open=requests-customer&orderId=20' };
    await sw.fire('push', { data: { json: () => data } });
    const notification = { ...sw.registration.showNotification.mock.calls[0][1], close: vi.fn() };
    await sw.fire('notificationclick', { notification });
    const opened = sw.clients.openWindow.mock.calls[0][0];
    const navigation = createNotificationNavigation(origin);
    const target = navigation.receive(opened)!;
    const navigationCache = await sw.cache.open('zipco-notification-navigation-v1');
    const cachedTarget = `${origin}/__zipco_notification_target__`;
    expect(await navigationCache.match(cachedTarget)).toBeTruthy();
    // Arbitrarily late authentication and lists: no timer consumes this target.
    expect(navigation.pending).toEqual(target);
    expect(navigation.receive(opened)).toBeNull();
    const process = { ...coordinationProcess, state: state === 'ready' ? 'READY' : 'COORDINATION_PENDING' };
    expect(statusViewFor('orders', state, process)).toBe(state === 'ready' ? 'ready' : 'coordination');
    expect(customerOrderNotice({ status: state, requestProcess: process })).not.toBeNull();
    const dom = domHarness();
    const acknowledge = vi.fn(() => navigation.complete(target.url));
    let sessionReady = false, listsReady = false;
    const stop = waitForNotificationCard('order-20', acknowledge, dom.environment, () => sessionReady && listsReady);
    expect(acknowledge).not.toHaveBeenCalled(); // Session/lists/card not ready.
    dom.render();
    expect(acknowledge).not.toHaveBeenCalled();
    sessionReady = true; dom.mutation();
    expect(acknowledge).not.toHaveBeenCalled();
    listsReady = true; dom.mutation();
    expect(dom.element.focus).toHaveBeenCalledOnce();
    expect(dom.element.scrollIntoView).toHaveBeenCalledOnce();
    expect(acknowledge).toHaveBeenCalledOnce();
    await sw.fire('message', { data: { type: 'ZIPCO_NOTIFICATION_NAVIGATED', url: target.url } });
    expect(await navigationCache.match(cachedTarget)).toBeUndefined();
    dom.mutation();
    expect(acknowledge).toHaveBeenCalledOnce();
    expect(navigation.receive(opened)).toBeNull();
    expect(navigation.completedTarget(opened)?.url).toBe(target.url);
    // Another click/retry of the consumed event is acknowledged without a
    // second mount or focus, so it cannot leave a stale target in the worker.
    await sw.fire('notificationclick', { notification });
    expect(navigation.receive(opened)).toBeNull();
    await sw.fire('message', { data: { type: 'ZIPCO_NOTIFICATION_NAVIGATED', url: navigation.completedTarget(opened)!.url } });
    expect(await navigationCache.match(cachedTarget)).toBeUndefined();
    expect(dom.element.focus).toHaveBeenCalledOnce();
    stop();
  });

  it('persists only the presented event and does not suppress a later ready event', async () => {
    const sw = worker();
    await sw.fire('push', { data: { json: () => ({ tag: 'order-36-accepted', url: '/?open=requests-customer&orderId=36' }) } });
    vi.stubGlobal('window', { location: { origin, search: '' } });
    vi.stubGlobal('caches', sw.cache);
    const keys = await readSystemPresentations();
    expect(keys.has(presentationKey('order-36-process:COORDINATION_PENDING', '/?open=requests-customer&orderId=36')!)).toBe(true);
    expect(keys.has(presentationKey('order-36-process:READY', '/?open=requests-customer&orderId=36')!)).toBe(false);
    const cache = await sw.cache.open(PRESENTATION_CACHE);
    const rows = await (await cache.match(`${origin}${PRESENTATION_PATH}`))!.json();
    expect(Object.keys(rows[0]).sort()).toEqual(['createdAt', 'key']);
  });

  it('records a click from an older notification whose data has no event key', async () => {
    const sw = worker();
    await sw.fire('notificationclick', { notification: { tag: 'order-37-coordination-ready',
      data: { url: '/?open=requests-customer&orderId=37' }, close() {} } });
    expect(sw.clients.openWindow.mock.calls[0][0]).toContain('notificationEvent=');
  });

  it('never lets an old acknowledgement delete the newer destination', async () => {
    const sw = worker();
    const click = (id: number) => sw.fire('notificationclick', { notification: { tag: `order-${id}-accepted`,
      data: { url: `/?open=requests-customer&orderId=${id}` }, close() {} } });
    await click(38);
    const first = parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0], origin)!;
    await click(39);
    await sw.fire('message', { data: { type: 'ZIPCO_NOTIFICATION_NAVIGATED', url: first.url } });
    const cache = await sw.cache.open('zipco-notification-navigation-v1');
    expect((await (await cache.match(`${origin}/__zipco_notification_target__`))!.json()).url).toContain('orderId=39');
  });

  it('does not consume a hidden card or one which cannot receive focus', () => {
    const dom = domHarness();
    dom.doc.visibilityState = 'hidden';
    const completed = vi.fn();
    const stop = waitForNotificationCard('order-20', completed, dom.environment);
    dom.render();
    expect(completed).not.toHaveBeenCalled();
    dom.doc.visibilityState = 'visible';
    dom.element.focus.mockImplementation(() => {});
    dom.doc.dispatchEvent(new Event('visibilitychange'));
    expect(completed).not.toHaveBeenCalled();
    dom.element.focus.mockImplementation(() => { dom.doc.activeElement = dom.element; });
    dom.mutation();
    expect(completed).toHaveBeenCalledOnce();
    stop();
  });

  it('cancels stale render observers and rejects foreign or invalid destinations', () => {
    const navigation = createNotificationNavigation(origin);
    expect(navigation.receive('https://other.test/?open=requests-customer&orderId=20')).toBeNull();
    expect(navigation.receive('/?open=requests-customer&orderId=oops')).toBeNull();
    const dom = domHarness(), completed = vi.fn();
    const stop = waitForNotificationCard('order-20', completed, dom.environment);
    stop(); dom.render(); expect(completed).not.toHaveBeenCalled();
  });

  it('always visibly presents a received push on iPhone even with a focused window', async () => {
    const client = { visibilityState: 'visible', focused: true, postMessage: vi.fn() };
    const sw = worker('iPhone', [client]);
    await sw.fire('push', { data: { json: () => ({ tag: 'order-40-accepted', url: '/?open=requests-customer&orderId=40' }) } });
    expect(sw.registration.showNotification).toHaveBeenCalledOnce();
    expect(client.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED' }));
  });

  it('does not record a system presentation when showing the notification fails', async () => {
    const sw = worker();
    sw.registration.showNotification.mockRejectedValueOnce(new Error('unavailable'));
    await expect(sw.fire('push', { data: { json: () => ({ tag: 'order-41-ready', url: '/?open=requests-customer&orderId=41' }) } })).rejects.toThrow();
    const cache = await sw.cache.open(PRESENTATION_CACHE);
    expect(await cache.match(`${origin}${PRESENTATION_PATH}`)).toBeUndefined();
  });
});
