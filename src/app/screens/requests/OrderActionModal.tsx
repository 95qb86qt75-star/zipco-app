import { useState } from 'react';
import { ORDER_ACTION_COPY } from './orderPresentation';
import type { CancellationReason, OrderAction } from './types';

const REASONS: Array<{ code: CancellationReason; label: string }> = [
  { code: 'no_longer_needed', label: 'Ya no lo necesitaba' },
  { code: 'business_took_too_long', label: 'El negocio tardó demasiado' },
  { code: 'selected_by_mistake', label: 'Lo seleccioné por error' }
];

type Props = {
  action: OrderAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason?: CancellationReason) => void;
};

export default function OrderActionModal({ action, isSubmitting, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<CancellationReason | null>(null);
  if (!action) return null;
  const needsReason = action === 'cancel';
  const copy = ORDER_ACTION_COPY[action];

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">{copy.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{copy.description}</p>
        {needsReason && (
          <fieldset className="mt-4 space-y-2">
            <legend className="mb-2 text-sm font-semibold text-gray-800">Motivo de cancelación</legend>
            {REASONS.map((item) => (
              <label key={item.code} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <input
                  type="radio"
                  name="cancellation-reason"
                  checked={reason === item.code}
                  onChange={() => setReason(item.code)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
        )}
        <div className="mt-5 flex gap-2">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold">
            Volver
          </button>
          <button
            type="button"
            disabled={isSubmitting || (needsReason && !reason)}
            onClick={() => onConfirm(reason ?? undefined)}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
