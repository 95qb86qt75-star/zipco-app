import { User } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

// Cabecera "Aurora nocturna" compartida por todos los estados del pedido.
// Solo presentación: el estado y las acciones siguen en ProcessOrderCard / ProposalNegotiation.
export function AuroraProposalHeader({ name, image, price, statusLabel, summaryText, isUnread = false, priceLabel = 'Vigente', items }: {
  name: string; image?: string | null; price: number | null; statusLabel: string; summaryText?: string; isUnread?: boolean;
  priceLabel?: string; items?: Array<{ name: string; quantity: number }>;
}) {
  return <div>
    <div className="zipco-aurora-header">
      <span className="zipco-aurora-avatar" aria-hidden={image ? undefined : true}>
        {image ? <ImageWithFallback src={image} alt={name || 'Pedido'} className="h-full w-full object-cover" /> : <User className="h-[23px] w-[23px]" strokeWidth={1.8} />}
      </span>
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
