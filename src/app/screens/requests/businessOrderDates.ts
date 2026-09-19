import type { BusinessRequest } from './types';

type DeliveryOrder = Pick<BusinessRequest, 'needNow' | 'deliveryDate' | 'deliveryTime' | 'createdAt' | 'clientKey'>;

function createdAtValue(order: DeliveryOrder): number {
  const parsed = order.createdAt ? Date.parse(order.createdAt) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function deliveryRank(order: DeliveryOrder): number {
  if (order.needNow) return 0;
  if (order.deliveryDate && order.deliveryTime) return 1;
  return 2;
}

export function sortBusinessOrdersByDelivery<T extends DeliveryOrder>(orders: T[]): T[] {
  return [...orders].sort((left, right) => {
    const rankDifference = deliveryRank(left) - deliveryRank(right);
    if (rankDifference !== 0) return rankDifference;

    if (!left.needNow && left.deliveryDate && left.deliveryTime && right.deliveryDate && right.deliveryTime) {
      const scheduleDifference = `${left.deliveryDate}T${left.deliveryTime}`.localeCompare(`${right.deliveryDate}T${right.deliveryTime}`);
      if (scheduleDifference !== 0) return scheduleDifference;
    }

    const creationDifference = createdAtValue(left) - createdAtValue(right);
    if (creationDifference !== 0) return creationDifference;
    return left.clientKey.localeCompare(right.clientKey);
  });
}
