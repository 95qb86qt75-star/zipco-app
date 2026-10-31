import { useEffect, useRef } from 'react';

/** Only small, visible coordination accents animate; no React render per frame. */
export default function useCoordinationMotion(covered: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const update = () => { root.dataset.coordinationMotion = visible && !covered && !document.hidden && !reduced.matches ? 'active' : 'idle'; };
    root.dataset.coordinationMotion = 'idle';
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0); update();
    });
    observer?.observe(root);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    update();
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update); root.dataset.coordinationMotion = 'idle'; };
  }, [covered]);
  return ref;
}
