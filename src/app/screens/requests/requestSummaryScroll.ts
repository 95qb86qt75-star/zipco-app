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
