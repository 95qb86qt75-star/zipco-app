import { API_BASE_URL } from "../../api/apiConfig";

export type QuoteStatus =
  | "requested"
  | "quoted"
  | "alternative_proposed"
  | "accepted"
  | "ready"
  | "completed"
  | "declined"
  | "cancelled";
export type QuoteCancellationReason =
  | "no_longer_needed"
  | "sent_by_mistake"
  | "requirements_changed"
  | "business_took_too_long"
  | "unavailable"
  | "cannot_meet_schedule"
  | "outside_service_area"
  | "insufficient_information"
  | "no_capacity"
  | "other";

export type QuoteRequest = {
  id: number;
  businessId: number;
  catalogItemId: number;
  userId: number;
  customerName: string;
  customerPhone: string | null;
  customerPhoto?: string | null;
  itemNameSnapshot: string;
  itemDescriptionSnapshot: string;
  startingPriceClpSnapshot: number | null;
  message: string;
  needNow: boolean;
  requestedDate: string | null;
  requestedTime: string | null;
  referencePhoto: string | null;
  status: QuoteStatus;
  quotedPriceClp: number | null;
  businessMessage: string | null;
  closureReason: string | null;
  closureReasonDetail: string | null;
  alternativeDate: string | null;
  alternativeTime: string | null;
  alternativeItem: string | null;
  alternativeQuantity: number | null;
  alternativePriceClp: number | null;
  alternativeMessage: string | null;
  customerArchivedAt: string | null;
  businessArchivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class QuoteApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = "No se pudo completar la operación.";
    try {
      const body = await response.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      /* respuesta sin JSON */
    }
    throw new QuoteApiError(message, response.status);
  }
  return response.json();
}

export function createQuote(
  payload: {
    businessId: number;
    catalogItemId: number;
    message: string;
    needNow: boolean;
    requestedDate?: string;
    requestedTime?: string;
    referencePhoto?: string;
  },
  token: string,
  idempotencyKey: string,
) {
  return request<QuoteRequest>("/quotes", token, {
    method: "POST",
    body: JSON.stringify({ ...payload, idempotencyKey }),
  });
}

export const getMyQuotes = (token: string) =>
  request<QuoteRequest[]>("/quotes/my-quotes", token);
export const getBusinessQuotes = (businessId: number, token: string) =>
  request<QuoteRequest[]>(`/quotes/business/${businessId}`, token);
export const respondQuote = (
  id: number,
  priceClp: number,
  message: string,
  token: string,
) =>
  request<QuoteRequest>(`/quotes/${id}/respond`, token, {
    method: "PATCH",
    body: JSON.stringify({ priceClp, message: message.trim() || undefined }),
  });
export const proposeQuoteAlternative = (
  id: number,
  payload: {
    date?: string;
    time?: string;
    item?: string;
    quantity?: number;
    priceClp?: number;
    message: string;
  },
  token: string,
) =>
  request<QuoteRequest>(`/quotes/${id}/alternative`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const updateQuoteStatus = (
  id: number,
  status: QuoteStatus,
  token: string,
  reason?: QuoteCancellationReason,
  reasonDetail?: string,
) =>
  request<QuoteRequest>(`/quotes/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status, reason, reasonDetail }),
  });
export const archiveQuote = (id: number, archived: boolean, token: string) =>
  request<QuoteRequest>(`/quotes/${id}/archive`, token, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
  });
export const deleteQuotePermanently = (id: number, token: string) =>
  request<{ deleted: true }>(`/quotes/${id}/delete-permanently`, token, {
    method: "PATCH",
  });
