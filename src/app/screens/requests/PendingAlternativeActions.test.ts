import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as any[], cursor: 0, effects: [] as (() => void | (() => void))[] }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useRef: (current: any) => ({ current }),
  useState: (initial: any) => {
    const index = hooks.cursor++; if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[index], (value: any) => { hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value; }];
  },
  useEffect: (effect: () => void | (() => void)) => { hooks.effects.push(effect); },
}));
import PendingAlternativeActions, { AlternativeDraftDialog, LocalAlternativePhoto } from './PendingAlternativeActions';
import AlternativeChangeEditor from './AlternativeChangeEditor';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { rawOrder, pendingProcess } from './requestProcessFixtures';
type Node = React.ReactElement<Record<string, any>>;
const nodes = (root: React.ReactNode): Node[] => React.Children.toArray(root).flatMap(child =>
  React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
const button = (root: React.ReactNode, label: string) => nodes(root).find(n => n.type === 'button' && React.Children.toArray(n.props.children).includes(label))!;
const order = () => normalizeBusinessOrdersPayload([{ ...rawOrder, orderType: 'product', needNow: true, requestProcess: pendingProcess }])[0];
const close = vi.fn();
const render = (o = order()) => { hooks.cursor = 0; return AlternativeDraftDialog({ order: o, close }); };
const fields = () => nodes(render()).find(node => node.type === AlternativeChangeEditor)!.props;
beforeEach(() => { hooks.slots = []; hooks.cursor = 0; hooks.effects = []; close.mockReset(); vi.stubGlobal('React', React);
  vi.stubGlobal('fetch', vi.fn()); vi.stubGlobal('localStorage', { setItem: vi.fn(), getItem: vi.fn() });
  vi.stubGlobal('sessionStorage', { setItem: vi.fn(), getItem: vi.fn() }); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('recovered alternative design, preparation only', () => {
  it('shows the draft entry only for a current actionable business, not customer, malformed or permissionless process', () => {
    const o = order();
    expect(button(PendingAlternativeActions({ order: o, business: true }), 'Proponer alternativa')).toBeDefined();
    hooks.cursor = 0; expect(PendingAlternativeActions({ order: o, business: false })).toBeNull();
    hooks.cursor = 0; expect(PendingAlternativeActions({ order: { ...o, requestProcess: { ...pendingProcess, allowedActions: [] } }, business: true })).toBeNull();
    hooks.cursor = 0; expect(PendingAlternativeActions({ order: { ...o, requestProcess: null, requestProcessInvalid: true }, business: true })).toBeNull();
  });

  it('reuses the original fields and produces a review while every submission path remains blocked', () => {
    const o = order(); const before = JSON.stringify(o);
    const view = render(o); expect(nodes(view).find(n => n.type === Dialog.Title)?.props.children).toBe('Proponer una alternativa');
    expect(nodes(view).some(n => typeof n.props.children === 'string' && n.props.children.includes('Solo preparación. Aún no se puede enviar al cliente.'))).toBe(false);
    expect(fields().original).toContain('2x Producto de prueba');
    expect(nodes(view).some(node => node.type === LocalAlternativePhoto)).toBe(true);
    fields().onApply('price', { price: '1500' }); fields().setMessage('Cambio de precio por la preparación.');
    button(render(), 'Revisar alternativa').props.onClick();
    const review = render(); expect(nodes(review).find(n => n.type === Dialog.Title)?.props.children).toBe('Revisar alternativa');
    expect(button(review, 'Confirmar y enviar').props.disabled).toBe(true);
    expect(button(review, 'Confirmar y enviar').props.onClick).toBeUndefined();
    expect(nodes(review).some(n => n.props.children === 'Comparación · Borrador sin enviar')).toBe(true);
    expect(fetch).not.toHaveBeenCalled(); expect(localStorage.setItem).not.toHaveBeenCalled(); expect(sessionStorage.setItem).not.toHaveBeenCalled();
    nodes(review).find(n => n.type === Dialog.Root)!.props.onOpenChange(false); expect(close).toHaveBeenCalledOnce();
    expect(JSON.stringify(o)).toBe(before);
  });

  it('requires material changes and explanation, and keeps selected changes per original line', () => {
    const o = order(); o.products = { state: 'available', items: [{ name: 'A', price: 1000, quantity: 1 }, { name: 'B', price: 1000, quantity: 1 }] };
    render(o); button(render(o), 'Revisar alternativa').props.onClick();
    expect(nodes(render(o)).some(n => n.props.role === 'alert')).toBe(true);
    const f = () => nodes(render(o)).find(n => n.type === AlternativeChangeEditor)!.props;
    f().onApply('item', { price: '10000', name: 'Conjunto alternativo' }); expect(f().selected.has('price')).toBe(false);
    f().setMessage('Cambio por producto no disponible.');
    nodes(render(o)).find(n => n.type === 'select')!.props.onChange({ target: { value: '1' } });
    expect(f().selected.has('item')).toBe(false); expect(f().line.price).toBe('1000');
    nodes(render(o)).find(n => n.type === 'select')!.props.onChange({ target: { value: '0' } });
    expect(f().line.price).toBe('10000'); expect(f().line.name).toBe('Conjunto alternativo');
    button(render(o), 'Revisar alternativa').props.onClick(); expect(button(render(o), 'Confirmar y enviar').props.disabled).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps item and price selections independent while requiring CUSTOM total inside its own fields', () => {
    render(); fields().onApply('price', { price: '1500' });
    fields().onApply('item', { name: 'Opción escrita', price: '10000' });
    expect(fields().selected.has('item')).toBe(true); expect(fields().selected.has('price')).toBe(true);
    fields().onApply('price', { price: '12000' });
    fields().onRemove('price');
    expect(fields().selected.has('price')).toBe(false); expect(fields().line.price).toBe('10000');
    fields().onApply('price', { price: '13000' }); fields().onRemove('item');
    expect(fields().selected.has('price')).toBe(true); expect(fields().line.price).toBe('1500');
    fields().onRemove('price'); expect(fields().line.price).toBe('1000');
    fields().onApply('item', { name: 'Opción escrita', price: '10000' });
    fields().setMessage('Otra preparación con precio explicado.');
    button(render(), 'Revisar alternativa').props.onClick();
    expect(button(render(), 'Confirmar y enviar').props.disabled).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('locks stale version and proposal, and locks service quantity', () => {
    const o = order(); render(o);
    const stale = render({ ...o, requestProcess: { ...pendingProcess, version: 2 } });
    expect(button(stale, 'Revisar alternativa').props.disabled).toBe(true);
    expect(nodes(stale).some(n => n.props.children === 'La solicitud cambió. Cierra y actualiza su estado antes de preparar otra alternativa.')).toBe(true);
    hooks.slots = []; hooks.cursor = 0;
    const service = { ...o, orderType: 'service' as const }; render(service);
    expect(nodes(render(service)).find(n => n.type === AlternativeChangeEditor)?.props.quantityLocked).toBe(true);
  });

  it('keeps the footer separate and requires saving or closing the editor before review', () => {
    render(); fields().onApply('price', { price: '1500' }); fields().setMessage('Precio explicado.');
    fields().onEditorOpenChange(true);
    expect(button(render(), 'Revisar alternativa').props.disabled).toBe(true);
    button(render(), 'Revisar alternativa').props.onClick();
    expect(button(render(), 'Confirmar y enviar')).toBeUndefined();
    fields().onEditorOpenChange(false); button(render(), 'Revisar alternativa').props.onClick();
    const view = render();
    expect(button(view, 'Confirmar y enviar').props.disabled).toBe(true);
    expect(nodes(view).some(n => n.props['data-alternative-body'] === true)).toBe(true);
    expect(nodes(view).some(n => n.props['data-alternative-footer'] === true)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('previews a bounded local image, revokes its object URL and never uploads or persists it', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:synthetic-photo'); const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const photo = () => { hooks.cursor = 0; return LocalAlternativePhoto(); };
    const attach = (file: any) => nodes(photo()).find(n => n.type === 'input')!.props.onChange({ target: { files: [file], value: 'x' } });
    attach({ type: 'image/svg+xml', size: 10 }); expect(URL.createObjectURL).not.toHaveBeenCalled();
    attach({ type: 'image/png', size: 9 * 1024 * 1024 }); expect(URL.createObjectURL).not.toHaveBeenCalled();
    attach({ type: 'image/png', size: 100 }); const result = photo();
    expect(nodes(result).find(n => n.type === 'img')?.props.src).toBe('blob:synthetic-photo');
    const cleanup = hooks.effects.at(-1)!(); if (typeof cleanup === 'function') cleanup();
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:synthetic-photo');
    expect(fetch).not.toHaveBeenCalled(); expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
