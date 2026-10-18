import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReadyOrdersSummary from './ReadyOrdersSummary';
beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

describe('ready attention summary selection', () => {
  it.each([true, false])('keeps its selection accessible and toggles only on click (selected=%s)', (selected) => {
    const onToggle = vi.fn();
    const view = ReadyOrdersSummary({ count: 2, kind: 'orders', selected, onToggle });
    expect(view.props['aria-pressed']).toBe(selected);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('2 pedidos listos para recibir');
    expect(html).not.toMatch(/notificad|recibidos|completados/);
    expect(view.props.className).toContain(selected ? 'from-orange-500 to-amber-500 text-white' : 'from-amber-50 to-orange-50 text-slate-900');
    expect(onToggle).not.toHaveBeenCalled(); view.props.onClick(); expect(onToggle).toHaveBeenCalledOnce();
  });
  it('preserves service-specific wording without introducing product receipt actions', () => {
    const html = renderToStaticMarkup(ReadyOrdersSummary({ count: 1, kind: 'quotes', selected: true, onToggle: vi.fn() }));
    expect(html).toContain('1 servicio listo para confirmar');
    expect(html).not.toContain('retirar');
  });
});
