import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), useRef: (current: unknown) => ({ current }) }));
vi.mock('@radix-ui/react-alert-dialog', () => ({
  Root: ({ children }: { children: React.ReactNode }) => children,
  Portal: ({ children }: { children: React.ReactNode }) => children,
  Overlay: () => null,
  Content: ({ children }: { children: React.ReactNode }) => React.createElement('div', { role: 'alertdialog' }, children),
  Title: ({ children }: { children: React.ReactNode }) => React.createElement('h2', {}, children),
  Description: ({ children }: { children: React.ReactNode }) => React.createElement('p', {}, children),
  Cancel: ({ children }: { children: React.ReactNode }) => children,
}));
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import CustomerReceiptDialog from './CustomerReceiptDialog';
type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function nodes(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
}
beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

describe('deliberate customer confirmation dialogs', () => {
  it.each(['ACK_READY_NOTICE', 'CONFIRM_RECEIPT'] as const)('explains %s and only sends on deliberate confirmation', (action) => {
    const onConfirm = vi.fn(), onClose = vi.fn();
    const view = CustomerReceiptDialog({ action, busy: false, message: '', onConfirm, onClose });
    const html = renderToStaticMarkup(view);
    expect(html).toContain(action === 'ACK_READY_NOTICE' ? 'Tu pedido seguirá en Listos.' : 'el pedido finalizará y pasará a Historial');
    expect(html).toContain(action === 'ACK_READY_NOTICE' ? 'Esto no confirma que ya recibiste el producto.' : 'Confirma solo cuando ya tengas el producto.');
    expect(onConfirm).not.toHaveBeenCalled();
    const button = nodes(view).find((node) => node.type === 'button' && node.props.onClick)!;
    (button.props.onClick as () => void)(); expect(onConfirm).toHaveBeenCalledOnce();
    (view.props.onOpenChange as (open: boolean) => void)(false); expect(onClose).toHaveBeenCalledOnce();
  });
  it('locks dismissal and controls during an uncertain POST and presents safe errors', () => {
    const onClose = vi.fn();
    const view = CustomerReceiptDialog({ action: 'CONFIRM_RECEIPT', busy: true, message: 'No se pudo confirmar la operación.', onClose, onConfirm: vi.fn() });
    expect(nodes(view).filter((node) => node.type === 'button').every((node) => node.props.disabled)).toBe(true);
    (view.props.onOpenChange as (open: boolean) => void)(false); expect(onClose).not.toHaveBeenCalled();
    const content = nodes(view).find((node) => node.type === AlertDialog.Content)!;
    const preventDefault = vi.fn(); (content.props.onEscapeKeyDown as (event: unknown) => void)({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(renderToStaticMarkup(view)).toContain('No se pudo confirmar la operación.');
  });
});
