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

const norm = (text?: string | null) => (text ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es-CL');

/**
 * Marca la fila con `data-redundant-status` cuando la píldora de estado de la tarjeta no aporta nada nuevo:
 * en retiro, cuando repite el título de la fila de estado; en WhatsApp, cuando solo dice «En curso» (la pestaña ya lo dice).
 * Solo lee el DOM de la tarjeta; el CSS usa la marca para ganar altura en la agenda compacta.
 */
function useRedundantStatusMark(ref: React.RefObject<HTMLDivElement | null>) {
  React.useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    const sync = () => {
      const whatsapp = row.querySelector('.zipco-bp-pill b');
      const pickup = row.querySelector('.zipco-co-pill');
      const title = row.querySelector('.zipco-co-colrow .tx b');
      const redundant = whatsapp
        ? norm(whatsapp.textContent) === 'en curso'
        : Boolean(pickup && title && norm(pickup.textContent) !== '' && norm(pickup.textContent) === norm(title.textContent));
      if (row.hasAttribute('data-redundant-status') !== redundant) row.toggleAttribute('data-redundant-status', redundant);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(row, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * Envuelve la tarjeta real SIN modificarla: bloque con el horario acordado a la izquierda (46 px).
 * Con la tarjeta desplegada (o en pantallas muy angostas) el bloque pasa a ser una banda superior.
 */
export function AgendaRow({ schedule, group, children }: { schedule: AgreedSchedule; group: AgendaGroup; children: React.ReactNode }) {
  const when = describeSchedule(schedule, group);
  const rowRef = React.useRef<HTMLDivElement>(null);
  useRedundantStatusMark(rowRef);
  return (
    <div ref={rowRef} className={`zipco-agenda-row ${TONE[group]}`}>
      <div className="zipco-agenda-when">
        <span className="sr-only">Servicio acordado: {when.full}</span>
        <span className="zipco-agenda-when-short" aria-hidden="true">
          {group === 'asap' ? <em><Zap size={14} strokeWidth={2.6} /></em> : <em>{when.top || ' '}</em>}
          <b>{when.big}</b><i>{when.bottom}</i>
        </span>
        <span className="zipco-agenda-when-full" aria-hidden="true">{when.full}</span>
      </div>
      <div className="zipco-agenda-card">{children}</div>
    </div>
  );
}
