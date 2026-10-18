// Shared Cache API schema with push-sw.js. Only semantic event keys and times;
// no notification copy, credentials or contact data are stored here.
export const PRESENTATION_CACHE = 'zipco-notification-presentations-v1';
export const PRESENTATION_PATH = '/__zipco_notification_presentations__';
export const PRESENTATION_TTL = 24 * 60 * 60 * 1000;
export const PRESENTATION_LIMIT = 100;
const openedPresentations = new Map<string, number>();
export function rememberOpenedPresentation(key: string | null) {
  if (!key || !/^requests-(customer|business)(-quotes)?:(order|quote)-[1-9]\d*-[a-z-]+$/.test(key)) return;
  openedPresentations.delete(key);
  openedPresentations.set(key, Date.now());
  if (openedPresentations.size > PRESENTATION_LIMIT) openedPresentations.delete(openedPresentations.keys().next().value!);
}

export function presentationKey(key: string, actionUrl: string, origin = window.location.origin): string | null {
  try {
    const url = new URL(actionUrl, origin);
    const view = url.searchParams.get('open');
    if (url.origin !== origin || !/^requests-(customer|business)(-quotes)?$/.test(view ?? '')) return null;
    const canonical = key.replace('-process:COORDINATION_PENDING', '-accepted')
      .replace('-process:READY', '-ready').replace('-coordination-ready', '-ready')
      .replace(/-alternative_proposed$/, '-alternative');
    if (!/^(order|quote)-[1-9]\d*-[a-z-]+$/.test(canonical)) return null;
    return `${view}:${canonical}`;
  } catch { return null; }
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
          row.createdAt <= Date.now() && Date.now() - row.createdAt < PRESENTATION_TTL) result.add(row.key);
    }
  } catch { /* A Cache API failure must not prevent refreshing requests. */ }
  return result;
}
