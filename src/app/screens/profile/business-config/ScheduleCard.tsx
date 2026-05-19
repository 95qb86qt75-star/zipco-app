import type { Dispatch, SetStateAction } from 'react';
import { Check, Clock } from 'lucide-react';
import type { BusinessDay, BusinessSchedule } from './types';

type ScheduleCardProps = {
  days: BusinessDay[];
  schedule: BusinessSchedule;
  setSchedule: Dispatch<SetStateAction<BusinessSchedule>>;
};

export default function ScheduleCard({ days, schedule, setSchedule }: ScheduleCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-teal-600" />
        Horarios de Atencion
      </h4>
      <div className="space-y-3">
        {days.map((day) => {
          const daySchedule = schedule[day.id];
          return (
            <div key={day.id} className="flex items-center gap-3">
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
              <span className="text-sm font-medium text-gray-700 w-24">{day.name}</span>
              {daySchedule.enabled ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="time"
                    value={daySchedule.open}
                    onChange={(e) =>
                      setSchedule({
                        ...schedule,
                        [day.id]: { ...daySchedule, open: e.target.value }
                      })
                    }
                    className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={daySchedule.close}
                    onChange={(e) =>
                      setSchedule({
                        ...schedule,
                        [day.id]: { ...daySchedule, close: e.target.value }
                      })
                    }
                    className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              ) : (
                <span className="flex-1 text-sm text-gray-400">Cerrado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
