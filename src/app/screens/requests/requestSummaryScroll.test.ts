import { describe, expect, it } from 'vitest';
import { scrollToRequestResults } from './requestSummaryScroll';

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
});
