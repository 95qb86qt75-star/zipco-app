import * as React from 'react';
import { CalendarDays, CircleHelp, TriangleAlert, Zap } from 'lucide-react';
import { agendaHeading, describeSchedule, type AgendaGroup, type AgreedSchedule } from '../../domain/businessAgenda';

const TONE: Record<AgendaGroup, string> = {
  asap: 'is-now', today: 'is-now', tomorrow: 'is-tomorrow', upcoming: 'is-upcoming', past: 'is-past', unverified: 'is-unverified',
};

/** Encabezado de grupo: no interactivo; solo organiza la lista. */
export function AgendaGroupHeading({ group, nowMs }: { group: AgendaGroup; nowMs: number }) {
  const { title, hint } = agendaHeading(group, nowMs);
  const Icon = group === 'asap' ? Zap : group === 'past' ? TriangleAlert : group === 'unverified' ? CircleHelp : CalendarDays;
  return (
    <h3 className={`zipco-agenda-heading ${TONE[group]}`}>
      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
      <strong>{title}</strong>{hint && <span>{hint}</span>}<i aria-hidden="true" />
    </h3>
  );
}

/** Separador por fecha de solicitud para «Recientes»/«Antiguas» (igual que antes: order.date). */
export function AgendaRequestDay({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-500">
      <CalendarDays className="h-4 w-4" />
      <span>{date}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

/**
 * Envuelve la tarjeta real SIN modificarla: bloque con el horario acordado a la izquierda.
 * Con la tarjeta desplegada (o en pantallas muy angostas) el bloque pasa a ser una banda superior.
 */
export function AgendaRow({ schedule, group, children }: { schedule: AgreedSchedule; group: AgendaGroup; children: React.ReactNode }) {
  const when = describeSchedule(schedule, group);
  return (
    <div className={`zipco-agenda-row ${TONE[group]}`}>
      <div className="zipco-agenda-when">
        <span className="sr-only">Servicio acordado: {when.full}</span>
        <span className="zipco-agenda-when-short" aria-hidden="true">
          {group === 'asap' ? <em><Zap size={14} strokeWidth={2.6} /></em> : <em>{when.top || ' '}</em>}
          <b>{when.big}</b><i>{when.bottom}</i>
        </span>
        <span className="zipco-agenda-when-full" aria-hidden="true">{when.full}</span>
      </div>
      <div className="zipco-agenda-card">{children}</div>
    </div>
  );
}
