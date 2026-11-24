import { useEffect, useRef } from 'react';

/** Decorative effects run only for expanded, visible response buttons. */
export default function useVisibleResponseMotion(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root || typeof IntersectionObserver === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.zipco-accept-wrap, .zipco-glass-wrap, .zipco-reject-wrap'));
    const visible = new Set<Element>();
    const update = () => targets.forEach(target => {
      target.dataset.responseMotion = visible.has(target) && !document.hidden && !reduced.matches ? 'active' : 'idle';
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      update();
    });
    targets.forEach(target => observer.observe(target));
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
      targets.forEach(target => delete target.dataset.responseMotion);
    };
  }, [enabled]);
  return ref;
}
