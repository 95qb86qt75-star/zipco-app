import * as React from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Banknote, Check, ChevronDown, ChevronUp, Clock3, Hand, Hourglass, Calendar, Info, Tag, UserRound } from 'lucide-react';
import type { BusinessRequest, MyOrder } from "../../../domain/types";
import OrderReferencePhoto from "../../../shared/photos/OrderReferencePhoto";
import { safePhoto } from "../../../domain/agreement";
import { formatDeliverySchedule } from "../../../domain/utils";
import ProposalNegotiation from "../../../forms/proposal/ProposalNegotiation";
import "./proposal-waiting.css";
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";

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

/** Presentación de la propuesta: negocio espera, cliente revisa y responde. */
export default function ProposalWaitingCard({ order, business = true, expanded, onToggle, isUnread = false, refresh }: {
  order: BusinessRequest | MyOrder; business?:boolean; expanded: boolean; onToggle: () => void; isUnread?: boolean; refresh: () => void;
}) {
  const p = order.requestProcess;
  if (!p) return null;
  const name = ('customerName' in order ? order.customerName : order.businessName) || (business ? 'Cliente' : 'Negocio');
  const final = p.state === 'AWAITING_CUSTOMER_FINAL_DECISION';
  const price = p.proposalSummary?.totalPriceClp ?? null;
  const proposed = p.proposalSummary?.scheduledFor ?? null;
  const late = p.lateInitialResponse;
  const original = valid(late?.scheduledFor) ? dateTime(late!.scheduledFor) : formatDeliverySchedule(order, business ? 'business' : 'customer');
  const stillNeeded = late?.status === 'STILL_NEEDED';
  const pt = valid(proposed) ? parts(proposed) : null;
  if (!business) {
    // Presentación del CLIENTE (rediseño). El markup del negocio queda intacto más abajo.
    const sub = valid(proposed)
      ? (final ? 'El negocio propone esta fecha y hora final' : 'El negocio te propone esta fecha y hora')
      : final ? 'El negocio te envió su propuesta final' : 'El negocio te envió una propuesta';
    return <article id={`order-${order.id}`} tabIndex={0} data-proposal-waiting={p.state} data-unread={isUnread}
      className="zipco-wait-card zipco-pw scroll-mb-36" data-proposal-role="customer" aria-label={`${name}: propuesta por responder`}>
      <div className="zipco-pw-top">
        <span className="zipco-pw-eyebrow"><i aria-hidden="true" />PROPUESTA DEL NEGOCIO</span>
        <button type="button" className="zipco-pw-toggle" aria-expanded={expanded} onClick={onToggle}>
          <span className="zipco-pw-hand" aria-hidden="true"><Hand size={20} strokeWidth={2} /></span>
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}
          <span className="zipco-pw-chev" aria-hidden="true"><ChevronDown size={16} /></span>
        </button>
      </div>
      <div className="zipco-pw-id">
        <span className="zipco-pw-th"><ProductPreviewControl /></span>
        <div className="zipco-pw-nm"><small>NEGOCIO</small><h3>{name}</h3></div>
        {price !== null && <div className="zipco-pw-pr"><strong>${price.toLocaleString('es-CL')}</strong><small>PROPUESTO</small></div>}
      </div>
      <div className="zipco-pw-panel">
        {pt ? <span className="zipco-wait-cal" aria-hidden="true"><small>{pt.wd.toUpperCase()}</small><b>{pt.day}</b><i>{pt.mon.toUpperCase()}</i></span>
          : <span className="zipco-pw-ring" aria-hidden="true"><Tag size={22} /></span>}
        <div className="zipco-pw-info">
          <strong className="zipco-pw-badge" data-final={final || undefined}>{final ? 'PROPUESTA FINAL' : 'POR RESPONDER'}</strong>
          {valid(proposed) && <p className="zipco-pw-time"><b>{hour(proposed)}</b><em>nueva hora</em></p>}
          <p className="zipco-pw-sub">{sub}</p>
          {valid(proposed) && original && <p className="zipco-pw-before">Antes <s>{original}</s></p>}
        </div>
      </div>
      {expanded && <div className="zipco-wait-details">
        {order.products.state === 'available' && order.products.items.map((item, i) => <p className="zipco-wait-product" key={i}>
          <span><b>{item.quantity}×</b> {item.name}</span><strong>${(item.price * item.quantity).toLocaleString('es-CL')}</strong></p>)}
        {order.note && <p className="zipco-wait-note">{order.note}</p>}
        {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business={false} />}
        <dl>
          {original && <div><dt><Clock3 size={14} />Hora original</dt><dd>{original}</dd></div>}
          {valid(proposed) && <div><dt><Calendar size={14} />Nueva hora propuesta</dt><dd>{dateTime(proposed)}</dd></div>}
        </dl>
        <p className="zipco-wait-help">Revisa la solicitud original y las condiciones propuestas antes de responder.</p>
      </div>}
      <ProposalNegotiation order={order} refresh={refresh} variant="aurora" reviewLabel="Revisar historial y responder" customerEntryActions/>
    </article>;
  }
  // NEGOCIO + propuesta final enviada: tarjeta nueva (Aurora, comparación Original → Tu propuesta).
  // Cualquier otro estado del negocio conserva el markup anterior, sin cambios.
  if (business && final) {
    return <BusinessFinalWaiting order={order} name={name} price={price} proposed={proposed} original={original}
      stillNeeded={stillNeeded} expanded={expanded} onToggle={onToggle} isUnread={isUnread} refresh={refresh} />;
  }
  return <article id={`order-${order.id}`} tabIndex={0} data-proposal-waiting={p.state} data-unread={isUnread}
    className="zipco-wait-card scroll-mb-36" data-proposal-role={business?'business':'customer'} aria-label={`${name}: ${business?'esperando la respuesta del cliente':'propuesta por responder'}`}>
    <header className="zipco-wait-header">
      <ProductPreviewControl fallback={<span className="zipco-wait-avatar"><UserRound size={20} /></span>}/>
      <div><p>{business?'SOLICITUD DE CLIENTE':'PROPUESTA DEL NEGOCIO'}</p><h3>{name}</h3></div>
      {price !== null && <div className="zipco-wait-price"><strong>${price.toLocaleString('es-CL')}</strong><small>PROPUESTO</small></div>}
    </header>
    <div className="zipco-wait-panel">
      {pt ? <span className="zipco-wait-cal" aria-hidden="true"><small>{pt.wd.toUpperCase()}</small><b>{pt.day}</b><i>{pt.mon.toUpperCase()}</i></span>
        : <span className="zipco-wait-ring zipco-wait-ring--big" aria-hidden="true"><Hourglass size={22} /></span>}
      <div className="zipco-wait-info">
        <strong className="zipco-wait-badge">{business?'ESPERANDO AL CLIENTE':final?'PROPUESTA FINAL':'POR RESPONDER'}</strong>
        {valid(proposed) && <p className="zipco-wait-time"><b>{hour(proposed)}</b><em>nueva hora</em></p>}
        <p className="zipco-wait-sub">{business
          ? valid(proposed) ? (final ? 'Tu propuesta final de fecha y hora' : 'Tú propusiste esta fecha y hora') : final ? 'Tu propuesta final' : 'Tu propuesta'
          : valid(proposed) ? (final ? 'El negocio propone esta fecha y hora final' : 'El negocio te propone esta fecha y hora') : final ? 'El negocio te envió su propuesta final' : 'El negocio te envió una propuesta'}</p>
        {valid(proposed) && original && <p className="zipco-wait-before">Antes <s>{original}</s></p>}
      </div>
      {pt && <span className="zipco-wait-ring" aria-hidden="true"><Hourglass size={18} /></span>}
    </div>
    {expanded && <div className="zipco-wait-details">
      {stillNeeded && business && <p className="zipco-wait-ok"><Check size={14} />El cliente confirmó que aún lo necesita</p>}
      {order.products.state === 'available' && order.products.items.map((item, i) => <p className="zipco-wait-product" key={i}>
        <span><b>{item.quantity}×</b> {item.name}</span><strong>${(item.price * item.quantity).toLocaleString('es-CL')}</strong></p>)}
      {order.note && <p className="zipco-wait-note">{order.note}</p>}
      {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business={business} />}
      <dl>
        {original && <div><dt><Clock3 size={14} />Hora original</dt><dd>{original}</dd></div>}
        {valid(proposed) && <div><dt><Calendar size={14} />Nueva hora propuesta</dt><dd>{dateTime(proposed)}</dd></div>}
      </dl>
      <p className="zipco-wait-help">{business?'Mientras el cliente no responda, no necesitas hacer nada.':'Revisa la solicitud original y las condiciones propuestas antes de responder.'}</p>
      {business&&<ProposalNegotiation order={order} business refresh={refresh} variant="aurora" reviewLabel="Ver conversación del pedido"/>}
    </div>}
    <button type="button" className="zipco-wait-disclosure" aria-expanded={expanded} onClick={onToggle}>
      {expanded ? 'Ocultar detalle' : 'Ver detalle'}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
    </button>
    {!business&&<ProposalNegotiation order={order} refresh={refresh} variant="aurora" reviewLabel="Revisar historial y responder" customerEntryActions/>}
  </article>;
}


