import { motion } from 'motion/react';
import { BadgeCheck, ChevronDown, MousePointerClick } from 'lucide-react';

// Extracted from the existing compact business card, without status transitions.
export function OrderCardDisclosure({ title, hint, price, panelClass, accentClass, onOpen, expanded = false, acceptedSummary = false, integrated = false }: {
  title: string; hint: string; price: number | null;
  panelClass: string; accentClass: string; onOpen: () => void; expanded?: boolean; acceptedSummary?: boolean; integrated?: boolean;
}) {
  return <motion.button type="button" aria-expanded={expanded}
    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
    onClick={(event) => {
      event.stopPropagation();
      event.currentTarget.closest('article')?.classList.remove('zipco-notification-target');
      onOpen();
    }}
    className={`zipco-open-panel grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 bg-gradient-to-r px-3 py-2 text-left ${integrated ? 'rounded-none border-0' : 'mt-2.5 rounded-[15px] border'} ${panelClass}`}>
    <span className="min-w-0">
      <span className={`${acceptedSummary ? 'flex items-center gap-1' : 'block'} text-[9px] font-black uppercase tracking-[0.15em] ${accentClass}`}>
        {acceptedSummary && <BadgeCheck aria-hidden="true" className="h-4 w-4 shrink-0" />}{title}</span>
      <span className="zipco-open-hint mt-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">
        <MousePointerClick className="h-3.5 w-3.5" />{hint}
      </span>
    </span>
    {price !== null && (acceptedSummary ? <span className="flex flex-col gap-0.5 border-l border-teal-200/60 pl-3">
      <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-wide text-slate-500">Precio total</span>
      <span className="whitespace-nowrap text-lg font-black text-teal-800">${price.toLocaleString('es-CL')}</span>
    </span> : <span className="whitespace-nowrap text-lg font-black text-teal-800">${price.toLocaleString('es-CL')}</span>)}
    <ChevronDown className={`h-5 w-5 ${expanded ? 'rotate-180' : ''} ${accentClass}`} />
  </motion.button>;
}

export function OrderPricePanel({ price, label = 'Precio total' }: { price: number; label?: string }) {
  return <div className="mt-2 flex items-end justify-between border-t border-black/5 pt-2">
    <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</span>
    <span className="text-xl font-black text-teal-800">${price.toLocaleString('es-CL')}</span>
  </div>;
}
