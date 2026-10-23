import { canonicalPresentationKey } from './notificationDelivery';
export const NOTIFICATION_CARD_OPEN_EVENT = 'zipco-notification-card-open';
export type NotificationTarget = { url: string; identity: string; eventKey: string | null };

export function parseNotificationTarget(value: string, origin: string): NotificationTarget | null {
  try {
    const url = new URL(value, origin);
    const view = url.searchParams.get('open');
    if (url.origin !== origin || !/^requests-(customer|business)(-quotes)?$/.test(view ?? '')) return null;
    const kind = view?.endsWith('-quotes') ? 'quoteId' : 'orderId';
    if (!/^[1-9]\d*$/.test(url.searchParams.get(kind) ?? '')) return null;
    url.searchParams.delete('notificationLaunch');
    const rawEvent = url.searchParams.get('notificationEvent');
    const eventKey = rawEvent ? canonicalPresentationKey(rawEvent) : null;
    if (rawEvent && !eventKey) return null;
    if (eventKey) url.searchParams.set('notificationEvent', eventKey);
    if (eventKey && !eventKey.startsWith(`${view}:${kind === 'quoteId' ? 'quote' : 'order'}-${url.searchParams.get(kind)}-`)) return null;
    const target = `/${url.search}`;
    return { url: target, identity: eventKey || target, eventKey };
  } catch { return null; }
}

// One explicit destination, independent of polling and toast emission. Repeated
// worker retries cannot remount the screen or consume a later destination.
export function createNotificationNavigation(origin: string) {
  let pending: NotificationTarget | null = null;
  const completed = new Set<string>();
  return {
    receive(value: string) {
      const target = parseNotificationTarget(value, origin);
      if (!target || completed.has(target.identity) || pending?.identity === target.identity) return null;
      pending = target;
      return target;
    },
    complete(value: string) {
      const target = parseNotificationTarget(value, origin);
      if (!target || pending?.identity !== target.identity) return null;
      if (target.eventKey) completed.add(target.identity);
      if (completed.size > 100) completed.delete(completed.values().next().value!);
      pending = null;
      return target;
    },
    completedTarget(value: string) {
      const target = parseNotificationTarget(value, origin);
      return target && completed.has(target.identity) ? target : null;
    },
    get pending() { return pending; },
  };
}

// Observe rendering instead of guessing how long session/list/filter/animation
// work will take. Cleanup cancels stale observers when the destination changes.
export function waitForNotificationCard(
  id: string,
  onFocused: () => void,
  environment = { document, MutationObserver },
  canFocus: () => boolean = () => true,
) {
  let stopped = false;
  const observer = new environment.MutationObserver(() => { tryFocus(); });
  const tryFocus = () => {
    if (stopped || !canFocus() || environment.document.visibilityState !== 'visible') return;
    const element = environment.document.getElementById(id);
    if (!element || element.getClientRects().length === 0) return;
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    if (environment.document.activeElement !== element) return;
    // Stop observing before changing layout. Position once, without a resize
    // observer, animation-frame loop or continuing to follow the user's scroll.
    stopped = true;
    observer.disconnect();
    environment.document.removeEventListener('visibilitychange', tryFocus);
    element.classList.add('zipco-notification-target');
    element.dispatchEvent?.(new CustomEvent(NOTIFICATION_CARD_OPEN_EVENT, { detail: { id }, bubbles: true }));
    const scroller = element.closest<HTMLElement>('[data-requests-scroll]');
    if (scroller) {
      // The header is outside this scroller. Measure after the highlight adds
      // its label/padding, then align the card below the header with a small gap.
      scroller.scrollTop = Math.max(0, scroller.scrollTop +
        element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientTop - 12);
    } else {
      element.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    // Visual highlight lifetime only; navigation never depends on a timer.
    setTimeout(() => element.classList.remove('zipco-notification-target'), 4200);
    onFocused();
  };
  observer.observe(environment.document.documentElement, { subtree: true, childList: true, attributes: true });
  environment.document.addEventListener('visibilitychange', tryFocus);
  tryFocus();
  return () => {
    stopped = true;
    observer.disconnect();
    environment.document.removeEventListener('visibilitychange', tryFocus);
  };
}
