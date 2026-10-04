self.addEventListener("push", (event) => {
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
      if (visibleClients.length > 0) {
        visibleClients.forEach((client) => client.postMessage(data));
        return;
      }
      await self.registration.showNotification(title, options);
    })(),
  );
});

let pendingNavigationTarget = null;

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
        Date.now() - Number(payload.createdAt) < 5 * 60 * 1000
      ) {
        url = payload.url;
      }
    } catch {
      // The in-memory destination and direct URL navigation remain available.
    }
  }
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
  if (event.data?.type === "ZIPCO_NOTIFICATION_NAVIGATED") {
    pendingNavigationTarget = null;
    event.waitUntil(
      (async () => {
        try {
          const navigationCache = await caches.open(
            "zipco-notification-navigation-v1",
          );
          await navigationCache.delete(
            new Request(
              new URL("/__zipco_notification_target__", self.location.origin)
                .href,
            ),
          );
        } catch {
          // The cached destination expires after five minutes as a fallback.
        }
      })(),
    );
    return;
  }
  if (
    event.data?.type === "ZIPCO_REQUEST_NOTIFICATION_TARGET" &&
    event.source
  ) {
    event.waitUntil(sendPendingNavigation(event.source));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = normalizeNotificationTarget(event.notification.data);
  const target = targetUrl.href;
  pendingNavigationTarget = targetUrl.pathname + targetUrl.search;
  event.waitUntil(
    (async () => {
      // Persist the destination before waking the app. iOS may discard both
      // postMessage and WindowClient.navigate while resuming a suspended PWA.
      try {
        const navigationCache = await caches.open(
          "zipco-notification-navigation-v1",
        );
        await navigationCache.put(
          new Request(
            new URL("/__zipco_notification_target__", self.location.origin)
              .href,
          ),
          new Response(
            JSON.stringify({
              url: pendingNavigationTarget,
              createdAt: Date.now(),
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          ),
        );
      } catch {
        // Do not let a WebKit Cache API failure cancel focus/navigation.
      }
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const navigationMessage = {
        type: "ZIPCO_NOTIFICATION_NAVIGATE",
        url: targetUrl.pathname + targetUrl.search,
      };
      // WebKit can report a successful navigate() while merely resuming the
      // suspended standalone window at its previous route. Asking iOS to open
      // the deep link first makes the launch URL authoritative; it normally
      // reuses the installed PWA instead of creating a second window.
      const isAppleMobile = /iPhone|iPad|iPod/i.test(
        self.navigator?.userAgent || "",
      );
      if (isAppleMobile) {
        try {
          // A distinct pathname is intentional. iOS may treat `/?open=...` as
          // the already-open home URL and resume it without applying the query.
          // Changing the pathname forces a real navigation while the SPA still
          // reads the same `open`, `orderId` and `quoteId` parameters.
          const launchUrl = new URL(
            "/__zipco_notification_open__",
            self.location.origin,
          );
          targetUrl.searchParams.forEach((value, key) =>
            launchUrl.searchParams.set(key, value),
          );
          launchUrl.searchParams.set("notificationLaunch", String(Date.now()));
          const launchedClient = await self.clients.openWindow(launchUrl.href);
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
      // iOS can keep more than one window for the same installed web app. Tell
      // every matching client about the destination before focusing one of them,
      // so the window surfaced by the OS cannot remain on Inicio.
      clients
        .filter((candidate) => candidate.url.startsWith(self.location.origin))
        .forEach((candidate) => candidate.postMessage(navigationMessage));
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
            const navigatedClient = await client.navigate(target);
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
      return self.clients.openWindow(target);
    })(),
  );
});
