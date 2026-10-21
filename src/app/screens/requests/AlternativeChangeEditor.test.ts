import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as any[], cursor: 0 }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useState: (initial: any) => { const i = hooks.cursor++; if (!(i in hooks.slots)) hooks.slots[i] = initial;
    return [hooks.slots[i], (value: any) => { hooks.slots[i] = typeof value === 'function' ? value(hooks.slots[i]) : value; }]; },
}));
import AlternativeChangeEditor, { ChangeEditor } from './AlternativeChangeEditor';
type Node = React.ReactElement<Record<string, any>>;
const nodes = (root: React.ReactNode): Node[] => React.Children.toArray(root).flatMap(child => React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
const base = () => ({ original: '2x Producto · $2.000', originalNote: 'Solicitud original', originalLine: { name: 'Producto', quantity: 2, price: 1000 },
  line: { name: '', description: '', quantity: '2', price: '1000', selected: new Set<any>() },
  schedule: { immediate: true, date: '', time: '' }, originalScheduleValue: { immediate: true, date: '', time: '' }, customBasePrice: '',
  selected: new Set<any>(), quantityLocked: false, quantityMax: 99, onApply: vi.fn(), onRemove: vi.fn(), onEditorOpenChange: vi.fn(),
  message: '', setMessage: vi.fn(), messageMaxLength: 1000, explanationHint: 'Explica el motivo.', photoFields: null });
const panel = (props: any) => { hooks.cursor = 0; return ChangeEditor(props); };
const save = (view: React.ReactNode) => nodes(view).find(n => typeof n.type === 'function' && n.type.name === 'SaveButton')!;
const input = (view: React.ReactNode, label: string) => nodes(view).find(n => n.props['aria-label'] === label)!;
beforeEach(() => { hooks.slots = []; hooks.cursor = 0; vi.stubGlobal('React', React); vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-20T12:00:00Z')); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('provided alternative UI adapted to current rules', () => {
  it('opens four tiles in one row without checking them; CUSTOM leaves Precio available', () => {
    const props = base(); props.selected.add('item'); props.line.selected.add('item');
    const view = AlternativeChangeEditor(props);
    expect(nodes(view).find(n => n.props.className?.includes('grid-cols-4'))).toBeDefined();
    const tiles = nodes(view).filter(n => n.props['aria-pressed'] !== undefined);
    expect(tiles.map(n => n.props['aria-label'])).toEqual(['Precio', 'Cantidad', 'Disponibilidad', 'Producto, cambio guardado']);
    expect(tiles[0].props.disabled).toBe(false); tiles[0].props.onClick();
    expect(props.onEditorOpenChange).toHaveBeenCalledExactlyOnceWith(true); expect(props.onApply).not.toHaveBeenCalled();
    hooks.cursor = 0; const opened = AlternativeChangeEditor(props);
    expect(nodes(opened).find(n => n.type === ChangeEditor)?.props.kind).toBe('price');
    expect(nodes(opened).find(n => n.props['aria-label'] === 'Precio')?.props['aria-pressed']).toBe(false);
  });
  it('locks only the service quantity tile and shows the character count', () => {
    const props = { ...base(), quantityLocked: true, message: 'Texto' };
    const view = AlternativeChangeEditor(props);
    expect(nodes(view).find(n => n.props['aria-label'] === 'Cantidad')?.props.disabled).toBe(true);
    expect(nodes(view).find(n => n.type === 'textarea')?.props.maxLength).toBe(1000);
    expect(nodes(view).some(n => Array.isArray(n.props.children) && n.props.children.join('') === '5/1000')).toBe(true);
  });
  it('saves a changed integer price only after Guardar, without changing unrelated fields', () => {
    const props = { ...base(), kind: 'price' as const, close: vi.fn() };
    expect(save(panel(props)).props.valid).toBe(false);
    input(panel(props), 'Nuevo precio por unidad').props.onChange({ target: { value: '1500' } });
    expect(props.onApply).not.toHaveBeenCalled(); expect(save(panel(props)).props.valid).toBe(true);
    save(panel(props)).props.onClick(); expect(props.onApply).toHaveBeenCalledExactlyOnceWith('price', { price: '1500' });
    expect(props.close).toHaveBeenCalledOnce();
  });
  it.each(['1.5', '-1', '0', '1e3', '50000001', '1000'])('does not save invalid or unchanged price %s', price => {
    const props = { ...base(), kind: 'price' as const, close: vi.fn() };
    input(panel(props), 'Nuevo precio por unidad').props.onChange({ target: { value: price } });
    const view = panel(props); expect(save(view).props.valid).toBe(false); save(view).props.onClick(); expect(props.onApply).not.toHaveBeenCalled();
  });
  it('requires an explicit CUSTOM total, preserves limits, and allows price editing as total', () => {
    const props = { ...base(), kind: 'item' as const, close: vi.fn() };
    let view = panel(props); expect(save(view).props.valid).toBe(false);
    const names = () => nodes(panel(props)).filter(n => n.type === 'input');
    names().find(n => n.props.maxLength === 120)!.props.onChange({ target: { value: 'Conjunto alternativo' } });
    input(panel(props), 'Precio total de la opción escrita').props.onChange({ target: { value: '10000' } });
    expect(save(panel(props)).props.valid).toBe(true); save(panel(props)).props.onClick();
    expect(props.onApply).toHaveBeenCalledWith('item', { name: 'Conjunto alternativo', description: '', price: '10000' });
    hooks.slots = []; const custom = { ...base(), kind: 'price' as const, customBasePrice: '10000', close: vi.fn() };
    custom.selected.add('item'); custom.line.price = '10000';
    input(panel(custom), 'Nuevo precio total de la opción').props.onChange({ target: { value: '12000' } });
    expect(save(panel(custom)).props.valid).toBe(true); save(panel(custom)).props.onClick();
    expect(custom.onApply).toHaveBeenCalledWith('price', { price: '12000' });
  });
  it('rejects oversized CUSTOM fields even when values are assigned programmatically', () => {
    const props = { ...base(), kind: 'item' as const, close: vi.fn() };
    nodes(panel(props)).find(n => n.type === 'input' && n.props.maxLength === 120)!.props.onChange({ target: { value: 'x'.repeat(121) } });
    input(panel(props), 'Precio total de la opción escrita').props.onChange({ target: { value: '10000' } });
    expect(save(panel(props)).props.valid).toBe(false);
    nodes(panel(props)).find(n => n.type === 'input' && n.props.maxLength === 120)!.props.onChange({ target: { value: 'Válido' } });
    nodes(panel(props)).find(n => n.type === 'textarea')!.props.onChange({ target: { value: 'x'.repeat(501) } });
    expect(save(panel(props)).props.valid).toBe(false);
  });
  it.each([['2026-10-19', '16:30', false], ['2026-09-06', '00:30', false], ['2026-04-04', '23:30', false], ['2099-11-10', '16:30', true]])('validates future Chile availability %s %s', (date, time, valid) => {
    const props = { ...base(), kind: 'schedule' as const, schedule: { immediate: false, date, time }, close: vi.fn() };
    expect(save(panel(props)).props.valid).toBe(valid);
  });
  it('does not save unchanged immediate availability and can close or remove without applying', () => {
    const props = { ...base(), kind: 'schedule' as const, close: vi.fn() }; props.selected.add('schedule');
    const view = panel(props); expect(save(view).props.valid).toBe(false);
    nodes(view).find(n => n.type === 'button' && n.props.children === 'Cerrar edición sin guardar')!.props.onClick();
    expect(props.close).toHaveBeenCalledOnce(); expect(props.onApply).not.toHaveBeenCalled();
    nodes(view).find(n => n.type === 'button' && n.props.children === 'Quitar cambio')!.props.onClick();
    expect(props.onRemove).toHaveBeenCalledExactlyOnceWith('schedule');
  });
});
