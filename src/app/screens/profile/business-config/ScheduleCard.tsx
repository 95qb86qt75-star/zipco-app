import type { Dispatch, SetStateAction } from 'react';
import { Check, Clock } from 'lucide-react';
import type { BusinessDay, BusinessSchedule } from './types';

type ScheduleCardProps = {
  days: BusinessDay[];
  schedule: BusinessSchedule;
  setSchedule: Dispatch<SetStateAction<BusinessSchedule>>;
};

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function parseTime(value: string): { hour: string; minute: string; period: string } {
  if (!value) return { hour: '08', minute: '00', period: 'AM' };
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return {
    hour: String(hour12).padStart(2, '0'),
    minute: String(m).padStart(2, '0'),
    period
  };
}

function toTime(hour: string, minute: string, period: string): string {
  let h = parseInt(hour);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

function TimeSelector({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { hour, minute, period } = parseTime(value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <select
        value={hour}
        onChange={(e) => onChange(toTime(e.target.value, minute, period))}
        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-gray-400 text-xs">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(toTime(hour, e.target.value, period))}
        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => onChange(toTime(hour, minute, e.target.value))}
        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function ScheduleCard({ days, schedule, setSchedule }: ScheduleCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-teal-600" />
        Horarios de Atención
      </h4>
      <div className="space-y-4">
        {days.map((day) => {
          const daySchedule = schedule[day.id];
          return (
            <div key={day.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSchedule({
                      ...schedule,
                      [day.id]: { ...daySchedule, enabled: !daySchedule.enabled }
                    })
                  }
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    daySchedule.enabled ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'
                  }`}
                >
                  {daySchedule.enabled && <Check className="w-4 h-4 text-white" />}
                </button>
                <span className="text-sm font-semibold text-gray-700">{day.name}</span>
                {!daySchedule.enabled && (
                  <span className="text-sm text-gray-400">Cerrado</span>
                )}
              </div>
              {daySchedule.enabled && (
                <div className="flex flex-col gap-1.5 pl-8">
                  <TimeSelector
                    label="Apertura"
                    value={daySchedule.open}
                    onChange={(v) => setSchedule({ ...schedule, [day.id]: { ...daySchedule, open: v } })}
                  />
                  <TimeSelector
                    label="Cierre"
                    value={daySchedule.close}
                    onChange={(v) => setSchedule({ ...schedule, [day.id]: { ...daySchedule, close: v } })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}