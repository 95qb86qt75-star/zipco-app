import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { acceptedProposal, PROPOSAL_ACCEPTED_EVENT, type AcceptedProposal } from './proposalAcceptance';
import { announceDealClosed } from './DealSuccess';
import { announceAction } from './ActionHologram';
import { contactAuthorized, coordinationAllowed, refreshCoordinationOrder } from './coordinationApi';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
import useCoordination from './useCoordination';
import type { BusinessRequest, MyOrder } from './types';
import { RequestProcessError } from './requestProcessErrors';
import AcceptAuthorizeCard from './AcceptAuthorizeCard';
import { proposalTitle, whenLong } from './ProposalChat';

function announceAcceptanceComplete(business: boolean, key: string) {
  if (business) announceDealClosed(key);
  else announceAction('accepted', { key });
}

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
      if (value.authorize) setFlow(value);
      else announceAcceptanceComplete(value.business, key);
    };
    const reset = () => setFlow(current => current && current.session !== readCoordinationSession() ? null : current);
    window.addEventListener(PROPOSAL_ACCEPTED_EVENT, receive);
    const unsubscribe = subscribeCoordinationSession(reset);
    return () => { window.removeEventListener(PROPOSAL_ACCEPTED_EVENT, receive); unsubscribe(); };
  }, []);
  if (!flow || flow.session !== readCoordinationSession()) return null;
  return <AcceptedContactFollowUp key={`${flow.session.revision}:${flow.business}:${flow.receipt.requestProcess.id}:${flow.receipt.requestProcess.version}`}
    flow={flow} close={() => setFlow(null)} refresh={() => callbacks.current.refresh()} complete={() => {
      announceAcceptanceComplete(flow.business, `${flow.session.revision}:${flow.business}:${flow.receipt.requestProcess.id}:${flow.receipt.requestProcess.version}`);
      setFlow(null);
    }} />;
}

function AcceptedContactFollowUp({ flow, close, complete, refresh }: { flow: AcceptedProposal; close: () => void; complete: () => void; refresh: () => void }) {
  const [order, setOrder] = useState<BusinessRequest | MyOrder | null>(null);
  const [autoStart, setAutoStart] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const active = (request: AbortController) => readCoordinationSession() === flow.session &&
    controller.current === request && !request.signal.aborted;
  const load = async (automatic = true) => {
    controller.current?.abort();
    setOrder(null); setAutoStart(automatic);
    const request = new AbortController(); controller.current = request; setLoading(true); setError('');
    try {
      const current = await refreshCoordinationOrder(flow.receipt.orderId, flow.business, flow.session.token, flow.session.businessId, request.signal);
      if (!active(request)) return;
      const process = current?.requestProcess;
      if (!current || current.recordState !== 'available' || !process || process.id !== flow.receipt.requestProcess.id ||
        process.version < flow.receipt.requestProcess.version || process.agreementPublicId !== flow.receipt.requestProcess.agreementPublicId)
        throw new Error('No se pudieron verificar los permisos actuales del pedido.');
      if (contactAuthorized(process, flow.business)) { complete(); return; }
      if (!coordinationAllowed(process, flow.business, 'AUTHORIZE_CONTACT'))
        throw new Error('El estado del pedido cambió o no permite autorizar contacto. Revísalo en Coordinación.');
      setOrder(current);
    } catch (e) {
      if (active(request) && e instanceof RequestProcessError && e.status === 401)
        window.dispatchEvent(new Event('zipco-coordination-session-expired'));
      if (active(request)) setError(e instanceof Error ? e.message : 'No se pudo verificar el pedido.');
    } finally { if (active(request)) setLoading(false); }
  };
  useEffect(() => { void load(); return () => controller.current?.abort(); }, []);
  return <AcceptAuthorizeCard open busy business={flow.business} onClose={() => undefined} onChoose={() => undefined}
    counterpartName={flow.business ? ('customerName' in flow.order ? flow.order.customerName || 'el cliente' : 'el cliente')
      : ('businessName' in flow.order ? flow.order.businessName || 'el negocio' : 'el negocio')}
    title={flow.proposal ? proposalTitle(flow.proposal) : ''} when={flow.proposal ? whenLong(flow.proposal) : ''}
    total={flow.proposal ? `$${flow.proposal.totalPriceClp.toLocaleString('es-CL')}` : ''}
    followUp={<div className="mt-3 space-y-3">{order ? <AuthorizeAcceptedContact order={order} business={flow.business} autoStart={autoStart}
            close={close} complete={complete} refresh={refresh} reload={() => void load(false)} /> : <>
            {loading && <p role="status" className="text-center text-sm">Finalizando autorización…</p>}
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            {!loading && <button type="button" className="zipco-d-wabtn" onClick={() => void load()}>Actualizar pedido</button>}
            {!loading && <button type="button" className="zipco-d-wasoft" onClick={close}>Continuar en Coordinación</button>}
          </>}
        </div>} />;
}

function AuthorizeAcceptedContact({ order, business, autoStart, close, complete, refresh, reload }: {
  order: BusinessRequest | MyOrder; business: boolean; autoStart: boolean;
  close: () => void; complete: () => void; refresh: () => void; reload: () => void;
}) {
  // Same shared durable intention store and endpoint as CoordinationActions; no second consent queue.
  const operation = useCoordination(order, business, refresh);
  const started = useRef(false);
  const mounted = useRef(true);
  const [settled, setSettled] = useState(false);
  const attempt = async (retry = false) => {
    const success = retry ? await operation.retry() : await operation.run('AUTHORIZE_CONTACT');
    if (!mounted.current) return;
    setSettled(true);
    if (success && !operation.storageWarning() && contactAuthorized(operation.currentOrder()?.requestProcess, business)) complete();
  };
  useEffect(() => {
    mounted.current = true;
    if (!started.current) {
      started.current = true;
      if (!autoStart || operation.pending() || operation.restored() || operation.storageWarning()) setSettled(true);
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
      {recovery ? <button type="button" className="zipco-d-wabtn" disabled={operation.busy} onClick={async () => {
        await operation.update();
        if (mounted.current && contactAuthorized(operation.currentOrder()?.requestProcess, business)) complete();
      }}>Actualizar estado</button>
        : operation.pending()?.action === 'AUTHORIZE_CONTACT' ? <button type="button" className="zipco-d-wabtn" disabled={operation.busy} onClick={() => void attempt(true)}>Reintentar autorización pendiente</button>
          : !autoStart && coordinationAllowed(order.requestProcess, business, 'AUTHORIZE_CONTACT') ? <button type="button" className="zipco-d-wabtn" disabled={operation.busy} onClick={() => void attempt()}>Autorizar contacto</button> : null}
      {!recovery && !operation.pending() && <button type="button" className="zipco-d-wasoft" disabled={operation.busy} onClick={reload}>Revisar autorización</button>}
      <button type="button" className="zipco-d-wasoft" disabled={operation.busy} onClick={close}>Continuar en Coordinación</button>
    </>}
  </div>;
}
