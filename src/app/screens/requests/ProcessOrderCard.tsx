import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, ChevronUp, Sparkles, Zap } from 'lucide-react';
import AcceptGlassButton from './AcceptGlassButton';
import type { BusinessRequest, MyOrder, NormalizedProducts } from './types';
import { canAcceptFixedOrder, processStatusLabel } from './requestProcess';
import { AcceptedConditionsPanel } from './AcceptedConditions';
import useAgreement from './useAgreement';
import { AuroraProposalHeader } from './OrderCardAurora';
import { OrderCardDisclosure, OrderPricePanel } from './OrderCardPanels';
import OrderReferencePhoto from './OrderReferencePhoto';
import { formatDeliverySchedule } from './utils';
import { safePhoto } from './agreement';
import CoordinationActions from './CoordinationActions';
import { statusViewFor } from './requestStatusGrouping';
import PendingCancellationActions from './PendingCancellationActions';
import PendingRejectionActions from './PendingRejectionActions';
import ProposalNegotiation from './ProposalNegotiation';
import { NEGOTIATION_STATES } from './proposalContract';

export default function ProcessOrderCard({ order, business = false, isUpdating, onAccept, onRetry, onOpen,
  isUnread = false, expanded, onToggle }: {
  order: BusinessRequest | MyOrder; business?: boolean; isUpdating: boolean;
  onAccept?: () => void; onRetry: () => void; onOpen?: () => void;
  isUnread?: boolean; expanded?: boolean; onToggle?: () => void;
}) {
  const [localExpanded, setLocalExpanded] = useState(expanded ?? false);
  const process = order.requestProcess;
  const awaiting = process?.state === 'AWAITING_BUSINESS_RESPONSE';
  const negotiating = NEGOTIATION_STATES.includes(process?.state ?? '');
  const coordination = process && ['COORDINATION_PENDING', 'COORDINATING', 'IN_PROGRESS', 'READY'].includes(process.state);
  const agreement = useAgreement(process);
  const accepted = agreement.state.status === 'loaded' ? agreement.state.agreement : null;
  // After acceptance, header and details use only the immutable agreement.
  const products: NormalizedProducts = awaiting ? order.products : { state: 'unavailable', items: [] };
  const headerProducts = accepted ? { state: 'available' as const, items: accepted.subjectSnapshot.items.map(item => ({ name: item.nameSnapshot, quantity: item.quantity })) } : products;
  const price = awaiting ? order.total : negotiating ? process?.proposalSummary?.totalPriceClp ?? null : accepted?.totalPriceClp ?? null;
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
  const pendingDetails = awaiting && <>
    <div data-pending-order-detail className={`mt-3 rounded-[16px] border bg-gradient-to-br p-3 ${tone.panel}`}>
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
      <AcceptGlassButton label={isUpdating ? 'Guardando…' : 'Aceptar pedido'} price={isUpdating ? null : price} disabled={isUpdating}
        onClick={(event) => { event.stopPropagation(); onAccept?.(); }} />}
  </>;
  const summary = negotiating ? 'Revisa las nuevas condiciones de la propuesta.' : awaiting
    ? business ? 'Revisa la solicitud y responde al cliente.' : 'Esperando la primera respuesta del negocio.'
    : agreement.state.status === 'loading' ? 'Cargando condiciones aceptadas…'
    : process?.state === 'IN_PROGRESS' ? business ? 'Continúa con la preparación del pedido.' : 'El negocio está preparando tu pedido.'
    : process?.state === 'READY' ? process.readyNoticeAcknowledged ? 'Aviso confirmado. Pendiente de recepción.' : 'Pedido listo. Falta confirmar el aviso.'
    : coordination ? business ? 'Revisa la autorización de contacto y coordina los siguientes pasos.' : 'Revisa la autorización de contacto y los siguientes pasos.'
    : unavailableText;
  const conditionsHeader = <OrderCardDisclosure title="Condiciones aceptadas" hint={isExpanded ? 'Ocultar condiciones' : 'Revisar condiciones'}
    price={null} panelClass={tone.panel} accentClass={tone.accent} onOpen={toggle} expanded={isExpanded} acceptedSummary integrated />;
  const coordinationActions = coordination && accepted && <CoordinationActions key="coordination-actions" order={order} business={business}
    service={accepted.subjectSnapshot.orderType === 'service'} refresh={onRetry} />;
  const conditionsDetails = <AnimatePresence initial={false}>
    {isExpanded && <motion.div key="conditions" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      onClick={(event) => event.stopPropagation()}>
      <AcceptedConditionsPanel state={agreement.state} retry={agreement.retry} business={business} embedded
        returnView={statusViewFor('orders', order.status, process, order.requestProcessInvalid) ?? 'pending'} />
    </motion.div>}
  </AnimatePresence>;

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
  }} data-aurora-state={process?.state ?? 'unavailable'} data-unread={isUnread}
    className="zipco-aurora-card scroll-mb-36 rounded-[24px] p-4">
    <AuroraProposalHeader name={name} image={image} price={price} statusLabel={stateLabel} isUnread={isUnread}
      priceLabel={awaiting ? 'Solicitado' : negotiating ? 'Propuesto' : 'Acordado'} summaryText={summary}
      items={headerProducts.state === 'available' ? headerProducts.items : undefined} />
    {schedule && <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
      {order.needNow ? <Zap className="h-3.5 w-3.5 shrink-0" /> : <Calendar className="h-3.5 w-3.5 shrink-0" />}{schedule}
    </p>}
    {business && awaiting ? !isExpanded && <OrderCardDisclosure title="Pedido del cliente" hint="Revisar y responder" price={null}
      panelClass={tone.panel} accentClass={tone.accent} onOpen={toggle} /> : negotiating ? null : hasConditions ? <>
      <section aria-label="Condiciones aceptadas" className={`mt-2.5 overflow-hidden rounded-[15px] border bg-gradient-to-br text-slate-900 ${tone.panel} dark:border-teal-500/50 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 dark:text-slate-100`}>
        {conditionsHeader}{conditionsDetails}
      </section>
      {coordinationActions}
    </> : <AnimatePresence initial={false} mode="wait">
      {!isExpanded ? <OrderCardDisclosure key="collapsed" title={awaiting ? (business ? 'Pedido del cliente' : 'Tu pedido') : 'Estado del proceso'}
        hint={awaiting ? (business ? 'Revisar y responder' : 'Revisar pedido') : 'Actualizar pedido'} price={null}
        panelClass={tone.panel} accentClass={tone.accent} onOpen={toggle} />
        : <motion.div key="expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          {pendingDetails}
          {!(business && awaiting) && <button type="button" aria-expanded={true} onClick={(event) => { event.stopPropagation(); toggle(); }}
            className="mt-2 min-h-11 w-full text-center text-[11px] font-bold text-slate-500">Ocultar detalle</button>}
        </motion.div>}
    </AnimatePresence>}
    {!business && awaiting && <PendingCancellationActions key="pending-cancellation" order={order} refresh={onRetry} />}
    <div className={business && awaiting ? 'zipco-pending-business-responses' : undefined}
      data-expanded={business && awaiting ? isExpanded : undefined} aria-hidden={business && awaiting ? !isExpanded : undefined}
      {...(business && awaiting && !isExpanded ? { inert: '' } : {})}>
      <div className={business && awaiting ? 'zipco-pending-business-body' : undefined}>
      <div className={business && awaiting ? 'zipco-pending-business-content' : undefined}>
      {business && awaiting && pendingDetails}
      {(awaiting && business || negotiating) && <ProposalNegotiation key="proposal-negotiation" order={order} business={business} refresh={onRetry} variant="aurora" />}
      {business && awaiting && <PendingRejectionActions key="pending-rejection" order={order} refresh={onRetry} />}
      {business && awaiting && <button type="button" aria-expanded={isExpanded}
        onClick={(event) => { event.stopPropagation(); toggle(); }} className="zipco-hide-order-detail">
        <ChevronUp aria-hidden="true" className="h-4 w-4 shrink-0" />Ocultar detalle
      </button>}
      </div>
      </div>
    </div>
    {agreement.state.status === 'error' && !isExpanded && <div role="alert" className="mt-2 text-sm">
      <p>{agreement.state.message}</p><button type="button" className="min-h-11 rounded-xl border px-3 py-2" onClick={(event) => { event.stopPropagation(); agreement.retry(); }}>Reintentar condiciones</button>
    </div>}
    {(!process || (!awaiting && !coordination && !negotiating) || (coordination && !process.agreementPublicId)) && <button type="button"
      onClick={(event) => { event.stopPropagation(); onRetry(); }} className="mt-3 min-h-11 rounded-xl border px-3 py-2">Actualizar pedido</button>}
  </article>;
}
