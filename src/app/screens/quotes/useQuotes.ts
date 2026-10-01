import { useCallback, useEffect, useState } from 'react';
import { showAppToast } from '../Toast';
import { archiveQuote, deleteQuotePermanently, getBusinessQuotes, getMyQuotes, proposeQuoteAlternative, QuoteApiError, respondQuote, updateQuoteStatus, type QuoteCancellationReason, type QuoteRequest, type QuoteStatus } from './quoteApi';

export default function useQuotes(onSessionExpired: () => void) {
  const [myQuotes, setMyQuotes] = useState<QuoteRequest[]>([]);
  const [businessQuotes, setBusinessQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<Set<number>>(() => new Set());
  const hasBusiness = Boolean(localStorage.getItem('zipco-business-id'));

  const load = useCallback(async () => {
    const token = localStorage.getItem('zipco-token'); const businessId = Number(localStorage.getItem('zipco-business-id'));
    if (!token) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [mine, business] = await Promise.all([getMyQuotes(token), Number.isInteger(businessId) && businessId > 0 ? getBusinessQuotes(businessId, token) : Promise.resolve([])]);
      setMyQuotes(mine); setBusinessQuotes(business);
    } catch (cause) {
      if (cause instanceof QuoteApiError && cause.status === 401) onSessionExpired();
      else setError('No se pudieron cargar las cotizaciones.');
    } finally { setLoading(false); }
  }, [onSessionExpired]);

  useEffect(() => { void load(); }, [load]);

  const run = useCallback(async (quote: QuoteRequest, operation: () => Promise<unknown>, success: string) => {
    if (updating.has(quote.id)) return;
    setUpdating((current) => new Set(current).add(quote.id));
    try { await operation(); await load(); showAppToast(success); }
    catch (cause) {
      if (cause instanceof QuoteApiError && cause.status === 401) onSessionExpired();
      else { showAppToast(cause instanceof Error ? cause.message : 'No se pudo actualizar la cotización.', 'error'); await load(); }
    } finally { setUpdating((current) => { const next = new Set(current); next.delete(quote.id); return next; }); }
  }, [load, onSessionExpired, updating]);

  const changeStatus = (quote: QuoteRequest, status: QuoteStatus, reason?: QuoteCancellationReason, reasonDetail?: string) => {
    const token = localStorage.getItem('zipco-token'); if (!token) return;
    void run(quote, () => updateQuoteStatus(quote.id, status, token, reason, reasonDetail), 'Cotización actualizada.');
  };
  const respond = (quote: QuoteRequest, price: number, message: string) => {
    const token = localStorage.getItem('zipco-token'); if (!token) return;
    void run(quote, () => respondQuote(quote.id, price, message, token), 'Cotización enviada al cliente.');
  };
  const proposeAlternative = (quote: QuoteRequest, payload: { date?: string; time?: string; item?: string; quantity?: number; priceClp?: number; message: string }) => {
    const token = localStorage.getItem('zipco-token'); if (!token) return;
    void run(quote, () => proposeQuoteAlternative(quote.id, payload, token), 'Alternativa enviada al cliente.');
  };
  const setArchived = (quote: QuoteRequest, archived: boolean) => {
    const token = localStorage.getItem('zipco-token'); if (!token) return;
    void run(quote, () => archiveQuote(quote.id, archived, token), archived ? 'Cotización movida a Eliminados.' : 'Cotización restaurada al historial.');
  };

  const deletePermanently = (quote: QuoteRequest) => {
    const token = localStorage.getItem('zipco-token'); if (!token) return;
    void run(quote, () => deleteQuotePermanently(quote.id, token), 'Cotización eliminada definitivamente.');
  };

  return { hasBusiness, myQuotes, businessQuotes, loading, error, updating, load, changeStatus, respond, proposeAlternative, setArchived, deletePermanently };
}
