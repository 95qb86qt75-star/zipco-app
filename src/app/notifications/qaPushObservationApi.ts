import { API_BASE_URL } from '../api/apiConfig';

export const OBSERVATION_CONTRACT = 'qa-push-observation-v1';
const base = 'https://zipco-backend-qa.up.railway.app';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const iso = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && Number.isFinite(Date.parse(value));
const clientStages = new Set(['PUSH_RECEIVED','SYSTEM_SHOWN','CLICK_RECEIVED','TARGET_NORMALIZED','LAUNCH_REQUESTED','NAVIGATION_POSTED','CLICK_FAILED','APP_TARGET_ACCEPTED','CARD_FOCUSED']);
const serverStages = new Set(['DELIVERY_ATTEMPTED','PROVIDER_ACCEPTED','PROVIDER_REJECTED']);
export type ObservationRow = { stage: string; source: string; receivedAt: string; traceId?: string; attemptId?: string; workerBuild?: string; workerRevision?: string; hasTarget?: boolean; hasEvent?: boolean; hasClient?: boolean; ok?: boolean };
export type ObservationSession = { contract: typeof OBSERVATION_CONTRACT; sessionId: string; expiresAt: string; state: 'WAITING_FOR_LEGITIMATE_PUSH' | 'OBSERVING'; storage: 'VOLATILE_SINGLE_INSTANCE'; deliveries: { traceId: string; events: ObservationRow[] }[] };

// Allowlist every exported property, even when a server response has extra data.
export function sanitizeObservationSession(value: any): ObservationSession | null {
  if (!value || value.contract !== OBSERVATION_CONTRACT || !uuid(value.sessionId) || !iso(value.expiresAt) ||
      !['WAITING_FOR_LEGITIMATE_PUSH','OBSERVING'].includes(value.state) || value.storage !== 'VOLATILE_SINGLE_INSTANCE' || !Array.isArray(value.deliveries) || value.deliveries.length > 20) return null;
  const deliveries: ObservationSession['deliveries'] = [];
  for (const delivery of value.deliveries) {
    if (!uuid(delivery?.traceId) || !Array.isArray(delivery.events) || delivery.events.length > 30) return null;
    const events: ObservationRow[] = [];
    for (const row of delivery.events) {
      if (!iso(row?.receivedAt)) return null;
      if (row.source === 'server' && serverStages.has(row.stage)) {
        events.push({ stage: row.stage, source: 'server', receivedAt: row.receivedAt }); continue;
      }
      if (row.source !== 'client-reported/server-received' || !clientStages.has(row.stage) || row.traceId !== delivery.traceId ||
          !uuid(row.attemptId) || !/^[a-f0-9]{40}$/.test(row.workerBuild || '') || !['notification-click-attempt-v10','notification-click-attempt-v11'].includes(row.workerRevision)) return null;
      const clean: ObservationRow = { stage: row.stage, source: row.source, receivedAt: row.receivedAt, traceId: delivery.traceId,
        attemptId: row.attemptId, workerBuild: row.workerBuild, workerRevision: row.workerRevision };
      for (const key of ['hasTarget','hasEvent','hasClient','ok'] as const) if (typeof row[key] === 'boolean') clean[key] = row[key];
      events.push(clean);
    }
    deliveries.push({ traceId: delivery.traceId, events });
  }
  return { contract: OBSERVATION_CONTRACT, sessionId: value.sessionId, expiresAt: value.expiresAt,
    state: value.state, storage: 'VOLATILE_SINGLE_INSTANCE', deliveries };
}

const codes: Record<string,string> = {
  QA_PUSH_OBSERVATIONS_DISABLED: 'El diagnóstico remoto todavía está desactivado en QA.',
  SESSION_UNAVAILABLE: 'La sesión venció, se detuvo o se perdió al reiniciar backend. Esto no demuestra que faltara un clic.',
  SESSION_NOT_FOUND: 'Esta sesión no está disponible para tu usuario.',
  QA_PUSH_OBSERVATION_SESSION_LIMIT: 'Se alcanzó el límite de sesiones de diagnóstico.',
  QA_PUSH_OBSERVATION_RATE_LIMIT: 'Se alcanzó la cuota de diagnóstico. La actualización automática se detuvo.',
  QA_PUSH_OBSERVATION_EVENT_LIMIT: 'Se alcanzó el límite de etapas de esta entrega.',
};
export class ObservationError extends Error {
  constructor(public readonly code: string, public readonly httpStatus: number) { super(codes[code] ?? (httpStatus === 401 ? 'No se pudo autorizar el diagnóstico. Revisa tu sesión.' : 'No se pudo confirmar la operación de diagnóstico. No se reintentó automáticamente.')); }
}

export function createObservationApi({ enabled, apiBase, fetch: send }: { enabled: boolean; apiBase: string; fetch: typeof fetch }) {
  const request = async (method: string, token: string, id?: string, signal?: AbortSignal) => {
    if (!enabled || apiBase !== base) throw new ObservationError('QA_PUSH_OBSERVATIONS_DISABLED',404);
    if (!token) throw new ObservationError('AUTH_REQUIRED',401);
    if (id !== undefined && !uuid(id)) throw new ObservationError('INVALID_SESSION_ID',400);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort',abort,{once:true}); if (signal?.aborted) controller.abort();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        send(base+'/qa/push-observations/sessions'+(id ? '/'+id : ''), { method, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          ...(method === 'POST' ? { body: JSON.stringify({contract:OBSERVATION_CONTRACT}) } : {}), signal: controller.signal }),
        new Promise<never>((_,reject) => { timer = setTimeout(() => { controller.abort(); reject(new ObservationError('NETWORK_UNCONFIRMED',0)); },5000); }),
      ]);
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new ObservationError(typeof body?.code === 'string' && Object.hasOwn(codes,body.code) ? body.code : 'REQUEST_FAILED',response.status);
      if (method === 'DELETE') {
        if (body?.contract !== OBSERVATION_CONTRACT || body.sessionId !== id || body.state !== 'STOPPED') throw new ObservationError('INVALID_RESPONSE',0);
        return null;
      }
      const session = sanitizeObservationSession(body);
      if (!session || id && session.sessionId !== id) throw new ObservationError('INVALID_RESPONSE',0);
      return session;
    } catch (error) {
      if (error instanceof ObservationError) throw error;
      if (signal?.aborted) throw new DOMException('Aborted','AbortError');
      throw new ObservationError('NETWORK_UNCONFIRMED',0);
    } finally { clearTimeout(timer); signal?.removeEventListener('abort',abort); }
  };
  return { open: (token: string,signal?:AbortSignal) => request('POST',token,undefined,signal) as Promise<ObservationSession>,
    read: (token:string,id:string,signal?:AbortSignal) => request('GET',token,id,signal) as Promise<ObservationSession>,
    stop: (token:string,id:string,signal?:AbortSignal) => request('DELETE',token,id,signal) };
}

export const observationApi = /* @__PURE__ */ createObservationApi({ enabled: import.meta.env.QA_NOTIFICATION_TRACE, apiBase: API_BASE_URL, fetch: (...args) => fetch(...args) });
