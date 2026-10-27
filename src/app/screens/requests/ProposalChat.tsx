import { useState, type ReactNode } from 'react';
import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Calendar, Check, DollarSign, FileText, Hash, Image as ImageIcon, Maximize2, Package, ShoppingBag, Sparkles, StickyNote, X } from 'lucide-react';
import type { Proposal, ProposalRead } from './proposalContract';
import OrderReferencePhoto from './OrderReferencePhoto';
import ProductPreviewControl from './ProductPreviewControl';
import AvailabilityPlanSummary from './AvailabilityPlanSummary';

const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
const TZ = 'America/Santiago';
const time = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'long' });
// Disponibilidad corta para la tabla ("Ahora" / "22 oct · 12:00") y larga para el detalle.
export const whenShort = (p: Proposal) => p.subjectSnapshot.needNow || !p.scheduledFor ? 'Ahora'
  : `${new Date(p.scheduledFor).toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '')} · ${time(p.scheduledFor)}`;
export const whenLong = (p: Proposal) => p.subjectSnapshot.needNow || !p.scheduledFor ? 'Lo antes posible'
  : new Intl.DateTimeFormat('es-CL', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(p.scheduledFor));

/** Título corto de una propuesta: "2× Producto QA", "Servicio X" o "3 productos". */
export const proposalTitle = (p: Proposal) => {
  const s = p.subjectSnapshot;
  return s.items.length === 1 ? `${s.orderType === 'service' ? '' : `${s.items[0].quantity}× `}${s.items[0].nameSnapshot}` : `${s.items.length} productos`;
};

type Row = { key: string; label: string; value: string; basis?: 'unit' | 'line'; signature?: string };
// Filas comparables. Un solo producto: cantidad, precio, disponibilidad, producto, descripción. Varios: total, disponibilidad, productos.
function rowsOf(p: Proposal): Row[] {
  const s = p.subjectSnapshot;
  return [...s.items.flatMap((it, index): Row[] => {
    const prefix = s.items.length > 1 ? `${index + 1}. ` : '';
    return [
      ...(s.orderType === 'product' ? [{ key: `qty:${index}`, label: `${prefix}Cant.`, value: String(it.quantity) }] : []),
      { key: `price:${index}`, label: `${prefix}${it.source === 'CUSTOM' ? 'Precio total' : 'Precio u.'}`, value: money(it.source === 'CUSTOM' ? it.subtotalClp : it.unitPriceClpSnapshot!), basis: it.source === 'CUSTOM' ? 'line' : 'unit' },
      { key: `name:${index}`, label: `${prefix}${s.orderType === 'service' ? 'Servicio' : 'Producto'}`, value: it.nameSnapshot },
      { key: `desc:${index}`, label: `${prefix}Descripción`, value: it.descriptionSnapshot || 'Sin descripción' },
      ...(s.items.length > 1 ? [{ key: `total:${index}`, label: `${prefix}Total línea`, value: money(it.subtotalClp) }] : []),
    ];
  }), { key: 'when', label: 'Cuándo', value: whenShort(p), signature: p.subjectSnapshot.needNow ? 'IMMEDIATE' : p.scheduledFor! }];
}

export function comparisonRows(current: Proposal, previous: Proposal) {
  const before = rowsOf(previous);
  return rowsOf(current).map(row => {
    const old = before.find(r => r.key === row.key);
    return { ...row, old: old?.value ?? '—', oldBasis: old?.basis,
      changed: !old || old.value !== row.value || old.basis !== row.basis || old.signature !== row.signature };
  });
}
const ICONS: Record<string, ReactNode> = {
  qty: <Hash />, price: <DollarSign />, total: <DollarSign />, when: <Calendar />, name: <Package />, desc: <FileText />,
};

const MINE = ['Tú pediste', 'Tú propusiste', 'Tú contrapropusiste', 'Tu propuesta final'];
const THEIRS = ['El cliente pidió', 'El negocio responde', 'El cliente contrapone', 'Propuesta final del negocio'];
const CURRENT_HEAD = ['Pedido', 'Propuesta', 'Contrapropuesta', 'Propuesta final'];

/** Botón de vidrio líquido que abre el detalle flotante. Azul para el pedido (.gp) y turquesa para propuestas (.gt). */
function DetailButton({ kind, label }: { kind: 'gp' | 'gt'; label: string }) {
  return <Dialog.Trigger asChild>
    <button type="button" className={`zipco-glassbtn ${kind}`} data-open="false" aria-haspopup="dialog">
      <span className="zipco-glassbtn-label">Ver {label}</span>
      <span className="zipco-glassbtn-arrow"><Maximize2 className="zipco-glassbtn-chev" strokeWidth={3} aria-hidden="true" /></span>
    </button>
  </Dialog.Trigger>;
}

