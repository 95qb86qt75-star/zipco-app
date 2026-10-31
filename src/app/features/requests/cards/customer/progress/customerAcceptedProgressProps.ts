import type useCoordination from '../../../application/useCoordination';
import type {AcceptedSummary} from '../../../shared/conditions/CoordinationSheets';
type OrderProp=Parameters<typeof useCoordination>[0];
export type CustomerAcceptedProgressProps={
  order: OrderProp; businessName: string; image?: string; price: number | null; statusLabel: string;
  accepted: AcceptedSummary & { scheduledFor?: string | null }; acceptedAt?: string | null;
  conditionsTitle: string; conditionsSubtitle: string; conditionsWhen: string; conditionsSummary: string; explanation?: string | null;
  negotiated: boolean; refresh: () => void;
  embedded?:boolean;notificationOpen?: number; onInspect?: () => void; isUnread?: boolean;

};
