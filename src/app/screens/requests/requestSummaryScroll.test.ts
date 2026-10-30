import { describe, expect, it, vi } from 'vitest';
import { scrollToRequestOrder,scrollToRequestResults } from './requestSummaryScroll';

describe('scroll range for a short filtered request list', () => {
  function layout(naturalMaximum: number) {
    const spacer = { style: { height: '0px' } };
    let scrollTop = 0;
    const scroller = {
      clientTop: 0, clientHeight: 600,
      get scrollHeight() { return 600 + naturalMaximum + Number.parseFloat(spacer.style.height); },
      get scrollTop() { return scrollTop; },
      // Real browsers clamp scrollTop to the available range. The old tests did not.
      set scrollTop(value: number) { scrollTop = Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight)); },
      getBoundingClientRect: () => ({ top: 150 }), contains: (node: unknown) => node === spacer,
      scrollTo: vi.fn(function (this: { scrollTop: number }, options: ScrollToOptions) { this.scrollTop = options.top!; }),
    };
    const results = { closest: () => scroller, getBoundingClientRect: () => ({ top: 850 - scroller.scrollTop }) };
    return { results, scroller, spacer };
  }

  it('adds the missing range for a single card below several summaries', () => {
    const dom = layout(300);
    dom.scroller.scrollTop = 688;
    expect(dom.scroller.scrollTop).toBe(300); // Reproduces the previous partial scroll.
    scrollToRequestResults(dom.results as any, dom.spacer as any);
    expect(dom.scroller.scrollTop).toBe(688);
    expect(dom.results.getBoundingClientRect().top).toBe(162);
    expect(dom.spacer.style.height).toBe('388px');
  });

  it('does not add space when a long list already provides enough range', () => {
    const dom = layout(1200);
    scrollToRequestResults(dom.results as any, dom.spacer as any);
    expect(dom.scroller.scrollTop).toBe(688);
    expect(dom.spacer.style.height).toBe('0px');
  });

  it('recalculates instead of accumulating empty space on repeated clicks', () => {
    const dom = layout(300);
    scrollToRequestResults(dom.results as any, dom.spacer as any);
    dom.scroller.scrollTop = 0;
    scrollToRequestResults(dom.results as any, dom.spacer as any);
    expect(dom.spacer.style.height).toBe('388px');
    expect(dom.scroller.scrollTop).toBe(688);
  });

  it('respects reduced motion without changing the destination or the missing scroll range', () => {
    const dom = layout(300);
    scrollToRequestResults(dom.results as any, dom.spacer as any, true);
    expect(dom.scroller.scrollTo).toHaveBeenCalledWith({ top: 688, behavior: 'instant' });
    expect(dom.results.getBoundingClientRect().top).toBe(162);
    expect(dom.spacer.style.height).toBe('388px');
  });
  it('positions an explicit Ver inside the list instead of centering its scroll-margin box under the app header',()=>{
    const dom=layout(300);Object.assign(dom.scroller,{querySelector:()=>dom.spacer});
    const target={...dom.results,scrollIntoView:vi.fn()};scrollToRequestOrder(target as any,true);
    expect(target.scrollIntoView).not.toHaveBeenCalled();expect(target.getBoundingClientRect().top).toBe(162);
    expect(dom.scroller.scrollTo).toHaveBeenCalledWith({top:688,behavior:'instant'});
  });
  it('uses the card start for an isolated view without the requests spacer',()=>{
    const target={closest:()=>null,scrollIntoView:vi.fn()};scrollToRequestOrder(target as any,true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({block:'start',behavior:'auto'});
  });
});
