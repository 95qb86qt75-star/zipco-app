type Operation = 'loadOrders.customer' | 'loadOrders.business' | 'loadOrders.businessName';
const routes: Record<Operation, string> = {
  'loadOrders.customer': '/orders/my-orders',
  'loadOrders.business': '/orders/business/:businessId',
  'loadOrders.businessName': '/businesses/:id',
};
const publicCodes = new Set(['INVALID_PROFILE_CONTACT', 'CONTACT_CONSENT_REQUIRED', 'STALE_VERSION',
  'INCOMPATIBLE_STATE', 'IDEMPOTENCY_KEY_REUSED', 'INVALID_REQUEST_PROCESS', 'PROPOSAL_MISMATCH',
  'ACTION_NOT_AVAILABLE_IN_2A']);
export type LoadOrdersDiagnostic = Readonly<{
  operation: Operation; method: 'GET'; route: string; httpStatus: number | null;
  publicCode: string | null; frontendVersion: string;
  loadId: number | null; trigger: LoadTrigger; failureKind: 'http' | 'parse' | 'cancelled' | 'unexpected-abort' | 'network' | 'unknown';
  phase: 'fetch' | 'consume'; errorName: string | null; cancellationReason: LoadCancellation | null;
  startedAt: string; elapsedMs: number; visibility: 'visible' | 'hidden' | 'unknown';
}>;
export type LoadTrigger = 'manual' | 'initial' | 'receipt' | 'refresh-event' | 'resume' | 'unspecified';
export type LoadCancellation = 'page-hidden' | 'pagehide' | 'unmount' | 'superseded';
export type LoadReadContext = { loadId: number; trigger: LoadTrigger; signal: AbortSignal; cancellationReason: () => LoadCancellation | null };
let history: readonly LoadOrdersDiagnostic[] = [];
let historyRevision = 0;
const listeners = new Set<() => void>();
export const diagnosticSnapshot = () => history;
export const subscribeDiagnostics = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
function publish(next: readonly LoadOrdersDiagnostic[]) {
  history = next;
  for (const listener of listeners) { try { listener(); } catch { /* Diagnostics cannot fail a read. */ } }
}
export const clearDiagnostics = () => { historyRevision++; publish([]); };
export const diagnosticText = () => JSON.stringify(history, null, 2);

// Observe the original request/consumer once. Never retry, log raw errors or retain a response.
export async function diagnoseLoadOrdersRead<T>(operation: Operation, request: () => Promise<Response>,
  consume: (response: Response) => Promise<T>, context?: LoadReadContext): Promise<T> {
  let response: Response | undefined;
  let failure: Response | undefined;
  let phase: 'fetch' | 'consume' = 'fetch';
  const started = Date.now();
  const revision = historyRevision;
  const record = async (error?: unknown) => {
    const errorName = error instanceof Error || (typeof DOMException !== 'undefined' && error instanceof DOMException)
      ? ['AbortError','TypeError','SyntaxError','Error','OrdersApiError'].includes(error.name) ? error.name : 'OtherError' : null;
    const cancellationReason = context?.signal.aborted ? context.cancellationReason() : null;
    const failureKind = response && response.status > 0 && !response.ok ? 'http' : cancellationReason ? 'cancelled'
      : errorName === 'AbortError' ? 'unexpected-abort' : errorName === 'SyntaxError' ? 'parse'
        : errorName === 'TypeError' || response?.status === 0 ? 'network' : 'unknown';
    const elapsedMs = Math.max(0, Date.now() - started);
    const visibility = typeof document === 'undefined' ? 'unknown' : document.visibilityState === 'hidden' ? 'hidden' : 'visible';
    let publicCode: string | null = null;
    if (failure) {
      try {
        const body: unknown = await failure.json();
        if (body && typeof body === 'object' && !Array.isArray(body) && 'code' in body &&
          typeof body.code === 'string' && publicCodes.has(body.code)) publicCode = body.code;
      } catch { /* HTML, empty and unknown responses have no public code. */ }
    }
    const frontendVersion = import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION;
    if (revision !== historyRevision) return;
    publish([...history, Object.freeze({ operation, method: 'GET' as const, route: routes[operation],
      httpStatus: response?.status ?? null, publicCode, frontendVersion,
      loadId: context?.loadId ?? null, trigger: context?.trigger ?? 'unspecified', failureKind, phase, errorName,
      cancellationReason, startedAt: new Date(started).toISOString(), elapsedMs, visibility })].slice(-20));
  };
  try {
    response = await request();
    phase = 'consume';
    if (!response.ok) { try { failure = response.clone(); } catch { /* Preserve the original response. */ } }
    const result = await consume(response);
    if (!response.ok) void record();
    return result;
  } catch (error) {
    void record(error);
    throw error;
  }
}
