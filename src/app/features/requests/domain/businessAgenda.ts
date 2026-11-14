import type { BusinessRequest } from './types';

/**
 * Mi Negocio → En curso · lógica pura de la agenda por horario ACORDADO del servicio.
 * No lee createdAt, updatedAt, order.date ni texto libre como horario acordado: el horario llega
 * únicamente desde un `AgreedScheduleResolver` que conecta la capa de datos (ver controlador).
 */

export const AGENDA_TIME_ZONE = 'America/Santiago';

/** Horario acordado de un pedido. `scheduled.at` es un instante ISO 8601 (p. ej. AgreementReadDto.scheduledFor). */
export type AgreedSchedule =
  | { kind: 'asap' }
  | { kind: 'scheduled'; at: string }
  | { kind: 'unverified' };
export type AgreedScheduleResolver = (order: BusinessRequest) => AgreedSchedule;

export type AgendaSort = 'attention' | 'newest' | 'oldest';
export type AgendaConfig = {
  resolve: AgreedScheduleResolver;
  sort: AgendaSort;
  onSort: (sort: AgendaSort) => void;
};

export type AgendaGroup = 'asap' | 'today' | 'tomorrow' | 'upcoming' | 'past' | 'unverified';
export const AGENDA_GROUP_ORDER: readonly AgendaGroup[] = ['asap', 'today', 'tomorrow', 'upcoming', 'past', 'unverified'];

export type AgendaDateFilter = 'all' | 'late' | 'today' | 'tomorrow' | 'upcoming' | 'unverified';
export type AgendaTypeFilter = 'all' | 'pickup' | 'reserved' | 'whatsapp';
export type AgendaFilters = { date: AgendaDateFilter; type: AgendaTypeFilter };
export const DEFAULT_AGENDA_FILTERS: AgendaFilters = { date: 'all', type: 'all' };
export const isDefaultAgendaFilters = (filters: AgendaFilters) => filters.date === 'all' && filters.type === 'all';

/** pickup = retiro sin reserva · reserved = retiro con reserva solicitada · whatsapp · other = no clasificable (solo con «Todos»). */
export type AgendaModality = 'pickup' | 'reserved' | 'whatsapp' | 'other';

type AvailableOrder = Extract<BusinessRequest, { recordState: 'available' }>;
export type AgendaEntry = {
  order: AvailableOrder;
  schedule: AgreedSchedule;
  group: AgendaGroup;
  modality: AgendaModality;
  at: number | null;
  index: number;
};

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: AGENDA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayNumber = (ms: number): number => {
  const [year, month, day] = dayFormat.format(new Date(ms)).split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};

export function validSchedule(value: unknown): AgreedSchedule {
  if (value && typeof value === 'object') {
    const candidate = value as { kind?: unknown; at?: unknown };
    if (candidate.kind === 'asap') return { kind: 'asap' };
    if (candidate.kind === 'scheduled' && typeof candidate.at === 'string' && Number.isFinite(Date.parse(candidate.at))) {
      return { kind: 'scheduled', at: candidate.at };
    }
  }
  return { kind: 'unverified' };
}

export function agendaGroupOf(schedule: AgreedSchedule, nowMs: number): AgendaGroup {
  if (schedule.kind === 'asap') return 'asap';
  if (schedule.kind === 'unverified') return 'unverified';
  const difference = dayNumber(Date.parse(schedule.at)) - dayNumber(nowMs);
  if (difference < 0) return 'past';
  if (difference === 0) return 'today';
  if (difference === 1) return 'tomorrow';
  return 'upcoming';
}

/** Modalidad a partir de los contratos reales: availability.path y reservationChoice.choice. */
export function modalityOf(order: AvailableOrder): AgendaModality {
  const process = order.requestProcess as unknown as {
    availability?: { path?: string } | null;
    reservationChoice?: { choice?: string } | null;
    localPickupInformation?: unknown;
  } | null | undefined;
  // El retiro informativo del contrato nuevo tiene su propio recorrido: no se deduce solo de LOCAL_PICKUP.
  if (!process || process.localPickupInformation) return 'other';
  if (process.availability?.path === 'WHATSAPP') return 'whatsapp';
  if (process.availability?.path === 'LOCAL_PICKUP') {
    if (process.reservationChoice?.choice === 'REQUEST_RESERVATION') return 'reserved';
    if (process.reservationChoice?.choice === 'NONE') return 'pickup';
    return 'other';
  }
  return 'other';
}

