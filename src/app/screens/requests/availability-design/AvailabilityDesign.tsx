import { useId, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, ArrowLeftRight, CalendarDays, ChevronDown, ChevronRight, ChevronUp, CircleCheck, Clock, Hourglass, LockKeyhole, Pencil, Send, ShieldCheck, Store, UserRound, X, Zap } from 'lucide-react';
import AcceptGlassButton from '../AcceptGlassButton';
import WhatsAppMark from '../WhatsAppMark';
import './availability-design.css';

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
export type PickupDesign = { message: string; scheduleOrAddress: string; allowsContact: boolean };
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
    <span className="zipco-av-ticket-icon"><Icon aria-hidden="true" /></span>
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

export function PendingRequestDesign({ data, expanded, onToggle, contactIntent, business = false, actions }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; contactIntent?: boolean; business?: boolean; actions?: ReactNode;
}) {
  const detailsId = useId();
  return <article className={`zipco-av-ticket ${business ? 'zipco-av-business' : 'zipco-av-waiting'}`} aria-label={`${data.counterpart}: ${business ? 'Nuevo pedido' : 'Pendiente de respuesta'}`}>
    <div className="zipco-av-ticket-inner"><TicketHeader data={data} kind={business ? 'business' : 'waiting'} />
      <h2 className="zipco-av-neon">{business ? 'NUEVO PEDIDO' : 'EN ESPERA'}</h2>
      <p className="zipco-av-subtitle">{business ? 'Revisa la solicitud y responde al cliente.' : 'Esperando la primera respuesta del negocio.'}</p>
      <div id={detailsId} hidden={!expanded}>
        <OriginalDetail data={data} compact={business} /><Perforation />
        {contactIntent !== undefined && <ContactIntent allowed={contactIntent} business={business} />}
        {business && actions}
      </div>
      <footer className={`zipco-av-ticket-footer${business ? ' zipco-av-centered' : ''}`}>
        <Disclosure open={expanded} onToggle={onToggle} controls={detailsId} />{!business && actions}
      </footer>
    </div>
  </article>;
}

function Modal({ open, onOpenChange, title, description, children, sheet = false, icon, beforeIcon, busy = false }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description: string; children: ReactNode; sheet?: boolean; icon?: ReactNode; beforeIcon?: ReactNode; busy?: boolean;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="zipco-av-overlay" />
    <Dialog.Content className={`zipco-av-dialog${sheet ? ' zipco-av-sheet' : ''}`}>
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

export function DesignConfirmation({ open, onOpenChange, title, description, confirmLabel, onConfirm, children, cancelLabel = 'Volver' }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel: string;
  onConfirm: () => void; children?: ReactNode; cancelLabel?: string;
}) {
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}><AlertDialog.Portal>
    <AlertDialog.Overlay className="zipco-av-overlay zipco-av-alert-overlay" />
    <AlertDialog.Content className="zipco-av-dialog zipco-av-alert">
      <AlertDialog.Title className="zipco-av-dialog-title">{title}</AlertDialog.Title>
      <AlertDialog.Description className="zipco-av-dialog-description">{description}</AlertDialog.Description>
      {children}<div className="zipco-av-button-row">
        <AlertDialog.Action asChild><button type="button" className="zipco-av-secondary" onClick={onConfirm}>{confirmLabel}</button></AlertDialog.Action>
        <AlertDialog.Cancel className="zipco-av-primary">{title === '¿Quitar el contacto por WhatsApp?' ? 'Mantener' : cancelLabel}</AlertDialog.Cancel>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal></AlertDialog.Root>;
}

