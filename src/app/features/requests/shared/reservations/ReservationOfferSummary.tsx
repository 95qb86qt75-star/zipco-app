import * as React from 'react';

import type { ReservationOffer } from "../../domain/reservationContract";
import { isSimpleOffer, isAdvisoryOffer } from "../../domain/simplifiedReservationContract";
export const reservationWhen=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));
const reservationDate=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(iso));
const reservationTime=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(iso));
export default function ReservationOfferSummary({offer,compact=false,customerProposal=false}:{offer:ReservationOffer;compact?:boolean;customerProposal?:boolean}){
  if(isSimpleOffer(offer)){
    const t=offer.simplified;
    if(isAdvisoryOffer(offer)&&customerProposal)return <section className="zipco-offer my-3 space-y-1 rounded-xl border border-teal-300/50 p-3 text-xs" aria-label="Oferta de reserva">
      <p className="zipco-offer-h font-bold">{offer.mode==='FREE'?'Puedes reservar este producto sin un pago previo':<>Puedes reservar este producto con un pago previo de {'$'}{offer.requiredAmountClp.toLocaleString('es-CL')}</>}</p>
      {offer.mode==='PREPAYMENT'&&<p className="zipco-offer-line zipco-offer-line--check">El negocio debe confirmar que recibió el monto y apartó el pedido. Coordina el pago por WhatsApp; ZIPCO no verifica transferencias.</p>}
      {t.scheduledFor&&<p className="zipco-offer-line zipco-offer-line--clock">Retirarás el {reservationDate(t.scheduledFor)} a las {reservationTime(t.scheduledFor)}</p>}
      {!compact&&<p className="zipco-offer-line zipco-offer-line--info">El horario de atención es informativo. Esta reserva no tiene vencimiento automático.</p>}
    </section>;
    if(isAdvisoryOffer(offer))return <section className="my-3 space-y-1 rounded-xl border border-teal-300/50 p-3 text-xs" aria-label="Oferta de reserva">
      <p className="font-bold">{offer.mode==='FREE'?'Reserva sin pago previo':<>Reserva con pago previo de {'$'}{offer.requiredAmountClp.toLocaleString('es-CL')}</>}</p>
      <p>{offer.mode==='FREE'?'Se confirma automáticamente al solicitarla.':'El negocio debe confirmar que recibió el monto y apartó el pedido. Coordina el pago por WhatsApp; ZIPCO no verifica transferencias.'}</p>
      {t.scheduledFor&&<p>Retiro solicitado: {reservationWhen(t.scheduledFor)}.</p>}
      {!compact&&<p>El horario de atención es informativo. Esta reserva no tiene vencimiento automático.</p>}
    </section>;
    return <section className="my-3 space-y-1 rounded-xl border border-teal-300/50 p-3 text-xs" aria-label="Oferta de reserva">
      <p className="font-bold">{offer.mode==='FREE'?'Este negocio permite reservar sin pago previo':`Este negocio permite reservar con ${offer.paymentKind==='FULL'?'pago completo':'un anticipo'} de $${offer.requiredAmountClp.toLocaleString('es-CL')}`}</p>
      {offer.mode==='FREE'?<p>{t.scheduledFor?`30 minutos desde ${reservationWhen(t.scheduledFor)}, como máximo hasta el cierre.`:'Te lo guardan 30 minutos desde que confirmas la reserva, como máximo hasta el cierre.'}</p>:<p>Una vez que el negocio confirme el monto recibido y el apartado, te lo guarda hasta el cierre. Coordina el pago por WhatsApp.</p>}
      <p>Cierre: {reservationWhen(t.closesAt)}.</p>
    </section>;
  }
  return <section className="my-3 space-y-1 rounded-xl border border-teal-300/50 p-3 text-xs" aria-label="Oferta de reserva">
    <p className="font-bold">{offer.mode==='NONE'?'Sin reserva':offer.mode==='FREE'?'Reserva sin pago previo':'Reserva con pago previo'}</p>
    {offer.mode==='NONE'?<p>Atención por orden de llegada. El producto no se guarda y podría agotarse.</p>:<>
      {offer.mode==='PREPAYMENT'&&<><p>{offer.paymentKind==='FULL'?'Pago completo':'Abono'}: <strong>${offer.requiredAmountClp.toLocaleString('es-CL')}</strong></p><p>Pagar hasta: {reservationWhen(offer.paymentDueAt)}</p><p className="whitespace-pre-wrap break-words">{offer.paymentInstructions}</p></>}
      <p>El negocio confirma hasta: {reservationWhen(offer.confirmationDueAt)}</p><p>Pedido guardado, si confirma, hasta: {reservationWhen(offer.pickupBy)}</p>
      <p>Solicitar no confirma el apartado. El negocio debe confirmar que guardará todo el pedido.</p>
    </>}
  </section>;
}
