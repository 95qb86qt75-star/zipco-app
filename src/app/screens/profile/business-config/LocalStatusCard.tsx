import { Clock, ToggleLeft, ToggleRight } from "lucide-react";

type LocalStatusCardProps = {
  isUsingSchedule: boolean;
  isLoading: boolean;
  onToggle: () => void;
};

export default function LocalStatusCard({
  isUsingSchedule,
  isLoading,
  onToggle,
}: LocalStatusCardProps) {
  return (
    <div
      className={`mb-2 rounded-2xl border p-4 backdrop-blur-sm transition-all ${
        isUsingSchedule
          ? "border-emerald-200 bg-emerald-50/80 shadow-[0_6px_18px_rgba(16,185,129,0.08)] dark:border-emerald-400/25 dark:bg-slate-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          : "bg-[#1F2933] border-[#334155] shadow-[0_10px_24px_rgba(15,23,42,0.24)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex shrink-0 items-center justify-center ${
              isUsingSchedule
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                : "bg-[#334155] text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4
              className={`text-sm font-bold ${isUsingSchedule ? "text-gray-900 dark:text-white" : "text-white"}`}
            >
              Estado del local
            </h4>
            <p
              className={`mt-0.5 text-xs font-semibold ${isUsingSchedule ? "text-emerald-700 dark:text-emerald-300" : "text-slate-300"}`}
            >
              {isUsingSchedule
                ? "Abierto segun horario"
                : "Cerrado temporalmente"}
            </p>
          </div>
        </div>
        {isUsingSchedule ? (
          <ToggleRight className="h-6 w-6 shrink-0 text-emerald-500 dark:text-emerald-300" />
        ) : (
          <ToggleLeft className="w-6 h-6 shrink-0 text-slate-300" />
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={isLoading}
        className={`mt-3 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
          isUsingSchedule
            ? "border-rose-200 bg-white/70 text-rose-600 hover:bg-rose-50 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
            : "border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
        } disabled:opacity-60`}
      >
        {isUsingSchedule ? "Cerrar temporalmente" : "Usar horario configurado"}
      </button>
    </div>
  );
}