/** Botón "Cerrar detalle" al pie de la tarjeta flotante. */
const CloseButton = ({ kind }: { kind: 'gp' | 'gt' }) => <Dialog.Close asChild>
  <button type="button" className={`zipco-glassbtn ${kind}`} data-open="true" style={{ marginTop: 12 }}>
    <span className="zipco-glassbtn-label">Cerrar detalle</span>
    <span className="zipco-glassbtn-arrow"><X className="zipco-glassbtn-chev" strokeWidth={3} aria-hidden="true" /></span>
  </button>
</Dialog.Close>;

/** Tarjeta flotante sobre la pantalla: fondo difuminado y entrada 3D. */
function Sheet({ tone, label, time: at, children, dismiss }: { tone: 'mine' | 'theirs'; label: string; time: string; children: ReactNode; dismiss: () => void }) {
  return <Dialog.Portal>
    <Dialog.Overlay className="zipco-sheet-ov" onPointerDown={event => { if (event.target === event.currentTarget) { event.preventDefault(); event.stopPropagation(); dismiss(); } }} />
    <Dialog.Content data-proposal-sheet className={`zipco-sheet ${tone}`} aria-describedby={undefined}>
      {tone === 'theirs' && <div className="zipco-sheet-lights" aria-hidden="true"><i className="zipco-sheet-blob b1" /><i className="zipco-sheet-blob b2" /></div>}
      <div className="zipco-sheet-in">
        <div className="zipco-sheet-top">
          <Dialog.Title className="zipco-chat-who"><span>{label}</span><time>{at}</time></Dialog.Title>
          <Dialog.Close asChild><button type="button" className="zipco-sheet-x" aria-label="Cerrar detalle"><X aria-hidden="true" strokeWidth={3} /></button></Dialog.Close>
        </div>
        {children}
      </div>
    </Dialog.Content>
  </Dialog.Portal>;
}

const PhotoBox = ({ src, proposal, own, business }: { src: string; proposal: Proposal; own: string; business: boolean }) => <div className="mt-2">
  <OrderReferencePhoto compact nestedDialog viewerZIndex={1201} business={business} src={src}
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
  const rows = comparisonRows(current, previous);
  const changed = rows.filter(r => r.changed), kept = rows.filter(r => !r.changed);
  const prevHead = previous.sequence === 0 ? (mineBefore ? 'Pediste' : 'Pidió') : (mineBefore ? 'Tu propuesta' : 'Propuesta anterior');
  return <>
    {changed.length > 0 && <div className="zipco-chat-table" role="table" aria-label="Cambios respecto a la propuesta anterior">
      <span className="zipco-chat-box" aria-hidden="true" style={{ gridRow: `1 / span ${changed.length + 1}` }} />
      <div role="row" className="contents"><span role="columnheader"><span className="sr-only">Aspecto</span></span>
      <span role="columnheader" className="zipco-chat-th">{prevHead}</span>
      <span role="columnheader" className="zipco-chat-th-new"><span className="zipco-chat-pill"><Sparkles aria-hidden="true" />{CURRENT_HEAD[current.sequence]}</span></span></div>
      {changed.map((row, i) => <div key={row.key} role="row" className="contents" style={{ ['--d' as string]: `${i * 90}ms` }}>
        <span className="zipco-chat-cell-l" role="rowheader">{ICONS[row.key.split(':')[0]]}{row.oldBasis && row.oldBasis !== row.basis ? 'Precio' : row.label}</span>
        <span className="zipco-chat-cell-old" role="cell"><span>{row.old}{row.oldBasis && row.oldBasis !== row.basis && <small className="zipco-chat-sub">{row.oldBasis === 'unit' ? 'Unitario' : 'Total línea'}</small>}</span></span>
        <span className="zipco-chat-cell-new" role="cell"><span className="zipco-chat-okdot"><Check strokeWidth={3} aria-hidden="true" /></span><span>{row.key === 'when' && row.value.includes(' · ') ? <>{row.value.split(' · ')[0]}<small className="zipco-chat-sub">{row.value.split(' · ').slice(1).join(' · ')}</small></> : row.value}{row.basis && row.oldBasis !== row.basis && <small className="zipco-chat-sub">{row.basis === 'unit' ? 'Unitario' : 'Total línea'}</small>}</span></span>
      </div>)}
    </div>}
    {kept.length > 0 && <div className="zipco-chat-kept">
      <span className="zipco-chat-kept-l">Se mantuvo</span>
      {kept.map(row => <span key={row.key} className="zipco-chat-keep"><Check strokeWidth={3} aria-hidden="true" /><span>{row.label === 'Cant.' ? 'Cantidad' : row.label === 'Cuándo' ? 'Disponibilidad' : row.label}: <b>{row.value}</b></span></span>)}
    </div>}
  </>;
}

