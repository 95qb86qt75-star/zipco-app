import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Info, Zap } from 'lucide-react';
import type { RequestedSchedule } from '../../domain/expiredProposalSchedule';
import './expired-proposal-schedule.css';

const TZ = 'America/Santiago';
/** Fecha sugerida en zona Chile; el servidor valida el futuro y los permisos. */
export const chileToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dayLabel = (date: string, withYear: boolean) => {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' as const } : {}) })
    .format(new Date(Date.UTC(y, m - 1, d))).replace(/[.,]/g, '');
};
/** Texto corto del horario pedido: «Hoy, vie 13 nov · 23:59» o «vie 20 nov 2026 · 15:00». Solo presentación. */
export function requestedScheduleLabel(schedule?: RequestedSchedule | null) {
  if (!schedule) return '';
  if (schedule.mode === 'IMMEDIATE') return 'Lo antes posible';
  return schedule.date === chileToday() ? `Hoy, ${dayLabel(schedule.date, false)} · ${schedule.time}` : `${dayLabel(schedule.date, true)} · ${schedule.time}`;
}

type Mode = 'TODAY' | 'SCHEDULED';
const initialMode = (initial?: RequestedSchedule | null): Mode | null =>
  initial?.mode === 'SCHEDULED' ? (initial.date === chileToday() ? 'TODAY' : 'SCHEDULED') : null;

/**
 * Elegir nuevo horario (cliente). «Urgente para hoy» se envía como horario programado para hoy (hora de Chile),
 * porque el contrato exige una hora válida y futura. «Aceptar» no envía nada: entrega el horario a quien lo usa (onSelect),
 * que valida y vuelve a la pantalla de confirmación.
 */
export default function ExpiredProposalSchedule({ busy, onSelect, total, initial, feedback, onEdit }: {
  busy: boolean; onSelect: (schedule: RequestedSchedule) => void;
  /** Total ya formateado (por ejemplo «$4.500»), solo para el resumen «Se mantiene». */
  total?: string;
  /** Horario elegido antes de pulsar «Cambiar horario»; se conserva al volver. */
  initial?: RequestedSchedule | null;
  /** Mensaje de error de validación (role="alert"). */
  feedback?: string;
  /** Se llama cuando la persona cambia la selección, para limpiar el error. */
  onEdit?: () => void;
}) {
  const [mode, setMode] = useState<Mode | null>(() => initialMode(initial));
  const [date, setDate] = useState(() => initial?.mode === 'SCHEDULED' && initial.date !== chileToday() ? initial.date : '');
  const [time, setTime] = useState(() => initial?.mode === 'SCHEDULED' ? initial.time : '');
  const today = chileToday();
  const selection: RequestedSchedule | null = mode === 'TODAY' && time ? { mode: 'SCHEDULED', date: today, time }
    : mode === 'SCHEDULED' && date && time ? { mode: 'SCHEDULED', date, time } : null;
  const selectionKey = selection && selection.mode === 'SCHEDULED' ? `${selection.date}|${selection.time}` : '';
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectionKey) return;
    const host = summaryRef.current?.closest('.zipco-chat-scroll') as HTMLElement | null;
    if (!host) return;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => host.scrollTo({ top: host.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }), 120);
    return () => window.clearTimeout(id);
  }, [selectionKey]);
  const edit = (apply: () => void) => { apply(); onEdit?.(); };
  return <fieldset className="zipco-sched" disabled={busy}>
    <legend>Solicitar otro horario</legend>
    <p className="zipco-sched-tx">El negocio debe confirmar el nuevo horario. Tu reserva aún no está confirmada.</p>
    <p className="zipco-sched-once"><Info aria-hidden="true" />Usarás tu única contrapropuesta. Si el negocio la rechaza, la negociación finalizará.</p>
    <div className="zipco-sched-opts" role="group" aria-label="Horario solicitado">
      <button type="button" className="zipco-sched-opt" aria-pressed={mode === 'TODAY'} onClick={() => edit(() => setMode('TODAY'))}><span className="ci"><Zap aria-hidden="true" /></span>Urgente para hoy</button>
      <button type="button" className="zipco-sched-opt" aria-pressed={mode === 'SCHEDULED'} onClick={() => edit(() => setMode('SCHEDULED'))}><span className="ci"><Calendar aria-hidden="true" /></span>Agendar nueva fecha</button>
    </div>
    {mode === 'TODAY' && <div className="zipco-sched-dt">
      <div className="lb">Fecha de Chile<span className="zipco-sched-today"><Calendar aria-hidden="true" />Hoy · {dayLabel(today, false)}</span></div>
      <label>Hora de Chile<input type="time" value={time} onChange={e => edit(() => setTime(e.target.value))} /></label>
    </div>}
    {mode === 'TODAY' && <p className="zipco-sched-imm"><Info aria-hidden="true" />Es una solicitud de horario; no garantiza atención inmediata.</p>}
    {mode === 'SCHEDULED' && <div className="zipco-sched-dt">
      <label>Fecha de Chile<input type="date" min={today} value={date} onChange={e => edit(() => setDate(e.target.value))} /></label>
      <label>Hora de Chile<input type="time" value={time} onChange={e => edit(() => setTime(e.target.value))} /></label>
    </div>}
    {selection && <div ref={summaryRef} aria-live="polite">
      <section className="zipco-sched-sum" aria-label="Solicitar nuevo horario">
        <h4>Solicitar nuevo horario</h4>
        <p className="when"><span className="ci"><Calendar aria-hidden="true" /></span><span className="tx"><b>{requestedScheduleLabel(selection)}</b><small>Hora de Chile</small></span></p>
      </section>
      <section className="zipco-sched-keep" aria-label="Se mantiene">
        <span className="cap">SE MANTIENE</span>
        <p className="ok"><i><Check aria-hidden="true" strokeWidth={3} /></i><span>Se mantienen los productos y el total{total ? <>: <b>{total}</b></> : ''}.</span></p>
        <p className="ok"><i><Check aria-hidden="true" strokeWidth={3} /></i><span>Tu elección de reserva, nota y permiso de contacto se mantienen para esta solicitud.</span></p>
      </section>
    </div>}
    {feedback && <p role="alert" className="zipco-sched-fb">{feedback}</p>}
    <div className="zipco-sched-go">
      <button type="button" aria-label="Aceptar nuevo horario" disabled={!selection} onClick={() => selection && onSelect(selection)}>Aceptar</button>
    </div>
  </fieldset>;
}
