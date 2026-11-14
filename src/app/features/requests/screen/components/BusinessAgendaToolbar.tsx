import * as React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarCheck, CalendarDays, Check, ChevronDown, List, ListChecks, MessageCircle, ShoppingBag } from 'lucide-react';
import {
  isDefaultAgendaFilters, type AgendaCounts, type AgendaDateFilter, type AgendaFilters, type AgendaSort, type AgendaTypeFilter,
} from '../../domain/businessAgenda';

type Open = 'date' | 'type' | 'sort' | null;
type Props = {
  filters: AgendaFilters;
  counts: AgendaCounts;
  sort: AgendaSort;
  total: number;
  shown: number;
  onFilters: (filters: AgendaFilters) => void;
  onSort: (sort: AgendaSort) => void;
};

const DATE_OPTIONS: Array<{ key: AgendaDateFilter; label: string; hint: string; color: string }> = [
  { key: 'all', label: 'Todas', hint: 'Sin filtro', color: '#94a3b8' },
  { key: 'late', label: 'Atrasadas', hint: 'Ya pasaron', color: '#e11d48' },
  { key: 'today', label: 'Hoy', hint: 'Y lo antes posible', color: '#0d9488' },
  { key: 'tomorrow', label: 'Mañana', hint: 'Día siguiente', color: '#0284c7' },
  { key: 'upcoming', label: 'Próximos', hint: 'Desde pasado mañana', color: '#7c3aed' },
  { key: 'unverified', label: 'Por comprobar', hint: 'Sin horario', color: '#d97706' },
];
const TYPE_OPTIONS: Array<{ key: AgendaTypeFilter; label: string; short: string; hint: string; color: string; Icon: typeof List }> = [
  { key: 'all', label: 'Todos', short: 'Todos', hint: 'Todos los tipos', color: '#64748b', Icon: List },
  { key: 'pickup', label: 'Retiro sin reserva', short: 'Sin reserva', hint: 'Retiras sin reservar', color: '#0f766e', Icon: ShoppingBag },
  { key: 'reserved', label: 'Retiro con reserva', short: 'Con reserva', hint: 'Con reserva solicitada', color: '#7c3aed', Icon: CalendarCheck },
  { key: 'whatsapp', label: 'Coordinación por WhatsApp', short: 'WhatsApp', hint: 'Se acuerda por chat', color: '#16a34a', Icon: MessageCircle },
];
const SORT_OPTIONS: Array<{ key: AgendaSort; label: string; hint: string; Icon: typeof List }> = [
  { key: 'attention', label: 'Por atender', hint: 'Según el horario acordado', Icon: ListChecks },
  { key: 'newest', label: 'Recientes', hint: 'Por última actividad', Icon: ArrowDown },
  { key: 'oldest', label: 'Antiguas', hint: 'Las más antiguas primero', Icon: ArrowUp },
];

