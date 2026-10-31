import * as React from 'react';







import type { QuoteRequest } from "../../../../quotes/domain/quoteApi";


import CompactHistoryList from './CompactHistoryList';
import { normalizeQuote } from './historyPresentation';
export function QuoteHistoryList({
  quotes,
  owner,
  deleted,
  onArchive,
  onDelete,
}: {
  quotes: QuoteRequest[];
  owner: "customer" | "business";
  deleted: boolean;
  onArchive: (quote: QuoteRequest, archived: boolean) => void;
  onDelete?: (quote: QuoteRequest) => void;
}) {
  const byId = new Map(quotes.map((quote) => [quote.id, quote]));
  return (
    <CompactHistoryList
      items={quotes.map((quote) => normalizeQuote(quote, owner))}
      deleted={deleted}
      onArchive={(id, archived) => {
        const quote = byId.get(id);
        if (quote) onArchive(quote, archived);
      }}
      onDelete={(id) => {
        const quote = byId.get(id);
        if (quote) onDelete?.(quote);
      }}
    />
  );
}