export function buildAgendaEntries(requests: BusinessRequest[], resolve: AgreedScheduleResolver, nowMs: number): AgendaEntry[] {
  const entries: AgendaEntry[] = [];
  requests.forEach((order) => {
    if (order.recordState !== 'available') return;
    let schedule: AgreedSchedule;
    try { schedule = validSchedule(resolve(order)); } catch { schedule = { kind: 'unverified' }; }
    entries.push({
      order, schedule, group: agendaGroupOf(schedule, nowMs), modality: modalityOf(order),
      at: schedule.kind === 'scheduled' ? Date.parse(schedule.at) : null, index: entries.length,
    });
  });
  return entries;
}

/** «Por atender»: grupos en orden de atención; dentro de cada uno, por horario acordado ascendente (estable). */
export function sortByAttention(entries: AgendaEntry[]): AgendaEntry[] {
  return [...entries].sort((a, b) =>
    AGENDA_GROUP_ORDER.indexOf(a.group) - AGENDA_GROUP_ORDER.indexOf(b.group)
    || (a.at ?? 0) - (b.at ?? 0) || a.index - b.index);
}

const dateMatches = (entry: AgendaEntry, filter: AgendaDateFilter) =>
  filter === 'all' || (filter === 'late' && entry.group === 'past') || (filter === 'today' && (entry.group === 'asap' || entry.group === 'today'))
  || (filter === 'tomorrow' && entry.group === 'tomorrow') || (filter === 'upcoming' && entry.group === 'upcoming')
  || (filter === 'unverified' && entry.group === 'unverified');
const typeMatches = (entry: AgendaEntry, filter: AgendaTypeFilter) => filter === 'all' || entry.modality === filter;

export const applyAgendaFilters = (entries: AgendaEntry[], filters: AgendaFilters) =>
  entries.filter((entry) => dateMatches(entry, filters.date) && typeMatches(entry, filters.type));

export type AgendaCounts = { date: Record<AgendaDateFilter, number>; type: Record<AgendaTypeFilter, number> };
/** Cada contador respeta el otro filtro, como en el diseño aprobado. */
export function countAgendaOptions(entries: AgendaEntry[], filters: AgendaFilters): AgendaCounts {
  const dates: AgendaDateFilter[] = ['all', 'late', 'today', 'tomorrow', 'upcoming', 'unverified'];
  const types: AgendaTypeFilter[] = ['all', 'pickup', 'reserved', 'whatsapp'];
  return {
    date: Object.fromEntries(dates.map((key) => [key, entries.filter((entry) => dateMatches(entry, key) && typeMatches(entry, filters.type)).length])) as AgendaCounts['date'],
    type: Object.fromEntries(types.map((key) => [key, entries.filter((entry) => typeMatches(entry, key) && dateMatches(entry, filters.date)).length])) as AgendaCounts['type'],
  };
}

const clean = (text: string) => text.replace(/\./g, '');
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-CL', { timeZone: AGENDA_TIME_ZONE, ...options });
const weekdayShort = fmt({ weekday: 'short' });
const weekdayLong = fmt({ weekday: 'long' });
const monthShort = fmt({ month: 'short' });
const dayOnly = fmt({ day: 'numeric' });
const timeOnly = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const longDate = fmt({ weekday: 'long', day: 'numeric', month: 'long' });

export type AgendaWhen = { top: string; big: string; bottom: string; full: string };
export function describeSchedule(schedule: AgreedSchedule, group: AgendaGroup): AgendaWhen {
  if (schedule.kind === 'asap') return { top: '', big: 'YA', bottom: 'AHORA', full: 'Lo antes posible' };
  if (schedule.kind === 'unverified') return { top: '', big: '?', bottom: 'SIN HORA', full: 'Horario por comprobar' };
  const date = new Date(Date.parse(schedule.at));
  const time = timeOnly.format(date);
  const top = group === 'today' ? 'HOY' : group === 'tomorrow' ? 'MAÑ.' : clean(weekdayShort.format(date)).toUpperCase();
  return {
    top, big: dayOnly.format(date), bottom: time,
    full: `${upperFirst(weekdayLong.format(date))} ${dayOnly.format(date)} ${clean(monthShort.format(date))} · ${time}`,
  };
}

export type AgendaHeading = { title: string; hint: string };
export function agendaHeading(group: AgendaGroup, nowMs: number): AgendaHeading {
  const today = longDate.format(new Date(nowMs));
  switch (group) {
    case 'asap': return { title: 'Lo antes posible', hint: 'Sin hora fija' };
    case 'today': return { title: 'Hoy', hint: today };
    case 'tomorrow': return { title: 'Mañana', hint: longDate.format(new Date((dayNumber(nowMs) + 1) * 86_400_000 + 43_200_000)) };
    case 'upcoming': return { title: 'Próximos días', hint: '' };
    case 'past': return { title: 'Fecha pasada · pendientes', hint: 'Siguen abiertos' };
    default: return { title: 'Horario por comprobar', hint: 'No hay un horario verificable' };
  }
}
