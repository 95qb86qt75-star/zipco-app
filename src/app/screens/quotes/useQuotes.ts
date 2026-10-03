import { useCallback, useEffect, useState } from "react";
import { showAppToast, type ToastOptions } from "../Toast";
import {
  archiveQuote,
  deleteQuotePermanently,
  getBusinessQuotes,
  getMyQuotes,
  proposeQuoteAlternative,
  QuoteApiError,
  respondQuote,
  updateQuoteStatus,
  type QuoteCancellationReason,
  type QuoteRequest,
  type QuoteStatus,
} from "./quoteApi";

export default function useQuotes(onSessionExpired: () => void) {
  const [myQuotes, setMyQuotes] = useState<QuoteRequest[]>([]);
  const [businessQuotes, setBusinessQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<Set<number>>(() => new Set());
  const hasBusiness = Boolean(localStorage.getItem("zipco-business-id"));

  const load = useCallback(
    async (silent = false) => {
      const token = localStorage.getItem("zipco-token");
      const businessId = Number(localStorage.getItem("zipco-business-id"));
      if (!token) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      setError("");
      try {
        const [mine, business] = await Promise.all([
          getMyQuotes(token),
          Number.isInteger(businessId) && businessId > 0
            ? getBusinessQuotes(businessId, token)
            : Promise.resolve([]),
        ]);
        setMyQuotes(mine);
        setBusinessQuotes(business);
      } catch (cause) {
        if (cause instanceof QuoteApiError && cause.status === 401)
          onSessionExpired();
        else setError("No se pudieron cargar las cotizaciones.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [onSessionExpired],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (
      quote: QuoteRequest,
      operation: () => Promise<unknown>,
      success: string | { message?: string; options: ToastOptions },
    ) => {
      if (updating.has(quote.id)) return false;
      setUpdating((current) => new Set(current).add(quote.id));
      try {
        await operation();
        await load();
        if (typeof success === "string") showAppToast(success);
        else showAppToast(success.message ?? "", "success", success.options);
        return true;
      } catch (cause) {
        if (cause instanceof QuoteApiError && cause.status === 401)
          onSessionExpired();
        else {
          showAppToast(
            cause instanceof Error
              ? cause.message
              : "No se pudo actualizar la cotización.",
            "error",
          );
          await load();
        }
        return false;
      } finally {
        setUpdating((current) => {
          const next = new Set(current);
          next.delete(quote.id);
          return next;
        });
      }
    },
    [load, onSessionExpired, updating],
  );

  const changeStatus = (
    quote: QuoteRequest,
    status: QuoteStatus,
    reason?: QuoteCancellationReason,
    reasonDetail?: string,
  ) => {
    const token = localStorage.getItem("zipco-token");
    if (!token) return Promise.resolve(false);
    return run(
      quote,
      () => updateQuoteStatus(quote.id, status, token, reason, reasonDetail),
      status === "completed"
        ? {
            options: {
              title: "Recepción confirmada",
              description:
                "Tu solicitud quedó completada. Puedes verla en Historial.",
              durationMs: 7000,
            },
          }
        : "Cotización actualizada.",
    );
  };
  const respond = (quote: QuoteRequest, price: number, message: string) => {
    const token = localStorage.getItem("zipco-token");
    if (!token) return;
    void run(
      quote,
      () => respondQuote(quote.id, price, message, token),
      "Cotización enviada al cliente.",
    );
  };
  const proposeAlternative = (
    quote: QuoteRequest,
    payload: {
      date?: string;
      time?: string;
      item?: string;
      quantity?: number;
      priceClp?: number;
      photo?: string;
      message: string;
    },
  ) => {
    const token = localStorage.getItem("zipco-token");
    if (!token) return;
    return run(
      quote,
      () => proposeQuoteAlternative(quote.id, payload, token),
      "Alternativa enviada al cliente.",
    );
  };
  const setArchived = (quote: QuoteRequest, archived: boolean) => {
    const token = localStorage.getItem("zipco-token");
    if (!token) return;
    void run(
      quote,
      () => archiveQuote(quote.id, archived, token),
      archived
        ? "Cotización movida a Eliminados."
        : "Cotización restaurada al historial.",
    );
  };

  const deletePermanently = (quote: QuoteRequest) => {
    const token = localStorage.getItem("zipco-token");
    if (!token) return;
    void run(
      quote,
      () => deleteQuotePermanently(quote.id, token),
      "Cotización eliminada definitivamente.",
    );
  };

  return {
    hasBusiness,
    myQuotes,
    businessQuotes,
    loading,
    error,
    updating,
    load,
    changeStatus,
    respond,
    proposeAlternative,
    setArchived,
    deletePermanently,
  };
}