/** "Tú pediste": tarjeta holograma clara (héroe con precio, baldosas de datos y foto). Solo para el pedido original propio. */
function PedidoSheet({ proposal, label, at, title, pic, dismiss }: { proposal: Proposal; label: string; at: string; title: string; pic: ReactNode; dismiss: () => void }) {
  const s = proposal.subjectSnapshot;
  const sub = s.items.length === 1 ? s.items[0].descriptionSnapshot : s.items.map(it => `${it.quantity}× ${it.nameSnapshot}`).join(' · ');
  return <Dialog.Portal>
    <Dialog.Overlay className="zipco-sheet-ov" onPointerDown={event => { if (event.target === event.currentTarget) { event.preventDefault(); event.stopPropagation(); dismiss(); } }} />
    <Dialog.Content data-proposal-sheet className="zipco-sheet holo" aria-describedby={undefined}>
      <div className="zipco-d-holo-in zipco-d-ped">
        <span className="zipco-d-holo-grid" aria-hidden="true" /><span className="zipco-d-holo-sheen" aria-hidden="true" />
        <div className="zipco-sheet-in">
          <div className="zipco-d-top">
            <Dialog.Title className="zipco-d-who"><span>{label}</span><time>{at}</time></Dialog.Title>
            <Dialog.Close asChild><button type="button" className="zipco-d-x" aria-label="Cerrar detalle"><X aria-hidden="true" strokeWidth={3} /></button></Dialog.Close>
          </div>
          <div className="zipco-d-ped-hero">
            <span className="zipco-d-ped-orb"><ShoppingBag aria-hidden="true" /></span>
            <div className="zipco-d-ped-ttl"><b>{title}</b>{sub && <span>{sub}</span>}</div>
            <b className="zipco-d-ped-price">{money(proposal.totalPriceClp)}</b>
          </div>
           {s.orderType==='product'&&<ProductPreviewControl preview={proposal.productPreview??null} caption={proposal.sequence===0?'PRODUCTO SOLICITADO':'PRODUCTO DE ESTA PROPUESTA'}/>}
          <div className="zipco-d-ped-tiles">
            {s.items.map((item, index) => <div key={index} className="zipco-d-tile" data-original-order-line>
              <span className="zipco-d-tile-ic"><Package aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="zipco-d-tile-v">{s.orderType === 'service' ? '' : `${item.quantity}× `}{item.nameSnapshot}</div>
                {s.items.length > 1 && item.descriptionSnapshot && <p className="whitespace-pre-wrap break-words text-xs text-slate-600">{item.descriptionSnapshot}</p>}
                <p className="text-xs text-slate-600">{typeof item.unitPriceClpSnapshot === 'number' ? `${money(item.unitPriceClpSnapshot)} por unidad · ` : 'Precio total de esta línea · '}{money(item.subtotalClp)}</p>
              </div>
            </div>)}
            <div className="zipco-d-tile"><span className="zipco-d-tile-ic"><Calendar aria-hidden="true" /></span><div><div className="zipco-d-tile-l">Disponibilidad</div><div className="zipco-d-tile-v">{whenLong(proposal)}</div></div></div>
            {s.note && <div className="zipco-d-tile"><span className="zipco-d-tile-ic"><StickyNote aria-hidden="true" /></span><div><div className="zipco-d-tile-l">Tu nota</div><div className="zipco-d-tile-v">{s.note}</div></div></div>}
          </div>
          {proposal.availability&&<AvailabilityPlanSummary plan={proposal.availability}/>}{pic}
          <CloseButton kind="gp" />
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Portal>;
}

