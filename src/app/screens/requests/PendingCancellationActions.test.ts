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
import PendingCancellationActions from './PendingCancellationActions';
import { normalizeMyOrdersPayload } from './orderNormalization';
import { cancelPendingOrder } from './pendingCancellationFixtures';
type Node = React.ReactElement<Record<string, any>>;
const nodes = (root: React.ReactNode): Node[] => React.Children.toArray(root).flatMap(child =>
  React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
const render = (input = cancelPendingOrder) => { state.index = 0; return PendingCancellationActions({
  order: normalizeMyOrdersPayload([input])[0], refresh: vi.fn(),
}); };
const button = (root: React.ReactNode, text: string) => nodes(root).find(node => node.type === 'button' &&
  React.Children.toArray(node.props.children).includes(text))!;
const open = () => button(render(), 'Anular solicitud').props.onClick({ currentTarget: null });
beforeEach(() => { state.slots = []; state.busy = false; state.pending = null; state.restored = false;
  state.run.mockReset().mockResolvedValue(true); state.retry.mockReset(); state.update.mockReset(); vi.stubGlobal('React', React); });
afterEach(() => vi.unstubAllGlobals());

describe('deliberate pending cancellation UI', () => {
  it('opens the exact Sí/No confirmation without running an action; No only closes it', () => {
    open(); const popup = render();
    expect(nodes(popup).find(node => node.type === AlertDialog.Title)?.props.children).toBe('¿Confirmas anulación de tu pedido?');
    expect(button(popup, 'Sí')).toBeDefined(); expect(button(popup, 'No')).toBeDefined();
    expect(state.run).not.toHaveBeenCalled();
    nodes(popup).find(node => node.type === AlertDialog.Root)!.props.onOpenChange(false);
    expect(nodes(render()).some(node => node.type === AlertDialog.Root)).toBe(false);
    expect(state.run).not.toHaveBeenCalled(); expect(state.retry).not.toHaveBeenCalled();
    expect(nodes(popup).some(node => node.type === 'select' || node.type === 'textarea' || node.type === 'input')).toBe(false);
  });

  it('sends only CANCEL_PENDING_REQUEST after Sí and blocks closing while busy', async () => {
    open(); await button(render(), 'Sí').props.onClick();
    expect(state.run).toHaveBeenCalledExactlyOnceWith('CANCEL_PENDING_REQUEST');
    expect(nodes(render()).some(node => node.type === AlertDialog.Root)).toBe(false);
    open(); state.busy = true; const busy = render();
    expect(button(busy, 'No').props.disabled).toBe(true);
    expect(button(busy, 'Anulando…').props.disabled).toBe(true);
    nodes(busy).find(node => node.type === AlertDialog.Root)!.props.onOpenChange(false);
    expect(nodes(render()).some(node => node.type === AlertDialog.Root)).toBe(true);
  });

  it('removes a stale confirmation when permission disappears', () => {
    open();
    expect(render({ ...cancelPendingOrder, requestProcess: { ...cancelPendingOrder.requestProcess, allowedActions: [] } })).toBeNull();
    expect(state.run).not.toHaveBeenCalled();
  });

  it('offers the saved retry after uncertainty and requires a read for restored intentions', () => {
    state.pending = { action: 'CANCEL_PENDING_REQUEST' };
    button(render(), 'Reintentar anulación pendiente').props.onClick();
    expect(state.retry).toHaveBeenCalledOnce(); expect(state.run).not.toHaveBeenCalled();
    state.restored = true;
    expect(button(render(), 'Reintentar anulación pendiente')).toBeUndefined();
    button(render(), 'Actualizar estado').props.onClick(); expect(state.update).toHaveBeenCalledOnce();
  });
});
