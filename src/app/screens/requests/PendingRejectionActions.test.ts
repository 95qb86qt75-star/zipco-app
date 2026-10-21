import * as React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ slots: [] as any[], index: 0, busy: false, pending: null as any,
  run: vi.fn(), retry: vi.fn(), update: vi.fn(), restored: false }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useRef: (current: any) => ({ current }),
  useState: (initial: any) => { const index = state.index++; if (!(index in state.slots)) state.slots[index] = initial;
    return [state.slots[index], (value: any) => { state.slots[index] = value; }]; },
}));
vi.mock('./useCoordination', () => ({ default: () => ({ busy: state.busy, message: '', needsUpdate: false,
  pending: () => state.pending, restored: () => state.restored, storageWarning: () => '',
  run: state.run, retry: state.retry, update: state.update }) }));
import PendingRejectionActions from './PendingRejectionActions';
import RejectGlassButton from './RejectGlassButton';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { rejectPendingOrder } from './pendingRejectionFixtures';

type Node = React.ReactElement<Record<string, any>>;
const nodes = (root: React.ReactNode): Node[] => React.Children.toArray(root).flatMap(child =>
  React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
const render = (input = rejectPendingOrder) => { state.index = 0; return PendingRejectionActions({
  order: normalizeBusinessOrdersPayload([input])[0], refresh: vi.fn(),
}); };
const button = (root: React.ReactNode, text: string) => nodes(root).find(node => node.type === 'button' &&
  React.Children.toArray(node.props.children).includes(text))!;
const open = () => nodes(render()).find(node => node.type === RejectGlassButton)!.props.onClick({ currentTarget: null });
const choose = (value: string) => nodes(render()).find(node => node.type === 'select')!.props.onChange({ target: { value } });
beforeEach(() => { state.slots = []; state.busy = false; state.pending = null; state.restored = false;
  state.run.mockReset().mockResolvedValue(true); state.retry.mockReset(); state.update.mockReset(); vi.stubGlobal('React', React); });
afterEach(() => vi.unstubAllGlobals());

describe('business pending rejection UI', () => {
  it('requires a reason then explicit confirmation; volver sends nothing', () => {
    open(); expect(button(render(), 'Continuar').props.disabled).toBe(true);
    expect(nodes(render()).filter(node => node.type === 'option')).toHaveLength(7);
    choose('unavailable'); button(render(), 'Continuar').props.onClick();
    expect(nodes(render()).find(node => node.type === AlertDialog.Title)?.props.children).toBe('¿Confirmas que deseas rechazar esta solicitud?');
    expect(state.run).not.toHaveBeenCalled(); button(render(), 'Volver').props.onClick();
    expect(button(render(), 'Continuar')).toBeDefined();
    nodes(render()).find(node => node.type === AlertDialog.Root)!.props.onOpenChange(false);
    expect(nodes(render()).some(node => node.type === AlertDialog.Root)).toBe(false);
    expect(state.run).not.toHaveBeenCalled();
  });

  it('requires other detail and sends only the confirmed rejection, locking the popup while busy', async () => {
    open(); choose('other'); expect(button(render(), 'Continuar').props.disabled).toBe(true);
    const change = (value: string) => nodes(render()).find(node => node.type === 'textarea')!.props.onChange({ target: { value } });
    change('   '); expect(button(render(), 'Continuar').props.disabled).toBe(true);
    change('x'.repeat(1001)); expect(button(render(), 'Continuar').props.disabled).toBe(true);
    change('  Motivo sintético  '); button(render(), 'Continuar').props.onClick();
    state.busy = true; expect(button(render(), 'Volver').props.disabled).toBe(true);
    expect(button(render(), 'Rechazando…').props.disabled).toBe(true);
    nodes(render()).find(node => node.type === AlertDialog.Root)!.props.onOpenChange(false);
    expect(nodes(render()).some(node => node.type === AlertDialog.Root)).toBe(true);
    state.busy = false; await button(render(), 'Confirmar rechazo').props.onClick();
    expect(state.run).toHaveBeenCalledExactlyOnceWith('REJECT_PENDING_REQUEST', 'other', '  Motivo sintético  ');
    expect(nodes(render()).some(node => node.type === AlertDialog.Root)).toBe(false);
  });

  it('removes stale permission and uses read-only recovery for restored or different intentions', () => {
    open(); expect(render({ ...rejectPendingOrder, requestProcess: { ...rejectPendingOrder.requestProcess, allowedActions: [] } })).toBeNull();
    state.pending = { action: 'REJECT_PENDING_REQUEST' };
    button(render(), 'Reintentar rechazo pendiente').props.onClick(); expect(state.retry).toHaveBeenCalledOnce();
    state.restored = true; expect(button(render(), 'Reintentar rechazo pendiente')).toBeUndefined();
    button(render(), 'Actualizar estado').props.onClick(); expect(state.update).toHaveBeenCalledOnce();
    state.restored = false; state.pending = { action: 'START_WORK' };
    expect(button(render(), 'Reintentar rechazo pendiente')).toBeUndefined();
    expect(state.run).not.toHaveBeenCalled();
  });
});
