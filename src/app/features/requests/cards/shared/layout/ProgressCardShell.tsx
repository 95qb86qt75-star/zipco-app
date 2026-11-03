import * as React from 'react';
import { ChevronDown, Package, Store, User } from 'lucide-react';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import { ImageWithFallback } from "../../../../../components/figma/ImageWithFallback";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";

/** Elementos propios que NO deben plegar la tarjeta al tocar la cabecera (solo variante business-progress). */
const OWN_CLICK='button,a,input,textarea,select,summary,[role="button"],[role="tab"],[role="dialog"]';

/** Manita animada decorativa de «Ver detalle» / fila de estado (tarjeta del negocio en curso). */
export function ProgressTapHand() {
  return <svg width="24" height="28" viewBox="0 -5 24 29" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g className="zipco-bp-w1"><path d="M6.2 1.2a3.4 3.4 0 0 1 3.6 0" /></g><g className="zipco-bp-w2"><path d="M4.2 -1.4a6.6 6.6 0 0 1 7.6 0" /></g><path d="M10 9.5V4a2 2 0 0 0-4 0v10" /><path d="M14 10V9a2 2 0 0 0-4 0v1" /><path d="M18 11v-1a2 2 0 0 0-4 0v1" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>;
}


export function ProgressCardHeader({ business, name, image, price, statusLabel, isUnread = false, ready = false, variant, folded, detailId, onToggle }: {
  business: boolean; name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean; ready?: boolean;
  /** 'business-progress': cabecera de la tarjeta del negocio en curso (WhatsApp, preparando el pedido). Usa `folded`, `detailId` y `onToggle`.
   *  Sin variante la cabecera conserva su apariencia actual. */
  variant?: 'business-progress'; folded?: boolean; detailId?: string; onToggle?: () => void;
}) {
  if (variant === 'business-progress') {
    // Tocar la cabecera pliega/despliega, salvo botones, enlaces, campos, pestañas, diálogos o texto seleccionado.
    const onHeader = (event: React.MouseEvent<HTMLDivElement>) => {
      const own = (event.target as HTMLElement).closest(OWN_CLICK);
      if (own) { if (own.classList.contains('zipco-bp-toggle')) onToggle?.(); return; }
      if (typeof window !== 'undefined' && String(window.getSelection?.() ?? '').length > 0) return;
      onToggle?.();
    };
    return <div className="zipco-bp-h" data-folded={folded} onClick={onHeader}>
      <div className="zipco-bp-mod"><span className="zipco-bp-mi" aria-hidden="true"><WhatsAppMark className="h-3 w-3" /></span><b>COORDINACIÓN POR WHATSAPP</b></div>
      <div className="zipco-bp-tp">
        <span className="zipco-bp-pill"><i aria-hidden="true" /><b>{statusLabel}</b></span>
        <button type="button" className={`zipco-bp-toggle${folded ? '' : ' open'}`} aria-expanded={!folded} aria-controls={detailId}>
          <span className="zipco-bp-fg" aria-hidden="true"><ProgressTapHand /></span>{folded ? 'Ver detalle' : 'Ocultar'}
          <span className="zipco-bp-chv" aria-hidden="true"><ChevronDown size={14} strokeWidth={2.4} /></span>
        </button>
      </div>
      <div className="zipco-bp-r">
        <span className="zipco-bp-th">
          <ProductPreviewControl fallback={<span className="zipco-bp-fb">{image ? <ImageWithFallback src={image} alt="" className="h-full w-full rounded-[13px] object-cover" /> : <User size={24} aria-hidden="true" />}</span>} />
        </span>
        <div className="zipco-bp-id">
          <small>CLIENTE{isUnread ? <em>Nueva</em> : null}</small>
          <b className="zipco-co-client-name">{name}</b>
        </div>
        <div className="zipco-bp-pr">
          <b className={price === null ? 'unk' : undefined}>{price === null ? 'Total por comprobar' : `$${price.toLocaleString('es-CL')}`}</b>
          <small>ACORDADO</small>
        </div>
      </div>
    </div>;
  }
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
