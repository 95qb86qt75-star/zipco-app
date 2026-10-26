import {useEffect,useState} from 'react';
import type {ReservationOfferInput} from './reservationContract';
export default function SimpleReservationOfferFields({initial,total,onChange,disabled=false,lockMode=false}:{initial?:ReservationOfferInput;total:number;onChange:(v:ReservationOfferInput|null)=>void;disabled?:boolean;lockMode?:boolean}){
  const [mode,setMode]=useState(initial?.mode??'NONE'),[amount,setAmount]=useState(initial?.mode==='PREPAYMENT'?String(initial.requiredAmountClp):'');
  const offer=(m=mode,a=amount):ReservationOfferInput|null=>m==='PREPAYMENT'?(/^[1-9]\d*$/.test(a)&&Number(a)<=Math.min(total,50000000)?{mode:'PREPAYMENT',requiredAmountClp:Number(a)}:null):{mode:m} as ReservationOfferInput;
  useEffect(()=>{onChange(offer());},[total]);
  return <fieldset className="mt-4 space-y-2 rounded-2xl border border-teal-200 bg-teal-50 p-3 text-sm text-slate-950" disabled={disabled} aria-label="Condiciones de reserva">
    <legend className="px-1 font-bold">¿El cliente puede reservar este pedido?</legend>
    {([['FREE','Sí, sin pago previo'],['PREPAYMENT','Sí, con un pago previo'],['NONE','No, será por orden de llegada']] as const).map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-2"><input type="radio" name="simple-reservation-mode" aria-label={label} checked={mode===value} disabled={disabled||lockMode} onChange={()=>{setMode(value);onChange(offer(value));}}/>{label}</label>)}
    {mode==='PREPAYMENT'&&<label className="block">Monto para reservar<input className="mt-1 w-full rounded-xl border border-teal-200 bg-white p-3" aria-label="Monto de reserva" inputMode="numeric" value={amount} onChange={e=>{setAmount(e.target.value);onChange(offer(mode,e.target.value));}}/>{!offer()&&<small role="alert">Indica un monto entre $1 y el total del pedido.</small>}</label>}
    {mode==='FREE'&&<p className="text-xs">Reserva automática por 30 minutos desde la hora acordada, como máximo hasta el cierre.</p>}
  </fieldset>;
}