export default function BusinessAgendaToolbar({ filters, counts, sort, total, shown, onFilters, onSort }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggers = useRef<Record<'date' | 'type' | 'sort', HTMLButtonElement | null>>({ date: null, type: null, sort: null });
  const id = useId();
  const date = DATE_OPTIONS.find((option) => option.key === filters.date) ?? DATE_OPTIONS[0];
  const type = TYPE_OPTIONS.find((option) => option.key === filters.type) ?? TYPE_OPTIONS[0];
  const filtered = !isDefaultAgendaFilters(filters);

  const close = (restoreFocus = true) => {
    const previous = open;
    setOpen(null);
    if (restoreFocus && previous) triggers.current[previous]?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!open) return;
    const selected = rootRef.current?.querySelector<HTMLElement>('[data-agenda-tray] [aria-checked="true"]');
    (selected ?? rootRef.current?.querySelector<HTMLElement>('[data-agenda-tray] [role^="menuitem"]'))?.focus({ preventScroll: true });
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-agenda-tray] [role^="menuitem"]:not(:disabled)') ?? []);
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const toggle = (which: Exclude<Open, null>) => setOpen((current) => (current === which ? null : which));
  const field = (which: 'date' | 'type', caption: string, value: string, color: string, Icon: typeof List) => (
    <button
      type="button" ref={(element) => { triggers.current[which] = element; }} className="zipco-agenda-field"
      aria-haspopup="menu" aria-expanded={open === which} aria-controls={`${id}-${which}`} onClick={() => toggle(which)}>
      <span className="zipco-agenda-field-icon" style={{ background: color }} aria-hidden="true"><Icon size={18} strokeWidth={2.1} /></span>
      <span className="zipco-agenda-field-text"><small>{caption}</small><b>{value}</b></span>
      <ChevronDown className="zipco-agenda-field-chev" size={15} strokeWidth={2.8} aria-hidden="true" />
    </button>
  );

  return (
    <div ref={rootRef} className="zipco-agenda-toolbar" onKeyDown={onKeyDown}>
      {open && <div className="zipco-agenda-scrim" aria-hidden="true" onClick={() => close(false)} />}
      <div className="zipco-agenda-fields">
        {field('date', 'Fecha', date.label, date.color, CalendarDays)}
        {field('type', 'Tipo', type.short, type.color, ShoppingBag)}
        <button
          type="button" ref={(element) => { triggers.current.sort = element; }} className="zipco-agenda-sortbtn"
          aria-haspopup="menu" aria-expanded={open === 'sort'} aria-controls={`${id}-sort`} aria-label={`Ordenar: ${SORT_OPTIONS.find((option) => option.key === sort)?.label ?? ''}`}
          onClick={() => toggle('sort')}>
          <ArrowUpDown size={18} strokeWidth={2.2} aria-hidden="true" />
          {sort !== 'attention' && <i aria-hidden="true" />}
        </button>
      </div>
      <div className="zipco-agenda-summary" role="status">
        <span>{filtered ? `${shown} de ${total} pedidos` : `${total} ${total === 1 ? 'pedido' : 'pedidos'} en curso`}</span>
        {filtered && <button type="button" onClick={() => onFilters({ date: 'all', type: 'all' })}>Limpiar</button>}
      </div>

      {open === 'date' && (
        <div id={`${id}-date`} className="zipco-agenda-tray" role="menu" aria-label="Fecha del servicio" data-agenda-tray>
          <div className="zipco-agenda-tray-cap">Fecha del servicio</div>
          <div className="zipco-agenda-tiles">
            {DATE_OPTIONS.map((option) => (
              <button
                key={option.key} type="button" role="menuitemradio" aria-checked={filters.date === option.key}
                className="zipco-agenda-tile" data-empty={counts.date[option.key] === 0 || undefined}
                onClick={() => { onFilters({ ...filters, date: option.key }); close(); }}>
                <i style={{ background: option.color }} aria-hidden="true" />
                <span><b>{option.label}</b><small>{option.hint}</small></span>
                <em>{counts.date[option.key]}</em>
              </button>
            ))}
          </div>
        </div>
      )}
      {open === 'type' && (
        <div id={`${id}-type`} className="zipco-agenda-tray" role="menu" aria-label="Tipo de pedido" data-agenda-tray>
          <div className="zipco-agenda-tray-cap">Tipo de pedido</div>
          {TYPE_OPTIONS.map(({ key, label, hint, color, Icon }) => (
            <button
              key={key} type="button" role="menuitemradio" aria-checked={filters.type === key}
              className="zipco-agenda-opt" data-empty={counts.type[key] === 0 || undefined}
              onClick={() => { onFilters({ ...filters, type: key }); close(); }}>
              <span className="zipco-agenda-opt-icon" style={{ background: filters.type === key ? color : undefined }} aria-hidden="true"><Icon size={17} strokeWidth={2.1} /></span>
              <span className="zipco-agenda-opt-text"><b>{label}</b><small>{hint}</small></span>
              <em>{counts.type[key]}</em>
              <span className="zipco-agenda-opt-check" aria-hidden="true"><Check size={12} strokeWidth={3.4} /></span>
            </button>
          ))}
        </div>
      )}
      {open === 'sort' && (
        <div id={`${id}-sort`} className="zipco-agenda-tray" role="menu" aria-label="Ordenar pedidos" data-agenda-tray>
          <div className="zipco-agenda-tray-cap">Ordenar por</div>
          {SORT_OPTIONS.map(({ key, label, hint, Icon }) => (
            <button
              key={key} type="button" role="menuitemradio" aria-checked={sort === key} className="zipco-agenda-opt"
              onClick={() => { onSort(key); close(); }}>
              <span className="zipco-agenda-opt-icon" aria-hidden="true"><Icon size={17} strokeWidth={2.1} /></span>
              <span className="zipco-agenda-opt-text"><b>{label}</b><small>{hint}</small></span>
              <span className="zipco-agenda-opt-check" aria-hidden="true"><Check size={12} strokeWidth={3.4} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
