import { motion } from 'motion/react';
import { ChevronDown, MousePointerClick } from 'lucide-react';

// Extracted from the existing compact business card, without status transitions.
export function OrderCardDisclosure({ title, hint, price, panelClass, accentClass, onOpen, expanded = false }: {
  title: string; hint: string; price: number | null;
  panelClass: string; accentClass: string; onOpen: () => void; expanded?: boolean;
}) {
  return <motion.button type="button" aria-expanded={expanded}
    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
    onClick={(event) => {
      event.stopPropagation();
      event.currentTarget.closest('article')?.classList.remove('zipco-notification-target');
      onOpen();
    }}
    className={`zipco-open-panel mt-2.5 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[15px] border bg-gradient-to-r px-3 py-2 text-left ${panelClass}`}>
    <span className="min-w-0">
      <span className={`block text-[9px] font-black uppercase tracking-[0.15em] ${accentClass}`}>{title}</span>
      <span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">
        <MousePointerClick className="h-3.5 w-3.5" />{hint}
      </span>
    </span>
    {price !== null && <span className="whitespace-nowrap text-lg font-black text-teal-800">${price.toLocaleString('es-CL')}</span>}
    <ChevronDown className={`h-5 w-5 ${expanded ? 'rotate-180' : ''} ${accentClass}`} />
  </motion.button>;
}

export function OrderPricePanel({ price, label = 'Precio total' }: { price: number; label?: string }) {
  return <div className="mt-2 flex items-end justify-between border-t border-black/5 pt-2">
    <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</span>
    <span className="text-xl font-black text-teal-800">${price.toLocaleString('es-CL')}</span>
  </div>;
}
