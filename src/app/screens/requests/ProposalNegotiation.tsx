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
import { announceAction } from './ActionHologram';
import {availabilityFlow,BUSINESS_CONTACT_COPY,BUSINESS_CONTACT_VERSION,type FulfillmentChoice} from './availabilityContract';
import {CUSTOMER_CONTACT_TEXT_VERSION} from '../createOrderApi';
import {ConfirmAvailabilityDesign} from './availability-design/AvailabilityDesign';
import {fulfillmentFromChoice,fulfillmentFromPlan} from './availabilityChoice';
import AvailabilityPlanSummary from './AvailabilityPlanSummary';
import {reservationFlow,type ReservationChoice,type ReservationOffer} from './reservationContract';
import ReservationChoiceFields from './ReservationChoiceFields';
import ReservationOfferFields from './ReservationOfferFields';

const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
const titles: Record<ProposalAction, string> = { PROPOSE_ALTERNATIVE: 'Proponer alternativa', COUNTER_PROPOSAL: 'Hacer mi única contrapropuesta',
  PROPOSE_FINAL: 'Proponer alternativa final', ACCEPT_PROPOSAL: 'Aceptar propuesta', REJECT_PROPOSAL: 'Rechazar propuesta',
  ACCEPT_COUNTER_PROPOSAL: 'Aceptar contrapropuesta', REJECT_COUNTER_PROPOSAL: 'Rechazar contrapropuesta' };
const labels = ['Solicitud original', 'Propuesta del negocio', 'Contrapropuesta del cliente', 'Propuesta final del negocio'];
const button = 'min-h-12 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800 disabled:opacity-50 dark:bg-violet-950/30 dark:text-violet-200';
const isAcceptAction = (action: ProposalAction) => action === 'ACCEPT_PROPOSAL' || action === 'ACCEPT_COUNTER_PROPOSAL';

