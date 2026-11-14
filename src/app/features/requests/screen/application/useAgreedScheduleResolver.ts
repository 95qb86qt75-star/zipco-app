import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BusinessRequest } from '../../domain/types';
import type { AgreedSchedule, AgreedScheduleResolver } from '../../domain/businessAgenda';
import { statusViewFor } from '../../domain/requestStatusGrouping';
import { fetchAgreementState } from '../../application/useAgreement';
import { readSharedAgreement } from '../../application/sharedAgreementRead';

const processKey = (order: BusinessRequest) => `${order.requestProcess?.id}:${order.requestProcess?.agreementPublicId}`;

/** Read-only agenda input, using the same verified agreement as each real card.
 * No original dates, proposal guesses, implicit ASAP, writes, or background polling.
 */
export default function useAgreedScheduleResolver(orders: BusinessRequest[], enabled: boolean): AgreedScheduleResolver {
  const token = localStorage.getItem('zipco-token');
  const [result, setResult] = useState<{ token: string | null; schedules: Record<string, AgreedSchedule> }>({ token: null, schedules: {} });
  const active = useMemo(() => orders.filter(order => order.recordState === 'available' &&
    statusViewFor('orders', order.status, order.requestProcess, order.requestProcessInvalid, true) === 'active'), [orders]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setResult(current => current.token === token ? current : { token, schedules: {} });
    const queue = [...active];
    async function worker() {
      while (queue.length && !controller.signal.aborted) {
        const order = queue.shift()!;
        const process = order.requestProcess;
        if (!process?.agreementPublicId) continue;
        await fetchAgreementState(process, token, controller.signal, state => {
          if (state.status !== 'loaded') return;
          const agreement = state.agreement;
          const schedule: AgreedSchedule = agreement.subjectSnapshot.needNow === true ? { kind: 'asap' }
            : agreement.scheduledFor ? { kind: 'scheduled', at: agreement.scheduledFor } : { kind: 'unverified' };
          setResult(current => ({ token, schedules: { ...(current.token === token ? current.schedules : {}), [processKey(order)]: schedule } }));
        }, readSharedAgreement);
      }
    }
    void Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
    return () => controller.abort();
  }, [enabled, active, token]);
  return useCallback<AgreedScheduleResolver>((order: BusinessRequest) => result.token === token
    ? result.schedules[processKey(order)] ?? { kind: 'unverified' } : { kind: 'unverified' }, [result, token]);
}
