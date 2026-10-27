import { Package, Store, User } from 'lucide-react';
import ProductPreviewControl from './ProductPreviewControl';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export function ProgressCardHeader({ business, name, image, price, statusLabel, isUnread = false, ready = false }: {
  business: boolean; name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean; ready?: boolean;
}) {
  const Icon = business ? User : Store;
  return <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
    <ProductPreviewControl fallback={<span className={business ? 'zipco-co-av' : 'zipco-cp-av'}>{image
      ? <ImageWithFallback src={image} alt="" className="h-full w-full rounded-[14px] object-cover" />
      : <Icon size={24} aria-hidden="true" />}</span>}/>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div className="flex items-center gap-1.5" style={{ fontSize: 17, lineHeight: 1.15, fontWeight: 800 }}><span className="truncate">{name}</span>
        {isUnread && <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">Nueva</span>}</div>
      <div style={{ marginTop: 5 }}><span className={business ? 'zipco-co-pill' : 'zipco-cp-pill'}><i style={{background: ready ? '#10b981' : '#14b8a6'}} />{statusLabel}</span></div>
    </div>
    <div style={{ textAlign: 'right', minWidth: 88, flexShrink: 0 }}>
      <div style={{ fontSize: 23, lineHeight: 1, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: business ? undefined : '#047857' }}>
        {price === null ? <span aria-label="Total pendiente de verificación" className="inline-block h-6 w-20 rounded-md bg-current opacity-15" /> : `$${price.toLocaleString('es-CL')}`}
      </div>
      <div style={{ marginTop: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', color: business ? '#d5dbe5' : '#64748b' }}>ACORDADO</div>
    </div>
  </div>;
}

export default function ProgressCardShell({ id, business, name, image, statusLabel, isUnread, retry, error }: {
  id: number; business: boolean; name: string; image?: string; statusLabel: string; isUnread?: boolean; retry: () => void; error?: string;
}) {
  return <article id={`order-${id}`} tabIndex={0} aria-label={`${name}: verificando condiciones aceptadas`} aria-busy={!error}
    className={`${business ? 'zipco-co-dk zipco-ec-dk' : 'zipco-cp'} scroll-mb-36`} data-coordination-motion="idle">
    <ProgressCardHeader business={business} name={name} image={image} statusLabel={statusLabel} isUnread={isUnread} price={null} />
    <button type="button" className="zipco-co-colrow" data-folded="true" disabled style={{ marginTop: 12 }}>
      <span className="nd" aria-hidden="true"><Package size={16} /></span><span className="tx"><b>Verificando condiciones…</b><small>Espera un momento</small></span>
    </button>
    {error && <div role="alert" className="mt-3 text-sm"><p>{error}</p><button type="button" onClick={retry} className="mt-2 min-h-11 rounded-xl border px-3 py-2 font-bold">Reintentar condiciones</button></div>}
  </article>;
}
