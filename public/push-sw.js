// Click revision: notification-click-attempt-v11. Existing navigation retained.
const notificationWorkerRevision = 'notification-click-attempt-v11';
// Optional diagnostics must never prevent delivery of a commercial destination.
const observe = (method, ...args) => {
  try { return self.zipcoQaPushObservation?.[method]?.(...args); }
  catch { return undefined; }
};
let traceWrites = Promise.resolve();
const eventCorrelations = new WeakMap();
const traceClick = (stage, flags, correlationId) => {
  try {
    const write = Promise.resolve(self.zipcoQaClickTrace?.record(stage, { ...flags, ...(correlationId ? { correlationId } : {}) })).catch(() => {});
    traceWrites = Promise.all([traceWrites, write]).then(() => {});
    return write;
  } catch { return Promise.resolve(); }
};
// Invoke the handler synchronously (including Apple's user-activated openWindow).
// Both early throws and late failures keep diagnostic writes in the event lifetime.
const tracedEvent = (failureStage, handler) => event => {
  let work;
  try { work = handler(event); } catch (error) { work = Promise.reject(error); }
  event.waitUntil(Promise.resolve(work).catch(error => {
    observe('failed', event);
    traceClick(failureStage, { hasError: true }, eventCorrelations.get(event));
    throw error;
  }).finally(async () => {
    const remoteWrites = observe('flush', event);
    await traceWrites;
    try { await self.zipcoQaClickTrace?.flush?.(); } catch { /* Never change navigation for diagnostic storage. */ }
    try { await remoteWrites; } catch { /* Remote diagnostics never fail navigation. */ }
  }));
};
// Same semantic-key mapping/schema as notificationDelivery.ts. Existing backend
// tags distinguish acceptance from ready and later events on the same order.
const presentationCacheName = 'zipco-notification-presentations-v1';
const presentationPath = '/__zipco_notification_presentations__';
let presentationWrites = Promise.resolve();
const systemEventKey = (data) => {
  try {
    const url = new URL(data.url || '/', self.location.origin);
    const view = url.searchParams.get('open');
    const fallbackKey = data.type === 'order-contact-authorized' && /^[1-9]\d*$/.test(String(data.orderId || ''))
      ? `order-${data.orderId}-contact-authorized` : '';
    const lateKey=data.type==='order-late-initial-event'&&/^[1-9]\d*$/.test(String(data.orderId||''))&&['ASK_LATE_REQUEST_NEED','CONFIRM_LATE_REQUEST_NEED','DECLINE_LATE_REQUEST_NEED','CLOSE_LATE_REQUEST_UNAVAILABLE'].includes(data.eventType)
      ?`order-${data.orderId}-late-${data.eventType.toLowerCase().replaceAll('_','-')}`:'';
    const key = String(lateKey || data.tag || fallbackKey).replace('-coordination-ready', '-ready')
      .replace('-coordination-contact-authorized', '-contact-authorized')
      .replace(/-proposal-(\d+)-([A-Z_]+)$/, (_, id, action) => `-proposal-${id}-${action.toLowerCase().replaceAll('_', '-')}`);
    const availability=key.match(/^order-([1-9]\d*)-(?:availability|coordination-(?:receipt-declared|request-finalized)|coordination-initial-declined|coordination-coordination-(?:confirmed|accepted|declined))-([1-9]\d*)$/);
    if(availability){
      if(url.origin!==self.location.origin||!/^requests-(customer|business)$/.test(view||'')||url.searchParams.get('orderId')!==availability[1]||![availability[1],availability[2]].every(v=>Number.isInteger(Number(v))&&Number(v)<=2147483647))return null;
      return view+':'+key;
    }
    if(/^order-[1-9]\d*-availability-/.test(key))return null;
    if (url.origin !== self.location.origin || !/^requests-(customer|business)(-quotes)?$/.test(view || '') ||
        !/^(order|quote)-[1-9]\d*-(?:[a-z-]+|proposal-[1-9]\d*-(?:propose-alternative|counter-proposal|propose-final|accept-proposal|reject-proposal|accept-counter-proposal|reject-counter-proposal))$/.test(key)) return null;
    return `${view}:${key}`;
  } catch { return null; }
};
const qaToken = () => self.zipcoQaClickTrace ? self.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {const n=Math.floor(Math.random()*16);return (c==='x'?n:(n&3)|8).toString(16);}) : null;
const safeQaToken = value => typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value)?value:null;
const rememberSystemPresentation = (key) => {
  if (!key) return Promise.resolve();
  presentationWrites = presentationWrites.catch(() => {}).then(async () => {
    const cache = await caches.open(presentationCacheName);
    const request = new Request(new URL(presentationPath, self.location.origin).href);
    const response = await cache.match(request);
    const previous = response ? await response.json() : [];
    const now = Date.now();
    const rows = (Array.isArray(previous) ? previous : []).filter((row) =>
      typeof row?.key === 'string' && row.key !== key && Number.isFinite(row.createdAt) &&
      row.createdAt <= now && now - row.createdAt < 24 * 60 * 60 * 1000);
    rows.push({ key, createdAt: now });
    await cache.put(request, new Response(JSON.stringify(rows.slice(-100)), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    }));
  });
  return presentationWrites.catch(() => {});
};

