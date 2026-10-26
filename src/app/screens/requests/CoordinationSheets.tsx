import type { CSSProperties, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, ChevronRight, Clock, ExternalLink, FileCheck, FileText, PencilLine, ShoppingBag, Trash2, UserX, X, Check } from 'lucide-react';
import type { AgreementReadDto } from './agreement';
import WhatsAppMark from './WhatsAppMark';

const money = (value: number) => `$${value.toLocaleString('es-CL')}`;

/** Use the real immutable agreement, including line-total CUSTOM prices. */
export type AcceptedSummary = AgreementReadDto;

const XButton = ({ label = 'Cerrar detalle', busy = false }: { label?: string; busy?: boolean }) => <Dialog.Close asChild>
  <button type="button" className="zipco-d-x" disabled={busy} aria-label={label}><X aria-hidden="true" strokeWidth={3} /></button>
</Dialog.Close>;

const Shell = ({ children, onDismiss, style, busy = false }: { children: ReactNode; onDismiss: () => void; style?: CSSProperties; busy?: boolean }) => <Dialog.Portal>
  <Dialog.Overlay className="zipco-sheet-ov zipco-d-accept-overlay" onPointerDown={event => { if (event.target === event.currentTarget) { event.preventDefault(); event.stopPropagation(); if (!busy) onDismiss(); } }} />
  <Dialog.Content data-coordination-sheet className="zipco-sheet holo" aria-describedby={undefined}
    onPointerDownOutside={event => { if (busy) event.preventDefault(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
    <div className="zipco-d-holo-in" style={style}>
      <span className="zipco-d-holo-grid" aria-hidden="true" /><span className="zipco-d-holo-sheen" aria-hidden="true" />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  </Dialog.Content>
</Dialog.Portal>;

/**
 * "Condiciones aceptadas" como tarjeta flotante (antes ocupaba media pantalla dentro de la tarjeta).
 * Reutiliza el marco de "Tú pediste" (zipco-sheet holo + zipco-d-ped*). `onOpenAgreement` abre el detalle completo
 * (el AcceptedConditionsPanel de siempre) para quien necesite todas las condiciones.
 */
export function ConditionsSheet({ open, onOpenChange, accepted, title, subtitle, when, explanation, explanationLabel, onOpenAgreement, fullAgreement = false }: {
  open: boolean; onOpenChange: (open: boolean) => void; accepted: AcceptedSummary;
  title: string; subtitle: string; when: string; explanation?: string | null; explanationLabel: string; onOpenAgreement: () => void;
  fullAgreement?: boolean;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Shell onDismiss={() => onOpenChange(false)} >
      <div className="zipco-d-top">
        <Dialog.Title className="zipco-d-who"><span>Condiciones aceptadas</span></Dialog.Title>
        <XButton />
      </div>
      <div className="zipco-d-ped-hero">
        <span className="zipco-d-ped-orb"><ShoppingBag aria-hidden="true" /></span>
        <div className="zipco-d-ped-ttl"><b>{title}</b>{subtitle && <span>{subtitle}</span>}</div>
        <b className="zipco-d-ped-price">{money(accepted.totalPriceClp)}</b>
      </div>
      <ul className="zipco-co-condition-items">
        {accepted.subjectSnapshot.items.map((item, index) => <li key={index}>
          {accepted.subjectSnapshot.items.length > 1 && <strong>{item.quantity}× {item.nameSnapshot}</strong>}
          <span>{item.unitPriceClpSnapshot === null ? 'Precio total de esta línea' : `${money(item.unitPriceClpSnapshot)} por unidad`} · Subtotal {money(item.subtotalClp)}</span>
        </li>)}
      </ul>
      <div className="zipco-d-ped-tiles">
        <div className="zipco-d-tile"><span className="zipco-d-tile-ic"><Calendar aria-hidden="true" /></span><div><div className="zipco-d-tile-l">Fecha y hora</div><div className="zipco-d-tile-v">{when}</div></div></div>
        {explanation && <div className="zipco-d-tile"><span className="zipco-d-tile-ic"><FileText aria-hidden="true" /></span><div><div className="zipco-d-tile-l">{explanationLabel}</div><div className="zipco-d-tile-v">{explanation}</div></div></div>}
      </div>
      {fullAgreement ? <button type="button" className="zipco-ag-cta" onClick={onOpenAgreement}>
        <span className="ic"><FileCheck size={22} strokeWidth={2.2} aria-hidden="true" /></span>
        <span className="tx"><b>Ver acuerdo completo</b><small>Pedido original y cada propuesta</small></span>
        <span className="go"><ChevronRight size={17} strokeWidth={3} aria-hidden="true" /></span>
      </button> : <button type="button" className="zipco-glassbtn gt" data-open="true" style={{ marginTop: 14 }} onClick={onOpenAgreement}>
        <span className="zipco-glassbtn-label">Ver acuerdo completo</span>
        <span className="zipco-glassbtn-arrow"><ExternalLink className="zipco-glassbtn-chev" strokeWidth={3} aria-hidden="true" /></span>
      </button>}
      <Dialog.Close asChild><button type="button" className="zipco-co-lnk">Cerrar</button></Dialog.Close>
    </Shell>
  </Dialog.Root>;
}

const REASON_ICON: Record<string, typeof UserX> = { OTHER: PencilLine };
export function PaymentConfirmationSheet({open,busy,amount,until,error,onClose,onConfirm}:{open:boolean;busy:boolean;amount:number;until:string;error?:string;onClose:()=>void;onConfirm:()=>void}){
  return <Dialog.Root open={open} onOpenChange={v=>{if(!v&&!busy)onClose();}}><Shell busy={busy} onDismiss={()=>{if(!busy)onClose();}}
    style={{background:'radial-gradient(120% 70% at 92% 0%,rgba(167,243,208,.8),transparent 60%),linear-gradient(165deg,#ffffff,#f3fffb 60%,#f6f2ff)'}}>
    <div className="zipco-d-top"><span className="zipco-d-who" style={{color:'#047857'}}>Reserva con pago</span><XButton label="Cerrar" busy={busy}/></div>
    <div className="zipco-co-start-orb"><span className="zipco-co-co2-orb"><WhatsAppMark className="h-6 w-6"/><span className="tick"><Check size={11}/></span></span></div>
    <Dialog.Title className="zipco-co-start-title">¿Recibiste el pago y apartaste el pedido?</Dialog.Title>
    <Dialog.Description className="zipco-co-start-description">Al confirmar declaras que recibiste <b>${amount.toLocaleString('es-CL')}</b> y apartaste todo el pedido hasta <b>{until}</b>. ZIPCO no verifica la transferencia.</Dialog.Description>
    {error&&<p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    <div className="zipco-co-yn"><button type="button" className="zipco-co-go" disabled={busy} onClick={onConfirm}><Check size={17}/>{busy?'Guardando…':'Sí, confirmar'}</button><button type="button" className="zipco-co-no" disabled={busy} onClick={onClose}>Aún no</button></div>
  </Shell></Dialog.Root>;
}
const FALLBACK_ICONS = [UserX, Clock];

export function StartWorkSheet({ open,onOpenChange,busy,client,service=false,error,recovery,onConfirm }: {
  open:boolean;onOpenChange:(value:boolean)=>void;busy:boolean;client:string;service?:boolean;
  error?:string;recovery?:ReactNode;onConfirm:()=>void;
}) {
  return <Dialog.Root open={open} onOpenChange={value=>{if(!busy)onOpenChange(value);}}>
    <Shell busy={busy} onDismiss={()=>{if(!busy)onOpenChange(false);}}
      style={{background:'radial-gradient(120% 70% at 92% 0%,rgba(167,243,208,.8),transparent 60%),radial-gradient(90% 60% at 0% 100%,rgba(221,214,254,.7),transparent 60%),linear-gradient(165deg,#ffffff,#f3fffb 60%,#f6f2ff)'}}>
      <div className="zipco-d-top"><span className="zipco-d-who" style={{color:'#047857'}}>Coordinación</span><XButton label="Cerrar" busy={busy}/></div>
      <div className="zipco-co-start-orb"><span className="zipco-co-co2-orb"><WhatsAppMark className="h-6 w-6"/><span className="tick"><Check size={11} aria-hidden="true"/></span></span></div>
      <Dialog.Title className="zipco-co-start-title">¿Coordinación lista<br/>por WhatsApp?</Dialog.Title>
      <p className="zipco-co-start-description">Confirma que ya acordaron el pago y {service?'la realización del servicio':'la entrega'} con <b>{client}</b>. Pasarás a preparar el pedido.</p>
      {error&&<p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      {recovery||<div className="zipco-co-yn">
        <button type="button" className="zipco-co-go" disabled={busy} onClick={onConfirm}><Check size={17} aria-hidden="true"/>{busy?'Guardando…':'Sí, comenzar'}</button>
        <Dialog.Close asChild><button type="button" className="zipco-co-no" disabled={busy}>No, aún no</button></Dialog.Close>
      </div>}
      {recovery&&<Dialog.Close asChild><button type="button" className="zipco-co-lnk" disabled={busy}>No, aún no</button></Dialog.Close>}
    </Shell>
  </Dialog.Root>;
}

/**
 * Anular en UN paso: motivo (fichas) + explicación solo para "Otro motivo" + confirmar. Reemplaza el <select> y la
 * confirmación en dos pantallas. Los motivos salen de ANNUL_REASONS (no inventes otros); las etiquetas del diseño
 * ("No logramos coordinar los detalles", "La otra parte no responde", "Otro motivo") son solo una sugerencia de texto.
 */
export function AnnulSheet({ open, onOpenChange, busy, reasons, reason, onReason, detail, onDetail, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; busy: boolean;
  reasons: Array<[value: string, label: string]>; reason: string; onReason: (value: string) => void;
  detail: string; onDetail: (value: string) => void; onConfirm: () => void;
}) {
  const other = reason === 'OTHER';
  return <Dialog.Root open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
    <Shell busy={busy} onDismiss={() => { if (!busy) onOpenChange(false); }}
      style={{ background: 'radial-gradient(120% 70% at 92% 0%,rgba(254,205,211,.75),transparent 60%),radial-gradient(90% 60% at 0% 100%,rgba(221,214,254,.7),transparent 60%),linear-gradient(165deg,#ffffff,#fff7f8 60%,#f6f2ff)' }}>
      <div className="zipco-d-top">
        <span className="zipco-d-who" style={{ color: '#be123c' }}><span>Anular solicitud</span></span>
        <XButton label="Cerrar" busy={busy} />
      </div>
      <Dialog.Title style={{ marginTop: 8, fontSize: 21, lineHeight: 1.1, fontWeight: 800, color: '#0f172a' }}>¿Por qué la anulas?</Dialog.Title>
      <p style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.35, color: '#64748b' }}>Pasará a Historial y conservará sus condiciones aceptadas.</p>
      <div className="zipco-co-rs" role="radiogroup" aria-label="Motivo de anulación">
        {reasons.map(([value, label], index) => {
          const Icon = REASON_ICON[value] ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length];
          const on = reason === value;
          return <button key={value} type="button" role="radio" aria-checked={on} disabled={busy} onClick={() => onReason(value)}
            className="zipco-co-r" style={on ? { background: 'linear-gradient(135deg,#fff1f2,#fff)', boxShadow: 'inset 0 0 0 2px #fb7185,0 8px 16px rgba(225,29,72,.14)' } : undefined}>
            <span className="zipco-co-r-ic" style={on ? { color: '#be123c', background: '#ffe4e6' } : undefined}><Icon size={17} strokeWidth={2.2} aria-hidden="true" /></span>
            <span className="zipco-co-r-t">{label}</span>
            <span className="zipco-co-r-d" style={on ? { background: 'linear-gradient(145deg,#fb7185,#e11d48)', boxShadow: 'none', color: '#fff' } : undefined}><Check size={12} strokeWidth={3.6} aria-hidden="true" /></span>
          </button>;
        })}
      </div>
      {other && <textarea className="zipco-co-ta" style={{ display: 'block' }} required maxLength={1000} value={detail} disabled={busy}
        placeholder="Cuéntanos qué pasó (obligatorio)" aria-label="Explicación obligatoria" onChange={event => onDetail(event.target.value)} />}
      <button type="button" className="zipco-co-danger" disabled={busy || (other && !detail.trim())} onClick={onConfirm}>
        <Trash2 size={17} strokeWidth={2.4} aria-hidden="true" />{busy ? 'Anulando…' : 'Confirmar anulación'}
      </button>
      <Dialog.Close asChild><button type="button" className="zipco-co-lnk" disabled={busy}>Volver</button></Dialog.Close>
    </Shell>
  </Dialog.Root>;
}
