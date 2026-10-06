import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Save, X } from "lucide-react";
import ScheduleCard from "./ScheduleCard";
import type { BusinessDay, BusinessSchedule } from "./types";

type Props = {
  days: BusinessDay[];
  initialSchedule: BusinessSchedule;
  onCancel: () => void;
  onApply: (schedule: BusinessSchedule) => void;
};

export default function ScheduleEditorScreen({
  days,
  initialSchedule,
  onCancel,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<BusinessSchedule>(() =>
    structuredClone(initialSchedule),
  );
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialSchedule),
    [draft, initialSchedule],
  );

  const handleBack = () => {
    if (hasChanges) setShowExitConfirmation(true);
    else onCancel();
  };

  return (
    <div className="relative flex size-full flex-col bg-[#F0F4FF] dark:bg-slate-950">
      <header
        className="border-b border-white/60 bg-white/75 px-4 pb-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver a configuración"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              Horarios de Atención
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-300">
              Agrupa los días que tienen el mismo horario.
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
            <CalendarClock className="h-5 w-5" />
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
        <ScheduleCard days={days} schedule={draft} setSchedule={setDraft} />
      </main>

      <footer
        className="border-t border-slate-200 bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 font-black text-white shadow-lg shadow-teal-500/20 transition active:scale-[0.98]"
        >
          <Save className="h-5 w-5" />
          Aplicar horarios
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Después confirma con “Guardar cambios” en Configuración.
        </p>
      </footer>

      {showExitConfirmation && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-6 backdrop-blur-sm">
          <div className="w-full rounded-3xl border border-white/20 bg-white p-5 shadow-2xl dark:bg-slate-900">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
              <X className="h-6 w-6" />
            </span>
            <h3 className="mt-3 text-center text-lg font-black text-slate-950 dark:text-white">
              ¿Salir sin aplicar?
            </h3>
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-300">
              Los cambios realizados en los horarios se perderán.
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-12 w-full rounded-xl bg-red-50 font-bold text-red-600 dark:bg-red-400/10 dark:text-red-300"
              >
                Salir sin aplicar
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirmation(false)}
                className="min-h-12 w-full rounded-xl bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
