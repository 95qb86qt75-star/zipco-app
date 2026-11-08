import * as React from 'react';
import BusinessResponseHoursNotice from "../hours/BusinessResponseHoursNotice";
import { useId, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, BookmarkCheck, ArrowLeftRight, CalendarDays, Check, ChevronDown, ChevronRight, ChevronUp, CircleCheck, Clock, Eye, Hourglass, LockKeyhole, MapPin, Pencil, Phone, Plus, Send, ShieldCheck, Store, UserRound, X, Zap } from 'lucide-react';
import AcceptGlassButton from "../../cards/shared/coordination/AcceptGlassButton";
import WhatsAppMark from "../icons/WhatsAppMark";
import "./availability-design.css";
import ProductPreviewControl from "../product-preview/ProductPreviewControl";
import { BUSINESS_CONTACT_COPY } from "../../domain/availabilityContract";
import type { ReservationOffer, ReservationOfferInput } from "../../domain/reservationContract";
import SimpleReservationOfferFields from "../reservations/SimpleReservationOfferFields";
import ReservationOfferFields from "../reservations/ReservationOfferFields";
import ReservationOfferSummary from "../reservations/ReservationOfferSummary";

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

function Disclosure({ open, onToggle, controls }: { open: boolean; onToggle: () => void; controls: string }) {
  return <button type="button" className="zipco-av-disclosure" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
    {open ? 'Ocultar detalle' : 'Ver detalle'}{open ? <ChevronUp /> : <ChevronDown />}
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

export function PendingRequestDesign({ data, expanded, onToggle, contactIntent, business = false, actions, detail }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; contactIntent?: boolean; business?: boolean; actions?: ReactNode; detail?: ReactNode;
}) {
  const detailsId = useId();
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
  onConfirm: () => void; children?: ReactNode; cancelLabel?: string; variant?: 'decline';
}) {
  // Explicit visual variant: unrelated confirmations keep their existing presentation.
  const decline = variant === 'decline';
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}><AlertDialog.Portal>
    <AlertDialog.Overlay className="zipco-av-overlay zipco-av-alert-overlay" />
    <AlertDialog.Content className={`zipco-av-dialog zipco-av-alert${decline ? ' zipco-av-alert-decline' : ''}`}>
      {decline && <span className="zipco-av-decline-ic" aria-hidden="true"><X /></span>}
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

/** Piezas compartidas por las dos modalidades de «Disponible» (WhatsApp y retiro local): mismo significado y mismo comportamiento. */
/** Estado «DISPONIBLE» + carril. Se pliega al abrir el detalle. `third` nombra el siguiente paso de cada modalidad (WHATSAPP / RETIRO). */
function AvailableStatusFold({ expanded, third }: { expanded: boolean; third: string }) {
  return <div className="zipco-avwa-fold" data-open={!expanded} aria-hidden={expanded}><div><div className="zipco-avwa-status">
    <h2 className="zipco-avwa-pill"><i aria-hidden="true"><Check /></i><span className="zipco-avwa-sr">Disponible</span><b aria-hidden="true">{DISPONIBLE.map((letter, index) => <span key={index} style={{ animationDelay: `${(index * 0.09).toFixed(2)}s` }}>{letter}</span>)}</b></h2>
    <p className="zipco-av-subtitle">Confirmaron que lo tienen. ¿Quieres continuar con la compra?</p>
    <ol className="zipco-avwa-rail" aria-label="Estado de la solicitud">
      <li data-kind="done"><span aria-hidden="true"><Check /></span><small>NEGOCIO</small><b>Disponible</b></li>
      <li data-kind="now"><span aria-hidden="true"><Hourglass /></span><small>TÚ</small><b>Decidir</b></li>
      <li data-kind="lock"><span aria-hidden="true"><LockKeyhole /></span><small>{third}</small><b>Después</b></li>
    </ol>
  </div></div></div>;
}

/** Interruptor de contacto (elección local del cliente; no envía nada por sí solo) + texto de consentimiento. */
function ContactConsent({ contact, busy, onChange, short = false }: { contact: boolean; busy: boolean; onChange: (checked: boolean) => void; short?: boolean }) {
  const stateId = useId();
  return <><div className="zipco-avwa-consent"><div><b>{short ? 'Permitir que me escriban por WhatsApp' : 'Permitir que este negocio me escriba por WhatsApp'}</b>
    <span id={stateId} role="status" className="zipco-avwa-state" data-on={contact}>{contact ? 'Permitido' : 'No permitido'}</span></div>
    <ContactSwitch checked={contact} disabled={busy} onChange={() => onChange(!contact)} /></div>
    <small>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</small></>;
}

