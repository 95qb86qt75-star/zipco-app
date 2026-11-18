import useCustomerPaymentProof from '../../application/useCustomerPaymentProof';
import * as React from 'react';
import {pickupPrepaymentFor} from '../../domain/pickupPrepayment';
import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { BusinessRequest, MyOrder } from "../../domain/types";
import { reservationAllowed } from "../../api/reservationApi";
import { reservationFlow, type ReservationAction } from "../../domain/reservationContract";
import useReservation from "../../application/useReservation";
import ReservationOfferSummary, { reservationWhen } from "./ReservationOfferSummary";
import { simplifiedReservationFlow, isSimpleOffer, isAdvisoryOffer } from "../../domain/simplifiedReservationContract";
import usePaymentConfirmationReminder from "../../application/usePaymentConfirmationReminder";
import { PaymentConfirmationSheet } from "../conditions/CoordinationSheets";
import { CONTACT_COPY } from "../../domain/availabilityContract";
import { Check, User, UserX, X } from "lucide-react";
import WhatsAppMark from "../icons/WhatsAppMark";
import ReservationReasonChoices,{PICKUP_CANCEL_REASONS,PICKUP_DECLINE_REASONS} from './ReservationReasonChoices';

/** Piezas que ReservationPanel entrega a la tarjeta «Pago y apartado pendientes» del negocio (solo con `render`).
 *  Sin `render` el panel se ve y se comporta igual que siempre. Los diálogos (incluida la ventana real
 *  «¿Recibiste el pago y apartaste el pedido?») se mantienen aquí, montados, fuera de la composición. */
