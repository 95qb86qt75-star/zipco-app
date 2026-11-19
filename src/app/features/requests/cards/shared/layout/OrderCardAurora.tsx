import * as React from 'react';
import { Check, ChevronDown, Clock, Clock3, Send, User } from 'lucide-react';
import { DetailReveal } from './DetailReveal';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import { ImageWithFallback } from "../../../../../components/figma/ImageWithFallback";

// Cabecera "Aurora nocturna" compartida por todos los estados del pedido.
// Solo presentación: el estado y las acciones siguen en ProcessOrderCard / ProposalNegotiation.

// Datos opcionales del detalle de la contrapropuesta. Todo viene del pedido real; esta tarjeta solo los presenta.
export type AuroraCounterDetail = { schedule?: string | null; note?: string | null; reference?: React.ReactNode; expanded?: boolean; onToggle?: () => void };

// Ícono genérico de «el cliente respondió» (burbuja con flecha de respuesta). No indica qué cambió en la contrapropuesta.
function ReplyGlyph({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="m10 7-3 3 3 3" /><path d="M17 13v-1a2 2 0 0 0-2-2H7" />
  </svg>;
}

// Tarjeta del NEGOCIO con una contrapropuesta por responder (maqueta aprobada: tablero NegW4, variante A «Pulso», Aurora Pro).
// Solo presentación: el botón «Revisar propuesta y responder» (ProposalNegotiation) sigue siendo el real y va debajo, en ProcessOrderCard.
// El detalle es local a la tarjeta (no cambia el estado del pedido ni dispara llamadas).
function AuroraCounterHeader({ name, image, price, statusLabel, summaryText, isUnread, priceLabel, items, detail }: {
  name: string; image?: string | null; price: number | null; statusLabel: string; summaryText?: string; isUnread: boolean;
  priceLabel: string; items?: Array<{ name: string; quantity: number }>; detail?: AuroraCounterDetail;
}) {
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = detail?.expanded ?? localOpen;
  const toggleDetail = () => { if (detail?.onToggle) detail.onToggle(); else setLocalOpen(value => !value); };
  const panel = React.useId();
  const hasDetail = Boolean(detail && (detail.schedule || detail.note || detail.reference));
  const avatar = <span className="zipco-aurora-avatar" aria-hidden={image ? undefined : true}>
    {image ? <ImageWithFallback src={image} alt={name || 'Pedido'} className="h-full w-full object-cover" /> : <User className="h-[23px] w-[23px]" strokeWidth={1.8} />}
  </span>;
  return <div className="zipco-aurora-bz" data-open={open}>
    <div className="zipco-aurora-bz-pa" onClick={event => {
      if (!hasDetail || (event.target as Element).closest('button,a,input,select,textarea,[role="button"],[role="dialog"]') || window.getSelection()?.toString()) return;
      event.stopPropagation(); toggleDetail();
    }}>
      {/* Radar de respuesta pendiente: ondas finitas alrededor de la miniatura real (cuadrada). */}
      <div className="zipco-aurora-bz-radar">
        <u aria-hidden="true" /><u aria-hidden="true" /><u aria-hidden="true" />
        <span className="zipco-aurora-bz-th">
          <ProductPreviewControl fallback={avatar} />
        </span>
        <span className="zipco-aurora-bz-badge" aria-hidden="true"><ReplyGlyph size={13} /></span>
      </div>
      <div className="zipco-aurora-bz-t">
        <div className="flex items-center gap-1.5">
          <small className="zipco-aurora-bz-who">Cliente</small>
          {isUnread && <span className="rounded-full bg-sky-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950">Nueva</span>}
        </div>
        <h4 className="zipco-aurora-bz-name">{name || 'Pedido'}</h4>
        <span role="status" className="zipco-aurora-bz-eb"><span className="zipco-aurora-dot" aria-hidden="true" />{statusLabel}</span>
      </div>
      <div className="zipco-aurora-bz-pr">
        <div className="zipco-aurora-pricebox min-w-0 text-right">
          <p className="zipco-aurora-price zipco-aurora-bz-price">{price === null ? '—' : `$${price.toLocaleString('es-CL')}`}</p>
          <p className="zipco-aurora-bz-pl">{priceLabel}</p>
        </div>
        {hasDetail && <button type="button" className="zipco-aurora-bz-cb" aria-expanded={open} aria-controls={panel}
          aria-label={open ? 'Ocultar detalle del pedido' : 'Ver detalle del pedido'}
          onClick={event => { event.stopPropagation(); toggleDetail(); }}><ChevronDown className="zipco-aurora-bz-chv" size={18} strokeWidth={2.5} aria-hidden="true" /></button>}
      </div>
    </div>
    {hasDetail && detail && <DetailReveal expanded={open}><div id={panel} className="zipco-aurora-bz-dt">
      {detail.schedule && <dl className="zipco-aurora-bz-rows"><div><span className="i" aria-hidden="true"><Clock3 size={14} strokeWidth={2.3} /></span><span><dt>Pedido para</dt><dd>{detail.schedule}</dd></span></div></dl>}
      {detail.note && <p className="zipco-aurora-bz-dnote"><b>Nota:</b> {detail.note}</p>}
      {detail.reference && <div className="zipco-aurora-bz-ref">{detail.reference}</div>}
    </div></DetailReveal>}
    {items && items.length > 0 && <div className="zipco-aurora-bz-lines">
      {items.map((item, index) => <p key={index} className="break-words"><strong>{item.quantity}x</strong> {item.name}</p>)}
    </div>}
    {summaryText && <div className="zipco-aurora-bz-note">
      <span className="zipco-aurora-bz-ic" aria-hidden="true"><ReplyGlyph size={17} /></span>
      <p>
        <b>El cliente respondió con una <mark>contrapropuesta</mark></b>
        <span>Te toca responder. {summaryText}</span>
      </p>
    </div>}
  </div>;
}

// Cabecera "Aurora nocturna" compartida por todos los estados del pedido.
// Solo presentación: el estado y las acciones siguen en ProcessOrderCard / ProposalNegotiation.
export function AuroraProposalHeader({ name, image, price, statusLabel, summaryText, isUnread = false, priceLabel = 'Vigente', items, variant = 'default', detail }: {
  name: string; image?: string | null; price: number | null; statusLabel: string; summaryText?: string; isUnread?: boolean;
  priceLabel?: string; items?: Array<{ name: string; quantity: number }>;
  // Variante visual opcional. Sin ella el resultado es idéntico al de siempre. «counter»: solo la tarjeta del negocio con una contrapropuesta por responder (aviso genérico: el tipo de cambio no está conectado a esta tarjeta).
  // «waiting»: solo la tarjeta del CLIENTE que ya envió su contrapropuesta y espera al negocio (no muestra acciones de responder).
  variant?: 'default' | 'counter' | 'waiting';
  // Solo «counter»: datos del pedido para el detalle plegable (pedido para, nota del cliente y foto de referencia real). Sin ellos no hay botón de detalle y la tarjeta queda como siempre.
  detail?: AuroraCounterDetail;
}) {
  if (variant === 'counter') return <AuroraCounterHeader name={name} image={image} price={price} statusLabel={statusLabel} summaryText={summaryText} isUnread={isUnread} priceLabel={priceLabel} items={items} detail={detail} />;
  if (variant === 'waiting') {
    const avatar = <span className="zipco-aurora-avatar" aria-hidden={image ? undefined : true}>
      {image ? <ImageWithFallback src={image} alt={name || 'Negocio'} className="h-full w-full object-cover" /> : <User className="h-[23px] w-[23px]" strokeWidth={1.8} />}
    </span>;
    const steps = ['Pediste', 'Negocio propuso', 'Contrapropusiste'];
    return <div className="zipco-aurora-wt">
      <span className="zipco-aurora-wt-rim" aria-hidden="true" />
      <span role="status" className="zipco-aurora-wt-eb"><Clock aria-hidden="true" />{statusLabel}</span>
      <div className="zipco-aurora-wt-id">
        <ProductPreviewControl fallback={avatar} />
        <div className="min-w-0 flex-1">
          <small className="zipco-aurora-wt-who">Negocio</small>
          <div className="flex items-center gap-1.5">
            <h4 className="zipco-aurora-wt-name">{name || 'Negocio'}</h4>
            {isUnread && <span className="rounded-full bg-sky-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950">Nueva</span>}
          </div>
        </div>
        <div className="zipco-aurora-pricebox min-w-0 text-right">
          <p className="zipco-aurora-price zipco-aurora-wt-price">{price === null ? '—' : `$${price.toLocaleString('es-CL')}`}</p>
          <p className="zipco-aurora-wt-pl">{priceLabel}</p>
        </div>
      </div>
      <ol className="zipco-aurora-wt-st" aria-label="Avance de la negociación">
        {steps.map(step => <li key={step}><i aria-hidden="true"><Check /></i><span>{step === 'Contrapropusiste' ? <>Contra<wbr />propusiste</> : step}</span></li>)}
        <li className="is-now"><i aria-hidden="true"><Clock /></i><span>Negocio responde<span className="sr-only"> (pendiente)</span><em className="zipco-aurora-wt-dots" aria-hidden="true"><u /><u /><u /></em></span></li>
      </ol>
      <div className="zipco-aurora-wt-note">
        <span className="zipco-aurora-wt-ic" aria-hidden="true"><Send /></span>
        <p>
          <b>Enviaste tu <mark>contrapropuesta</mark></b>
          <span>Espera la respuesta del negocio. No tienes que responder otra vez.</span>
        </p>
      </div>
    </div>;
  }
  return <div>
    <div className="zipco-aurora-header">
      <ProductPreviewControl fallback={<span className="zipco-aurora-avatar" aria-hidden={image ? undefined : true}>
        {image ? <ImageWithFallback src={image} alt={name || 'Pedido'} className="h-full w-full object-cover" /> : <User className="h-[23px] w-[23px]" strokeWidth={1.8} />}
      </span>}/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="line-clamp-2 break-words text-[17px] font-black leading-tight tracking-[-0.01em] text-white">{name || 'Pedido'}</h4>
          {isUnread && <span className="rounded-full bg-sky-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950">Nueva</span>}
        </div>
        <span role="status" className="zipco-aurora-chip mt-1">
          <span className="zipco-aurora-dot" aria-hidden="true" />{statusLabel}
        </span>
      </div>
      <div className="zipco-aurora-pricebox min-w-0 text-right">
        <p className="zipco-aurora-price text-[25px] font-black leading-none tabular-nums text-white">{price === null ? '—' : `$${price.toLocaleString('es-CL')}`}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-300">{priceLabel}</p>
      </div>
    </div>
    {items && items.length > 0 && <div className="mt-3 space-y-1 text-xs text-slate-200">
      {items.map((item, index) => <p key={index} className="break-words"><strong>{item.quantity}x</strong> {item.name}</p>)}
    </div>}
    {summaryText && <p className="mt-3 text-[12.5px] leading-snug text-slate-300">{summaryText}</p>}
  </div>;
}
