import { describe, expect, it, vi } from 'vitest';
import { keepNotificationCardInView } from './notificationCardPosition';

function harness(height = 480) {
  let contentTop = 520;
  let resize = () => {}, mutation = () => {};
  let nextFrame: (() => void) | undefined;
  const viewport = Object.assign(new EventTarget(), { offsetTop: 0 });
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible', defaultView: { visualViewport: viewport } });
  const scroller = { clientTop: 0, scrollTop: 0,
    getBoundingClientRect: () => ({ top: 212, bottom: 868 }),
    scrollTo: vi.fn(({ top }) => { scroller.scrollTop = top; }) };
  const element = {
    ownerDocument: doc, isConnected: true, closest: () => scroller,
    getBoundingClientRect: () => ({ top: contentTop - scroller.scrollTop,
      bottom: contentTop - scroller.scrollTop + height, height }),
    click: vi.fn(), scrollIntoView: vi.fn(),
  };
  const disconnected = vi.fn();
  class Resize { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() { disconnected(); } }
  class Mutation { constructor(callback: () => void) { mutation = callback; } observe() {} disconnect() { disconnected(); } }
  const environment: any = { document: doc, ResizeObserver: Resize, MutationObserver: Mutation,
    requestAnimationFrame: (callback: () => void) => { nextFrame = callback; return 1; },
    cancelAnimationFrame: () => { nextFrame = undefined; } };
  const flush = () => { const callback = nextFrame; nextFrame = undefined; callback?.(); };
  return { element: element as any, doc, scroller, environment, disconnected, flush,
    resize: () => { resize(); flush(); },
    grow: (value: number) => { height = value; resize(); flush(); },
    shift: (value: number) => { contentTop = value; mutation(); flush(); } };
}

describe('notification card positioning in the Requests scroll viewport', () => {
  it('shows a fitting card below the header and above the bottom navigation without toggling it', () => {
    const h = harness();
    const stop = keepNotificationCardInView(h.element, h.environment); h.flush();
    expect(h.element.getBoundingClientRect().top).toBe(224);
    expect(h.element.getBoundingClientRect().bottom).toBeLessThan(760);
    expect(h.scroller.scrollTo).toHaveBeenCalledWith({ top: 296, behavior: 'auto' });
    expect(h.element.click).not.toHaveBeenCalled();
    expect(h.element.scrollIntoView).not.toHaveBeenCalled();
    stop();
  });

  it('keeps the same card aligned when agreements, banners or entrance animation change layout later', () => {
    const h = harness(150);
    const stop = keepNotificationCardInView(h.element, h.environment); h.flush();
    h.grow(480); h.shift(900);
    expect(h.element.getBoundingClientRect().top).toBe(224);
    expect(h.element.getBoundingClientRect().bottom).toBeLessThan(760);
    stop();
  });

  it.each(['touchstart', 'wheel', 'keydown'])('hands control to the user on %s without later jumps', (event) => {
    const h = harness();
    keepNotificationCardInView(h.element, h.environment); h.flush();
    h.doc.dispatchEvent(new Event(event));
    const calls = h.scroller.scrollTo.mock.calls.length;
    h.scroller.scrollTop += 50; h.shift(1000); h.resize();
    expect(h.scroller.scrollTo).toHaveBeenCalledTimes(calls);
    expect(h.disconnected).toHaveBeenCalledTimes(2);
  });

  it('aligns the beginning of an oversized card and cleans up on screen exit', () => {
    const h = harness(900);
    const stop = keepNotificationCardInView(h.element, h.environment); h.flush();
    expect(h.element.getBoundingClientRect().top).toBe(224);
    const calls = h.scroller.scrollTo.mock.calls.length;
    stop(); h.shift(1200);
    expect(h.scroller.scrollTo).toHaveBeenCalledTimes(calls);
  });
});
