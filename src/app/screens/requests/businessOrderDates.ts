import type { BusinessRequest } from './types';

export type BusinessDateFilter = 'today' | 'tomorrow' | 'upcoming' | 'undated';

function toLocalCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function classifyBusinessDeliveryDate(
  order: Pick<BusinessRequest, 'needNow' | 'deliveryDate'>,
  now: Date = new Date()
): BusinessDateFilter {
  if (order.needNow) return 'today';
  if (!order.deliveryDate) return 'undated';

  const today = toLocalCalendarDate(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toLocalCalendarDate(tomorrowDate);

  if (order.deliveryDate <= today) return 'today';
  if (order.deliveryDate === tomorrow) return 'tomorrow';
  return 'upcoming';
}
