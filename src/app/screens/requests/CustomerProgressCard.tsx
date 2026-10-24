import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, Package, PackageCheck } from 'lucide-react';
import { coordinationAllowed } from './coordinationApi';
import useCoordination from './useCoordination';
import { ProgressCardHeader } from './ProgressCardShell';
import CustomerReceiptDialog, { type CustomerReceiptAction } from './CustomerReceiptDialog';
import { presentCustomerProgress } from './customerProgressFeedback';
import { readCoordinationSession } from './coordinationSession';
import useCoordinationMotion from './useCoordinationMotion';
import { ConditionsSheet, type AcceptedSummary } from './CoordinationSheets';
import AgreementSheet from './AgreementSheet';
import { readyArrivalDelay, consumeReadyArrival, READY_ARRIVAL_EVENT } from './readyArrival';

/**
 * Tarjeta del CLIENTE para pedidos en IN_PROGRESS y READY (diseño S · "Anillo" + animación "Brillo", aprobado).
 * Reemplaza el bloque genérico (aurora + CoordinationActions) SOLO para el cliente y SOLO en esos dos estados.
 *
 *  IN_PROGRESS → "Preparando tu pedido": anillo con brillo recorriéndolo + cuenta regresiva a la entrega acordada.
 *  READY       → "¡Tu pedido está listo!" con DOS botones:
 *                  1. "Confirmar aviso"  (ACK_READY_NOTICE)  = "vi tu aviso y voy a retirarlo"
 *                  2. "Confirmar recepción de mi pedido" (CONFIRM_RECEIPT) = "ya lo recibí"
 *                Tras confirmar el aviso, el botón 1 pasa a la fila "Aviso confirmado · Pendiente de recepción" y el botón 2 queda como
 *                botón principal (verde con brillo). La API exige confirmar el aviso antes de recibir.
 *  Llegada     → si la tarjeta nace justo tras el aviso del negocio (readyArrivalDelay), entra a "Listos" con una animación (ver INSTRUCCIONES §3.7).
 *  Recibido    → estado LOCAL y transitorio (holograma "¡Pedido recibido!"): al soltar el refresh el pedido pasa a "Historial" y esta
 *                tarjeta se desmonta (la tarjeta de historial ya existente se encarga de mostrarlo).
 *
 * La presentación se ejecuta después de verificar POST + GET; el estado siempre procede del servidor.
 */
// Chispas del holograma/anillo (misma tabla que el diseño): [x, y, color, tamaño]
const SPARKS: ReadonlyArray<readonly [number, number, string, number]> = [
  [-96, -26, '#5eead4', 6], [-60, -34, '#fde68a', 5], [-18, -40, '#c4b5fd', 7], [30, -38, '#f0abfc', 5],
  [74, -32, '#67e8f9', 7], [104, -14, '#fde68a', 5], [-104, 10, '#c4b5fd', 5], [108, 16, '#5eead4', 6],
];

const WaIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l1.65-4.9A9 9 0 1 1 8 19.4z" /><path d="M9.2 8.6c0 3.4 2.8 6.2 6.2 6.2l1-1.4-2-1-.9.8c-.9-.4-1.8-1.3-2.2-2.2l.8-.9-1-2z" /></svg>;

/** Cuenta regresiva a `iso` (se recalcula cada 20 s). null = sin fecha o ya pasó → la tarjeta de cuenta regresiva no se muestra. */
function useCountdown(iso?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    if (!Number.isFinite(Date.parse(iso)) || Date.parse(iso) <= Date.now()) return;
    const tick = () => { if (!document.hidden) setNow(Date.now()); if (Date.now() >= Date.parse(iso)) window.clearInterval(id); };
    const id = window.setInterval(tick, 20000);
    document.addEventListener('visibilitychange', tick);
    setNow(Date.now());
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [iso]);
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  return { d: Math.floor(mins / 1440), h: Math.floor((mins % 1440) / 60), m: mins % 60 };
}
const TZ = 'America/Santiago';
const whenLabel = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '');
  const time = d.toLocaleTimeString('es-CL', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
};

