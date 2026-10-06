import React, {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import type { BusinessDay, BusinessSchedule, ScheduleDayId } from "./types";

type ScheduleCardProps = {
  days: BusinessDay[];
  schedule: BusinessSchedule;
  setSchedule: Dispatch<SetStateAction<BusinessSchedule>>;
};

type ScheduleGroup = { dayIds: ScheduleDayId[]; open: string; close: string };

const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "20:00";
const shortDayNames: Record<ScheduleDayId, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

export function groupSchedule(
  days: BusinessDay[],
  schedule: BusinessSchedule,
): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();
  days.forEach((day) => {
    const current = schedule[day.id];
    if (!current?.enabled) return;
    const open = current.open || DEFAULT_OPEN;
    const close = current.close || DEFAULT_CLOSE;
    const key = `${open}|${close}`;
    const group = groups.get(key);
    if (group) group.dayIds.push(day.id);
    else groups.set(key, { dayIds: [day.id], open, close });
  });
  return Array.from(groups.values());
}

function parseTime(value: string) {
  const [rawHour = 0, rawMinute = 0] = value.split(":").map(Number);
  const period = rawHour >= 12 ? "PM" : "AM";
  const hour12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
  return `${String(hour12).padStart(2, "0")}:${String(rawMinute).padStart(2, "0")} ${period}`;
}

function groupLabel(group: ScheduleGroup, days: BusinessDay[]) {
  const indexes = group.dayIds.map((id) =>
    days.findIndex((day) => day.id === id),
  );
  const consecutive = indexes.every(
    (value, index) => index === 0 || value === indexes[index - 1] + 1,
  );
  if (group.dayIds.length > 1 && consecutive) {
    return `${days[indexes[0]].name} – ${days[indexes[indexes.length - 1]].name}`;
  }
  return group.dayIds
    .map((id) => days.find((day) => day.id === id)?.name || id)
    .join(" · ");
}

