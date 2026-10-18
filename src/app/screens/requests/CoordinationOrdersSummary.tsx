import { Bell, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function CoordinationOrdersSummary({ count, selected, reducedMotion, onSelect }: {
  count: number; selected: boolean; reducedMotion: boolean | null; onSelect: () => void;
}) {
  if (count <= 0) return null;
  return <motion.button type="button" aria-pressed={selected}
    whileTap={reducedMotion ? undefined : { scale: 0.985 }} onClick={onSelect}
    className={`mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[background-color,border-color,box-shadow] duration-300 ${selected
      ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-[0_12px_28px_rgba(16,185,129,0.25)]'
      : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-slate-900 shadow-sm dark:border-emerald-700 dark:from-emerald-950/55 dark:to-teal-950/35 dark:text-white'}`}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-white text-emerald-600 dark:bg-white/10 dark:text-emerald-300'}`}>
      <Bell aria-hidden="true" className="zipco-attention-bell h-6 w-6" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-black">{count} {count === 1 ? 'pedido en Coordinación' : 'pedidos en Coordinación'}</span>
      <span className={`block text-xs ${selected ? 'text-white/85' : 'text-slate-500 dark:text-slate-300'}`}>Revisa la autorización de contacto y los siguientes pasos.</span>
    </span>
    <ChevronRight aria-hidden="true" className={`h-5 w-5 transition-transform ${selected ? 'rotate-90 text-white' : 'text-slate-600 dark:text-slate-300'}`} />
  </motion.button>;
}
