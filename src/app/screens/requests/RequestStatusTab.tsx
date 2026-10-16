import { motion } from 'motion/react';
import type { StatusView } from './requestStatusGrouping';

// Shared presentation for current and future categories; no filtering or permissions here.
export default function RequestStatusTab({ item, selected, reducedMotion, onSelect }: {
  item: { key: StatusView; label: string; count: number | null };
  selected: boolean; reducedMotion: boolean | null; onSelect: () => void;
}) {
  const color = !selected ? 'border border-slate-200 bg-white text-slate-600'
    : item.key === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-300/40 shadow-amber-500/20'
      : item.key === 'active' ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white ring-2 ring-cyan-300/40 shadow-cyan-500/20'
        : item.key === 'ready' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-2 ring-orange-300/40 shadow-orange-500/20'
          : 'bg-gradient-to-r from-emerald-600 to-green-500 text-white ring-2 ring-emerald-300/40 shadow-emerald-500/20';
  return <motion.button type="button" className="zipco-status-tab" aria-pressed={selected}
    style={{ flexGrow: item.label.length + 6 }}
    whileTap={reducedMotion ? undefined : { scale: 0.96 }} onClick={onSelect}>
    <span className={`zipco-status-tab-surface shadow-sm transition-all ${color}`}>
      <span>{item.label}</span>
      {item.count !== null && <span className="zipco-status-tab-count bg-black/15">{item.count}</span>}
    </span>
  </motion.button>;
}
