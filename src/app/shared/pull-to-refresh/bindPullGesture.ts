import { classifyPull, dampenPull, type PullDirection } from './pullToRefreshGesture';

export type PullGestureHandlers = {
  /** Return the element whose scroll must stay at the top, or null to ignore this touch. */
  resolveStart: (target: EventTarget | null) => Element | null;
  isBusy: () => boolean;
  onDragStart: () => void;
  onPull: (distance: number) => void;
  /** Called when the finger lifts (or the gesture is cancelled) after a pull started. */
  onRelease: (distance: number) => void;
};

/** Attaches the touch listeners of the pull gesture. Returns the cleanup. */
export function bindPullGesture(root: HTMLElement | Document, handlers: PullGestureHandlers): () => void {
  let start: { x: number; y: number } | null = null;
  let scroller: Element | null = null;
  let direction: PullDirection = 'pending';
  let current = 0;

  const reset = () => { start = null; scroller = null; direction = 'pending'; current = 0; };

  const onStart = (event: Event) => {
    const touches = (event as TouchEvent).touches;
    if (handlers.isBusy() || touches.length !== 1) return;
    scroller = handlers.resolveStart(event.target);
    if (!scroller || scroller.scrollTop > 0) { reset(); return; }
    start = { x: touches[0].clientX, y: touches[0].clientY };
    direction = 'pending';
  };

  const onMove = (event: Event) => {
    const touches = (event as TouchEvent).touches;
    if (!start || !scroller || touches.length !== 1) return;
    const dx = touches[0].clientX - start.x;
    const dy = touches[0].clientY - start.y;
    if (direction === 'pending') {
      direction = classifyPull(dx, dy);
      if (direction === 'ignore') { reset(); return; }
      if (direction === 'pending') return;
      handlers.onDragStart();
    }
    if (scroller.scrollTop > 0) { reset(); handlers.onRelease(0); return; }
    // Stop the browser from scrolling or bouncing while the gesture owns the touch.
    if (event.cancelable) event.preventDefault();
    current = dampenPull(dy);
    handlers.onPull(current);
  };

  const onEnd = () => {
    if (!start) return;
    const pulled = direction === 'pull' ? current : 0;
    const started = direction === 'pull';
    reset();
    if (started) handlers.onRelease(pulled);
  };

  root.addEventListener('touchstart', onStart, { passive: true });
  root.addEventListener('touchmove', onMove, { passive: false });
  root.addEventListener('touchend', onEnd);
  root.addEventListener('touchcancel', onEnd);
  return () => {
    root.removeEventListener('touchstart', onStart);
    root.removeEventListener('touchmove', onMove);
    root.removeEventListener('touchend', onEnd);
    root.removeEventListener('touchcancel', onEnd);
  };
}

function isScrollable(node: HTMLElement): boolean {
  return /(auto|scroll)/.test(window.getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight;
}

/**
 * Walks from the touched element up to `stopAt` (exclusive). The touch may start the
 * gesture only if nothing on the way opts out, floats (fixed sheets, dialogs, bottom
 * navigation) or is a nested scroller that is not at its top.
 * Returns the nearest scrollable ancestor (or `stopAt`) to watch, or null to ignore.
 */
export function findPullScroller(target: EventTarget | null, stopAt: HTMLElement | null): Element | null {
  let node = target instanceof Element ? target : null;
  let scroller: Element | null = null;
  while (node && node !== stopAt && node !== document.body && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      if (node.dataset.noPullRefresh !== undefined) return null;
      if (node instanceof HTMLInputElement && node.type === 'range') return null;
      if (window.getComputedStyle(node).position === 'fixed') return null;
      if (isScrollable(node)) {
        if (node.scrollTop > 0) return null;
        scroller ??= node;
      }
    }
    node = node.parentElement;
  }
  if (stopAt && node !== stopAt) return null;
  return scroller ?? stopAt ?? document.scrollingElement ?? document.documentElement;
}

/** True while the user is typing: a pull must never wipe what is being written. */
export function isEditing(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return true;
  return active instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'file', 'color'].includes(active.type);
}
