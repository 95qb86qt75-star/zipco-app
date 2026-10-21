import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, CalendarClock, Check, MessageSquareText, Package, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import type { AlternativeDraft, AlternativeReview, AlternativeSource } from './alternativeDraft';

const pesos = (value: number) => `$${value.toLocaleString('es-CL')}`;
const step = (n: number) => ({ '--i': n } as CSSProperties);

const dayLabel = (date: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12))).replace(/\./g, '');
};

// Cuenta desde 0 hasta el total propuesto. Sin animación si el usuario pidió menos movimiento.
function useCountUp(target: number, ms = 850) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

const card = 'zipco-review-rise rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70';
const chip = 'inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200';

export default function AlternativeReviewPanel({ source, draft, review }: {
  source: AlternativeSource; draft: AlternativeDraft; review: AlternativeReview;
}) {
  const animated = useCountUp(review.totalPriceClp);
  const delta = source.total === null ? null : review.totalPriceClp - source.total;
  const immediate = draft.scheduleChanged ? draft.immediate : source.needNow;
  const date = draft.scheduleChanged ? draft.date : source.date;
  const time = draft.scheduleChanged ? draft.time : source.time;
  const proposedSchedule = immediate ? 'Lo antes posible' : `${dayLabel(date)} · ${time} (Chile)`;
  const originalSchedule = source.needNow ? 'Lo antes posible' : `${dayLabel(source.date)} · ${source.time}`;
  const scheduleChanged = Boolean(review.schedule);

  return <div data-alternative-review className="mt-3 space-y-3">
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-1 flex-1 rounded-full bg-violet-600" />
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-900"><span className="zipco-review-fill block h-full bg-violet-600" /></span>
      </div>
      <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">Paso 2 de 2 · Revisión</p>
    </div>

    <div className="zipco-review-rise flex items-center gap-3" style={step(0)}>
      <span className="zipco-review-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_8px_20px_rgba(124,58,237,0.35)]"><Sparkles className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-900 dark:text-white">Resumen de tu nueva propuesta</p>
        <p className="text-xs text-slate-500">Revisa los cambios antes de confirmar.</p>
      </div>
    </div>

    {source.items.map((item, i) => {
      const proposed = draft.lines[i], changedItem = proposed.selected.has('item');
      const quantity = proposed.selected.has('quantity') ? Number(proposed.quantity) : item.quantity;
      const unit = proposed.selected.has('price') ? Number(proposed.price) : item.price;
      const before = item.price * item.quantity;
      const after = changedItem ? Number(proposed.price) : unit * quantity;
      const changed = changedItem || quantity !== item.quantity || unit !== item.price;
      if (!changed) return <div key={i} className={`${card} flex items-center justify-between gap-3 text-xs text-slate-500`} style={step(i + 1)}>
        <span className="min-w-0 truncate">{item.quantity}x {item.name}</span><span className="shrink-0">Sin cambios · {pesos(before)}</span>
      </div>;
      return <div key={i} className={card} style={step(i + 1)}>
        <div className="flex items-start gap-2">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
          <div className="min-w-0 flex-1 text-sm">
            {changedItem ? <>
              <p className="text-xs text-slate-500 line-through">{item.quantity}x {item.name}</p>
              <p className="flex items-center gap-1 font-black text-violet-700 dark:text-violet-200"><ArrowRight className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{quantity}x {proposed.name.trim()}</span></p>
              {proposed.description.trim() && <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-slate-300">{proposed.description.trim()}</p>}
            </> : <p className="break-words font-bold">{quantity}x {item.name}</p>}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {quantity !== item.quantity && <span className={chip}>Cantidad {item.quantity} <ArrowRight className="h-3 w-3" /> {quantity}</span>}
          {!changedItem && unit !== item.price && <span className={chip}>Precio unidad {pesos(item.price)} <ArrowRight className="h-3 w-3" /> {pesos(unit)}</span>}
        </div>
        <p className="mt-2 flex items-baseline justify-end gap-2 border-t border-slate-100 pt-2 text-sm dark:border-slate-700">
          <span className="text-xs text-slate-500 line-through">{pesos(before)}</span>
          <ArrowRight className="h-3.5 w-3.5 self-center text-slate-400" />
          <span className="font-black text-slate-900 dark:text-white">{pesos(after)}</span>
        </p>
      </div>;
    })}

    <div className={`${card} flex items-start gap-3`} style={step(source.items.length + 1)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-200">{immediate ? <Zap className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}</span>
      <div className="min-w-0 text-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Disponibilidad</p>
        {scheduleChanged && <p className="text-xs text-slate-500 line-through">{originalSchedule}</p>}
        <p className="font-black">{proposedSchedule}</p>
        {!scheduleChanged && <p className="text-xs text-slate-500">Sin cambios</p>}
      </div>
    </div>

    <div className="zipco-review-rise flex items-start gap-2" style={step(source.items.length + 2)}>
      <MessageSquareText className="mt-2 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-violet-50 p-3 text-sm dark:bg-violet-950/40">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">Tu mensaje al cliente</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{review.message}</p>
      </div>
    </div>

    <div className="zipco-review-rise zipco-review-total rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-[0_10px_26px_rgba(99,102,241,0.35)]" style={step(source.items.length + 3)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100">Total propuesto</p>
          <p className="mt-0.5 text-3xl font-black tabular-nums leading-none">
            <span aria-hidden="true">{pesos(animated)}</span><span className="sr-only">{pesos(review.totalPriceClp)}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          {source.total !== null && <p className="text-xs text-violet-100"><span className="opacity-80">Antes</span> <span className="line-through">{pesos(source.total)}</span></p>}
          {delta !== null && delta !== 0 && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-black">
            {delta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}{delta < 0 ? `${pesos(-delta)} menos` : `${pesos(delta)} más`}
          </p>}
          {delta === 0 && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-black"><Check className="h-3.5 w-3.5" />Mismo total</p>}
        </div>
      </div>
    </div>
  </div>;
}