function AvailableFoldToggle({ expanded, busy, leaving, controls, onToggle }: { expanded: boolean; busy: boolean; leaving: boolean; controls: string; onToggle: () => void }) {
  return <footer className="zipco-av-ticket-footer zipco-av-centered">
    <button type="button" className="zipco-av-disclosure zipco-avwa-dis" disabled={busy || leaving} aria-expanded={expanded} aria-controls={controls} onClick={onToggle}>{expanded ? 'Ocultar detalle' : 'Ver detalle'}<ChevronDown aria-hidden="true" /></button>
  </footer>;
}

/** Camino «Coordinarán por WhatsApp» (diseño CliU18). Única implementación de esta variante; el retiro local sigue en AvailableRequestDesign.
 *  Solo presentación: usa los mismos datos, callbacks y componentes reales (ProductPreviewControl, AcceptGlassButton, ContactSwitch). */
function AvailableWhatsappDesign({ data, expanded, onToggle, contact, onContactChange, onContinue, onDecline, busy, error, extraDetails, onReserve, simplified, leaving, recovery }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; contact: boolean; onContactChange: (checked: boolean) => void;
  onContinue: () => void; onDecline: () => void; busy: boolean; error?: string; extraDetails?: ReactNode;
  onReserve?: () => void; simplified: boolean; leaving: boolean; recovery?: ReactNode;
}) {
  const detailsId = useId();
  return <article className="zipco-av-ticket zipco-av-available zipco-av-available-wa" data-leaving={leaving ? 'true' : undefined} data-expanded={expanded} aria-busy={busy}
    aria-label={`${data.counterpart}: disponibilidad confirmada`} {...(leaving?{inert:''}:{})}>
    <div className="zipco-av-ticket-inner"><TicketHeader data={data} kind="available" />
      {/* Estado + carril: se pliegan al abrir el detalle para que la tarjeta no ocupe toda la pantalla. */}
      <AvailableStatusFold expanded={expanded} third="WHATSAPP" />
      {/* Los errores y la recuperación nunca quedan ocultos por el pliegue. */}
      {error && <p role="alert" className="zipco-av-error">{error}</p>}
      {recovery}
      <div id={detailsId} className="zipco-avwa-fold" data-open={expanded} aria-hidden={!expanded} {...(!expanded?{inert:''}:{})}><div><div className="zipco-avwa-detail">
        <Items data={data} showPrice />
        {extraDetails && <div className="zipco-avwa-extra">{extraDetails}</div>}
        <section className="zipco-avwa-card" aria-label="Coordinación por WhatsApp">
          <div className="zipco-avwa-how"><span className="zipco-avwa-wa" aria-hidden="true"><WhatsAppMark /></span><div><h3>Coordinarán por WhatsApp</h3>
            <p>El negocio quiere acordar contigo los detalles, el pago y la entrega por WhatsApp.</p></div></div>
          {!simplified && <ContactConsent contact={contact} busy={busy} onChange={onContactChange} />}
        </section>
        {!simplified && onReserve && <AcceptGlassButton label={busy ? 'Guardando…' : 'Solicitar reserva'} flush disabled={busy} onClick={onReserve} />}
        <div className="zipco-av-decisions zipco-avwa-decisions"><AcceptGlassButton label={busy ? 'Guardando…' : onReserve ? 'Iré sin reserva' : 'Sí, continuar con la compra'} flush disabled={busy} onClick={onContinue} />
          <button type="button" className="zipco-av-decline" disabled={busy} onClick={onDecline}><X />No, gracias</button></div>
        <p className="zipco-av-fine zipco-av-centered"><ShieldCheck />Esto no representa un pago realizado.</p>
      </div></div></div>
      <AvailableFoldToggle expanded={expanded} busy={busy} leaving={leaving} controls={detailsId} onToggle={onToggle} />
    </div>
  </article>;
}

/** Camino «Retiro en el local» (diseño CliU19, mismo lenguaje que WhatsApp pero más compacto). Única implementación de esta variante.
 *  Solo presentación: los datos, permisos, reservas y callbacks vienen de AvailabilityFlowCard. La clase «-wa» es la base compartida del
 *  diseño aprobado (nombre histórico); «-pk» agrega lo propio del retiro. */
