import { Bell, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReadyOrdersSummary({ count, kind, selected, onToggle }: {
  count: number; kind: 'orders' | 'quotes'; selected: boolean; onToggle: () => void;
}) {
  const orders = kind === 'orders';
  return <motion.button type="button" aria-pressed={selected} whileTap={{ scale: 0.995 }} onClick={onToggle}
    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[background-color,border-color,box-shadow] duration-300 ${selected
      ? 'border-orange-400 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_12px_28px_rgba(245,158,11,0.25)]'
      : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-slate-900 shadow-sm dark:border-amber-800/70 dark:from-amber-950/55 dark:to-orange-950/35 dark:text-white'}`}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-white text-amber-600 dark:bg-white/10 dark:text-amber-300'}`}>
      <Bell className="zipco-attention-bell h-6 w-6" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-black">{count} {orders
        ? count === 1 ? 'pedido listo para recibir' : 'pedidos listos para recibir'
        : count === 1 ? 'servicio listo para confirmar' : 'servicios listos para confirmar'}</span>
      <span className={`block text-xs ${selected ? 'text-white/85' : 'text-slate-500 dark:text-slate-300'}`}>
        {orders
          ? `Tienes ${count} pedido${count === 1 ? '' : 's'} que el negocio marcó como listo.`
          : `Tienes ${count} servicio${count === 1 ? '' : 's'} marcado${count === 1 ? '' : 's'} como realizado${count === 1 ? '' : 's'}.`}
      </span>
    </span>
    <ChevronRight className={`h-5 w-5 transition-transform ${selected ? 'rotate-90 text-white' : 'text-slate-600 dark:text-slate-300'}`} />
  </motion.button>;
}