function TimeField({
  label,
  value,
  onChange,
  kind,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: "open" | "close";
}) {
  const Icon = kind === "open" ? Sun : Moon;
  return (
    <label className="relative flex min-h-[58px] min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/15 dark:border-slate-600 dark:bg-slate-800">
      <Icon
        className={`h-6 w-6 shrink-0 ${kind === "open" ? "text-amber-500" : "text-violet-500"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-[#667085] dark:text-slate-300">
          {label}
        </span>
        <span className="block whitespace-nowrap text-base font-bold text-[#10172F] dark:text-white">
          {parseTime(value)}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        type="time"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

export default function ScheduleCard({
  days,
  schedule,
  setSchedule,
}: ScheduleCardProps) {
  const [selectedDayIds, setSelectedDayIds] = useState<ScheduleDayId[]>([]);
  const [draftOpen, setDraftOpen] = useState(DEFAULT_OPEN);
  const [draftClose, setDraftClose] = useState(DEFAULT_CLOSE);
  const [selectionError, setSelectionError] = useState(false);
  const scheduleGroups = useMemo(
    () => groupSchedule(days, schedule),
    [days, schedule],
  );

  const toggleDay = (dayId: ScheduleDayId) => {
    setSelectionError(false);
    setSelectedDayIds((current) =>
      current.includes(dayId)
        ? current.filter((id) => id !== dayId)
        : [...current, dayId],
    );
  };

  const applySchedule = () => {
    if (selectedDayIds.length === 0) return setSelectionError(true);
    setSchedule((current) => {
      const next = { ...current };
      selectedDayIds.forEach((dayId) => {
        next[dayId] = { enabled: true, open: draftOpen, close: draftClose };
      });
      return next;
    });
    setSelectedDayIds([]);
    setSelectionError(false);
  };

  const editGroup = (group: ScheduleGroup) => {
    setSelectedDayIds(group.dayIds);
    setDraftOpen(group.open);
    setDraftClose(group.close);
    setSelectionError(false);
  };

  const deleteGroup = (group: ScheduleGroup) => {
    setSchedule((current) => {
      const next = { ...current };
      group.dayIds.forEach((dayId) => {
        next[dayId] = { ...next[dayId], enabled: false };
      });
      return next;
    });
    setSelectedDayIds((current) =>
      current.filter((id) => !group.dayIds.includes(id)),
    );
  };

  return (
    <section className="space-y-[18px]">
      <div className="rounded-[20px] border border-teal-200/70 bg-teal-50/40 p-4 shadow-[0_4px_16px_rgba(15,159,152,0.06)] dark:border-teal-400/20 dark:bg-teal-400/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
            <Clock className="h-5 w-5" />
          </span>
          <span>
            <strong className="block text-base font-black text-[#10172F] dark:text-white">
              Añadir horario
            </strong>
            <span className="mt-0.5 block text-xs leading-5 text-[#667085] dark:text-slate-300">
              Selecciona los días que compartirán el mismo horario.
            </span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const selected = selectedDayIds.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleDay(day.id)}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center rounded-[13px] border px-0.5 text-[11px] font-black transition-all duration-200 active:scale-95 ${selected ? "border-[#00BFA5] bg-gradient-to-b from-[#00BFA5] to-[#009688] text-white shadow-[0_4px_10px_rgba(0,191,165,0.2)]" : "border-[#E2E8F0] bg-white text-slate-700 shadow-[0_2px_5px_rgba(15,23,42,0.04)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}
              >
                <span>{shortDayNames[day.id]}</span>
                {selected && <Check className="mt-1 h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
        {selectionError && (
          <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
            Selecciona al menos un día.
          </p>
        )}

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
          <TimeField
            label="Apertura"
            value={draftOpen}
            onChange={setDraftOpen}
            kind="open"
          />
          <span className="font-black text-slate-400">–</span>
          <TimeField
            label="Cierre"
            value={draftClose}
            onChange={setDraftClose}
            kind="close"
          />
        </div>

        <button
          type="button"
          onClick={applySchedule}
          className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0F9F98] to-[#00BFA5] px-4 text-sm font-black text-white shadow-[0_6px_16px_rgba(0,191,165,0.18)] transition active:scale-[0.98]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-teal-600">
            <Plus className="h-4 w-4" />
          </span>
          Añadir a la lista
        </button>
      </div>

      <div>
        <h3 className="text-base font-black text-[#10172F] dark:text-white">
          Horarios configurados
        </h3>
        <p className="mb-3 mt-0.5 text-xs leading-5 text-[#667085] dark:text-slate-300">
          Aquí se muestran los días y horarios que ya agregaste.
        </p>
        <div className="space-y-2.5">
          {scheduleGroups.map((group) => (
            <div
              key={`${group.open}-${group.close}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-2xl border border-[#E6EAF0] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
                <CalendarDays className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs font-black text-[#10172F] dark:text-white">
                  {groupLabel(group, days)}
                </strong>
                <span className="mt-0.5 block text-[11px] text-[#667085] dark:text-slate-300">
                  {group.dayIds.length}{" "}
                  {group.dayIds.length === 1 ? "día" : "días"}
                </span>
              </span>
              <span className="whitespace-nowrap text-[11px] font-semibold text-[#667085] dark:text-slate-200">
                {parseTime(group.open)} – {parseTime(group.close)}
              </span>
              <button
                type="button"
                aria-label={`Editar ${groupLabel(group, days)}`}
                onClick={() => editGroup(group)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Eliminar ${groupLabel(group, days)}`}
                onClick={() => deleteGroup(group)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFE4E6] bg-[#FFF1F2] text-red-500 transition active:scale-95 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {scheduleGroups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center dark:border-slate-600 dark:bg-slate-800/50">
              <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-500" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-200">
                Aún no hay horarios configurados
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                Selecciona los días y añade tu primer horario arriba.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2.5 rounded-2xl bg-indigo-50/70 px-3.5 py-3 text-xs leading-5 text-slate-600 dark:bg-indigo-400/10 dark:text-indigo-100">
        <span className="font-black text-indigo-500 dark:text-indigo-300">
          ⓘ
        </span>
        <p>
          Los días que no tengan un horario asignado se considerarán cerrados.
        </p>
      </div>
    </section>
  );
}
