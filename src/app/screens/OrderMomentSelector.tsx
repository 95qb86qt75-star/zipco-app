import { CalendarDays, Clock, Zap } from 'lucide-react';
import type { OrderMoment } from './orderMoment';

export default function OrderMomentSelector({ moment, onChange, time, onTimeChange, variant = 'product' }: {
  moment: OrderMoment | null;
  onChange: (moment: OrderMoment) => void;
  time: string;
  onTimeChange: (time: string) => void;
  variant?: 'product' | 'service';
}) {
  return <>
    <div role="group" aria-label="Momento del pedido" className="mb-2 grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white/75 p-1 shadow-sm">
      <button type="button" aria-pressed={moment === 'now'} onClick={() => onChange('now')}
        className={`zipco-now-option relative min-h-12 overflow-hidden rounded-xl px-2 py-2 text-sm font-bold transition-all ${moment === 'now'
          ? 'is-active bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 text-white shadow-md shadow-indigo-950/30'
          : 'bg-transparent text-gray-600 hover:bg-white'}`}>
        <svg aria-hidden="true" viewBox="0 0 180 52" preserveAspectRatio="none" className="zipco-storm-lightning absolute inset-0 h-full w-full">
          <path d="M142 -2 112 18 128 22 92 54" /><path d="m113 18-22 1-12 13" /><path d="m127 22 20 7 10 13" />
        </svg>
        <span className="relative z-10 flex items-center justify-center gap-1">
          <Zap aria-hidden="true" className="h-4 w-4" fill="currentColor" />Ahora
        </span>
      </button>
      {(['today', 'schedule'] as const).map((value) => <button key={value} type="button"
        aria-pressed={moment === value} onClick={() => onChange(value)}
        className={`${variant === 'service' ? 'py-3 px-4 rounded-xl font-semibold text-sm transition-all' : 'min-h-12 rounded-xl px-2 py-2 text-sm font-bold transition-all'} ${moment === value
          ? variant === 'service' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md'
          : variant === 'service' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-transparent text-gray-600 hover:bg-white'}`}>
        <span className={`flex items-center justify-center ${variant === 'service' ? 'flex-col gap-2' : 'gap-1'}`}>
          {value === 'today' ? <Clock aria-hidden="true" className="h-4 w-4" /> : <CalendarDays aria-hidden="true" className={variant === 'service' ? 'h-6 w-6' : 'h-4 w-4'} />}
          {value === 'today' ? 'Hoy' : 'Programar'}
        </span>
      </button>)}
    </div>
    {moment === 'today' && <label className="mb-2 block text-sm font-bold text-gray-900">
      Hora para hoy
      <span className="relative mt-2 block min-w-0">
        <input type="time" aria-label="Hora para hoy" required value={time} onChange={(event) => onTimeChange(event.target.value)}
          className="peer block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-slate-900" />
        {!time && <span aria-hidden="true"
          className="pointer-events-none absolute inset-px flex items-center justify-between rounded-[11px] bg-white px-3 text-sm font-normal text-slate-500 peer-focus:hidden">
          <span>Seleccionar hora</span>
          <Clock className="h-5 w-5" />
        </span>}
      </span>
    </label>}
  </>;
}