type OrderProp = Parameters<typeof useCoordination>[0];

export default function CustomerProgressCard({ order, businessName, image, price, statusLabel, accepted, acceptedAt,
  conditionsTitle, conditionsSubtitle, conditionsWhen, conditionsSummary, explanation, negotiated, refresh, notificationOpen = 0, onInspect, isUnread = false }: {
  order: OrderProp; businessName: string; image?: string; price: number | null; statusLabel: string;
  accepted: AcceptedSummary & { scheduledFor?: string | null }; acceptedAt?: string | null;
  conditionsTitle: string; conditionsSubtitle: string; conditionsWhen: string; conditionsSummary: string; explanation?: string | null;
  negotiated: boolean; refresh: () => void;
  notificationOpen?: number; onInspect?: () => void; isUnread?: boolean;

}) {

  const [latest, setLatest] = useState<OrderProp | null>(null);
  const current = latest?.requestProcess && latest.requestProcess.id === order.requestProcess?.id &&
    latest.requestProcess.agreementPublicId === order.requestProcess?.agreementPublicId &&
    latest.requestProcess.version > (order.requestProcess?.version ?? 0) ? latest : order;
  const process = current.requestProcess;
  const ready = process?.state === 'READY';
  const service = accepted.subjectSnapshot.orderType === 'service';
  const business = businessName || 'el negocio';
  const mounted = useRef(true), requestLock = useRef(false), startedAt = useRef(0);
  const verifiedStage = useRef(false);
  const session = useRef(readCoordinationSession());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [sheet, setSheet] = useState<'cond' | 'agree' | null>(null);
  const [confirm, setConfirm] = useState<CustomerReceiptAction | null>(null);
  const [phase, setPhase] = useState<'idle' | 'acking' | 'receiving' | 'received'>('idle');
  const [arrivalDelay, setArrivalDelay] = useState<number | null>(null);
  const [folded, setFolded] = useState(notificationOpen === 0);
  const foldTimer = useRef<number | null>(null);
  const motionRef = useCoordinationMotion(folded || sheet !== null || confirm !== null);
  useEffect(() => { if (notificationOpen > 0) {
    if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
    setFolded(false);
  } }, [notificationOpen]);
  useEffect(() => () => { if (foldTimer.current !== null) window.clearTimeout(foldTimer.current); }, []);
  const operation = useCoordination(current, false, refresh, true, undefined, (action, key, verified) => {
    if (mounted.current) setConfirm(null);
    return presentCustomerProgress(action, key, startedAt.current, () => {
      if (!mounted.current || readCoordinationSession() !== session.current) return;
      verifiedStage.current = true;
      setLatest(verified); setPhase(action === 'CONFIRM_RECEIPT' ? 'received' : 'idle');
      if (action === 'ACK_READY_NOTICE') foldTimer.current = window.setTimeout(() => {
        if (mounted.current && readCoordinationSession() === session.current) setFolded(true);
      }, 3200);
    });
  });
  useEffect(() => {
    if (!ready) return;
    let timer: number | undefined;
    const arrive = () => {
      const delay = readyArrivalDelay(order.id, accepted.agreementPublicId);
      if (delay === null) return;
      setArrivalDelay(delay); setFolded(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => consumeReadyArrival(order.id, accepted.agreementPublicId), delay + 1300);
    };
    const receive = (event: Event) => {
      if ((event as CustomEvent).detail?.orderId === order.id) arrive();
    };
    arrive(); window.addEventListener(READY_ARRIVAL_EVENT, receive);
    return () => { window.clearTimeout(timer); window.removeEventListener(READY_ARRIVAL_EVENT, receive); };
  }, [ready, order.id, accepted.agreementPublicId]);
  useEffect(() => {
    const root = motionRef.current; if (!root) return;
    const row = root.querySelector<HTMLButtonElement>('.zipco-co-colrow');
    if (folded && root.querySelector('.zipco-co-fb')?.contains(document.activeElement)) row?.focus({preventScroll:true});
    else if (!folded && document.activeElement === row) root.querySelector<HTMLButtonElement>('.zipco-cp-strip')?.focus({preventScroll:true});
  }, [folded]);
  const received = phase === 'received';
  const acked = !received && process?.readyNoticeAcknowledged === true;
  const ackKnown = typeof process?.readyNoticeAcknowledged === 'boolean';
  const done = ready || received;
  const base = current.recordState === 'available';
  const canAck = base && !service && coordinationAllowed(process, false, 'ACK_READY_NOTICE');
  const canReceive = base && !service && coordinationAllowed(process, false, 'CONFIRM_RECEIPT');
  // Existing allowedActions plus the customer's own consent gate WhatsApp.
  const canContact = base && coordinationAllowed(process, false, 'OPEN_WHATSAPP');
  const pending = operation.busy ? null : operation.pending();
  const recoveryOnly = operation.needsUpdate || operation.storageWarning() || operation.restored();
  const countdown = useCountdown(!done && !accepted.subjectSnapshot.needNow && !folded && sheet === null ? accepted.scheduledFor : null);
  const submit = async (action: CustomerReceiptAction, retry = false) => {
    if (requestLock.current || operation.busy || recoveryOnly || (!retry && (pending || (action === 'ACK_READY_NOTICE' ? !canAck : !canReceive)))) return;
    requestLock.current = true; verifiedStage.current = false; startedAt.current = Date.now(); setPhase(action === 'ACK_READY_NOTICE' ? 'acking' : 'receiving');
    const ok = retry ? await operation.retry() : await operation.run(action);
    if (mounted.current && (!ok || !verifiedStage.current)) setPhase('idle');
    requestLock.current = false;
  };
  const title = received ? '¡Pedido recibido!'
    : !ready ? (service ? 'Preparando tu servicio' : 'Preparando tu pedido')
      : service ? '¡Tu servicio está listo!' : acked ? 'Aviso confirmado' : '¡Tu pedido está listo!';
  const sub = received ? 'Gracias por confirmar. Tu pedido quedó completado.'
    : !ready ? <><b>{business}</b> te avisará aquí apenas esté listo.</>
      : service ? 'El negocio marcó tu servicio como listo.' : acked ? 'Coordina el retiro con el negocio.'
        : 'Confirma el aviso para coordinar el retiro.';
  const colSub = received ? 'Completado · toca para abrir'
    : !ready ? `${business} te avisará · toca para abrir`
      : service ? 'Servicio listo · toca para abrir' : !ackKnown ? 'Actualiza el estado del aviso · toca para abrir'
        : acked ? 'Pendiente de recepción · toca para abrir' : 'Falta confirmar el aviso · toca para abrir';
  const pillLabel = received ? 'Recibido' : statusLabel;

  const showAckBtn = ready && !service && ackKnown && !acked && !received && phase !== 'receiving' && !recoveryOnly && !pending;
  const showReceiptBtn = ready && !service && ackKnown && !received && phase === 'idle' && !recoveryOnly && !pending;

  return <article ref={motionRef} tabIndex={0} id={`order-${order.id}`} aria-label={`${business}: ${received ? 'pedido recibido' : ready ? 'pedido listo' : 'pedido en curso'}`} className="zipco-cp scroll-mb-36" data-arrive={arrivalDelay !== null} style={arrivalDelay !== null ? { animationDelay: `${arrivalDelay}ms` } : undefined} onClick={event => event.stopPropagation()}>
    <div style={{ position: 'relative' }}>
      <ProgressCardHeader business={false} name={business} image={image} price={price} statusLabel={pillLabel} isUnread={isUnread} ready={done} />

      <div className="zipco-co-fb" data-folded={folded} aria-hidden={folded} {...(folded ? { inert: '' } : {})}><div className="zipco-co-fb-in">
        <button type="button" className="zipco-cp-strip" aria-haspopup="dialog" onClick={() => setSheet('cond')}>
          <span className="ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true" /></span>
          <span style={{ minWidth: 0 }}><div className="l">Condiciones aceptadas</div><div className="v">{conditionsSummary}</div></span>
          <span className="go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
        </button>

        <section className="zipco-cp-hero" aria-label="Estado del pedido" role="status" aria-live="polite">
          <div className={`zipco-cp-ring${done ? ' d' : ''}`} style={{ ['--k' as string]: done ? 1 : 0.75 }}>
            <svg viewBox="0 0 118 118" aria-hidden="true">
              <defs><linearGradient id={`zipco-cp-g-${order.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14b8a6" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
              <circle className="tr" cx="59" cy="59" r="54" />
              <circle className="pg" cx="59" cy="59" r="54" style={{ stroke: done ? '#10b981' : `url(#zipco-cp-g-${order.id})` }} />
              {!done && <circle className="sh" cx="59" cy="59" r="54" />}
            </svg>
            {done ? <>
              <span className="in d"><span><PackageCheck size={36} strokeWidth={2} aria-hidden="true" /></span></span>
              <span className="halo" aria-hidden="true" />
              <span className="zipco-co-us" aria-hidden="true">{SPARKS.map(([x, y, c, s]) => <i key={`${x}${y}`} style={{ ['--x' as string]: `${x}px`, ['--y' as string]: `${y}px`, ['--c' as string]: c, ['--s' as string]: s }} />)}</span>
            </> : <span className="in w"><span><Package size={34} strokeWidth={2} aria-hidden="true" /></span></span>}
          </div>
          <div className="zipco-cp-t">{title}</div>
          <div className="zipco-cp-s">{sub}</div>
        </section>

        {countdown && accepted.scheduledFor && <div className="zipco-cp-cd">
          <div className="h"><Calendar size={14} strokeWidth={2.4} aria-hidden="true" />Entrega acordada<span>{whenLabel(accepted.scheduledFor)}</span></div>
          <div className="r"><div><b>{countdown.d}</b><small>días</small></div><div><b>{countdown.h}</b><small>horas</small></div><div><b>{countdown.m}</b><small>min</small></div></div>
        </div>}

        {operation.message && <p role="alert" className="zipco-co-co2-p" style={{ marginTop: 12 }}>{operation.message}</p>}

        {recoveryOnly ? <div style={{ marginTop: 12 }}>
          <p role="alert" className="zipco-co-co2-p" style={{ margin: 0 }}>{operation.storageWarning() || (operation.restored()
            ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
          <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
        </div> : pending ? <div style={{ marginTop: 12 }}>
          <p className="zipco-co-co2-p" style={{ margin: 0 }}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
          <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => { const action = operation.pending()?.action; if (action === 'ACK_READY_NOTICE' || action === 'CONFIRM_RECEIPT') void submit(action, true); }}>Reintentar operación pendiente</button>
        </div> : null}

        {/* 1 · Confirmar aviso (ACK_READY_NOTICE) */}
        {showAckBtn && (phase === 'acking'
          ? <div className="zipco-cp-ackw"><button type="button" className="zipco-cp-ack ld" disabled aria-busy="true"><span className="zipco-co-spin2" />Confirmando…</button></div>
          : <div className="zipco-cp-ackw"><button type="button" className="zipco-cp-ack" disabled={!canAck || operation.busy} onClick={() => setConfirm('ACK_READY_NOTICE')}><CircleCheck size={20} strokeWidth={2.4} aria-hidden="true" />Confirmar aviso</button></div>)}
        {acked && <div className="zipco-cp-st" role="status">
          <span className="zipco-ec-st-ic ok"><Check size={17} strokeWidth={3.2} aria-hidden="true" /></span>
          <div><div className="t">Aviso confirmado</div><div className="s">Pendiente de recepción.</div></div>
        </div>}
        {received && <div className="zipco-cp-st" role="status">
          <span className="zipco-ec-st-ic ok"><PackageCheck size={17} strokeWidth={2.6} aria-hidden="true" /></span>
          <div><div className="t">Recepción confirmada</div><div className="s">Pedido completado. ¡Gracias!</div></div>
        </div>}

        {/* 2 · Confirmar recepción (CONFIRM_RECEIPT). Secundario antes de confirmar el aviso; principal (verde con brillo) después. */}
        {showReceiptBtn && <button type="button" className={`zipco-cp-rec${acked ? ' p' : ''}`} disabled={!canReceive || operation.busy} onClick={() => setConfirm('CONFIRM_RECEIPT')}>
          <PackageCheck size={19} strokeWidth={2.4} aria-hidden="true" />Confirmar recepción de mi pedido</button>}
        {showReceiptBtn && !acked && <p className="zipco-cp-help">Primero confirma el aviso.</p>}
        {ready && !service && !ackKnown && !recoveryOnly && !pending && <div role="status" className="zipco-cp-st">
          <div><div className="t">El estado del aviso no está disponible.</div><button type="button" disabled={operation.busy} className="min-h-11 font-bold" onClick={() => void operation.update()}>Actualizar estado del aviso</button></div>
        </div>}
        {phase === 'receiving' && <button type="button" className="zipco-cp-rec p ld" disabled aria-busy="true"><span className="zipco-co-spin2" />Confirmando…</button>}

        {canContact && !received && <button type="button" className="zipco-cp-wa" disabled={operation.busy || Boolean(recoveryOnly) || Boolean(pending)} onClick={() => void operation.run('OPEN_WHATSAPP')}><span className="w"><WaIcon /></span>Escribir al negocio</button>}

        <button type="button" className="zipco-co-fold" style={{ marginTop: 12 }} aria-expanded={!folded} onClick={() => setFolded(true)}><ChevronUp size={16} strokeWidth={2.8} aria-hidden="true" />Ocultar tarjeta</button>
      </div></div>

      <button type="button" className="zipco-co-colrow" data-folded={folded} aria-expanded={!folded} aria-hidden={!folded} tabIndex={folded ? 0 : -1} onClick={() => { onInspect?.(); setFolded(false); }}
        style={{ ['--att' as string]: ready && !acked && !received ? 1 : 0 }}>
        <span className="nd" aria-hidden="true">{received || acked ? <Check size={16} strokeWidth={3.4} /> : ready ? <PackageCheck size={16} strokeWidth={2.6} /> : <Package size={15} strokeWidth={2.4} />}</span>
        <span className="tx"><b>{received ? 'Pedido recibido' : title}</b><small>{colSub}</small></span>
        <span className="chev"><ChevronDown size={15} strokeWidth={2.8} aria-hidden="true" /><span className="sr-only">Mostrar estado del pedido</span></span>
      </button>
    </div>

    <ConditionsSheet fullAgreement open={sheet === 'cond'} onOpenChange={value => setSheet(value ? 'cond' : null)} accepted={accepted}
      title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation}
      explanationLabel={negotiated ? 'Explicación de la propuesta aceptada' : 'Tu nota'}
      onOpenAgreement={() => setSheet('agree')} />
    <AgreementSheet open={sheet === 'agree'} onOpenChange={value => setSheet(value ? 'agree' : null)} processId={process?.id}
      client={business} perspective="customer" accepted={accepted} acceptedAt={acceptedAt} />
    {confirm && <CustomerReceiptDialog action={confirm} busy={operation.busy} message={operation.message} onClose={() => { if (!operation.busy) setConfirm(null); }} onConfirm={() => void submit(confirm)} />}
  </article>;
}
