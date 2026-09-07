import BusinessOrderCard from './BusinessOrderCard';
import type { BusinessRequest, OrderAction } from './types';

type Props = {
  request: BusinessRequest;
  variant: 'pending-today' | 'pending-upcoming' | 'accepted-today' | 'accepted-upcoming';
  isUpdating?: boolean;
  onAction?: (action: OrderAction) => void;
  onRetry?: () => void;
};

export default function BusinessRequestCard({
  request,
  isUpdating = false,
  onAction = () => undefined,
  onRetry = () => undefined
}: Props) {
  return (
    <BusinessOrderCard
      request={request}
      isUpdating={isUpdating}
      onAction={onAction}
      onRetry={onRetry}
    />
  );
}
