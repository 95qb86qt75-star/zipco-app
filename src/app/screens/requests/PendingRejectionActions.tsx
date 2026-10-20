import { useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { X } from 'lucide-react';
import { coordinationAllowed } from './coordinationApi';
import { PENDING_REJECTION_REASONS, validPendingRejectionReason, type PendingRejectionReason } from './requestProcess';
import useCoordination from './useCoordination';
import type { BusinessRequest, MyOrder } from './types';

export default function PendingRejectionActions({ order, refresh }: {
  order: BusinessRequest | MyOrder; refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState<PendingRejectionReason | ''>('');
  const [detail, setDetail] = useState('');
  const previousFocus = useRef<HTMLElement | null>(null);
  const operation = useCoordination(order, true, refresh);
  const allowed = order.recordState === 'available' && coordinationAllowed(order.requestProcess, true, 'REJECT_PENDING_REQUEST');
  const pending = operation.pending();
  const recover = operation.needsUpdate || operation.restored() || Boolean(operation.storageWarning()) || Boolean(pending && pending.action !== 'REJECT_PENDING_REQUEST');
  const valid = validPendingRejectionReason(reason) && (reason !== 'other' || (detail.trim().length > 0 && detail.trim().length <= 1000));
  if (!allowed && !pending && !recover) return null;
  const submit = async () => {
    if (valid && await operation.run('REJECT_PENDING_REQUEST', reason as PendingRejectionReason, detail)) {
      setOpen(false); setConfirm(false); setReason(''); setDetail('');
    }
  };
  return <div className="mt-3" onClick={event => event.stopPropagation()}>
    {operation.message && <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">{operation.message}</p>}
    {recover ? <button type="button" disabled={operation.busy} onClick={() => void operation.update()} className="min-h-12 w-full rounded-xl border px-3 text-sm font-bold">Actualizar estado</button>
      : pending && !operation.busy ? <div className="space-y-2">
        <button type="button" onClick={() => void operation.retry()} className="min-h-12 w-full rounded-xl border px-3 text-sm font-bold">Reintentar rechazo pendiente</button>
        <button type="button" onClick={() => void operation.update()} className="min-h-12 w-full rounded-xl border px-3 text-sm font-bold">Actualizar estado</button>
      </div> : <button type="button" disabled={operation.busy || !allowed} onClick={event => {
        previousFocus.current = event.currentTarget; setConfirm(false); setReason(''); setDetail(''); setOpen(true);
      }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50 dark:text-red-300">
        <X className="h-4 w-4" />Rechazar solicitud
      </button>}
    {open && allowed && !recover && (!pending || operation.busy) && <AlertDialog.Root open onOpenChange={value => {
      if (!value && !operation.busy) { setOpen(false); setConfirm(false); }
    }}><AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm" />
      <AlertDialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1001] max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[26px] border border-red-200 bg-white p-5 shadow-2xl dark:bg-slate-900"
        onEscapeKeyDown={event => { if (operation.busy) event.preventDefault(); }}
        onCloseAutoFocus={event => { event.preventDefault(); if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true }); }}>
        <AlertDialog.Title className="text-lg font-black text-slate-950 dark:text-white">{confirm ? '¿Confirmas que deseas rechazar esta solicitud?' : 'Rechazar solicitud'}</AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-slate-600 dark:text-slate-300">{confirm ? 'Se conservará en Historial y el cliente podrá consultar el motivo.' : 'Selecciona el motivo antes de confirmar.'}</AlertDialog.Description>
        {confirm ? <div className="mt-3 space-y-2 text-sm"><p>{reason && PENDING_REJECTION_REASONS[reason]}</p>{reason === 'other' && <p className="whitespace-pre-wrap break-words">{detail.trim()}</p>}</div>
          : <div className="mt-3 space-y-3">
            <label className="block text-sm font-bold">Motivo<select value={reason} onChange={event => setReason(event.target.value as PendingRejectionReason | '')} className="mt-1 min-h-12 w-full rounded-xl border bg-white px-3 text-sm text-slate-950 dark:bg-slate-900 dark:text-white">
              <option value="">Selecciona un motivo</option>{Object.entries(PENDING_REJECTION_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            {reason === 'other' && <label className="block text-sm font-bold">Explica el motivo<textarea value={detail} maxLength={1000} onChange={event => setDetail(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border p-3 text-sm" /><span className="text-xs font-normal">Obligatorio, hasta 1000 caracteres.</span></label>}
          </div>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {confirm ? <button type="button" disabled={operation.busy} onClick={() => setConfirm(false)} className="min-h-12 rounded-xl border px-3 font-bold">Volver</button>
            : <AlertDialog.Cancel asChild><button type="button" className="min-h-12 rounded-xl border px-3 font-bold">Volver</button></AlertDialog.Cancel>}
          <button type="button" disabled={operation.busy || !valid} onClick={() => confirm ? void submit() : setConfirm(true)} className="min-h-12 rounded-xl bg-red-700 px-3 font-bold text-white disabled:opacity-50">{operation.busy ? 'Rechazando…' : confirm ? 'Confirmar rechazo' : 'Continuar'}</button>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal></AlertDialog.Root>}
  </div>;
}
