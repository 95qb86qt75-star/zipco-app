import { traceNotificationClick } from './notificationClickTrace';
// Shared Cache API schema with push-sw.js. Only semantic event keys and times;
// no notification copy, credentials or contact data are stored here.
export const PRESENTATION_CACHE = 'zipco-notification-presentations-v1';
export const PRESENTATION_PATH = '/__zipco_notification_presentations__';
export const PRESENTATION_TTL = 24 * 60 * 60 * 1000;
export const PRESENTATION_LIMIT = 100;
const openedPresentations = new Map<string, number>();
// Match existing backend tags, local semantic keys and notifications delivered
// by the previous worker. Do not collapse distinct events of the same order.
export function canonicalPresentationKey(key: string): string | null {
  const canonical = key.replace('-coordination-contact-authorized', '-contact-authorized')
    .replace('-coordination-ready', '-ready').replace(/-proposal-(\d+)-([A-Z_]+)$/, (_, id, action) => `-proposal-${id}-${action.toLowerCase().replaceAll('_', '-')}`);
  return /^requests-(customer|business)(-quotes)?:(order|quote)-[1-9]\d*-(?:[a-z-]+|proposal-[1-9]\d*-(?:propose-alternative|counter-proposal|propose-final|accept-proposal|reject-proposal|accept-counter-proposal|reject-counter-proposal))$/.test(canonical) ? canonical : null;
}
export function rememberOpenedPresentation(key: string | null) {
  key = key ? canonicalPresentationKey(key) : null;
  if (!key) return;
  openedPresentations.delete(key);
  openedPresentations.set(key, Date.now());
  if (openedPresentations.size > PRESENTATION_LIMIT) openedPresentations.delete(openedPresentations.keys().next().value!);
}

export function presentationKey(key: string, actionUrl: string, origin = window.location.origin): string | null {
  try {
    const url = new URL(actionUrl, origin);
    const view = url.searchParams.get('open');
    if (url.origin !== origin || !/^requests-(customer|business)(-quotes)?$/.test(view ?? '')) return null;
    // The explicit push type can identify this event even when the old toast
    // key did not include its order id. Never infer an event from its copy.
    if (key === 'order-contact-authorized' && /^[1-9]\d*$/.test(url.searchParams.get('orderId') ?? '')) {
      key = `order-${url.searchParams.get('orderId')}-contact-authorized`;
    }
    const canonical = key.replace('-process:COORDINATION_PENDING', '-accepted')
      .replace('-process:READY', '-ready').replace('-coordination-ready', '-ready')
      .replace(/-alternative_proposed$/, '-alternative');
    return canonicalPresentationKey(`${view}:${canonical}`);
  } catch { return null; }
}

type PresentationNotice = { dedupeKey: string; actionUrl?: string };
export function noticePresentationKey(notice: PresentationNotice): string | null {
  return notice.actionUrl ? presentationKey(notice.dedupeKey, notice.actionUrl) : null;
}
export function noticeMatchesPresentation(notice: PresentationNotice | null, eventKey: string | null): boolean {
  const canonical = eventKey ? canonicalPresentationKey(eventKey) : null;
  return !!notice && !!canonical && noticePresentationKey(notice) === canonical;
}
export function noticeWasPresented(notice: PresentationNotice): boolean {
  const key = noticePresentationKey(notice);
  const at = key ? openedPresentations.get(key) : undefined;
  return at !== undefined && Date.now() - at < PRESENTATION_TTL;
}

export async function deliverUnpresentedNotice<T extends PresentationNotice>(
  notice: T, deliver: (notice: T) => void, isActive: () => boolean = () => true,
) {
  const key = noticePresentationKey(notice);
  if (key) {
    const presented = await readSystemPresentations();
    if (presented.has(key) || noticeWasPresented(notice)) {
      if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('notice-suppressed', { hasEvent: !!key });
      return;
    }
  }
  if (isActive()) {
    if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('notice-delivered', { hasEvent: !!key });
    deliver(notice);
  }
}

export async function readSystemPresentations(): Promise<Set<string>> {
  const result = new Set<string>();
  const opened = new URLSearchParams(window.location?.search ?? '').get('notificationEvent');
  rememberOpenedPresentation(opened);
  for (const [key, at] of openedPresentations) {
    if (Date.now() - at < PRESENTATION_TTL) result.add(key);
    else openedPresentations.delete(key);
  }
  try {
    if (typeof caches === 'undefined') return result;
    const cache = await caches.open(PRESENTATION_CACHE);
    const response = await cache.match(new URL(PRESENTATION_PATH, window.location.origin).href);
    const rows: unknown = response ? await response.json() : [];
    if (Array.isArray(rows)) for (const row of rows.slice(-PRESENTATION_LIMIT)) {
      if (typeof row?.key === 'string' && Number.isFinite(row.createdAt) &&
          row.createdAt <= Date.now() && Date.now() - row.createdAt < PRESENTATION_TTL) {
        const key = canonicalPresentationKey(row.key);
        if (key) result.add(key);
      }
    }
  } catch { /* A Cache API failure must not prevent refreshing requests. */ }
  return result;
}
