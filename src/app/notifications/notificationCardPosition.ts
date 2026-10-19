// Position only the Requests list, leaving its fixed header and navigation intact.
// Keep following late agreement/image/layout growth until the user takes over.
export function keepNotificationCardInView(element: HTMLElement, environment = {
  document: element.ownerDocument, ResizeObserver: globalThis.ResizeObserver, MutationObserver: globalThis.MutationObserver,
  requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame,
}) {
  const scroller = element.closest?.<HTMLElement>('[data-notification-scroll]');
  if (!scroller) {
    element.scrollIntoView({ behavior: 'auto', block: 'start' });
    return () => {};
  }
  let stopped = false;
  let frame: number | undefined;
  const viewport = environment.document.defaultView?.visualViewport;
  const align = () => {
    if (stopped) return;
    if (element.isConnected === false) { stop(); return; }
    const list = scroller.getBoundingClientRect();
    const card = element.getBoundingClientRect();
    const top = Math.max(list.top + scroller.clientTop, viewport?.offsetTop ?? 0) + 12;
    const destination = Math.max(0, scroller.scrollTop + card.top - top);
    if (Math.abs(destination - scroller.scrollTop) > 0.5) {
      // No smooth-scroll race with layout growth or WebKit resuming the PWA.
      scroller.scrollTo({ top: destination, behavior: 'auto' });
    }
  };
  const schedule = () => {
    if (stopped || frame !== undefined) return;
    if (!environment.requestAnimationFrame) { align(); return; }
    frame = environment.requestAnimationFrame(() => { frame = undefined; align(); });
  };
  const resize = environment.ResizeObserver ? new environment.ResizeObserver(schedule) : null;
  const mutation = environment.MutationObserver ? new environment.MutationObserver(schedule) : null;
  const inputEvents = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
  const hidden = () => { if (environment.document.visibilityState !== 'visible') stop(); };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (frame !== undefined) environment.cancelAnimationFrame?.(frame);
    resize?.disconnect(); mutation?.disconnect();
    inputEvents.forEach((name) => environment.document.removeEventListener(name, stop, true));
    environment.document.removeEventListener('visibilitychange', hidden);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
  };
  resize?.observe(element); resize?.observe(scroller);
  mutation?.observe(scroller, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
  inputEvents.forEach((name) => environment.document.addEventListener(name, stop, { capture: true, passive: true }));
  environment.document.addEventListener('visibilitychange', hidden);
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  align(); schedule();
  return stop;
}
