import * as React from 'react';
import {useEffect,useId,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, Phone, Plus, RefreshCw, Store, X } from 'lucide-react';
import type { RequestProcessSummary } from "../../domain/requestProcess";
import { isSimpleOffer } from "../../domain/simplifiedReservationContract";
import { readReservationOptions, canChooseWithoutPreview, type ReservationOptions } from "../../api/reservationOptions";
import { readCoordinationSession } from "../../application/intents/coordinationSession";
import ReservationOfferSummary from "./ReservationOfferSummary";
import "./reservation-decision.css";

export const NO_RESERVATION_WARNING='Sin reserva, el negocio atiende por orden de llegada. Cuando llegues, el producto podría haberse agotado.';
const BookmarkIcon=({size=18}:{size?:number})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>;
const WarningIcon=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
export default function ReservationDecisionDialog({open,onClose,process,name,contact,onContact,busy,error,onConfirm,onRefresh}:{open:boolean;onClose:()=>void;process:RequestProcessSummary;name:string;contact:boolean;onContact:(v:boolean)=>void;busy:boolean;error?:string;onConfirm:(reserve:boolean,note:string)=>void;onRefresh:()=>void}){
  const [options,setOptions]=useState<ReservationOptions|null>(null),[failure,setFailure]=useState(''),[note,setNote]=useState(''),[without,setWithout]=useState(false);
  const [withoutPreview,setWithoutPreview]=useState(false);
  // Solo presentación: nota plegada y botón tocado (para mostrar «Guardando…» en él). No viajan en ningún payload.
  const [noteOpen,setNoteOpen]=useState(false),[pick,setPick]=useState<'reserve'|'none'|null>(null);
  const noteId=useId(),needId=useId();
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
  useEffect(()=>{if(!busy)setPick(null);},[busy]);
  if(!offer)return null;
  const none=offer.mode==='NONE'||without,paid=offer.mode==='PREPAYMENT';
  const needContact=!none&&paid&&!contact,reserveSaving=busy&&pick==='reserve',noneSaving=busy&&pick==='none';
  const contactField=plan?.allowCustomerWhatsapp&&<>
    <label className={`zipco-rd-contact${contact?' is-on':''}${needContact?' is-needed':''}${busy?' is-disabled':''}`}>
      <span className="zipco-rd-icon-tile"><Phone size={14} aria-hidden="true"/></span>
      <span className="zipco-rd-contact-text">{!none&&paid&&<em className="zipco-rd-required">NECESARIO</em>}{none?'Permitir compartir mi teléfono con este negocio para coordinar este pedido por WhatsApp (opcional).':'Permitir compartir mi teléfono con este negocio para coordinar este pedido por WhatsApp.'}</span>
      <input type="checkbox" checked={contact} disabled={busy} aria-describedby={needContact?needId:undefined} onChange={e=>onContact(e.target.checked)}/>
      <span className="zipco-rd-switch" aria-hidden="true"/>
    </label>
  </>;
  return <Dialog.Root open={open} onOpenChange={v=>{if(!v&&!busy)onClose();}}><Dialog.Portal><Dialog.Overlay className="zipco-rd-overlay"/>
    <Dialog.Content className="zipco-rd" tabIndex={-1} aria-busy={busy||undefined} onOpenAutoFocus={e=>{e.preventDefault();(e.currentTarget as HTMLElement).focus({preventScroll:true});}}>
      {busy&&<div className="zipco-rd-progress" aria-hidden="true"><i/></div>}
      <button type="button" className="zipco-rd-close" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={17} aria-hidden="true"/></button>
      <div className="zipco-rd-body">
        <header className="zipco-rd-header">
          <span className="zipco-rd-badge"><BookmarkIcon size={22}/></span>
          <div className="zipco-rd-heading">
            <Dialog.Title className="zipco-rd-title">{none?'Ir al local sin reserva':`${name} te permite reservar tu pedido`}</Dialog.Title>
            {!none&&paid&&<em className="zipco-rd-chip">PAGO PREVIO · ${offer.requiredAmountClp.toLocaleString('es-CL')}</em>}
            <Dialog.Description className={!none&&paid?'zipco-rd-sr':'zipco-rd-desc'}>{none?'El producto no quedará apartado.':paid?'Coordina el pago por WhatsApp. El negocio confirmará que recibió el monto y apartó el pedido.':'Puedes reservar sin pago previo o ir directamente a comprar.'}</Dialog.Description>
          </div>
        </header>
        {!options&&!failure&&<p role="status" className="zipco-rd-loading"><i aria-hidden="true"/>Verificando condiciones…</p>}
        {(failure||error)&&<div className="zipco-rd-error"><p role="alert">{failure||error}</p>
          {failure&&<button type="button" className="zipco-rd-recover" disabled={busy} onClick={()=>{onClose();onRefresh();}}><RefreshCw size={15} aria-hidden="true"/>Actualizar condiciones</button>}</div>}
        {!none&&<div className={`zipco-rd-offer${paid?' is-prepaid':''}`}><ReservationOfferSummary offer={offer}/></div>}
        {!none&&<div className="zipco-rd-note">
          <button type="button" className="zipco-rd-fold" aria-expanded={noteOpen} aria-controls={noteId} disabled={busy} onClick={()=>setNoteOpen(v=>!v)}>
            <span className="zipco-rd-icon-tile"><Pencil size={14} aria-hidden="true"/></span>
            <span className="zipco-rd-fold-label">{noteOpen?'Nota opcional':'Agregar nota (opcional)'}</span>
            {noteOpen||note?<i className="zipco-rd-count">{Array.from(note).length}/300</i>:<i className="zipco-rd-plus"><Plus size={14} aria-hidden="true"/></i>}
          </button>
          <div id={noteId} hidden={!noteOpen}><textarea aria-label="Nota para la reserva" className="zipco-rd-textarea" value={note} disabled={busy} onChange={e=>setNote(Array.from(e.target.value).slice(0,300).join(''))}/></div>
        </div>}
        {contactField}
        {needContact&&<p id={needId} className="zipco-rd-need">Para reservar con pago, autoriza tu contacto o elige ir sin reserva.</p>}
        <p role="note" className="zipco-rd-warning"><WarningIcon/><span>{NO_RESERVATION_WARNING}</span></p>
      </div>
      <footer className="zipco-rd-footer">
        {!none&&<>
          <div className="zipco-rd-choice">
            <button type="button" className={`zipco-rd-option zipco-rd-reserve${reserveSaving?' is-saving':''}`} disabled={busy||!options||paid&&!contact} aria-describedby={needContact?needId:undefined} onClick={()=>{setPick('reserve');onConfirm(true,note.trim());}}>
              <span className="zipco-rd-option-icon">{reserveSaving?<i className="zipco-rd-spinner" aria-hidden="true"/>:<BookmarkIcon/>}</span>
              <span>{reserveSaving?'Guardando…':paid?`Reservar · coordinar pago de $${offer.requiredAmountClp.toLocaleString('es-CL')}`:'Reservar'}</span>
            </button>
            <button type="button" className="zipco-rd-option zipco-rd-without" disabled={busy} onClick={()=>setWithout(true)}>
              <span className="zipco-rd-option-icon"><Store size={19} aria-hidden="true"/></span>
              <span>Ir al local sin reserva</span>
            </button>
          </div>
          {needContact&&!busy&&<p className="zipco-rd-why" aria-hidden="true">Falta tu permiso de contacto para reservar con pago.</p>}
        </>}
        {none&&<button type="button" className={`zipco-rd-primary${noneSaving?' is-saving':''}`} disabled={busy||!options&&!withoutPreview} onClick={()=>{setPick('none');onConfirm(false,'');}}>{noneSaving?'Guardando…':'Confirmar que iré'}</button>}
        <button type="button" className="zipco-rd-back" disabled={busy} onClick={()=>without?setWithout(false):onClose()}>Volver</button>
      </footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
