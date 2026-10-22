import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, MessageCircle, RefreshCw, X } from 'lucide-react';
import type { BusinessRequest, MyOrder } from './types';
import { AlternativeDraftDialog } from './PendingAlternativeActions';
import { proposalDraftSource, type AlternativeReview } from './alternativeDraft';
import { NEGOTIATION_STATES, PROPOSAL_PATHS, proposalAllowed, type Proposal, type ProposalAction, type ProposalRead } from './proposalContract';
import { ProposalError, readProposals, sendProposalAction, uploadProposalPhoto, type ProposalBody, type ProposalReceipt } from './proposalApi';
import { refreshCoordinationOrder } from './coordinationApi';
import { proposalIntents } from './proposalIntent';
import { operationScope, readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
import OrderReferencePhoto from './OrderReferencePhoto';
import { isProposalRejected } from './requestProcess';
import { announceProposalSent } from './proposalSentFeedback';
import AcceptGlassButton from './AcceptGlassButton';
import ProposalChat, { proposalTitle, whenLong } from './ProposalChat';
import AcceptAuthorizeCard from './AcceptAuthorizeCard';
import { announceProposalAccepted } from './proposalAcceptance';

const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
const titles: Record<ProposalAction, string> = { PROPOSE_ALTERNATIVE: 'Proponer alternativa', COUNTER_PROPOSAL: 'Hacer mi única contrapropuesta',
  PROPOSE_FINAL: 'Proponer alternativa final', ACCEPT_PROPOSAL: 'Aceptar propuesta', REJECT_PROPOSAL: 'Rechazar propuesta',
  ACCEPT_COUNTER_PROPOSAL: 'Aceptar contrapropuesta', REJECT_COUNTER_PROPOSAL: 'Rechazar contrapropuesta' };
const labels = ['Solicitud original', 'Propuesta del negocio', 'Contrapropuesta del cliente', 'Propuesta final del negocio'];
const button = 'min-h-12 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800 disabled:opacity-50 dark:bg-violet-950/30 dark:text-violet-200';
const isAcceptAction = (action: ProposalAction) => action === 'ACCEPT_PROPOSAL' || action === 'ACCEPT_COUNTER_PROPOSAL';

export function ProposalSnapshotCard({ proposal }: { proposal: Proposal }) {
  const s = proposal.subjectSnapshot;
  return <section className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50/40 p-3 text-sm dark:bg-violet-950/20">
    <h4 className="font-black">{labels[proposal.sequence]}</h4>
    <p className="text-xs text-slate-500">{new Date(proposal.createdAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</p>
    <p className="font-bold">{s.orderType === 'service' ? 'Servicio' : 'Productos'}</p>
    {s.items.map((item, index) => <div key={index} className="border-t border-violet-100 pt-2">
      <p className="break-words font-bold">{item.quantity}x {item.nameSnapshot}</p>
      {item.descriptionSnapshot && <p className="whitespace-pre-wrap break-words">{item.descriptionSnapshot}</p>}
      <p>{item.source === 'CUSTOM' ? 'Precio total de esta línea' : `${money(item.unitPriceClpSnapshot!)} por unidad`} · {money(item.subtotalClp)}</p>
    </div>)}
    <p className="font-black">Total: {money(proposal.totalPriceClp)}</p>
    <p>Disponibilidad: {s.needNow ? 'Lo antes posible' : new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(proposal.scheduledFor!)) + ' (Chile)'}</p>
    {s.note && <p className="whitespace-pre-wrap break-words">Nota original: {s.note}</p>}
    {s.referencePhoto && <OrderReferencePhoto src={s.referencePhoto} />}
    {s.proposalMessage && <p className="whitespace-pre-wrap break-words"><strong>Explicación:</strong> {s.proposalMessage}</p>}
    {s.proposalPhoto && <div><p className="font-bold">Foto de esta propuesta</p><OrderReferencePhoto src={s.proposalPhoto} /></div>}
  </section>;
}

export function ProposalComparison({ read }: { read: ProposalRead }) {
  const original = read.proposals[0], latest = read.proposals[read.proposals.length - 1];
  return <div data-proposal-comparison className="space-y-3">
    <p className="text-sm">Compara la solicitud original con las condiciones propuestas. El contacto se autoriza después de aceptar.</p>
    {read.proposals.length > 1 && <div className="rounded-xl bg-violet-100 p-3 text-sm font-black text-violet-900">
      Total original {money(original.totalPriceClp)} → Propuesta vigente {money(latest.totalPriceClp)}
    </div>}
    <ProposalSnapshotCard proposal={original} />
    {read.proposals.length > 2 && <details className="rounded-xl border p-3"><summary className="min-h-11 font-bold">Propuestas anteriores</summary>
      <div className="space-y-3">{read.proposals.slice(1, -1).map(p => <ProposalSnapshotCard key={p.id} proposal={p} />)}</div>
    </details>}
    {latest !== original && <ProposalSnapshotCard proposal={latest} />}
  </div>;
}

export default function ProposalNegotiation({ order, business = false, refresh, variant = 'default' }: { order: BusinessRequest | MyOrder; business?: boolean; refresh: () => void; variant?: 'default' | 'aurora' }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<ProposalRead | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftAction, setDraftAction] = useState<ProposalAction | null>(null);
  const [decision, setDecision] = useState<ProposalAction | null>(null);
  const [expired, setExpired] = useState(false);
  const [authCard, setAuthCard] = useState(false);
  const authorizeChoice = useRef(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const session = useRef(readCoordinationSession()).current;
  const controllers = useRef(new Set<AbortController>());
  const uploaded = useRef(new WeakMap<File, string>());
  const process = order.requestProcess;
  const original = useRef({ processId: process?.id, orderId: order.id, business }).current;
  const context = useRef(original);
  context.current = { processId: process?.id, orderId: order.id, business };
  const active = () => mounted.current && session !== null && readCoordinationSession() === session &&
    context.current.processId === original.processId && context.current.orderId === original.orderId && context.current.business === original.business;
  useEffect(() => {
    mounted.current = true;
    const abort = () => controllers.current.forEach(c => c.abort());
    const unsub = subscribeCoordinationSession(() => { if (!active()) { abort(); setRead(null); setOpen(false); setDraftAction(null); setAuthCard(false); authorizeChoice.current = false; } });
    return () => { mounted.current = false; unsub(); abort(); };
  }, []);
  const load = async (startDraft = false) => {
    if (!process || !active() || lock.current) return;
    const controller = new AbortController(); controllers.current.add(controller); lock.current = true; setBusy(true); setError('');
    try { const value = await readProposals(process.id, session!.token, controller.signal); if (active()) { setRead(value); setDecision(null); setExpired(false);
      if (startDraft) {
        if (proposalAllowed(value.process, business, 'PROPOSE_ALTERNATIVE')) setDraftAction('PROPOSE_ALTERNATIVE');
        else { setError('El pedido cambió. Actualiza su estado antes de proponer una alternativa.'); refresh(); }
      }
    } }
    catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudieron cargar las propuestas.'); }
    finally { controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
  };
  useEffect(() => { if (open || draftAction) void load(); }, [process?.version]);
  useEffect(() => {
    if (draftAction && read && !proposalAllowed(read.process, business, draftAction)) {
      setDraftAction(null); setOpen(true); setError('El pedido cambió. Revisa las condiciones actuales antes de responder.');
    }
  }, [read, draftAction, business]);
  if (!process || order.recordState !== 'available') return null;
  const initial = proposalAllowed(process, business, 'PROPOSE_ALTERNATIVE');
  const relevant = initial || NEGOTIATION_STATES.includes(process.state) || isProposalRejected(process);
  if (!relevant && !open && !draftAction) return null;
  const exact = read && read.process.id === process.id && read.process.version >= process.version;
  const choices = exact ? (Object.keys(PROPOSAL_PATHS) as ProposalAction[]).filter(action => proposalAllowed(read.process, business, action)) : [];

  const execute = async (action: ProposalAction, review?: AlternativeReview, file: File | null = null, past = false, authorize = false) => {
    if (!active() || lock.current || !read || !choices.includes(action)) throw new ProposalError('Actualiza las condiciones antes de confirmar.', 0);
    const captured = read; const controller = new AbortController(); controllers.current.add(controller);
    lock.current = true; setBusy(true); setError('');
    const finish = (receipt: ProposalReceipt) => {
      if (!active()) return;
      if (isAcceptAction(action)) announceProposalAccepted({ order, receipt, business, authorize: !business && authorize, session: session! });
      window.dispatchEvent(new CustomEvent('zipco-process-receipt', { detail: receipt }));
      announceProposalSent(action, receipt);
      window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));
      setDecision(null); setAuthCard(false); setOpen(false); setDraftAction(null); refresh();
    };
    try {
      // A current authorized read is required even when the visible order list is stale.
      const latest = await readProposals(process.id, session!.token, controller.signal);
      if (!active()) throw new Error('La sesión cambió. No se enviará otra operación.');
      if (latest.process.version !== captured.process.version || latest.process.currentProposalId !== captured.process.currentProposalId || !proposalAllowed(latest.process, business, action)) {
        // A lost acceptance response is reconciled by authoritative reads. Never
        // post again or invent a receipt from the old local proposal snapshot.
        if (isAcceptAction(action) && latest.process.state === 'COORDINATION_PENDING' && latest.process.agreementPublicId &&
          latest.process.currentProposalId === captured.process.currentProposalId && latest.process.version >= captured.process.version + 2) {
          const current = await refreshCoordinationOrder(order.id!, business, session!.token, session!.businessId, controller.signal);
          if (!active()) return;
          const p = current?.requestProcess;
          if (current?.recordState === 'available' && current.status === 'accepted' && p?.id === process.id &&
            p.state === 'COORDINATION_PENDING' && p.currentProposalId === captured.process.currentProposalId &&
            p.agreementPublicId === latest.process.agreementPublicId && p.version >= latest.process.version) {
            finish({ orderId: current.id, orderStatus: current.status, requestProcess: p }); return;
          }
        }
        setRead(latest); setDraftAction(null); setOpen(true); refresh(); throw new ProposalError('El pedido cambió. Revisa su estado actualizado antes de responder.', 409, 'STALE_VERSION', true);
      }
      let photo: string | null = null;
      if (file) {
        photo = uploaded.current.get(file) ?? await uploadProposalPhoto(file, controller.signal);
        uploaded.current.set(file, photo);
      }
      if (!active()) throw new Error('La sesión cambió. No se enviará otra operación.');
      const body: ProposalBody = { ...(review ?? {}), expectedVersion: captured.process.version, proposalId: captured.process.currentProposalId,
        confirmationAccepted: true, ...(review ? { photo } : {}), ...(past ? { acceptPastSchedule: true } : {}) };
      const receipt = await proposalIntents().run(operationScope(session!, business), process.id, action, body,
        key => sendProposalAction(process.id, order.id!, action, body, session!.token, key, controller.signal));
      // POST is final. A failed subsequent read must never send it again.
      finish(receipt);
    } catch (e) {
      if (active() && e instanceof ProposalError && e.code === 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED') { setExpired(true); setAuthCard(false); setDecision(action); }
      if (active() && e instanceof ProposalError && e.status === 401) window.dispatchEvent(new Event('zipco-coordination-session-expired'));
      throw e;
    } finally { controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
  };
  return <div className="mt-3" onClick={event => event.stopPropagation()}>
    {(() => {
      const label = initial ? busy ? 'Cargando formulario…' : 'Proponer alternativa' : isProposalRejected(process) ? 'Ver propuestas e historial' : 'Revisar propuesta y responder';
      const openProposals = async () => { if (!initial) setOpen(true); await load(initial); };
      return variant === 'aurora'
        ? <span className="zipco-glass-wrap">
          <i className="zipco-glass-blob zipco-glass-b1" aria-hidden="true" /><i className="zipco-glass-blob zipco-glass-b2" aria-hidden="true" /><i className="zipco-glass-blob zipco-glass-b3" aria-hidden="true" />
          <button type="button" className="zipco-glass-btn" disabled={busy} aria-busy={busy} onClick={openProposals}>{label}<ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.3} aria-hidden="true" /></button>
        </span>
        : <button type="button" className={`${button} w-full`} disabled={busy} aria-busy={busy} onClick={openProposals}>{label}</button>;
    })()}
    {error && !open && !draftAction && <p role="alert" className={`mt-2 text-sm ${variant === 'aurora' ? 'text-rose-200' : 'text-red-700 dark:text-red-300'}`}>{error}</p>}
    {open && !draftAction && <Dialog.Root open onOpenChange={value => { if (!lock.current) { setOpen(value); setDecision(null); setExpired(false); setAuthCard(false); } }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40" />
        <Dialog.Content className="zipco-chat-panel zipco-action-dialog fixed bottom-4 left-1/2 z-[1001] flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col overflow-hidden rounded-[26px] p-0">
          <div className="absolute right-2 top-2 z-10 flex gap-1">
            <button type="button" disabled={busy} aria-label="Actualizar propuestas" title="Actualizar propuestas" onClick={() => void load()} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><RefreshCw className="h-[17px] w-[17px]" /></button>
            <Dialog.Close asChild><button type="button" disabled={busy} aria-label="Cerrar propuestas" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><X className="h-[17px] w-[17px]" /></button></Dialog.Close>
          </div>
          <div className="shrink-0 px-5 pb-1.5 pt-[18px] pr-[104px]">
            <Dialog.Title className="text-[22px] font-extrabold leading-tight">{initial ? 'Proponer alternativa' : 'Revisar propuesta'}</Dialog.Title>
            <Dialog.Description className="mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-300">Tu conversación con {business ? 'el cliente' : 'el negocio'}.</Dialog.Description>
          </div>
          <div className="zipco-chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {busy && <p role="status" className="text-sm text-slate-500">Cargando…</p>}
            {read && <ProposalChat read={read} business={business}
              turn={isProposalRejected(read.process) ? 'closed' : choices.length ? 'mine' : 'wait'}
              closedText={read.process.closure?.actor === 'CUSTOMER' ? 'El cliente rechazó la propuesta · Historial' : 'El negocio rechazó la contrapropuesta · Historial'}
              canCounter={!business && choices.includes('COUNTER_PROPOSAL')} />}
          </div>
          {error && <p role="alert" className="px-5 pt-2 text-sm text-red-700">{error}</p>}
          <div className="zipco-chat-foot shrink-0 space-y-2 px-4 pb-4 pt-1.5">
            {decision ? <>
              <p className="text-sm font-bold">{expired ? 'La fecha y hora propuestas ya pasaron. ¿Quieres aceptar igualmente?' : `${titles[decision]}: ¿confirmas esta propuesta exacta?`}</p>
              <p className="text-xs">{decision.startsWith('REJECT_') ? 'La solicitud finalizará y quedará en Historial.' : 'Las condiciones aceptadas pasarán a Por coordinar; falta autorizar el contacto.'}</p>
              <div className="grid grid-cols-2 gap-2"><button className="zipco-chat-ctr h-12" disabled={busy} onClick={() => { setDecision(null); setExpired(false); }}>Volver</button>
                {(() => {
                  const confirm = async () => { try { await execute(decision, undefined, null, expired, !business && decision === 'ACCEPT_PROPOSAL' && authorizeChoice.current); } catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudo confirmar. Reintenta la misma operación.'); } };
                  const blocked = busy || !choices.includes(decision);
                  return isAcceptAction(decision)
                    ? <AcceptGlassButton size="compact" flush label="Sí, confirmar" disabled={blocked} onClick={confirm} />
                    : <button className="zipco-chat-rej h-12" disabled={blocked} onClick={confirm}>Sí, confirmar</button>;
                })()}</div>
            </> : <>
              {(() => {
                const go = (action: ProposalAction) => {
                  if (['PROPOSE_ALTERNATIVE', 'COUNTER_PROPOSAL', 'PROPOSE_FINAL'].includes(action)) setDraftAction(action);
                  else if (action === 'ACCEPT_PROPOSAL' && !business) { setAuthCard(true); setExpired(false); authorizeChoice.current = false; }
                  else { setDecision(action); setExpired(false); }
                };
                const accepts = choices.filter(isAcceptAction);
                const others = choices.filter(action => !isAcceptAction(action));
                return <>
                  {accepts.map(action => <AcceptGlassButton key={action} flush label={titles[action]} disabled={busy} onClick={() => go(action)}
                    price={read?.proposals.length ? read.proposals[read.proposals.length - 1].totalPriceClp : null} />)}
                  {others.length > 0 && <div className="flex gap-2.5">
                    {others.map(action => {
                      const reject = action.startsWith('REJECT_');
                      return <button key={action} type="button" aria-label={titles[action]} disabled={busy} onClick={() => go(action)}
                        className={`${reject ? 'zipco-chat-rej' : 'zipco-chat-ctr'} min-h-11 min-w-0 ${reject ? 'flex-1' : 'flex-[1.35] flex-col'} px-2 py-2 text-[13px]`}>
                        <span className="flex min-w-0 items-center justify-center gap-1 text-center text-xs max-[360px]:text-[11px]">
                          {reject ? <X className="h-[13px] w-[13px] shrink-0" strokeWidth={2.6} aria-hidden="true" /> : <MessageCircle className="h-[13px] w-[13px] shrink-0" aria-hidden="true" />}
                          <span className="min-w-0 break-words">{action === 'COUNTER_PROPOSAL' ? 'Contraproponer' : reject ? 'Rechazar' : titles[action]}</span>
                        </span>
                        {action === 'COUNTER_PROPOSAL' && <span className="zipco-chat-once">1 vez</span>}
                      </button>;
                    })}
                  </div>}
                </>;
              })()}
            </>}
          </div>
          {read && <AcceptAuthorizeCard open={authCard} busy={busy} onClose={() => setAuthCard(false)}
            businessName={'businessName' in order ? order.businessName || 'el negocio' : 'el negocio'}
            title={proposalTitle(read.proposals[read.proposals.length - 1])} when={whenLong(read.proposals[read.proposals.length - 1])}
            total={money(read.proposals[read.proposals.length - 1].totalPriceClp)} error={error}
            onChoose={async authorize => {
              authorizeChoice.current = authorize;
              try { await execute('ACCEPT_PROPOSAL', undefined, null, false, authorize); }
              catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudo aceptar. Reintenta la misma operación.'); }
            }} />}
        </Dialog.Content></Dialog.Portal>
    </Dialog.Root>}
    {draftAction && read && <AlternativeDraftDialog key={`${read.process.version}-${draftAction}`} order={order}
      sourceOverride={proposalDraftSource(read)} title={titles[draftAction]}
      baselineLabel={draftAction === 'PROPOSE_ALTERNATIVE' ? 'Solicitud original' : 'Propuesta vigente'}
      close={() => setDraftAction(null)} onConfirm={choices.includes(draftAction) ? (review, file) => execute(draftAction, review, file) : undefined} />}
  </div>;
}
