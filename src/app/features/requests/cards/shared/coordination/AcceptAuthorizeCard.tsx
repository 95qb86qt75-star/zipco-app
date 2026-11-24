import * as Dialog from '@radix-ui/react-dialog';
import * as React from 'react';
import { LockKeyhole, Smartphone, X } from 'lucide-react';

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const WaIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ICON}>
  <path d="M3 21l1.65-4.9A9 9 0 1 1 8 19.4z" /><path d="M9.2 8.6c0 3.4 2.8 6.2 6.2 6.2l1-1.4-2-1-.9.8c-.9-.4-1.8-1.3-2.2-2.2l.8-.9-1-2z" />
</svg>;

/**
 * Tarjeta holograma compartida. El cliente puede elegir consentimiento separado;
 * el negocio puede autorizar el teléfono del propietario tras aceptar la contrapropuesta.
 * authorize=true  → "Aceptar y autorizar contacto"
 * authorize=false → "Solo aceptar · autorizo después" (queda el bloque existente de CoordinationActions)
 */
export default function AcceptAuthorizeCard({ open, busy, counterpartName, business = false, title, when, total, error, onChoose, onClose, followUp }: {
  open: boolean; busy: boolean; counterpartName: string; business?: boolean; title: string; when: string; total: string;
  onChoose: (authorize: boolean) => void; onClose: () => void;
  error?: string;
  /** Keeps the approved card while the already accepted proposal's contact step settles. */
  followUp?: React.ReactNode;
}) {
  return <Dialog.Root open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="zipco-sheet-ov zipco-d-accept-overlay" />
      <Dialog.Content data-accept-authorize data-contact-followup={followUp !== undefined || undefined} className="zipco-sheet holo"
        onPointerDownOutside={event => { if (busy) event.preventDefault(); }}
        onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}
        onOpenAutoFocus={event => { event.preventDefault(); (event.currentTarget as HTMLElement).focus(); }}>
        <div className="zipco-d-holo-in" style={{ padding: '14px 14px 12px' }}>
          <span className="zipco-d-holo-grid" aria-hidden="true" /><span className="zipco-d-holo-sheen" aria-hidden="true" />
          <div style={{ position: 'relative' }}>
            <Dialog.Close asChild><button type="button" className="zipco-d-x" disabled={busy} aria-label="Volver" style={{ position: 'absolute', right: 0, top: 0, zIndex: 3 }}><X aria-hidden="true" strokeWidth={3} /></button></Dialog.Close>
            <div className="zipco-d-orbwrap" aria-hidden="true"><span className="zipco-d-rays" /><span className="zipco-d-ring r1" /><span className="zipco-d-ring r2" />
              <span className="zipco-d-orb"><WaIcon size={40} />
                <span className="zipco-d-orbtick"><svg width="11" height="11" viewBox="0 0 24 24" {...ICON} strokeWidth={3.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></span></div>
            <Dialog.Title className="zipco-d-auth-ttl" style={{ marginBottom: 0 }}>Todo listo para<br /><span>coordinar tu pedido</span></Dialog.Title>
            <Dialog.Description className="zipco-d-auth-sub">{followUp !== undefined
              ? 'La propuesta está aceptada. Completando la autorización de contacto que elegiste.' : business
              ? <>Aceptarás esta contrapropuesta y autorizarás compartir el teléfono de tu perfil con <b>{counterpartName}</b> para coordinar por WhatsApp los detalles de pago y retiro.</>
              : <>Acepta la propuesta y autoriza a <b>{counterpartName}</b> a escribirte por WhatsApp.</>}</Dialog.Description>
            {title && <div className="zipco-d-ticket">
              <div style={{ minWidth: 0 }}><div className="zipco-d-ticket-t">{title}</div><div className="zipco-d-ticket-w">{when}</div></div>
              <div style={{ textAlign: 'right' }}><div className="zipco-d-ticket-tl">Total</div><div className="zipco-d-ticket-tv">{total}</div></div>
            </div>}
            <div className="zipco-d-trusts">
              <span className="zipco-d-trust"><LockKeyhole width={12} height={12} strokeWidth={2.4} aria-hidden="true" />Solo este pedido</span>
              <span className="zipco-d-trust"><Smartphone width={12} height={12} strokeWidth={2.4} aria-hidden="true" />Comparte tu teléfono</span>
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
            {followUp !== undefined ? followUp : <><button type="button" className="zipco-d-wabtn" disabled={busy} aria-busy={busy}
              onClick={() => onChoose(true)}>
              <span className="zipco-d-wabtn-ic"><WaIcon size={22} /></span><span>{busy ? 'Aceptando…' : 'Aceptar y autorizar contacto'}</span>
            </button>
            <button type="button" className="zipco-d-wasoft" disabled={busy} onClick={() => onChoose(false)}>Solo aceptar · autorizo después</button>
            <button type="button" className="zipco-d-back" disabled={busy} onClick={onClose}>Volver</button></>}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
