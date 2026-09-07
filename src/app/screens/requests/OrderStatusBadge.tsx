import { STATUS_LABELS } from './orderPresentation';
import type { DisplayOrderStatus } from './types';

const STATUS_CLASSES: Record<DisplayOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  ready: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-700',
  unavailable: 'bg-gray-100 text-gray-700'
};

export default function OrderStatusBadge({ status }: { status: DisplayOrderStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
