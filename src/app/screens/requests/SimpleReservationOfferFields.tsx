import {useEffect,useState} from 'react';
import type {ReservationOfferInput} from './reservationContract';
import {readReservationCapabilities} from './reservationCapabilities';
import {isAdvisoryOffer} from './simplifiedReservationContract';
export default function SimpleReservationOfferFields({initial,total,onChange,disabled=false,lockMode=false}:{initial?:ReservationOfferInput;total:number;onChange:(v:ReservationOfferInput|null)=>void;disabled?:boolean;lockMode?:boolean}){
  const [mode,setMode]=useState(initial?.mode??'NONE'),[amount,setAmount]=useState(initial?.mode==='PREPAYMENT'?String(initial.requiredAmountClp):'');
  const [policy,setPolicy]=useState<boolean|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController(),token=localStorage.getItem('zipco-token');setPolicy(null);setError('');onChange(null);
    if(!token){setError('Ingresa nuevamente para revisar las condiciones.');return()=>controller.abort();}
    readReservationCapabilities(token,controller.signal).then(c=>{
      if(controller.signal.aborted||localStorage.getItem('zipco-token')!==token)return;
      if(isAdvisoryOffer(initial)&&c.serviceHoursAdvisoryEnabled!==true){setError('La modalidad de horario informativo todavía no está habilitada para nuevas propuestas. Las condiciones anteriores se conservan.');return;}
      setPolicy(c.serviceHoursAdvisoryEnabled===true);
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message||'No pudimos verificar las condiciones de reserva.');});
    return()=>controller.abort();
  },[retry]);
  const offer=(m=mode,a=amount):ReservationOfferInput|null=>policy===null?null:m==='PREPAYMENT'?(/^[1-9]\d*$/.test(a)&&Number(a)<=Math.min(total,50000000)?{mode:'PREPAYMENT',requiredAmountClp:Number(a),...(policy?{hoursPolicy:'ADVISORY_ONLY' as const}:{})}:null):m==='FREE'?{mode:'FREE',...(policy?{hoursPolicy:'ADVISORY_ONLY' as const}:{})}:{mode:'NONE'};
  useEffect(()=>{onChange(offer());},[total,policy]);
  return <fieldset className="mt-4 space-y-2 rounded-2xl border border-teal-200 bg-teal-50 p-3 text-sm text-slate-950" disabled={disabled} aria-label="Condiciones de reserva">
    <legend className="px-1 font-bold">¿El cliente puede reservar este pedido?</legend>
    {([['FREE','Sí, sin pago previo'],['PREPAYMENT','Sí, con un pago previo'],['NONE','No, será por orden de llegada']] as const).map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-2"><input type="radio" name="simple-reservation-mode" aria-label={label} checked={mode===value} disabled={disabled||lockMode} onChange={()=>{setMode(value);onChange(offer(value));}}/>{label}</label>)}
    {mode==='PREPAYMENT'&&<label className="block">Monto para reservar<input className="mt-1 w-full rounded-xl border border-teal-200 bg-white p-3" aria-label="Monto de reserva" inputMode="numeric" value={amount} onChange={e=>{setAmount(e.target.value);onChange(offer(mode,e.target.value));}}/>{!offer()&&<small role="alert">Indica un monto entre $1 y el total del pedido.</small>}</label>}
    {policy===null&&!error&&<p role="status" className="text-xs">Revisando condiciones de reserva…</p>}
    {error&&<p role="alert" className="text-xs">{error} <button type="button" className="underline" onClick={()=>setRetry(v=>v+1)}>Reintentar</button></p>}
    {mode==='FREE'&&policy!==null&&<p className="text-xs">{policy?'La reserva se confirma automáticamente al solicitarla. No tiene vencimiento automático.':'Reserva automática por 30 minutos desde la hora acordada, como máximo hasta el cierre.'}</p>}
    {mode==='PREPAYMENT'&&policy&&<p className="text-xs">Pendiente hasta que confirmes haber recibido el monto y apartado el pedido. Sin vencimiento automático. ZIPCO no verifica transferencias.</p>}
  </fieldset>;
}
