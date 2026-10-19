// QA UI imports this helper; it does not read subscriptions or notification data.
export function checkNotificationWorkerVersion(
  worker: Pick<ServiceWorker, 'postMessage'> | null = navigator.serviceWorker?.controller ?? null,
): Promise<string> {
  if (!worker) return Promise.resolve('Sin worker controlando esta ventana.');
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (value: string) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(value);
    };
    const timer = setTimeout(() => finish('Sin respuesta de versión: worker anterior o no disponible.'), 1500);
    channel.port1.onmessage = (event) => {
      const revision = event.data?.revision;
      finish(typeof revision === 'string' && /^[a-z0-9-]{1,64}$/.test(revision)
        ? revision : 'Respuesta de versión no válida.');
    };
    try { worker.postMessage({ type: 'ZIPCO_NOTIFICATION_WORKER_VERSION' }, [channel.port2]); }
    catch { finish('No se pudo consultar el worker activo.'); }
  });
}
