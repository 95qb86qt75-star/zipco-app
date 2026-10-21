import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, Check, TrendingDown, TrendingUp } from 'lucide-react';
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

type Row = { key: string; label: string; sub?: string; before?: string; after: string; detail?: string; changed: boolean };

// Una fila de la comparación: "Cambió" muestra original tachado → nuevo; "Se mantuvo" muestra el valor con un ticket verde.
function ChangeRow({ row, last }: { row: Row; last: boolean }) {
  const line = last ? '' : 'border-b border-violet-100 dark:border-slate-700';
  return <div className={`flex items-start gap-3 py-3 ${line}`}>
    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${row.changed
      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_4px_10px_rgba(91,79,240,0.35)]'
      : 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
      {row.changed ? <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
    <div className="min-w-0 flex-1">
      <p className={`break-words text-[10px] font-black uppercase tracking-[0.12em] ${row.changed ? 'text-violet-700 dark:text-violet-200' : 'text-slate-500'}`}>
        {row.label}{row.sub && <span className="ml-1 font-semibold normal-case tracking-normal text-slate-400">· {row.sub}</span>}
      </p>
      {row.changed ? <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
        <span className="min-w-0 max-w-full break-words text-sm font-semibold text-slate-400 line-through">{row.before}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 self-center text-violet-600" aria-hidden="true" />
        <span className="min-w-0 max-w-full break-words text-[17px] font-black leading-tight text-indigo-950 dark:text-white">{row.after}</span>
      </p> : <p className="mt-0.5 break-words text-sm font-bold text-slate-700 dark:text-slate-200">{row.after}</p>}
      {row.detail && <p className="mt-0.5 break-words text-xs text-slate-500">{row.detail}</p>}
    </div>
  </div>;
}

function GroupTitle({ children, count, tone }: { children: ReactNode; count: number; tone: 'changed' | 'kept' }) {
  const changed = tone === 'changed';
  return <div className="mt-2 flex items-center gap-2">
    <span className={`text-[11px] font-black uppercase tracking-[0.12em] ${changed ? 'text-violet-700 dark:text-violet-200' : 'text-emerald-600 dark:text-emerald-300'}`}>{children}</span>
    <span className={`rounded-full px-2 text-[10.5px] font-black ${changed ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>{count}</span>
    <span className={`h-px flex-1 ${changed ? 'bg-violet-100' : 'bg-emerald-100'}`} />
  </div>;
}

// Prepared local preview. The accent is decorative; upload still happens only at confirmation.
function AttachedPhoto({ photo, willSend }: { photo: string; willSend: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="zipco-review-rise overflow-hidden rounded-[18px] bg-emerald-50 p-3 ring-[1.5px] ring-inset ring-emerald-300 dark:bg-emerald-950/30" data-alternative-photo>
    <div className="zipco-review-photo-head">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_5px_12px_rgba(16,185,129,0.4)]">
        <Check className="zipco-review-check h-5 w-5" strokeWidth={3.2} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">Imagen adjunta</p>
        <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-200">Preparada en este dispositivo</p>
        <div className="relative mt-0.5">
          <div className="zipco-review-up absolute inset-0 flex items-center" aria-hidden="true">
            <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-emerald-200"><span className="zipco-review-bar block h-full bg-emerald-500" /></span>
          </div>
          <p className="zipco-review-done relative text-xs leading-[17px] text-emerald-700 dark:text-emerald-200">{willSend ? 'Se cargará al confirmar el envío' : 'Vista previa local'}</p>
        </div>
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}
        className="min-h-11 shrink-0 rounded-full bg-white px-3 text-xs font-black text-emerald-700 ring-1 ring-inset ring-emerald-300">{open ? 'Ocultar' : 'Ver imagen'}</button>
    </div>
    {open && <img src={photo} alt="Imagen adjunta a la propuesta" className="mt-3 max-h-64 w-full rounded-xl bg-white object-contain" />}
  </div>;
}

export default function AlternativeReviewPanel({ source, draft, review, photo = null, photoWillSend = false, baselineLabel = 'Solicitud original' }: {
  source: AlternativeSource; draft: AlternativeDraft; review: AlternativeReview; photo?: string | null; photoWillSend?: boolean; baselineLabel?: string;
}) {
  const animated = useCountUp(review.totalPriceClp);
  const delta = source.total === null ? null : review.totalPriceClp - source.total;
  const immediate = draft.scheduleChanged ? draft.immediate : source.needNow;
  const date = draft.scheduleChanged ? draft.date : source.date;
  const time = draft.scheduleChanged ? draft.time : source.time;
  const proposedSchedule = immediate ? 'Lo antes posible' : `${dayLabel(date)} · ${time} (Chile)`;
  const originalSchedule = source.needNow ? 'Lo antes posible' : `${dayLabel(source.date)} · ${source.time}`;
  const scheduleChanged = Boolean(review.schedule);
  const multi = source.items.length > 1;
  const originalBaseline = baselineLabel === 'Solicitud original';
  const comparisonSubject = originalBaseline ? 'la solicitud original' : 'la propuesta vigente';

  // Filas comparables, siempre desde los mismos datos que ya usaba el panel.
  const rows: Row[] = [];
  source.items.forEach((item, i) => {
    const proposed = draft.lines[i], changedItem = proposed.selected.has('item');
    const quantity = proposed.selected.has('quantity') ? Number(proposed.quantity) : item.quantity;
    const custom = changedItem || item.customTotal !== undefined;
    const unit = proposed.selected.has('price') ? Number(proposed.price) : item.customTotal ?? item.price;
    const before = item.customTotal ?? item.price * item.quantity;
    const after = changedItem ? Number(proposed.price) : custom ? unit : unit * quantity;
    const sub = multi ? item.name : undefined;
    rows.push(changedItem
      ? { key: `item-${i}`, label: source.orderType === 'service' ? 'Servicio' : 'Producto', sub, before: item.name, after: proposed.name.trim(), detail: proposed.description.trim() || undefined, changed: true }
      : { key: `item-${i}`, label: source.orderType === 'service' ? 'Servicio' : 'Producto', sub, after: item.name, changed: false });
    if (source.orderType !== 'service') rows.push(quantity !== item.quantity
      ? { key: `qty-${i}`, label: 'Cantidad', sub, before: `${item.quantity}x`, after: `${quantity}x`, changed: true }
      : { key: `qty-${i}`, label: 'Cantidad', sub, after: `${quantity}x`, changed: false });
    if (custom) rows.push(after !== before
      ? { key: `price-${i}`, label: 'Precio total de esta línea', sub, before: pesos(before), after: pesos(after), changed: true }
      : { key: `price-${i}`, label: 'Precio total de esta línea', sub, after: pesos(after), changed: false });
    else rows.push(unit !== item.price
      ? { key: `price-${i}`, label: 'Precio por unidad', sub, before: pesos(item.price), after: pesos(unit), changed: true }
      : { key: `price-${i}`, label: 'Precio por unidad', sub, after: pesos(unit), changed: false });
  });
  rows.push(scheduleChanged
    ? { key: 'schedule', label: 'Disponibilidad', before: originalSchedule, after: proposedSchedule, changed: true }
    : { key: 'schedule', label: 'Disponibilidad', after: proposedSchedule, changed: false });
  const changedRows = rows.filter(row => row.changed), keptRows = rows.filter(row => !row.changed);

  return <div data-alternative-review className="mt-3 space-y-3">
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-1 flex-1 rounded-full bg-violet-600" />
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-900"><span className="zipco-review-fill block h-full bg-violet-600" /></span>
      </div>
      <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">Paso 2 de 2 · Revisión</p>
    </div>

    {/* Tarjeta Aurora de totales */}
    <div className="zipco-aurora-card zipco-review-total rounded-[22px] px-4 py-3.5 text-white" style={step(0)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">{originalBaseline ? 'Total original' : 'Total vigente'}</p>
          <p className="mt-0.5 whitespace-nowrap text-[19px] font-bold leading-tight tabular-nums text-slate-300 line-through decoration-slate-400/60">{source.total === null ? '—' : pesos(source.total)}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20"><ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" /></span>
        <div className="ml-auto min-w-0 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-200">Total propuesto</p>
          <p className="zipco-aurora-price mt-0.5 text-[32px] font-black leading-none tabular-nums">
            <span aria-hidden="true">{pesos(animated)}</span><span className="sr-only">{pesos(review.totalPriceClp)}</span>
          </p>
        </div>
      </div>
      {delta !== null && <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black ring-1 ring-inset ring-white/20">
        {delta === 0 ? <><Check className="h-3.5 w-3.5 shrink-0" />Mismo total que {comparisonSubject}</>
          : delta < 0 ? <><TrendingDown className="h-3.5 w-3.5 shrink-0" />{pesos(-delta)} menos que {comparisonSubject}</>
            : <><TrendingUp className="h-3.5 w-3.5 shrink-0" />{pesos(delta)} más que {comparisonSubject}</>}
      </p>}
    </div>

    {/* Original vs. propuesta */}
    <div className="zipco-review-rise rounded-[22px] border border-violet-100 bg-white px-3.5 pb-1 pt-3.5 shadow-[0_8px_22px_rgba(79,70,229,0.08)] dark:border-slate-700 dark:bg-slate-900/70" style={step(1)}>
      <p className="text-base font-black text-indigo-950 dark:text-white">{originalBaseline ? 'Original vs. propuesta' : 'Vigente vs. propuesta'}</p>
      {changedRows.length > 0 && <>
        <GroupTitle tone="changed" count={changedRows.length}>Cambió</GroupTitle>
        {changedRows.map((row, i) => <ChangeRow key={row.key} row={row} last={i === changedRows.length - 1} />)}
      </>}
      {keptRows.length > 0 && <>
        <GroupTitle tone="kept" count={keptRows.length}>Se mantuvo</GroupTitle>
        {keptRows.map((row, i) => <ChangeRow key={row.key} row={row} last={i === keptRows.length - 1} />)}
      </>}
    </div>

    <div className="zipco-review-rise rounded-2xl rounded-tl-md bg-violet-50 px-3.5 py-3 ring-1 ring-inset ring-violet-200 dark:bg-violet-950/40 dark:ring-violet-800" style={step(2)}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">Tu mensaje al cliente</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-indigo-950 dark:text-slate-100">{review.message}</p>
    </div>

    {photo && <div style={step(3)} className="zipco-review-rise"><AttachedPhoto photo={photo} willSend={photoWillSend} /></div>}
  </div>;
}