function AvailablePickupDesign({ data, expanded, onToggle, pickup, contact, onContactChange, onContinue, onDecline, busy, error, extraDetails, reservationNote, onReservationNote, onReserve, simplified, leaving, recovery }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; pickup: Omit<PickupDesign, 'reservationOffer'> & { reservationOffer?: ReservationOffer };
  contact: boolean; onContactChange: (checked: boolean) => void; onContinue: () => void; onDecline: () => void; busy: boolean; error?: string; extraDetails?: ReactNode;
  reservationNote?: string; onReservationNote?: (v: string) => void; onReserve?: () => void; simplified: boolean; leaving: boolean; recovery?: ReactNode;
}) {
  const detailsId = useId(), noteId = useId();
  const [noteOpen, setNoteOpen] = useState(() => !!reservationNote);
  const offer = pickup.reservationOffer, canReserve = !!offer && offer.mode !== 'NONE';
  const paid = offer?.mode === 'PREPAYMENT';
  const amount = offer && 'requiredAmountClp' in offer && typeof offer.requiredAmountClp === 'number' ? money(offer.requiredAmountClp) : '';
  const hero = simplified && canReserve;                 // contrato simplificado con reserva: el aviso «Puedes reservar» va siempre visible
  const legacyOffer = !simplified && !!offer;            // contrato antiguo: la oferta real se ve dentro de la ficha de retiro
  const hasNote = !simplified && canReserve && !!onReservationNote;
  return <article className="zipco-av-ticket zipco-av-available zipco-av-available-wa zipco-av-available-pk" data-offer={offer?.mode ?? 'NONE'} data-leaving={leaving ? 'true' : undefined} data-expanded={expanded} aria-busy={busy}
    aria-label={`${data.counterpart}: disponibilidad confirmada`} {...(leaving ? { inert: '' } : {})}>
    <div className="zipco-av-ticket-inner"><TicketHeader data={data} kind="available" />
      <AvailableStatusFold expanded={expanded} third="RETIRO" />
      {/* Contrato simplificado: el aviso y la oferta real se ven siempre; las condiciones (componente real) solo con el detalle abierto. */}
      {simplified && offer && (hero
        ? <section className="zipco-avpk-op" data-mode={paid ? 'PREPAYMENT' : 'FREE'} aria-label="Oferta de reserva"><div className="zipco-avpk-hero">
            <span className="zipco-avpk-bm" aria-hidden="true"><u /><u /><em><BookmarkCheck /></em><s /><s /></span>
            <div><div className="zipco-avpk-top"><small>OPORTUNIDAD</small>
              <span className="zipco-avpk-chip" data-kind={paid ? 'pre' : 'free'}>{paid ? <Zap aria-hidden="true" /> : <Check aria-hidden="true" />}{paid ? `PAGO PREVIO${amount ? ` · ${amount}` : ''}` : 'RESERVA GRATIS'}</span></div>
              <h3>Puedes reservar este producto</h3><p>El negocio lo permite. Reserva con <b>«Sí, continuar con la compra»</b>.</p></div></div>
            <div className="zipco-avwa-fold" data-open={expanded} aria-hidden={!expanded} {...(!expanded ? { inert: '' } : {})}><div><div className="zipco-avpk-det"><ReservationOfferSummary offer={offer} compact /></div></div></div></section>
        : <div className="zipco-avpk-offer"><ReservationOfferSummary offer={offer} /></div>)}
      {/* Los errores y la recuperación nunca quedan ocultos por el pliegue. */}
      {error && <p role="alert" className="zipco-av-error">{error}</p>}
      {recovery}
      <div id={detailsId} className="zipco-avwa-fold" data-open={expanded} aria-hidden={!expanded} {...(!expanded ? { inert: '' } : {})}><div><div className="zipco-avwa-detail">
        <Items data={data} showPrice />
        {extraDetails && <div className="zipco-avwa-extra">{extraDetails}</div>}
        <section className="zipco-avwa-card zipco-avpk-card" aria-label="Retiro en el local">
          <div className="zipco-avpk-hd"><span className="zipco-avpk-ic" aria-hidden="true"><Store /></span><h3>El negocio te espera en el local</h3></div>
          <div className="zipco-avpk-tk"><blockquote className="zipco-avpk-msg">{pickup.message || DEFAULT_PICKUP_MESSAGE}</blockquote>
            {pickup.scheduleOrAddress && <><div className="zipco-avpk-perf" aria-hidden="true"><i /><span /><i /></div>
              <div className="zipco-avpk-stub"><span aria-hidden="true"><MapPin /></span><div><small>DIRECCIÓN Y HORARIO</small><b>{pickup.scheduleOrAddress}</b></div></div></>}</div>
          {!canReserve && <div className="zipco-avpk-sn"><span className="zipco-avpk-chip" data-kind="none"><X aria-hidden="true" />SIN RESERVA</span><p>Pagas y retiras directamente en el local.</p></div>}
          {legacyOffer && <div className="zipco-avpk-offer zipco-avpk-in"><ReservationOfferSummary offer={offer} /></div>}
          {hasNote && <><button type="button" className="zipco-avpk-nt" disabled={busy} aria-expanded={noteOpen} aria-controls={noteId} onClick={() => setNoteOpen(v => !v)}><Pencil aria-hidden="true" />Agregar nota para la reserva (opcional)<ChevronDown aria-hidden="true" /></button>
            {noteOpen && <label id={noteId} className="zipco-avpk-field"><span className="zipco-avwa-sr">Nota para la reserva</span><textarea aria-label="Nota para la reserva" disabled={busy} value={reservationNote ?? ''} onChange={e => onReservationNote!(Array.from(e.target.value).slice(0, 300).join(''))} /></label>}</>}
          {!simplified && pickup.allowsContact && <div className="zipco-avpk-cr"><ContactConsent contact={contact} busy={busy} onChange={onContactChange} short /></div>}
        </section>
        {!simplified && onReserve && <div className="zipco-avpk-res"><AcceptGlassButton label={busy ? 'Guardando…' : paid ? 'Solicitar reserva con pago previo' : 'Solicitar reserva'} flush disabled={busy} onClick={onReserve} /></div>}
        <div className="zipco-av-decisions zipco-avwa-decisions"><div className={onReserve ? 'zipco-avpk-sec' : undefined}><AcceptGlassButton label={busy ? 'Guardando…' : onReserve ? 'Iré sin reserva' : 'Sí, continuar con la compra'} flush disabled={busy} onClick={onContinue} /></div>
          <button type="button" className="zipco-av-decline" disabled={busy} onClick={onDecline}><X />No, gracias</button></div>
        <p className="zipco-av-fine zipco-av-centered"><ShieldCheck />Esto no representa un pago realizado.</p>
      </div></div></div>
      <AvailableFoldToggle expanded={expanded} busy={busy} leaving={leaving} controls={detailsId} onToggle={onToggle} />
    </div>
  </article>;
}

