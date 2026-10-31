// A short filtered list may not provide enough scroll range to reach its top.
// Add only the missing range, then position once within the existing scroller.
export function scrollToRequestResults(results: HTMLElement, spacer: HTMLElement, reducedMotion = false) {
  const scroller = results.closest<HTMLElement>('[data-requests-scroll]');
  if (!scroller || !scroller.contains(spacer)) return;
  spacer.style.height = '0px';
  const target = Math.max(0, scroller.scrollTop + results.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top - scroller.clientTop - 12);
  const available = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  spacer.style.height = `${Math.max(0, target - available)}px`;
  scroller.scrollTo({ top: target, behavior: reducedMotion ? 'instant' : 'smooth' });
}

/** Explicit Ver: position the card's header inside its list, without scrolling the app shell. */
export function scrollToRequestOrder(order:HTMLElement,reducedMotion=false){
  const scroller=order.closest<HTMLElement>('[data-requests-scroll]');
  const spacer=scroller?.querySelector<HTMLElement>('[data-summary-scroll-space]');
  if(scroller&&spacer){scrollToRequestResults(order,spacer,reducedMotion);return;}
  order.scrollIntoView({block:'start',behavior:reducedMotion?'auto':'smooth'});
}
