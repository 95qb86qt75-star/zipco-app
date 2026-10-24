import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronDown, FileCheck, LockKeyhole, Store, User, X } from 'lucide-react';
import { readProposals } from './proposalApi';
import { readCoordinationSession } from './coordinationSession';
import { subscribeCoordinationSession } from './coordinationSession';
import type { AgreementReadDto } from './agreement';
import OrderReferencePhoto from './OrderReferencePhoto';
import { buildTimeline, money, whenOf, type Round, type Timeline, type Perspective } from './agreementTimeline';

/**
 * Hoja "Acuerdo completo" (diseño R, versión V2 aprobada): resumen del acuerdo + línea de tiempo desplegable de cada ronda
 * (pedido original → propuesta → contrapropuesta → final) y quién aceptó. Reemplaza al AcceptedConditionsPanel que antes se
 * expandía debajo de la tarjeta cuando se tocaba "Ver acuerdo completo". Se usa desde la hoja "Condiciones aceptadas"
 * (CTA llamativo) tanto en la tarjeta "Por coordinar" como en la de "En curso / Listo".
 *
 * Datos: las propuestas salen de `readProposals(process.id, session.token, signal)` (mismo contrato que ProposalNegotiation).
 * Si esa lectura no está disponible tras la aceptación (o falla), la hoja NO se rompe: muestra solo la tarjeta resumen
 * (hecha con `accepted`) y un aviso con "Reintentar".
 */
export type AgreementAccepted = AgreementReadDto;
type Load = { status: 'loading' } | { status: 'ready'; timeline: Timeline | null } | { status: 'error' };

const Photo = ({ photo, label }: { photo: unknown; label: string }) => {
  // Validated snapshots use the existing nested photo viewer.
  const url = typeof photo === 'string' ? photo : null;
  return url ? <OrderReferencePhoto src={url} title={label} caption="Imagen adjunta a esta propuesta." nestedDialog compact viewerZIndex={1600} /> : null;
};

function RoundRow({ round, index, open, onToggle, perspective }: { round: Round; index: number; open: boolean; onToggle: () => void; perspective: Perspective }) {
  const kind = round.side === 'client' ? 'c' : 'n';
  const bodyId = `zipco-ag-round-${round.key}`;
  const h = round.headline;
  return <div className="zipco-ag2-r" style={{ animationDelay: `${150 + index * 130}ms` }}>
    <span className={`zipco-ag2-nd ${kind}`}>{round.side === 'client' ? <User size={15} strokeWidth={2.3} aria-hidden="true" /> : <Store size={15} strokeWidth={2.3} aria-hidden="true" />}</span>
    <div className="zipco-ag2-c" style={round.accepted ? { boxShadow: 'inset 0 0 0 1.5px #6ee7b7,0 6px 14px rgba(16,185,129,.18)' } : undefined}>
      <button type="button" className="zipco-ag2-h" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className={`zipco-ag2-who ${kind}`}>{round.label}</span><time>{round.time}</time>
        {round.accepted && <span className="zipco-ag2-ok">Acordada</span>}
        <span className="zipco-ag2-chev" style={open ? { transform: 'rotate(180deg)' } : undefined}><ChevronDown size={15} strokeWidth={2.8} aria-hidden="true" /></span>
      </button>
      {!open && <div className="zipco-ag2-s">
        {h.kind === 'order' && <><b>{h.title}</b> · {h.price} · {h.when}</>}
        {h.kind === 'changes' && h.changes.map((c, i) => <span key={c.label}>{i > 0 && ' · '}{c.label} <s>{c.from}</s> → <b>{c.to}</b></span>)}
        {h.kind === 'same' && 'Sin cambios respecto a la anterior'}
      </div>}
      <div className="zipco-ag2-x" id={bodyId} data-open={open} aria-hidden={!open} {...(!open ? { inert: '' } : {})} style={{ gridTemplateRows: open ? '1fr' : '0fr' }}><div className="zipco-ag2-xi">
        <details className="zipco-ag-details"><summary>Detalle de esta propuesta</summary>
          {h.kind === 'order' && <p>Disponibilidad: {h.when}</p>}
          {h.kind === 'changes' && <div className="zipco-ag2-s">{h.changes.map((c, i) => <span key={c.label}>{i > 0 && ' · '}{c.label} <s>{c.from}</s> → <b>{c.to}</b></span>)}</div>}
          {h.kind === 'same' && <p>Sin cambios respecto a la anterior</p>}
          {round.details.map((line, i) => <p key={i}>{line}</p>)}</details>
        {round.message && <div className={`zipco-ag2-q ${kind}`}>“{round.message}”</div>}
        {round.photo != null && round.photo !== '' && <Photo photo={round.photo} label={index === 0 ? perspective === 'customer' ? 'Tu foto de referencia' : 'Foto de referencia del cliente' : 'Foto de la propuesta'} />}
        {round.kept.length > 0 && <div className="zipco-ag2-k"><i>Se mantuvo</i>{round.kept.map(k => <span key={k}><Check size={9} strokeWidth={3.4} aria-hidden="true" />{k}</span>)}</div>}
      </div></div>
    </div>
  </div>;
}

