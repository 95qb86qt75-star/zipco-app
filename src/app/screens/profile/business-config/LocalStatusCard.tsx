import { Clock, ToggleLeft, ToggleRight } from 'lucide-react';

type LocalStatusCardProps = {
  isUsingSchedule: boolean;
  isLoading: boolean;
  onToggle: () => void;
};

export default function LocalStatusCard({ isUsingSchedule, isLoading, onToggle }: LocalStatusCardProps) {
  return (
    <div
      className={`backdrop-blur-sm rounded-2xl p-4 border mb-4 transition-all ${
        isUsingSchedule
          ? 'bg-[#F4FFE8] border-[#A3FF12] shadow-[0_0_22px_rgba(163,255,18,0.28)]'
          : 'bg-[#1F2933] border-[#334155] shadow-[0_10px_24px_rgba(15,23,42,0.24)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex shrink-0 items-center justify-center ${
              isUsingSchedule ? 'bg-[#DFFF9A] text-[#111827]' : 'bg-[#334155] text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-bold ${isUsingSchedule ? 'text-gray-900' : 'text-white'}`}>
              Estado del local
            </h4>
            <p className={`text-xs font-semibold mt-0.5 ${isUsingSchedule ? 'text-[#5EA500]' : 'text-slate-300'}`}>
              {isUsingSchedule ? 'Abierto segun horario' : 'Cerrado temporalmente'}
            </p>
          </div>
        </div>
        {isUsingSchedule ? (
          <ToggleRight className="w-6 h-6 shrink-0 text-[#6EE700]" />
        ) : (
          <ToggleLeft className="w-6 h-6 shrink-0 text-slate-300" />
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={isLoading}
        className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          isUsingSchedule
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-slate-700 text-white hover:bg-slate-600'
        } disabled:opacity-60`}
      >
        {isUsingSchedule ? 'Cerrar temporalmente' : 'Usar horario configurado'}
      </button>
    </div>
  );
}
