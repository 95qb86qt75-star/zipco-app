import { parseNotificationTarget } from './notificationNavigation';

const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const build = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{40}(-local)?$/.test(value) ? value : null;

// Return a new allowlisted object. Never spread Notification or registration data.
export function safeNotificationInventoryItem(notification: Pick<Notification, 'data'>, origin: string) {
  const data = notification.data;
  const correlationId = uuid(data?.qaTraceId) ? data.qaTraceId : null;
  let hasEvent = false;
  const target = typeof data?.url === 'string' ? parseNotificationTarget(data.url, origin) : null;
  try {
    if (target && typeof data?.eventKey === 'string') {
      const url = new URL(target.url, origin);
      url.searchParams.set('notificationEvent', data.eventKey);
      hasEvent = !!parseNotificationTarget(url.href, origin)?.eventKey;
    }
  } catch { /* Untrusted notification data is not diagnostic copy. */ }
  return { correlationId, bannerCode: correlationId?.slice(0,8) ?? null,
    presentedBuild: build(data?.qaBuild),
    presentedRevision: typeof data?.qaRevision === 'string' && /^notification-click-attempt-v\d+$/.test(data.qaRevision) ? data.qaRevision : null,
    hasTarget: !!target, hasEvent };
}

export async function readRegistrationInventory(registration: ServiceWorkerRegistration, origin: string, controller: ServiceWorker | null) {
  const root = new URL('/', origin).href;
  let sameOrigin = false;
  try { sameOrigin = new URL(registration.scope).origin === origin; } catch { /* Invalid scope. */ }
  const context = { sameOrigin, rootScope: registration.scope === root,
    activeIsController: !!controller && registration.active === controller,
    expectedActiveScript: registration.active?.scriptURL === new URL('/sw.js', origin).href };
  if (!sameOrigin || !registration.getNotifications) return { ...context, notificationsAvailable: false, notificationCount: null, notifications: [] };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const pending = await Promise.race([registration.getNotifications(), new Promise<null>(resolve => { timer = setTimeout(() => resolve(null),1500); })]);
    if (!pending) return { ...context, notificationsAvailable: false, notificationCount: null, notifications: [] };
    return { ...context, notificationsAvailable: true, notificationCount: pending.length,
      notifications: pending.slice(0,20).map(item => safeNotificationInventoryItem(item,origin)) };
  } catch { return { ...context, notificationsAvailable: false, notificationCount: null, notifications: [] }; }
  finally { clearTimeout(timer); }
}
