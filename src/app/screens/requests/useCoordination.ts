import { useEffect, useRef, useState } from 'react';
import type { BusinessRequest, MyOrder } from './types';
import { createCoordinationIntents, uncertainCoordinationMessage } from './coordinationIntent';
import { contactAuthorized, coordinationAllowed, coordinationBody, refreshCoordinationOrder, sendCoordination, type CoordinationReason, type CoordinationAction } from './coordinationApi';
import { RequestProcessError } from './requestProcessErrors';
import { operationScope, readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
import { showAppToast } from '../Toast';
import { isPendingRequestCancelled, isPendingRequestRejected } from './requestProcess';
import { announceAction, dismissAction } from './ActionHologram';
import { coordinationFeedback } from './coordinationFeedback';
import { clearWhatsappReturn, markWhatsappOpened, whatsappReturnKey } from './whatsappReturn';

let shared: ReturnType<typeof createCoordinationIntents> | undefined;
const intents = () => shared ??= createCoordinationIntents(undefined, typeof sessionStorage === 'undefined' ? undefined : sessionStorage);

export default function useCoordination(order: BusinessRequest | MyOrder, business: boolean, refresh: () => void, feedback: boolean | 'coordination-steps' = false) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const lock = useRef(false);
  const recovery = useRef(false);
  const mounted = useRef(true);
  const controllers = useRef(new Set<AbortController>());
  const binding = useRef({ session: readCoordinationSession(), business, orderId: order.id, processId: order.requestProcess?.id });
  const context = useRef({ business, orderId: order.id, processId: order.requestProcess?.id });
  const lastRead = useRef<Awaited<ReturnType<typeof refreshCoordinationOrder>>>(null);
  const confirmedVersion = useRef(0);
  context.current = { business, orderId: order.id, processId: order.requestProcess?.id };
  const original = binding.current;
  const session = original.session;
  const scope = session ? operationScope(session, original.business) : '';
  const active = () => mounted.current && session !== null && readCoordinationSession() === session &&
    context.current.business === original.business && context.current.orderId === original.orderId && context.current.processId === original.processId;
  useEffect(() => {
    mounted.current = true;
    const abort = () => controllers.current.forEach((controller) => controller.abort());
    const unsubscribe = subscribeCoordinationSession(() => { if (!active()) abort(); });
    return () => { mounted.current = false; unsubscribe(); abort(); };
  }, []);
  const pending = () => {
    if (!active() || !original.processId) return null;
    try { return intents().read(scope, original.processId); } catch { return null; }
  };
  const storageWarning = () => active() && original.processId ? intents().warning(scope, original.processId) : '';
  const restored = () => active() && original.processId ? intents().needsReconciliation(scope, original.processId) : false;
  const announce = (text: string) => { if (active()) { setMessage(text); showAppToast(text, 'error'); } };
  const reconcile = async (signal: AbortSignal) => {
    const value = await refreshCoordinationOrder(original.orderId!, original.business, session!.token, session!.businessId, signal);
    if (active() && value?.requestProcess?.id === original.processId) lastRead.current = value;
    return value;
  };
  const update = async () => {
    if (!active() || lock.current) return;
    const controller = new AbortController(); controllers.current.add(controller); lock.current = true; setBusy(true);
    lastRead.current = null;
    try {
      const latest = await reconcile(controller.signal);
      if (!active()) return;
      if (!latest?.requestProcess || latest.requestProcess.id !== original.processId) throw new Error();
      const intent = pending();
      if (intent && (restored() || ['CANCEL_PENDING_REQUEST', 'REJECT_PENDING_REQUEST'].includes(intent.action))) {
        const current = latest.requestProcess;
        const applied = intent.action === 'AUTHORIZE_CONTACT' ? contactAuthorized(current, business)
          : intent.action === 'ACK_READY_NOTICE' ? current.readyNoticeAcknowledged === true
          : intent.action === 'CONFIRM_RECEIPT' ? current.state === 'COMPLETED'
          : intent.action === 'CANCEL_PENDING_REQUEST' ? isPendingRequestCancelled(current)
          : intent.action === 'REJECT_PENDING_REQUEST' ? isPendingRequestRejected(current)
          : intent.action === 'MARK_READY' ? current.state === 'READY'
          : intent.action === 'START_WORK' ? current.state === 'IN_PROGRESS'
            : intent.action === 'ANNUL_COORDINATION' ? current.state === 'COORDINATION_CANCELLED'
              : current.coordination?.[business ? 'businessContactAuthorized' : 'customerContactAuthorized'] === true;
        // A read can settle an obsolete intention or confirm its desired state. It does
        // not prove which operation caused that state, and never recovers a navigation URL.
        if (applied || current.version !== intent.body.expectedVersion || !coordinationAllowed(current, business, intent.action))
          intents().clear(scope, original.processId, true);
        else intents().allowReconciledRetry(scope, original.processId);
      }
      intents().retryCleanup(scope, original.processId);
      recovery.current = false; setNeedsUpdate(false); setMessage(storageWarning());
      if ((intent?.action === 'CANCEL_PENDING_REQUEST' && isPendingRequestCancelled(latest.requestProcess)) ||
          (intent?.action === 'REJECT_PENDING_REQUEST' && isPendingRequestRejected(latest.requestProcess)))
        window.dispatchEvent(new CustomEvent('zipco-process-receipt', { detail: {
          orderId: latest.id, orderStatus: latest.status, requestProcess: latest.requestProcess,
        } }));
      window.dispatchEvent(new CustomEvent('zipco-requests-refresh')); refresh();
    } catch { announce('No se pudo actualizar el estado del pedido. Intenta nuevamente; no se repetirá la operación confirmada.'); }
    finally { controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
  };
  const run = async (action: CoordinationAction, reason?: CoordinationReason, detail?: string, retry = false) => {
    if (!active() || lock.current || recovery.current || order.recordState !== 'available' || !order.requestProcess) return false;
    const process = order.requestProcess;
    if (!retry && !coordinationAllowed(process, business, action)) return false;
    if (retry && (!pending() || pending()?.action !== action ||
      (['START_WORK', 'MARK_READY', 'REJECT_PENDING_REQUEST'].includes(action) && !business) || (['ACK_READY_NOTICE', 'CONFIRM_RECEIPT', 'CANCEL_PENDING_REQUEST'].includes(action) && business))) return false;
    if (!retry && action === 'AUTHORIZE_CONTACT' && contactAuthorized(process, business)) return false;
    const controller = new AbortController(); controllers.current.add(controller);
    lock.current = true; setBusy(true); setMessage('');
    lastRead.current = null;
    try {
      // Only POST confirmation belongs to the intention. GET/navigation never change its outcome.
      const response = await intents().run(scope, process.id, action, coordinationBody(action, process.version, reason, detail),
        (intent) => sendCoordination(process.id, order.id, intent.action, intent.body, session!.token, intent.key, controller.signal, process.currentProposalId), retry, active);
      if (!response || !active()) return false;
      if(business&&['START_WORK','ANNUL_COORDINATION'].includes(action)){
        const key=whatsappReturnKey(order);if(key)clearWhatsappReturn(key);
      }
      confirmedVersion.current = Math.max(confirmedVersion.current, response.result.requestProcess.version);
      let latest: Awaited<ReturnType<typeof refreshCoordinationOrder>> = null;
      const emitReceipt = () => {
        const current = latest?.requestProcess;
        // Confirmation/consent replays may predate newer server state. Prefer
        // the authoritative read, including phone-revision consent changes.
        const detail = (action === 'AUTHORIZE_CONTACT' || action === 'ACK_READY_NOTICE' || action === 'CONFIRM_RECEIPT') && latest && current &&
          current.id === response.result.requestProcess.id && current.version >= response.result.requestProcess.version
          ? { orderId: order.id, orderStatus: latest.status, requestProcess: current } : response.result;
        window.dispatchEvent(new CustomEvent('zipco-process-receipt', { detail }));
      };
      try { latest = await reconcile(controller.signal); }
      catch {
        if (!active()) return false;
        recovery.current = true; setNeedsUpdate(true);
        announce(storageWarning() || 'La operación fue confirmada. No se pudo actualizar el pedido. Pulsa Actualizar estado; no se repetirá la operación.');
        emitReceipt(); return true;
      }
      if (!active()) return false;
      emitReceipt();
      window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));
      if (storageWarning()) announce(storageWarning());
      else if (action === 'OPEN_WHATSAPP') {
        if (response.navigation && latest?.requestProcess && latest.requestProcess.version >= response.result.requestProcess.version &&
          latest.requestProcess.id === process.id && coordinationAllowed(latest.requestProcess, business, 'OPEN_WHATSAPP')) {
          const returnKey = business && latest ? whatsappReturnKey(latest) : null;
          try { if (active()) { if (returnKey) markWhatsappOpened(returnKey); if (feedback) announceAction('redirecting'); window.location.assign(response.navigation.url); } }
          catch { if(returnKey)clearWhatsappReturn(returnKey); if (feedback) dismissAction(); announce('No se pudo iniciar la navegación a WhatsApp. Puedes volver a intentarlo.'); }
        } else setMessage('El contacto ya no está disponible para este pedido. Se actualizaron sus condiciones.');
      }
      if (feedback && active() && !storageWarning()) {
        const notice = coordinationFeedback(action, response.result, latest, business);
        if (notice && !(feedback === 'coordination-steps' && action === 'AUTHORIZE_CONTACT')) announceAction(notice.kind, { key: notice.key,
          ...(action === 'REJECT_PENDING_REQUEST' ? { title:'Solicitud rechazada', description:'La solicitud quedó en Historial. Puedes consultar el motivo del rechazo.' } : {}) });
      }
      if (active()) refresh(); return true;
    } catch (error) {
      if (!active()) return false;
      if (error instanceof RequestProcessError && error.status === 401)
        window.dispatchEvent(new Event('zipco-coordination-session-expired'));
      if (!active()) return false;
      if (error instanceof RequestProcessError && (error.refreshConditions || [403, 404].includes(error.status))) {
        try {
          const latest = await reconcile(controller.signal);
          if (!active()) return false;
          if (latest?.requestProcess?.id === process.id) intents().clear(scope, process.id);
        } catch { /* Keep the exact intention for reconciliation; cancellation does not undo the server. */ }
        if (active()) refresh();
      }
      if (active()) {
        const text = storageWarning() || (error instanceof RequestProcessError ? error.message : uncertainCoordinationMessage);
        if (['CANCEL_PENDING_REQUEST', 'REJECT_PENDING_REQUEST'].includes(action)) announce(text); else setMessage(text);
      }
      return false;
    } finally { controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
  };
  return { busy, message, needsUpdate, restored, storageWarning, update, pending, run,
    currentOrder: () => active() && (lastRead.current?.requestProcess?.version ?? -1) >= confirmedVersion.current ? lastRead.current : null, retry: () => {
    const intent = pending();
    return intent ? run(intent.action, intent.body.reasonCode, intent.body.reasonDetail, true) : Promise.resolve(false);
  } };
}
