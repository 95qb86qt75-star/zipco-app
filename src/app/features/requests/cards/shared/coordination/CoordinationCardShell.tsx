import * as React from 'react';
import { ChevronDown, ShoppingBag, User } from 'lucide-react';
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import { ImageWithFallback } from "../../../../../components/figma/ImageWithFallback";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";

/** Elementos propios que NO deben plegar la tarjeta al tocar la cabecera (solo variante business-initial). */
const OWN_CLICK='button,a,input,textarea,select,summary,[role="button"],[role="tab"],[role="dialog"]';


/** Manito animada de «Ver detalle» / «Toca aquí» (tarjeta inicial del negocio). Decorativa. */
export function TapHand() {
  return <svg width="24" height="28" viewBox="0 -5 24 29" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><g className="zipco-bi-w1"><path d="M6.2 1.2a3.4 3.4 0 0 1 3.6 0" /></g><g className="zipco-bi-w2"><path d="M4.2 -1.4a6.6 6.6 0 0 1 7.6 0" /></g><path d="M10 9.5V4a2 2 0 0 0-4 0v10" /><path d="M14 10V9a2 2 0 0 0-4 0v1" /><path d="M18 11v-1a2 2 0 0 0-4 0v1" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>;
}

export function CoordinationCardHeader({ name, image, price, statusLabel, isUnread = false, variant, quantity, folded, detailId, onToggle }: {
  name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean;
  /** Presentación opcional del cliente (pedido aceptado, producto). Sin variante, la cabecera conserva su apariencia actual.
   *  'business-initial': tarjeta inicial del negocio (solo Solicitudes → Mi Negocio → Por coordinar, WhatsApp). Usa `folded`, `detailId` y `onToggle`. */
  variant?: 'customer-initial' | 'business-initial'; quantity?: number;
  folded?: boolean; detailId?: string; onToggle?: () => void;
}) {
  if (variant === 'business-initial') {
    // Tocar la cabecera pliega/despliega el detalle, salvo botones, enlaces, campos, pestañas, diálogos o texto seleccionado.
    const onHeader = (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const own = target.closest(OWN_CLICK);
      if (own && !own.classList.contains('zipco-bi-toggle')) return;
      if (own?.classList.contains('zipco-bi-toggle')) { onToggle?.(); return; }
      if (typeof window !== 'undefined' && String(window.getSelection?.() ?? '').length > 0) return;
      onToggle?.();
    };
    return <div className="zipco-bi-h" data-folded={folded} onClick={onHeader}>
      <div className="zipco-bi-mod"><span className="zipco-bi-mi" aria-hidden="true"><WhatsAppMark className="h-3 w-3" /></span><b>COORDINACIÓN POR WHATSAPP</b></div>
      <div className="zipco-bi-tp">
        <span className="zipco-bi-pill"><i aria-hidden="true" /><b>{statusLabel}</b></span>
        <button type="button" className={`zipco-bi-toggle${folded ? '' : ' open'}`} aria-expanded={!folded} aria-controls={detailId}>
          <span className="zipco-bi-fg" aria-hidden="true"><TapHand /></span>
          {folded ? 'Ver detalle' : 'Ocultar'}
          <span className="zipco-bi-chv" aria-hidden="true"><ChevronDown size={14} strokeWidth={2.4} /></span>
        </button>
      </div>
      <div className="zipco-bi-r">
        <span className="zipco-bi-th">
          <ProductPreviewControl fallback={<span className="zipco-bi-fb">{image ? <ImageWithFallback src={image} alt="" className="h-full w-full rounded-[13px] object-cover" /> : <ShoppingBag size={24} strokeWidth={2} aria-hidden="true" />}</span>} />
          {quantity ? <i className="zipco-bi-q">{quantity}×</i> : null}
        </span>
        <div className="zipco-bi-id">
          <small>CLIENTE{isUnread ? <em>Nueva</em> : null}</small>
          <b className="zipco-co-client-name">{name}</b>
        </div>
        <div className="zipco-bi-pr">
          <b data-agreement-price className={price === null ? 'unk' : undefined}>{price === null ? 'Total por comprobar' : `$${price.toLocaleString('es-CL')}`}</b>
          <small>ACORDADO</small>
        </div>
      </div>
    </div>;
  }
  if (variant === 'customer-initial') return <div className="zipco-ci-h">
    <span className="zipco-ci-th">
      <ProductPreviewControl fallback={<span className="zipco-ci-fb">{image ? <ImageWithFallback src={image} alt="" className="h-full w-full rounded-full object-cover" /> : <ShoppingBag size={24} strokeWidth={2} aria-hidden="true" />}</span>}/>
      {quantity ? <i className="zipco-ci-q">{quantity}×</i> : null}
    </span>
    <div className="zipco-ci-nm zipco-co-client-name">{name}</div>
    <div className="zipco-ci-pr">
      <div data-agreement-price className="zipco-ci-price">
        {price === null ? <span aria-label="Total pendiente de verificación" className="inline-block h-[21px] w-20 rounded-md bg-white/10 align-bottom" /> : `$${price.toLocaleString('es-CL')}`}
      </div>
      <div className="zipco-ci-agreed">ACORDADO</div>
    </div>
  </div>;
  return <div style={{ display:'flex',alignItems:'center',gap:12 }}>
    <ProductPreviewControl fallback={<span className="zipco-co-av">{image ? <ImageWithFallback src={image} alt="" className="h-full w-full rounded-[14px] object-cover" /> : <User size={24} strokeWidth={2} aria-hidden="true" />}</span>}/>
    <div style={{ minWidth:0,flex:1 }}>
      <div style={{ fontSize:17,lineHeight:1.15,fontWeight:800,display:'flex',alignItems:'center',gap:6 }}>
        <span className="zipco-co-client-name">{name}</span>{isUnread && <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">Nueva</span>}
      </div>
      <div style={{ marginTop:5 }}><span className="zipco-co-pill"><i />{statusLabel}</span></div>
    </div>
    <div style={{ textAlign:'right',minWidth:88 }}>
      <div data-agreement-price style={{ fontSize:23,lineHeight:1,fontWeight:800,fontVariantNumeric:'tabular-nums' }}>
        {price === null ? <span aria-label="Total pendiente de verificación" className="inline-block h-[23px] w-20 rounded-md bg-white/10 align-bottom" /> : `$${price.toLocaleString('es-CL')}`}
      </div>
      <div style={{ marginTop:4,fontSize:9.5,fontWeight:800,letterSpacing:'.14em',color:'#d5dbe5' }}>ACORDADO</div>
    </div>
  </div>;
}

/** Same collapsed coordination shell while its immutable agreement is verified. No order actions. */
export default function CoordinationCardShell({ id, name, image, statusLabel, isUnread, authorized, error, retry }: {
  id: number | null; name: string; image?: string; statusLabel: string; isUnread: boolean;
  authorized: boolean; error?: string; retry: () => void;
}) {
  return <article id={`order-${id}`} tabIndex={0} data-coordination-placeholder data-coordination-motion="idle"
    aria-busy={!error} aria-label={`${name}: ${error ? 'condiciones no disponibles' : 'cargando condiciones aceptadas'}`}
    className="zipco-co-dk scroll-mb-36" onClick={event=>event.stopPropagation()}>
    <span className="zipco-co-a1" aria-hidden="true"/><span className="zipco-co-a2" aria-hidden="true"/>
    <div style={{ position:'relative' }}>
      <CoordinationCardHeader name={name} image={image} price={null} statusLabel={statusLabel} isUnread={isUnread}/>
      <button type="button" className="zipco-co-colrow" data-folded="true" disabled={!error} onClick={retry} aria-expanded={false}>
        <span className="nd" aria-hidden="true">{authorized ? '3' : '2'}</span>
        <span className="tx"><b>{error ? 'Reintentar carga de condiciones' : authorized ? 'Ya puedes coordinar por WhatsApp' : 'Autorizar contacto'}</b>
          <small>{error ? 'Toca para actualizar' : 'Verificando condiciones…'}</small></span>
        <span className="chev" aria-hidden="true"><ChevronDown size={15} strokeWidth={2.8}/></span>
      </button>
      {error && <p role="alert" className="zipco-co-sm mt-3">{error}</p>}
    </div>
  </article>;
}
