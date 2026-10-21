import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ effect: null as null | (() => void | (() => void)), setValue: vi.fn() }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useState: (value: number) => [value, hooks.setValue],
  useEffect: (effect: () => void | (() => void)) => { hooks.effect = effect; },
}));
import AlternativeReviewPanel from './AlternativeReviewPanel';
import { newAlternativeDraft, reviewAlternative, type AlternativeSource } from './alternativeDraft';

const source: AlternativeSource = { processId: 1, expectedVersion: 1, proposalId: 1, orderType: 'product',
  items: [{ name: 'Original', quantity: 3, price: 4000 }, { name: 'Conservado', quantity: 1, price: 1000 }],
  total: 13000, needNow: true, date: '', time: '' };
beforeEach(() => { vi.stubGlobal('React', React); hooks.effect = null; hooks.setValue.mockClear(); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function fixture() {
  const draft = newAlternativeDraft(source);
  draft.lines[0] = { ...draft.lines[0], selected: new Set(['item', 'quantity']), quantity: '2', price: '5001', name: 'Otra opción', description: 'Descripción' };
  draft.message = 'Motivo <script> & precio explicado';
  const review = reviewAlternative(source, draft).review!;
  return { source, draft, review };
}

it('renders CUSTOM as a whole-line amount, preserves unchanged lines and escapes the message without mutating the draft', () => {
  const props = fixture(); const before = JSON.stringify(props);
  const html = renderToStaticMarkup(React.createElement(AlternativeReviewPanel, props));
  expect(html).toContain('$5.001'); expect(html).toContain('$6.001');
  expect(html).toContain('Cantidad'); expect(html).not.toContain('Precio unidad');
  expect(html).toContain('Conservado'); expect(html).toContain('Sin cambios · $1.000');
  expect(html).toContain('Motivo &lt;script&gt; &amp; precio explicado');
  expect(html).toContain('class="sr-only">$6.001'); expect(html).toContain('$6.999 menos');
  expect(html).not.toContain('Así lo verá tu cliente'); expect(html).not.toContain('El envío aún no está habilitado');
  expect(JSON.stringify(props)).toBe(before);
});

it.each([[3000, 'menos'], [4000, 'Mismo total'], [5000, 'más']])('shows accurate totals for unit price %s', (price, label) => {
  const draft = newAlternativeDraft(source); draft.lines[0].selected.add('price');
  draft.lines[0].price = String(price); draft.message = 'Cambio por precio';
  const review = { totalPriceClp: price * 3 + 1000, message: draft.message, expectedVersion: 1, proposalId: 1 };
  const html = renderToStaticMarkup(React.createElement(AlternativeReviewPanel, { source, draft, review }));
  expect(html).toContain(label);
  expect(html.includes('Precio unidad')).toBe(price !== 4000);
  expect(html).toContain(`class="sr-only">$${review.totalPriceClp.toLocaleString('es-CL')}`);
});

it('shows proposed Chile date, year and time while retaining original availability', () => {
  const props = fixture(); props.draft.scheduleChanged = true; props.draft.immediate = false;
  props.draft.date = '2030-10-21'; props.draft.time = '15:07';
  props.review.schedule = { mode: 'SCHEDULED', date: props.draft.date, time: props.draft.time };
  const html = renderToStaticMarkup(React.createElement(AlternativeReviewPanel, props));
  expect(html).toContain('Lo antes posible'); expect(html).toContain('2030'); expect(html).toContain('15:07 (Chile)');
});

it('skips count-up when reduced motion is requested', () => {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
  const raf = vi.fn(); vi.stubGlobal('requestAnimationFrame', raf);
  AlternativeReviewPanel(fixture()); hooks.effect!();
  expect(hooks.setValue).toHaveBeenCalledWith(6001); expect(raf).not.toHaveBeenCalled();
});

it('finishes the count-up in 850ms and cancels pending animation on unmount', () => {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
  vi.spyOn(performance, 'now').mockReturnValue(100);
  const frames: FrameRequestCallback[] = [];
  const raf = vi.fn((callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
  const cancel = vi.fn(); vi.stubGlobal('requestAnimationFrame', raf); vi.stubGlobal('cancelAnimationFrame', cancel);
  AlternativeReviewPanel(fixture()); const cleanup = hooks.effect!();
  frames[0](500); expect(raf).toHaveBeenCalledTimes(2);
  frames[1](950); expect(hooks.setValue).toHaveBeenLastCalledWith(6001); expect(raf).toHaveBeenCalledTimes(2);
  if (typeof cleanup === 'function') cleanup(); expect(cancel).toHaveBeenCalledWith(2);
});
