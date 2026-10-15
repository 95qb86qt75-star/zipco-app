import { hasCompleteDeliverySelection } from './createOrderApi';
import { PAST_SCHEDULE_MESSAGE } from './requests/requestProcessErrors';

export type OrderMoment = 'now' | 'today' | 'schedule';
export type OrderMomentSelection = {
  moment: OrderMoment | null;
  date: string;
  time: string;
};

function santiagoParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)!.value;
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}

export function selectOrderMoment(moment: OrderMoment) {
  return { moment, date: '', time: '' };
}

// Resolve today at submission, including after midnight or a return from background.
// Local checks are advisory; the server remains authoritative for time and DST.
export function resolveOrderDelivery(selection: OrderMomentSelection, now = new Date()) {
  if (!selection.moment) throw new Error('Selecciona cuándo lo necesitas.');
  if (selection.moment === 'now') return { needNow: true, deliveryDate: '', deliveryTime: '' };
  const today = selection.moment === 'today' ? santiagoParts(now) : null;
  const delivery = {
    needNow: false,
    deliveryDate: today?.date ?? selection.date,
    deliveryTime: selection.time,
  };
  if (!hasCompleteDeliverySelection(delivery)) {
    throw new Error(today ? 'Selecciona la hora para hoy.' : 'Selecciona una fecha y hora.');
  }
  if (today && selection.time <= today.time) throw new Error(PAST_SCHEDULE_MESSAGE);
  return delivery;
}
