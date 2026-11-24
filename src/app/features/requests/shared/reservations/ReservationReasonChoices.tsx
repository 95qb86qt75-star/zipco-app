import * as React from 'react';
import {Check} from 'lucide-react';

/** Presentation only: selected human-readable text travels in the existing reasonDetail. */
export const PICKUP_CANCEL_REASONS=['El cliente pidió cancelar','El cliente no llegó al retiro','No recibí el pago','Sin disponibilidad del producto','Otro motivo'];
export const PICKUP_DECLINE_REASONS=['Sin disponibilidad del producto','No pude apartar el pedido','No recibí el pago','Otro motivo'];
/** `tone` solo cambia el color de la opción elegida: «danger» (rojo, acciones que cancelan) u «ok» (verde). No afecta a la lógica. */
export default function ReservationReasonChoices({options,value,onChange,disabled=false,tone='danger'}:{options:readonly string[];value:string;onChange:(value:string)=>void;disabled?:boolean;tone?:'danger'|'ok'}){
  const name=React.useId();
  return <fieldset disabled={disabled} data-tone={tone} className="zipco-business-prepayment zipco-bpp-reasonset">
    <legend className="zipco-bpp-rl">Motivo</legend>
    <div className="zipco-bpp-reasons">{options.map(text=><label key={text} className="zipco-bpp-reason" data-selected={value===text}>
      <input className="zipco-bpp-reason-input" type="radio" name={name} checked={value===text} onChange={()=>onChange(text)}/>
      <span className="zipco-bpp-dot" aria-hidden="true"><Check size={13} strokeWidth={3.2}/></span>{text}
    </label>)}</div>
  </fieldset>;
}
