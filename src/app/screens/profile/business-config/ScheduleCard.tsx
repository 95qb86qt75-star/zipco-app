import React, {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, Clock, Pencil, Plus, X } from "lucide-react";
import type { BusinessDay, BusinessSchedule, ScheduleDayId } from "./types";

type ScheduleCardProps = {
  days: BusinessDay[];
  schedule: BusinessSchedule;
  setSchedule: Dispatch<SetStateAction<BusinessSchedule>>;
};

type ScheduleGroup = { dayIds: ScheduleDayId[]; open: string; close: string };

const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "20:00";
const hours = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const minutes = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

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

function parseTime(value: string): {
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!value) return { hour: "08", minute: "00", period: "AM" };
  const [rawHour, rawMinute] = value.split(":").map(Number);
  const period = rawHour >= 12 ? "PM" : "AM";
  const hour12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(rawMinute || 0).padStart(2, "0"),
    period,
  };
}

function toTime(hour: string, minute: string, period: string): string {
  let parsedHour = Number.parseInt(hour, 10);
  if (period === "PM" && parsedHour !== 12) parsedHour += 12;
  if (period === "AM" && parsedHour === 12) parsedHour = 0;
  return `${String(parsedHour).padStart(2, "0")}:${minute}`;
}

function formatTime(value: string): string {
  const { hour, minute, period } = parseTime(value);
  return `${Number(hour)}:${minute} ${period}`;
}

function TimeSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { hour, minute, period } = parseTime(value);
  const selectClass =
    "zipco-readable-field min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <select
          aria-label={`${label}: hora`}
          value={hour}
          onChange={(event) =>
            onChange(toTime(event.target.value, minute, period))
          }
          className={`${selectClass} flex-1`}
        >
          {hours.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-xs font-black text-slate-400">:</span>
        <select
          aria-label={`${label}: minutos`}
          value={minute}
          onChange={(event) =>
            onChange(toTime(hour, event.target.value, period))
          }
          className={`${selectClass} flex-1`}
        >
          {minutes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label}: período`}
          value={period}
          onChange={(event) =>
            onChange(toTime(hour, minute, event.target.value))
          }
          className={`${selectClass} flex-1`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
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
  const closedDays = days.filter((day) => !schedule[day.id]?.enabled);
  const dayName = (dayId: ScheduleDayId) =>
    days.find((day) => day.id === dayId)?.name || dayId;

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

  const closeSelectedDays = () => {
    if (selectedDayIds.length === 0) return setSelectionError(true);
    setSchedule((current) => {
      const next = { ...current };
      selectedDayIds.forEach((dayId) => {
        next[dayId] = { ...next[dayId], enabled: false };
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

  const startNewGroup = () => {
    setSelectedDayIds([]);
    setDraftOpen(DEFAULT_OPEN);
    setDraftClose(DEFAULT_CLOSE);
    setSelectionError(false);
  };

  return (
    <section className="mb-2 rounded-2xl border border-white/50 bg-white/80 p-5 shadow-md backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/85">
      <div className="mb-4">
        <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Clock className="h-5 w-5 text-teal-500" />
          Añadir o editar horario
        </h4>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">
          Selecciona los días y aplica una hora de apertura y cierre.
        </p>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-3.5 dark:border-teal-400/20 dark:bg-teal-400/5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
          1. Elige los días
        </p>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => {
            const isSelected = selectedDayIds.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleDay(day.id)}
                className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${isSelected ? "border-teal-500 bg-teal-500 text-white shadow-sm shadow-teal-500/25" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}
              >
                {isSelected && <Check className="mr-1 inline h-3.5 w-3.5" />}
                {day.name}
              </button>
            );
          })}
        </div>
        {selectionError && (
          <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
            Selecciona al menos un día.
          </p>
        )}
        <div className="my-4 h-px bg-teal-100 dark:bg-slate-700" />
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-200">
          2. Define el horario
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TimeSelector
            label="Apertura"
            value={draftOpen}
            onChange={setDraftOpen}
          />
          <TimeSelector
            label="Cierre"
            value={draftClose}
            onChange={setDraftClose}
          />
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={applySchedule}
            className="min-h-11 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-3 text-sm font-bold text-white shadow-md shadow-teal-500/20 transition active:scale-[0.98]"
          >
            Aplicar horario
            {selectedDayIds.length > 0
              ? ` a ${selectedDayIds.length} ${selectedDayIds.length === 1 ? "día" : "días"}`
              : ""}
          </button>
          <button
            type="button"
            onClick={closeSelectedDays}
            aria-label="Marcar días seleccionados como cerrados"
            title="Marcar como cerrados"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-500 active:scale-95 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          La × marca los días seleccionados como cerrados.
        </p>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h5 className="text-sm font-black text-slate-900 dark:text-white">
            Resumen semanal
          </h5>
          <button
            type="button"
            onClick={startNewGroup}
            className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-teal-600 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-400/10"
          >
            <Plus className="h-4 w-4" />
            Otro horario
          </button>
        </div>
        <div className="space-y-2">
          {scheduleGroups.map((group) => (
            <button
              key={`${group.open}-${group.close}`}
              type="button"
              onClick={() => editGroup(group)}
              className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
                <Clock className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-slate-900 dark:text-white">
                  {group.dayIds.map(dayName).join(" · ")}
                </strong>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-300">
                  {formatTime(group.open)} – {formatTime(group.close)}
                </span>
              </span>
              <Pencil className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-teal-500" />
            </button>
          ))}
          {scheduleGroups.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-600 dark:text-slate-300">
              Todavía no has agregado horarios de atención.
            </div>
          )}
          {closedDays.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800/80">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                <strong>Cerrado:</strong>{" "}
                {closedDays.map((day) => day.name).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
