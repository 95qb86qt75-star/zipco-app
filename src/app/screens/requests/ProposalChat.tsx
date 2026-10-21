import { ArrowRight, Check } from 'lucide-react';
import type { Proposal, ProposalRead } from './proposalContract';
import OrderReferencePhoto from './OrderReferencePhoto';

const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
const time = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: 'numeric', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'long', year: 'numeric' });
const when = (p: Proposal) => p.subjectSnapshot.needNow || !p.scheduledFor ? 'Lo antes posible'
  : new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(p.scheduledFor));

type Row = { key: string; label: string; value: string };
// Preserve every snapshot line, including its description and price basis.
function rowsOf(p: Proposal): Row[] {
  const s = p.subjectSnapshot;
  return [...s.items.flatMap((it, index) => {
    const prefix = s.items.length > 1 ? `${index + 1}. ` : '';
    return [
      { key: `name-${index}`, label: `${prefix}${s.orderType === 'service' ? 'Servicio' : 'Producto'}`, value: it.nameSnapshot },
      { key: `description-${index}`, label: `${prefix}Descripción`, value: it.descriptionSnapshot || 'Sin descripción' },
      ...(s.orderType === 'product' ? [{ key: `qty-${index}`, label: `${prefix}Cantidad`, value: String(it.quantity) }] : []),
      { key: `price-${index}`, label: `${prefix}Precio`, value: it.source === 'CUSTOM' ? `${money(it.subtotalClp)} total de la opción` : `${money(it.unitPriceClpSnapshot!)} por unidad` },
      ...(s.items.length > 1 ? [{ key: `subtotal-${index}`, label: `${prefix}Total de esta línea`, value: money(it.subtotalClp) }] : []),
    ];
  }), { key: 'when', label: 'Disponibilidad', value: when(p) }];
}

const Ticket = ({ changed }: { changed: boolean }) => <span className="zipco-chat-tk" data-kind={changed ? 'chg' : 'keep'}>
  <Check className="h-[9px] w-[9px]" strokeWidth={3.4} aria-hidden="true" />{changed ? 'Cambió' : 'Se mantuvo'}
</span>;

function Diff({ current, previous }: { current: Proposal; previous?: Proposal }) {
  const before = previous ? rowsOf(previous) : [], now = rowsOf(current);
  const rows = now.map(row => {
    const old = before.find(r => r.key === row.key && r.label === row.label);
    return { ...row, old: old?.value, changed: Boolean(previous && (!old || old.value !== row.value)) };
  }).sort((a, b) => Number(b.changed) - Number(a.changed));
  return <div className="zipco-chat-rows" aria-label={previous ? 'Cambios respecto a la propuesta anterior' : 'Detalle de la solicitud original'}>
    {rows.map(row => <div key={row.key} className="zipco-chat-row" data-kind={row.changed ? 'chg' : 'keep'}>
      <div className="flex flex-wrap items-center justify-between gap-1.5"><span className="zipco-chat-row-label">{row.label}</span>{previous && <Ticket changed={row.changed} />}</div>
      <div className="mt-0.5 break-words text-[12.5px]">{row.changed && row.old ? <><s className="opacity-55">{row.old}</s> <span aria-hidden="true">→</span> <b>{row.value}</b></> : <b>{row.value}</b>}</div>
    </div>)}
  </div>;
}

const MINE = ['Tú pediste', 'Tú propusiste', 'Tú contrapropusiste', 'Tu propuesta final'];
const THEIRS_BUSINESS_VIEWER = ['El cliente pidió', 'El negocio responde', 'El cliente contrapropone', 'Propuesta final del negocio'];

function Bubble({ proposal, previous, business }: { proposal: Proposal; previous?: Proposal; business: boolean }) {
  const s = proposal.subjectSnapshot;
  const mine = (proposal.authorActor === 'BUSINESS') === business;
  const label = mine ? MINE[proposal.sequence] : THEIRS_BUSINESS_VIEWER[proposal.sequence];
  const title = s.items.length === 1 ? `${s.orderType === 'service' ? '' : `${s.items[0].quantity}× `}${s.items[0].nameSnapshot}` : `${s.items.length} productos`;
  const message = proposal.sequence === 0 ? s.note : s.proposalMessage;
  const photo = proposal.sequence === 0 ? s.referencePhoto : s.proposalPhoto;
  const own = proposal.sequence % 2 === 0 ? 'cliente' : 'negocio';
  return <div data-proposal-sequence={proposal.sequence} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
    <div className={`${mine ? 'zipco-chat-mine' : 'zipco-chat-theirs'} max-w-[92%]`}>
      <p className="zipco-chat-who">{label}</p>
      {mine ? <>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3"><b className="min-w-0 break-words text-[15px]">{title}</b><b className="text-[17px] tabular-nums">{money(proposal.totalPriceClp)}</b></div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-xs opacity-85">{when(proposal)}{message ? ` · “${message}”` : ''}</p>
        <details className="mt-2"><summary className="min-h-11 cursor-pointer text-xs font-bold">Ver detalle</summary><Diff current={proposal} previous={previous} /></details>
      </> : <>
        {message && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-snug">“{message}”</p>}
        <div className="zipco-chat-offer">
          <div className="flex flex-wrap items-end justify-between gap-2"><b className="min-w-0 break-words text-[15px]">{title}</b><span className="zipco-chat-price">{money(proposal.totalPriceClp)}</span></div>
          <Diff current={proposal} previous={previous} />
        </div>
      </>}
      {photo && <div className="mt-2.5"><OrderReferencePhoto src={photo} business={business} nestedDialog title={`Foto del ${own}`} caption={proposal.sequence === 0 ? 'Adjuntada con la solicitud original.' : 'Adjuntada con esta propuesta.'} /></div>}
    </div>
    <p className="mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">{day(proposal.createdAt)} · {time(proposal.createdAt)} (Chile)</p>
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
    {turn === 'mine' && !business && canCounter && <p className="zipco-chat-ghost">Aquí aparecerá tu respuesta. Si haces una contrapropuesta, el negocio podrá hacer <b>1 propuesta final</b>.</p>}
  </div>;
}
