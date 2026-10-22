import { useId, useState, type ReactNode } from 'react';
import * as React from 'react';
import { ArrowRight, Calendar, Check, ChevronDown, DollarSign, FileText, Hash, Image as ImageIcon, Package, Sparkles } from 'lucide-react';
import type { Proposal, ProposalRead } from './proposalContract';
import OrderReferencePhoto from './OrderReferencePhoto';

const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
const TZ = 'America/Santiago';
const time = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
// Disponibilidad corta para la tabla ("Ahora" / "22 oct · 12:00") y larga para el detalle.
const whenShort = (p: Proposal) => p.subjectSnapshot.needNow || !p.scheduledFor ? 'Ahora'
  : `${new Date(p.scheduledFor).toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')} · ${time(p.scheduledFor)} (Chile)`;
const whenLong = (p: Proposal) => p.subjectSnapshot.needNow || !p.scheduledFor ? 'Lo antes posible'
  : new Intl.DateTimeFormat('es-CL', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(p.scheduledFor));

type Row = { key: string; label: string; value: string };
// Keep each snapshot line and its price basis; never aggregate away a change.
function rowsOf(p: Proposal): Row[] {
  const s = p.subjectSnapshot;
  return [...s.items.flatMap((it, index) => {
    const prefix = s.items.length > 1 ? `${index + 1}. ` : '';
    return [
      ...(s.orderType === 'product' ? [{ key: `qty:${index}`, label: `${prefix}Cantidad`, value: String(it.quantity) }] : []),
      { key: `price:${index}`, label: `${prefix}Precio`, value: it.source === 'CUSTOM' ? `${money(it.subtotalClp)} total de la opción` : `${money(it.unitPriceClpSnapshot!)} por unidad` },
      { key: `name:${index}`, label: `${prefix}${s.orderType === 'service' ? 'Servicio' : 'Producto'}`, value: it.nameSnapshot },
      { key: `desc:${index}`, label: `${prefix}Descripción`, value: it.descriptionSnapshot || 'Sin descripción' },
      ...(s.items.length > 1 ? [{ key: `total:${index}`, label: `${prefix}Total de esta línea`, value: money(it.subtotalClp) }] : []),
    ];
  }), { key: 'when', label: 'Cuándo', value: whenShort(p) }];
}
const ICONS: Record<string, ReactNode> = {
  qty: <Hash />, price: <DollarSign />, total: <DollarSign />, when: <Calendar />, name: <Package />, desc: <FileText />,
};

const MINE = ['Tú pediste', 'Tú propusiste', 'Tú contrapropusiste', 'Tu propuesta final'];
const THEIRS = ['El cliente pidió', 'El negocio responde', 'El cliente contrapone', 'Propuesta final del negocio'];
const CURRENT_HEAD = ['Pedido', 'Propuesta', 'Contrapropuesta', 'Propuesta final'];

/** Botón de vidrio líquido que abre/cierra el detalle. Azul para el pedido (.gp) y turquesa para propuestas (.gt). */
function DetailButton({ kind, open, label, onClick, controls }: { kind: 'gp' | 'gt'; open: boolean; label: string; onClick: () => void; controls: string }) {
  return <button type="button" className={`zipco-glassbtn ${kind}`} data-open={open} aria-expanded={open} aria-controls={controls} onClick={onClick}>
    <span className="zipco-glassbtn-label">{open ? 'Ocultar' : 'Ver'} {label}</span>
    <span className="zipco-glassbtn-arrow"><ChevronDown className="zipco-glassbtn-chev" strokeWidth={3.2} aria-hidden="true" /></span>
  </button>;
}

const PhotoBox = ({ src, proposal, own, business }: { src: string; proposal: Proposal; own: string; business: boolean }) => <div className="mt-2">
  <OrderReferencePhoto compact nestedDialog business={business} src={src}
    title={`Foto del ${own}`} caption={proposal.sequence === 0 ? 'Adjuntada con la solicitud original.' : 'Adjuntada con esta propuesta.'} />
</div>;

