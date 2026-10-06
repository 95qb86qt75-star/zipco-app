import React from "react";
import { ChevronRight, Clock, X } from "lucide-react";
import { groupSchedule } from "./ScheduleCard";
import type { BusinessDay, BusinessSchedule, ScheduleDayId } from "./types";

type Props = {
  days: BusinessDay[];
  schedule: BusinessSchedule;
  onEdit: () => void;
};

function dayName(days: BusinessDay[], dayId: ScheduleDayId) {
  return days.find((day) => day.id === dayId)?.name || dayId;
}

function shortTime(value: string) {
  const [hour = "0", minute = "00"] = value.split(":");
  return `${Number(hour)}:${minute}`;
}

export default function ScheduleSummaryCard({ days, schedule, onEdit }: Props) {
  const groups = groupSchedule(days, schedule);
  const closedDays = days.filter((day) => !schedule[day.id]?.enabled);

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group mb-2 w-full rounded-2xl border border-white/50 bg-white/80 p-5 text-left shadow-md backdrop-blur-sm transition-all hover:border-teal-200 hover:shadow-lg active:scale-[0.99] dark:border-slate-600 dark:bg-slate-900/85"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Clock className="h-5 w-5 text-teal-500" />
          Horarios de Atención
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-300">
          Editar
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>

      <span className="mt-3 block space-y-1.5">
        {groups.length === 0 && (
          <span className="block rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-300">
            Aún no has configurado horarios.
          </span>
        )}
        {groups.map((group) => (
          <span
            key={`${group.open}-${group.close}`}
            className="grid grid-cols-[1fr_auto] gap-3 text-xs"
          >
            <strong className="min-w-0 text-slate-700 dark:text-slate-100">
              {group.dayIds.map((id) => dayName(days, id)).join(" · ")}
            </strong>
            <span className="whitespace-nowrap text-slate-500 dark:text-slate-300">
              {shortTime(group.open)}–{shortTime(group.close)}
            </span>
          </span>
        ))}
        {closedDays.length > 0 && (
          <span className="flex items-start gap-1.5 pt-1 text-xs text-slate-400 dark:text-slate-400">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Cerrado: {closedDays.map((day) => day.name).join(", ")}
          </span>
        )}
      </span>
    </button>
  );
}
