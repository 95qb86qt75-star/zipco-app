import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RequestStatusTab from './RequestStatusTab';
import { businessOrderTabs } from './orderTabs';

beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());
describe('shared compact category presentation', () => {
  it.each(['pending', 'coordination', 'waiting', 'active', 'ready', 'history'] as const)('keeps category text and exact count (%s)', (key) => {
    const item = { key, label: 'Categoría de prueba', count: 123 };
    const html = renderToStaticMarkup(React.createElement(RequestStatusTab, { item, selected: false, reducedMotion: true, onSelect: vi.fn() }));
    expect(html).toContain('Categoría de prueba'); expect(html).toContain('>123</span>');
    expect(html).toContain('zipco-status-tab-surface'); expect(html).toContain('zipco-status-tab-count');
    expect(html).toContain('type="button"'); expect(html).toContain('aria-pressed="false"');
  });
  it('preserves only the deliberate selection handler and selected indicator', () => {
    const onSelect = vi.fn();
    const view = RequestStatusTab({ item: { key: 'coordination', label: 'Coordinación', count: 1 }, selected: true, reducedMotion: true, onSelect });
    expect(onSelect).not.toHaveBeenCalled(); expect(view.props['aria-pressed']).toBe(true);
    view.props.onClick(); expect(onSelect).toHaveBeenCalledOnce();
  });
  it('keeps all six current business categories, including legacy ready', () => {
    const items = businessOrderTabs({ pending: 1, coordination: 1, waiting: 0, active: 0, ready: 1 }, 8);
    const html = renderToStaticMarkup(React.createElement('div', { className: 'zipco-status-tabs' }, items.map((item) =>
      React.createElement(RequestStatusTab, { key: item.key, item, selected: false, reducedMotion: true, onSelect: vi.fn() }))));
    expect(html.match(/<button/g)).toHaveLength(6);
    for (const item of items) expect(html).toContain(item.label);
    expect(html).not.toContain('overflow-x-auto');
  });
});

describe('category count presentation', () => {
  it('distinguishes loading, failed reads and a confirmed empty category', () => {
    vi.stubGlobal('React', React);
    try {
      const markup = (countState?: 'loading' | 'unavailable') => renderToStaticMarkup(
        React.createElement(RequestStatusTab, { item: { key: 'pending', label: 'Pendientes', count: 0 },
          selected: true, reducedMotion: true, onSelect: () => undefined, countState }));
      expect(markup('loading')).toContain('aria-busy="true"');
      expect(markup('loading')).toContain('Cantidad pendiente de carga');
      expect(markup('loading')).not.toContain('>0</span>');
      expect(markup('unavailable')).toContain('Cantidad no disponible');
      expect(markup('unavailable')).not.toContain('>0</span>');
      expect(markup()).toContain('>0</span>');
      expect(markup()).not.toContain('Cantidad pendiente de carga');
    } finally { vi.unstubAllGlobals(); }
  });
});
