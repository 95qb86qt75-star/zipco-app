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
import AlternativeProposalFields from './AlternativeProposalFields';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { rawOrder, pendingProcess } from './requestProcessFixtures';
type Node = React.ReactElement<Record<string, any>>;
const nodes = (root: React.ReactNode): Node[] => React.Children.toArray(root).flatMap(child =>
  React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
const button = (root: React.ReactNode, label: string) => nodes(root).find(n => n.type === 'button' && React.Children.toArray(n.props.children).includes(label))!;
const order = () => normalizeBusinessOrdersPayload([{ ...rawOrder, orderType: 'product', needNow: true, requestProcess: pendingProcess }])[0];
const close = vi.fn();
const render = (o = order()) => { hooks.cursor = 0; return AlternativeDraftDialog({ order: o, close }); };
const fields = () => nodes(render()).find(node => node.type === AlternativeProposalFields)!.props;
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
    expect(fields().photoFields.type).toBe(LocalAlternativePhoto);
    fields().onSelectedChange(new Set(['price'])); fields().setPrice('1500'); fields().setMessage('Cambio de precio por la preparación.');
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
    const f = () => nodes(render(o)).find(n => n.type === AlternativeProposalFields)!.props;
    f().onSelectedChange(new Set(['item'])); expect(f().selectedChanges.has('price')).toBe(false);
    f().setPrice('10000'); f().setItem('Conjunto alternativo'); f().setMessage('Cambio por producto no disponible.');
    nodes(render(o)).find(n => n.type === 'select')!.props.onChange({ target: { value: '1' } });
    expect(f().selectedChanges.has('item')).toBe(false); expect(f().price).toBe('1000');
    nodes(render(o)).find(n => n.type === 'select')!.props.onChange({ target: { value: '0' } });
    expect(f().price).toBe('10000'); expect(f().item).toBe('Conjunto alternativo');
    button(render(o), 'Revisar alternativa').props.onClick(); expect(button(render(o), 'Confirmar y enviar').props.disabled).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps item and price selections independent while requiring CUSTOM total inside its own fields', () => {
    render(); fields().onSelectedChange(new Set(['item']));
    expect(fields().selectedChanges.has('item')).toBe(true); expect(fields().selectedChanges.has('price')).toBe(false);
    expect(fields().priceRequired).not.toBe(true);
    const customPrice = () => nodes(fields().itemFields).find(n => n.props['aria-label'] === 'Precio total de la opción escrita')!;
    expect(customPrice().props.required).toBe(true); expect(customPrice().props.value).toBe('');
    fields().setItem('Opción escrita'); fields().setMessage('Otra preparación con precio explicado.');
    button(render(), 'Revisar alternativa').props.onClick();
    expect(button(render(), 'Confirmar y enviar')).toBeUndefined();
    customPrice().props.onChange({ target: { value: '10000' } });
    fields().onSelectedChange(new Set(['item', 'price']));
    expect(fields().selectedChanges.has('price')).toBe(true);
    fields().onSelectedChange(new Set(['item']));
    expect(fields().selectedChanges.has('price')).toBe(false); expect(customPrice().props.value).toBe('10000');
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
    expect(nodes(render(service)).find(n => n.type === AlternativeProposalFields)?.props.quantityLocked).toBe(true);
  });

  it('uses shared violet selectors, bounded values and a local photo slot, without the legacy uploader', () => {
    render(); const props = fields(); hooks.cursor = 0;
    const view = AlternativeProposalFields({ ...props, selectedChanges: new Set(['quantity', 'price']), quantity: '99' } as any);
    expect(nodes(view).find(n => n.props.className === 'mt-2 grid grid-cols-2 gap-2')).toBeDefined();
    expect(nodes(view).filter(n => n.props['aria-pressed'] !== undefined)).toHaveLength(4);
    expect(nodes(view).find(n => n.props['aria-label'] === 'Aumentar cantidad')?.props.disabled).toBe(true);
    expect(nodes(view).some(n => n.type === 'input' && n.props.type === 'file')).toBe(false);
    expect(nodes(view).find(n => n.type === 'textarea')?.props.maxLength).toBe(1000);
    const onPrice = nodes(view).find(n => n.props['aria-label'] === 'Precio por unidad')!;
    onPrice.props.onChange({ target: { value: '1.5' } });
    expect(hooks.slots[1].lines[0].price).toBe('1.5');
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
