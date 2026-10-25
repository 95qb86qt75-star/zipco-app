import {useEffect,useState} from 'react';
import {santiagoDraftTime} from './alternativeDraft';
import {normalizeReservationOffer,type ReservationOffer} from './reservationContract';

const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const local=(iso?:string)=>{if(!iso)return '';const p=Object.fromEntries(formatter.formatToParts(new Date(iso)).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;};
type Draft={mode:'NONE'|'FREE'|'PREPAYMENT';payment:string;confirmation:string;pickup:string;kind:'DEPOSIT'|'FULL';amount:string;instructions:string};
const seed=(offer?:ReservationOffer):Draft=>({mode:offer?.mode??'NONE',payment:offer?.mode==='PREPAYMENT'?local(offer.paymentDueAt):'',confirmation:offer&&offer.mode!=='NONE'?local(offer.confirmationDueAt):'',pickup:offer&&offer.mode!=='NONE'?local(offer.pickupBy):'',kind:offer?.mode==='PREPAYMENT'?offer.paymentKind:'DEPOSIT',amount:offer?.mode==='PREPAYMENT'?String(offer.requiredAmountClp):'',instructions:offer?.mode==='PREPAYMENT'?offer.paymentInstructions:''});
function offerFromDraft(d:Draft,total:number,initial?:ReservationOffer){
  if(d.mode==='NONE')return {mode:'NONE'} as const;
  const date=(value:string,original?:string)=>{if(original&&value===local(original))return original;const [day,time]=value.split('T');const instant=santiagoDraftTime(day??'',time??'');return instant===null?null:new Date(instant).toISOString();};
  return normalizeReservationOffer({mode:d.mode,confirmationDueAt:date(d.confirmation,initial&&initial.mode!=='NONE'?initial.confirmationDueAt:undefined),pickupBy:date(d.pickup,initial&&initial.mode!=='NONE'?initial.pickupBy:undefined),...(d.mode==='PREPAYMENT'?{paymentDueAt:date(d.payment,initial?.mode==='PREPAYMENT'?initial.paymentDueAt:undefined),paymentKind:d.kind,requiredAmountClp:/^[1-9]\d*$/.test(d.amount)?Number(d.amount):0,paymentInstructions:d.instructions.trim()}:{})},total);
}
export default function ReservationOfferFields({initial,total,onChange,disabled=false,lockMode=false}:{initial?:ReservationOffer;total:number;onChange:(offer:ReservationOffer|null)=>void;disabled?:boolean;lockMode?:boolean}){
  const [draft,setDraft]=useState(()=>seed(initial));
  const apply=(patch:Partial<Draft>)=>{const next={...draft,...patch};setDraft(next);onChange(offerFromDraft(next,total,initial));};
  useEffect(()=>{onChange(offerFromDraft(draft,total,initial));},[total]);
  const valid=offerFromDraft(draft,total,initial);
  const field='mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-950';
  return <fieldset disabled={disabled} className="mt-4 space-y-3 rounded-2xl border border-teal-300 bg-teal-50 p-3 text-sm text-slate-950" aria-label="Condiciones de reserva">
    <legend className="px-1 font-bold">¿Ofreces reservar este pedido?</legend>
    <label className="block">Modalidad<select aria-label="Modalidad de reserva" className={field} value={draft.mode} disabled={disabled||lockMode} onChange={e=>apply({mode:e.target.value as Draft['mode']})}><option value="NONE">Sin reserva</option><option value="FREE">Reserva sin pago previo</option><option value="PREPAYMENT">Reserva con pago previo</option></select></label>
    {draft.mode!=='NONE'&&<>
      {draft.mode==='PREPAYMENT'&&<>
        <label className="block">Pago requerido<select className={field} aria-label="Tipo de pago de reserva" value={draft.kind} onChange={e=>apply({kind:e.target.value as Draft['kind']})}><option value="DEPOSIT">Abono</option><option value="FULL">Pago completo</option></select></label>
        <label className="block">Monto en pesos<input className={field} aria-label="Monto de reserva" inputMode="numeric" value={draft.amount} onChange={e=>apply({amount:e.target.value})}/></label>
        <label className="block">Pagar hasta (hora de Chile)<input className={field} aria-label="Plazo de pago" type="datetime-local" value={draft.payment} onChange={e=>apply({payment:e.target.value})}/></label>
        <label className="block">Instrucciones de pago<textarea className={field} aria-label="Instrucciones de pago" rows={2} value={draft.instructions} onChange={e=>apply({instructions:Array.from(e.target.value).slice(0,500).join('')})}/><small>El comprobante se envía por WhatsApp. ZIPCO no procesa ni verifica pagos.</small></label>
      </>}
      <label className="block">Confirmar apartado hasta (hora de Chile)<input className={field} aria-label="Plazo de confirmación" type="datetime-local" value={draft.confirmation} onChange={e=>apply({confirmation:e.target.value})}/></label>
      <label className="block">Guardar el pedido hasta (hora de Chile)<input className={field} aria-label="Plazo de retiro" type="datetime-local" value={draft.pickup} onChange={e=>apply({pickup:e.target.value})}/></label>
      {!valid&&<p role="alert" className="text-xs text-rose-800">Completa los plazos en orden: pago antes de confirmación y retiro después de confirmación. Revisa el monto y las instrucciones; un abono debe ser menor que el total y el pago completo debe coincidir con él.</p>}
    </>}
  </fieldset>;
}