export default function AgreementSheet({ open, onOpenChange, processId, client, accepted, acceptedAt, perspective = 'business' }: {
  open: boolean; onOpenChange: (open: boolean) => void; processId?: number | null; client: string;
  accepted: AgreementAccepted; acceptedAt?: string | null; perspective?: Perspective;
}) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [loadedKey, setLoadedKey] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [opened, setOpened] = useState<number | null>(null); // null = la última ronda abierta por defecto; -1 = todas cerradas
  useEffect(() => {
    if (!open) return;
    const session = readCoordinationSession();
    if (!processId || !session) { setLoad({ status: 'error' }); return; }
    const controller = new AbortController();
    const unsubscribe = subscribeCoordinationSession(() => { if (readCoordinationSession() !== session) { controller.abort(); setLoad({status:'error'}); onOpenChange(false); } });
    setLoad({ status: 'loading' }); setOpened(null);
    readProposals(processId, session.token, controller.signal)
      .then(read => {
        if (controller.signal.aborted || readCoordinationSession() !== session) return;
        if (read.process.agreementPublicId !== accepted.agreementPublicId || accepted.requestProcessId !== processId) throw new Error('Acuerdo distinto');
        const timeline = buildTimeline(read.proposals, accepted, perspective);
        setLoadedKey(accepted.agreementPublicId); setLoad({ status: 'ready', timeline });
      })
      .catch(error => {
        if (!controller.signal.aborted && readCoordinationSession() === session) {
          setLoad({ status: 'error' });
          if (error?.status === 401) window.dispatchEvent(new Event('zipco-coordination-session-expired'));
        }
      });
    return () => { controller.abort(); unsubscribe(); };
  }, [open, processId, accepted, attempt, perspective]);

  const timeline = load.status === 'ready' && loadedKey === accepted.agreementPublicId ? load.timeline : null;
  // The summary always comes from the immutable agreement, even if history fails.
  const summary = useMemo(() => {
    const items = accepted.subjectSnapshot.items; const one = items.length === 1 ? items[0] : null;
    const asap = accepted.subjectSnapshot.needNow;
    return { title: one ? `${accepted.subjectSnapshot.orderType === 'service' ? '' : `${one.quantity}× `}${one.nameSnapshot}` : `${items.length} productos`, price: money(accepted.totalPriceClp),
      quantity: one?.quantity ?? null, unit: one?.unitPriceClpSnapshot != null ? `${money(one.unitPriceClpSnapshot)} c/u` : null, when: asap ? 'Lo antes posible' : accepted.scheduledFor ? whenOf(accepted.scheduledFor) : 'Sin horario acordado' };
  }, [timeline, accepted]);
  const lastIndex = timeline ? timeline.rounds.length - 1 : 0;
  const current = opened === null ? lastIndex : opened;

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="zipco-ag-bd" />
      <Dialog.Content className="zipco-ag-sheet" aria-describedby={undefined}>
        <Dialog.Close asChild><button type="button" className="zipco-ag-x" aria-label="Cerrar"><X size={17} strokeWidth={2.4} aria-hidden="true" /></button></Dialog.Close>
        <div className="zipco-ag-h"><Dialog.Title asChild><h1>Acuerdo completo</h1></Dialog.Title><p>Así llegaron al acuerdo con {client}.</p></div>
        <div className="zipco-ag-sc">
          <div className="zipco-ag-sum s">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="zipco-ag-seal"><FileCheck size={19} strokeWidth={2.2} aria-hidden="true" /></span>
              <div style={{ minWidth: 0, flex: 1 }}><div className="zipco-ag-k">Acordado</div><div className="zipco-ag-t" style={{ fontSize: 16.5 }}>{summary.title}</div></div>
              <div className="zipco-ag-p" style={{ fontSize: 24 }}>{summary.price}</div>
            </div>
            {timeline && <div className="zipco-ag-who2" style={{ marginTop: 6 }}>{timeline.who}</div>}
            <div className="zipco-ag-chips">
              {summary.quantity !== null && <span>Cant. {summary.quantity}</span>}{summary.unit && <span>{summary.unit}</span>}<span>{summary.when}</span>
              <span><LockKeyhole size={11} strokeWidth={2.6} aria-hidden="true" />Final</span>
            </div>
          </div>

          {(accepted.subjectSnapshot.items.length > 1 || accepted.subjectSnapshot.items.some(item => item.unitPriceClpSnapshot === null)) && <ul className="zipco-ag-items">
            {accepted.subjectSnapshot.items.map((item, i) => <li key={i}><b>{item.quantity}× {item.nameSnapshot}</b><p>{item.descriptionSnapshot}</p>
              <span>{item.unitPriceClpSnapshot === null ? 'Precio total de esta línea' : `${money(item.unitPriceClpSnapshot)} por unidad`} · Subtotal {money(item.subtotalClp)}</span></li>)}
          </ul>}

          {load.status === 'loading' && <p role="status" className="zipco-ag-who2" style={{ margin: '16px 2px 0' }}>Cargando propuestas…</p>}
          {load.status === 'error' && <div className="zipco-ag-err" role="alert">No pudimos cargar el detalle de las propuestas.
            <div><button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div></div>}
          {timeline && <>
            <div className="zipco-ag-sec"><span>{timeline.section}</span><i /><em>{timeline.count}</em></div>
            <div>
              {timeline.rounds.map((round, i) => <RoundRow key={round.key} round={round} index={i} open={current === i} perspective={perspective} onToggle={() => setOpened(current === i ? -1 : i)} />)}
              <div className="zipco-ag2-r e" style={{ animationDelay: '700ms' }}>
                <span className="zipco-ag2-nd g"><Check size={16} strokeWidth={3.4} aria-hidden="true" /></span>
                <div style={{ alignSelf: 'center', fontSize: 13, fontWeight: 800, color: '#047857' }}>{timeline.marker}</div>
              </div>
            </div>
          </>}
          <Dialog.Close asChild><button type="button" className="zipco-ag-cls">Cerrar</button></Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
