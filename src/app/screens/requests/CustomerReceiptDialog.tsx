import { useRef } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { BellRing, PackageCheck } from 'lucide-react';

export type CustomerReceiptAction = 'ACK_READY_NOTICE' | 'CONFIRM_RECEIPT' | 'DECLARE_PRODUCT_RECEIVED' | 'FINALIZE_REQUEST';

export default function CustomerReceiptDialog({ action, busy, message, onClose, onConfirm }: {
  action: CustomerReceiptAction; busy: boolean; message: string; onClose: () => void; onConfirm: () => void;
}) {
  const previousFocus = useRef(typeof document === 'undefined' ? null : document.activeElement);
  const receipt = action === 'CONFIRM_RECEIPT';
  return <AlertDialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm" />
      <AlertDialog.Content
        className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1001] max-h-[calc(100dvh-3rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[26px] border border-teal-200 bg-white p-5 shadow-2xl dark:border-teal-500/40 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (previousFocus.current instanceof HTMLElement && previousFocus.current.isConnected) previousFocus.current.focus();
        }}>
        <span aria-hidden="true" className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
          {receipt ? <PackageCheck className="h-6 w-6" /> : <BellRing className="h-6 w-6" />}
        </span>
        <AlertDialog.Title className="text-lg font-black text-slate-950 dark:text-white">
          {receipt ? '¿Ya recibiste tu pedido?' : 'Confirmar aviso de pedido listo'}
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {receipt
            ? 'Confirma solo cuando ya tengas el producto. Al confirmar, el pedido finalizará y pasará a Historial con sus condiciones aceptadas.'
            : 'Confirmas que viste el aviso y que retirarás tu pedido según lo coordinado con el negocio. Esto no confirma que ya recibiste el producto. Tu pedido seguirá en Listos.'}
        </AlertDialog.Description>
        {message && <p role="alert" className="mt-3 text-sm text-slate-700 dark:text-slate-200">{message}</p>}
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" disabled={busy} onClick={onConfirm}
            className="min-h-12 rounded-xl bg-teal-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? 'Confirmando…' : receipt ? 'Sí, ya recibí mi pedido' : 'Sí, confirmar aviso'}
          </button>
          <AlertDialog.Cancel asChild><button type="button" disabled={busy}
            className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50">Volver</button></AlertDialog.Cancel>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
