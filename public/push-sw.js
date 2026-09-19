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
    data: { url: data.url || '/', orderId: data.orderId }
  };
  const deliverNotification = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(async (clients) => {
      const visibleClients = clients.filter((client) => client.visibilityState === 'visible');
      if (visibleClients.length === 0) {
        await self.registration.showNotification(title, options);
        return;
      }
      visibleClients.forEach((client) => client.postMessage({
        type: data.type,
        orderId: data.orderId,
        customerName: data.customerName
      }));
    });
  event.waitUntil(deliverNotification);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    const client = clients[0];
    if (client) {
      if ('navigate' in client) await client.navigate(target);
      return client.focus();
    }
    return self.clients.openWindow(target);
  }));
});
