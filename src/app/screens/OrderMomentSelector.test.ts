import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderMomentSelector from './OrderMomentSelector';

beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());
const render = (moment: 'now' | 'today' | 'schedule') => renderToStaticMarkup(React.createElement(OrderMomentSelector, {
  moment, onChange: () => undefined, time: '', onTimeChange: () => undefined,
}));

describe('order moment selector', () => {
  it('shows exactly three options in the approved order', () => {
    const html = render('now');
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(html.indexOf('Ahora')).toBeLessThan(html.indexOf('Hoy'));
    expect(html.indexOf('Hoy')).toBeLessThan(html.indexOf('Programar'));
    expect(html).toContain('aria-pressed="true"');
  });
  it('shows no date or time input for Ahora', () => {
    expect(render('now')).not.toContain('<input');
  });
  it('requires only time for Hoy, without a date selector', () => {
    const html = render('today');
    expect(html).toContain('type="time"');
    expect(html).toContain('required');
    expect(html).not.toContain('type="date"');
  });
  it('leaves the existing programmed date/time controls to each checkout', () => {
    expect(render('schedule')).not.toContain('<input');
  });
});
