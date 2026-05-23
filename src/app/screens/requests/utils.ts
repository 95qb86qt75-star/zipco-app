import type { BusinessRequest, Product } from './types';

export const calculateTotal = (products: Product[]) => {
  return products.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const sortByUrgency = (a: BusinessRequest, b: BusinessRequest) => {
  if (a.needNow && !b.needNow) return -1;
  if (!a.needNow && b.needNow) return 1;

  if (!a.needNow && !b.needNow) {
    const dateA = new Date(`${a.deliveryDate} ${a.deliveryTime}`);
    const dateB = new Date(`${b.deliveryDate} ${b.deliveryTime}`);
    return dateA.getTime() - dateB.getTime();
  }

  return 0;
};

export const isToday = (dateString: string) => {
  if (!dateString) return false;
  const today = new Date('2026-04-26');
  const checkDate = new Date(dateString);
  return today.toDateString() === checkDate.toDateString();
};

export const formatDate = (dateString: string) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const date = new Date(dateString);
  return `${date.getDate()} ${months[date.getMonth()]}`;
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