export function AvailableRequestDesign({ data, expanded, onToggle, pickup, contact, onContactChange, onContinue, onDecline, busy = false, error, extraDetails,reservationNote,onReservationNote,onReserve,simplified=false,leaving=false,recovery }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; pickup?: Omit<PickupDesign,'reservationOffer'> & {reservationOffer?:ReservationOffer};
  contact: boolean; onContactChange: (checked: boolean) => void; onContinue: () => void; onDecline: () => void; busy?: boolean; error?: string; extraDetails?: ReactNode;
  reservationNote?:string;onReservationNote?:(v:string)=>void;onReserve?:()=>void;simplified?:boolean;
  /** Ambas modalidades. La pone en true el flujo existente cuando ya va a quitar la tarjeta (tras el holograma): corre la salida visual. No cambia datos ni acciones. */
  leaving?: boolean;
  /** Ambas modalidades: se muestra siempre (también con el detalle plegado), junto al error. */
  recovery?: ReactNode;
}) {
  if (!pickup) return <AvailableWhatsappDesign data={data} expanded={expanded} onToggle={onToggle} contact={contact} onContactChange={onContactChange} onContinue={onContinue} onDecline={onDecline} busy={busy} error={error} extraDetails={extraDetails} onReserve={onReserve} simplified={simplified} leaving={leaving} recovery={recovery} />;
  return <AvailablePickupDesign data={data} expanded={expanded} onToggle={onToggle} pickup={pickup} contact={contact} onContactChange={onContactChange} onContinue={onContinue} onDecline={onDecline} busy={busy} error={error} extraDetails={extraDetails} reservationNote={reservationNote} onReservationNote={onReservationNote} onReserve={onReserve} simplified={simplified} leaving={leaving} recovery={recovery} />;
}
