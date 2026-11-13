import * as React from 'react';
import { announceDealClosed } from "../../shared/feedback/DealSuccess";
import BusinessResponseHoursNotice from "../../shared/hours/BusinessResponseHoursNotice";
import { chileSchedule } from "../../api/serviceHoursAdvisory";
import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, Calendar, CalendarCheck, Clock, Info, MessageCircle, Phone, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { BusinessRequest, MyOrder } from "../../domain/types";
import { AlternativeDraftDialog } from "./PendingAlternativeActions";
import { proposalDraftSource, type AlternativeReview } from "../../domain/alternativeDraft";
import { NEGOTIATION_STATES, PROPOSAL_PATHS, proposalAllowed, type Proposal, type ProposalAction, type ProposalRead } from "../../domain/proposalContract";
import { ProposalError, readProposals, sendProposalAction, uploadProposalPhoto, type ProposalBody, type ProposalReceipt } from "../../api/proposalApi";
import { refreshCoordinationOrder } from "../../api/coordinationApi";
import { proposalIntents } from "../../application/intents/proposalIntent";
import { operationScope, readCoordinationSession, subscribeCoordinationSession } from "../../application/intents/coordinationSession";
import OrderReferencePhoto from "../../shared/photos/OrderReferencePhoto";
import { isProposalRejected } from "../../domain/requestProcess";
import { announceProposalSent } from "../../shared/feedback/proposalSentFeedback";
import AcceptGlassButton from "../../cards/shared/coordination/AcceptGlassButton";
import ProposalChat, { proposalTitle, whenLong } from "../../cards/shared/proposal/ProposalChat";
import AcceptAuthorizeCard from "../../cards/shared/coordination/AcceptAuthorizeCard";
import { announceProposalAccepted } from "../../application/proposalAcceptance";
import { beginStatusChange, completeStatusChange, failStatusChange, type StatusOrder } from "../../shared/feedback/statusChangePresentation";
import { announceAction } from "../../shared/feedback/ActionHologram";
import { availabilityFlow, BUSINESS_CONTACT_COPY, BUSINESS_CONTACT_VERSION, type FulfillmentChoice } from "../../domain/availabilityContract";
import { CUSTOMER_CONTACT_TEXT_VERSION } from "../../../checkout/api/createOrderApi";
import { ConfirmAvailabilityDesign } from "../../shared/availability-design/AvailabilityDesign";
import { fulfillmentFromChoice, fulfillmentFromPlan } from "../../domain/availabilityChoice";
import AvailabilityPlanSummary from "../../cards/shared/availability/AvailabilityPlanSummary";
import { reservationFlow, type ReservationChoice, type ReservationOfferInput } from "../../domain/reservationContract";
import { simplifiedReservationFlow, isSimpleOffer } from "../../domain/simplifiedReservationContract";
import SimpleReservationOfferFields from "../../shared/reservations/SimpleReservationOfferFields";
import { readReservationOptions, ReservationOptionsError } from "../../api/reservationOptions";
import { canRequestProposalSchedule, needsReservationRenewal, scheduleRequestReview, sameScheduleFinalReview, type ExpiredProposalEvidence, type RequestedSchedule } from '../../domain/expiredProposalSchedule';
import ExpiredProposalSchedule, { requestedScheduleLabel } from './ExpiredProposalSchedule';
import { readProposalScheduleDraft, saveProposalScheduleDraft } from '../../application/proposalScheduleDraft';
import { startReservationPayment } from "../../application/startReservationPayment";
import ReservationChoiceFields from "../../shared/reservations/ReservationChoiceFields";
import ReservationOfferFields from "../../shared/reservations/ReservationOfferFields";
import { RequestProcessError } from "../../domain/requestProcessErrors";
import ProductPreviewControl from "../../shared/product-preview/ProductPreviewControl";

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
    {s.orderType==='product'&&<ProductPreviewControl preview={proposal.productPreview??null} caption={proposal.sequence===0?'PRODUCTO SOLICITADO':'PRODUCTO DE ESTA PROPUESTA'}/>}
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