export function ConsultationDesignSheet({ open, onOpenChange, data, contact, onContactChange, onSend, busy = false, error }: {
  open: boolean; onOpenChange: (open: boolean) => void; data: RequestDesignData; contact: boolean;
  onContactChange: (checked: boolean) => void; onSend: () => void; busy?: boolean; error?: string;
}) {
  const [removeContact, setRemoveContact] = useState(false);
  return <><Modal open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }} sheet icon={<Send />} busy={busy}
    title="Requiero este producto" description="El negocio te confirmará si lo tiene disponible. Aún no compras nada.">
    <div className="zipco-av-summary-chips">{data.items.map((item, index) => <span key={index}>{item.quantity}× {item.name}</span>)}<b>{money(data.total)}</b><span>{data.immediate && <Zap />}{data.schedule}</span></div>
    <div className="zipco-av-consent"><div><b>Permitir que este negocio me escriba por WhatsApp</b><p>Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.</p></div>
      <ContactSwitch checked={contact} disabled={busy} onChange={() => { contact ? setRemoveContact(true) : onContactChange(true); }} />
    </div>
    {error && <p role="alert" className="zipco-av-error">{error}</p>}
    <button type="button" className="zipco-av-primary zipco-av-send" disabled={busy} onClick={onSend}><Send aria-hidden="true" />{busy ? 'Enviando…' : 'Enviar solicitud'}</button>
  </Modal>
  <DesignConfirmation open={open && removeContact} onOpenChange={setRemoveContact} title="¿Quitar el contacto por WhatsApp?"
    description="Si lo quitas, el negocio podrá confirmar si lo tiene disponible, pero no podrá escribirte por WhatsApp. Para coordinar el pago y el retiro tendrás que autorizarlo más adelante, o hacerlo directamente en el local."
    confirmLabel="Quitar" onConfirm={() => onContactChange(false)}><p className="zipco-av-dialog-hint">Puedes volver a activarlo ahora o cuando el negocio confirme disponibilidad.</p></DesignConfirmation>
  </>;
}

