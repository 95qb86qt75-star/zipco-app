import type {QuoteRequest} from '../domain/quoteApi';
export const labels = {
  requested: "Esperando respuesta",
  quoted: "Propuesta recibida",
  alternative_proposed: "Esperando tu respuesta",
  accepted: "Aceptada",
  ready: "Lista",
  completed: "Completada",
  declined: "Rechazada",
  cancelled: "Cancelada",
} as const;
export const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
export const proposalPrice = (quote: QuoteRequest) =>
  quote.alternativePriceClp ??
  quote.quotedPriceClp ??
  quote.startingPriceClpSnapshot;
export function formatQuoteDay(quote: QuoteRequest) {
  const parsed = new Date(quote.updatedAt || quote.createdAt);
  return Number.isNaN(parsed.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
}
