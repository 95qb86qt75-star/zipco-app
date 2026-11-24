import * as React from 'react';
import BusinessResponseHoursNotice from "../hours/BusinessResponseHoursNotice";
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, Bell, BookmarkCheck, ArrowLeftRight, CalendarDays, Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, Clock, Eye, Hourglass, Image as ImageIcon, Info, LockKeyhole, MapPin, Pencil, Phone, Plus, Quote, Send, ShieldCheck, ShoppingBag, Store, Undo2, UserRound, X, Zap } from 'lucide-react';
import AcceptGlassButton from "../../cards/shared/coordination/AcceptGlassButton";
import WhatsAppMark from "../icons/WhatsAppMark";
import "./availability-design.css";
import ProductPreviewControl from "../product-preview/ProductPreviewControl";
import { BUSINESS_CONTACT_COPY } from "../../domain/availabilityContract";
import type { ReservationOffer, ReservationOfferInput } from "../../domain/reservationContract";
import SimpleReservationOfferFields from "../reservations/SimpleReservationOfferFields";
import ReservationOfferFields from "../reservations/ReservationOfferFields";
import ReservationOfferSummary from "../reservations/ReservationOfferSummary";
import { isSimpleOffer } from "../../domain/simplifiedReservationContract";

// Presentation only. These props are not proposed API fields or server receipts.

// Presentation only. These props are not proposed API fields or server receipts.
export type RequestDesignData = {
  counterpart: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  schedule: string;
  immediate: boolean;
  note?: string;
  referencePhoto?: string;
};
export type PickupDesign = { message: string; scheduleOrAddress: string; allowsContact: boolean;reservationOffer?:ReservationOfferInput };
export type AvailabilityDesignChoice = { channel: 'whatsapp' } | { channel: 'pickup'; instructions: PickupDesign };
export const DEFAULT_PICKUP_MESSAGE = 'Acércate al local a pagar y retirar.';
const money = (value: number) => `$${value.toLocaleString('es-CL')}`;

export function ContactSwitch({ checked, onChange, label = 'Autorizar contacto por WhatsApp', disabled = false }: {
  checked: boolean; onChange: () => void; label?: string; disabled?: boolean;
}) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label}
    className="zipco-av-switch" disabled={disabled} onClick={onChange}><span /></button>;
}

function Disclosure({ open, onToggle, controls, openLabel = 'Ocultar detalle', closedLabel = 'Ver detalle', className = '' }: {
  open: boolean; onToggle: () => void; controls: string; openLabel?: string; closedLabel?: string; className?: string;
}) {
  return <button type="button" className={`zipco-av-disclosure${className ? ` ${className}` : ''}`} aria-expanded={open} aria-controls={controls} onClick={onToggle}>
    {open ? openLabel : closedLabel}{open ? <ChevronUp /> : <ChevronDown />}
  </button>;
}

function TicketHeader({ data, kind }: { data: RequestDesignData; kind: 'waiting' | 'business' | 'available' }) {
  const Icon = kind === 'waiting' ? Hourglass : kind === 'business' ? UserRound : Store;
  return <header className="zipco-av-ticket-header">
    <ProductPreviewControl fallback={<span className="zipco-av-ticket-icon"><Icon aria-hidden="true" /></span>}/>
    <div className="zipco-av-identity"><small>{kind === 'waiting' ? 'ENTRADA DE SOLICITUD' : kind === 'business' ? 'SOLICITUD DE CLIENTE' : 'RESPUESTA DEL NEGOCIO'}</small><b>{data.counterpart}</b></div>
    <div className="zipco-av-price"><b>{money(data.total)}</b><small>SOLICITADO</small></div>
  </header>;
}

function Items({ data, showPrice = false }: { data: RequestDesignData; showPrice?: boolean }) {
  return <div className="zipco-av-items">{data.items.map((item, index) => <div className="zipco-av-item" key={index}>
    <span className="zipco-av-quantity">{item.quantity}×</span><span className="zipco-av-item-name">{item.name}</span>
    {showPrice && <b>{money(item.unitPrice * item.quantity)}</b>}
  </div>)}</div>;
}

function Perforation() { return <div className="zipco-av-perforation" aria-hidden="true"><i /><span /><i /></div>; }

function OriginalDetail({ data, compact = false }: { data: RequestDesignData; compact?: boolean }) {
  return <section className="zipco-av-original" aria-label="Detalle de la solicitud">
    <Items data={data} showPrice={!compact || data.items.length > 1} />
    <p className="zipco-av-schedule">{data.immediate ? <Zap /> : <CalendarDays />}{data.schedule}</p>
    {data.note && <p className="zipco-av-note"><b>Nota:</b> {data.note}</p>}
    {data.referencePhoto && <a href={data.referencePhoto} target="_blank" rel="noopener noreferrer">Foto de referencia del cliente</a>}
    {!compact && <div className="zipco-av-original-total"><span>Total solicitado</span><b>{money(data.total)}</b></div>}
  </section>;
}