export function ConfirmAvailabilityDesign({ open, onOpenChange, onChoose, initialStep = 'choice', busy = false, error }: {
  open: boolean; onOpenChange: (open: boolean) => void; onChoose: (choice: AvailabilityDesignChoice) => void;
  initialStep?: 'choice' | 'pickup'; busy?: boolean; error?: string;
}) {
  const [step, setStep] = useState(initialStep);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState('');
  const [contact, setContact] = useState(false);
  const messageId = useId(), scheduleId = useId(), hintId = useId(), contactId = useId();
  const changeOpen = (value: boolean) => { if (!busy) onOpenChange(value); };
  return <Modal open={open} onOpenChange={changeOpen} icon={step === 'choice' ? <CircleCheck /> : <Store />} busy={busy}
    beforeIcon={step === 'pickup' && <button type="button" className="zipco-av-change" disabled={busy} onClick={() => setStep('choice')}><ArrowLeft />Cambiar opción</button>}
    title={step === 'choice' ? '¿Cómo seguirá este pedido?' : 'Retiro en el local'}
    description={step === 'choice' ? 'Elige cómo continuar. La disponibilidad se confirma al guardar.' : 'El cliente se acerca al local y paga allí. No hace falta coordinar.'}>
    <fieldset className="zipco-av-fieldset" disabled={busy}>
    {step === 'choice' ? <>
      <button type="button" className="zipco-av-channel zipco-av-channel-whatsapp" onClick={() => onChoose({ channel: 'whatsapp' })}>
        <span className="zipco-av-channel-icon"><WhatsAppMark /></span><span><b>Coordinar por WhatsApp</b><span>Hablas con el cliente para acordar los detalles</span><small><LockKeyhole />Compartes tu teléfono si el cliente continúa con la compra</small></span><ChevronRight />
      </button>
      <button type="button" className="zipco-av-channel zipco-av-channel-pickup" onClick={() => setStep('pickup')}>
        <span className="zipco-av-channel-icon"><Store /></span><span><b>Retiro en el local</b><span>El cliente va al local y paga allí</span><small><ShieldCheck />Tu teléfono no se comparte (puedes activarlo)</small></span><ChevronRight />
      </button>
    </> : <ol className="zipco-av-timeline">
      <li><span className="zipco-av-step">1</span><div><label htmlFor={messageId}>Mensaje para el cliente</label>
        <textarea id={messageId} rows={2} maxLength={120} value={message} onChange={event => setMessage(event.target.value)} placeholder={DEFAULT_PICKUP_MESSAGE} aria-describedby={hintId} />
        <small id={hintId}><Pencil />Toca y escribe: el texto gris se borra. Si no escribes nada, se envía este.</small></div></li>
      <li><span className="zipco-av-step">2</span><div><label htmlFor={scheduleId}>Horario o dirección <em>(opcional)</em></label>
        <div className="zipco-av-input-icon"><Clock /><input id={scheduleId} maxLength={80} value={schedule} onChange={event => setSchedule(event.target.value)} placeholder="Ej.: hasta las 19:00" /></div></div></li>
      <li><span className="zipco-av-step">3</span><div><b id={contactId}>¿Quieres que el cliente te escriba por WhatsApp?</b>
        <div className="zipco-av-pickup-contact" role="group" aria-labelledby={contactId}>
          <button type="button" aria-pressed={!contact} onClick={() => setContact(false)}>No</button>
          <button type="button" aria-pressed={contact} onClick={() => setContact(true)}><WhatsAppMark />Sí, permitir</button>
        </div><small>{contact ? 'Tu teléfono se compartirá solo después de que el cliente confirme continuar.' : 'Apagado: el cliente no verá tu teléfono.'}</small></div></li>
    </ol>}
    </fieldset>
    {error && <p role="alert" className="zipco-av-error">{error}</p>}
    <div className="zipco-av-button-row"><button type="button" className="zipco-av-secondary" disabled={busy} onClick={() => changeOpen(false)}>Volver</button>
      {step === 'pickup' && <button type="button" className="zipco-av-primary" disabled={busy} onClick={() => onChoose({ channel: 'pickup', instructions: { message: message.trim() || DEFAULT_PICKUP_MESSAGE, scheduleOrAddress: schedule.trim(), allowsContact: contact } })}>{busy ? 'Guardando…' : 'Confirmar disponibilidad'}</button>}
    </div>
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

export function AvailableRequestDesign({ data, expanded, onToggle, pickup, contact, onContactChange, onContinue, onDecline, busy = false, error }: {
  data: RequestDesignData; expanded: boolean; onToggle: () => void; pickup?: PickupDesign;
  contact: boolean; onContactChange: (checked: boolean) => void; onContinue: () => void; onDecline: () => void; busy?: boolean; error?: string;
}) {
  const detailsId = useId(), unavailableId = useId();
  return <article className="zipco-av-ticket zipco-av-available" aria-label={`${data.counterpart}: disponibilidad confirmada`}>
    <div className="zipco-av-ticket-inner"><TicketHeader data={data} kind="available" />
      <h2 className="zipco-av-neon">DISPONIBLE</h2><p className="zipco-av-subtitle">Confirmaron que lo tienen. ¿Quieres continuar con la compra?</p>
      <div id={detailsId} hidden={!expanded}>
        <Items data={data} showPrice /><Perforation />
        {pickup ? <section className="zipco-av-channel-summary"><h3><Store />El negocio te espera en el local</h3>
          <blockquote>{pickup.message || DEFAULT_PICKUP_MESSAGE}{pickup.scheduleOrAddress && <span><Clock />{pickup.scheduleOrAddress}</span>}</blockquote>
          <p>No es una reserva: pagas y retiras directamente en el local.</p>
          {pickup.allowsContact && <><button type="button" className="zipco-av-contact-button" disabled aria-describedby={unavailableId}><WhatsAppMark />Escribir por WhatsApp</button>
            <small id={unavailableId}>Disponible después de confirmar que continúas y autorizar el contacto.</small></>}
        </section> : <section className="zipco-av-channel-summary"><h3><WhatsAppMark />Coordinarán por WhatsApp</h3>
          <p>El negocio quiere acordar contigo los detalles, el pago y la entrega por WhatsApp.</p>
          <div className="zipco-av-consent zipco-av-consent-dark"><b>Permitir que el negocio me escriba por WhatsApp</b><ContactSwitch checked={contact} disabled={busy} onChange={() => onContactChange(!contact)} /></div>
          <small>{contact ? 'El negocio recibirá tu teléfono solo si continúas con la compra.' : 'Sin permiso, el negocio no podrá escribirte por WhatsApp.'}</small>
        </section>}
        {error && <p role="alert" className="zipco-av-error">{error}</p>}
        <div className="zipco-av-decisions"><AcceptGlassButton label={busy ? 'Guardando…' : 'Sí, continuar con la compra'} size="compact" flush disabled={busy} onClick={onContinue} />
          <button type="button" className="zipco-av-decline" disabled={busy} onClick={onDecline}><X />No, gracias</button></div>
        <p className="zipco-av-fine zipco-av-centered"><ShieldCheck />Esto no representa un pago realizado.</p>
      </div>
      <footer className="zipco-av-ticket-footer zipco-av-centered"><Disclosure open={expanded} onToggle={onToggle} controls={detailsId} /></footer>
    </div>
  </article>;
}
