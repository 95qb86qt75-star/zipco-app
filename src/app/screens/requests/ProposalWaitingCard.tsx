import { Check, ChevronDown, ChevronUp, Clock3, Hourglass, Calendar, UserRound } from 'lucide-react';
import type { BusinessRequest, MyOrder } from './types';
import OrderReferencePhoto from './OrderReferencePhoto';
import { safePhoto } from './agreement';
import { formatDeliverySchedule } from './utils';
import ProposalNegotiation from './ProposalNegotiation';
import './proposal-waiting.css';

const TZ = 'America/Santiago';
const valid = (iso?: string | null): iso is string => !!iso && Number.isFinite(Date.parse(iso));
const hour = (iso: string) => new Intl.DateTimeFormat('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const parts = (iso: string) => {
  const f = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(new Date(iso));
  const get = (t: string) => (f.find(p => p.type === t)?.value ?? '').replace('.', '');
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return { wd: cap(get('weekday')), day: get('day'), mon: get('month') };
};
// «Mié 28 oct»
const dateShort = (iso: string) => { const p = parts(iso); return `${p.wd} ${p.day} ${p.mon}`; };
// «Mié 28 oct · 19:30»
const dateTime = (iso: string) => `${dateShort(iso)} · ${hour(iso)}`;

/** Tarjeta del NEGOCIO mientras espera la respuesta del cliente a su propuesta (maqueta aprobada: variante B). */
export default function ProposalWaitingCard({ order, expanded, onToggle, isUnread = false, refresh }: {
  order: BusinessRequest | MyOrder; expanded: boolean; onToggle: () => void; isUnread?: boolean; refresh: () => void;
}) {
  const p = order.requestProcess;
  if (!p) return null;
  const name = ('customerName' in order ? order.customerName : order.businessName) || 'Cliente';
  const final = p.state === 'AWAITING_CUSTOMER_FINAL_DECISION';
  const price = p.proposalSummary?.totalPriceClp ?? null;
  const proposed = p.proposalSummary?.scheduledFor ?? null;
  const late = p.lateInitialResponse;
  const original = valid(late?.scheduledFor) ? dateTime(late!.scheduledFor) : formatDeliverySchedule(order, 'business');
  const stillNeeded = late?.status === 'STILL_NEEDED';
  const pt = valid(proposed) ? parts(proposed) : null;
  return <article id={`order-${order.id}`} tabIndex={0} data-proposal-waiting={p.state} data-unread={isUnread}
    className="zipco-wait-card scroll-mb-36" aria-label={`${name}: esperando la respuesta del cliente`}>
    <header className="zipco-wait-header">
      <span className="zipco-wait-avatar"><UserRound size={20} /></span>
      <div><p>SOLICITUD DE CLIENTE</p><h3>{name}</h3></div>
      {price !== null && <div className="zipco-wait-price"><strong>${price.toLocaleString('es-CL')}</strong><small>PROPUESTO</small></div>}
    </header>
    <div className="zipco-wait-panel">
      {pt ? <span className="zipco-wait-cal" aria-hidden="true"><small>{pt.wd.toUpperCase()}</small><b>{pt.day}</b><i>{pt.mon.toUpperCase()}</i></span>
        : <span className="zipco-wait-ring zipco-wait-ring--big" aria-hidden="true"><Hourglass size={22} /></span>}
      <div className="zipco-wait-info">
        <strong className="zipco-wait-badge">ESPERANDO AL CLIENTE</strong>
        {valid(proposed) && <p className="zipco-wait-time"><b>{hour(proposed)}</b><em>nueva hora</em></p>}
        <p className="zipco-wait-sub">{valid(proposed) ? (final ? 'Tu propuesta final de fecha y hora' : 'Tú propusiste esta fecha y hora') : final ? 'Tu propuesta final' : 'Tu propuesta'}</p>
        {valid(proposed) && original && <p className="zipco-wait-before">Antes <s>{original}</s></p>}
      </div>
      {pt && <span className="zipco-wait-ring" aria-hidden="true"><Hourglass size={18} /></span>}
    </div>
    {expanded && <div className="zipco-wait-details">
      {stillNeeded && <p className="zipco-wait-ok"><Check size={14} />El cliente confirmó que aún lo necesita</p>}
      {order.products.state === 'available' && order.products.items.map((item, i) => <p className="zipco-wait-product" key={i}>
        <span><b>{item.quantity}×</b> {item.name}</span><strong>${(item.price * item.quantity).toLocaleString('es-CL')}</strong></p>)}
      {order.note && <p className="zipco-wait-note">{order.note}</p>}
      {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business />}
      <dl>
        {original && <div><dt><Clock3 size={14} />Hora original</dt><dd>{original}</dd></div>}
        {valid(proposed) && <div><dt><Calendar size={14} />Nueva hora propuesta</dt><dd>{dateTime(proposed)}</dd></div>}
      </dl>
      <p className="zipco-wait-help">Mientras el cliente no responda, no necesitas hacer nada.</p>
      <ProposalNegotiation order={order} business refresh={refresh} variant="aurora" reviewLabel="Ver conversación del pedido"/>
    </div>}
    <button type="button" className="zipco-wait-disclosure" aria-expanded={expanded} onClick={onToggle}>
      {expanded ? 'Ocultar detalle' : 'Ver detalle'}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
    </button>
  </article>;
}