function ContactIntent({ allowed, business = false }: { allowed: boolean; business?: boolean }) {
  return <p className={`zipco-av-contact-intent${allowed ? '' : ' zipco-av-contact-off'}`}><ShieldCheck aria-hidden="true" /><span>{allowed
    ? business ? 'El cliente permitió que le escribas por WhatsApp si compra' : 'Permitiste que el negocio te escriba por WhatsApp si compras'
    : business ? 'Sin autorización de WhatsApp todavía. El cliente podrá darla al confirmar la compra.' : 'Sin autorizar el contacto por WhatsApp. Podrás darlo cuando el negocio confirme disponibilidad.'}</span></p>;
}

// «Nuevo pedido» del NEGOCIO (AWAITING_BUSINESS_RESPONSE). Solo presentación: mismos datos, callbacks y botones reales
// (`actions` y `detail` llegan de AvailabilityFlowCard). Todo el estilo vive bajo `.zipco-nv`.
function BusinessNewRequestCard({ data, expanded, onToggle, contactIntent, actions, detail, detailsId }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; contactIntent?: boolean; actions?: ReactNode; detail?: ReactNode; detailsId: string;
}) {
  const first = data.items[0];
  const summary = first ? `${first.quantity}× ${first.name}${data.items.length > 1 ? ` · +${data.items.length - 1} más` : ''}` : '';
  // Misma estructura que «Esperando al cliente» (.zipco-wx): cabecera blanca, panel de estado y pie centrado.
  return <article className="zipco-av-ticket zipco-av-business zipco-nv" data-open={expanded} aria-label={`${data.counterpart}: Nuevo pedido`}>
    <header className="zipco-nv-h">
      <span className="zipco-nv-th"><ProductPreviewControl fallback={<span className="zipco-av-ticket-icon"><UserRound aria-hidden="true" /></span>} /></span>
      <div className="zipco-nv-id"><small>SOLICITUD DE CLIENTE</small><b>{data.counterpart}</b></div>
      <div className="zipco-nv-price"><b>{money(data.total)}</b><small>SOLICITADO</small></div>
    </header>
    <div className="zipco-nv-bn">
      <div className="zipco-nv-tt">
        <h2 className="zipco-nv-new"><i aria-hidden="true"><Bell /></i>NUEVO PEDIDO</h2>
        <span className="zipco-nv-wait"><i aria-hidden="true" />Esperando tu respuesta</span>
      </div>
      <div className="zipco-nv-ar">
        <span className={`zipco-nv-ic${data.immediate ? ' zipco-nv-ic--now' : ''}`} aria-hidden="true">{data.immediate ? <Zap /> : <CalendarDays />}</span>
        <div className="zipco-nv-at">
          <span className="zipco-nv-hl">Cuándo lo necesita</span>
          <strong>{data.schedule}</strong>
          {summary && <span className="zipco-nv-sn"><ShoppingBag aria-hidden="true" />{summary}</span>}
        </div>
      </div>
      {(data.note || data.referencePhoto) && <div className="zipco-nv-ex">
        {data.note && <span><Quote aria-hidden="true" />Con nota</span>}
        {data.referencePhoto && <span><ImageIcon aria-hidden="true" />Con foto</span>}
      </div>}
    </div>
    <p className="zipco-nv-nx"><Info aria-hidden="true" /><span>Revisa la solicitud y responde al cliente.</span></p>
    <div className="zipco-nv-body">
      <div id={detailsId} hidden={!expanded} className="zipco-nv-fold">
        <div className="zipco-nv-detail" data-immediate={data.immediate}>
          <div className="zipco-nv-total"><span>Total solicitado<small>Aún sin confirmar ni pagar</small></span><b>{money(data.total)}</b></div>
          {detail ?? <OriginalDetail data={data} compact />}
        </div>
        {contactIntent !== undefined && <ContactIntent allowed={contactIntent} business />}
        {actions}
      </div>
    </div>
    <footer className="zipco-nv-foot">
      <Disclosure open={expanded} onToggle={onToggle} controls={detailsId} openLabel="Ocultar detalle" closedLabel="Abrir solicitud" className="zipco-nv-dis" />
    </footer>
  </article>;
}

