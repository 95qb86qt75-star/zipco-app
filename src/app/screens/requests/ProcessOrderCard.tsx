import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Check, Sparkles, Zap } from 'lucide-react';
import type { BusinessRequest, MyOrder, NormalizedProducts } from './types';
import { canAcceptFixedOrder, processStatusLabel } from './requestProcess';
import { AcceptedConditionsPanel } from './AcceptedConditions';
import useAgreement from './useAgreement';
import { BusinessOrderHeader, CustomerOrderHeader } from './OrderCardHeaders';
import { OrderCardDisclosure, OrderPricePanel } from './OrderCardPanels';
import OrderReferencePhoto from './OrderReferencePhoto';
import { formatDeliverySchedule } from './utils';
import { safePhoto } from './agreement';
import CoordinationActions from './CoordinationActions';

export default function ProcessOrderCard({ order, business = false, isUpdating, onAccept, onRetry, onOpen,
  isUnread = false, expanded, onToggle }: {
  order: BusinessRequest | MyOrder; business?: boolean; isUpdating: boolean;
  onAccept?: () => void; onRetry: () => void; onOpen?: () => void;
  isUnread?: boolean; expanded?: boolean; onToggle?: () => void;
}) {
  const [localExpanded, setLocalExpanded] = useState(expanded ?? false);
  const process = order.requestProcess;
  const awaiting = process?.state === 'AWAITING_BUSINESS_RESPONSE';
  const coordination = process && ['COORDINATION_PENDING', 'COORDINATING', 'IN_PROGRESS'].includes(process.state);
  const agreement = useAgreement(process);
  const accepted = agreement.state.status === 'loaded' ? agreement.state.agreement : null;
  // After acceptance, header and details use only the immutable agreement.
  const products: NormalizedProducts = awaiting ? order.products : accepted ? {
    state: 'available', items: accepted.subjectSnapshot.items.map((item) => ({
      name: item.nameSnapshot, quantity: item.quantity, price: item.unitPriceClpSnapshot,
    })),
  } : { state: 'unavailable', items: [] };
  const price = awaiting ? order.total : accepted?.totalPriceClp ?? null;
  const name = 'customerName' in order ? order.customerName : order.businessName;
  const image = 'customerImage' in order ? order.customerImage : order.businessImage;
  const schedule = awaiting ? formatDeliverySchedule(order, business ? 'business' : 'customer') : null;
  const isExpanded = onToggle ? expanded ?? false : localExpanded;
  const stateLabel = business && awaiting ? 'Nuevo pedido' : processStatusLabel(order);
  const hasConditions = coordination || Boolean(process?.agreementPublicId);
  const unavailableText = awaiting ? 'Productos no disponibles. Actualiza el pedido.'
    : agreement.state.status === 'loading' ? 'Cargando condiciones aceptadas…'
      : hasConditions ? 'Revisa las condiciones aceptadas.' : 'Actualiza el pedido para consultar su estado.';
  const tone = awaiting ? {
    badge: 'bg-orange-50 text-orange-700', panel: 'border-orange-200 from-amber-50 via-orange-50 to-orange-100/70', accent: 'text-orange-700',
  } : coordination ? {
    badge: 'bg-emerald-50 text-emerald-700', panel: 'border-emerald-200 from-emerald-50 via-teal-50 to-emerald-100/70', accent: 'text-emerald-700',
  } : {
    badge: 'bg-slate-100 text-slate-700', panel: 'border-slate-200 from-white to-slate-50', accent: 'text-slate-700',
  };
  const toggle = () => { onOpen?.(); if (onToggle) onToggle(); else setLocalExpanded((value) => !value); };
  const badge = <span role="status" className={`inline-flex max-w-full items-center justify-center rounded-full px-2 py-1.5 text-center text-[10px] font-black leading-tight ${tone.badge}`}>{stateLabel}</span>;
  const styleState = awaiting ? 'pending' : coordination ? 'coordination' : 'unavailable';

  return <article id={`order-${order.id}`} tabIndex={0}
    aria-label={`${name || 'Pedido'}: ${isExpanded ? 'ocultar' : 'mostrar'} detalle`}
    onKeyDown={(event) => {
      if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.currentTarget.classList.remove('zipco-notification-target');
      toggle();
    }} onClick={(event) => {
    if ((event.target as Element).closest('button, a, input, select, textarea, [role="button"], [role="dialog"]')) return;
    event.currentTarget.classList.remove('zipco-notification-target');
    toggle();
  }} className={business
    ? `zipco-provider-card zipco-order-progress-card zipco-state-${styleState} ${isUnread ? 'zipco-new-card border-sky-300 ring-2 ring-sky-100' : 'border-slate-200'} scroll-mb-36 rounded-[22px] border p-3 transition-colors`
    : `zipco-customer-order-card zipco-order-${styleState} scroll-mb-36 rounded-2xl border p-3 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${isUnread ? 'border-sky-400 bg-sky-100 ring-2 ring-sky-200' : 'border-slate-200 bg-gradient-to-br from-white to-slate-50'}`}>
    {business ? <BusinessOrderHeader name={name} image={image} products={products} isUnread={isUnread}
      statusLabel={stateLabel} badgeClass={tone.badge} attention={awaiting} unavailableText={unavailableText} />
      : <CustomerOrderHeader name={name} image={image} products={products} total={price} isUnread={isUnread}
        status={badge} statusInCorner unavailableText={unavailableText} />}
    {schedule && <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
      {order.needNow ? <Zap className="h-3.5 w-3.5 shrink-0" /> : <Calendar className="h-3.5 w-3.5 shrink-0" />}{schedule}
    </p>}
    {hasConditions ? <>
      <OrderCardDisclosure title="Condiciones aceptadas" hint={isExpanded ? 'Ocultar condiciones' : 'Revisar condiciones'}
        price={price} panelClass={tone.panel} accentClass={tone.accent} onOpen={toggle} expanded={isExpanded} acceptedSummary={!business} />
      {coordination && accepted && <CoordinationActions key="coordination-actions" order={order} business={business}
        service={accepted.subjectSnapshot.orderType === 'service'} refresh={onRetry} />}
      <AnimatePresence initial={false}>
        {isExpanded && <motion.div key="conditions" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          onClick={(event) => event.stopPropagation()}>
          <AcceptedConditionsPanel state={agreement.state} retry={agreement.retry} business={business} />
        </motion.div>}
      </AnimatePresence>
    </> : <AnimatePresence initial={false} mode="wait">
      {!isExpanded ? <OrderCardDisclosure key="collapsed" title={awaiting ? (business ? 'Pedido del cliente' : 'Tu pedido') : 'Estado del proceso'}
        hint={awaiting ? (business ? 'Revisar y responder' : 'Revisar pedido') : 'Actualizar pedido'} price={price}
        panelClass={tone.panel} accentClass={tone.accent} onOpen={toggle} />
        : <motion.div key="expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          {awaiting && <>
            <div className={`mt-3 rounded-[16px] border bg-gradient-to-br p-3 ${tone.panel}`}>
              <p className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] ${tone.accent}`}>
                <Sparkles className="h-4 w-4" />Detalle del nuevo pedido
              </p>
              {products.state === 'available' && products.items.map((item, index) => <div key={index} className="mt-2 flex items-start justify-between gap-3 text-xs">
                <span className="min-w-0 font-semibold text-slate-800"><strong>{item.quantity}x</strong> {item.name}</span>
                <span className="shrink-0 font-black text-teal-800">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
              </div>)}
              {order.note && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-4 text-slate-600">Nota: {order.note}</p>}
              {price !== null && <OrderPricePanel price={price} />}
            </div>
            {order.referencePhoto && safePhoto(order.referencePhoto) && <OrderReferencePhoto src={order.referencePhoto} business={business} />}
            {business && order.recordState === 'available' && canAcceptFixedOrder(order) && products.state === 'available' &&
              <button type="button" disabled={isUpdating} onClick={(event) => { event.stopPropagation(); onAccept?.(); }}
                className="zipco-proposal-accept mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-emerald-300 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(16,185,129,0.22)] disabled:opacity-50">
                <Check className="zipco-accept-icon h-4 w-4" />{isUpdating ? 'Guardando…' : `Aceptar pedido${price === null ? '' : ` por $${price.toLocaleString('es-CL')}`}`}
              </button>}
          </>}
          <button type="button" aria-expanded={true} onClick={(event) => { event.stopPropagation(); toggle(); }}
            className="mt-2 min-h-11 w-full text-center text-[11px] font-bold text-slate-500">Ocultar detalle</button>
        </motion.div>}
    </AnimatePresence>}
    {agreement.state.status === 'error' && !isExpanded && <div role="alert" className="mt-2 text-sm">
      <p>{agreement.state.message}</p><button type="button" className="min-h-11 rounded-xl border px-3 py-2" onClick={(event) => { event.stopPropagation(); agreement.retry(); }}>Reintentar condiciones</button>
    </div>}
    {(!process || (!awaiting && !coordination) || (coordination && !process.agreementPublicId)) && <button type="button"
      onClick={(event) => { event.stopPropagation(); onRetry(); }} className="mt-3 min-h-11 rounded-xl border px-3 py-2">Actualizar pedido</button>}
  </article>;
}
