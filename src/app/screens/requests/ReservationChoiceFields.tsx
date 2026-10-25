import type {ReservationChoice,ReservationOffer} from './reservationContract';
import ReservationOfferSummary from './ReservationOfferSummary';
export default function ReservationChoiceFields({offer,value,note,onChange,onNote,disabled=false}:{offer:ReservationOffer;value:ReservationChoice['choice'];note:string;onChange:(v:ReservationChoice['choice'])=>void;onNote:(v:string)=>void;disabled?:boolean}){
  return <fieldset disabled={disabled} className="my-3 space-y-2 text-xs" aria-label="Tu elección de reserva"><ReservationOfferSummary offer={offer}/>
    {offer.mode!=='NONE'&&<><label className="flex items-center gap-2"><input type="radio" name="reservation-choice" checked={value==='REQUEST_RESERVATION'} onChange={()=>onChange('REQUEST_RESERVATION')}/>Solicitar reserva{offer.mode==='PREPAYMENT'?' con pago previo':''}</label><label className="flex items-center gap-2"><input type="radio" name="reservation-choice" checked={value==='NONE'} onChange={()=>onChange('NONE')}/>Iré sin reserva, sujeto a disponibilidad</label>
      {value==='REQUEST_RESERVATION'&&<label className="block">Nota opcional<textarea aria-label="Nota para la reserva" className="mt-1 w-full rounded-xl border bg-white p-2 text-slate-950" value={note} onChange={e=>onNote(Array.from(e.target.value).slice(0,300).join(''))}/></label>}
    </>}
  </fieldset>;
}