export type ReservationPanelParts={
  /** Acción principal real (abre PaymentConfirmationSheet). null si el servidor no la permite ahora. */
  confirm:{label:string;busy:boolean;onClick:()=>void}|null;
  /** Avisos reales de la reserva (estado, plazos, declaración de pago, WhatsApp, motivos). Excluye la nota del cliente. */
  notices:React.ReactNode;
  /** Filas de «Más opciones» realmente permitidas por el servidor (cada una con su `key`). */
  options:React.ReactNode[];
  /** Error de la operación: debe quedar siempre visible, aunque la tarjeta esté plegada. */
  error:React.ReactNode;
  busy:boolean;
  /** Solo cliente en AWAITING_PAYMENT_AND_HOLD (Aurora Pro). Opcionales: los consumidores existentes no cambian. */
  /** Abre la ventana real de WhatsApp para enviar el comprobante (purpose RECEIPT). null si el servidor no la permite. */
  whatsapp?:{label:string;busy:boolean;onClick:()=>void}|null;
  /** «Actualizar reserva»: consulta el estado guardado sin repetir acciones. */
  refreshNow?:{busy:boolean;onClick:()=>void}|null;
  /** Aviso real cuando WhatsApp no está disponible (teléfonos o permisos). */
  waNotice?:React.ReactNode;
  /** Declaración E214 independiente de las acciones de reserva; null sin permiso del servidor. */
  receipt?:{busy:boolean;error:string|null;confirm:(onSaved?:()=>void)=>Promise<boolean>}|null;
};
export default function ReservationPanel({order,business,refresh,render}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void;render?:(parts:ReservationPanelParts)=>React.ReactNode}){
  const proofOperation=useCustomerPaymentProof(order,business,refresh);
  const operation=useReservation(order,business,refresh),p=order.requestProcess,r=p?.reservation,offer=p?.availability?.reservationOffer;
  const stage=pickupPrepaymentFor(p),waitingStage=!!stage&&stage.phase!=='READY_FOR_PREPARATION';
  const [dialog,setDialog]=useState<ReservationAction|null>(null),[reason,setReason]=useState(''),[held,setHeld]=useState(false),[received,setReceived]=useState(false),[issueReceived,setIssueReceived]=useState(false);
  const openerRef=React.useRef<HTMLElement|null>(null);
  const releaseReminder=usePaymentConfirmationReminder({order,business,blocked:dialog!==null||waitingStage,update:operation.update,onOpen:()=>setDialog('CONFIRM_PICKUP_RESERVATION'),onInvalidate:()=>setDialog(null)});
  useEffect(()=>{if(dialog==='CONFIRM_PICKUP_RESERVATION'&&simplifiedReservationFlow(p)&&!reservationAllowed(p,business,'CONFIRM_PICKUP_RESERVATION')&&!operation.busy){setDialog(null);releaseReminder();}},[p?.version,p?.reservationFollowUp?.paymentConfirmationReminder?.eligible,operation.busy]);
  useEffect(()=>{
    if(!p?.serverNow||!r||!offer||offer.mode==='NONE'||isAdvisoryOffer(offer))return;
    const deadlines=r.timing?[r.timing.pickupBy,...(r.timing.paymentDueAt?[r.timing.paymentDueAt]:[])]:!isSimpleOffer(offer)?[offer.confirmationDueAt,offer.pickupBy,...(offer.mode==='PREPAYMENT'?[offer.paymentDueAt]:[])]:[];
    const now=Date.parse(p.serverNow),next=deadlines.filter((value):value is string=>typeof value==='string').map(Date.parse).filter(t=>t>now).sort((a,b)=>a-b)[0];
    if(!next)return;const timer=setTimeout(()=>{if(document.visibilityState==='visible')void operation.update();},Math.min(next-now+200,2147483647));return()=>clearTimeout(timer);
  },[p?.serverNow,p?.version,r?.id]);
  if(!reservationFlow(p)||!r||!offer||offer.mode==='NONE')return null;
  const advisory=isAdvisoryOffer(offer);
  const simple=simplifiedReservationFlow(p),paid=r.mode==='PREPAYMENT',status=r.effectiveStatus,closed=!!p?.reservationFollowUp?.ownFollowUpClosedAt;
  const allowed=(a:ReservationAction)=>reservationAllowed(p,business,a)&&(a!=='CONFIRM_PICKUP_RESERVATION'||!stage||stage.canConfirmPaymentAndHold);
  const button='w-full rounded-xl border border-teal-300/50 px-3 py-2.5 text-left text-xs font-bold disabled:opacity-50';
  const open=(a:ReservationAction,opener?:HTMLElement|null)=>{openerRef.current=opener??(document.activeElement instanceof HTMLElement&&document.activeElement!==document.body?document.activeElement:null);setHeld(false);setReceived(false);setIssueReceived(false);setReason('');setDialog(a);};
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
  const compactCustomer=simple&&!business&&!waitingStage&&['IN_PROGRESS','READY'].includes(p.state)&&!r.pickupCancellation&&!['EXPIRED','DECLINED','CANCELLED','FULFILLED'].includes(status);
  if(compactCustomer)return <section data-reservation-details tabIndex={-1} data-reservation-panel className="mt-3 space-y-2 rounded-2xl border border-teal-300/50 p-3 text-xs">
    <p className="font-bold">{statusText}</p>
    <p>{offer.mode==='PREPAYMENT'?`Reserva con pago previo de $${offer.requiredAmountClp.toLocaleString('es-CL')}`:'Reserva sin pago previo'}</p>
    {advisory?<ReservationOfferSummary offer={offer}/>:r.timing&&<>
      <p>{status==='CONFIRMED'?'Reservado hasta':'Retiro acordado hasta'}: {reservationWhen(r.timing.pickupBy)}.</p>
      {r.timing.paymentDueAt&&!r.confirmedAt&&<p>Plazo para coordinar el pago: {reservationWhen(r.timing.paymentDueAt)}.</p>}
    </>}
    {p.reservationChoice?.note&&<p className="whitespace-pre-wrap break-words">Nota de reserva: {p.reservationChoice.note}</p>}
    {operation.error&&<div role="alert"><p className="text-rose-400">{operation.error}</p><button type="button" className={button} disabled={operation.busy} onClick={()=>void operation.update()}>Reintentar actualización</button></div>}
  </section>;
  // Alcance del diseño nuevo: negocio + proyección válida + AWAITING_PAYMENT_AND_HOLD. `render` solo no basta.
  const prepaymentVariant=!!render&&business&&!!stage&&stage.phase==='AWAITING_PAYMENT_AND_HOLD';
  // Aurora Pro (cliente): solo cliente + render + fase exacta. `render` solo no basta.
  const customerVariant=!!render&&!business&&!!stage&&stage.phase==='AWAITING_PAYMENT_AND_HOLD';
  const auroraVariant=prepaymentVariant||customerVariant;
  const px=customerVariant?'cpp':'bpp',root=customerVariant?'customer':'business';
  const choiceReasons=prepaymentVariant&&dialog==='CANCEL_PICKUP_RESERVATION'?PICKUP_CANCEL_REASONS:prepaymentVariant&&dialog==='DECLINE_PICKUP_RESERVATION'?PICKUP_DECLINE_REASONS:null;
  const dangerDialog=dialog==='CANCEL_PICKUP_RESERVATION'||dialog==='DECLINE_PICKUP_RESERVATION';
  const dialogKicker=dialog==='CONFIRM_PICKUP_RESERVATION'?'Reserva con pago':dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'Tu seguimiento':dialog==='CANCEL_PICKUP_RESERVATION'?'Cancelar reserva':dialog==='DECLINE_PICKUP_RESERVATION'?'No puedo reservar':dialog==='AUTHORIZE_RESERVATION_CONTACT'||dialog==='REVOKE_RESERVATION_CONTACT'?'Contacto':'Reserva';
  const dialogTitle=dialog==='CANCEL_PICKUP_RESERVATION'?'¿Cancelar solo la reserva?':dialog==='DECLINE_PICKUP_RESERVATION'?'¿No puedes reservar el pedido?':dialog==='CONFIRM_PICKUP_RESERVATION'?'Confirmar el apartado':dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'¿Finalizar tu seguimiento?':dialog==='AUTHORIZE_RESERVATION_CONTACT'?'Autorizar tu propio teléfono':dialog==='REVOKE_RESERVATION_CONTACT'?'Retirar tu permiso':dialog==='CONTINUE_WITHOUT_RESERVATION'?'¿Ir sin reserva?':'Registrar decisión de reserva';
  const dialogText=dialog==='CANCEL_PICKUP_RESERVATION'?'Elige el motivo. Cancela solo la reserva, no el retiro completo.':dialog==='DECLINE_PICKUP_RESERVATION'?'Elige el motivo. Quedará registrado que no puedes apartar el pedido.':dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'Cerrarás solo tu indicador. No cancela el pedido, no confirma devolución ni cierra el seguimiento del otro. El detalle se conserva.':dialog==='AUTHORIZE_RESERVATION_CONTACT'?CONTACT_COPY:dialog==='REVOKE_RESERVATION_CONTACT'?'Se retira solo tu permiso para próximas entregas de contacto. No puede retirar números ya vistos.':dialog==='CONTINUE_WITHOUT_RESERVATION'?'El pedido seguirá activo, sujeto a disponibilidad al llegar. No se renueva la reserva.':'Confirma únicamente hechos reales de este pedido. ZIPCO no procesa ni verifica pagos.';
  const dialogYes=dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'Finalizar seguimiento':dialog==='CANCEL_PICKUP_RESERVATION'?'Cancelar reserva':dialog==='DECLINE_PICKUP_RESERVATION'?'No puedo reservar':'Confirmar';
  const waLabel=!business&&p?.state==='IN_PROGRESS'&&!r.confirmedAt?'Enviar comprobante / Volver a WhatsApp':'Aclarar la reserva por WhatsApp';
  const waNotice=!allowed('OPEN_RESERVATION_WHATSAPP')&&paid&&p?.state!=='COMPLETED'?<p>WhatsApp requiere teléfonos válidos y ambos permisos vigentes. Cada participante autoriza únicamente su propio número.</p>:null;
  const lines=<>
    <p className="font-bold">{statusText}</p>{advisory?<ReservationOfferSummary offer={offer}/>:simple&&r.timing?<><p>{status==='CONFIRMED'?'Reservado hasta':'Retiro acordado hasta'}: {reservationWhen(r.timing.pickupBy)}.</p>{r.timing.paymentDueAt&&!r.confirmedAt&&<p>Plazo para coordinar el pago: {reservationWhen(r.timing.paymentDueAt)}. Si ya transferiste, acláralo con el negocio por WhatsApp.</p>}</>:<ReservationOfferSummary offer={offer}/>}
    {!render&&p?.reservationChoice?.note&&<p className="whitespace-pre-wrap break-words">Nota de reserva: {p.reservationChoice.note}</p>}
    {status==='CONFIRMED'&&r.confirmedAt&&<p>{r.confirmationSource==='AUTO_BUSINESS_OFFER'?'Reserva registrada automáticamente según las condiciones ofrecidas por el negocio.':`El negocio confirmó el apartado el ${reservationWhen(r.confirmedAt)}.`}</p>}
    {r.paymentReceiptDeclaration&&<p>El negocio declaró recibido ${r.paymentReceiptDeclaration.amountClp.toLocaleString('es-CL')}. ZIPCO no verificó la transferencia.</p>}
    {paid&&!r.paymentReceiptDeclaration&&<p>Abrir WhatsApp no acredita pago ni envío del comprobante. Adjunta el archivo manualmente en la conversación.</p>}
    {r.reasonDetail&&<p className="whitespace-pre-wrap break-words">Motivo: {r.reasonDetail}</p>}
    {r.pickupCancellation&&<p>Retiro cancelado el {reservationWhen(r.pickupCancellation.cancelledAt)}. La aclaración de dinero permanece separada.</p>}
    {closed&&<p>Finalizaste tu propio seguimiento. Esto no confirma devolución ni conformidad de la otra persona.</p>}
</>;
  const dialogs=<>
    <Dialog.Root open={dialog!==null&&!(simple&&paid&&dialog==='CONFIRM_PICKUP_RESERVATION')} onOpenChange={v=>{if(!v&&!operation.busy)setDialog(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"/>
      {auroraVariant?<Dialog.Content data-prepayment-dialog={dialog??undefined} onCloseAutoFocus={event=>{const target=openerRef.current;if(target?.isConnected){event.preventDefault();target.focus({preventScroll:true});}}} className={`zipco-${root}-prepayment zipco-${px}-dialog fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2`}>
        <div className={`zipco-${px}-dtop`}><span>{dialogKicker}</span><Dialog.Close className={`zipco-${px}-dx`} aria-label="Cerrar" disabled={operation.busy}><X size={18} aria-hidden="true"/></Dialog.Close></div>
        {customerVariant&&<span className="zipco-cpp-orb" data-tone={dangerDialog?'danger':undefined} aria-hidden="true">{dialog==='AUTHORIZE_RESERVATION_CONTACT'?<User size={20}/>:dialog==='REVOKE_RESERVATION_CONTACT'?<UserX size={20}/>:dangerDialog?<X size={20}/>:<Check size={20}/>}</span>}
        <Dialog.Title className={`zipco-${px}-dt`}>{dialogTitle}</Dialog.Title>
        <Dialog.Description className={`zipco-${px}-dd`}>{dialogText}</Dialog.Description>
        {dialog==='CONFIRM_PICKUP_RESERVATION'&&<div className={`zipco-${px}-dchks`}><label className={`zipco-${px}-dchk`}><input type="checkbox" checked={held} onChange={e=>setHeld(e.target.checked)} disabled={operation.busy}/>{advisory?'Confirmo que aparté todo el pedido.':`Confirmo que aparté todo el pedido hasta ${reservationWhen(r.timing?.pickupBy??(!isSimpleOffer(offer)?offer.pickupBy:offer.simplified.closesAt))}.`}</label>{paid&&offer.mode==='PREPAYMENT'&&<label className={`zipco-${px}-dchk`}><input type="checkbox" checked={received} onChange={e=>setReceived(e.target.checked)} disabled={operation.busy}/>Declaro que recibí ${offer.requiredAmountClp.toLocaleString('es-CL')} requeridos para esta reserva.</label>}</div>}
        {choiceReasons&&<ReservationReasonChoices options={choiceReasons} value={reason} onChange={setReason} disabled={operation.busy} tone={dangerDialog?'danger':'ok'}/>}
        {!choiceReasons&&['DECLINE_PICKUP_RESERVATION','REPORT_RESERVATION_ISSUE','CANCEL_PICKUP_RESERVATION'].includes(dialog??'')&&<label className={`zipco-${px}-dchks block text-sm`}>Motivo<textarea aria-label="Motivo de reserva" className="mt-1 min-h-24 w-full rounded-xl border bg-white p-3 text-slate-950" disabled={operation.busy} value={reason} onChange={e=>setReason(Array.from(e.target.value).slice(0,1000).join(''))}/><small>Entre 3 y 1000 caracteres.</small></label>}
        {dialog==='REPORT_RESERVATION_ISSUE'&&business&&!r.paymentReceiptDeclaration&&offer.mode==='PREPAYMENT'&&<label className={`zipco-${px}-dchk`}><input type="checkbox" checked={issueReceived} onChange={e=>setIssueReceived(e.target.checked)} disabled={operation.busy}/>Declaro que recibí ${offer.requiredAmountClp.toLocaleString('es-CL')}, aunque no pueda confirmar el apartado.</label>}
        {operation.error&&<p role="alert" className={`zipco-${px}-derr`}>{operation.error}</p>}
        <div className={`zipco-${px}-dyn`}><button type="button" className={`zipco-${px}-dy`} data-tone={dangerDialog?'danger':undefined} disabled={blocked} onClick={()=>void submit()}>{operation.busy?'Guardando…':dialogYes}</button><button type="button" className={`zipco-${px}-dn`} disabled={operation.busy} onClick={()=>setDialog(null)}>Volver</button></div>
      </Dialog.Content>:      <Dialog.Content className={`zipco-action-dialog fixed left-1/2 top-1/2 z-[1101] max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white`}>
        <Dialog.Title className="text-lg font-bold">{dialog==='CONFIRM_PICKUP_RESERVATION'?'Confirmar el apartado':dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'¿Finalizar tu seguimiento?':dialog==='AUTHORIZE_RESERVATION_CONTACT'?'Autorizar tu propio teléfono':dialog==='REVOKE_RESERVATION_CONTACT'?'Retirar tu permiso':dialog==='CONTINUE_WITHOUT_RESERVATION'?'¿Ir sin reserva?':'Registrar decisión de reserva'}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm">{dialog==='FINISH_OWN_RESERVATION_FOLLOW_UP'?'Cerrarás solo tu indicador. No cancela el pedido, no confirma devolución ni cierra el seguimiento del otro. El detalle se conserva.':dialog==='AUTHORIZE_RESERVATION_CONTACT'?CONTACT_COPY:dialog==='REVOKE_RESERVATION_CONTACT'?'Se retira solo tu permiso para próximas entregas de contacto. No puede retirar números ya vistos.':dialog==='CONTINUE_WITHOUT_RESERVATION'?'El pedido seguirá activo, sujeto a disponibilidad al llegar. No se renueva la reserva.':'Confirma únicamente hechos reales de este pedido. ZIPCO no procesa ni verifica pagos.'}</Dialog.Description>
        {dialog==='CONFIRM_PICKUP_RESERVATION'&&<div className="mt-3 space-y-3 text-sm"><label className="flex gap-2"><input type="checkbox" checked={held} onChange={e=>setHeld(e.target.checked)} disabled={operation.busy}/>{advisory?'Confirmo que aparté todo el pedido.':`Confirmo que aparté todo el pedido hasta ${reservationWhen(r.timing?.pickupBy??(!isSimpleOffer(offer)?offer.pickupBy:offer.simplified.closesAt))}.`}</label>{paid&&offer.mode==='PREPAYMENT'&&<label className="flex gap-2"><input type="checkbox" checked={received} onChange={e=>setReceived(e.target.checked)} disabled={operation.busy}/>Declaro que recibí ${offer.requiredAmountClp.toLocaleString('es-CL')} requeridos para esta reserva.</label>}</div>}
        {['DECLINE_PICKUP_RESERVATION','REPORT_RESERVATION_ISSUE','CANCEL_PICKUP_RESERVATION'].includes(dialog??'')&&<label className="mt-3 block text-sm">Motivo<textarea aria-label="Motivo de reserva" className="mt-1 min-h-24 w-full rounded-xl border bg-white p-3 text-slate-950" disabled={operation.busy} value={reason} onChange={e=>setReason(Array.from(e.target.value).slice(0,1000).join(''))}/><small>Entre 3 y 1000 caracteres.</small></label>}
        {dialog==='REPORT_RESERVATION_ISSUE'&&business&&!r.paymentReceiptDeclaration&&offer.mode==='PREPAYMENT'&&<label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={issueReceived} onChange={e=>setIssueReceived(e.target.checked)} disabled={operation.busy}/>Declaro que recibí ${offer.requiredAmountClp.toLocaleString('es-CL')}, aunque no pueda confirmar el apartado.</label>}
        {operation.error&&<p role="alert" className="mt-2 text-sm text-rose-600">{operation.error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className="rounded-xl border p-3" disabled={operation.busy} onClick={()=>setDialog(null)}>Volver</button><button type="button" className="rounded-xl bg-teal-700 p-3 font-bold text-white" disabled={blocked} onClick={()=>void submit()}>{operation.busy?'Guardando…':'Confirmar'}</button></div>
      </Dialog.Content>}
    </Dialog.Portal></Dialog.Root>
    {simple&&paid&&offer.mode==='PREPAYMENT'&&r.timing&&<PaymentConfirmationSheet open={dialog==='CONFIRM_PICKUP_RESERVATION'} busy={operation.busy} amount={offer.requiredAmountClp} until={advisory?null:reservationWhen(r.timing.pickupBy!)} error={operation.error} onClose={()=>{setDialog(null);releaseReminder();}} onConfirm={()=>void submit()}/>}
</>;
  if(render){
    const row=(key:string,icon:React.ReactNode,label:string,hint:string|null,onClick:(opener:HTMLElement)=>void,tone?:'danger')=><button key={key} type="button" className={`zipco-${px}-op`} data-tone={tone} disabled={operation.busy} onClick={event=>onClick(event.currentTarget)}>
      <span className={`zipco-${px}-opi`} aria-hidden="true">{icon}</span><span className={`zipco-${px}-opt`}><b>{label}</b>{hint&&<small>{hint}</small>}</span></button>;
    const waRun=(purpose:'RECEIPT'|'CLARIFICATION')=>void operation.run('OPEN_RESERVATION_WHATSAPP',{purpose});
    const options:React.ReactNode[]=customerVariant?[
      // Cliente (Aurora Pro): solo Aclarar por WhatsApp, Finalizar mi seguimiento y, si el servidor lo exige, permitir contacto. «Cancelar retiro» llega como pieza real.
      allowed('OPEN_RESERVATION_WHATSAPP')?row('wa',<WhatsAppMark className="h-4 w-4"/>,'Aclarar la reserva por WhatsApp',null,()=>waRun('CLARIFICATION')):null,
      allowed('AUTHORIZE_RESERVATION_CONTACT')?row('authorize',<User size={16}/>,'Permitir contacto para esta reserva',null,el=>open('AUTHORIZE_RESERVATION_CONTACT',el)):null,
      allowed('FINISH_OWN_RESERVATION_FOLLOW_UP')?row('finish',<Check size={16}/>,'Finalizar mi seguimiento','Solo cierra tu propio indicador. No finaliza el pedido.',el=>open('FINISH_OWN_RESERVATION_FOLLOW_UP',el)):null,
      allowed('REPORT_RESERVATION_ISSUE')?row('report',<Check size={16}/>,'Registrar una aclaraci?n',null,el=>open('REPORT_RESERVATION_ISSUE',el)):null,
      allowed('REVOKE_RESERVATION_CONTACT')?row('revoke',<UserX size={16}/>,'Retirar mi permiso para esta reserva',null,el=>open('REVOKE_RESERVATION_CONTACT',el)):null,
    ].filter((node):node is React.ReactElement=>node!==null):[
      allowed('OPEN_RESERVATION_WHATSAPP')?row('wa',<WhatsAppMark className="h-4 w-4"/>,waLabel,null,()=>void operation.run('OPEN_RESERVATION_WHATSAPP',{purpose:!business&&p?.state==='IN_PROGRESS'&&!r.confirmedAt?'RECEIPT':'CLARIFICATION'})):null,
      allowed('AUTHORIZE_RESERVATION_CONTACT')?row('authorize',<User size={16}/>,'Permitir contacto para esta reserva',null,el=>open('AUTHORIZE_RESERVATION_CONTACT',el)):null,
      allowed('FINISH_OWN_RESERVATION_FOLLOW_UP')?row('finish',<Check size={16}/>,'Finalizar mi seguimiento','Solo cierra tu propio indicador. No finaliza el pedido.',el=>open('FINISH_OWN_RESERVATION_FOLLOW_UP',el)):null,
      allowed('DECLINE_PICKUP_RESERVATION')?row('decline',<UserX size={16}/>,'No puedo reservar el pedido',null,el=>open('DECLINE_PICKUP_RESERVATION',el)):null,
      allowed('CANCEL_PICKUP_RESERVATION')?row('cancel',<X size={16}/>,'Cancelar solo la reserva',null,el=>open('CANCEL_PICKUP_RESERVATION',el),'danger'):null,
    ].filter((node):node is React.ReactElement=>node!==null);

    return <>{render({
      confirm:allowed('CONFIRM_PICKUP_RESERVATION')?{label:'Confirmo recepción del pago',busy:operation.busy,onClick:()=>open('CONFIRM_PICKUP_RESERVATION')}:null,
      notices:<>{lines}{waNotice}</>,options,
      ...(customerVariant?{
        whatsapp:allowed('OPEN_RESERVATION_WHATSAPP')?{label:'Abrir WhatsApp',busy:operation.busy,onClick:()=>waRun('RECEIPT')}:null,
        refreshNow:{busy:operation.busy,onClick:()=>void operation.update()},
        waNotice,
        receipt:proofOperation.canDeclare&&(!proofOperation.pending||proofOperation.busy)?{busy:proofOperation.busy||operation.busy,error:proofOperation.error,confirm:proofOperation.confirm}:null,
      }:{}),
      error:<>{proofOperation.pending||proofOperation.error?<div role="alert" className={`zipco-${px}-err`}><p>{proofOperation.error||'Hay una declaración pendiente de comprobar.'}</p><button type="button" className={`zipco-${px}-recover`} disabled={proofOperation.busy||operation.busy} onClick={()=>void proofOperation.check()}>Comprobar envío</button>{proofOperation.canDeclare&&<button type="button" className={`zipco-${px}-recover`} disabled={proofOperation.busy||operation.busy} onClick={()=>void proofOperation.confirm()}>Reintentar el mismo envío</button>}</div>:null}{operation.error?<div role="alert" className={`zipco-${px}-err`}><p>{operation.error}</p><button type="button" className={`zipco-${px}-recover`} disabled={operation.busy} onClick={()=>void operation.update()}>Comprobar estado de la reserva</button></div>:null}</>,busy:operation.busy||proofOperation.busy,
    })}{dialogs}</>;
  }
  return <section data-reservation-details tabIndex={-1} data-reservation-panel className="mt-3 space-y-2 rounded-2xl border border-teal-300/50 p-3 text-xs">
    {waitingStage&&business&&<p className="text-base font-bold">{stage?.canConfirmPaymentAndHold?'¿Recibiste el pago y apartaste el pedido?':'Revisa el estado de la reserva'}</p>}
    {lines}
    {allowed('CONFIRM_PICKUP_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('CONFIRM_PICKUP_RESERVATION')}>{paid?simple?'Recibí el pago y aparté el pedido':'Confirmar pago recibido y apartado':'Confirmar que aparté todo el pedido'}</button>}
    {allowed('CANCEL_PICKUP_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('CANCEL_PICKUP_RESERVATION')}>Cancelar solo la reserva</button>}
    {allowed('DECLINE_PICKUP_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('DECLINE_PICKUP_RESERVATION')}>No puedo reservar el pedido</button>}
    {allowed('CONTINUE_WITHOUT_RESERVATION')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('CONTINUE_WITHOUT_RESERVATION')}>Continuar sin reserva</button>}
    {allowed('OPEN_RESERVATION_WHATSAPP')?<button type="button" className={button} disabled={operation.busy} onClick={()=>void operation.run('OPEN_RESERVATION_WHATSAPP',{purpose:!business&&p?.state==='IN_PROGRESS'&&!r.confirmedAt?'RECEIPT':'CLARIFICATION'})}>{waLabel}</button>:waNotice}
    {allowed('AUTHORIZE_RESERVATION_CONTACT')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('AUTHORIZE_RESERVATION_CONTACT')}>Permitir contacto para esta reserva</button>}
    {allowed('REVOKE_RESERVATION_CONTACT')&&p?.state!=='READY'&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('REVOKE_RESERVATION_CONTACT')}>Retirar mi permiso para esta reserva</button>}
    {allowed('REPORT_RESERVATION_ISSUE')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('REPORT_RESERVATION_ISSUE')}>Registrar una aclaración</button>}
    {allowed('FINISH_OWN_RESERVATION_FOLLOW_UP')&&<button type="button" className={button} disabled={operation.busy} onClick={()=>open('FINISH_OWN_RESERVATION_FOLLOW_UP')}>Finalizar mi seguimiento</button>}
    <button type="button" className={button} disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar reserva</button>
    {operation.error&&<p role="alert" className="text-rose-400">{operation.error}</p>}
    {dialogs}
  </section>;
}
