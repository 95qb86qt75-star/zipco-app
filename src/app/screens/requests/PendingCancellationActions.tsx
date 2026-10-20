import { useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Trash2 } from 'lucide-react';
import { coordinationAllowed } from './coordinationApi';
import useCoordination from './useCoordination';
import type { BusinessRequest, MyOrder } from './types';

export default function PendingCancellationActions({ order, refresh }: {
  order: MyOrder | BusinessRequest; refresh: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const operation = useCoordination(order, false, refresh);
  const allowed = order.recordState === 'available' && coordinationAllowed(order.requestProcess, false, 'CANCEL_PENDING_REQUEST');
  const pending = operation.pending();
  const recover = operation.needsUpdate || operation.restored() || Boolean(operation.storageWarning()) ||
    Boolean(pending && pending.action !== 'CANCEL_PENDING_REQUEST');
  if (!allowed && !pending && !recover) return null;
  const submit = async () => {
    if (await operation.run('CANCEL_PENDING_REQUEST')) setConfirm(false);
  };
  return <div className="mt-3" onClick={(event) => event.stopPropagation()}>
    {operation.message && <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">{operation.message}</p>}
    {recover ? <button type="button" disabled={operation.busy} onClick={() => void operation.update()}
      className="min-h-12 w-full rounded-xl border px-3 text-sm font-bold">Actualizar estado</button>
      : pending && !operation.busy ? <div className="space-y-2">
        <button type="button" onClick={() => void operation.retry()} className="min-h-12 w-full rounded-xl border px-3 text-sm font-bold">Reintentar anulación pendiente</button>
        <button type="button" onClick={() => void operation.update()} className="min-h-12 w-full rounded-xl border px-3 text-sm font-bold">Actualizar estado</button>
      </div>
      : <button type="button" disabled={operation.busy || !allowed} onClick={(event) => { previousFocus.current = event.currentTarget; setConfirm(true); }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50 dark:text-red-300">
        <Trash2 className="h-4 w-4" />Anular solicitud
      </button>}
    {confirm && allowed && !recover && (!pending || operation.busy) &&
      <AlertDialog.Root open onOpenChange={(open) => { if (!open && !operation.busy) setConfirm(false); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm" />
          <AlertDialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-red-200 bg-white p-5 shadow-2xl dark:bg-slate-900"
            onEscapeKeyDown={(event) => { if (operation.busy) event.preventDefault(); }}
            onCloseAutoFocus={(event) => { event.preventDefault(); if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true }); }}>
            <AlertDialog.Title className="text-lg font-black text-slate-950 dark:text-white">¿Confirmas anulación de tu pedido?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-slate-600 dark:text-slate-300">La solicitud se conservará en Historial.</AlertDialog.Description>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <AlertDialog.Cancel asChild><button type="button" disabled={operation.busy} className="min-h-12 rounded-xl border px-3 font-bold">No</button></AlertDialog.Cancel>
              <button type="button" disabled={operation.busy} onClick={() => void submit()} className="min-h-12 rounded-xl bg-red-700 px-3 font-bold text-white disabled:opacity-50">{operation.busy ? 'Anulando…' : 'Sí'}</button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>}
  </div>;
}