export function PendingRequestDesign({ data, expanded, onToggle, contactIntent, business = false, actions, detail }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; contactIntent?: boolean; business?: boolean; actions?: ReactNode; detail?: ReactNode;
}) {
  const detailsId = useId();
  if (business) return <BusinessNewRequestCard data={data} expanded={expanded} onToggle={onToggle} contactIntent={contactIntent} actions={actions} detail={detail} detailsId={detailsId} />;
  return <article className={`zipco-av-ticket ${business ? 'zipco-av-business' : 'zipco-av-waiting'}`} aria-label={`${data.counterpart}: ${business ? 'Nuevo pedido' : 'Pendiente de respuesta'}`}>
    <div className="zipco-av-ticket-inner"><TicketHeader data={data} kind={business ? 'business' : 'waiting'} />
      <h2 className="zipco-av-neon">{business ? 'NUEVO PEDIDO' : 'EN ESPERA'}</h2>
      <p className="zipco-av-subtitle">{business ? 'Revisa la solicitud y responde al cliente.' : 'Esperando la primera respuesta del negocio.'}</p>
      <div id={detailsId} hidden={!expanded}>
        {detail ?? <OriginalDetail data={data} compact={business} />}<Perforation />
        {contactIntent !== undefined && <ContactIntent allowed={contactIntent} business={business} />}
        {business && actions}
      </div>
      <footer className={`zipco-av-ticket-footer${business ? ' zipco-av-centered' : ''}`}>
        <Disclosure open={expanded} onToggle={onToggle} controls={detailsId} />{!business && actions}
      </footer>
    </div>
  </article>;
}

function Modal({ open, onOpenChange, title, description, children, sheet = false, icon, beforeIcon, busy = false, stacked = false, variant, footer, compact = false, bodyRef }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description: string; children: ReactNode; sheet?: boolean; icon?: ReactNode; beforeIcon?: ReactNode; busy?: boolean; stacked?: boolean;
  // Optional visual variant used only by ConfirmAvailabilityDesign. Without it the Modal is exactly the previous one.
  variant?: 'pickup'; footer?: ReactNode; compact?: boolean; bodyRef?: React.Ref<HTMLDivElement>;
}) {
  if (variant === 'pickup') {
    return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
      <Dialog.Overlay className="zipco-av-overlay" style={stacked?{zIndex:1100}:undefined} />
      <Dialog.Content className="zipco-av-dialog zipco-pk-dialog" style={stacked?{zIndex:1101}:undefined} onOpenAutoFocus={event => { event.preventDefault(); (event.currentTarget as HTMLElement).focus(); }}>
        {busy && <div className="zipco-pk-prog" aria-hidden="true"><i /></div>}
        <Dialog.Close className="zipco-pk-close" aria-label="Cerrar" disabled={busy}><X /></Dialog.Close>
        <div className="zipco-pk-body" ref={bodyRef}>
          {compact
            ? <div className="zipco-pk-h2">{beforeIcon}<Dialog.Title className="zipco-pk-title">{title}</Dialog.Title></div>
            : <div className="zipco-pk-hd"><span className="zipco-pk-badge" aria-hidden="true">{icon ?? <CircleCheck />}</span><Dialog.Title className="zipco-pk-title">{title}</Dialog.Title></div>}
          <Dialog.Description className={compact ? 'zipco-pk-sr' : 'zipco-pk-sub'}>{description}</Dialog.Description>
          {children}
        </div>
        <div className="zipco-pk-foot">{footer}</div>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>;
  }
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="zipco-av-overlay" style={stacked?{zIndex:1100}:undefined} />
    <Dialog.Content className={`zipco-av-dialog${sheet ? ' zipco-av-sheet' : ''}`} style={stacked?{zIndex:1101}:undefined}>
      <Dialog.Close className="zipco-av-close" aria-label="Cerrar" disabled={busy}><X /></Dialog.Close>
      {beforeIcon}
      {sheet && <div className="zipco-av-grab" aria-hidden="true" />}
      <span className="zipco-av-modal-icon" aria-hidden="true">{icon ?? <CircleCheck />}</span>
      <Dialog.Title className="zipco-av-dialog-title">{title}</Dialog.Title>
      <Dialog.Description className="zipco-av-dialog-description">{description}</Dialog.Description>
      {children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export function DesignConfirmation({ open, onOpenChange, title, description, confirmLabel, onConfirm, children, cancelLabel = 'Volver', variant }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel: string;
  onConfirm: () => void; children?: ReactNode; cancelLabel?: string; variant?: 'decline' | 'withdraw';
}) {
  // Explicit visual variants: unrelated confirmations keep their existing presentation.
  // «decline»: «No, gracias» del cliente. «withdraw»: «¿Retirar la disponibilidad?» del negocio (se pasa explícito desde AvailabilityFlowCard, nunca se deduce del título).
  const decline = variant === 'decline';
  const withdraw = variant === 'withdraw';
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}><AlertDialog.Portal>
    <AlertDialog.Overlay className="zipco-av-overlay zipco-av-alert-overlay" />
    <AlertDialog.Content className={`zipco-av-dialog zipco-av-alert${decline ? ' zipco-av-alert-decline' : ''}${withdraw ? ' zipco-av-alert-withdraw' : ''}`}>
      {decline && <span className="zipco-av-decline-ic" aria-hidden="true"><X /></span>}
      {withdraw && <span className="zipco-av-withdraw-ic" aria-hidden="true"><Undo2 /></span>}
      <AlertDialog.Title className="zipco-av-dialog-title">{title}</AlertDialog.Title>
      <AlertDialog.Description className="zipco-av-dialog-description">{description}</AlertDialog.Description>
      {children}<div className="zipco-av-button-row">
        <AlertDialog.Action asChild><button type="button" className="zipco-av-secondary" onClick={onConfirm}>{confirmLabel}</button></AlertDialog.Action>
        <AlertDialog.Cancel className="zipco-av-primary">{title === '¿Quitar el contacto por WhatsApp?' ? 'Mantener' : cancelLabel}</AlertDialog.Cancel>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal></AlertDialog.Root>;
}

