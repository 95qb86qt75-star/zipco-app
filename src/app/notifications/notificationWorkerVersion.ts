// QA UI imports this helper; it does not read subscriptions or notification data.
export function readNotificationWorkerIdentity(
  worker: Pick<ServiceWorker, 'postMessage'> | null = navigator.serviceWorker?.controller ?? null,
): Promise<{ revision: string; build: string | null; traceEnabled: boolean }> {
  if (!worker) return Promise.resolve({ revision: 'Sin worker controlando esta ventana.', build: null, traceEnabled: false });
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (value: string, build: string | null = null, traceEnabled = false) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve({ revision: value, build, traceEnabled });
    };
    const timer = setTimeout(() => finish('Sin respuesta de versión: worker anterior o no disponible.'), 1500);
    channel.port1.onmessage = (event) => {
      const revision = event.data?.revision;
      finish(typeof revision === 'string' && /^[a-z0-9-]{1,64}$/.test(revision)
        ? revision : 'Respuesta de versión no válida.',
        typeof event.data?.build === 'string' && /^[a-f0-9]{40}(-local)?$/.test(event.data.build) ? event.data.build : null,
        event.data?.traceEnabled === true);
    };
    try { worker.postMessage({ type: 'ZIPCO_NOTIFICATION_WORKER_VERSION' }, [channel.port2]); }
    catch { finish('No se pudo consultar el worker activo.'); }
  });
}

export async function checkNotificationWorkerVersion(worker: Pick<ServiceWorker, 'postMessage'> | null = navigator.serviceWorker?.controller ?? null) {
  return (await readNotificationWorkerIdentity(worker)).revision;
}
