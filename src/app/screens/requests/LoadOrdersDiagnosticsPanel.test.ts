import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
  useState: () => ['', vi.fn()],
}));
import LoadOrdersDiagnostics from './LoadOrdersDiagnosticsPanel';
import { clearDiagnostics, diagnoseLoadOrdersRead, diagnosticText } from './loadOrdersDiagnostics';
type Element = React.ReactElement<{ children?: React.ReactNode; onClick?: () => unknown; value?: string }>;
const nodes = (root: React.ReactNode): Element[] => React.Children.toArray(root).flatMap((child) =>
  React.isValidElement(child) ? [child as Element, ...nodes((child as Element).props.children)] : []);
const click = (view: React.ReactNode, label: string) => nodes(view).find((node) =>
  node.type === 'button' && node.props.children === label)!.props.onClick!();
beforeEach(() => { clearDiagnostics(); vi.stubGlobal('React', React); });
afterEach(() => vi.unstubAllGlobals());

it('copies only the sanitized memory report, without refreshing or triggering any request', async () => {
  await expect(diagnoseLoadOrdersRead('loadOrders.customer', async () => { throw new Error('secret'); }, async () => null)).rejects.toThrow();
  const writeText = vi.fn().mockResolvedValue(undefined); const refresh = vi.fn();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const view = LoadOrdersDiagnostics({ refresh });
  click(view, 'Copiar diagnóstico'); await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith(diagnosticText()); expect(writeText.mock.calls[0][0]).not.toContain('secret');
  expect(refresh).not.toHaveBeenCalled();
});
it('updates only by the supplied normal refresh and leaves a selectable report if clipboard is unavailable', async () => {
  vi.stubGlobal('navigator', {}); const refresh = vi.fn();
  const view = LoadOrdersDiagnostics({ refresh });
  click(view, 'Copiar diagnóstico'); await Promise.resolve();
  expect(refresh).not.toHaveBeenCalled();
  expect(renderToStaticMarkup(view)).toContain('Diagnóstico saneado');
  click(view, 'Actualizar Solicitudes'); expect(refresh).toHaveBeenCalledOnce();
  click(view, 'Limpiar diagnóstico'); expect(diagnosticText()).toBe('[]');
});
