import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type {RequestProcessSummary} from './requestProcess';
import {isSimpleOffer} from './simplifiedReservationContract';
import {readReservationOptions,canChooseWithoutPreview,type ReservationOptions} from './reservationOptions';
import {readCoordinationSession} from './coordinationSession';
import ReservationOfferSummary from './ReservationOfferSummary';

export const NO_RESERVATION_WARNING='Sin reserva, el negocio atiende por orden de llegada. Cuando llegues, el producto podría haberse agotado.';
export default function ReservationDecisionDialog({open,onClose,process,name,contact,onContact,busy,error,onConfirm,onRefresh}:{open:boolean;onClose:()=>void;process:RequestProcessSummary;name:string;contact:boolean;onContact:(v:boolean)=>void;busy:boolean;error?:string;onConfirm:(reserve:boolean,note:string)=>void;onRefresh:()=>void}){
  const [options,setOptions]=useState<ReservationOptions|null>(null),[failure,setFailure]=useState(''),[note,setNote]=useState(''),[without,setWithout]=useState(false);
  const [withoutPreview,setWithoutPreview]=useState(false);
  const plan=process.availability,offer=plan?.reservationOffer,session=readCoordinationSession();
  useEffect(()=>{
    if(!open||!session||!plan)return;
    const controller=new AbortController();setOptions(null);setFailure('');setWithout(false);setWithoutPreview(false);
    readReservationOptions(process.id,process.version,session.token,false,plan.availabilityConfirmationId,controller.signal).then(value=>{
      if(controller.signal.aborted||readCoordinationSession()!==session)return;
      const current=offer&&isSimpleOffer(offer)?offer.simplified.termsVersion:null,latest=isSimpleOffer(value.reservationOffer)?value.reservationOffer.simplified.termsVersion:null;
      if(value.reservationOffer.mode!==offer?.mode||current!==latest)throw Error('Las condiciones cambiaron. Actualiza el pedido antes de confirmar.');
      setOptions(value);
    }).catch(e=>{if(!controller.signal.aborted){setFailure(e instanceof Error?e.message:'No se pudo verificar la reserva.');setWithoutPreview(canChooseWithoutPreview(e));}});
    return()=>controller.abort();
  },[open,process.id,process.version,plan?.availabilityConfirmationId,session]);
  if(!offer)return null;
  const none=offer.mode==='NONE'||without,paid=offer.mode==='PREPAYMENT';
  return <Dialog.Root open={open} onOpenChange={v=>{if(!v&&!busy)onClose();}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"/>
    <Dialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1101] max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
      <Dialog.Title className="text-xl font-bold">{none?'Ir al local sin reserva':`${name} te permite reservar tu pedido`}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm">{none?'El producto no quedará apartado.':paid?'Coordina el pago por WhatsApp. El negocio confirmará que recibió el monto y apartó el pedido.':'Puedes reservar sin pago previo o ir directamente a comprar.'}</Dialog.Description>
      {!none&&<ReservationOfferSummary offer={offer}/>}
      {!none&&<><label className="my-3 block text-sm">Nota opcional<textarea aria-label="Nota para la reserva" className="mt-1 w-full rounded-xl border bg-white p-2 text-slate-950" value={note} disabled={busy} onChange={e=>setNote(Array.from(e.target.value).slice(0,300).join(''))}/></label>
        {plan?.allowCustomerWhatsapp&&<label className="my-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={contact} disabled={busy} onChange={e=>onContact(e.target.checked)}/>Permitir compartir mi teléfono con este negocio para coordinar este pedido por WhatsApp.</label>}
        <button className="mt-2 w-full rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-50" disabled={busy||!options||paid&&!contact} onClick={()=>onConfirm(true,note.trim())}>{paid?`Reservar · coordinar pago de $${offer.requiredAmountClp.toLocaleString('es-CL')}`:'Reservar'}</button>
        {paid&&!contact&&<p className="mt-2 text-xs">Para reservar con pago, autoriza tu contacto o elige ir sin reserva.</p>}
        <button className="mt-2 w-full rounded-xl border p-3 font-bold" disabled={busy} onClick={()=>setWithout(true)}>Ir al local sin reserva</button>
      </>}
      {none&&plan?.allowCustomerWhatsapp&&<label className="my-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={contact} disabled={busy} onChange={e=>onContact(e.target.checked)}/>Permitir compartir mi teléfono con este negocio para coordinar este pedido por WhatsApp (opcional).</label>}
      <p role="note" className="my-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">{NO_RESERVATION_WARNING}</p>
      {!options&&!failure&&<p className="text-xs">Verificando condiciones…</p>}
      {(failure||error)&&<p role="alert" className="my-2 text-sm text-rose-600">{failure||error}</p>}
      {failure&&<button className="my-2 rounded-xl border p-2" disabled={busy} onClick={()=>{onClose();onRefresh();}}>Actualizar condiciones</button>}
      {none&&<button className="w-full rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-50" disabled={busy||!options&&!withoutPreview} onClick={()=>onConfirm(false,'')}>Confirmar que iré</button>}
      <button className="mt-2 w-full rounded-xl border p-3" disabled={busy} onClick={()=>without?setWithout(false):onClose()}>Volver</button>
    </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
