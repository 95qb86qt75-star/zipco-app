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
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    const client = clients[0];
    if (client) {
      if ('navigate' in client) await client.navigate(target);
      return client.focus();
    }
    return self.clients.openWindow(target);
  }));
});
