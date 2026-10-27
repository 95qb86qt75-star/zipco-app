import { ChevronDown, User } from 'lucide-react';
import ProductPreviewControl from './ProductPreviewControl';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export function CoordinationCardHeader({ name, image, price, statusLabel, isUnread = false }: {
  name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean;
}) {
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
        <span className="tx"><b>{error ? 'Reintentar carga de condiciones' : authorized ? 'Iniciar coordinación por WhatsApp' : 'Autorizar contacto'}</b>
          <small>{error ? 'Toca para actualizar' : 'Verificando condiciones…'}</small></span>
        <span className="chev" aria-hidden="true"><ChevronDown size={15} strokeWidth={2.8}/></span>
      </button>
      {error && <p role="alert" className="zipco-co-sm mt-3">{error}</p>}
    </div>
  </article>;
}