// Filas de texto del detalle de una burbuja (pedido o mensaje), sin comparación.
function detailRows(p: Proposal, noteLabel: string): { label: string; value: string }[] {
  const s = p.subjectSnapshot;
  const message = p.sequence === 0 ? s.note : s.proposalMessage;
  return [
    ...rowsOf(p).filter(row => row.key !== 'when').map(({ label, value }) => ({ label, value })),
    { label: 'Disponibilidad', value: whenLong(p) },
    ...(message ? [{ label: noteLabel, value: message }] : []),
  ];
}

// Tabla "antes → propuesta": las filas que cambiaron dentro de un recuadro verde, y lo que se mantuvo en chips.
function CompareTable({ current, previous, mineBefore }: { current: Proposal; previous: Proposal; mineBefore: boolean }) {
  const before = rowsOf(previous);
  const rows = rowsOf(current).map(row => {
    const old = before.find(r => r.key === row.key);
    return { ...row, old: old?.value ?? '—', changed: !old || old.value !== row.value };
  });
  const changed = rows.filter(r => r.changed), kept = rows.filter(r => !r.changed);
  const prevHead = previous.sequence === 0 ? (mineBefore ? 'Pediste' : 'Pidió') : (mineBefore ? 'Tu propuesta' : 'Propuesta anterior');
  return <>
    {changed.length > 0 && <div className="zipco-chat-table" role="table" aria-label="Cambios respecto a la propuesta anterior">
      <span className="zipco-chat-box" aria-hidden="true" style={{ gridRow: `1 / span ${changed.length + 1}` }} />
      <div role="row" className="contents"><span role="columnheader"><span className="sr-only">Aspecto</span></span>
      <span role="columnheader" className="zipco-chat-th">{prevHead}</span>
      <span role="columnheader" className="zipco-chat-th-new"><span className="zipco-chat-pill"><Sparkles aria-hidden="true" />{CURRENT_HEAD[current.sequence]}</span></span></div>
      {changed.map((row, i) => <div key={row.key} role="row" className="contents" style={{ ['--d' as string]: `${i * 90}ms` }}>
        <span className="zipco-chat-cell-l" role="rowheader">{ICONS[row.key.split(':')[0]]}{row.label}</span>
        <span className="zipco-chat-cell-old" role="cell"><s>{row.old}</s></span>
        <span className="zipco-chat-cell-new" role="cell"><span className="zipco-chat-okdot"><Check strokeWidth={3} aria-hidden="true" /></span><span>{row.value}</span></span>
      </div>)}
    </div>}
    {kept.length > 0 && <div className="zipco-chat-kept">
      <span className="zipco-chat-kept-l">Se mantuvo</span>
      {kept.map(row => <span key={row.key} className="zipco-chat-keep" title={row.value}><Check strokeWidth={3} aria-hidden="true" />{row.label === 'Cant.' ? 'Cantidad' : row.label === 'Cuándo' ? 'Disponibilidad' : row.label}</span>)}
    </div>}
    {kept.length > 0 && <details className="zipco-chat-kept-values"><summary>Ver valores conservados</summary>{kept.map(row => <div key={row.key} className="zipco-chat-drow"><span>{row.label}</span><b>{row.value}</b></div>)}</details>}
  </>;
}

