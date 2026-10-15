import { isRecord } from './orderValueParsers';
import { canAcceptFixedOrder, type RequestProcessSummary } from './requestProcess';
import { acceptFixedOrder, type AcceptFixedOrderResult } from './requestProcessApi';
import { RequestProcessError, REFRESH_CONDITIONS_MESSAGE } from './requestProcessErrors';
import type { BusinessRequest } from './types';

type PendingIntent = { signature: string; key: string };
type IntentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type RefreshOrder = () => Promise<BusinessRequest | null>;
const signatureOf = (orderId: number, process: RequestProcessSummary) =>
  `${orderId}:${process.version}:${process.currentProposalId}`;
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readPending(value: string): PendingIntent {
  const saved: unknown = JSON.parse(value);
  // Old blocked records also require recovery from the server, never a replay.
  if (!isRecord(saved) || typeof saved.signature !== 'string' ||
    !/^[1-9]\d*:[1-9]\d*:[1-9]\d*$/.test(saved.signature) ||
    typeof saved.key !== 'string' || !uuidV4.test(saved.key) ||
    (saved.blocked !== undefined && saved.blocked !== false)) {
    throw new Error('Invalid pending intention');
  }
  return { signature: saved.signature, key: saved.key };
}

export function createFixedOrderAcceptance(
  uuid = () => crypto.randomUUID(),
  storage: IntentStorage | undefined = typeof sessionStorage === 'undefined' ? undefined : sessionStorage,
  scope = typeof localStorage === 'undefined' ? 'test' : localStorage.getItem('zipco-user-id') ?? 'anonymous',
) {
  const inFlight = new Set<number>();
  const pending = new Map<number, PendingIntent>();
  // Only memory: protects stale controls until React displays the confirmed process.
  const confirmed = new Map<number, AcceptFixedOrderResult>();
  const needsRefresh = new Set<number>();
  const storageKey = (id: number) => `zipco-fixed-accept:${scope}:${id}`;
  const clearPending = (id: number) => {
    pending.delete(id);
    storage?.removeItem(storageKey(id));
  };
  const finish = (id: number, result: AcceptFixedOrderResult) => {
    confirmed.set(id, result);
    needsRefresh.delete(id);
    // A storage failure cannot turn a server-confirmed acceptance into an uncertain one.
    try { clearPending(id); } catch { /* The in-memory confirmation still prevents another POST. */ }
    return result;
  };

  const recover = async (orderId: number, process: RequestProcessSummary, refresh?: RefreshOrder) => {
    needsRefresh.add(process.id);
    if (!refresh) throw new RequestProcessError(REFRESH_CONDITIONS_MESSAGE, 409, true);
    const latest = await refresh();
    if (!latest || latest.recordState !== 'available' || latest.id !== orderId || !latest.requestProcess) {
      throw new RequestProcessError('No se pudo verificar el pedido. Actualiza la pantalla antes de aceptar.', 409, true);
    }
    if (latest.status === 'accepted' && latest.requestProcess.id === process.id &&
      latest.requestProcess.state === 'COORDINATION_PENDING') {
      return finish(process.id, {
        orderId, orderStatus: 'accepted', requestProcess: latest.requestProcess,
      });
    }
    // No corrupt key is removed until an authoritative order has been obtained.
    clearPending(process.id);
    needsRefresh.delete(process.id);
    const unchanged = latest.requestProcess.id === process.id &&
      latest.requestProcess.state === 'AWAITING_BUSINESS_RESPONSE' &&
      signatureOf(orderId, latest.requestProcess) === signatureOf(orderId, process);
    throw new RequestProcessError(unchanged
      ? 'El pedido fue actualizado. Revisa sus condiciones y pulsa Aceptar pedido si deseas continuar.'
      : REFRESH_CONDITIONS_MESSAGE, 0);
  };

  return {
    acknowledge(process: RequestProcessSummary) {
      const result = confirmed.get(process.id);
      if (result && process.state === 'COORDINATION_PENDING' &&
        process.version >= result.requestProcess.version) confirmed.delete(process.id);
    },
    async accept(orderId: number, process: RequestProcessSummary, token: string, refresh?: RefreshOrder) {
      if (confirmed.has(process.id)) return confirmed.get(process.id)!;
      if (!canAcceptFixedOrder({ requestProcess: process }) || inFlight.has(process.id)) return null;
      inFlight.add(process.id);
      try {
        if (needsRefresh.has(process.id)) return await recover(orderId, process, refresh);
        let intent = pending.get(process.id);
        if (!intent && storage) {
          try {
            const saved = storage.getItem(storageKey(process.id));
            if (saved !== null) intent = readPending(saved);
          } catch {
            return await recover(orderId, process, refresh);
          }
        }
        const signature = signatureOf(orderId, process);
        if (!intent || intent.signature !== signature) intent = { signature, key: uuid() };
        pending.set(process.id, intent);
        try { storage?.setItem(storageKey(process.id), JSON.stringify(intent)); }
        catch { throw new RequestProcessError('No se pudo preparar la aceptación segura. Intenta nuevamente.', 0); }

        try {
          const result = await acceptFixedOrder(process, orderId, token, intent.key);
          return finish(process.id, result);
        } catch (error) {
          if (error instanceof RequestProcessError && error.refreshConditions) {
            needsRefresh.add(process.id);
            // Refresh, but never automatically repeat the acceptance after a conflict.
            if (refresh) {
              const latest = await refresh();
              if (latest?.recordState === 'available' && latest.id === orderId && latest.requestProcess) {
                if (latest.status === 'accepted' && latest.requestProcess.id === process.id &&
                  latest.requestProcess.state === 'COORDINATION_PENDING') {
                  return finish(process.id, {
                    orderId, orderStatus: 'accepted', requestProcess: latest.requestProcess,
                  });
                }
                clearPending(process.id);
                needsRefresh.delete(process.id);
              }
            }
          }
          throw error;
        }
      } finally { inFlight.delete(process.id); }
    },
  };
}
