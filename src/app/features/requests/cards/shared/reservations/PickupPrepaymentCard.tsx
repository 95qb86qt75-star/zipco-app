import * as React from 'react';
import type {BusinessRequest,MyOrder} from '../../../domain/types';
import type {AgreementReadDto} from '../../../domain/agreement';
import {pickupPrepaymentFor,PREPAYMENT_WAITING_MESSAGE} from '../../../domain/pickupPrepayment';
import {ProgressCardHeader} from '../layout/ProgressCardShell';
import AvailabilityPostActions from '../availability/AvailabilityPostActions';
import {ConditionsSheet} from '../../../shared/conditions/CoordinationSheets';
import AgreementSheet from '../../../shared/conditions/AgreementSheet';

/** E209 composition. ReservationPanel owns the existing command and all recovery controls. */
export default function PickupPrepaymentCard({order,business,accepted,name,image,isUnread,expanded,onToggle,refresh}:{
  order:BusinessRequest|MyOrder;business:boolean;accepted:AgreementReadDto;name:string;image?:string;
  isUnread:boolean;expanded:boolean;onToggle:()=>void;refresh:()=>void;
}){
  const [sheet,setSheet]=React.useState<'conditions'|'agreement'|null>(null);
  const stage=pickupPrepaymentFor(order.requestProcess);
  if(!stage)return null;
  const awaitingPayment=stage.phase==='AWAITING_PAYMENT_AND_HOLD';
  const businessLabel=awaitingPayment?'Pago y apartado pendientes':'Reserva por revisar';
  const subject=accepted.subjectSnapshot;
  const title=subject.items.map(item=>`${item.quantity}× ${item.nameSnapshot}`).join(' · ');
  const when=accepted.scheduledFor?new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(accepted.scheduledFor)):subject.needNow?'Lo antes posible':'Sin horario acordado';
  const detailId=`prepayment-detail-${order.id}`;
  return <article id={`order-${order.id}`} tabIndex={0} data-pickup-prepayment={stage.phase}
    data-unread={isUnread} className="zipco-co-dk zipco-ec-dk scroll-mb-36 p-4">
    <ProgressCardHeader business={business} name={name} image={image} price={accepted.totalPriceClp}
      statusLabel={business?businessLabel:'Por responder'} isUnread={isUnread}/>
    <p className="mt-3 text-sm font-bold">{business?awaitingPayment?'Pendiente de confirmar pago y apartado':'Revisa la incidencia de esta reserva':PREPAYMENT_WAITING_MESSAGE}</p>
    <p className="mt-2 text-xs">Reserva con pago previo de <b>${stage.requiredAmountClp.toLocaleString('es-CL')}</b>. ZIPCO no verifica transferencias.</p>
    <AvailabilityPostActions order={order} business={business} refresh={refresh} render={parts=><>
      {parts?.alerts}
      {parts?.reservation}
      <button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 text-sm font-bold"
        aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>{expanded?'Ocultar detalle':'Ver instrucciones y condiciones'}</button>
      <div id={detailId} hidden={!expanded} className="space-y-3">
        {parts?.instructions}
        <button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 text-sm font-bold" onClick={()=>setSheet('conditions')}>Condiciones aceptadas · {title}</button>
        {parts?.contact}{parts?.cancel}
      </div>
    </>}/>
    <ConditionsSheet open={sheet==='conditions'} onOpenChange={value=>setSheet(value?'conditions':null)} accepted={accepted}
      title={title} subtitle="" when={when} explanation={subject.note} explanationLabel="Nota" onOpenAgreement={()=>setSheet('agreement')}/>
    <AgreementSheet open={sheet==='agreement'} onOpenChange={value=>setSheet(value?'agreement':null)}
      processId={order.requestProcess?.id} client={name} accepted={accepted} acceptedAt={accepted.confirmedAt}/>
  </article>;
}
