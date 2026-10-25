import type {ReservationOffer} from './reservationContract';
export const reservationWhen=(iso:string)=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));
export default function ReservationOfferSummary({offer}:{offer:ReservationOffer}){
  return <section className="my-3 space-y-1 rounded-xl border border-teal-300/50 p-3 text-xs" aria-label="Oferta de reserva">
    <p className="font-bold">{offer.mode==='NONE'?'Sin reserva':offer.mode==='FREE'?'Reserva sin pago previo':'Reserva con pago previo'}</p>
    {offer.mode==='NONE'?<p>Compra sujeta a disponibilidad al llegar.</p>:<>
      {offer.mode==='PREPAYMENT'&&<><p>{offer.paymentKind==='FULL'?'Pago completo':'Abono'}: <strong>${offer.requiredAmountClp.toLocaleString('es-CL')}</strong></p><p>Pagar hasta: {reservationWhen(offer.paymentDueAt)}</p><p className="whitespace-pre-wrap break-words">{offer.paymentInstructions}</p></>}
      <p>El negocio confirma hasta: {reservationWhen(offer.confirmationDueAt)}</p><p>Pedido guardado, si confirma, hasta: {reservationWhen(offer.pickupBy)}</p>
      <p>Solicitar no confirma el apartado. El negocio debe confirmar que guardará todo el pedido.</p>
    </>}
  </section>;
}
