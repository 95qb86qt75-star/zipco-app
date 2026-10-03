export const ORDER_STATUSES = [
  "pending",
  "alternative_proposed",
  "accepted",
  "ready",
  "completed",
  "rejected",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DisplayOrderStatus = OrderStatus | "unavailable";
export type IdentityIssue = "record" | "id" | "status";
export type OrderDataIssue =
  | "businessId"
  | "userId"
  | "createdAt"
  | "deliveryDate"
  | "deliveryTime"
  | "total"
  | "products"
  | "items"
  | "cancellationReason"
  | "businessName"
  | "businessPhone"
  | "businessImage"
  | "customerName"
  | "customerPhone"
  | "customerImage"
  | "note"
  | "referencePhoto"
  | "needNow";

export const CANCELLATION_REASONS = [
  "no_longer_needed",
  "business_took_too_long",
  "selected_by_mistake",
  "requirements_changed",
  "unavailable",
  "cannot_meet_schedule",
  "outside_service_area",
  "insufficient_information",
  "no_capacity",
  "other",
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];
export type RejectionReason =
  | "unavailable"
  | "cannot_meet_schedule"
  | "outside_service_area"
  | "insufficient_information"
  | "no_capacity"
  | "other";
export type ClosureReason = CancellationReason | RejectionReason;
export type NormalizedCancellationReason =
  CancellationReason | "unavailable" | null;

export type Product = { name: string; quantity: number; price: number };
export type NormalizedProducts =
  | { state: "available"; items: Product[] }
  | { state: "unavailable"; items: [] };

type AvailableOrderIdentity = {
  recordState: "available";
  id: number;
  status: OrderStatus;
  identityIssues: [];
};

type UnavailableOrderIdentity = {
  recordState: "unavailable";
  id: null;
  status: "unavailable";
  identityIssues: IdentityIssue[];
};

export type OrderIdentity = AvailableOrderIdentity | UnavailableOrderIdentity;

type CommonOrderData = {
  clientKey: string;
  businessId: number | null;
  userId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  date: string;
  products: NormalizedProducts;
  note: string;
  total: number | null;
  deliveryDate: string | null;
  deliveryTime: string | null;
  needNow: boolean;
  referencePhoto: string | null;
  cancellationReason: NormalizedCancellationReason;
  cancellationReasonDetail: string;
  alternativeDate: string | null;
  alternativeTime: string | null;
  alternativeItem: string;
  alternativeQuantity: number | null;
  alternativePriceClp: number | null;
  alternativeMessage: string;
  alternativePhoto: string | null;
  archivedAt: string | null;
  dataIssues: OrderDataIssue[];
};

export type BusinessRequest = OrderIdentity &
  CommonOrderData & {
    customerName: string;
    customerPhone: string;
    customerImage: string;
    distance: string;
  };

export type MyOrder = OrderIdentity &
  CommonOrderData & {
    businessName: string;
    businessPhone: string;
    businessImage: string;
  };

export type UpdateOrderStatusPayload = {
  status: Extract<
    OrderStatus,
    "accepted" | "ready" | "completed" | "rejected" | "cancelled"
  >;
  cancellationReason?: CancellationReason;
  rejectionReason?: RejectionReason;
  reasonDetail?: string;
};

export type ActionableOrder = { id: number; status: OrderStatus };
export type OrderActor = "customer" | "business";
export type OrderAction =
  | "accept"
  | "reject"
  | "cancel"
  | "accept-alternative"
  | "reject-alternative"
  | "mark-ready"
  | "complete-reception"
  | "complete-delivery";