const money = (n: number) => `$${n.toLocaleString('es-CL')}`;
const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** Cuenta de `from` a `to` una sola vez; con movimiento reducido muestra el valor final al tiro. */
function useCountUp(from: number, to: number, delay = 500, ms = 1000) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [v, setV] = React.useState(() => (reduceMotion() ? to : from));
  React.useEffect(() => {
    const element = ref.current;
    if (!element || from === to) { setV(to); return; }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, elapsed = 0, last = 0, done = false;
    const paused = () => document.hidden || !!element.closest('[data-request-motion="idle"], [data-request-list-hidden="true"]');
    const step = (t: number) => {
      if (paused()) { raf = 0; last = 0; return; }
      if (last) elapsed += t - last;
      last = t;
      const k = Math.min(1, Math.max(0, (elapsed - delay) / ms));
      setV(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
      else { done = true; raf = 0; }
    };
    const sync = () => {
      if (media.matches) { cancelAnimationFrame(raf); raf = 0; done = true; setV(to); }
      else if (paused()) { cancelAnimationFrame(raf); raf = 0; last = 0; }
      else if (!done && !raf) raf = requestAnimationFrame(step);
    };
    const observer = new MutationObserver(sync);
    for (let parent: HTMLElement | null = element.parentElement; parent; parent = parent.parentElement)
      observer.observe(parent, { attributes: true, attributeFilter: ['data-request-motion', 'data-request-list-hidden'] });
    setV(from);
    sync();
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, [from, to, delay, ms]);
  return { ref, value: v };
}
function AnimatedMoney({ from, to, delta = false }: { from: number; to: number; delta?: boolean }) {
  const { ref, value } = useCountUp(from, to, delta ? 1100 : 500, delta ? 600 : 1000);
  return <span ref={ref}>{money(value)}</span>;
}
const Spark = ({ className, style }: { className?: string; style?: React.CSSProperties }) =>
  <svg className={className} style={style} width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5c.7 5.6 3.4 8.3 9 9-5.6.7-8.3 3.4-9 9-.7-5.6-3.4-8.3-9-9 5.6-.7 8.3-3.4 9-9z" /></svg>;
const Sand = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M5 2h14M5 22h14M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4A2 2 0 0 0 17 6.2V2M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22" />
  <path className="zipco-bf-tp" d="M8.6 4h6.8L12 10z" fill="currentColor" stroke="none" /><path className="zipco-bf-bt" d="M12 14l4.2 6H7.8z" fill="currentColor" stroke="none" /></svg>;

/** Tarjeta exterior del NEGOCIO tras enviar la propuesta final (AWAITING_CUSTOMER_FINAL_DECISION).
 *  El importe es PROPUESTO (no es acuerdo ni pago). Los productos del detalle son los de la solicitud
 *  ORIGINAL: aquí no se muestran como si fueran los finales (esos viven en la conversación). */
function BusinessFinalWaiting({ order, name, price, proposed, original, stillNeeded, expanded, onToggle, isUnread, refresh }: {
  order: BusinessRequest | MyOrder; name: string; price: number | null; proposed: string | null; original?: string | null;
  stillNeeded: boolean; expanded: boolean; onToggle: () => void; isUnread: boolean; refresh: () => void;
}) {
  const panel = React.useRef<HTMLDivElement>(null);
  const items = order.products.state === 'available' ? order.products.items : [];
  const originalTotal = order.products.state === 'available' ? items.reduce((s, i) => s + i.price * i.quantity, 0) : null;
  const delta = price !== null && originalTotal !== null ? price - originalTotal : null;
  const time = valid(proposed) ? hour(proposed) : null;
  const detailId = `zipco-bf-detail-${order.id}`;
  const tilt = (e: React.PointerEvent) => {
    const el = panel.current;
    if (!el || reduceMotion() || document.hidden || e.currentTarget.closest('[data-request-motion="idle"], [data-request-list-scrolling="true"]') || (e.target as HTMLElement).closest('button, a, input')) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty('--rx', `${(0.5 - y) * 6}deg`); el.style.setProperty('--ry', `${(x - 0.5) * 6}deg`);
    el.style.setProperty('--gx', `${x * 100}%`); el.style.setProperty('--gy', `${y * 100}%`); el.style.setProperty('--go', '1');
  };
  const untilt = () => ['--rx', '--ry', '--go'].forEach(k => panel.current?.style.removeProperty(k));
  return <article id={`order-${order.id}`} tabIndex={0} data-proposal-waiting="AWAITING_CUSTOMER_FINAL_DECISION" data-unread={isUnread}
    data-proposal-role="business" className="zipco-bf scroll-mb-36" aria-label={`${name}: esperando la decisión del cliente sobre tu propuesta final`}
    onPointerMove={tilt} onPointerDown={tilt} onPointerUp={untilt} onPointerLeave={untilt} onPointerCancel={untilt}>
    <span className="zipco-bf-glow zipco-bf-glow--a" aria-hidden="true" /><span className="zipco-bf-glow zipco-bf-glow--b" aria-hidden="true" />
    <header className="zipco-bf-head">
      <span className="zipco-bf-th"><ProductPreviewControl fallback={<span className="zipco-bf-avatar"><UserRound size={20} /></span>} /></span>
      <div className="zipco-bf-id"><p>SOLICITUD DE CLIENTE</p><h3>{name}</h3>
        <span className="zipco-bf-pill"><Sand />ESPERANDO DECISIÓN DEL CLIENTE</span></div>
    </header>
    <div className="zipco-bf-cmp">
      <div className="zipco-bf-o">
        <p className="zipco-bf-k">ORIGINAL</p>
        {original && <p className="zipco-bf-row"><Clock3 size={13} aria-hidden="true" /><s>{original}</s></p>}
        {originalTotal !== null && <p className="zipco-bf-row"><Banknote size={13} aria-hidden="true" /><s>{money(originalTotal)}</s></p>}
      </div>
      <div className="zipco-bf-lk" aria-hidden="true"><i /><b /><u /><u /><u /><ArrowRight size={16} strokeWidth={2.6} /></div>
      <div className="zipco-bf-p" ref={panel}><div className="zipco-bf-in">
        <Spark className="zipco-bf-sp" style={{ top: 5, right: 8, '--d': '.3' } as React.CSSProperties} />
        <p className="zipco-bf-k zipco-bf-k--p"><span className="zipco-bf-stamp" aria-hidden="true"><Check size={11} strokeWidth={3.6} /></span>TU PROPUESTA</p>
        {price !== null && <p className="zipco-bf-am" aria-label={`Importe propuesto ${money(price)}`}><AnimatedMoney from={originalTotal ?? price} to={price}/></p>}
        {delta !== null && delta !== 0 && <span className="zipco-bf-delta">{delta > 0 ? <ArrowUp size={11} strokeWidth={3} aria-hidden="true" /> : <ArrowDown size={11} strokeWidth={3} aria-hidden="true" />}<AnimatedMoney from={0} to={Math.abs(delta)} delta/> {delta > 0 ? 'más' : 'menos'}</span>}
        <div className="zipco-bf-pt">
          {time ? <><span className="zipco-bf-flip" role="img" aria-label={`Hora propuesta ${time}, hora de Chile`}>
            {[...time].map((c, i) => <i key={i} aria-hidden="true" data-sep={c === ':' || undefined} style={{ '--i': i } as React.CSSProperties}>{c}</i>)}</span>
            <span>{dateShort(proposed!)}</span></>
            : <span className="zipco-bf-nohour"><Hourglass size={13} aria-hidden="true" />Hora por definir</span>}
        </div>
      </div></div>
    </div>
    <div className="zipco-bf-wl" aria-hidden="true"><i /></div>
    <button type="button" className="zipco-bf-disclosure" aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>
      {expanded ? 'Ocultar detalle' : 'Ver detalle'}<ChevronDown size={16} aria-hidden="true" />
    </button>
    {expanded && <div className="zipco-bf-details" id={detailId}>
      {stillNeeded && <p className="zipco-wait-ok"><Check size={14} />El cliente confirmó que aún lo necesita</p>}
      <section className="zipco-bf-sec zipco-bf-sec--prop">
        <h4>TU PROPUESTA FINAL <span className="zipco-bf-tag">PROPUESTA</span></h4>
        <dl>
          {valid(proposed) && <div><dt>Fecha y hora</dt><dd>{dateTime(proposed)} (Chile)</dd></div>}
          {price !== null && <div><dt>Importe propuesto</dt><dd><b>{money(price)}</b></dd></div>}
        </dl>
        <p className="zipco-bf-info"><Info size={14} aria-hidden="true" /><span>Aún no es un acuerdo ni un pago. Los productos y cantidades de esta propuesta están en la conversación del pedido.</span></p>
      </section>
      <section className="zipco-bf-sec zipco-bf-sec--orig">
        <h4>SOLICITUD ORIGINAL <span>NO ES LA PROPUESTA</span></h4>
        {items.map((item, i) => <p className="zipco-bf-prow" key={i}><span><b>{item.quantity}×</b> {item.name}</span><span>{money(item.price * item.quantity)}</span></p>)}
        {originalTotal !== null && items.length > 0 && <p className="zipco-bf-prow zipco-bf-prow--tot"><span>Total original</span><span>{money(originalTotal)}</span></p>}
        {order.note && <p className="zipco-bf-note">{order.note}</p>}
        {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business />}
        {original && <dl><div><dt><Clock3 size={14} />Hora original</dt><dd>{original}</dd></div></dl>}
      </section>
      <p className="zipco-bf-help">Mientras el cliente no responda, no necesitas hacer nada.</p>
      <div className="zipco-bf-conv"><ProposalNegotiation order={order} business refresh={refresh} variant="aurora" reviewLabel="Ver conversación del pedido" /></div>
    </div>}
  </article>;
}
