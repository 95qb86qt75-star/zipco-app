import { useId } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Hourglass, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import type { BusinessRequest, MyOrder } from './types';
import PendingCancellationActions from './PendingCancellationActions';
import OrderReferencePhoto from './OrderReferencePhoto';
import { safePhoto } from './agreement';
import { formatDeliverySchedule } from './utils';
import './availability-design/availability-design.css';

export default function CustomerPendingCard({ order, expanded, onToggle, refresh, isUnread = false }: {
  order: MyOrder | BusinessRequest; expanded: boolean; onToggle: () => void; refresh: () => void; isUnread?: boolean;
}) {
  const detailId = useId();
  const name = 'businessName' in order ? order.businessName : '';
  const schedule = formatDeliverySchedule(order, 'customer');
  const preference = order.requestProcess?.customerContactPreference;
  const needsConfirmation = preference?.requiresReconfirmation === true;
  const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
  return <article id={`order-${order.id}`} tabIndex={0}
    aria-label={`${name || 'Negocio'}: Pendiente de respuesta`}
    data-aurora-state="AWAITING_BUSINESS_RESPONSE" data-unread={isUnread}
    className="zipco-av-ticket zipco-av-waiting zipco-customer-pending scroll-mb-36"
    onKeyDown={event => {
      if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); event.currentTarget.classList.remove('zipco-notification-target'); onToggle();
    }} onClick={event => {
      if ((event.target as Element).closest('button, a, input, [role="dialog"]')) return;
      event.currentTarget.classList.remove('zipco-notification-target'); onToggle();
    }}>
    <div className="zipco-av-ticket-inner">
      {isUnread && <span className="sr-only">Solicitud nueva sin leer</span>}
      <header className="zipco-av-ticket-header">
        <span className="zipco-av-ticket-icon"><Hourglass aria-hidden="true" /></span>
        <div className="zipco-av-identity"><small>ENTRADA DE SOLICITUD</small><b>{name || 'Negocio'}</b></div>
        <div className="zipco-av-price"><b>{order.total === null ? 'No disponible' : money(order.total)}</b><small>SOLICITADO</small></div>
      </header>
      <h2 className="zipco-av-neon">EN ESPERA</h2>
      <p className="zipco-av-subtitle">Esperando la primera respuesta del negocio.</p>
      <section id={detailId} hidden={!expanded} aria-label="Detalle de la solicitud" className="zipco-av-original">
        {expanded && <>
        {order.products.state === 'available' ? <div className="zipco-av-items" data-pending-order-detail>
          {order.products.items.map((item,index) => <div className="zipco-av-item" key={index}>
            <span className="zipco-av-quantity">{item.quantity}×</span><span className="zipco-av-item-name">{item.name}</span>
            <b>{money(item.price * item.quantity)}</b>
          </div>)}
        </div> : <p className="zipco-av-note">Productos no disponibles. Actualiza el pedido.</p>}
        {schedule && <p className="zipco-av-schedule">{order.needNow ? <Zap aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}{schedule}</p>}
        {order.note && <p className="zipco-av-note"><b>Nota:</b> {order.note}</p>}
        {order.total !== null && <div className="zipco-av-original-total"><span>Total solicitado</span><b>{money(order.total)}</b></div>}
        {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business={false} />}
        {preference && <>
          <div className="zipco-av-perforation" aria-hidden="true"><i /><span /><i /></div>
          <p className={`zipco-av-contact-intent${!preference.allowed || needsConfirmation ? ' zipco-av-contact-off' : ''}`}>
            {preference.allowed && !needsConfirmation ? <ShieldCheck aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
            <span>{needsConfirmation ? 'Tu elección de contacto necesita una nueva confirmación.'
              : preference.allowed ? 'Permitiste que el negocio te escriba por WhatsApp si compras'
              : 'Sin autorizar el contacto por WhatsApp. Podrás autorizarlo más adelante.'}</span>
          </p>
          <p className="zipco-customer-pending-contact-hint">Esta elección todavía no comparte tu teléfono.</p>
        </>}
        </>}
      </section>
      <footer className="zipco-av-ticket-footer">
        <button type="button" className="zipco-av-disclosure" aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}{expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
        <PendingCancellationActions order={order} refresh={refresh} variant="ticket" />
      </footer>
    </div>
  </article>;
}
