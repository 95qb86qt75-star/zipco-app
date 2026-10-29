import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import AvailabilityPostActions from './AvailabilityPostActions';
import { availabilityFlow, CONTACT_COPY } from './availabilityContract';
import { Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, LockKeyhole, Trash2 } from 'lucide-react';
import { CoordinationCardHeader } from './CoordinationCardShell';
import type { BusinessRequest, MyOrder } from './types';
import { ANNUL_REASONS, contactAuthorized, coordinationAllowed, type AnnulReason, type CoordinationAction } from './coordinationApi';
import useCoordination from './useCoordination';
import WhatsAppMark from './WhatsAppMark';
import { AnnulSheet, ConditionsSheet, StartWorkSheet, type AcceptedSummary } from './CoordinationSheets';
import { BUTTON_SPARKS, LINE_SPARKS, RAIL_SPARKS } from './coordinationSparks';
import useCoordinationMotion from './useCoordinationMotion';
import { announceAction } from './ActionHologram';
import { readCoordinationSession } from './coordinationSession';
import { clearWhatsappReturn,dismissWhatsappReturn,whatsappReturnKey } from './whatsappReturn';
import useStartWorkPrompt from './useStartWorkPrompt';
import AgreementSheet from './AgreementSheet';

/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
const LOAD_MS = 3900;          // la línea y el botón "cargan" ~3,9 s hasta desbloquear el paso 3
const LOAD_MS_REDUCED = 500;   // prefers-reduced-motion
const TZ = 'America/Santiago';
const when = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '')} · ${date.toLocaleTimeString('es-CL', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })}`;
};
const vars = (values: Record<string, string | number>) => Object.fromEntries(Object.entries(values).map(([k, v]) => [`--${k}`, v])) as CSSProperties;

const Sparks = () => <span className="zipco-co-us" aria-hidden="true">{BUTTON_SPARKS.map(([x, y, c, s], i) => <i key={i} style={vars({ x: `${x}px`, y: `${y}px`, c, s })} />)}</span>;
const Step = ({ className = '', node, children }: { className?: string; node: ReactNode; children: ReactNode }) =>
  <div className={`zipco-co-st ${className}`.trim()}>{node}<div className="zipco-co-sb">{children}</div></div>;

export default function BusinessCoordinationCard({ order, business = true, name, image, price, statusLabel, isUnread = false, negotiated, acceptedAt, accepted,
  conditionsTitle, conditionsSubtitle, conditionsWhen, conditionsSummary, explanation, onInspect, refresh, notificationOpen = 0 }: {
  order: BusinessRequest | MyOrder; business?: boolean; name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean;
  /** true for a negotiated agreement; false for the accepted original order. */
  negotiated: boolean; acceptedAt?: string | null; accepted: AcceptedSummary;
  conditionsTitle: string; conditionsSubtitle: string; conditionsWhen: string; conditionsSummary: string; explanation?: string | null;
  onInspect?: () => void; refresh: () => void;
  notificationOpen?: number;
}) {
  const [latest, setLatest] = useState<BusinessRequest | MyOrder | null>(null);
  const current = latest?.requestProcess && latest.requestProcess.id === order.requestProcess?.id &&
    latest.requestProcess.agreementPublicId === order.requestProcess?.agreementPublicId &&
    latest.requestProcess.version > (order.requestProcess?.version ?? 0) ? latest : order;
  const process = current.requestProcess;
  const cardSession=useRef(readCoordinationSession());
  const currentStatus = useRef({ process, business });
  currentStatus.current = { process, business };
  const operation = useCoordination(current, business, refresh, 'coordination-steps');
  const [sheet, setSheet] = useState<'cond' | 'anul' | 'start' | 'agree' | null>(null);
  const motionRef = useCoordinationMotion(sheet !== null);
  const [folded, setFolded] = useState(notificationOpen === 0);
  useEffect(() => { if (notificationOpen > 0) setFolded(false); }, [notificationOpen]);
  const [deferred, setDeferred] = useState(false);
  const [reason, setReason] = useState<AnnulReason>('COORDINATION_NOT_REACHED');
  const [detail, setDetail] = useState('');
  const authorized = contactAuthorized(process, business);
  type Phase = 'idle' | 'requesting' | 'loading' | 'ready';
  const [animationPhase, setPhase] = useState<Phase>(authorized ? 'ready' : 'idle');
  const phase = authorized ? animationPhase === 'loading' ? 'loading' : 'ready'
    : animationPhase === 'requesting' && operation.busy ? 'requesting' : 'idle';
  const [fresh, setFresh] = useState(false); // true = el negocio autorizó en ESTA sesión (con animación); false = ya venía autorizado
  const timer = useRef<number | undefined>(undefined);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);
  const requestLock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; window.clearTimeout(timer.current); window.clearTimeout(feedbackTimer.current); }; }, []);

  const allowed = (action: CoordinationAction) => current.recordState === 'available' && coordinationAllowed(process, business, action);
  const run = (action: CoordinationAction) => operation.run(action, reason, detail);
  const pending = operation.pending();
  const recoveryOnly = operation.needsUpdate || operation.storageWarning() || operation.restored();
  const counterpartPending = process?.coordination?.[business ? 'customerContactAuthorized' : 'businessContactAuthorized'] === false;
  const canOpen = allowed('OPEN_WHATSAPP');
  const client = name || (business ? 'el cliente' : 'el negocio');
  const returnKey = business ? whatsappReturnKey(current) : null;
  const canStart = business && readCoordinationSession()===cardSession.current && process?.state === 'COORDINATING' && allowed('START_WORK');
  const releaseStart = useStartWorkPrompt({key:returnKey,enabled:canStart,
    blocked:sheet!==null||operation.busy||Boolean(recoveryOnly)||Boolean(pending)||phase==='loading'||phase==='requesting',
    onOpen:()=>setSheet(value=>value??'start'),onInvalidate:()=>setSheet(value=>value==='start'?null:value)});
  useEffect(()=>{if(sheet==='start'&&!canStart&&!operation.busy){releaseStart();setSheet(null);}},[sheet,canStart,operation.busy]);
  useEffect(()=>{
    const root=motionRef.current;if(!root)return;
    const row=root.querySelector<HTMLButtonElement>('.zipco-co-colrow');
    if(folded&&root.querySelector('.zipco-co-fb')?.contains(document.activeElement))row?.focus({preventScroll:true});
    else if(!folded&&document.activeElement===row)root.querySelector<HTMLButtonElement>('.zipco-co-strip2')?.focus({preventScroll:true});
  },[folded]);
  const startLock = useRef(false);
  const closeStart = () => { if(operation.busy)return; if(returnKey)dismissWhatsappReturn(returnKey);releaseStart();setSheet(null); };
  const start = async () => {
    if(startLock.current||!canStart||operation.busy||recoveryOnly||pending)return;
    startLock.current=true;
    try{ if(await run('START_WORK')){if(returnKey)clearWhatsappReturn(returnKey);releaseStart();if(mounted.current)setSheet(null);} }
    finally{startLock.current=false;}
  };

  // Consent and navigation remain separate. No local unlock substitutes for server consent.
  const unlock = async () => {
    if (requestLock.current || phase !== 'idle' || operation.busy || !allowed('AUTHORIZE_CONTACT') || recoveryOnly || pending) return;
    requestLock.current = true;
    setPhase('requesting');
    let ok = false;
    try { ok = await run('AUTHORIZE_CONTACT'); } finally { requestLock.current = false; }
    if (!mounted.current) return;
    const verified = operation.currentOrder();
    if (!ok || !verified || verified.id !== order.id || verified.requestProcess?.id !== process?.id ||
      verified.requestProcess?.agreementPublicId !== process?.agreementPublicId || !contactAuthorized(verified.requestProcess, business)) {
      setPhase('idle'); setFresh(false); return;
    }
    setLatest(verified); setFresh(true); setPhase('loading');
    window.clearTimeout(timer.current);
    window.clearTimeout(feedbackTimer.current);
    const session = readCoordinationSession();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => {
      if (!mounted.current || readCoordinationSession() !== session) return;
      setPhase('ready');
      feedbackTimer.current = window.setTimeout(() => {
        const current = currentStatus.current;
        if (mounted.current && readCoordinationSession() === session && current.business === business &&
          current.process?.id === verified.requestProcess!.id && current.process.agreementPublicId === verified.requestProcess!.agreementPublicId &&
          contactAuthorized(current.process, business))
          announceAction('authorized', { key: `${business}:${verified.requestProcess!.id}:${verified.requestProcess!.version}:AUTHORIZE_CONTACT` });
      }, reduced ? 0 : 2900);
    }, reduced ? LOAD_MS_REDUCED : LOAD_MS);
  };
  const go = async () => {
    if (operation.busy || !authorized || phase !== 'ready' || !canOpen || recoveryOnly || pending) return;
    window.clearTimeout(feedbackTimer.current);
    await run('OPEN_WHATSAPP');
  };
  const annul = async () => {
    if (operation.busy || !allowed('ANNUL_COORDINATION') || recoveryOnly || pending) return;
    window.clearTimeout(feedbackTimer.current);
    if (await run('ANNUL_COORDINATION') && mounted.current) { setSheet(null); setDetail(''); }
  };

  const step2Done = authorized;
  const waLabel = 'Iniciar coordinación por WhatsApp';
  return <article ref={motionRef} data-coordination-motion="idle" id={`order-${order.id}`} tabIndex={0} data-unread={isUnread} data-aurora-state={process?.state} data-coordination-role={business ? 'business' : 'customer'}
    aria-label={`${client}: coordinación pendiente`} className="zipco-co-dk scroll-mb-36"
    onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.currentTarget.classList.remove('zipco-notification-target'); onInspect?.(); setFolded(value => !value); } }}
    onClick={event => { event.currentTarget.classList.remove('zipco-notification-target'); event.stopPropagation(); }}>
    <span className="zipco-co-a1" aria-hidden="true" /><span className="zipco-co-a2" aria-hidden="true" />
    <div style={{ position: 'relative' }}>
      <CoordinationCardHeader name={client} image={image} price={price} statusLabel={statusLabel} isUnread={isUnread}/>

      <div className="zipco-co-fb" data-folded={folded} aria-hidden={folded} {...(folded?{inert:''}:{})}><div className="zipco-co-fb-in">
      <button type="button" className="zipco-co-strip2" aria-haspopup="dialog" onClick={() => { onInspect?.(); setSheet('cond'); }}>
        <span className="zipco-co-strip2-ic"><CircleCheck size={16} strokeWidth={2.3} aria-hidden="true" /></span>
        <span style={{ minWidth: 0 }}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{conditionsSummary}</div></span>
        <span className="zipco-co-strip2-go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true" /></span>
      </button>

      <section className="zipco-co-co2" aria-label="Acciones de coordinación">
        <div className="zipco-co-co2-top">
          <span className="zipco-co-co2-orb"><Check size={24} strokeWidth={3} aria-hidden="true" /></span>
          <div style={{ minWidth: 0 }}>
            <div className="zipco-co-co2-t">{negotiated ? 'Propuesta aceptada' : 'Pedido aceptado'} · <span style={{ color: '#5eead4' }}>{client}</span></div>
            <div className="zipco-co-co2-s">Todo listo para coordinar el pedido.</div>
          </div>
        </div>

        {operation.message && <p role="alert" className="zipco-co-co2-p" style={{ marginTop: 12 }}>{operation.message}</p>}

        {recoveryOnly ? <div className="zipco-co-steps">
          <p role="alert" className="zipco-co-co2-p" style={{ margin: 0 }}>{operation.storageWarning() || (operation.restored()
            ? 'Se recuperó una operación anterior. Actualiza su estado antes de reintentar.' : 'La operación ya fue confirmada. Actualiza el estado sin repetirla.')}</p>
          <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>
        </div> : pending ? <div className="zipco-co-steps">
          <p className="zipco-co-co2-p" style={{ margin: 0 }}>Hay una operación pendiente de confirmación. Reintenta con las mismas condiciones antes de realizar otra acción.</p>
          <button type="button" className="zipco-co-go2" style={{ marginTop: 10 }} disabled={operation.busy} onClick={() => void operation.retry()}>Reintentar operación pendiente</button>
        </div> : <div className="zipco-co-steps">
          <Step className="done" node={<span className="zipco-co-sd"><Check size={13} strokeWidth={3.4} aria-hidden="true" /></span>}>
            <div className="zipco-co-sl">{negotiated ? 'Propuesta aceptada' : 'Pedido aceptado'}</div>
            {acceptedAt && <div className="zipco-co-sm">{when(acceptedAt)}</div>}
          </Step>

          {!step2Done ? <Step node={<span className="zipco-co-sd on">2</span>}>
            {!business && deferred ? <button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={() => setDeferred(false)}>Revisar autorización de contacto</button> : <>
            <div className="zipco-co-wrapb"><Sparks />
              <button type="button" className={business ? 'zipco-co-go glowup' : 'zipco-contact-consent'} style={{ marginTop: 0 }} disabled={operation.busy || !allowed('AUTHORIZE_CONTACT')} onClick={() => void unlock()}>
                <span className={business ? 'zipco-co-wi' : 'zipco-contact-consent-icon'}><WhatsAppMark className="h-[22px] w-[22px]" /></span><span>{phase === 'requesting' ? 'Autorizando contacto…' : business ? 'Autorizo comenzar coordinación' : 'Autorizo iniciar coordinación'}</span>
              </button>
            </div>
            <div className="zipco-co-sm" style={{ marginTop: 6 }}>{availabilityFlow(process) ? CONTACT_COPY : <>Autorizas compartir con {client} el teléfono de tu perfil solo para este pedido. El consentimiento {business ? 'del cliente' : 'del negocio'} es independiente.</>}</div>
            {!business && <button type="button" className="zipco-co-go2 zipco-co-defer" disabled={operation.busy} onClick={() => setDeferred(true)}>Ahora no</button>}
            </>}
            {!allowed('AUTHORIZE_CONTACT') && <button type="button" className="zipco-co-lnk" disabled={operation.busy} onClick={() => void operation.update()}>Actualizar estado</button>}
          </Step> : fresh ? <div className="zipco-co-st vstep">
            <span className="zipco-co-vl" aria-hidden="true"><b />{LINE_SPARKS.map(([c, d, t, dx, dy, s], i) => <i key={i} style={vars({ c, d: `${d}s`, t: `${t}s`, dx: `${dx}px`, dy: `${dy}px`, s })} />)}</span>
            <span className="zipco-co-sd donepop"><Check size={13} strokeWidth={3.4} aria-hidden="true" /></span>
            <div className="zipco-co-sb"><div className="zipco-co-sl">Coordinación autorizada</div><div className="zipco-co-sm">{business ? 'El cliente' : 'El negocio'} podrá contactarte por WhatsApp</div></div>
          </div> : <Step className="done" node={<span className="zipco-co-sd"><Check size={13} strokeWidth={3.4} aria-hidden="true" /></span>}>
            <div className="zipco-co-sl">Coordinación autorizada</div><div className="zipco-co-sm">{business ? 'El cliente' : 'El negocio'} podrá contactarte por WhatsApp</div>
          </Step>}

          <Step className="last" node={phase === 'ready'
            ? <span className="zipco-co-sd on zipco-co-sdpulse">3</span>
            : <span className="zipco-co-sd"><LockKeyhole size={12} strokeWidth={2.6} aria-hidden="true" /></span>}>
            {(phase === 'idle' || phase === 'requesting') && <><button type="button" className="zipco-co-go2 lock" disabled><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true" /><span>{waLabel}</span></button>
              <div className="zipco-co-sm" style={{ marginTop: 6 }}>Se activa al autorizar el contacto.</div></>}
            {phase === 'loading' && <><div className="zipco-co-wrapb">
              <button type="button" className="zipco-co-ld dk" disabled aria-busy="true">
                <span className="zipco-co-ld-l zipco-co-ld-dim"><LockKeyhole size={17} strokeWidth={2.4} aria-hidden="true" />{waLabel}</span>
                <span className="zipco-co-ld-l zipco-co-ld-fill d"><span className="zipco-co-wi0"><WhatsAppMark className="h-5 w-5" /></span>{waLabel}</span>
              </button>
              <span className="zipco-co-rail d" aria-hidden="true"><b />{RAIL_SPARKS.map(([c, d, t, dx, dy, s, top], i) => <i key={i} style={{ ...vars({ c, d: `${d}s`, t: `${t}s`, dx: `${dx}px`, dy: `${dy}px`, s }), top }} />)}</span>
            </div><div className="zipco-co-sm" style={{ marginTop: 6 }} role="status">Preparando WhatsApp…</div></>}
            {phase === 'ready' && <><div className="zipco-co-wrapb">{canOpen && <Sparks />}
              <button type="button" className={`zipco-co-go glowup${fresh ? ' swell' : ''}`} style={{ marginTop: 0 }} disabled={operation.busy || !canOpen} onClick={() => void go()}>
                <span className="zipco-co-wi"><WhatsAppMark className="h-[22px] w-[22px]" /></span><span>{waLabel}</span>
              </button>
            </div><div className="zipco-co-sm" style={{ marginTop: 6 }}>{canOpen ? `Acuerda los detalles de pago y ${accepted.subjectSnapshot.orderType === 'service' ? 'realización del servicio' : 'entrega'} con ${client}.` : counterpartPending ? `Esperando autorización de contacto ${business ? 'del cliente' : 'del negocio'}.` : 'Actualiza el pedido para continuar.'}</div></>}
          </Step>
        </div>}

        <p className="zipco-co-sm">ZIPCO no procesa ni verifica pagos.</p>
        {allowed('ANNUL_COORDINATION') && !recoveryOnly && !pending && <div className="zipco-co-lks">
          <button type="button" className="zipco-co-lk rose" disabled={operation.busy} onClick={() => setSheet('anul')}><Trash2 size={14} strokeWidth={2.3} aria-hidden="true" />Anular solicitud</button>
        </div>}
        {availabilityFlow(process) && <AvailabilityPostActions order={order} business={business} refresh={refresh}/>}
        <button type="button" className="zipco-co-fold" aria-expanded={true} onClick={() => setFolded(true)}><ChevronUp size={16} strokeWidth={2.8} aria-hidden="true" />Ocultar tarjeta</button>
        {operation.busy && phase !== 'loading' && <p role="status" className="zipco-co-co2-p">Actualizando pedido…</p>}
      </section>
      </div></div>
      <button type="button" className="zipco-co-colrow" data-folded={folded} aria-hidden={!folded} tabIndex={folded?0:-1} aria-expanded={!folded} onClick={() => { onInspect?.(); setFolded(false); }}
        style={{ ['--att' as string]: phase === 'loading' ? 0 : 1 }}>
        <span className="nd" aria-hidden="true">{phase === 'idle' ? '2' : '3'}</span>
        <span className="tx">
          <b>{phase === 'idle' ? 'Autorizar contacto' : phase === 'loading' ? 'Preparando WhatsApp…' : 'Ya puedes coordinar por WhatsApp'}</b>
          <small>{phase === 'idle' ? 'Falta tu acción · toca para abrir' : phase === 'loading' ? 'Paso 3 de 3 · un momento' : 'Paso 3 de 3 · listo para iniciar'}</small>
        </span>
        <span className="chev"><ChevronDown size={15} strokeWidth={2.8} aria-hidden="true" /><span className="sr-only">Mostrar coordinación</span></span>
      </button>
    </div>

    <ConditionsSheet open={sheet === 'cond'} onOpenChange={value => setSheet(value ? 'cond' : null)} accepted={accepted}
      title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation}
      explanationLabel={negotiated ? 'Explicación de la propuesta aceptada' : 'Nota del cliente'}
      fullAgreement={business} onOpenAgreement={() => setSheet('agree')} />
    <AgreementSheet open={sheet === 'agree'} onOpenChange={value => setSheet(value ? 'agree' : null)} processId={process?.id}
      perspective={business ? 'business' : 'customer'} client={client} accepted={accepted} acceptedAt={acceptedAt} />
    <AnnulSheet open={sheet === 'anul'} onOpenChange={value => setSheet(value ? 'anul' : null)} busy={operation.busy}
      reasons={Object.entries(ANNUL_REASONS) as Array<[string, string]>} reason={reason} onReason={value => { setReason(value as AnnulReason); setDetail(''); }}
      detail={detail} onDetail={setDetail} onConfirm={() => void annul()} />
    {business&&<StartWorkSheet open={sheet==='start'&&canStart} onOpenChange={value=>{if(!value)closeStart();}}
      busy={operation.busy} client={client} service={accepted.subjectSnapshot.orderType==='service'} error={operation.message}
      recovery={recoveryOnly?<button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>
        :pending?<button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button>:undefined}
      onConfirm={()=>void start()}/>}
  </article>;
}