function ProposalDraftButton({ label, busy, onClick, once = false, ariaLabel = label }: { label: string; busy: boolean; onClick: () => void; once?: boolean; ariaLabel?: string }) {
  return <span className="zipco-glass-wrap min-w-0 flex-[1.35]">
    <i className="zipco-glass-blob zipco-glass-b1" aria-hidden="true" /><i className="zipco-glass-blob zipco-glass-b2" aria-hidden="true" /><i className="zipco-glass-blob zipco-glass-b3" aria-hidden="true" />
    <button type="button" aria-label={ariaLabel} className="zipco-glass-btn" disabled={busy} aria-busy={busy} onClick={onClick}>
      <span className="min-w-0 break-words">{label}{once && <span className="zipco-chat-once ml-1">1 vez</span>}</span>
      <ArrowRight className="h-[18px] w-[18px] shrink-0" strokeWidth={2.3} aria-hidden="true" />
    </button>
  </span>;
}

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
  const [fulfillmentOpen,setFulfillmentOpen]=useState(false);
  const [contactPreference,setContactPreference]=useState(true);
  const pendingFulfillment=useRef<{send:()=>Promise<void>;total:number;resolve:(value:boolean)=>void;reject:(error:unknown)=>void}|null>(null);
  const [reservationSelection,setReservationSelection]=useState<ReservationChoice['choice']>('NONE'),[reservationNote,setReservationNote]=useState('');
  const [finalOffer,setFinalOffer]=useState<ReservationOffer|null|undefined>(undefined);
  const chosenFulfillment=useRef<FulfillmentChoice|null>(null);
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
    const unsub = subscribeCoordinationSession(() => { if (!active()) { abort(); setRead(null); setOpen(false); setDraftAction(null); setAuthCard(false); setFulfillmentOpen(false);pendingFulfillment.current?.resolve(false);pendingFulfillment.current=null;authorizeChoice.current = false; } });
    return () => { mounted.current = false; unsub(); abort(); pendingFulfillment.current?.resolve(false);pendingFulfillment.current=null; };
  }, []);
  const load = async (startDraft = false) => {
    if (!process || !active() || lock.current) return;
    const controller = new AbortController(); controllers.current.add(controller); lock.current = true; setBusy(true); setError('');
    try { const value = await readProposals(process.id, session!.token, controller.signal); if (active()) { setRead(value); setDecision(null); setExpired(false);
      if (startDraft) {
        if (proposalAllowed(value.process, business, 'PROPOSE_ALTERNATIVE')) {
          chosenFulfillment.current=null;setDraftAction('PROPOSE_ALTERNATIVE');
        }
        else { setError('El pedido cambió. Actualiza su estado antes de proponer una alternativa.'); refresh(); }
      } else setOpen(true);
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
    const newFlow=availabilityFlow(captured.process),plan=captured.proposals.at(-1)?.availability??captured.process.availability;
    const v2=reservationFlow(captured.process),inheritedFulfillment=fulfillmentFromPlan(plan);
    if(v2&&action==='PROPOSE_FINAL'&&finalOffer===null)throw new ProposalError('Revisa los plazos y el monto de la oferta de reserva antes de enviar.',0);
    if(v2&&!business&&reservationSelection==='REQUEST_RESERVATION'&&plan?.reservationOffer?.mode==='PREPAYMENT'&&!contactPreference)throw new ProposalError('Para solicitar reserva con pago necesitas autorizar tu propio teléfono o elegir ir sin reserva.',0);
    const permitsContact=plan?.path==='WHATSAPP'||plan?.allowCustomerWhatsapp===true;
    const extra:Pick<ProposalBody,'fulfillment'|'customerContactPreference'|'businessContactConsent'>=newFlow?
      action==='PROPOSE_FINAL'?{fulfillment:inheritedFulfillment?.path==='LOCAL_PICKUP'&&v2&&finalOffer?{...inheritedFulfillment,reservationOffer:finalOffer}:inheritedFulfillment}
      :action==='PROPOSE_ALTERNATIVE'?{fulfillment:chosenFulfillment.current??undefined}
      :action==='COUNTER_PROPOSAL'||action==='ACCEPT_PROPOSAL'?{customerContactPreference:{allowed:permitsContact?contactPreference:false,textVersion:CUSTOMER_CONTACT_TEXT_VERSION}}
      :action==='ACCEPT_COUNTER_PROPOSAL'&&permitsContact?{businessContactConsent:{accepted:true,textVersion:BUSINESS_CONTACT_VERSION}}:{}:{};
    if(newFlow&&['PROPOSE_ALTERNATIVE','PROPOSE_FINAL'].includes(action)&&!extra.fulfillment)throw new ProposalError('Actualiza el camino de esta propuesta antes de enviarla.',0);
    const reservationExtra=v2&&!business&&plan?.path==='LOCAL_PICKUP'&&['COUNTER_PROPOSAL','ACCEPT_PROPOSAL'].includes(action)?{reservationChoice:{offerId:plan.availabilityConfirmationId,choice:reservationSelection,...(reservationSelection==='REQUEST_RESERVATION'?{note:reservationNote.trim()}:{})}}:{};
    lock.current = true; setBusy(true); setError('');
    const finish = (receipt: ProposalReceipt) => {
      if (!active()) return;
      if (isAcceptAction(action)) {
        if(newFlow){announceAction('accepted',{title:'Propuesta aceptada',description:receipt.requestProcess.availability?.path==='LOCAL_PICKUP'?'El pedido quedó en curso, pendiente de retiro en el local.':'Ya puedes revisar el contacto y coordinar el pedido.',key:`availability-proposal:${process.id}:${receipt.requestProcess.version}`});
          window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business,view:receipt.requestProcess.state==='IN_PROGRESS'?'active':'coordination'}}));
        }else announceProposalAccepted({ order, receipt, business, authorize, session: session!, proposal: captured.proposals[captured.proposals.length - 1] });
      }
      window.dispatchEvent(new CustomEvent('zipco-process-receipt', { detail: receipt }));
      announceProposalSent(action, receipt);
      if (action === 'COUNTER_PROPOSAL' && receipt.requestProcess.state === 'AWAITING_BUSINESS_COUNTER_RESPONSE')
        announceAction('counter', { key: `${receipt.orderId}:${receipt.requestProcess.version}:${action}` });
      if (['REJECT_PROPOSAL', 'REJECT_COUNTER_PROPOSAL'].includes(action) && isProposalRejected(receipt.requestProcess))
        announceAction('rejected', { key: `${receipt.orderId}:${receipt.requestProcess.version}:${action}` });
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
        if (isAcceptAction(action) && ['COORDINATION_PENDING',...(newFlow?['IN_PROGRESS']:[])].includes(latest.process.state) && latest.process.agreementPublicId &&
          latest.process.currentProposalId === captured.process.currentProposalId && latest.process.version >= captured.process.version + 2) {
          const current = await refreshCoordinationOrder(order.id!, business, session!.token, session!.businessId, controller.signal);
          if (!active()) return;
          const p = current?.requestProcess;
          if (current?.recordState === 'available' && current.status === 'accepted' && p?.id === process.id &&
            p.state === latest.process.state && p.currentProposalId === captured.process.currentProposalId &&
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
        confirmationAccepted: true, ...(review ? { photo } : {}), ...extra,...reservationExtra, ...(past ? { acceptPastSchedule: true } : {}) };
      const receipt = await proposalIntents().run(operationScope(session!, business), process.id, action, body,
        key => sendProposalAction(process.id, order.id!, action, body, session!.token, key, controller.signal,captured.process.flowContract,captured.process.availability?.availabilityConfirmationId));
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
      const label = busy && !open && !draftAction ? initial ? 'Cargando formulario…' : 'Cargando propuesta…' : initial ? 'Proponer alternativa' : isProposalRejected(process) ? 'Ver propuestas e historial' : 'Revisar propuesta y responder';
      const openProposals = async () => { await load(initial); };
      return variant === 'aurora'
        ? <ProposalDraftButton label={label} busy={busy} onClick={openProposals} />
        : <button type="button" className={`${button} w-full`} disabled={busy} aria-busy={busy} onClick={openProposals}>{label}</button>;
    })()}
    {error && !open && !draftAction && <p role="alert" className={`mt-2 text-sm ${variant === 'aurora' ? 'text-rose-200' : 'text-red-700 dark:text-red-300'}`}>{error}</p>}
    {open && !draftAction && <Dialog.Root open onOpenChange={value => { if (!lock.current) { setOpen(value); setDecision(null); setExpired(false); setAuthCard(false); } }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40" />
        <Dialog.Content aria-busy={busy} data-accept-overlay={authCard || undefined} className="zipco-chat-panel zipco-action-dialog fixed bottom-4 left-1/2 z-[1001] flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col overflow-hidden rounded-[26px] p-0">
          <div className="absolute right-2 top-2 z-10 flex gap-1">
            <button type="button" disabled={busy} aria-label="Actualizar propuestas" title="Actualizar propuestas" onClick={() => void load()} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><RefreshCw className="h-[17px] w-[17px]" /></button>
            <Dialog.Close asChild><button type="button" disabled={busy} aria-label="Cerrar propuestas" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><X className="h-[17px] w-[17px]" /></button></Dialog.Close>
          </div>
          <div className="shrink-0 px-5 pb-1.5 pt-[18px] pr-[104px]">
            <Dialog.Title className="text-[22px] font-extrabold leading-tight">{initial ? 'Proponer alternativa' : 'Revisar propuesta'}</Dialog.Title>
            <Dialog.Description className="mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-300">Tu conversación con {business ? 'el cliente' : 'el negocio'}.</Dialog.Description>
          </div>
          <div className="zipco-chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {read && <ProposalChat read={read} business={business}
              turn={isProposalRejected(read.process) ? 'closed' : choices.length ? 'mine' : 'wait'}
              closedText={read.process.closure?.actor === 'CUSTOMER' ? 'El cliente rechazó la propuesta · Historial' : 'El negocio rechazó la contrapropuesta · Historial'}
              canCounter={!business && choices.includes('COUNTER_PROPOSAL')} />}
            {read?.process.availability&&<AvailabilityPlanSummary plan={read.process.availability}/>}
          </div>
          {error && <p role="alert" className="px-5 pt-2 text-sm text-red-700">{error}</p>}
          <div className="zipco-chat-foot shrink-0 space-y-2 px-4 pb-4 pt-1.5">
            {decision ? <>
              <p className="text-sm font-bold">{expired ? 'La fecha y hora propuestas ya pasaron. ¿Quieres aceptar igualmente?' : `${titles[decision]}: ¿confirmas esta propuesta exacta?`}</p>
              <p className="text-xs">{decision.startsWith('REJECT_') ? 'La solicitud finalizará y quedará en Historial.' : availabilityFlow(read?.process) ? 'Aceptar crea el acuerdo de esta propuesta. No representa un pago realizado.' : 'Las condiciones aceptadas pasarán a Por coordinar; falta autorizar el contacto.'}</p>
              {availabilityFlow(read?.process)&&isAcceptAction(decision)&&<>
                {!business&&reservationFlow(read?.process)&&read?.process.availability?.reservationOffer&&<ReservationChoiceFields offer={read.process.availability.reservationOffer} value={reservationSelection} note={reservationNote} onChange={setReservationSelection} onNote={setReservationNote} disabled={busy}/>}
                {business&&read?.process.availability?.allowCustomerWhatsapp&&<p className="text-xs">{BUSINESS_CONTACT_COPY}</p>}
                {!business&&read?.process.availability?.allowCustomerWhatsapp&&<label className="flex gap-2 text-xs"><input type="checkbox" checked={contactPreference} disabled={busy} onChange={e=>setContactPreference(e.target.checked)}/><span>Permitir que este negocio me escriba por WhatsApp<br/>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</span></label>}
              </>}
              <div className="grid grid-cols-2 gap-2"><button className="zipco-chat-ctr h-12" disabled={busy} onClick={() => { setDecision(null); setExpired(false); }}>Volver</button>
                {(() => {
                  const confirm = async () => { try { await execute(decision, undefined, null, expired, isAcceptAction(decision) && authorizeChoice.current); } catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudo confirmar. Reintenta la misma operación.'); } };
                  const blocked = busy || !choices.includes(decision);
                  return isAcceptAction(decision)
                    ? <AcceptGlassButton size="compact" flush label="Sí, confirmar" disabled={blocked} onClick={confirm} />
                    : <button className="zipco-chat-rej h-12" disabled={blocked} onClick={confirm}>Sí, confirmar</button>;
                })()}</div>
            </> : <>
              {(() => {
                const go = (action: ProposalAction) => {
                  if (['PROPOSE_ALTERNATIVE', 'COUNTER_PROPOSAL', 'PROPOSE_FINAL'].includes(action)) {
                    chosenFulfillment.current=null;setFinalOffer(undefined);setDraftAction(action);
                  }
                  else if (isAcceptAction(action)) { if(availabilityFlow(read?.process))setDecision(action);else setAuthCard(true);setExpired(false);authorizeChoice.current = false; }
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
                      if (!reject) return <ProposalDraftButton key={action} label={action === 'COUNTER_PROPOSAL' ? 'Contraponer' : titles[action]}
                        ariaLabel={titles[action]} once={action === 'COUNTER_PROPOSAL'} busy={busy} onClick={() => go(action)} />;
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
            business={business} counterpartName={business
              ? 'customerName' in order ? order.customerName || 'el cliente' : 'el cliente'
              : 'businessName' in order ? order.businessName || 'el negocio' : 'el negocio'}
            title={proposalTitle(read.proposals[read.proposals.length - 1])} when={whenLong(read.proposals[read.proposals.length - 1])}
            total={money(read.proposals[read.proposals.length - 1].totalPriceClp)} error={error}
            onChoose={async authorize => {
              authorizeChoice.current = authorize;
              try { await execute(business ? 'ACCEPT_COUNTER_PROPOSAL' : 'ACCEPT_PROPOSAL', undefined, null, false, authorize); }
              catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudo aceptar. Reintenta la misma operación.'); }
            }} />}
        </Dialog.Content></Dialog.Portal>
    </Dialog.Root>}
    {draftAction && read && <AlternativeDraftDialog key={`${read.process.version}-${draftAction}`} order={order}
      sourceOverride={proposalDraftSource(read)} title={draftAction==='COUNTER_PROPOSAL'?'Contraponer · 1 vez':titles[draftAction]}
      baselineLabel={draftAction === 'PROPOSE_ALTERNATIVE' ? 'Solicitud original' : 'Propuesta vigente'}
      close={() => setDraftAction(null)} onConfirm={choices.includes(draftAction) ? (review, file) => {
        if(availabilityFlow(read.process)&&business&&draftAction==='PROPOSE_ALTERNATIVE'&&!chosenFulfillment.current)return new Promise<boolean>((resolve,reject)=>{
          pendingFulfillment.current={send:()=>execute(draftAction,review,file),total:review.totalPriceClp,resolve,reject};setFulfillmentOpen(true);
        });
        return execute(draftAction,review,file);
      } : undefined}
      reviewFields={review=><>
        {availabilityFlow(read.process)&&business&&draftAction==='PROPOSE_FINAL'&&<div className="my-3 rounded-xl border p-3 text-xs">
          {read.process.availability?<><p className="mb-2 font-bold">Se conserva la opción de la propuesta anterior</p><AvailabilityPlanSummary plan={read.process.availability}/>{reservationFlow(read.process)&&read.process.availability.reservationOffer&&<ReservationOfferFields initial={read.process.availability.reservationOffer} total={review.totalPriceClp} onChange={setFinalOffer} disabled={busy} lockMode/>}{read.process.availability.allowCustomerWhatsapp&&<p className="mt-2">{BUSINESS_CONTACT_COPY}</p>}</>:<p role="alert">No se pudo recuperar el camino de la propuesta. Actualiza sus condiciones antes de enviar.</p>}
        </div>}
        {!business&&reservationFlow(read.process)&&read.process.availability?.reservationOffer&&<ReservationChoiceFields offer={read.process.availability.reservationOffer} value={reservationSelection} note={reservationNote} onChange={setReservationSelection} onNote={setReservationNote} disabled={busy}/>}
        {availabilityFlow(read.process)&&!business&&(read.process.availability?.allowCustomerWhatsapp?<label className="my-3 flex gap-2 text-xs"><input type="checkbox" checked={contactPreference} disabled={busy} onChange={e=>setContactPreference(e.target.checked)}/><span>Permitir que este negocio me escriba por WhatsApp<br/>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</span></label>:<p className="my-3 text-xs">Esta propuesta es para retiro en el local sin compartir teléfonos.</p>)}
      </>} />}
    <ConfirmAvailabilityDesign open={fulfillmentOpen} onOpenChange={value=>{
      if(!value&&!busy){setFulfillmentOpen(false);const pending=pendingFulfillment.current;pendingFulfillment.current=null;pending?.resolve(false);}
    }} purpose="proposal" busy={busy} reservationContract={reservationFlow(read?.process??process)} reservationTotal={pendingFulfillment.current?.total??order.total??0} onChoose={async choice=>{
      const pending=pendingFulfillment.current;if(!pending||lock.current)return;
      chosenFulfillment.current=fulfillmentFromChoice(choice);
      try{await pending.send();setFulfillmentOpen(false);pending.resolve(true);}
      catch(error){setFulfillmentOpen(false);if(active())setError(error instanceof Error?error.message:'No se pudo confirmar el envío.');pending.reject(error);}
      finally{pendingFulfillment.current=null;}
    }}/>
  </div>;
}
