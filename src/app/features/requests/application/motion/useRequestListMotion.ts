import { useEffect, useRef } from 'react';
import "./request-list-motion.css";

/** Keep visibility and scroll independent: visible decoration continues during
 * scroll; gesture hints still use the scroll flag. No React/order state updates. */
export default function useRequestListMotion(items: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = ref.current;
    const scroller = list?.closest<HTMLElement>('[data-requests-scroll]');
    if (!list || !scroller) return;
    const cards = Array.from(list.querySelectorAll<HTMLElement>('[id^="order-"],[data-status-order]'));
    let timer: ReturnType<typeof setTimeout> | undefined;
    let scrolling = false;
    const update = () => {
      if (scrolling) list.dataset.requestListScrolling = 'true';
      else delete list.dataset.requestListScrolling;
      if (document.hidden) list.dataset.requestListHidden = 'true';
      else delete list.dataset.requestListHidden;
    };
    const settled = () => { clearTimeout(timer); scrolling = false; update(); };
    const scroll = () => {
      scrolling = true; update(); clearTimeout(timer);
      // Fallback for browsers without scrollend, also covers touch momentum.
      timer = setTimeout(settled, 160);
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      entries.forEach(entry => {
        (entry.target as HTMLElement).dataset.requestMotion = entry.isIntersecting && entry.intersectionRatio > 0 ? 'active' : 'idle';
      });
    }, { root: scroller });
    cards.forEach(card => {
      if (!observer) return;
      card.dataset.requestMotion = 'idle';
      observer.observe(card);
    });
    scroller.addEventListener('scroll', scroll, { passive: true });
    scroller.addEventListener('scrollend', settled);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      clearTimeout(timer); observer?.disconnect();
      scroller.removeEventListener('scroll', scroll);
      scroller.removeEventListener('scrollend', settled);
      document.removeEventListener('visibilitychange', update);
      delete list.dataset.requestListScrolling;
      delete list.dataset.requestListHidden;
      cards.forEach(card => delete card.dataset.requestMotion);
    };
  }, [items]);
  return ref;
}
