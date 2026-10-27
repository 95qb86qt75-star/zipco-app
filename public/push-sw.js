// Click revision: late-initial-v1-click-v7. Navigation behavior from direct-v3 retained.
const notificationWorkerRevision = 'late-initial-v1-click-v7';
const traceClick = (stage, flags) => {
  try { void self.zipcoQaClickTrace?.record(stage, flags); } catch { /* QA only, best effort. */ }
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
    if (url.origin !== self.location.origin || !/^requests-(customer|business)(-quotes)?$/.test(view || '') ||
        !/^(order|quote)-[1-9]\d*-(?:[a-z-]+|proposal-[1-9]\d*-(?:propose-alternative|counter-proposal|propose-final|accept-proposal|reject-proposal|accept-counter-proposal|reject-counter-proposal))$/.test(key)) return null;
    return `${view}:${key}`;
  } catch { return null; }
};
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

self.addEventListener("push", (event) => {
  traceClick('push-received');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "ZIPCO";
  const options = {
    body: data.body || "Tienes una nueva notificacion.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "zipco-notification",
    renotify: false,
    data: {
      url: data.url || "/",
      orderId: data.orderId,
      quoteId: data.quoteId,
      eventKey: systemEventKey(data),
      type: ['order-contact-authorized','order-late-initial-event'].includes(data.type) ? data.type : undefined,
      eventType: data.type==='order-late-initial-event'?data.eventType:undefined,
    },
  };
  event.waitUntil(
    (async () => {
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
        visibleClients.forEach((client) => client.postMessage(data));
        return;
      }
      await self.registration.showNotification(title, options);
      traceClick('system-shown', { hasEvent: !!options.data.eventKey });
      await rememberSystemPresentation(options.data.eventKey);
      clients.forEach((client) => client.postMessage({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED', eventKey: options.data.eventKey }));
    })(),
  );
});

let pendingNavigationTarget = null;
let navigationWrites = Promise.resolve();
const updateNavigation = (operation) => {
  navigationWrites = navigationWrites.catch(() => {}).then(operation);
  return navigationWrites;
};

const sendPendingNavigation = async (client) => {
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
  if (url) client.postMessage({ type: "ZIPCO_NOTIFICATION_NAVIGATE", url });
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

self.addEventListener("message", (event) => {
  if (event.data?.type === 'ZIPCO_NOTIFICATION_WORKER_VERSION') {
    event.ports?.[0]?.postMessage({ revision: notificationWorkerRevision,
      build: self.zipcoQaClickTrace?.build ?? null, traceEnabled: !!self.zipcoQaClickTrace });
    return;
  }
  if (event.data?.type === 'ZIPCO_QA_CLICK_TRACE_READ' && self.zipcoQaClickTrace) {
    event.waitUntil(self.zipcoQaClickTrace.read().then((result) => event.ports?.[0]?.postMessage(result)));
    return;
  }
  if (event.data?.type === 'ZIPCO_QA_CLICK_TRACE_CLEAR' && self.zipcoQaClickTrace) {
    event.waitUntil(self.zipcoQaClickTrace.clear().then((cleared) => event.ports?.[0]?.postMessage({ cleared })));
    return;
  }
  if (event.data?.type === "ZIPCO_NOTIFICATION_NAVIGATED") {
    const acknowledgedUrl = event.data.url;
    if (typeof acknowledgedUrl !== 'string') return;
    traceClick('ack-received', { hasTarget: !!pendingNavigationTarget });
    event.waitUntil(
      updateNavigation(async () => {
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
      }),
    );
    return;
  }
  if (
    event.data?.type === "ZIPCO_REQUEST_NOTIFICATION_TARGET" &&
    event.source
  ) {
    traceClick('worker-target-request', { hasTarget: !!pendingNavigationTarget });
    event.waitUntil(sendPendingNavigation(event.source));
  }
});

self.addEventListener("notificationclick", (event) => {
  traceClick('click-received', { hasTarget: !!event.notification.data?.url, hasEvent: !!event.notification.data?.eventKey });
  event.notification.close();
  const targetUrl = normalizeNotificationTarget(event.notification.data);
  // Recompute from the notification tag too: an older worker may have stored
  // the coordination-prefixed identity before this event was recognized.
  const eventKey = systemEventKey({ ...event.notification.data,
    tag: event.notification.tag, url: targetUrl.href,
  }) || event.notification.data?.eventKey;
  if (eventKey) targetUrl.searchParams.set('notificationEvent', eventKey);
  const target = targetUrl.href;
  pendingNavigationTarget = targetUrl.pathname + targetUrl.search;
  traceClick('target-normalized', { hasTarget: !!targetUrl.searchParams.get('orderId') || !!targetUrl.searchParams.get('quoteId'), hasEvent: !!eventKey });
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
    traceClick('launch-requested');
    try { appleLaunch = Promise.resolve(self.clients.openWindow(appleLaunchTarget)).then((client) => {
      traceClick('launch-returned', { hasClient: !!client }); return client;
    }).catch(() => { traceClick('launch-failed'); return null; }); }
    catch { traceClick('launch-failed'); appleLaunch = Promise.resolve(null); }
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
      traceClick('target-saved');
    } catch { traceClick('target-save-failed'); /* Direct launch/messages remain available without Cache API. */ }
  });
  event.waitUntil(Promise.all([
    rememberSystemPresentation(eventKey),
    persistTarget,
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      traceClick('windows-found', { hasClient: clients.length > 0 });
      const navigationMessage = {
        type: "ZIPCO_NOTIFICATION_NAVIGATE",
        url: targetUrl.pathname + targetUrl.search,
      };
      // The window returned by openWindow is not necessarily the suspended
      // window iOS surfaces. Reach every same-origin client on this path too,
      // before awaiting launch/focus, and mark only the opened event presented.
      clients.filter((client) => new URL(client.url).origin === self.location.origin)
        .forEach((client) => {
          if (eventKey) client.postMessage({ type: 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED', eventKey });
          client.postMessage(navigationMessage);
          traceClick('navigation-posted');
        });
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
          const launchedClient = await appleLaunch;
          if (launchedClient) {
            launchedClient.postMessage(navigationMessage);
            await launchedClient.focus();
            // A freshly resumed iOS Home Screen client can be inert for a few
            // seconds. Keep notificationclick alive and retry after WebKit has
            // attached the page's service-worker message listener.
            await Promise.all(
              [500, 1_500, 3_000, 5_000].map(
                (delay) =>
                  new Promise((resolve) =>
                    setTimeout(async () => {
                      try {
                        await sendPendingNavigation(launchedClient);
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
            await sendPendingNavigation(focusedClient);
            await new Promise((resolve) => setTimeout(resolve, 300));
            await sendPendingNavigation(focusedClient);
            await new Promise((resolve) => setTimeout(resolve, 2_700));
            await sendPendingNavigation(focusedClient);
            return;
          } catch {
            // Older browsers can reject WindowClient.navigate; retain the
            // message-based behavior as a compatible fallback.
          }
        }
        await sendPendingNavigation(client);
        await client.focus();
        await new Promise((resolve) => setTimeout(resolve, 300));
        await sendPendingNavigation(client);
        await new Promise((resolve) => setTimeout(resolve, 2_700));
        await sendPendingNavigation(client);
        return;
      }
      return self.clients.openWindow(appleLaunchTarget || target);
    })(),
  ]));
});
