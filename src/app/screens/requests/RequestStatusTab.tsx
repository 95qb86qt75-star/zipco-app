import { motion } from 'motion/react';
import type { StatusView } from './requestStatusGrouping';
import ReadyArrivalTip from './ReadyArrivalTip';

// Shared presentation for current and future categories; no filtering or permissions here.
export default function RequestStatusTab({ item, selected, reducedMotion, onSelect, countState, arrival }: {
  item: { key: StatusView; label: string; count: number | null };
  selected: boolean; reducedMotion: boolean | null; onSelect: () => void;
  countState?: 'loading' | 'unavailable';
  arrival?: { chipBump: boolean; tip: boolean };
}) {
  const color = !selected ? 'border border-slate-200 bg-white text-slate-600'
    : item.key === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-300/40 shadow-amber-500/20'
      : item.key === 'active' ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white ring-2 ring-cyan-300/40 shadow-cyan-500/20'
        : item.key === 'ready' ? arrival ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white ring-2 ring-teal-300/40 shadow-teal-500/20'
          : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-2 ring-orange-300/40 shadow-orange-500/20'
          : 'bg-gradient-to-r from-emerald-600 to-green-500 text-white ring-2 ring-emerald-300/40 shadow-emerald-500/20';
  return <motion.button type="button" className={`zipco-status-tab${arrival?.chipBump ? ' zipco-chip-bump' : ''}`} aria-pressed={selected} aria-busy={countState === 'loading'}
    style={{ flexGrow: item.label.length + 6 }}
    whileTap={reducedMotion ? undefined : { scale: 0.96 }} onClick={onSelect}>
    <span className={`zipco-status-tab-surface shadow-sm transition-all ${color}`}>
      <span>{item.label}</span>
      {item.count !== null && <span className="zipco-status-tab-count bg-black/15"
        aria-label={countState === 'loading' ? 'Cantidad pendiente de carga' : countState === 'unavailable' ? 'Cantidad no disponible' : undefined}
      >{countState === 'loading' ? '…' : countState === 'unavailable' ? '—' : item.count}</span>}
    </span>
    {arrival?.tip && <ReadyArrivalTip />}
  </motion.button>;
}