self.addEventListener("push", tracedEvent('push-failed', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const observation = observe('begin', event, data?.qaObservation, 'push');
  const correlationId = observation?.block.traceId || qaToken();
  if(correlationId)eventCorrelations.set(event,correlationId);
  traceClick('push-received', {}, correlationId);
  observe('report', event, observation, 'PUSH_RECEIVED', { hasTarget: !!data?.url, hasEvent: !!systemEventKey(data) });
  // Even malformed/disabled diagnostic blocks must never reach the page.
  const { qaObservation: privateObservation, ...commercialData } = data || {};
  const title = (correlationId ? `QA ${correlationId.slice(0,8)} · ` : '') + (data.title || "ZIPCO");
  const options = {
    body: data.body || "Tienes una nueva notificacion.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "zipco-notification",
    renotify: false,
    data: {
      url: data.url || "/",
      ...(correlationId?{qaTraceId:correlationId,qaBuild:self.zipcoQaClickTrace?.build,qaRevision:notificationWorkerRevision}:{}),
      ...(observation ? { qaObservation: observation.block } : {}),
      orderId: data.orderId,
      quoteId: data.quoteId,
      eventKey: systemEventKey(data),
      type: ['order-product-receipt-declared','order-request-finalized','order-contact-authorized','order-late-initial-event','order-whatsapp-coordination-confirmed','order-whatsapp-coordination-accepted','order-whatsapp-coordination-declined','order-whatsapp-coordination-initial-declined'].includes(data.type) ? data.type : undefined,
      eventType: data.type==='order-late-initial-event'?data.eventType:undefined,
    },
  };
  return (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Android can report a backgrounded installed PWA as visible for a short
      // period. Only suppress the system notification when a window is both
      // visible and actually focused.
      const visibleClients = clients.filter(
        (client) => client.visibilityState === "visible" && client.focused,
      );
      // WebKit's userVisibleOnly subscription requires visible presentation of
      // received pushes. Foreground-only delivery on Apple needs a backend contract.
      const requiresVisibleApplePush = /iPhone|iPad|iPod|Macintosh/i.test(self.navigator?.userAgent || '');
      if (visibleClients.length > 0 && !requiresVisibleApplePush) {
        visibleClients.forEach((client) => client.postMessage(commercialData));
        return;
      }
      await self.registration.showNotification(title, options);
      traceClick('system-shown', { hasEvent: !!options.data.eventKey }, correlationId);
      observe('report', event, observation, 'SYSTEM_SHOWN', { hasEvent: !!options.data.eventKey, ok: true });
      await rememberSystemPresentation(options.data.eventKey);
      clients.forEach((client) => client.postMessage({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED', eventKey: options.data.eventKey }));
    })();
}));

let pendingNavigationTarget = null;
let clickSequence = 0;
let navigationWrites = Promise.resolve();
const updateNavigation = (operation) => {
  navigationWrites = navigationWrites.catch(() => {}).then(operation);
  return navigationWrites;
};

const sendPendingNavigation = async (client, event, expectedTarget) => {
  if (expectedTarget && pendingNavigationTarget !== expectedTarget) return;
  let url = pendingNavigationTarget;
  if (!url) {
    try {
      const navigationCache = await caches.open(
        "zipco-notification-navigation-v1",
      );
      const request = new Request(
        new URL("/__zipco_notification_target__", self.location.origin).href,
      );
      const response = await navigationCache.match(request);
      const payload = response ? await response.json() : null;
      if (
        typeof payload?.url === "string" &&
        Number.isFinite(Number(payload.createdAt))
      ) {
        url = payload.url;
      }
    } catch {
      // The in-memory destination and direct URL navigation remain available.
    }
  }
  traceClick('worker-target-sent', { hasTarget: !!url });
  if (url && (!expectedTarget || pendingNavigationTarget === expectedTarget)) {
    client.postMessage({ type: "ZIPCO_NOTIFICATION_NAVIGATE", url, ...observe('metadata', url, client) });
    if (event) observe('posted', event, url);
  }
};

const normalizeNotificationTarget = (notificationData = {}) => {
  const targetUrl = new URL(notificationData.url || "/", self.location.origin);
  if (notificationData.orderId && !targetUrl.searchParams.has("orderId")) {
    targetUrl.searchParams.set("orderId", String(notificationData.orderId));
  }
  if (notificationData.quoteId && !targetUrl.searchParams.has("quoteId")) {
    targetUrl.searchParams.set("quoteId", String(notificationData.quoteId));
  }
  return targetUrl;
};

self.addEventListener("message", tracedEvent('worker-message-failed', (event) => {
  if (event.data?.type === 'ZIPCO_QA_OBSERVATION_ACK') {
    observe('acknowledge', event);
    return;
  }
  if (event.data?.type === 'ZIPCO_NOTIFICATION_WORKER_VERSION') {
    event.ports?.[0]?.postMessage({ revision: notificationWorkerRevision,
      build: self.zipcoQaClickTrace?.build ?? null, traceEnabled: !!self.zipcoQaClickTrace });
    return;
  }
  if (event.data?.type === 'ZIPCO_QA_CLICK_TRACE_READ' && self.zipcoQaClickTrace) {
    return traceWrites.then(() => self.zipcoQaClickTrace.read()).then((result) => event.ports?.[0]?.postMessage(result));
  }
  if (event.data?.type === 'ZIPCO_QA_CLICK_TRACE_CLEAR' && self.zipcoQaClickTrace) {
    return self.zipcoQaClickTrace.clear().then((cleared) => event.ports?.[0]?.postMessage({ cleared }));
  }
  if (event.data?.type === "ZIPCO_NOTIFICATION_NAVIGATED") {
    const acknowledgedUrl = event.data.url;
    if (typeof acknowledgedUrl !== 'string') return;
    traceClick('ack-received', { hasTarget: !!pendingNavigationTarget });
    return updateNavigation(async () => {
        try {
          const navigationCache = await caches.open(
            "zipco-notification-navigation-v1",
          );
          const request = new Request(
              new URL("/__zipco_notification_target__", self.location.origin)
                .href,
            );
          const response = await navigationCache.match(request);
          const stored = response ? await response.json() : null;
          if (stored?.url !== acknowledgedUrl ||
              (pendingNavigationTarget && pendingNavigationTarget !== acknowledgedUrl)) {
            traceClick('ack-mismatch'); return;
          }
          if (pendingNavigationTarget === acknowledgedUrl) pendingNavigationTarget = null;
          await navigationCache.delete(request);
          traceClick('ack-consumed');
        } catch {
          // Keep the destination pending if acknowledgement cannot be persisted.
        }
      });
  }
  if (
    event.data?.type === "ZIPCO_REQUEST_NOTIFICATION_TARGET" &&
    event.source
  ) {
    traceClick('worker-target-request', { hasTarget: !!pendingNavigationTarget });
    return sendPendingNavigation(event.source, event);
  }
}));

self.addEventListener("notificationclick", tracedEvent('click-failed', (event) => {
  // Record entry before reading Notification.data or invoking remote helpers.
  traceClick('click-entered');
  let notificationData = {}, notificationTag = '', readFailed = false;
  try {
    const value = event.notification?.data;
    if (value && typeof value === 'object') notificationData = { ...value };
    notificationTag = event.notification?.tag || '';
  } catch { readFailed = true; }
  const correlationId=self.zipcoQaClickTrace?safeQaToken(notificationData.qaTraceId):null;
  if (correlationId) eventCorrelations.set(event, correlationId);
  traceClick('click-received', { hasTarget: !!notificationData.url, hasEvent: !!notificationData.eventKey, ...(readFailed ? { hasError: true } : {}) }, correlationId);
  const observation = observe('begin', event, notificationData.qaObservation, 'click');
  observe('report', event, observation, 'CLICK_RECEIVED', { hasTarget: !!notificationData.url, hasEvent: !!notificationData.eventKey });
  // Closing the OS banner is best effort. Route from the captured snapshot.
  try { event.notification?.close(); } catch { /* Continue to the associated destination. */ }
  const targetUrl = normalizeNotificationTarget(notificationData);
  // One local navigation attempt per physical click, independent of notice
  // presentation deduplication. Retried messages/cache/launch share this ID.
  const clickId = self.crypto?.randomUUID?.() || String(Date.now()) + '-' + String(++clickSequence);
  targetUrl.searchParams.set('notificationClick', clickId);
  // Recompute from the notification tag too: an older worker may have stored
  // the coordination-prefixed identity before this event was recognized.
  const eventKey = systemEventKey({ ...notificationData,
    tag: notificationTag, url: targetUrl.href,
  }) || notificationData.eventKey;
  if (eventKey) targetUrl.searchParams.set('notificationEvent', eventKey);
  const target = targetUrl.href;
  pendingNavigationTarget = targetUrl.pathname + targetUrl.search;
  const clickedTarget = pendingNavigationTarget;
  observe('bind', observation, pendingNavigationTarget);
  observe('report', event, observation, 'TARGET_NORMALIZED', { hasTarget: !!targetUrl.searchParams.get('orderId') || !!targetUrl.searchParams.get('quoteId'), hasEvent: !!eventKey });
  traceClick('target-normalized', { hasTarget: !!targetUrl.searchParams.get('orderId') || !!targetUrl.searchParams.get('quoteId'), hasEvent: !!eventKey }, correlationId);
  const isAppleMobile = /iPhone|iPad|iPod/i.test(self.navigator?.userAgent || '');
  let appleLaunchTarget = null;
  let appleLaunch = null;
  if (isAppleMobile) {
    const launchUrl = new URL('/__zipco_notification_open__', self.location.origin);
    targetUrl.searchParams.forEach((value, key) => launchUrl.searchParams.set(key, value));
    launchUrl.searchParams.set('notificationLaunch', String(Date.now()));
    appleLaunchTarget = launchUrl.href;
    // Invoke during notificationclick itself. Cache I/O must not consume the
    // click's activation before WebKit receives the explicit launch URL.
    traceClick('launch-requested', {}, correlationId);
    observe('report', event, observation, 'LAUNCH_REQUESTED');
    try { appleLaunch = Promise.resolve(self.clients.openWindow(appleLaunchTarget)).then((client) => {
      traceClick('launch-returned', { hasClient: !!client }, correlationId); return client;
    }).catch(() => { traceClick('launch-failed', {}, correlationId); return null; }); }
    catch { traceClick('launch-failed', {}, correlationId); appleLaunch = Promise.resolve(null); }
  }
  const persistTarget = updateNavigation(async () => {
    try {
      const navigationCache = await caches.open('zipco-notification-navigation-v1');
      await navigationCache.put(
        new Request(new URL('/__zipco_notification_target__', self.location.origin).href),
        new Response(JSON.stringify({ url: targetUrl.pathname + targetUrl.search, createdAt: Date.now() }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      );
      traceClick('target-saved', {}, correlationId);
    } catch { traceClick('target-save-failed', {}, correlationId); /* Direct launch/messages remain available without Cache API. */ }
  });
  return Promise.all([
    rememberSystemPresentation(eventKey),
    persistTarget,
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existingWindows = clients.filter((client) => new URL(client.url).origin === self.location.origin);
      traceClick('windows-found', { hasClient: clients.length > 0 }, correlationId);
      const navigationMessage = {
        type: "ZIPCO_NOTIFICATION_NAVIGATE",
        url: targetUrl.pathname + targetUrl.search,
      };
      // The window returned by openWindow is not necessarily the suspended
      // window iOS surfaces. Reach every same-origin client on this path too,
      // before awaiting launch/focus, and mark only the opened event presented.
      existingWindows
        .forEach((client) => {
          try {
            if (eventKey) client.postMessage({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED', eventKey });
            client.postMessage({ ...navigationMessage, ...observe('metadata', targetUrl.pathname + targetUrl.search, client) });
            observe('posted', event, targetUrl.pathname + targetUrl.search);
            traceClick('navigation-posted', {}, correlationId);
          } catch { /* A suspended client may reject messages; retry independently. */ }
        });
      // A suspended window can discard the first message while openWindow is
      // still pending (or resolves to another client). Reacquire actual windows
      // independently of that promise, and never replay a consumed/older click.
      const warmRetries = isAppleMobile && existingWindows.length > 0
        ? Promise.all([500, 1_500, 3_000, 5_000].map(delay => new Promise(resolve => {
          setTimeout(async () => {
            try {
              if (pendingNavigationTarget !== clickedTarget) return;
              const resumed = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
              await Promise.allSettled(resumed.filter(client => new URL(client.url).origin === self.location.origin)
                .map(client => sendPendingNavigation(client, event, clickedTarget)));
            } catch { /* URL/cache recovery remains available. */ }
            finally { resolve(); }
          }, delay);
        }))) : Promise.resolve();
      const navigate = async () => {
        // WebKit can report a successful navigate() while merely resuming the
        // suspended standalone window at its previous route. Asking iOS to open
        // the deep link first makes the launch URL authoritative; it normally
        // reuses the installed PWA instead of creating a second window.
        if (isAppleMobile) {
          try {
            // A distinct pathname is intentional. iOS may treat `/?open=...` as
            // the already-open home URL and resume it without applying the query.
            // Changing the pathname forces a real navigation while the SPA still
            // reads the same `open`, `orderId` and `quoteId` parameters.
            let launchedClient;
            if (existingWindows.length > 0) {
              let launchTimer;
              try {
                launchedClient = await Promise.race([appleLaunch, new Promise(resolve => {
                  launchTimer = setTimeout(() => resolve(null), 1500);
                })]);
              } finally { clearTimeout(launchTimer); }
            } else launchedClient = await appleLaunch;
            if (pendingNavigationTarget !== clickedTarget) return;
            if (launchedClient) {
              launchedClient.postMessage({ ...navigationMessage, ...observe('metadata', targetUrl.pathname + targetUrl.search, launchedClient) });
              observe('posted', event, targetUrl.pathname + targetUrl.search);
              await launchedClient.focus();
              // A freshly resumed iOS Home Screen client can be inert for a few
              // seconds. Keep notificationclick alive and retry after WebKit has
              // attached the page's service-worker message listener.
              if (existingWindows.length === 0) await Promise.all(
                [500, 1_500, 3_000, 5_000].map(
                  (delay) =>
                    new Promise((resolve) =>
                      setTimeout(async () => {
                        try {
                          await sendPendingNavigation(launchedClient, event, clickedTarget);
                        } finally {
                          resolve();
                        }
                      }, delay),
                    ),
                ),
              );
              return;
            }
          } catch {
            // Continue with the cross-browser existing-window fallback below.
          }
        }
        const client =
          clients.find(
            (candidate) =>
              candidate.url.startsWith(self.location.origin) &&
              candidate.visibilityState === "visible",
          ) ||
          clients.find((candidate) =>
            candidate.url.startsWith(self.location.origin),
          ) ||
          clients[0];
        if (client) {
          if (pendingNavigationTarget !== clickedTarget) return;
          // iOS can resume the PWA after this worker posts the message, causing the
          // message to be lost before React attaches its listener. Navigating the
          // existing window preserves the target in the URL and works on resume.
          if ("navigate" in client) {
            try {
              // If openWindow only resumed the existing iOS PWA and returned no
              // client, navigating to the root query repeats the WebKit failure
              // that leaves ZIPCO on Inicio. Use the distinct launch pathname in
              // this fallback too, so every Apple path performs a real document
              // navigation before React canonicalizes the URL.
              const navigatedClient = await client.navigate(
                appleLaunchTarget || target,
              );
              const focusedClient = navigatedClient || client;
              await focusedClient.focus();
              // WebKit can resume the installed PWA after the first message was
              // dispatched. Send the route once more to the client it surfaced.
              await sendPendingNavigation(focusedClient, event, clickedTarget);
              await new Promise((resolve) => setTimeout(resolve, 300));
              await sendPendingNavigation(focusedClient, event, clickedTarget);
              await new Promise((resolve) => setTimeout(resolve, 2_700));
              await sendPendingNavigation(focusedClient, event, clickedTarget);
              return;
            } catch {
              // Older browsers can reject WindowClient.navigate; retain the
              // message-based behavior as a compatible fallback.
            }
          }
          await sendPendingNavigation(client, event, clickedTarget);
          await client.focus();
          await new Promise((resolve) => setTimeout(resolve, 300));
          await sendPendingNavigation(client, event, clickedTarget);
          await new Promise((resolve) => setTimeout(resolve, 2_700));
          await sendPendingNavigation(client, event, clickedTarget);
          return;
        }
        observe('report', event, observation, 'LAUNCH_REQUESTED');
        return self.clients.openWindow(appleLaunchTarget || target);
      };
      await Promise.all([navigate(), warmRetries]);
    })(),
  ]);
}));
