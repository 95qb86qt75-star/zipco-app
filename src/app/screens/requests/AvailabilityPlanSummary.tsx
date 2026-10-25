import type {AvailabilityPlan} from './availabilityContract';
import ReservationOfferSummary from './ReservationOfferSummary';
export default function AvailabilityPlanSummary({plan}:{plan:AvailabilityPlan}){
  return <section className="my-3 rounded-xl border border-teal-300/40 p-3 text-sm" aria-label="Camino de esta propuesta">
    <p className="font-bold">{plan.path==='LOCAL_PICKUP'?'Retiro en el local':'Coordinar por WhatsApp'}</p>
    {plan.customerMessage&&<p className="mt-1 whitespace-pre-wrap break-words">{plan.customerMessage}</p>}
    {plan.scheduleOrAddress&&<p className="mt-1 whitespace-pre-wrap break-words">{plan.scheduleOrAddress}</p>}
    {plan.path==='LOCAL_PICKUP'&&!plan.reservationOffer&&<p className="mt-1 text-xs">No es una reserva ni un pago verificado.</p>}
    {plan.reservationOffer&&<ReservationOfferSummary offer={plan.reservationOffer}/>}
    {!plan.allowCustomerWhatsapp&&<p className="mt-1 text-xs">El negocio no comparte su teléfono en este camino.</p>}
  </section>;
}
