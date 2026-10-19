export type NotificationTarget = { url: string; identity: string; eventKey: string | null };

export function parseNotificationTarget(value: string, origin: string): NotificationTarget | null {
  try {
    const url = new URL(value, origin);
    const view = url.searchParams.get('open');
    if (url.origin !== origin || !/^requests-(customer|business)(-quotes)?$/.test(view ?? '')) return null;
    const kind = view?.endsWith('-quotes') ? 'quoteId' : 'orderId';
    if (!/^[1-9]\d*$/.test(url.searchParams.get(kind) ?? '')) return null;
    url.searchParams.delete('notificationLaunch');
    const eventKey = url.searchParams.get('notificationEvent');
    if (eventKey && !/^requests-(customer|business)(-quotes)?:(order|quote)-[1-9]\d*-[a-z-]+$/.test(eventKey)) return null;
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
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('zipco-notification-target');
    // Visual highlight lifetime only; navigation never depends on a timer.
    setTimeout(() => element.classList.remove('zipco-notification-target'), 4200);
    stopped = true;
    observer.disconnect();
    environment.document.removeEventListener('visibilitychange', tryFocus);
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
