import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type {BusinessRequest,MyOrder} from './types';
import {reservationAllowed} from './reservationApi';
import {reservationFlow,type ReservationAction} from './reservationContract';
import useReservation from './useReservation';
import ReservationOfferSummary,{reservationWhen} from './ReservationOfferSummary';
import {simplifiedReservationFlow,isSimpleOffer} from './simplifiedReservationContract';
import usePaymentConfirmationReminder from './usePaymentConfirmationReminder';
import {PaymentConfirmationSheet} from './CoordinationSheets';
import {CONTACT_COPY} from './availabilityContract';

export default function ReservationPanel({order,business,refresh}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void}){
  const operation=useReservation(order,business,refresh),p=order.requestProcess,r=p?.reservation,offer=p?.availability?.reservationOffer;
  const [dialog,setDialog]=useState<ReservationAction|null>(null),[reason,setReason]=useState(''),[held,setHeld]=useState(false),[received,setReceived]=useState(false),[issueReceived,setIssueReceived]=useState(false);
  const releaseReminder=usePaymentConfirmationReminder({order,business,blocked:dialog!==null,update:operation.update,onOpen:()=>setDialog('CONFIRM_PICKUP_RESERVATION'),onInvalidate:()=>setDialog(null)});
  useEffect(()=>{if(dialog==='CONFIRM_PICKUP_RESERVATION'&&simplifiedReservationFlow(p)&&!reservationAllowed(p,business,'CONFIRM_PICKUP_RESERVATION')&&!operation.busy){setDialog(null);releaseReminder();}},[p?.version,p?.reservationFollowUp?.paymentConfirmationReminder?.eligible,operation.busy]);
  useEffect(()=>{
    if(!p?.serverNow||!r||!offer||offer.mode==='NONE')return;
    const deadlines=r.timing?[r.timing.pickupBy,...(r.timing.paymentDueAt?[r.timing.paymentDueAt]:[])]:!isSimpleOffer(offer)?[offer.confirmationDueAt,offer.pickupBy,...(offer.mode==='PREPAYMENT'?[offer.paymentDueAt]:[])]:[];
    const now=Date.parse(p.serverNow),next=deadlines.map(Date.parse).filter(t=>t>now).sort((a,b)=>a-b)[0];
    if(!next)return;const timer=setTimeout(()=>{if(document.visibilityState==='visible')void operation.update();},Math.min(next-now+200,2147483647));return()=>clearTimeout(timer);
  },[p?.serverNow,p?.version,r?.id]);
  if(!reservationFlow(p)||!r||!offer||offer.mode==='NONE')return null;
  const simple=simplifiedReservationFlow(p),paid=r.mode==='PREPAYMENT',status=r.effectiveStatus,closed=!!p?.reservationFollowUp?.ownFollowUpClosedAt;
  const allowed=(a:ReservationAction)=>reservationAllowed(p,business,a);
  const button='w-full rounded-xl border border-teal-300/50 px-3 py-2.5 text-left text-xs font-bold disabled:opacity-50';
  const open=(a:ReservationAction)=>{setHeld(false);setReceived(false);setIssueReceived(false);setReason('');setDialog(a);};
  const submit=async()=>{
    if(!dialog)return;
    const details=dialog==='CONFIRM_PICKUP_RESERVATION'?{entireOrderHeldDeclared:true as const,...(paid?{requiredPaymentReceivedDeclared:true as const}:{})}
      :['DECLINE_PICKUP_RESERVATION','REPORT_RESERVATION_ISSUE','CANCEL_PICKUP_RESERVATION'].includes(dialog)?{reasonDetail:reason.trim(),...(dialog==='REPORT_RESERVATION_ISSUE'&&business&&issueReceived?{requiredPaymentReceivedDeclared:true as const}:{})}
      :dialog==='AUTHORIZE_RESERVATION_CONTACT'?{consentAccepted:true as const,consentTextVersion:'availability-contact-v1' as const}
      :dialog==='REVOKE_RESERVATION_CONTACT'?{}:{confirmationAccepted:true as const};
    if(await operation.run(dialog,details))setDialog(null);
  };
  const blocked=operation.busy||dialog==='CONFIRM_PICKUP_RESERVATION'&&(!held||paid&&!received)||['DECLINE_PICKUP_RESERVATION','REPORT_RESERVATION_ISSUE','CANCEL_PICKUP_RESERVATION'].includes(dialog??'')&&(Array.from(reason.trim()).length<3||Array.from(reason.trim()).length>1000);
  const statusText=r.continuedWithoutReservationAt?'Continuarás sin reserva, sujeto a disponibilidad al llegar.':status==='CONFIRMED'?'Reserva confirmada · Pendiente de retiro':status==='REQUESTED'?'Reserva solicitada · Esperando confirmación del negocio':status==='AWAITING_BUSINESS_CONFIRMATION'?'Reserva pendiente de confirmación del negocio':status==='NEEDS_CLARIFICATION'?'Pendiente de aclaración entre cliente y negocio':status==='FULFILLED'?'Pedido recibido':status==='EXPIRED'?'La reserva venció':status==='DECLINED'?'El negocio no pudo apartar el pedido':'Reserva cancelada';
  return <section data-reservation-panel className="mt-3 space-y-2 rounded-2xl border border-teal-300/50 p-3 text-xs">
    <p className="font-bold">{statusText}</p>{simple&&r.timing?<><p>{status==='CONFIRMED'?'Reservado hasta':'Retiro acordado hasta'}: {reservationWhen(r.timing.pickupBy)}.</p>{r.timing.paymentDueAt&&!r.confirmedAt&&<p>Plazo para coordinar el pago: {reservationWhen(r.timing.paymentDueAt)}. Si ya transferiste, acláralo con el negocio por WhatsApp.</p>}</>:<ReservationOfferSummary offer={offer}/>}
    {p?.reservationChoice?.note&&<p className="whitespace-pre-wrap break-words">Nota de reserva: {p.reservationChoice.note}</p>}
    {status==='CONFIRMED'&&r.confirmedAt&&<p>{r.confirmationSource==='AUTO_BUSINESS_OFFER'?'Reserva registrada automáticamente según las condiciones ofrecidas por el negocio.':`El negocio confirmó el apartado el ${reservationWhen(r.confirmedAt)}.`}</p>}
    {r.paymentReceiptDeclaration&&<p>El negocio declaró recibido ${r.paymentReceiptDeclaration.amountClp.toLocaleString('es-CL')}. ZIPCO no verificó la transferencia.</p>}
    {paid&&!r.paymentReceiptDeclaration&&<p>Abrir WhatsApp no acredita pago ni envío del comprobante. Adjunta el archivo manualmente en la conversación.</p>}
    {r.reasonDetail&&<p className="whitespace-pre-wrap break-words">Motivo: {r.reasonDetail}</p>}
    {r.pickupCancellation&&<p>Retiro cancelado el {reservationWhen(r.pickupCancellation.cancelledAt)}. La aclaración de dinero permanece separada.</p>}
    {closed&&<p>Finalizaste tu propio seguimiento. Esto no confirma devolución ni conformidad de la otra persona.</p>}
    {allowed('CONFIRM_PICKUP_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('CONFIRM_PICKUP_RESERVATION')}>{paid?simple?'Recibí el pago y aparté el pedido':'Confirmar pago recibido y apartado':'Confirmar que aparté todo el pedido'}</button>}
    {allowed('CANCEL_PICKUP_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('CANCEL_PICKUP_RESERVATION')}>Cancelar solo la reserva</button>}
    {allowed('DECLINE_PICKUP_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('DECLINE_PICKUP_RESERVATION')}>No puedo reservar el pedido</button>}
    {allowed('CONTINUE_WITHOUT_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('CONTINUE_WITHOUT_RESERVATION')}>Continuar sin reserva</button>}
    {allowed('OPEN_RESERVATION_WHATSAPP')?<button type="button" className={button} disabled={operation.busy} onClick={()=>void operation.run('OPEN_RESERVATION_WHATSAPP',{purpose:!business&&p?.state==='IN_PROGRESS'&&!r.confirmedAt?'RECEIPT':'CLARIFICATION'})}>{!business&&p?.state==='IN_PROGRESS'&&!r.confirmedAt?'Enviar comprobante / Volver a WhatsApp':'Aclarar la reserva por WhatsApp'}</button>:paid&&p?.state!=='COMPLETED'&&<p>WhatsApp requiere teléfonos válidos y ambos permisos vigentes. Cada participante autoriza únicamente su propio número.</p>}
    {allowed('AUTHORIZE_RESERVATION_CONTACT')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('AUTHORIZE_RESERVATION_CONTACT')}>Permitir contacto para esta reserva</button>}
    {allowed('REVOKE_RESERVATION_CONTACT')&&p?.state!=='READY'&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('REVOKE_RESERVATION_CONTACT')}>Retirar mi permiso para esta reserva</button>}
    {allowed('REPORT_RESERVATION_ISSUE')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('REPORT_RESERVATION_ISSUE')}>Registrar una aclaración</button>}
    {allowed('FINISH_OWN_RESERVATION_FOLLOW_UP')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('FINISH_OWN_RESERVATION_FOLLOW_UP')}>Finalizar mi seguimiento</button>}
    <button type="button" className={button} disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar reserva</button>
    {operation.error&&<p role="alert" className="text-rose-400">{operation.error}</p>}
    <Dialog.Root open={dialog!==null&&!(simple&&paid&&dialog==='CONFIRM_PICKUP_RESERVATION')} onOpenChange={v=>{if(!v&&!operation.busy)setDialog(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"/>
      <Dialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1101] max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
        <Dialog.Title className="text-lg font-bold">{dialog==='CONFIRM_PICKUP_RESERVATION'?'Confirmar el apartado':dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'¿Finalizar tu seguimiento?':dialog==='AUTHORIZE_RESERVATION_CONTACT'?'Autorizar tu propio teléfono':dialog==='REVOKE_RESERVATION_CONTACT'?'Retirar tu permiso':dialog==='CONTINUE_WITHOUT_RESERVATION'?'¿Ir sin reserva?':'Registrar decisión de reserva'}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm">{dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'Cerrarás solo tu indicador. No cancela el pedido, no confirma devolución ni cierra el seguimiento del otro. El detalle se conserva.':dialog==='AUTHORIZE_RESERVATION_CONTACT'?CONTACT_COPY:dialog==='REVOKE_RESERVATION_CONTACT'?'Se retira solo tu permiso para próximas entregas de contacto. No puede retirar números ya vistos.':dialog==='CONTINUE_WITHOUT_RESERVATION'?'El pedido seguirá activo, sujeto a disponibilidad al llegar. No se renueva la reserva.':'Confirma únicamente hechos reales de este pedido. ZIPCO no procesa ni verifica pagos.'}</Dialog.Description>
        {dialog==='CONFIRM_PICKUP_RESERVATION'&&<div className="mt-3 space-y-3 text-sm"><label className="flex gap-2"><input type="checkbox" checked={held} onChange={e=>setHeld(e.target.checked)} disabled={operation.busy}/>Confirmo que aparté todo el pedido hasta {reservationWhen(r.timing?.pickupBy??(!isSimpleOffer(offer)?offer.pickupBy:offer.simplified.closesAt))}.</label>{paid&&offer.mode==='PREPAYMENT'&&<label className="flex gap-2"><input type="checkbox" checked={received} onChange={e=>setReceived(e.target.checked)} disabled={operation.busy}/>Declaro que recibí ${offer.requiredAmountClp.toLocaleString('es-CL')} requeridos para esta reserva.</label>}</div>}
        {['DECLINE_PICKUP_RESERVATION','REPORT_RESERVATION_ISSUE','CANCEL_PICKUP_RESERVATION'].includes(dialog??'')&&<label className="mt-3 block text-sm">Motivo<textarea aria-label="Motivo de reserva" className="mt-1 min-h-24 w-full rounded-xl border bg-white p-3 text-slate-950" disabled={operation.busy} value={reason} onChange={e=>setReason(Array.from(e.target.value).slice(0,1000).join(''))}/><small>Entre 3 y 1000 caracteres.</small></label>}
        {dialog==='REPORT_RESERVATION_ISSUE'&&business&&!r.paymentReceiptDeclaration&&offer.mode==='PREPAYMENT'&&<label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={issueReceived} onChange={e=>setIssueReceived(e.target.checked)} disabled={operation.busy}/>Declaro que recibí ${offer.requiredAmountClp.toLocaleString('es-CL')}, aunque no pueda confirmar el apartado.</label>}
        {operation.error&&<p role="alert" className="mt-2 text-sm text-rose-600">{operation.error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className="rounded-xl border p-3" disabled={operation.busy} onClick={()=>setDialog(null)}>Volver</button><button type="button" className="rounded-xl bg-teal-700 p-3 font-bold text-white" disabled={blocked} onClick={()=>void submit()}>{operation.busy?'Guardando…':'Confirmar'}</button></div>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
    {simple&&paid&&offer.mode==='PREPAYMENT'&&r.timing&&<PaymentConfirmationSheet open={dialog==='CONFIRM_PICKUP_RESERVATION'} busy={operation.busy} amount={offer.requiredAmountClp} until={reservationWhen(r.timing.pickupBy)} error={operation.error} onClose={()=>{setDialog(null);releaseReminder();}} onConfirm={()=>void submit()}/>}
  </section>;
}
