import type { BusinessRequest, NormalizedProducts } from './types';

export const calculateTotal = (products: NormalizedProducts) => {
  if (products.state === 'unavailable') return null;
  return products.items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const sortByUrgency = (a: BusinessRequest, b: BusinessRequest) => {
  if (a.needNow && !b.needNow) return -1;
  if (!a.needNow && b.needNow) return 1;

  if (!a.needNow && !b.needNow) {
    if (!a.deliveryDate || !a.deliveryTime) return 1;
    if (!b.deliveryDate || !b.deliveryTime) return -1;
    const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime}:00`);
    const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime}:00`);
    return dateA.getTime() - dateB.getTime();
  }

  return 0;
};

export const isToday = (dateString: string | null) => {
  if (!dateString) return false;
  const today = new Date('2026-04-26');
  const checkDate = new Date(dateString);
  return today.toDateString() === checkDate.toDateString();
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Fecha no disponible';
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const [, month, day] = dateString.split('-').map(Number);
  return `${day} ${months[month - 1]}`;
};

export const formatDeliverySchedule = (
  schedule: { needNow: boolean; deliveryDate: string | null; deliveryTime: string | null },
  perspective: 'customer' | 'business'
): string | null => {
  if (schedule.needNow) {
    return perspective === 'customer' ? 'Lo necesitas ahora' : 'Lo necesita ahora';
  }
  if (!schedule.deliveryDate || !schedule.deliveryTime) return null;
  return `${formatDate(schedule.deliveryDate)} · ${schedule.deliveryTime}`;
};

export const formatBusinessDeliverySchedule = (
  schedule: { needNow: boolean; deliveryDate: string | null; deliveryTime: string | null }
): string | null => {
  const formatted = formatDeliverySchedule(schedule, 'business');
  if (!formatted || schedule.needNow) return formatted;
  return `Programado para: ${formatted}`;
};

export const groupByDate = (requests: BusinessRequest[]) => {
  const today: BusinessRequest[] = [];
  const upcoming: BusinessRequest[] = [];

  requests.forEach((req) => {
    if (req.needNow || isToday(req.deliveryDate)) {
      today.push(req);
    } else {
      upcoming.push(req);
    }
  });

  return { today, upcoming };
};