function Bubble({ proposal, previous, business }: { proposal: Proposal; previous?: Proposal; business: boolean }) {
  const [open, setOpen] = useState(false); // cerrado por defecto: el botón llama la atención
  const panelId = useId();
  const s = proposal.subjectSnapshot;
  const mine = (proposal.authorActor === 'BUSINESS') === business;
  const label = mine ? MINE[proposal.sequence] : THEIRS[proposal.sequence];
  const title = s.items.length === 1 ? `${s.orderType === 'service' ? '' : `${s.items[0].quantity}× `}${s.items[0].nameSnapshot}` : `${s.items.length} productos`;
  const photo = proposal.sequence === 0 ? s.referencePhoto : s.proposalPhoto;
  const own = proposal.sequence % 2 === 0 ? 'cliente' : 'negocio';
  const isOrder = proposal.sequence === 0;
  const btnLabel = isOrder ? 'detalle del pedido' : 'detalle de la propuesta';
  const kind = isOrder ? 'gp' : 'gt';
  const message = isOrder ? s.note : s.proposalMessage;
  const who = <p className="zipco-chat-who"><span>{label}</span><time dateTime={proposal.createdAt} title={`${day(proposal.createdAt)} · ${time(proposal.createdAt)} (Chile)`}>{time(proposal.createdAt)}</time></p>;
  const pic = photo && <PhotoBox src={photo} proposal={proposal} own={own} business={business} />;

  if (mine) {
    const rows = detailRows(proposal, isOrder ? 'Tu nota' : 'Tu mensaje');
    return <div data-proposal-sequence={proposal.sequence} className="flex flex-col items-end">
      <div className="zipco-chat-mine">
        {who}
        <div className="zipco-chat-headrow">
          <b className="zipco-chat-title">{title}</b><b className="zipco-chat-money">{money(proposal.totalPriceClp)}</b>
          {photo && <span className="zipco-chat-thumb" aria-label="Incluye foto"><ImageIcon aria-hidden="true" /></span>}
        </div>
        <div id={panelId} hidden={!open} className="zipco-chat-detail">
          {rows.map(r => <div key={r.label} className="zipco-chat-drow"><span>{r.label}</span><b>{r.value}</b></div>)}
          {pic}
        </div>
        <DetailButton kind={kind} open={open} label={btnLabel} onClick={() => setOpen(v => !v)} controls={panelId} />
      </div>
    </div>;
  }

  const rows = detailRows(proposal, isOrder ? 'Nota del cliente' : 'Mensaje');
  const diff = previous && rowsOf(proposal).filter(r => { const o = rowsOf(previous).find(x => x.key === r.key); return !o || o.value !== r.value; });
  return <div data-proposal-sequence={proposal.sequence} className="flex flex-col items-start">
    <div className="zipco-chat-theirs">
      {who}
      {message && <p className="zipco-chat-quote">“{message}”</p>}
      <div className="zipco-chat-offer">
        <div className="zipco-chat-offer-top"><b className="zipco-chat-title">{title}</b><span className="zipco-chat-price">{money(proposal.totalPriceClp)}</span></div>
        {!open && (diff && diff.length > 0
          ? <div className="zipco-chat-sum"><span className="zipco-chat-pill static"><Sparkles aria-hidden="true" />{diff.length} {diff.length === 1 ? 'cambio' : 'cambios'}</span>
            {diff.map(r => <span key={r.key} className="zipco-chat-sumchip">{r.label === 'Cant.' ? 'Cantidad' : r.label === 'Precio u.' ? 'Precio' : r.label}</span>)}</div>
          : !previous && <p className="zipco-chat-when">{whenLong(proposal)}</p>)}
        <div id={panelId} hidden={!open}>
          {previous
            ? <CompareTable current={proposal} previous={previous} mineBefore={(previous.authorActor === 'BUSINESS') === business} />
            : <div className="zipco-chat-drows">{rows.map(r => <div key={r.label} className="zipco-chat-drow"><span>{r.label}</span><b>{r.value}</b></div>)}</div>}
        </div>
      </div>
      {open && pic}
      <DetailButton kind={kind} open={open} label={btnLabel} onClick={() => setOpen(v => !v)} controls={panelId} />
    </div>
  </div>;
}

export type ChatTurn = 'mine' | 'wait' | 'closed';

export default function ProposalChat({ read, business, turn, closedText, canCounter }: { read: ProposalRead; business: boolean; turn: ChatTurn; closedText?: string; canCounter?: boolean }) {
  const list = read.proposals;
  return <div data-proposal-comparison className="zipco-chat">
    <p className="text-center"><span className="zipco-chat-date">{day(list[0].createdAt)}</span></p>
    {list.map((proposal, index) => <Bubble key={proposal.id} proposal={proposal} previous={index > 0 ? list[index - 1] : undefined} business={business} />)}
    <div className="zipco-chat-turn" role="status">
      <i /><span data-turn={turn}>{turn === 'mine' ? <><b className="zipco-chat-dot" aria-hidden="true" />Te toca responder</>
        : turn === 'closed' ? (closedText ?? 'La negociación finalizó')
        : <>Esperando la respuesta de la otra parte<ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" /></>}</span><i />
    </div>
    {turn === 'mine' && !business && canCounter && <p className="zipco-chat-ghost">Si haces una contrapropuesta, el negocio podrá hacer <b>1 propuesta final</b>.</p>}
  </div>;
}