export default function ProposalNegotiation({ order, business = false, refresh, variant = 'default', initialLabel = 'Proponer alternativa', reviewLabel, customerEntryActions = false }: { order: BusinessRequest | MyOrder; business?: boolean; refresh: () => void; variant?: 'default' | 'aurora'; initialLabel?:string; reviewLabel?:string; customerEntryActions?:boolean }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<ProposalRead | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftAction, setDraftAction] = useState<ProposalAction | null>(null);
  const [decision, setDecision] = useState<ProposalAction | null>(null);
  const [expired, setExpired] = useState(false);
  const [scheduleExpired, setScheduleExpired] = useState<ExpiredProposalEvidence | null>(null);
  const [scheduleReview, setScheduleReview] = useState<AlternativeReview | null>(null);
  const [scheduleFeedback, setScheduleFeedback] = useState('');
  const [choosing, setChoosing] = useState(false); // pantalla «Elegir nuevo horario» abierta (solo cliente)
  const acceptOrigin = useRef<'card' | 'chat'>('chat'); // desde dónde se abrió «Aceptar propuesta»: decide a dónde lleva «Volver»
  const lastSchedule = useRef<RequestedSchedule | null>(null); // horario elegido, para conservarlo al pulsar «Cambiar horario»
  const [authCard, setAuthCard] = useState(false);
  const [fulfillmentOpen,setFulfillmentOpen]=useState(false);
  const [contactPreference,setContactPreference]=useState(true);
  const pendingFulfillment=useRef<{send:()=>Promise<void>;total:number;schedule?:{date:string;time:string};resolve:(value:boolean)=>void;reject:(error:unknown)=>void}|null>(null);
  const [reservationSelection,setReservationSelection]=useState<ReservationChoice['choice']>('NONE'),[reservationNote,setReservationNote]=useState('');
  const [finalOffer,setFinalOffer]=useState<ReservationOfferInput|null|undefined>(undefined);
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
  const load = async (startDraft = false, acceptProposal = false, keepDecision = false): Promise<boolean> => {
    if (!process || !active() || lock.current) return false;
    const controller = new AbortController(); controllers.current.add(controller); lock.current = true; setBusy(true); setError('');
    try { const value = await readProposals(process.id, session!.token, controller.signal); if (active()) { setRead(value);
      if (keepDecision && read && (value.process.version !== read.process.version || value.process.currentProposalId !== read.process.currentProposalId)) {
        setDecision(null); setScheduleReview(null); setChoosing(false); lastSchedule.current = null; setExpired(false);
        setError('La propuesta cambió. Conservamos tu nota; revisa las condiciones actuales antes de responder.'); refresh(); return false;
      }
      if (!keepDecision) { setDecision(null); setExpired(false); setScheduleReview(null); setChoosing(false); lastSchedule.current = null; }
      const saved = !business && !keepDecision && readProposalScheduleDraft(session!.userId, value);
      if (saved) { setReservationNote(saved.note); setContactPreference(saved.contact); setReservationSelection(saved.choice); }
      if (startDraft) {
        if (proposalAllowed(value.process, business, 'PROPOSE_ALTERNATIVE')) {
          chosenFulfillment.current=null;setDraftAction('PROPOSE_ALTERNATIVE');
        }
        else { setError('El pedido cambió. Actualiza su estado antes de proponer una alternativa.'); refresh(); }
      } else {
        setOpen(true);
        if (acceptProposal && !business) {
          authorizeChoice.current = false; acceptOrigin.current = 'card';
          if (proposalAllowed(value.process, false, 'ACCEPT_PROPOSAL')) {
            if (availabilityFlow(value.process)) setDecision('ACCEPT_PROPOSAL');
            else setAuthCard(true);
          } else { setError('La propuesta cambió. Revisa el estado actual antes de responder.'); refresh(); }
        }
      }
    } return active(); }
    catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudieron cargar las propuestas.'); return false; }
    finally { controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
  };
  const checkLateAlternative = async () => {
    if (!process || !read || !active() || lock.current) throw new ProposalError('Espera a que termine la comprobación del pedido.', 0);
    const captured = read;
    const controller = new AbortController(); controllers.current.add(controller); lock.current = true; setBusy(true);
    try {
      const latest = await readProposals(process.id, session!.token, controller.signal);
      if (!active()) throw new ProposalError('La sesión cambió. Vuelve a abrir el pedido.', 0);
      if (latest.process.version < captured.process.version) throw new ProposalError('No pudimos comprobar el estado actual. Conservamos tu propuesta; vuelve a comprobar el pedido.', 0);
      if (latest.process.version !== captured.process.version || latest.process.currentProposalId !== captured.process.currentProposalId || !proposalAllowed(latest.process, business, 'PROPOSE_ALTERNATIVE')) {
        setRead(latest); setDraftAction(null); setOpen(true); setError('El pedido cambió. Revisa las propuestas actuales; no enviamos otra propuesta.'); refresh();
        return 'El pedido cambió. Revisa las propuestas actuales; no enviamos otra propuesta.';
      }
      if (latest.proposals.length !== 1 || latest.proposals[0].sequence !== 0 || latest.process.lateInitialResponse?.status !== 'STILL_NEEDED')
        throw new ProposalError('El pedido necesita una revisión antes de continuar. Conservamos tu propuesta y no la enviamos.', 0);
      const recovered = proposalIntents().recoverLateAlternative(operationScope(session!, business), process.id, latest.process);
      setError('');
      return recovered
        ? 'El pedido aún espera tu nueva propuesta. Conservamos lo que escribiste. Revisa los datos y pulsa «Confirmar y enviar» cuando quieras enviarla.'
        : 'Pedido comprobado. Conservamos lo que escribiste; no enviamos ninguna propuesta.';
    } catch (e) {
      if (e instanceof RequestProcessError && e.status === 401) window.dispatchEvent(new Event('zipco-coordination-session-expired'));
      throw e instanceof RequestProcessError ? e : new ProposalError('No pudimos comprobar el pedido. Conservamos lo que escribiste y no enviamos ninguna propuesta. Vuelve a comprobarlo.', 0);
    } finally { controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
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
  const client = !business; // el rediseño de presentación aplica solo al cliente; el negocio conserva su markup
  const choices = exact ? (Object.keys(PROPOSAL_PATHS) as ProposalAction[]).filter(action => proposalAllowed(read.process, business, action)) : [];
  const currentScheduleExpired = Boolean(exact && scheduleExpired?.version === read.process.version && scheduleExpired.proposalId === read.process.currentProposalId);
  const requestSchedule = !business && exact && canRequestProposalSchedule(read, scheduleExpired);
  const renewSchedule = business && exact && needsReservationRenewal(read);
  // Presentación del cliente: pantalla «Elegir nuevo horario», horario ya elegido pendiente de confirmar y aviso de fecha vencida.
  const chooseNew = client && choosing && decision === 'ACCEPT_PROPOSAL' && currentScheduleExpired;
  const pendingSchedule = client && decision === 'ACCEPT_PROPOSAL' && Boolean(scheduleReview) && !chooseNew;
  const lateNotice = client && decision === 'ACCEPT_PROPOSAL' && currentScheduleExpired && !scheduleReview && !chooseNew;
  const lateError = client && currentScheduleExpired && /fecha/i.test(error);

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
    const reservationExtra=v2&&!business&&plan?.path==='LOCAL_PICKUP'&&['COUNTER_PROPOSAL','ACCEPT_PROPOSAL'].includes(action)?{reservationChoice:{offerId:plan.availabilityConfirmationId,choice:reservationSelection,...(reservationSelection==='REQUEST_RESERVATION'?{note:reservationNote.trim()}:{}),...(simplifiedReservationFlow(captured.process)?{...(isSimpleOffer(plan.reservationOffer)?{termsVersion:plan.reservationOffer.simplified.termsVersion}:{}),...(reservationSelection==='NONE'?{noReservationAcknowledged:true as const}:{})}:{})}}:{};
    lock.current = true; setBusy(true); setError('');
    const flow=beginStatusChange(order,business);let committed=false;
    const finish = (receipt: ProposalReceipt,verified?:StatusOrder) => {
      if (!active()) return;
      if(flow&&verified){window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:{orderId:verified.id,orderStatus:verified.status,requestProcess:verified.requestProcess}}));window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));if(verified.requestProcess?.version===receipt.requestProcess.version){if(isAcceptAction(action)){if(business&&!newFlow)announceDealClosed('accepted:'+process.id+':'+receipt.requestProcess.version);else announceAction('accepted',{title:'Propuesta aceptada',key:'accepted:'+process.id+':'+receipt.requestProcess.version});}else if(['PROPOSE_ALTERNATIVE','PROPOSE_FINAL'].includes(action))announceProposalSent(action,receipt);else announceAction(action==='COUNTER_PROPOSAL'?'counter':'rejected',{key:'proposal:'+process.id+':'+receipt.requestProcess.version});}completeStatusChange(flow,verified);setDecision(null);setAuthCard(false);setOpen(false);setDraftAction(null);refresh();return;}
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
            finish({ orderId: current.id, orderStatus: current.status, requestProcess: p },current); return;
          }
        }
        setRead(latest); setDraftAction(null); setOpen(true); refresh(); throw new ProposalError('El pedido cambió. Revisa su estado actualizado antes de responder.', 409, 'STALE_VERSION', true);
      }
      // E205: requesting an explicit new schedule is not reserving the expired
      // original offer. All actual acceptances retain the reservation preflight.
      const scheduleCounter = action === 'COUNTER_PROPOSAL' && review?.schedule &&
        !review.lineChanges?.length && review.totalPriceClp === captured.proposals.at(-1)?.totalPriceClp &&
        canRequestProposalSchedule(captured, scheduleExpired);
      if(simplifiedReservationFlow(captured.process)&&!business&&plan?.path==='LOCAL_PICKUP'&&['COUNTER_PROPOSAL','ACCEPT_PROPOSAL'].includes(action)&&!scheduleCounter)await readReservationOptions(process.id,captured.process.version,session!.token,false,plan.availabilityConfirmationId,controller.signal);
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
      committed=true;
      if (scheduleCounter && active() && plan?.reservationOffer && ['FREE', 'PREPAYMENT'].includes(plan.reservationOffer.mode))
        saveProposalScheduleDraft(session!.userId, process.id, { counterId: receipt.requestProcess.currentProposalId, mode: plan.reservationOffer.mode as 'FREE' | 'PREPAYMENT', note: reservationNote, contact: contactPreference, choice: reservationSelection });
      // POST is final. A failed subsequent read must never send it again.
      let navigation:string|null=null;
      if(action==='ACCEPT_PROPOSAL'&&!business&&simplifiedReservationFlow(captured.process)&&reservationSelection==='REQUEST_RESERVATION'&&plan?.reservationOffer?.mode==='PREPAYMENT'){
        try{const payment=await startReservationPayment(order.id!,session!,controller.signal);navigation=payment.navigation;}catch{/* Acceptance is final; the reservation card offers recovery. */}
      }
      if(!active())return;
      if(flow){const current=await refreshCoordinationOrder(order.id!,business,session!.token,session!.businessId,controller.signal);if(!active())return;if(!current?.requestProcess||current.requestProcess.id!==process.id||current.requestProcess.version<receipt.requestProcess.version)throw Error('read pending');finish(receipt,current);}else finish(receipt);if(navigation)window.location.assign(navigation);
    } catch (e) {
      if (active() && (e instanceof ReservationOptionsError || e instanceof ProposalError) && e.status === 409 && e.code === 'RESERVATION_SCHEDULE_EXPIRED')
        setScheduleExpired({ version: captured.process.version, proposalId: captured.process.currentProposalId });
      if(committed&&active()){setError('Tu respuesta se guard\u00f3; falta actualizar el pedido. Comprueba el estado antes de continuar.');refresh();}
      if (active() && e instanceof ProposalError && e.code === 'EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED') { setExpired(true); setAuthCard(false); setDecision(action); }
      if (active() && e instanceof ProposalError && e.status === 401) window.dispatchEvent(new Event('zipco-coordination-session-expired'));
      if(committed)throw new ProposalError('Tu respuesta se guard\u00f3; falta actualizar el pedido. Comprueba el estado antes de continuar.',0,'CONFIRMED_READ_PENDING',true);
      throw e;
    } finally {if(flow?.stage==='saving')failStatusChange(flow); controllers.current.delete(controller); lock.current = false; if (active()) setBusy(false); }
  };
  const reload = () => void load(false, false, client && Boolean(decision)); // en Aceptar/Rechazar, actualizar no cierra la confirmación
  const leaveDecision = () => {
    setScheduleReview(null); setChoosing(false); lastSchedule.current = null; setScheduleFeedback(''); setExpired(false);
    if (client && decision === 'ACCEPT_PROPOSAL' && acceptOrigin.current === 'card') { setDecision(null); setOpen(false); } // se abrió desde «Aceptar» de la tarjeta: Volver cierra
    else setDecision(null); // se abrió desde la conversación: Volver regresa a ella
  };
  const goBack = () => {
    if (chooseNew) { setChoosing(false); setScheduleFeedback(''); return; } // Elegir nuevo horario → Aceptar propuesta
    leaveDecision();
  };
  // Negocio: «Volver» desde la revisión del horario regresa a la conversación; desde Aceptar/Rechazar también (mismos efectos que antes).
  const businessBack = () => { if (scheduleReview) { setScheduleReview(null); return; } setDecision(null); setExpired(false); };
  const chooseNewSchedule = async () => { setScheduleFeedback(''); if (await load(false, false, true) && active()) setChoosing(true); };
  const changeSchedule = () => { lastSchedule.current = scheduleReview?.schedule ?? null; setScheduleReview(null); setScheduleFeedback(''); setChoosing(true); };
  return <div className="mt-3" onClick={event => event.stopPropagation()}>
    {(() => {
      const label = busy && !open && !draftAction ? initial ? 'Cargando formulario…' : 'Cargando propuesta…' : initial ? initialLabel : isProposalRejected(process) ? 'Ver propuestas e historial' : reviewLabel ?? 'Revisar propuesta y responder';
      const openProposals = async () => { await load(initial); };
      const reviewButton = variant === 'aurora'
        ? <ProposalDraftButton label={label} busy={busy} onClick={openProposals} />
        : <button type="button" className={`${button} w-full`} disabled={busy} aria-busy={busy} onClick={openProposals}>{label}</button>;
      return customerEntryActions && !business ? <div className="zipco-proposal-entry-actions">
        {proposalAllowed(process, false, 'ACCEPT_PROPOSAL') && <AcceptGlassButton size="compact" flush label="Aceptar" disabled={busy} onClick={() => void load(false, true)}/>}
        {reviewButton}
      </div> : reviewButton;
    })()}
    {error && !open && !draftAction && <p role="alert" className={`mt-2 text-sm ${variant === 'aurora' ? 'text-rose-200' : 'text-red-700 dark:text-red-300'}`}>{error}</p>}
    {open && !draftAction && <Dialog.Root open onOpenChange={value => { if (!lock.current) { setOpen(value); setDecision(null); setExpired(false); setAuthCard(false); setScheduleReview(null); setChoosing(false); lastSchedule.current = null; } }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40" />
        <Dialog.Content aria-busy={busy} data-accept-overlay={authCard || undefined} className={`zipco-chat-panel zipco-action-dialog fixed bottom-4 left-1/2 z-[1001] flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col overflow-hidden rounded-[26px] p-0${client ? ' zipco-pz' : ' zipco-bz'}${pendingSchedule ? ' zipco-pz-pending' : ''}`}>
          {busy && <div className="zipco-pz-prog" aria-hidden="true"><i /></div>}
          <div className="absolute right-2 top-2 z-10 flex gap-1">
            <button type="button" disabled={busy} aria-label="Actualizar propuestas" title="Actualizar propuestas" onClick={reload} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><RefreshCw className="h-[17px] w-[17px]" /></button>
            <Dialog.Close asChild><button type="button" disabled={busy} aria-label="Cerrar propuestas" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><X className="h-[17px] w-[17px]" /></button></Dialog.Close>
          </div>
          {(() => {
            const titleText = scheduleReview && business ? 'Confirmar horario solicitado' : chooseNew ? 'Elegir nuevo horario' : decision ? titles[decision] : initial ? 'Proponer alternativa' : reviewLabel ? 'Conversación del pedido' : 'Revisar propuesta';
            const heading = <>
              <Dialog.Title className={`text-[22px] font-extrabold leading-tight${titleText.length > 18 ? ' zipco-pz-long' : ''}`}>{titleText}</Dialog.Title>
              <Dialog.Description className={(client ? Boolean(decision) : Boolean(decision || scheduleReview)) ? 'sr-only' : 'mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-300'}>Tu conversación con {business ? 'el cliente' : 'el negocio'}.</Dialog.Description>
            </>;
            return <div className="shrink-0 px-5 pb-1.5 pt-[18px] pr-[104px]">
              <div className="zipco-pz-hd">
                {(client ? decision : (decision || scheduleReview)) && <button type="button" className="zipco-pz-bk" aria-label="Volver" disabled={busy} onClick={client ? goBack : businessBack}><span><ArrowLeft aria-hidden="true" /></span></button>}
                <div className="min-w-0 flex-1">{heading}</div>
              </div>
            </div>;
          })()}
          <div key={`${client ? decision : `business:${decision ?? ''}`}:${currentScheduleExpired}:${Boolean(scheduleReview)}:${chooseNew}`} className="zipco-chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {scheduleReview && read && business ? <section className="zipco-schedule-request zipco-bz-rev">
              <h4><CalendarCheck aria-hidden="true" />{business ? 'Sí, puedo para ese horario' : 'Solicitar nuevo horario'}</h4>
              <p className="zipco-bz-when"><Calendar aria-hidden="true" /><b>{scheduleReview.schedule?.mode === 'IMMEDIATE' || business && read.proposals.at(-1)?.subjectSnapshot.needNow ? 'Lo antes posible' : scheduleReview.schedule?.mode === 'SCHEDULED' ? `${scheduleReview.schedule.date} · ${scheduleReview.schedule.time} (Chile)` : whenLong(read.proposals.at(-1)!)}</b></p>
              <p className="zipco-bz-keep">Se mantienen los productos y el total: <b>{money(scheduleReview.totalPriceClp)}</b>.</p>
              <p className="zipco-bz-qt"><small>Tu mensaje al cliente</small>{scheduleReview.message}</p>
              <p>El cliente debe revisar y aceptar la propuesta final. Solicitar otro horario no confirma la reserva.</p>
              {business && read.process.availability?.reservationOffer && <>
                <BusinessResponseHoursNotice businessId={Number(session?.businessId)} {...chileSchedule(read.proposals.at(-1)?.scheduledFor)} />
                <SimpleReservationOfferFields initial={read.process.availability.reservationOffer} total={scheduleReview.totalPriceClp} onChange={setFinalOffer} disabled={busy} lockMode />
                {read.process.availability.allowCustomerWhatsapp && <p className="zipco-bz-wa">{BUSINESS_CONTACT_COPY}</p>}
              </>}
              {!business && <p>Tu elección de reserva, nota y permiso de contacto se mantienen para esta solicitud.</p>}
            </section> : chooseNew && read ? <div className="zipco-pz-late-wrap">
              {(() => {
                const latest = read.proposals[read.proposals.length - 1];
                return <section className="zipco-pz-late" aria-label="La fecha de esta oferta ya pasó">
                  <h4><Clock aria-hidden="true" />La fecha de esta oferta ya pasó</h4>
                  <div className="zipco-pz-sr">
                    <span className="zipco-pz-th"><ProductPreviewControl preview={latest.productPreview ?? null} /></span>
                    <div className="t"><b>{proposalTitle(latest)}</b></div>
                    <em>{money(latest.totalPriceClp)}</em>
                  </div>
                  <p className="zipco-pz-late-prev"><Clock aria-hidden="true" /><span>Horario anterior: <s>{whenLong(latest)}</s></span></p>
                  {reservationNote && <p className="zipco-pz-late-nt"><b>Tu nota:</b> {reservationNote}</p>}
                  <p className="zipco-pz-late-keep"><ShieldCheck aria-hidden="true" />Conservamos tu elección de reserva y tu permiso de contacto.</p>
                </section>;
              })()}
              {requestSchedule ? <ExpiredProposalSchedule busy={busy} total={money(read.proposals[read.proposals.length - 1].totalPriceClp)} initial={lastSchedule.current} feedback={scheduleFeedback} onEdit={() => setScheduleFeedback('')} onSelect={schedule => {
                try { setScheduleReview(scheduleRequestReview(read, schedule, reservationNote)); lastSchedule.current = schedule; setChoosing(false); setError(''); setScheduleFeedback(''); }
                catch (e) { setScheduleFeedback(e instanceof Error ? e.message : 'Revisa el horario.'); }
              }} /> : <p className="zipco-pz-late-lim"><Info aria-hidden="true" />Esta propuesta no permite otra contrapropuesta de horario. Puedes volver al historial o rechazarla; no cancelamos el pedido automáticamente.</p>}
            </div> : client && decision && read ? <div className="zipco-pz-decision">
              {(() => {
                const latest = read.proposals[read.proposals.length - 1];
                const reject = decision.startsWith('REJECT_');
                const offer = read.process.availability?.reservationOffer;
                return <>
                  <section className={`zipco-pz-sum${reject ? ' rej' : ''}${expired ? ' exp' : ''}`}>
                    <h4>{expired ? 'La fecha y hora propuestas ya pasaron. ¿Quieres aceptar igualmente?' : reject ? '¿Confirmas rechazar esta propuesta exacta?' : '¿Confirmas esta propuesta exacta?'}</h4>
                    <div className="zipco-pz-sr">
                      <span className="zipco-pz-th"><ProductPreviewControl preview={latest.productPreview ?? null} /></span>
                      <div className="t"><b>{proposalTitle(latest)}</b><small><Calendar aria-hidden="true" />{whenLong(latest)}</small></div>
                      <em>{money(latest.totalPriceClp)}</em>
                    </div>
                    {!reject && availabilityFlow(read.process) && read.process.availability && <>
                      <div className="zipco-pz-perf" aria-hidden="true" />
                      <AvailabilityPlanSummary plan={read.process.availability} customerProposal />
                    </>}
                  </section>
                  {availabilityFlow(read.process) && isAcceptAction(decision) && <>
                    {reservationFlow(read.process) && offer && <div className="zipco-pz-choice">
                      <ReservationChoiceFields offer={offer} value={reservationSelection} note={reservationNote} onChange={setReservationSelection} onNote={setReservationNote} disabled={busy || pendingSchedule} variant="cards" hideSummary />
                    </div>}
                    {read.process.availability?.allowCustomerWhatsapp
                      ? <label className={`zipco-pz-ct${contactPreference ? ' on' : ''}`}>
                          <input type="checkbox" checked={contactPreference} disabled={busy || pendingSchedule} onChange={e => setContactPreference(e.target.checked)} />
                          <span className="ic" aria-hidden="true"><Phone /></span>
                          <span className="tx"><b>Permitir que este negocio me escriba por WhatsApp</b>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</span>
                          <span className="tr" aria-hidden="true" />
                        </label>
                      : <p className="zipco-pz-nop">Esta propuesta es para retiro en el local sin compartir teléfonos.</p>}
                  </>}
                </>;
              })()}
            </div> : business && decision && read ? <div className="zipco-bz-decision">
              {(() => {
                const latest = read.proposals[read.proposals.length - 1];
                const reject = decision.startsWith('REJECT_');
                return <>
                  <section className={`zipco-pz-sum${reject ? ' rej' : ''}${expired ? ' exp' : ''}`}>
                    <span className="zipco-bz-ey">{titles[decision]}</span>
                    <h4>{expired ? 'La fecha y hora propuestas ya pasaron. ¿Quieres aceptar igualmente?' : reject ? '¿Confirmas rechazar esta contrapropuesta?' : '¿Confirmas esta propuesta exacta?'}</h4>
                    <div className="zipco-pz-sr">
                      <span className="zipco-pz-th"><ProductPreviewControl preview={latest.productPreview ?? null} /></span>
                      <div className="t"><b>{proposalTitle(latest)}</b><small><Calendar aria-hidden="true" />{whenLong(latest)}</small></div>
                      <em>{money(latest.totalPriceClp)}</em>
                    </div>
                  </section>
                  {availabilityFlow(read.process) && isAcceptAction(decision) && read.process.availability?.allowCustomerWhatsapp && <p className="zipco-bz-wa">{BUSINESS_CONTACT_COPY}</p>}
                </>;
              })()}
            </div> : <>
              {read && <ProposalChat read={read} business={business} businessDesign={business}
                turn={isProposalRejected(read.process) ? 'closed' : choices.length ? 'mine' : 'wait'}
                closedText={read.process.closure?.actor === 'CUSTOMER' ? 'El cliente rechazó la propuesta · Historial' : 'El negocio rechazó la contrapropuesta · Historial'}
                canCounter={!business && choices.includes('COUNTER_PROPOSAL')}
                plan={client && read.process.availability ? <AvailabilityPlanSummary plan={read.process.availability} customerProposal /> : undefined} />}
            </>}
          </div>
          {lateNotice && <div className="zipco-pz-err late nl" role="alert">
            <span className="ic" aria-hidden="true"><Clock /></span>
            <span className="tx">{lateError ? error : 'La fecha ofrecida venció. Solicitar otro horario no confirma la reserva.'}</span>
            {requestSchedule ? <div className="acts"><button type="button" className="go" disabled={busy} aria-busy={busy} onClick={() => void chooseNewSchedule()}>
              {busy && <i className="zipco-pz-sp" aria-hidden="true" />}<span>{busy ? 'Actualizando…' : 'Elegir nuevo horario'}</span>{!busy && <ArrowRight aria-hidden="true" />}
            </button></div> : <span className="tx">Esta propuesta no permite otra contrapropuesta de horario. Puedes volver a la conversación o rechazarla.</span>}
          </div>}
          {pendingSchedule && scheduleReview && <div className="zipco-pz-err late pend" role="status">
            <span className="ic" aria-hidden="true"><Calendar /></span>
            <span className="tx"><b>{requestedScheduleLabel(scheduleReview.schedule)}</b><br />{scheduleReview.schedule?.mode === 'SCHEDULED' ? 'Hora de Chile · ' : ''}Nuevo horario listo para solicitar. Tu reserva aún no está confirmada.</span>
            <div className="acts"><button type="button" className="go chg" disabled={busy} onClick={changeSchedule}>Cambiar horario</button></div>
          </div>}
          {error && !(lateNotice && lateError) && <p role="alert" className={`zipco-pz-err${lateError ? ' late' : ''}`}>
            {lateError && <span className="ic" aria-hidden="true"><Clock /></span>}
            <span className="tx">{error}</span>
            <button type="button" disabled={busy} onClick={reload}><RefreshCw aria-hidden="true" />Actualizar propuestas</button>
          </p>}
          <div className="zipco-chat-foot shrink-0 space-y-2 px-4 pb-4 pt-1.5">
            {scheduleReview && business ? <>
              <p className="zipco-pz-cap"><Info aria-hidden="true" />{business ? 'Enviarás una propuesta final con la oferta renovada. El cliente todavía debe aceptarla.' : 'El negocio debe confirmar el nuevo horario. Tu reserva aún no está confirmada.'}</p>
              <div className="zipco-pz-r2">
                <button type="button" className="zipco-pz-back" disabled={busy} onClick={() => setScheduleReview(null)}>Volver</button>
                <button type="button" className="zipco-bz-send" disabled={busy || !(business ? renewSchedule && finalOffer : requestSchedule)} aria-busy={busy} onClick={async () => {
                  try { await execute(business ? 'PROPOSE_FINAL' : 'COUNTER_PROPOSAL', scheduleReview); }
                  catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudo confirmar. Conservamos tu solicitud.'); }
                }}>{busy && <i className="zipco-pz-sp" aria-hidden="true" />}{busy ? 'Guardando…' : business ? 'Confirmar y enviar' : 'Solicitar nuevo horario'}</button>
              </div>
            </> : decision ? (client ? chooseNew ? <div className="zipco-pz-r2">
              <button type="button" className="zipco-pz-back" disabled={busy} onClick={goBack}>Volver</button>
            </div> : <>
              {(() => {
                const reject = decision.startsWith('REJECT_');
                const confirm = async () => {
                  try { if (pendingSchedule && scheduleReview) await execute('COUNTER_PROPOSAL', scheduleReview); else await execute(decision, undefined, null, expired, isAcceptAction(decision) && authorizeChoice.current); }
                  catch (e) { if (active()) setError(e instanceof Error ? e.message : pendingSchedule ? 'No se pudo confirmar. Conservamos tu solicitud.' : 'No se pudo confirmar. Reintenta la misma operación.'); }
                };
                const blocked = busy || !choices.includes(pendingSchedule ? 'COUNTER_PROPOSAL' : decision);
                return <>
                  {!(lateNotice || pendingSchedule) && <p className={`zipco-pz-cap${reject ? ' rose' : ''}`}><Info aria-hidden="true" />{reject ? 'La solicitud finalizará y quedará en Historial.' : availabilityFlow(read?.process) ? 'Aceptar crea el acuerdo de esta propuesta. No representa un pago realizado.' : 'Las condiciones aceptadas pasarán a Por coordinar; falta autorizar el contacto.'}</p>}
                  <div className="zipco-pz-r2">
                    <button type="button" className="zipco-pz-back" disabled={busy} onClick={goBack}>Volver</button>
                    {reject
                      ? <button type="button" className="zipco-chat-rej zipco-pz-solid" disabled={blocked} aria-busy={busy} onClick={confirm}>{busy && <i className="zipco-pz-sp" aria-hidden="true" />}{busy ? 'Guardando…' : 'Sí, rechazar'}</button>
                      : pendingSchedule
                        ? <span className={`zipco-pz-pw${busy ? '' : ' pulse'}`}><AcceptGlassButton size="compact" flush label={busy ? 'Guardando…' : 'Solicitar nuevo horario'} disabled={blocked} onClick={confirm} /></span>
                        : <AcceptGlassButton size="compact" flush label={busy ? 'Guardando…' : 'Sí, confirmar'} disabled={blocked} onClick={confirm} />}
                  </div>
                </>;
              })()}
            </> : <>
              <p className={`zipco-pz-cap${decision.startsWith('REJECT_') ? ' rose' : ''}`}><Info aria-hidden="true" />{decision.startsWith('REJECT_') ? 'La solicitud finalizará y quedará en Historial.' : availabilityFlow(read?.process) ? 'Aceptar crea el acuerdo de esta propuesta. No representa un pago realizado.' : 'Las condiciones aceptadas pasarán a Por coordinar; falta autorizar el contacto.'}</p>
              <div className="zipco-pz-r2">
                <button type="button" className="zipco-pz-back" disabled={busy} onClick={() => { setDecision(null); setExpired(false); }}>Volver</button>
                {(() => {
                  const confirm = async () => { try { await execute(decision, undefined, null, expired, isAcceptAction(decision) && authorizeChoice.current); } catch (e) { if (active()) setError(e instanceof Error ? e.message : 'No se pudo confirmar. Reintenta la misma operación.'); } };
                  const blocked = busy || !choices.includes(decision);
                  return isAcceptAction(decision)
                    ? <AcceptGlassButton size="compact" flush label={busy ? 'Guardando…' : 'Sí, confirmar'} disabled={blocked} onClick={confirm} />
                    : <button type="button" className="zipco-chat-rej zipco-pz-solid" disabled={blocked} aria-busy={busy} onClick={confirm}>{busy && <i className="zipco-pz-sp" aria-hidden="true" />}{busy ? 'Guardando…' : 'Sí, rechazar'}</button>;
                })()}
              </div>
            </>) : <>
              {(() => {
                const go = (action: ProposalAction) => {
                  if (['PROPOSE_ALTERNATIVE', 'COUNTER_PROPOSAL', 'PROPOSE_FINAL'].includes(action)) {
                    chosenFulfillment.current=null;setFinalOffer(undefined);setDraftAction(action);
                  }
                  else if (isAcceptAction(action)) { acceptOrigin.current = 'chat'; if(availabilityFlow(read?.process))setDecision(action);else setAuthCard(true);setExpired(false);authorizeChoice.current = false; }
                  else { acceptOrigin.current = 'chat'; setDecision(action); setExpired(false); }
                };
                const accepts = choices.filter(action => isAcceptAction(action) && !(renewSchedule && action === 'ACCEPT_COUNTER_PROPOSAL'));
                const others = choices.filter(action => !isAcceptAction(action));
                return <>
                  {renewSchedule && <button type="button" className="zipco-bz-same" disabled={busy} onClick={() => { setFinalOffer(null); setScheduleReview(sameScheduleFinalReview(read!)); setError(''); }}>
                    <span className="ck"><CalendarCheck aria-hidden="true" /></span><span className="lb">Sí, puedo para ese horario</span><ArrowRight aria-hidden="true" />
                  </button>}
                  {renewSchedule && <p className="zipco-bz-hint">Renovarás la oferta mediante una propuesta final; la reserva requiere la aceptación del cliente. <b>Rechazar la contrapropuesta cierra la negociación.</b></p>}
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
      counterProposal={!business && draftAction === 'COUNTER_PROPOSAL'}
      sourceOverride={proposalDraftSource(read)} title={draftAction==='COUNTER_PROPOSAL'?'Contraponer · 1 vez':titles[draftAction]}
      baselineLabel={draftAction === 'PROPOSE_ALTERNATIVE' ? 'Solicitud original' : 'Propuesta vigente'}
      onCheck={business && draftAction === 'PROPOSE_ALTERNATIVE' && read.process.lateInitialResponse?.status === 'STILL_NEEDED' ? checkLateAlternative : undefined}
      close={() => setDraftAction(null)} onConfirm={choices.includes(draftAction) ? (review, file) => {
        if(read.process.lateInitialResponse?.requiresNewSchedule&&draftAction==='PROPOSE_ALTERNATIVE'&&review.schedule?.mode!=='SCHEDULED')return Promise.reject(new ProposalError('Propón una nueva fecha y hora programadas. La hora original ya pasó; el cliente debe aceptar la nueva.',0));
        if(availabilityFlow(read.process)&&business&&draftAction==='PROPOSE_ALTERNATIVE'&&!chosenFulfillment.current)return new Promise<boolean>((resolve,reject)=>{
          pendingFulfillment.current={send:()=>execute(draftAction,review,file),total:review.totalPriceClp,schedule:review.schedule?.mode==='SCHEDULED'?{date:review.schedule.date,time:review.schedule.time}:review.schedule?.mode==='IMMEDIATE'?undefined:chileSchedule(read.proposals.at(-1)?.scheduledFor),resolve,reject};setFulfillmentOpen(true);
        });
        return execute(draftAction,review,file);
      } : undefined}
      reviewFields={review=><>
        {business&&<BusinessResponseHoursNotice businessId={Number(session?.businessId)} {...(review.schedule?.mode==='SCHEDULED'?{date:review.schedule.date,time:review.schedule.time}:review.schedule?.mode==='IMMEDIATE'?undefined:chileSchedule(read.proposals.at(-1)?.scheduledFor))}/>}
        {availabilityFlow(read.process)&&business&&draftAction==='PROPOSE_FINAL'&&<div className="my-3 rounded-xl border p-3 text-xs">
          {read.process.availability?<><p className="mb-2 font-bold">Se conserva la opción de la propuesta anterior</p><AvailabilityPlanSummary plan={read.process.availability}/>{reservationFlow(read.process)&&read.process.availability.reservationOffer&&(simplifiedReservationFlow(read.process)?<SimpleReservationOfferFields initial={read.process.availability.reservationOffer} total={review.totalPriceClp} onChange={setFinalOffer} disabled={busy} lockMode/>:<ReservationOfferFields initial={read.process.availability.reservationOffer} total={review.totalPriceClp} onChange={setFinalOffer} disabled={busy} lockMode/>)}{read.process.availability.allowCustomerWhatsapp&&<p className="mt-2">{BUSINESS_CONTACT_COPY}</p>}</>:<p role="alert">No se pudo recuperar el camino de la propuesta. Actualiza sus condiciones antes de enviar.</p>}
        </div>}
        {!business&&reservationFlow(read.process)&&read.process.availability?.reservationOffer&&<ReservationChoiceFields offer={read.process.availability.reservationOffer} value={reservationSelection} note={reservationNote} onChange={setReservationSelection} onNote={setReservationNote} disabled={busy}/>}
        {availabilityFlow(read.process)&&!business&&(read.process.availability?.allowCustomerWhatsapp?<label className="my-3 flex gap-2 text-xs"><input type="checkbox" checked={contactPreference} disabled={busy} onChange={e=>setContactPreference(e.target.checked)}/><span>Permitir que este negocio me escriba por WhatsApp<br/>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</span></label>:<p className="my-3 text-xs">Esta propuesta es para retiro en el local sin compartir teléfonos.</p>)}
      </>} />}
    <ConfirmAvailabilityDesign responseSchedule={{businessId:Number(session?.businessId),...pendingFulfillment.current?.schedule}} open={fulfillmentOpen} onOpenChange={value=>{
      if(!value&&!busy){setFulfillmentOpen(false);const pending=pendingFulfillment.current;pendingFulfillment.current=null;pending?.resolve(false);}
    }} purpose="proposal" busy={busy} reservationContract={reservationFlow(read?.process??process)} simplified={simplifiedReservationFlow(read?.process??process)} reservationTotal={pendingFulfillment.current?.total??order.total??0} onChoose={async choice=>{
      const pending=pendingFulfillment.current;if(!pending||lock.current)return;
      chosenFulfillment.current=fulfillmentFromChoice(choice);
      try{await pending.send();setFulfillmentOpen(false);pending.resolve(true);}
      catch(error){setFulfillmentOpen(false);if(active())setError(error instanceof Error?error.message:'No se pudo confirmar el envío.');pending.reject(error);}
      finally{pendingFulfillment.current=null;}
    }}/>
  </div>;
}
