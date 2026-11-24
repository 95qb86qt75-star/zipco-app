import * as React from 'react';
import { Bookmark, MapPin } from 'lucide-react';
import type { ReservationChoice, ReservationOffer } from "../../domain/reservationContract";
import ReservationOfferSummary from "./ReservationOfferSummary";
import { isSimpleOffer } from "../../domain/simplifiedReservationContract";
import { NO_RESERVATION_WARNING } from "./ReservationDecisionDialog";
/** variant="cards": presentación del cliente al aceptar (tarjetas de elección). Por defecto queda el formulario de siempre.
 *  hideSummary: la pantalla que ya muestra la oferta (boleto de confirmación) evita repetirla aquí. */
export default function ReservationChoiceFields({offer,value,note,onChange,onNote,disabled=false,variant='plain',hideSummary=false}:{offer:ReservationOffer;value:ReservationChoice['choice'];note:string;onChange:(v:ReservationChoice['choice'])=>void;onNote:(v:string)=>void;disabled?:boolean;variant?:'plain'|'cards';hideSummary?:boolean}){
  // El aviso de «sin reserva» solo aplica cuando la persona va sin reserva (o el negocio no ofrece reserva).
  const showWarning=offer.mode==='NONE'||(isSimpleOffer(offer)&&value==='NONE');
  const warning=<>{NO_RESERVATION_WARNING}{value==='NONE'?' Al confirmar, aceptas ir sin que el producto quede apartado.':''}</>;
  const update=(v:string)=>onNote(Array.from(v).slice(0,300).join(''));
  if(variant==='cards')return <fieldset disabled={disabled} className="zipco-rc" aria-label="Tu elección de reserva">
    {!hideSummary&&<ReservationOfferSummary offer={offer}/>}
    {offer.mode!=='NONE'&&<>
      <span className="zipco-rc-cap" aria-hidden="true">TU ELECCIÓN</span>
      <div className="zipco-rc-seg">
        <label className={`zipco-rc-opt${value==='REQUEST_RESERVATION'?' on':''}`}><input type="radio" name="reservation-choice" checked={value==='REQUEST_RESERVATION'} onChange={()=>onChange('REQUEST_RESERVATION')}/><span className="zipco-rc-ci" aria-hidden="true"><Bookmark/></span><span>Solicitar reserva{offer.mode==='PREPAYMENT'?' con pago previo':''}</span></label>
        <label className={`zipco-rc-opt${value==='NONE'?' on':''}`}><input type="radio" name="reservation-choice" checked={value==='NONE'} onChange={()=>onChange('NONE')}/><span className="zipco-rc-ci" aria-hidden="true"><MapPin/></span><span>Iré sin reserva, sujeto a disponibilidad</span></label>
      </div>
      {value==='REQUEST_RESERVATION'&&<label className="zipco-rc-nt"><span>Nota opcional<i>{Array.from(note).length}/300</i></span><textarea aria-label="Nota para la reserva" value={note} onChange={e=>update(e.target.value)}/></label>}
    </>}
    {showWarning&&<p role="note" className="zipco-rc-wn">{warning}</p>}
  </fieldset>;
  return <fieldset disabled={disabled} className="my-3 space-y-2 text-xs" aria-label="Tu elección de reserva"><ReservationOfferSummary offer={offer}/>
    {offer.mode!=='NONE'&&<><label className="flex items-center gap-2"><input type="radio" name="reservation-choice" checked={value==='REQUEST_RESERVATION'} onChange={()=>onChange('REQUEST_RESERVATION')}/>Solicitar reserva{offer.mode==='PREPAYMENT'?' con pago previo':''}</label><label className="flex items-center gap-2"><input type="radio" name="reservation-choice" checked={value==='NONE'} onChange={()=>onChange('NONE')}/>Iré sin reserva, sujeto a disponibilidad</label>
      {value==='REQUEST_RESERVATION'&&<label className="block">Nota opcional<textarea aria-label="Nota para la reserva" className="mt-1 w-full rounded-xl border bg-white p-2 text-slate-950" value={note} onChange={e=>update(e.target.value)}/></label>}
    </>}
    {showWarning&&<p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950">{warning}</p>}
  </fieldset>;
}
