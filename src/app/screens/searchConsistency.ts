export const MINIMUM_SEARCH_LENGTH = 3;

export const normalizeSearchQuery = (query: string) => query.trim();

export const canRunSearch = (query: string) =>
  normalizeSearchQuery(query).length >= MINIMUM_SEARCH_LENGTH;

export const isCurrentSearchResponse = ({
  requestId,
  latestRequestId,
  requestedQuery,
  currentQuery,
}: {
  requestId: number;
  latestRequestId: number;
  requestedQuery: string;
  currentQuery: string;
}) =>
  requestId === latestRequestId &&
  normalizeSearchQuery(requestedQuery) === normalizeSearchQuery(currentQuery);
