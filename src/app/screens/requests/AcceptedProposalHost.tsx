import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { acceptedProposal, PROPOSAL_ACCEPTED_EVENT, type AcceptedProposal } from './proposalAcceptance';
import { announceDealClosed } from './DealSuccess';
import { coordinationAllowed, refreshCoordinationOrder } from './coordinationApi';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
import useCoordination from './useCoordination';
import type { MyOrder } from './types';
import { RequestProcessError } from './requestProcessErrors';

/** Mounted at screen level so filtering the accepted card never cancels consent. */
export default function AcceptedProposalHost({ onAccepted, refresh }: {
  onAccepted: (business: boolean) => void; refresh: () => void;
}) {
  const [flow, setFlow] = useState<AcceptedProposal | null>(null);
  const callbacks = useRef({ onAccepted, refresh });
  callbacks.current = { onAccepted, refresh };
  useEffect(() => {
    const seen = new Set<string>();
    const receive = (event: Event) => {
      const value = acceptedProposal((event as CustomEvent).detail);
      if (!value) return;
      const key = `${value.session.revision}:${value.business}:${value.receipt.requestProcess.id}:${value.receipt.requestProcess.version}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (seen.size > 100) seen.delete(seen.values().next().value!);
      callbacks.current.onAccepted(value.business);
      // Choice to accept is already committed; contact is a separate, permission-checked operation.
      if (!value.business && value.authorize) setFlow(value);
      announceDealClosed(key);
    };
    const reset = () => setFlow(current => current && current.session !== readCoordinationSession() ? null : current);
    window.addEventListener(PROPOSAL_ACCEPTED_EVENT, receive);
    const unsubscribe = subscribeCoordinationSession(reset);
    return () => { window.removeEventListener(PROPOSAL_ACCEPTED_EVENT, receive); unsubscribe(); };
  }, []);
  if (!flow || flow.session !== readCoordinationSession()) return null;
  return <AcceptedContactFollowUp key={`${flow.session.revision}:${flow.receipt.requestProcess.id}:${flow.receipt.requestProcess.version}`}
    flow={flow} close={() => setFlow(null)} refresh={() => callbacks.current.refresh()} />;
}

function AcceptedContactFollowUp({ flow, close, refresh }: { flow: AcceptedProposal; close: () => void; refresh: () => void }) {
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const active = (request: AbortController) => readCoordinationSession() === flow.session &&
    controller.current === request && !request.signal.aborted;
  const load = async () => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request; setLoading(true); setError('');
    try {
      const current = await refreshCoordinationOrder(flow.receipt.orderId, false, flow.session.token, flow.session.businessId, request.signal);
      if (!active(request)) return;
      const process = current?.requestProcess;
      if (!current || current.recordState !== 'available' || !process || process.id !== flow.receipt.requestProcess.id ||
        process.version < flow.receipt.requestProcess.version || process.agreementPublicId !== flow.receipt.requestProcess.agreementPublicId)
        throw new Error('No se pudieron verificar los permisos actuales del pedido.');
      if (process.coordination?.customerContactAuthorized === true) { close(); return; }
      if (!coordinationAllowed(process, false, 'AUTHORIZE_CONTACT'))
        throw new Error('El estado del pedido cambió o no permite autorizar contacto. Revísalo en Coordinación.');
      setOrder(current as MyOrder);
    } catch (e) {
      if (active(request) && e instanceof RequestProcessError && e.status === 401)
        window.dispatchEvent(new Event('zipco-coordination-session-expired'));
      if (active(request)) setError(e instanceof Error ? e.message : 'No se pudo verificar el pedido.');
    } finally { if (active(request)) setLoading(false); }
  };
  useEffect(() => { void load(); return () => controller.current?.abort(); }, []);
  return <Dialog.Root open onOpenChange={() => undefined}>
    <Dialog.Portal><Dialog.Overlay className="zipco-sheet-ov" />
      <Dialog.Content className="zipco-sheet holo" aria-describedby="zipco-contact-followup-description"
        onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
        <div className="zipco-d-holo-in space-y-3">
          <Dialog.Title className="zipco-d-auth-ttl">Tu propuesta quedó aceptada</Dialog.Title>
          <Dialog.Description id="zipco-contact-followup-description" className="zipco-d-auth-sub">El pedido está en Coordinación. La autorización de contacto se confirma por separado.</Dialog.Description>
          {order ? <AuthorizeAcceptedContact order={order} close={close} refresh={refresh} /> : <>
            {loading && <p role="status" className="text-center text-sm">Verificando autorización de contacto…</p>}
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            {!loading && <button type="button" className="zipco-d-wabtn" onClick={() => void load()}>Actualizar pedido</button>}
            <button type="button" className="zipco-d-wasoft" disabled={loading} onClick={close}>Continuar en Coordinación</button>
          </>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function AuthorizeAcceptedContact({ order, close, refresh }: { order: MyOrder; close: () => void; refresh: () => void }) {
  // Same shared durable intention store and endpoint as CoordinationActions; no second consent queue.
  const operation = useCoordination(order, false, refresh);
  const started = useRef(false);
  const mounted = useRef(true);
  const [settled, setSettled] = useState(false);
  const attempt = async (retry = false) => {
    const success = retry ? await operation.retry() : await operation.run('AUTHORIZE_CONTACT');
    if (!mounted.current) return;
    setSettled(true);
    if (success && !operation.storageWarning()) close();
  };
  useEffect(() => {
    mounted.current = true;
    if (!started.current) {
      started.current = true;
      if (operation.pending() || operation.restored() || operation.storageWarning()) setSettled(true);
      else void attempt();
    }
    return () => { mounted.current = false; };
  }, []);
  const recovery = operation.needsUpdate || operation.restored() || operation.storageWarning();
  return <div className="space-y-3">
    {!settled && <p role="status" className="text-center text-sm">Autorizando contacto para este pedido…</p>}
    {(operation.message || operation.storageWarning()) && <p role="alert" className="text-sm text-rose-700">{operation.storageWarning() || operation.message}</p>}
    {settled && <>
      <p className="text-sm">La aceptación está confirmada. Si el contacto no quedó autorizado, puedes continuarlo desde este pedido en Coordinación.</p>
      {recovery ? <button type="button" className="zipco-d-wabtn" disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
        : operation.pending()?.action === 'AUTHORIZE_CONTACT' ? <button type="button" className="zipco-d-wabtn" disabled={operation.busy} onClick={() => void attempt(true)}>Reintentar autorización pendiente</button> : null}
      <button type="button" className="zipco-d-wasoft" disabled={operation.busy} onClick={close}>Continuar en Coordinación</button>
    </>}
  </div>;
}