export function ConsultationDesignSheet({ open, onOpenChange, data, contact, onContactChange, onSend, busy = false, contactLocked = false, error }: {
  open: boolean; onOpenChange: (open: boolean) => void; data: RequestDesignData; contact: boolean;
  onContactChange: (checked: boolean) => void; onSend: () => void; busy?: boolean; contactLocked?: boolean; error?: string;
}) {
  const [removeContact, setRemoveContact] = useState(false);
  return <><Modal open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }} sheet icon={<Send />} busy={busy}
    title="Requiero este producto" description="El negocio te confirmará si lo tiene disponible. Aún no compras nada.">
    <div className="zipco-av-summary-chips">{data.items.map((item, index) => <span key={index}>{item.quantity}× {item.name}</span>)}<b>{money(data.total)}</b><span>{data.immediate && <Zap />}{data.schedule}</span></div>
    <div className="zipco-av-consent"><div><b>Permitir que este negocio me escriba por WhatsApp</b><p>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</p></div>
      <ContactSwitch checked={contact} disabled={busy || contactLocked} onChange={() => { contact ? setRemoveContact(true) : onContactChange(true); }} />
    </div>
    {contactLocked && <p className="zipco-av-dialog-hint">Reintentaremos la solicitud original con la misma elección de contacto.</p>}
    {error && <p role="alert" className="zipco-av-error">{error}</p>}
    <button type="button" className="zipco-av-primary zipco-av-send" disabled={busy} onClick={onSend}><Send aria-hidden="true" />{busy ? 'Enviando…' : 'Enviar solicitud'}</button>
  </Modal>
  <DesignConfirmation open={open && removeContact} onOpenChange={setRemoveContact} title="¿Quitar el contacto por WhatsApp?"
    description="Si lo quitas, el negocio podrá confirmar si lo tiene disponible, pero no podrá escribirte por WhatsApp. Para coordinar el pago y el retiro tendrás que autorizarlo más adelante, o hacerlo directamente en el local."
    confirmLabel="Quitar" onConfirm={() => onContactChange(false)}><p className="zipco-av-dialog-hint">Puedes volver a activarlo ahora o cuando el negocio confirme disponibilidad.</p></DesignConfirmation>
  </>;
}

const PICKUP_MESSAGE_PLACEHOLDER = DEFAULT_PICKUP_MESSAGE;
const PICKUP_SCHEDULE_PLACEHOLDER = 'Av. Leones 000, hasta las 15 hrs';

