self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || 'ZIPCO';
  const options = {
    body: data.body || 'Tienes una nueva notificacion.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'zipco-notification',
    renotify: false,
    data: { url: data.url || '/', orderId: data.orderId, quoteId: data.quoteId }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin);
  if (event.notification.data?.orderId && !targetUrl.searchParams.has('orderId')) targetUrl.searchParams.set('orderId', String(event.notification.data.orderId));
  if (event.notification.data?.quoteId && !targetUrl.searchParams.has('quoteId')) targetUrl.searchParams.set('quoteId', String(event.notification.data.quoteId));
  const target = targetUrl.href;
  event.waitUntil((async () => {
    // Persist the destination before waking the app. iOS may discard both
    // postMessage and WindowClient.navigate while resuming a suspended PWA.
    const navigationCache = await caches.open('zipco-notification-navigation-v1');
    await navigationCache.put(
      new Request(new URL('/__zipco_notification_target__', self.location.origin).href),
      new Response(JSON.stringify({ url: targetUrl.pathname + targetUrl.search, createdAt: Date.now() }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      })
    );
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = clients.find((candidate) => candidate.url.startsWith(self.location.origin) && candidate.visibilityState === 'visible')
      || clients.find((candidate) => candidate.url.startsWith(self.location.origin))
      || clients[0];
    if (client) {
      // iOS can resume the PWA after this worker posts the message, causing the
      // message to be lost before React attaches its listener. Navigating the
      // existing window preserves the target in the URL and works on resume.
      if ('navigate' in client) {
        try {
          const navigatedClient = await client.navigate(target);
          await (navigatedClient || client).focus();
          return;
        } catch {
          // Older browsers can reject WindowClient.navigate; retain the
          // message-based behavior as a compatible fallback.
        }
      }
      client.postMessage({ type: 'ZIPCO_NOTIFICATION_NAVIGATE', url: targetUrl.pathname + targetUrl.search });
      await client.focus();
      return;
    }
    return self.clients.openWindow(target);
  })());
});
