import type { StatusView } from './requestStatusGrouping';

const views: readonly string[] = ['pending', 'coordination', 'waiting', 'active', 'ready', 'history'];
export function parseRequestStatusView(value: string | null): StatusView | undefined {
  return value !== null && views.includes(value) ? value as StatusView : undefined;
}

// Local navigation metadata only; never a return URL, contact, token or permission.
export function agreementLink(id: number, business: boolean, history: boolean, returnView?: StatusView) {
  const params = new URLSearchParams({ participant: business ? 'business' : 'customer' });
  if (history) params.set('volver', 'historial'); // Preserve already published history links.
  const view = history ? 'history' : returnView;
  if (view) params.set('view', view);
  return `/solicitudes/procesos/${id}/acuerdo?${params}`;
}

export function agreementReturnLink(search: string) {
  const source = new URLSearchParams(search);
  const participant = source.get('participant') === 'business' ? 'business' : 'customer';
  const view = source.get('volver') === 'historial' ? 'history' : parseRequestStatusView(source.get('view')) ?? 'pending';
  const params = new URLSearchParams({ open: `requests-${participant}`, view });
  return `/?${params}`;
}

export function initialRequestViews(search: string): Record<string, StatusView> {
  const params = new URLSearchParams(search);
  const view = parseRequestStatusView(params.get('view'));
  if (!view) return {};
  const target = params.get('open');
  const business = target === 'requests-business' || target === 'requests-business-quotes';
  const kind = target?.endsWith('-quotes') ? 'quotes' : 'orders';
  return { [`${business ? 'my-business' : 'my-orders'}-${kind}`]: view };
}