export function ConfirmAvailabilityDesign({ open, onOpenChange, onChoose, initialStep = 'choice', busy = false, error, purpose = 'availability',reservationContract=false,reservationTotal=0,simplified=false,recovery,checking=false,responseSchedule }: {
  open: boolean; onOpenChange: (open: boolean) => void; onChoose: (choice: AvailabilityDesignChoice) => void;
  initialStep?: 'choice' | 'pickup'; busy?: boolean; error?: string; purpose?: 'availability' | 'proposal';
  reservationContract?:boolean;reservationTotal?:number;simplified?:boolean;recovery?:ReactNode;checking?:boolean;responseSchedule?:{businessId?:number|null;date?:string|null;time?:string|null};
}) {
  const [step, setStep] = useState(initialStep);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [contact, setContact] = useState(false);
  const [offer,setOffer]=useState<ReservationOfferInput|null>({mode:'NONE'});
  const bodyRef = useRef<HTMLDivElement>(null);
  const messageId = useId(), scheduleId = useId(), scheduleBoxId = useId(), contactId = useId(), contactHintId = useId(), messageHintId = useId();
  const changeOpen = (value: boolean) => { if (!busy) onOpenChange(value); };

  const pickup = step === 'pickup';
  const prepaySelected = reservationContract && offer?.mode === 'PREPAYMENT';
  const messageMissing = message.trim().length === 0;
  const contactMissing = reservationContract && offer?.mode === 'PREPAYMENT' && !contact;
  const hardDisabled = busy || reservationContract && !offer || contactMissing;
  const hint = reservationContract && !offer ? 'Revisa las condiciones de reserva.' : contactMissing ? 'Activa el contacto por WhatsApp para ofrecer reserva con pago.' : '';
  const amountLabel = offer?.mode === 'PREPAYMENT' && 'requiredAmountClp' in offer ? ` · ${money(offer.requiredAmountClp)}` : '';
  const reserveText = !reservationContract ? '' : prepaySelected ? `Reserva con pago previo${amountLabel}` : offer?.mode === 'FREE' ? 'Reserva sin pago previo' : offer?.mode === 'NONE' ? 'Sin reserva' : '';
  const chip = !reservationContract ? 'RETIRO' : prepaySelected ? `PAGO PREVIO${amountLabel}` : offer?.mode === 'FREE' ? 'RESERVA GRATIS' : offer?.mode === 'NONE' ? 'SIN RESERVA' : 'RETIRO';
  const chipKind = prepaySelected ? 'pre' : offer?.mode === 'FREE' ? 'free' : '';
  const summary = `Retiro · ${reserveText ? `${reserveText} · ` : ''}Contacto ${contact ? 'permitido' : 'apagado'}`;

  const confirm = () => {
    if (hardDisabled) return;
    onChoose({ channel: 'pickup', instructions: { message: message.trim() || DEFAULT_PICKUP_MESSAGE, scheduleOrAddress: schedule.trim(), allowsContact: contact,...(reservationContract&&offer?{reservationOffer:offer}:{}) } });
  };
  const goToChoice = () => setStep('choice');
  const label = checking ? 'Comprobando…' : busy ? 'Guardando…' : purpose === 'proposal' ? 'Usar este camino' : 'Confirmar disponibilidad';

  return <Modal open={open} onOpenChange={changeOpen} variant="pickup" compact={pickup} bodyRef={bodyRef} icon={<CircleCheck />} busy={busy} stacked={purpose==='proposal'}
    beforeIcon={pickup && <button type="button" className="zipco-pk-bk" disabled={busy} onClick={goToChoice}><ArrowLeft aria-hidden="true" /><span className="zipco-pk-sr">Cambiar opción</span></button>}
    title={step === 'choice' ? purpose === 'proposal' ? '¿Cómo seguirá esta propuesta?' : '¿Cómo seguirá este pedido?' : 'Retiro en el local'}
    description={step === 'choice' ? purpose === 'proposal' ? 'Elige el camino que acompañará las condiciones de tu propuesta.' : 'Elige cómo continuar. La disponibilidad se confirma al guardar.' : 'El cliente se acerca al local y paga allí. No hace falta coordinar.'}
    footer={<>
      {error && <p role="alert" className="zipco-pk-err">{error}</p>}
      {recovery}
      {pickup && <p className="zipco-pk-sum">{summary}</p>}
      {pickup && hint && <p className="zipco-pk-fh" role="status">{hint}</p>}
      <div className="zipco-pk-fb"><button type="button" className="zipco-pk-back" disabled={busy} onClick={() => changeOpen(false)}>Volver</button>
        {pickup && <button type="button" className="zipco-pk-go" disabled={hardDisabled} onClick={confirm}>{label}</button>}
      </div>
    </>}>
    {responseSchedule&&<div className="zipco-pk-notice"><BusinessResponseHoursNotice {...responseSchedule} active={open}/></div>}
    <fieldset className="zipco-pk-fs" disabled={busy}>
    {!pickup ? <>
      <p className="zipco-pk-hint"><LockKeyhole aria-hidden="true" /><span>{BUSINESS_CONTACT_COPY}</span></p>
      <button type="button" className="zipco-pk-opt zipco-pk-opt-wa" onClick={() => onChoose({ channel: 'whatsapp' })}>
        <span className="zipco-pk-opt-ic"><WhatsAppMark /></span><span className="zipco-pk-opt-tx"><b>Coordinar por WhatsApp</b><span>Hablas con el cliente para acordar los detalles</span><small><LockKeyhole aria-hidden="true" />Compartes tu teléfono si el cliente continúa con la compra</small></span><span className="zipco-pk-opt-go"><ChevronRight aria-hidden="true" /></span>
      </button>
      <button type="button" className="zipco-pk-opt zipco-pk-opt-pk" onClick={() => setStep('pickup')}>
        <span className="zipco-pk-opt-ic"><Store /></span><span className="zipco-pk-opt-tx"><b>Retiro en el local</b><span>El cliente va al local y paga allí</span><small><ShieldCheck aria-hidden="true" />Tu teléfono no se comparte (puedes activarlo)</small></span><span className="zipco-pk-opt-go"><ChevronRight aria-hidden="true" /></span>
      </button>
    </> : <>
      {reservationContract && <div className={`zipco-pk-reserve${simplified ? '' : ' zipco-pk-legacy'}`}>
        {simplified?<SimpleReservationOfferFields total={reservationTotal} onChange={setOffer} disabled={busy}/>:<ReservationOfferFields total={reservationTotal} onChange={setOffer} disabled={busy}/> }
      </div>}
      {reservationContract&&offer?.mode==='PREPAYMENT'&&!contact&&<p role="alert" className="zipco-pk-warn">Para ofrecer reserva con pago, activa «Sí, permitir» para autorizar compartir tu propio teléfono.</p>}
      <section className="zipco-pk-sc">
        <label className="zipco-pk-sl" htmlFor={messageId}><span className="zipco-pk-si"><Pencil aria-hidden="true" /></span><span className="zipco-pk-grow">Mensaje para el cliente (opcional)</span><i>{Array.from(message).length}/120</i></label>
        <textarea id={messageId} className="zipco-pk-in" rows={2} value={message} aria-describedby={messageHintId}
          onChange={event => setMessage(Array.from(event.target.value).slice(0,120).join(''))} placeholder={PICKUP_MESSAGE_PLACEHOLDER} />
        <p id={messageHintId} className="zipco-pk-h">Si no escribes, se enviará: «{DEFAULT_PICKUP_MESSAGE}».</p>
      </section>
      <section className="zipco-pk-sc">
        <button type="button" className="zipco-pk-fold" aria-expanded={scheduleOpen} aria-controls={scheduleBoxId} onClick={() => setScheduleOpen(value => !value)}>
          <span className="zipco-pk-si"><Clock aria-hidden="true" /></span><span className="zipco-pk-grow">Horario o dirección <em>(opcional)</em></span>
          {schedule && Array.from(schedule).length > 0 ? <i className="zipco-pk-fold-n">{Array.from(schedule).length}/80</i> : <i className="zipco-pk-fold-i" aria-hidden="true"><Plus /></i>}
        </button>
        <div id={scheduleBoxId} hidden={!scheduleOpen} className="zipco-pk-schbox">
          <label className="zipco-pk-inw"><Clock aria-hidden="true" /><input id={scheduleId} className="zipco-pk-in" aria-label="Horario o dirección" value={schedule} onChange={event => setSchedule(Array.from(event.target.value).slice(0,80).join(''))} placeholder={PICKUP_SCHEDULE_PLACEHOLDER} /></label>
          <p className="zipco-pk-h">Texto libre: dirección o indicaciones. No cambia la fecha del pedido.</p>
        </div>
      </section>
      <section className="zipco-pk-sc">
        <button type="button" role="switch" id={contactId} aria-checked={contact} aria-describedby={contactHintId}
          className={`zipco-pk-swr${contact ? ' zipco-pk-on' : ''}`} onClick={() => setContact(value => !value)}>
          <span className="zipco-pk-si"><Phone aria-hidden="true" /></span>
          <span className="zipco-pk-swt">
            <b>¿Quieres que el cliente te escriba por WhatsApp?</b>
            <small id={contactHintId}>{contact ? 'Tu teléfono se compartirá solo después de que el cliente confirme continuar.' : 'Apagado: el cliente no verá tu teléfono.'}</small></span>
          <span className="zipco-pk-sw" aria-hidden="true" />
        </button>
        {contact && <p className="zipco-pk-hint">{BUSINESS_CONTACT_COPY}</p>}
      </section>
      <section className="zipco-pk-sc zipco-pk-pvs">
        <b className="zipco-pk-sl"><span className="zipco-pk-si"><Eye aria-hidden="true" /></span><span className="zipco-pk-grow">Así lo verá el cliente</span><em className={`zipco-pk-chip${chipKind ? ` zipco-pk-chip-${chipKind}` : ''}`}>{chip}</em></b>
        <div className="zipco-pk-tk"><p className="zipco-pk-tkm">{messageMissing ? DEFAULT_PICKUP_MESSAGE : message.trim()}</p>
          {schedule.trim() && <><div className="zipco-pk-perf" aria-hidden="true"><i /><span /><i /></div>
            <div className="zipco-pk-stub"><span aria-hidden="true"><MapPin /></span><div><small>DIRECCIÓN Y HORARIO</small><b>{schedule.trim()}</b></div></div></>}
        </div>
      </section>
    </>}
    </fieldset>
  </Modal>;
}

