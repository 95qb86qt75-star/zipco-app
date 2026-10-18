import { Bell, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReadyOrdersSummary({ count, kind, selected, onToggle }: {
  count: number; kind: 'orders' | 'quotes'; selected: boolean; onToggle: () => void;
}) {
  const orders = kind === 'orders';
  return <motion.button type="button" aria-pressed={selected} whileTap={{ scale: 0.995 }} onClick={onToggle}
    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[background-color,border-color,box-shadow] duration-300 ${selected
      ? 'border-teal-700 bg-gradient-to-r from-teal-700 to-emerald-800 text-white shadow-[0_8px_20px_rgba(15,118,110,0.24)]'
      : 'border-amber-200 bg-amber-50 text-slate-900 shadow-sm'}`}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-teal-800 text-white' : 'bg-white text-amber-500'}`}>
      <Bell className="zipco-attention-bell h-6 w-6" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-black">{count} {orders
        ? count === 1 ? 'pedido listo para recibir' : 'pedidos listos para recibir'
        : count === 1 ? 'servicio listo para confirmar' : 'servicios listos para confirmar'}</span>
      <span className={`block text-xs ${selected ? 'text-white/90' : 'text-slate-500'}`}>
        {orders
          ? `Tienes ${count} pedido${count === 1 ? '' : 's'} que el negocio marcó como listo.`
          : `Tienes ${count} servicio${count === 1 ? '' : 's'} marcado${count === 1 ? '' : 's'} como realizado${count === 1 ? '' : 's'}.`}
      </span>
    </span>
    <ChevronRight className={`h-5 w-5 transition-transform ${selected ? 'rotate-90 text-white' : 'text-slate-700'}`} />
  </motion.button>;
}
