import { API_BASE_URL } from '../../../api/apiConfig';
import { isRecord } from '../domain/orderValueParsers';
import { BUSINESS_CLOSURE_CONTRACT, BUSINESS_CLOSURE_HEADERS } from '../domain/businessClosure';
let cached: { token: string; enabled?: boolean; request: Promise<boolean> } | undefined;
export const knownBusinessClosureHeaders = (token: string): Record<string,string> =>
  cached?.token === token && cached.enabled ? BUSINESS_CLOSURE_HEADERS : {};
export async function businessClosureHeaders(token: string, probe = false): Promise<Record<string,string>> {
  if (!probe && cached?.token !== token) return {};
  if (cached?.token !== token) {
    const request = fetch(`${API_BASE_URL}/request-process-capabilities`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(5000),
    }).then(async response => {
      if (!response.ok) throw Error('Capability unavailable');
      const body: unknown = await response.json();
      const cap = isRecord(body) ? body.businessOrderClosure : null;
      const enabled = isRecord(cap) && cap.contract === BUSINESS_CLOSURE_CONTRACT && cap.enabled === true;
      if (cached?.request === request) cached.enabled = enabled;
      return enabled;
    });
    cached = { token, request };
    request.catch(() => { if (cached?.request === request) cached = undefined; });
  }
  try { return await cached!.request ? BUSINESS_CLOSURE_HEADERS : {}; } catch { return {}; }
}