export function BusinessDesignActions({ data, onConfirm, onAlternative, onReject }: {
  data: RequestDesignData; onConfirm: () => void; onAlternative: () => void; onReject: () => void;
}) {
  return <div className="zipco-av-business-actions">
    <AcceptGlassButton label="Confirmar disponibilidad" price={data.total} onClick={onConfirm} />
    <p className="zipco-av-fine"><LockKeyhole />En el siguiente paso eliges cómo continuar y si compartes tu teléfono.</p>
    <div className="zipco-av-secondary-actions"><button type="button" onClick={onAlternative}><ArrowLeftRight />Proponer alternativa</button><button type="button" onClick={onReject}><X />Rechazar solicitud</button></div>
  </div>;
}

const DISPONIBLE = 'DISPONIBLE'.split('');

/** Hora de la oferta, siempre en Santiago; no altera la fecha acordada. */
const shortWhen = (iso: string) => {
  const date = new Date(iso), timeZone = 'America/Santiago';
  const day = new Intl.DateTimeFormat('es-CL', { timeZone, day: 'numeric', month: 'short' }).format(date).replace(/\./g, '');
  const time = new Intl.DateTimeFormat('es-CL', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  return `${day} · ${time}`;
};

/** Elección local, visible antes de continuar cuando no existe un diálogo de reserva simplificada. */
function ContactConsent({ contact, busy, onChange, short = false }: { contact: boolean; busy: boolean; onChange: (checked: boolean) => void; short?: boolean }) {
  const stateId = useId();
  return <><div className="zipco-avwa-consent"><div><b>{short ? 'Permitir que me escriban por WhatsApp' : 'Permitir que este negocio me escriba por WhatsApp'}</b>
    <span id={stateId} role="status" className="zipco-avwa-state" data-on={contact}>{contact ? 'Permitido' : 'No permitido'}</span></div>
    <ContactSwitch checked={contact} disabled={busy} onChange={() => onChange(!contact)} /></div>
    <small>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</small></>;
}

/** Presentación canónica de «Disponible» para WhatsApp y retiro local.
 * Cambian únicamente los datos y controles que ya entrega AvailabilityFlowCard.
 * Los estados posteriores y las ventanas de decisión mantienen sus propietarios. */
export function AvailableRequestDesign({ data, expanded, onToggle, pickup, contact, onContactChange, onContinue, onDecline, busy = false, error, extraDetails, reservationNote, onReservationNote, onReserve, simplified = false, leaving = false, recovery }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; pickup?: Omit<PickupDesign, 'reservationOffer'> & { reservationOffer?: ReservationOffer };
  contact: boolean; onContactChange: (checked: boolean) => void; onContinue: () => void; onDecline: () => void; busy?: boolean; error?: string; extraDetails?: ReactNode;
  reservationNote?: string; onReservationNote?: (v: string) => void; onReserve?: () => void; simplified?: boolean;
  /** Salida tras respuesta guardada; no ejecuta acciones. */
  leaving?: boolean;
  /** Recuperación real, siempre fuera del detalle plegable. */
  recovery?: ReactNode;
}) {
  const detailsId = useId(), noteId = useId();
  const [noteOpen, setNoteOpen] = useState(() => !!reservationNote);
  const cardRef = useRef<HTMLElement>(null), foldRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (cardRef.current) cardRef.current.inert = leaving; }, [leaving]);
  useEffect(() => { if (foldRef.current) foldRef.current.inert = !expanded; }, [expanded]);
  const offer = pickup?.reservationOffer, canReserve = !!offer && offer.mode !== 'NONE';
  const paid = offer?.mode === 'PREPAYMENT';
  const amount = paid ? money(offer.requiredAmountClp) : '';
  const scheduledFor = isSimpleOffer(offer) ? offer.simplified.scheduledFor : null;
  const when = scheduledFor ? shortWhen(scheduledFor) : data.immediate ? 'Lo antes posible' : data.schedule && data.schedule !== 'Sin horario solicitado' ? data.schedule : '';
  const reserveAction = !simplified ? onReserve : undefined;
  const hasNote = !!pickup && !simplified && canReserve && !!onReservationNote;
  const showContact = !simplified && (!pickup || pickup.allowsContact);
  const many = data.items.length > 1, first = data.items[0];
  const kind = !pickup ? 'whatsapp' : paid ? 'paid' : canReserve ? 'free' : 'none';
  return <article ref={cardRef} className="zipco-avpro" data-channel={pickup ? 'LOCAL_PICKUP' : 'WHATSAPP'} data-offer={offer?.mode} data-expanded={expanded} data-leaving={leaving ? 'true' : undefined} aria-busy={busy}
    aria-label={`${data.counterpart}: disponibilidad confirmada`}>
    <i className="zipco-avpro-glow zipco-avpro-glow-a" aria-hidden="true" /><i className="zipco-avpro-glow zipco-avpro-glow-b" aria-hidden="true" />
    <div className="zipco-avpro-banner">
      <i className="zipco-avpro-spark" aria-hidden="true" /><i className="zipco-avpro-spark zipco-avpro-spark-b" aria-hidden="true" /><i className="zipco-avpro-spark zipco-avpro-spark-c" aria-hidden="true" />
      <div className="zipco-avpro-bt">
        <small className="zipco-avpro-biz">{data.counterpart}</small>
        <p className="zipco-avpro-head">Tienen tu producto</p>
        <h2 className="zipco-avpro-pill"><i aria-hidden="true"><Check /></i><span className="zipco-avwa-sr">Disponible</span><b aria-hidden="true">{DISPONIBLE.map((letter, index) => <span key={index} style={{ animationDelay: `${(index * 0.09).toFixed(2)}s` }}>{letter}</span>)}</b></h2>
        <p className="zipco-avwa-sr">Confirmaron que lo tienen. ¿Quieres continuar con la compra?</p>
      </div>
      <ProductPreviewControl className="zipco-avpro-thumb" fallback={<span className="zipco-avpro-ticon"><Store aria-hidden="true" /></span>} />
    </div>
    <p className="zipco-avpro-prod"><span><b>{many ? `${data.items.length} productos` : first?.name}</b>{!many && first ? <> · {first.quantity}×</> : null} · {money(data.total)} <small>SOLICITADO</small></span>
      <span className="zipco-avpro-mode">{pickup ? <Store aria-hidden="true" /> : <WhatsAppMark />}{pickup ? 'Retiro en el local' : 'Por WhatsApp'}</span></p>
    <section className="zipco-avpro-offer" data-kind={kind} aria-label={canReserve ? 'Oferta de reserva' : pickup ? 'Retiro sin reserva' : 'Coordinación por WhatsApp'}><div className="zipco-avpro-hero">
      <span className="zipco-avpro-bm" aria-hidden="true"><u /><u /><em>{!pickup ? <WhatsAppMark /> : canReserve ? <BookmarkCheck /> : <Store />}</em><s /><s /></span>
      <div><h3>{!pickup ? 'Coordinarán por WhatsApp' : canReserve ? 'Puedes reservar este producto' : 'Retiro por orden de llegada'}</h3>
        {!pickup ? <p className="zipco-avpro-explain">El negocio quiere acordar contigo los detalles, el pago y la entrega por WhatsApp.</p>
          : !canReserve ? <p className="zipco-avpro-explain">Atención por orden de llegada. El producto no se guarda y podría agotarse.</p> : null}
        <div className="zipco-avpro-meta">
          {pickup && <span className="zipco-avpro-chip">{paid ? <Zap aria-hidden="true" /> : <Check aria-hidden="true" />}{paid ? `PAGO PREVIO${amount ? ` · ${amount}` : ''}` : canReserve ? 'RESERVA GRATIS' : 'SIN RESERVA'}</span>}
          {when && <span className="zipco-avpro-fact"><CalendarDays aria-hidden="true" />{pickup ? 'Retiro' : 'Pedido'} {when}</span>}
        </div></div></div></section>
    {error && <p role="alert" className="zipco-avpro-error">{error}</p>}
    {recovery}
    <div ref={foldRef} id={detailsId} className="zipco-avwa-fold zipco-avpro-fold" data-open={expanded} aria-hidden={!expanded}><div><div className="zipco-avpro-detail">
      {many && <Items data={data} showPrice />}
      {extraDetails && <div className="zipco-avpro-extra">{extraDetails}</div>}
      {pickup && <section className="zipco-avpro-pick" aria-label="Retiro en el local">
        <div className="zipco-avpro-pkh"><span aria-hidden="true"><Store /></span><h3>El negocio te espera en el local</h3></div>
        <div className="zipco-avpro-tk"><blockquote className="zipco-avpro-msg">{pickup.message || DEFAULT_PICKUP_MESSAGE}</blockquote>
          {pickup.scheduleOrAddress && <><div className="zipco-avpro-perf" aria-hidden="true"><i /><span /><i /></div>
            <div className="zipco-avpro-stub"><span aria-hidden="true"><MapPin /></span><div><small>DIRECCIÓN Y HORARIO</small><b>{pickup.scheduleOrAddress}</b></div></div></>}</div>
      </section>}
      <div className="zipco-avpro-cond" data-full={!simplified && canReserve || undefined}>
        {canReserve && <ReservationOfferSummary offer={offer} compact={simplified} />}
        <p className="zipco-avpro-fine"><ShieldCheck aria-hidden="true" />Esto no representa un pago realizado.</p>
      </div>
      {hasNote && <div className="zipco-avpro-note">
        <button type="button" disabled={busy} aria-expanded={noteOpen} aria-controls={noteId} onClick={() => setNoteOpen(v => !v)}><Pencil aria-hidden="true" />Agregar nota para la reserva (opcional)<ChevronDown aria-hidden="true" /></button>
        {noteOpen && <label id={noteId}><span className="zipco-avwa-sr">Nota para la reserva</span><textarea aria-label="Nota para la reserva" disabled={busy} value={reservationNote ?? ''} onChange={e => onReservationNote!(Array.from(e.target.value).slice(0, 300).join(''))} /></label>}
      </div>}
    </div></div></div>
    {showContact && <div className="zipco-avpro-consent"><ContactConsent contact={contact} busy={busy} onChange={onContactChange} short={!!pickup} /></div>}
    <div className="zipco-avpro-actions">
      {reserveAction && <div className="zipco-avpro-reserve"><AcceptGlassButton label={busy ? 'Guardando…' : paid ? 'Solicitar reserva con pago previo' : 'Solicitar reserva'} flush disabled={busy} onClick={reserveAction} /></div>}
      <AcceptGlassButton label={busy ? 'Guardando…' : reserveAction ? 'Iré sin reserva' : 'Sí, continuar con la compra'} flush disabled={busy} onClick={onContinue} />
      <div className="zipco-avpro-row">
        <button type="button" className="zipco-avpro-decline" disabled={busy} onClick={onDecline}><X aria-hidden="true" />No, gracias</button>
        <button type="button" className="zipco-avpro-dis" disabled={busy || leaving} aria-expanded={expanded} aria-controls={detailsId} onClick={onToggle}>{expanded ? 'Ocultar detalle' : 'Ver detalle'}<ChevronDown aria-hidden="true" /></button>
      </div>
    </div>
  </article>;
}