function Bubble({ proposal, previous, business }: { proposal: Proposal; previous?: Proposal; business: boolean }) {
  const [open, setOpen] = useState(false);
  const s = proposal.subjectSnapshot;
  const mine = (proposal.authorActor === 'BUSINESS') === business;
  const label = mine ? MINE[proposal.sequence] : THEIRS[proposal.sequence];
  const title = proposalTitle(proposal);
  const photo = proposal.sequence === 0 ? s.referencePhoto : s.proposalPhoto;
  const own = proposal.sequence % 2 === 0 ? 'cliente' : 'negocio';
  const isOrder = proposal.sequence === 0;
  const btnLabel = isOrder ? 'detalle del pedido' : 'detalle de la propuesta';
  const kind = isOrder ? 'gp' : 'gt';
  const message = isOrder ? s.note : s.proposalMessage;
  const at = time(proposal.createdAt);
  const who = <p className="zipco-chat-who"><span>{label}</span><time dateTime={proposal.createdAt}>{at}</time></p>;
  const pic = photo && <PhotoBox src={photo} proposal={proposal} own={own} business={business} />;
  const product=s.orderType==='product'&&<ProductPreviewControl preview={proposal.productPreview??null} caption={proposal.sequence===0?'PRODUCTO SOLICITADO':'PRODUCTO DE ESTA PROPUESTA'}/>;

  if (mine) {
    const rows = detailRows(proposal, isOrder ? 'Tu nota' : 'Tu mensaje');
    return <div data-proposal-sequence={proposal.sequence} className="flex flex-col items-end">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <div className="zipco-chat-mine">
          {who}
          {product}
          <div className="zipco-chat-headrow">
            <b className="zipco-chat-title">{title}</b><b className="zipco-chat-money">{money(proposal.totalPriceClp)}</b>
            {photo && <span className="zipco-chat-thumb" aria-label="Incluye foto"><ImageIcon aria-hidden="true" /></span>}
          </div>
          <DetailButton kind={kind} label={btnLabel} />
        </div>
        {isOrder
          ? <PedidoSheet proposal={proposal} label={label} at={at} title={title} pic={pic} dismiss={() => setOpen(false)} />
          : <Sheet tone="mine" label={label} time={at} dismiss={() => setOpen(false)}>
          <div className="zipco-sheet-head"><b>{title}</b><b className="money">{money(proposal.totalPriceClp)}</b></div>
          {product}
          <div className="zipco-sheet-rows">{rows.map(r => <div key={r.label} className="zipco-chat-drow"><span>{r.label}</span><b>{r.value}</b></div>)}</div>
          {proposal.availability&&<AvailabilityPlanSummary plan={proposal.availability}/>}{pic}
          <CloseButton kind={kind} />
        </Sheet>}
      </Dialog.Root>
    </div>;
  }

  const rows = detailRows(proposal, isOrder ? 'Nota del cliente' : 'Mensaje');
  const diff = previous && comparisonRows(proposal, previous).filter(r => r.changed);
  return <div data-proposal-sequence={proposal.sequence} className="flex flex-col items-start">
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="zipco-chat-theirs">
        {who}
        {product}
        {message && <p className="zipco-chat-quote">“{message}”</p>}
        <div className="zipco-chat-offer">
          <div className="zipco-chat-offer-top"><b className="zipco-chat-title">{title}</b><span className="zipco-chat-price">{money(proposal.totalPriceClp)}</span></div>
          {diff && diff.length > 0
            ? <div className="zipco-chat-sum"><span className="zipco-chat-pill static"><Sparkles aria-hidden="true" />{diff.length} {diff.length === 1 ? 'cambio' : 'cambios'}</span>
              {diff.map(r => <span key={r.key} className="zipco-chat-sumchip">{r.label === 'Cant.' ? 'Cantidad' : r.label === 'Precio u.' ? 'Precio' : r.label}</span>)}</div>
            : !previous && <p className="zipco-chat-when">{whenLong(proposal)}</p>}
        </div>
        <DetailButton kind={kind} label={btnLabel} />
      </div>
      <Sheet tone="theirs" label={label} time={at} dismiss={() => setOpen(false)}>
        {product}
        {message && <p className="zipco-chat-quote big">“{message}”</p>}
        <div className="zipco-chat-offer big">
          <div className="zipco-chat-offer-top"><b className="zipco-chat-title">{title}</b><span className="zipco-chat-price">{money(proposal.totalPriceClp)}</span></div>
          {previous
            ? <CompareTable current={proposal} previous={previous} mineBefore={(previous.authorActor === 'BUSINESS') === business} />
            : <div className="zipco-chat-drows">{rows.map(r => <div key={r.label} className="zipco-chat-drow"><span>{r.label}</span><b>{r.value}</b></div>)}</div>}
        </div>
        {proposal.availability&&<AvailabilityPlanSummary plan={proposal.availability}/>}{pic}
        <CloseButton kind={kind} />
      </Sheet>
    </Dialog.Root>
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
