import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CoordinationOrdersSummary from './CoordinationOrdersSummary';
beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

describe('customer coordination bell summary', () => {
  it.each([1, 2])('uses the business Por coordinar wording (%s) without implying customer consent', (count) => {
    const view = CoordinationOrdersSummary({ count, selected: false, reducedMotion: false, onSelect: vi.fn(), business: true })!;
    const html = renderToStaticMarkup(view);
    expect(html).toContain(count === 1 ? '1 pedido por coordinar' : '2 pedidos por coordinar');
    expect(html).not.toContain('Revisa la autorización de contacto');
    expect(view.props.className).not.toContain('mb-3');
    expect(CoordinationOrdersSummary({ count: 0, selected: false, reducedMotion: false, onSelect: vi.fn(), business: true })).toBeNull();
  });
  it('disappears at zero without dispatching navigation or an order action', () => {
    const onSelect = vi.fn();
    expect(CoordinationOrdersSummary({ count: 0, selected: false, reducedMotion: false, onSelect })).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });
  it.each([1, 2])('shows the current category count (%s) and navigates only on click', (count) => {
    const onSelect = vi.fn();
    const view = CoordinationOrdersSummary({ count, selected: true, reducedMotion: false, onSelect })!;
    const html = renderToStaticMarkup(view);
    expect(html).toContain(count === 1 ? '1 pedido en Coordinación' : '2 pedidos en Coordinación');
    expect(view.props['aria-pressed']).toBe(true);
    expect(view.props.className).toContain('from-emerald-600 to-green-500');
    expect(html).not.toMatch(/listo y notificado|WhatsApp de|contacto autorizado/);
    expect(onSelect).not.toHaveBeenCalled(); view.props.onClick(); expect(onSelect).toHaveBeenCalledOnce();
  });
  it('respects reduced motion and retains the unselected green family', () => {
    const view = CoordinationOrdersSummary({ count: 1, selected: false, reducedMotion: true, onSelect: vi.fn() })!;
    expect(view.props.whileTap).toBeUndefined(); expect(view.props['aria-pressed']).toBe(false);
    expect(view.props.className).toContain('from-emerald-50 to-teal-50');
  });
});
