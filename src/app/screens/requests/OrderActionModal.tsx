import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { ORDER_ACTION_COPY } from "./orderPresentation";
import type { ClosureReason, OrderAction } from "./types";

const CANCELLATION_REASONS: Array<{ code: ClosureReason; label: string }> = [
  { code: "no_longer_needed", label: "Ya no lo necesitaba" },
  { code: "business_took_too_long", label: "El negocio tardó demasiado" },
  { code: "selected_by_mistake", label: "Lo seleccioné por error" },
  { code: "requirements_changed", label: "Cambiaron mis necesidades" },
  { code: "other", label: "Otro motivo" },
];

const REJECTION_REASONS: Array<{ code: ClosureReason; label: string }> = [
  { code: "unavailable", label: "Producto o servicio no disponible" },
  {
    code: "cannot_meet_schedule",
    label: "No puedo cumplir la fecha u horario solicitado",
  },
  {
    code: "outside_service_area",
    label: "Solicitud fuera de mi zona de atención",
  },
  {
    code: "insufficient_information",
    label: "Información insuficiente para procesarla",
  },
  { code: "no_capacity", label: "Sin capacidad disponible" },
  { code: "other", label: "Otro motivo" },
];

type Props = {
  action: OrderAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason?: ClosureReason, detail?: string) => void;
};

export default function OrderActionModal({
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState<ClosureReason | null>(null);
  const [detail, setDetail] = useState("");
  if (!action) return null;
  const needsReason = action === "cancel" || action === "reject";
  const reasons =
    action === "reject" ? REJECTION_REASONS : CANCELLATION_REASONS;
  const copy = ORDER_ACTION_COPY[action];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-md sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="zipco-action-dialog w-full max-w-sm rounded-[26px] border border-teal-200/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.28)] dark:border-teal-400/35 dark:bg-slate-900"
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-[0_0_24px_rgba(20,184,166,.3)]">
          {action === "mark-ready" ? (
            <BellRing className="h-6 w-6" />
          ) : (
            <CheckCircle2 className="h-6 w-6" />
          )}
        </span>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">
          {copy.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          {copy.description}
        </p>
        {needsReason && (
          <fieldset className="mt-4 space-y-2">
            <legend className="mb-2 text-sm font-semibold text-gray-800">
              {action === "reject"
                ? "Motivo del rechazo"
                : "Motivo de cancelación"}
            </legend>
            {reasons.map((item) => (
              <label
                key={item.code}
                className="flex items-center gap-3 rounded-xl border p-3 text-sm"
              >
                <input
                  type="radio"
                  name="cancellation-reason"
                  checked={reason === item.code}
                  onChange={() => setReason(item.code)}
                />
                {item.label}
              </label>
            ))}
            {reason === "other" && (
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Escribe el motivo"
                className="w-full rounded-xl border p-3 text-sm"
              />
            )}
          </fieldset>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold dark:border-slate-700 dark:text-slate-200"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={
              isSubmitting ||
              (needsReason &&
                (!reason || (reason === "other" && detail.trim().length < 3)))
            }
            onClick={() =>
              onConfirm(reason ?? undefined, detail.trim() || undefined)
            }
            className="zipco-confirm-action flex-1 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 py-2.5 text-sm font-black text-white shadow-[0_8px_22px_rgba(20,184,166,.25)] disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
