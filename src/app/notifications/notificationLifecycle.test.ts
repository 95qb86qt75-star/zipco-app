import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNotificationNavigation, parseNotificationTarget, waitForNotificationCard, NOTIFICATION_CARD_OPEN_EVENT } from './notificationNavigation';
import { presentationKey, readSystemPresentations, PRESENTATION_CACHE, PRESENTATION_PATH,
  deliverUnpresentedNotice, rememberOpenedPresentation, noticeMatchesPresentation } from './notificationDelivery';
import { customerOrderNotice } from './orderNotice';
import { coordinationProcess } from '../screens/requests/requestProcessFixtures';
import { createClickTraceStore } from './qaNotificationClickTraceStore.js';
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
      keys: async () => [...store.keys()].map(value => new Request(value)),
    };
  } };
}
function worker(userAgent = 'Android', existingClients: any[] = [], cache = memoryCaches(), trace?: any, timers?: any) {
  const listeners = new Map<string, (event: any) => void>();
  const client = { postMessage: vi.fn(), focus: vi.fn(async () => client) };
  const registration = { showNotification: vi.fn(async () => {}) };
  const clients = { matchAll: vi.fn(async () => existingClients), openWindow: vi.fn(async () => client) };
  runInNewContext(workerSource, {
    self: { location: { origin }, navigator: { userAgent }, registration, clients, zipcoQaClickTrace: trace,
      addEventListener: (type: string, callback: (event: any) => void) => listeners.set(type, callback) },
    caches: cache, URL, Request, Response, Date,
    ...(timers ?? {setTimeout: (fn: () => void) => { queueMicrotask(fn); }, clearTimeout: () => {}}),
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
    focus: vi.fn(() => { doc.activeElement = element; }), scrollIntoView: vi.fn(), closest: vi.fn((): any => null),
    classList: { add: vi.fn(), remove: vi.fn() },
  };
  class Observer {
    constructor(callback: () => void) { mutation = callback; }
    observe() {} disconnect() {}
  }
  return { doc, element, environment: { document: doc, MutationObserver: Observer } as any,
    render() { doc.getElementById.mockReturnValue(element); mutation(); }, mutation: () => mutation() };
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('system presentation and explicit notification navigation', () => {
  it('keeps push diagnostics alive until stored and reads them after a worker restart',async()=>{
    const cache=memoryCaches();
    let release!:()=>void; const gate=new Promise<void>(resolve=>release=resolve);
    const store=createClickTraceStore('worker','a'.repeat(40),origin,cache);
    const trace={...store,record:(...args:any[])=>gate.then(()=>store.record(...args))};
    const sw=worker('iPhone',[],cache,trace);
    let settled=false;
    const work=sw.fire('push',{data:{json:()=>({orderId:91,tag:'order-91-availability-17',url:'/?open=requests-customer&orderId=91',title:'Synthetic confirmation'})}}).then(()=>{settled=true;});
    await vi.waitFor(()=>expect(sw.registration.showNotification).toHaveBeenCalledOnce());
    expect(settled).toBe(false);
    const [title,options]=sw.registration.showNotification.mock.calls[0];
    expect(title).toBe(`QA ${options.data.qaTraceId.slice(0,8)} · Synthetic confirmation`);
    expect(options.data.qaRevision).toBe('notification-click-attempt-v11');
    release();await work;
    const report=await createClickTraceStore('worker','b'.repeat(40),origin,cache).read();
    expect(report.storageAvailable).toBe(true);
    expect(report.entries.map((r:any)=>r.stage)).toEqual(['push-received','system-shown']);
    expect(report.entries.every((r:any)=>r.correlationId===options.data.qaTraceId)).toBe(true);
  });
  it('persists entry and a normalization failure before completing the event',async()=>{
    const cache=memoryCaches(),trace=createClickTraceStore('worker','a'.repeat(40),origin,cache),sw=worker('iPhone',[],cache,trace);
    const token='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const work=sw.fire('notificationclick',{notification:{data:{qaTraceId:token,url:'http://['},close(){}}});
    await expect(work).rejects.toThrow();
    const report=await createClickTraceStore('worker','b'.repeat(40),origin,cache).read();
    expect(report.entries.map((r:any)=>r.stage)).toEqual(['click-entered','click-received','click-failed']);
    expect(report.entries.filter((r:any)=>r.stage!=='click-entered').every((r:any)=>r.correlationId===token)).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(/private-details|orderId|order-91|http:\/\/\[/);
  });
  it.each(['clears','throws'])('opens the captured destination when closing the notification %s',async mode=>{
    const sw=worker('iPhone');
    let reads=0;
    const notification={tag:'order-91-availability-17',get data(){reads++;return {url:'/?open=requests-customer&orderId=91'};},close(){
      if(mode==='throws')throw Error('private-close');
      Object.defineProperty(notification,'data',{get(){throw Error('data-after-close');}});
    }};
    await sw.fire('notificationclick',{notification});
    expect(reads).toBe(1);
    const target=parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0],origin)!;
    expect(new URL(target.url,origin).searchParams.get('orderId')).toBe('91');
    expect(target.eventKey).toBe('requests-customer:order-91-availability-17');
  });
  it('records handler entry when Notification.data cannot be read, without attributing a destination',async()=>{
    const trace={record:vi.fn()},sw=worker('iPhone',[],memoryCaches(),trace);
    await sw.fire('notificationclick',{notification:{get data(){throw Error('private-data');},close(){}}});
    expect(trace.record.mock.calls[0][0]).toBe('click-entered');
    expect(trace.record.mock.calls.find(([stage])=>stage==='click-received')?.[1]).toMatchObject({hasTarget:false,hasError:true});
    expect(parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0],origin)).toBeNull();
    expect(JSON.stringify(trace.record.mock.calls)).not.toContain('private-data');
  });
  it('does not add a QA banner marker or metadata when tracing is disabled',async()=>{
    const sw=worker('iPhone');
    await sw.fire('push',{data:{json:()=>({title:'Synthetic confirmation',url:'/?open=requests-customer&orderId=91'})}});
    const [title,options]=sw.registration.showNotification.mock.calls[0];
    expect(title).toBe('Synthetic confirmation');
    expect(options.data).not.toHaveProperty('qaTraceId');expect(options.data).not.toHaveProperty('qaBuild');
  });
  it.each(['customer','business'])('recognizes real availability payload and opens the exact %s destination',async view=>{
    const url=`/?open=requests-${view}&orderId=91`,tag='order-91-availability-42',key=`requests-${view}:${tag}`;
    const sw=worker('iPhone');
    await sw.fire('push',{data:{json:()=>({type:'order-availability-event',orderId:91,processId:777,processVersion:42,tag,url})}});
    const options=sw.registration.showNotification.mock.calls[0][1];
    expect(options.data.eventKey).toBe(key);
    vi.stubGlobal('window',{location:{origin,search:''}});vi.stubGlobal('caches',sw.cache);
    const deliver=vi.fn();await deliverUnpresentedNotice({dedupeKey:tag,actionUrl:url},deliver);expect(deliver).not.toHaveBeenCalled();
    await deliverUnpresentedNotice({dedupeKey:'order-91-availability-43',actionUrl:url},deliver);expect(deliver).toHaveBeenCalledOnce();
    await sw.fire('notificationclick',{notification:{tag,data:options.data,close(){}}});
    const target=parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0],origin)!;
    expect(target.eventKey).toBe(key);expect(new URL(target.url,origin).searchParams.get('orderId')).toBe('91');
    expect(new URL(target.url,origin).searchParams.get('processId')).toBeNull();
  });
  it('correlates one displayed availability notification with its click and navigation without recording payload',async()=>{
    const trace={record:vi.fn(),build:'a'.repeat(40)},sw=worker('iPhone',[],memoryCaches(),trace);
    await sw.fire('push',{data:{json:()=>({type:'order-availability-event',orderId:91,processId:777,processVersion:17,tag:'order-91-availability-17',url:'/?open=requests-customer&orderId=91'})}});
    const options=sw.registration.showNotification.mock.calls[0][1],token=options.data.qaTraceId;
    expect(token).toMatch(/^[a-f0-9-]{36}$/);
    await sw.fire('notificationclick',{notification:{tag:options.tag,data:options.data,close(){}}});
    for(const stage of ['push-received','system-shown','click-received','target-normalized','target-saved','launch-requested']){
      expect(trace.record.mock.calls.find(([name])=>name===stage)?.[1]).toMatchObject({correlationId:token});
    }
    expect(JSON.stringify(trace.record.mock.calls)).not.toMatch(/orderId|processId|order-91/);
  });
  it.each(['ASK_LATE_REQUEST_NEED','CONFIRM_LATE_REQUEST_NEED','DECLINE_LATE_REQUEST_NEED','CLOSE_LATE_REQUEST_UNAVAILABLE'])('opens and deduplicates late initial event %s using actual outbox tags', async eventType => {
    const business=eventType==='CONFIRM_LATE_REQUEST_NEED'||eventType==='DECLINE_LATE_REQUEST_NEED';
    const view=business?'requests-business':'requests-customer',url='/?open='+view+'&orderId=91';
    const sw=worker('iPhone');
    await sw.fire('push',{data:{json:()=>({type:'order-late-initial-event',eventType,orderId:91,tag:'reservation-event-42-user-1',url})}});
    const options=sw.registration.showNotification.mock.calls[0][1];
    const key='order-91-late-'+eventType.toLowerCase().replaceAll('_','-');
    expect(options.data.eventKey).toBe(view+':'+key);
    vi.stubGlobal('window',{location:{origin,search:''}});vi.stubGlobal('caches',sw.cache);
    const deliver=vi.fn();await deliverUnpresentedNotice({dedupeKey:key,actionUrl:url},deliver);expect(deliver).not.toHaveBeenCalled();
    await sw.fire('notificationclick',{notification:{tag:options.tag,data:options.data,close(){}}});
    const target=parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0],origin)!;
    expect(target.eventKey).toBe(view+':'+key);expect(target.url).toContain('orderId=91');
  });
  it('requests expansion only for the card explicitly focused by notification navigation',()=>{
    const dom=domHarness(),dispatchEvent=vi.fn();Object.assign(dom.element,{dispatchEvent});
    const complete=vi.fn();const stop=waitForNotificationCard('order-20',complete,dom.environment);
    expect(dispatchEvent).not.toHaveBeenCalled();dom.render();
    expect(dispatchEvent).toHaveBeenCalledOnce();expect(dispatchEvent.mock.calls[0][0]).toMatchObject({type:NOTIFICATION_CARD_OPEN_EVENT,detail:{id:'order-20'},bubbles:true});
    dom.mutation();expect(dispatchEvent).toHaveBeenCalledOnce();stop();
  });
  it.each(['PROPOSE_ALTERNATIVE', 'COUNTER_PROPOSAL', 'PROPOSE_FINAL', 'ACCEPT_PROPOSAL', 'REJECT_PROPOSAL', 'ACCEPT_COUNTER_PROPOSAL', 'REJECT_COUNTER_PROPOSAL'])('deduplicates proposal event %s while retaining its exact navigation and subsequent events', async action => {
    const sw = worker('iPhone');
    const normalized = action.toLowerCase().replaceAll('_', '-');
    const tag = `order-91-proposal-124-${action}`;
    const eventKey = `requests-customer:order-91-proposal-124-${normalized}`;
    const url = '/?open=requests-customer&orderId=91';
    await sw.fire('push', { data: { json: () => ({ type: 'order-proposal-event', tag, url, orderId: 91 }) } });
    expect(sw.registration.showNotification).toHaveBeenCalledOnce();
    const data = sw.registration.showNotification.mock.calls[0][1].data;
    expect(data.eventKey).toBe(eventKey);
    vi.stubGlobal('window', { location: { origin, search: '' } }); vi.stubGlobal('caches', sw.cache);
    const deliver = vi.fn();
    const notice = { dedupeKey: `order-91-proposal-124-${normalized}`, actionUrl: url };
    await deliverUnpresentedNotice(notice, deliver); expect(deliver).not.toHaveBeenCalled();
    await deliverUnpresentedNotice({ ...notice, dedupeKey: `order-91-proposal-125-${normalized}` }, deliver); expect(deliver).toHaveBeenCalledOnce();
    await sw.fire('notificationclick', { notification: { tag, data, close() {} } });
    const destination = parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0], origin)!;
    expect(destination.eventKey).toBe(eventKey); expect(destination.url).toContain('orderId=91');
    const nav = createNotificationNavigation(origin); expect(nav.receive(destination.url)).toMatchObject({ eventKey }); expect(nav.receive(destination.url)).toBeNull();
  });
  it('identifies the executing worker through the reply port without notification data', async () => {
    const sw = worker('iPhone');
    const reply = vi.fn();
    await sw.fire('message', { data: { type: 'ZIPCO_NOTIFICATION_WORKER_VERSION' }, ports: [{ postMessage: reply }] });
    expect(reply).toHaveBeenCalledExactlyOnceWith({ revision: 'notification-click-attempt-v11', build: null, traceEnabled: false });
  });

  it('records worker click checkpoints without passing identifiers or notification bodies to the trace', async () => {
    const trace = { record: vi.fn(), build: 'a'.repeat(40), read: vi.fn(async () => ({ entries: [], storageAvailable: true })) };
    const sw = worker('iPhone', [], memoryCaches(), trace);
    await sw.fire('notificationclick', { notification: { tag: 'order-91-accepted',
      data: { url: '/?open=requests-customer&orderId=91', body: 'private-message' }, close() {} } });
    const stages = trace.record.mock.calls.map(([stage]) => stage);
    expect(stages).toEqual(expect.arrayContaining(['click-received', 'target-normalized', 'launch-requested', 'launch-returned', 'target-saved']));
    const report = JSON.stringify(trace.record.mock.calls);
    expect(report).not.toMatch(/orderId|private-message|order-91|requests-customer/);
    const reply = vi.fn();
    await sw.fire('message', { data: { type: 'ZIPCO_QA_CLICK_TRACE_READ' }, ports: [{ postMessage: reply }] });
    expect(reply).toHaveBeenCalledWith({ entries: [], storageAvailable: true });
  });

  it('keeps navigation working when the QA trace throws', async () => {
    const sw = worker('iPhone', [], memoryCaches(), { record: () => { throw new Error('trace-unavailable'); } });
    await sw.fire('notificationclick', { notification: { tag: 'order-92-accepted',
      data: { url: '/?open=requests-customer&orderId=92' }, close() {} } });
    expect(sw.clients.openWindow).toHaveBeenCalledOnce();
    expect(sw.client.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'ZIPCO_NOTIFICATION_NAVIGATE' }));
  });

  it('launches and messages the suspended iPhone window while Cache API is still blocked', async () => {
    const cache = memoryCaches();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => { release = resolve; });
    const slowCache = { open: async (name: string) => { await blocked; return cache.open(name); } };
    const resumed = { url: `${origin}/`, postMessage: vi.fn() };
    const sw = worker('iPhone', [resumed], slowCache);
    const click = sw.fire('notificationclick', { notification: { tag: 'order-73-accepted',
      data: { url: '/?open=requests-customer&orderId=73' }, close() {} } });
    await new Promise<void>((resolve) => setImmediate(resolve));
    try {
      expect(sw.clients.openWindow).toHaveBeenCalledOnce();
      expect(resumed.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'ZIPCO_NOTIFICATION_NAVIGATE' }));
    } finally { release(); await click; }
  });

  it.each(['accepted', 'ready', 'rejected'])('deduplicates the opened iPhone %s event if Cache API fails, preserving later events', async (state) => {
    const sw = worker('iPhone', [], { open: async () => { throw new Error('cache unavailable'); } });
    await sw.fire('notificationclick', { notification: { tag: `order-74-${state}`,
      data: { url: '/?open=requests-customer&orderId=74' }, close() {} } });
    const opened = new URL(sw.clients.openWindow.mock.calls[0][0]);
    vi.stubGlobal('window', { location: opened });
    vi.stubGlobal('caches', sw.cache);
    const deliver = vi.fn();
    const actionUrl = '/?open=requests-customer&orderId=74';
    await deliverUnpresentedNotice({ dedupeKey: `order-74-${state}`, actionUrl }, deliver);
    expect(deliver).not.toHaveBeenCalled();
    await deliverUnpresentedNotice({ dedupeKey: 'order-74-completed', actionUrl }, deliver);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it('starts the iPhone deep link directly in the click, before asynchronous cache work', async () => {
    const sw = worker('iPhone');
    const click = sw.fire('notificationclick', { notification: { tag: 'order-71-accepted',
      data: { url: '/?open=requests-customer&orderId=71' }, close() {} } });
    const launchedDuringClick = sw.clients.openWindow.mock.calls.length;
    await click;
    expect(launchedDuringClick).toBe(1);
    expect(sw.clients.openWindow.mock.calls[0][0]).toContain('/__zipco_notification_open__?');
  });

  it('delivers the iPhone target and presentation to suspended existing windows even when openWindow returns a client', async () => {
    const resumed = { url: `${origin}/`, visibilityState: 'hidden', focused: false, postMessage: vi.fn() };
    const sw = worker('iPhone', [resumed]);
    await sw.fire('notificationclick', { notification: { tag: 'order-72-accepted',
      data: { url: '/?open=requests-customer&orderId=72' }, close() {} } });
    expect(resumed.postMessage).toHaveBeenCalledWith({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED', eventKey: 'requests-customer:order-72-accepted' });
    expect(resumed.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'ZIPCO_NOTIFICATION_NAVIGATE', url: expect.stringContaining('orderId=72') }));
  });
  it('retries the resumed window independently when openWindow returns a different client',async()=>{
    vi.useFakeTimers();
    let listening=false;
    const delivered:string[]=[];
    const oldWindow={url:origin+'/',postMessage:vi.fn((message:any)=>{if(listening&&message.type==='ZIPCO_NOTIFICATION_NAVIGATE')delivered.push(message.url);})};
    const windows=[oldWindow];
    const sw=worker('iPhone',windows,memoryCaches(),undefined,{setTimeout,clearTimeout});
    const click=sw.fire('notificationclick',{notification:{tag:'order-91-availability-17',data:{url:'/?open=requests-customer&orderId=91'},close(){}}});
    await vi.advanceTimersByTimeAsync(100);
    expect(delivered).toEqual([]);
    // The revived window is a new WindowClient object; refresh matchAll.
    const revived={...oldWindow,postMessage:vi.fn((message:any)=>{if(message.type==='ZIPCO_NOTIFICATION_NAVIGATE')delivered.push(message.url);})};
    windows.splice(0,1,revived);listening=true;
    await vi.advanceTimersByTimeAsync(5000);await click;
    expect(revived.postMessage).toHaveBeenCalled();
    expect(delivered.length).toBeGreaterThan(0);
    expect(delivered.every(url=>new URL(url,origin).searchParams.get('orderId')==='91')).toBe(true);
    expect(sw.clients.matchAll.mock.calls.length).toBeGreaterThan(1);
  });
  it('bounds a hanging warm openWindow, then navigates the existing window to the same click',async()=>{
    vi.useFakeTimers();
    const existing:any={url:origin+'/',postMessage:vi.fn(),focus:vi.fn(async()=>existing),navigate:vi.fn(async()=>existing)};
    const sw=worker('iPhone',[existing],memoryCaches(),undefined,{setTimeout,clearTimeout});
    sw.clients.openWindow.mockImplementation(()=>new Promise(()=>{}));
    let finished=false;
    const click=sw.fire('notificationclick',{notification:{tag:'order-92-availability-18',data:{url:'/?open=requests-customer&orderId=92'},close(){}}}).then(()=>{finished=true;});
    await vi.advanceTimersByTimeAsync(500);
    expect(existing.postMessage.mock.calls.filter(([m])=>m.type==='ZIPCO_NOTIFICATION_NAVIGATE').length).toBeGreaterThan(1);
    expect(existing.navigate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);await click;
    expect(finished).toBe(true);expect(existing.navigate).toHaveBeenCalledOnce();
    const target=new URL(existing.navigate.mock.calls[0][0]);
    expect(target.pathname).toBe('/__zipco_notification_open__');expect(target.searchParams.get('orderId')).toBe('92');
    expect(target.searchParams.get('notificationClick')).toBeTruthy();
  });
  it.each(['ack','new-click'])('does not replay an older click after %s during warm retries',async action=>{
    vi.useFakeTimers();
    const existing={url:origin+'/',postMessage:vi.fn()};
    const sw=worker('iPhone',[existing],memoryCaches(),undefined,{setTimeout,clearTimeout});
    const click=(id:number)=>sw.fire('notificationclick',{notification:{tag:`order-${id}-accepted`,data:{url:`/?open=requests-customer&orderId=${id}`},close(){}}});
    const first=click(91);await vi.advanceTimersByTimeAsync(100);
    const firstUrl=existing.postMessage.mock.calls.find(([m])=>m.type==='ZIPCO_NOTIFICATION_NAVIGATE')![0].url;
    let second:Promise<void>|undefined;
    if(action==='ack')await sw.fire('message',{data:{type:'ZIPCO_NOTIFICATION_NAVIGATED',url:firstUrl}});
    else {second=click(92);await vi.advanceTimersByTimeAsync(100);}
    existing.postMessage.mockClear();sw.client.postMessage.mockClear();
    await vi.advanceTimersByTimeAsync(6000);await first;await second;
    const messages=[...existing.postMessage.mock.calls,...sw.client.postMessage.mock.calls].map(([m])=>m).filter(m=>m.type==='ZIPCO_NOTIFICATION_NAVIGATE');
    expect(messages.every(m=>m.url!==firstUrl)).toBe(true);
    if(action==='ack')expect(messages).toEqual([]);
    else expect(messages.some(m=>m.url.includes('orderId=92'))).toBe(true);
  });

  it('opens Android contact authorization without replaying its toast and keeps later READY independent', async () => {
    const sw = worker('Android');
    const data = { type: 'order-contact-authorized', orderId: 61,
      tag: 'order-61-coordination-contact-authorized', url: '/?open=requests-business&orderId=61' };
    await sw.fire('push', { data: { json: () => data } });
    const notification = { ...sw.registration.showNotification.mock.calls[0][1], close: vi.fn() };
    expect(notification.data.eventKey).toBe('requests-business:order-61-contact-authorized');
    await sw.fire('notificationclick', { notification });
    const opened = parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0], origin)!;
    expect(opened.url).toContain('open=requests-business');
    expect(opened.url).toContain('orderId=61');
    vi.stubGlobal('window', { location: { origin, search: new URL(opened.url, origin).search } });
    vi.stubGlobal('caches', sw.cache);
    const toast = { dedupeKey: 'order-contact-authorized', actionUrl: data.url };
    const displayed = vi.fn();
    await deliverUnpresentedNotice(toast, displayed);
    expect(displayed).not.toHaveBeenCalled();
    // An already visible toast is cleared only if its event matches the opened one.
    expect(noticeMatchesPresentation(toast, opened.eventKey)).toBe(true);
    const later = { dedupeKey: 'order-61-ready', actionUrl: data.url };
    expect(noticeMatchesPresentation(later, opened.eventKey)).toBe(false);
    await deliverUnpresentedNotice(later, displayed);
    expect(displayed).toHaveBeenCalledExactlyOnceWith(later);
  });

  it('recognizes a contact authorization pushed without a tag and a tag from the previous worker', async () => {
    const sw = worker('Android');
    await sw.fire('push', { data: { json: () => ({ type: 'order-contact-authorized', orderId: 62,
      url: '/?open=requests-business&orderId=62' }) } });
    expect(sw.registration.showNotification.mock.calls[0][1].data.eventKey).toBe('requests-business:order-62-contact-authorized');
    await sw.fire('notificationclick', { notification: { tag: 'order-62-coordination-contact-authorized',
      data: { url: '/?open=requests-business&orderId=62', eventKey: 'requests-business:order-62-coordination-contact-authorized' }, close() {} } });
    const opened = parseNotificationTarget(sw.clients.openWindow.mock.calls[0][0], origin)!;
    expect(opened.eventKey).toBe('requests-business:order-62-contact-authorized');
  });

  it('reads a presentation recorded by the old worker and suppresses only that event', async () => {
    const cache = memoryCaches();
    await (await cache.open(PRESENTATION_CACHE)).put(`${origin}${PRESENTATION_PATH}`, new Response(JSON.stringify([
      { key: 'requests-business:order-63-coordination-contact-authorized', createdAt: Date.now() },
    ])));
    vi.stubGlobal('window', { location: { origin, search: '' } }); vi.stubGlobal('caches', cache);
    const displayed = vi.fn();
    await deliverUnpresentedNotice({ dedupeKey: 'order-63-contact-authorized', actionUrl: '/?open=requests-business&orderId=63' }, displayed);
    expect(displayed).not.toHaveBeenCalled();
    await deliverUnpresentedNotice({ dedupeKey: 'order-64-contact-authorized', actionUrl: '/?open=requests-business&orderId=64' }, displayed);
    expect(displayed).toHaveBeenCalledOnce();
  });

  it('does not deliver a queued toast when its notification opens during the cache read', async () => {
    let resolveRead!: (value: undefined) => void;
    vi.stubGlobal('window', { location: { origin, search: '' } });
    vi.stubGlobal('caches', { open: async () => ({ match: () => new Promise((resolve) => { resolveRead = resolve; }) }) });
    const displayed = vi.fn();
    const toast = { dedupeKey: 'order-65-contact-authorized', actionUrl: '/?open=requests-business&orderId=65' };
    const pending = deliverUnpresentedNotice(toast, displayed);
    await Promise.resolve();
    rememberOpenedPresentation('requests-business:order-65-coordination-contact-authorized');
    resolveRead(undefined); await pending;
    expect(displayed).not.toHaveBeenCalled();
    // This also covers a replay after the launch query was consumed.
    expect(noticeMatchesPresentation(toast, 'requests-business:order-65-contact-authorized')).toBe(true);
    expect(noticeMatchesPresentation({ dedupeKey: 'error', actionUrl: toast.actionUrl }, 'requests-business:order-65-contact-authorized')).toBe(false);
  });

  it('does not mute unrelated messages or introduce push copy as an internal notice', async () => {
    vi.stubGlobal('window', { location: { origin, search: '' } });
    const displayed = vi.fn();
    await deliverUnpresentedNotice({ dedupeKey: 'saved' }, displayed);
    expect(displayed).toHaveBeenCalledOnce();
    await deliverUnpresentedNotice({ dedupeKey: 'saved' }, displayed, () => false);
    expect(displayed).toHaveBeenCalledOnce();
  });

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
    // Another physical click must reopen the destination even when its notice
    // was presented before. Repeated delivery of that click still coalesces.
    await sw.fire('notificationclick', { notification });
    const reopened = navigation.receive(sw.clients.openWindow.mock.calls[1][0])!;
    expect(reopened).not.toBeNull();expect(reopened.eventKey).toBe(target.eventKey);
    expect(reopened.identity).not.toBe(target.identity);
    expect(navigation.receive(reopened.url)).toBeNull();
    // A late ACK for click one cannot consume click two from the worker cache.
    await sw.fire('message', { data: { type: 'ZIPCO_NOTIFICATION_NAVIGATED', url: target.url } });
    expect(await navigationCache.match(cachedTarget)).toBeTruthy();
    navigation.complete(reopened.url);
    await sw.fire('message', { data: { type: 'ZIPCO_NOTIFICATION_NAVIGATED', url: reopened.url } });
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

  it.each([240, 440, 800])('aligns a %ipx card below the fixed header once, before acknowledgement', (height) => {
    const dom = domHarness();
    // Scrollport starts below the fixed header; bottom navigation starts at 760.
    // Existing bottom padding provides room to align even the last card.
    const scroller = { scrollTop: 100, clientTop: 1,
      getBoundingClientRect: () => ({ top: 210 }) };
    dom.element.closest.mockReturnValue(scroller);
    const rect = vi.fn(() => {
      expect(dom.element.classList.add).toHaveBeenCalledWith('zipco-notification-target');
      return { top: 630 - scroller.scrollTop, height };
    });
    Object.assign(dom.element, { getBoundingClientRect: rect });
    const completed = vi.fn(() => {
      expect(rect().top).toBe(223); // Header + container border + 12px gap.
      if (height <= 440) expect(rect().top + height).toBeLessThan(760);
    });
    const stop = waitForNotificationCard('order-20', completed, dom.environment);
    dom.render();
    expect(completed).toHaveBeenCalledOnce();
    expect(dom.element.scrollIntoView).not.toHaveBeenCalled(); // Never scroll the page/header.
    // Late DOM changes and user scroll do not trigger a second positioning.
    scroller.scrollTop = 75;
    dom.mutation(); dom.doc.dispatchEvent(new Event('visibilitychange'));
    expect(scroller.scrollTop).toBe(75);
    expect(completed).toHaveBeenCalledOnce();
    stop();
  });

  it('keeps the top boundary reachable and positions before acknowledging a first card', () => {
    const dom = domHarness();
    const scroller = { scrollTop: 0, clientTop: 0, getBoundingClientRect: () => ({ top: 210 }) };
    dom.element.closest.mockReturnValue(scroller);
    Object.assign(dom.element, { getBoundingClientRect: () => ({ top: 215 }) });
    const completed = vi.fn();
    waitForNotificationCard('order-20', completed, dom.environment);
    dom.render();
    expect(scroller.scrollTop).toBe(0);
    expect(completed).toHaveBeenCalledOnce();
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

it.each(['confirmed','accepted','declined'])('preserves the new WhatsApp %s type and concrete destination through the existing worker',async kind=>{
 const sw=worker(),tag='order-91-coordination-coordination-'+kind+'-42',url='/?open=requests-customer&orderId=91';
 await sw.fire('push',{data:{json:()=>({type:'order-whatsapp-coordination-'+kind,orderId:91,requestProcessId:7,tag,url,title:'Synthetic coordination event'})}});
 const options=sw.registration.showNotification.mock.calls[0][1] as any;
 expect(options.data.type).toBe('order-whatsapp-coordination-'+kind);expect(options.data.eventKey).toBe('requests-customer:'+tag);
 expect(presentationKey(tag,url,origin)).toBe(options.data.eventKey);
});

it('preserves the initial-negative type and its distinct event identity in the existing worker',async()=>{
 const sw=worker(),tag='order-91-coordination-initial-declined-42',url='/?open=requests-business&orderId=91';await sw.fire('push',{data:{json:()=>({type:'order-whatsapp-coordination-initial-declined',orderId:91,requestProcessId:7,tag,url,title:'Synthetic initial negative'})}});const options=sw.registration.showNotification.mock.calls[0][1] as any;expect(options.data.type).toBe('order-whatsapp-coordination-initial-declined');expect(options.data.eventKey).toBe('requests-business:'+tag);expect(presentationKey(tag,url,origin)).toBe(options.data.eventKey);
});