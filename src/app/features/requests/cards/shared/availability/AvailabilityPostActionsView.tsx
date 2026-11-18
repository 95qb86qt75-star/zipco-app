import * as React from 'react';
import type {ReactNode} from 'react';

import * as Dialog from '@radix-ui/react-dialog';
import {User,X} from 'lucide-react';


import { CONTACT_COPY } from "../../../domain/availabilityContract";



import ReservationPanel from "../../../shared/reservations/ReservationPanel";
import PickupInstructions from './PickupInstructions';
import {pickupPrepaymentFor} from '../../../domain/pickupPrepayment';
import ReservationReasonChoices,{PICKUP_CANCEL_REASONS} from '../../../shared/reservations/ReservationReasonChoices';
import type {AvailabilityPostActionsModel} from './application/useAvailabilityPostActionsController';

/** Piezas ya armadas (con su lógica, permisos y `disabled` intactos) para quien quiera colocarlas en otra composición.
 *  Cada `has.*` es TRUE solo si la pieza muestra algo visible: un fragmento puede existir y no pintar nada.
 *  - contact: texto de consentimiento + «Autorizo compartir…» + «Retirar mi permiso de contacto».
 *  - alerts: avisos y recuperación que NUNCA deben quedar ocultos (mensaje de contacto, «Actualizar permiso de contacto»,
 *    «Reintentar mi autorización pendiente», y el error de disponibilidad con «Actualizar estado»). */
export type AvailabilityPostActionParts={
  reservation:ReactNode;instructions:ReactNode;contact:ReactNode;cancel:ReactNode;alerts:ReactNode;
  has:{reservation:boolean;instructions:boolean;contact:boolean;cancel:boolean;alerts:boolean};
};

/** Sin `render`: presentación y orden idénticos a los de siempre. Con `render` (solo cliente con retiro local): la vista entrega las
 *  piezas y los diálogos se mantienen aquí, fuera de la composición. `render` debe devolver elementos; no debe ejecutar hooks. */
export default function AvailabilityPostActionsView({model,render}:{model:AvailabilityPostActionsModel;render?:(parts:AvailabilityPostActionParts)=>ReactNode}){
const {business,canAuthorize,canCancel,canRevoke,contact,dialog,hasContact,operation,order,process,reason,refresh,setDialog,setReason,showContactControls,submit}=model;
const openerRef=React.useRef<HTMLElement|null>(null);
const availability=process?.availability,pickup=availability?.path==='LOCAL_PICKUP';
const selectedReasons=business&&!!render&&pickupPrepaymentFor(process)?.phase==='AWAITING_PAYMENT_AND_HOLD';
const reservation=process?.reservation?<ReservationPanel order={order} business={business} refresh={refresh}/>:null;
const instructions=pickup?<PickupInstructions variant={render?'customer':'default'} message={availability?.customerMessage} scheduleOrAddress={availability?.scheduleOrAddress} notReservation={!process?.reservation}/>:null;
const contactCopy=hasContact?<p className={render?'zipco-pickup-consent':undefined}>{CONTACT_COPY}</p>:null;
const authorizeBtn=canAuthorize?<button type="button" className={'w-full rounded-xl border p-3 font-bold'+(render?' zipco-pickup-act':'')} disabled={contact.busy||!!contact.pending()||contact.needsUpdate||contact.restored()||!!contact.storageWarning()} onClick={()=>void contact.run('AUTHORIZE_CONTACT')}>Autorizo compartir mi teléfono para este pedido</button>:null;
const contactMsg=contact.message?<p role="alert">{contact.message}</p>:null;
const restoreBtn=(contact.restored()||contact.storageWarning())?<button type="button" className={'w-full rounded-xl border p-3'+(render?' zipco-pickup-act':'')} disabled={contact.busy} onClick={()=>void contact.update()}>Actualizar permiso de contacto</button>:null;
const retryBtn=contact.pending()?.action==='AUTHORIZE_CONTACT'&&!contact.restored()&&!contact.busy?<button type="button" className={'w-full rounded-xl border p-3'+(render?' zipco-pickup-act':'')} onClick={()=>void contact.retry()}>Reintentar mi autorización pendiente</button>:null;
const revokeBtn=canRevoke?<button type="button" className={'w-full rounded-xl border p-3'+(render?' zipco-pickup-revoke':'')} disabled={operation.busy} onClick={event=>{openerRef.current=event.currentTarget;setDialog('revoke');}}>Retirar mi permiso de contacto</button>:null;
const cancelBtn=canCancel?<button type="button" className={'w-full rounded-xl border border-rose-300 p-3 font-bold'+(render?' zipco-pickup-cancel':'')} disabled={operation.busy} onClick={event=>{openerRef.current=event.currentTarget;setDialog('cancel');}}>Cancelar retiro</button>:null;
const opError=operation.error?<div role="alert"><p>{operation.error}</p><button type="button" className="rounded-xl border p-2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button></div>:null;
const legacyDialogs=<Dialog.Root open={dialog!==null} onOpenChange={value=>{if(!value&&!operation.busy)setDialog(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm"/>
      <Dialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
        <Dialog.Title className="text-xl font-bold">{dialog==='cancel'?'¿Cancelar el retiro?':'¿Retirar tu permiso de contacto?'}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm">{dialog==='cancel'?'Indica el motivo. Se avisará a la otra parte y la solicitud quedará en Historial.':'Solo se retirará tu permiso para futuras entregas de contacto. No cancela el pedido ni puede retirar números ya vistos o mensajes externos.'}</Dialog.Description>
        {dialog==='cancel'&&<label className="mt-3 block text-sm">Motivo<textarea disabled={operation.busy} value={reason} onChange={e=>setReason(Array.from(e.target.value).slice(0,1000).join(''))} className="mt-1 min-h-24 w-full rounded-xl border p-3"/><span>Entre 3 y 1000 caracteres.</span></label>}
        {operation.error&&<p role="alert">{operation.error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className="rounded-xl border p-3" disabled={operation.busy} onClick={()=>setDialog(null)}>Volver</button><button type="button" className="rounded-xl bg-rose-700 p-3 font-bold text-white" disabled={operation.busy||(dialog==='cancel'&&Array.from(reason.trim()).length<3)} onClick={()=>void submit()}>{operation.busy?'Guardando…':'Confirmar'}</button></div>
      </Dialog.Content></Dialog.Portal></Dialog.Root>;
// Estilo Aurora: solo negocio + render + AWAITING_PAYMENT_AND_HOLD (selectedReasons). El resto de consumidores conserva el diálogo anterior.
const auroraDialogs=<Dialog.Root open={dialog!==null} onOpenChange={value=>{if(!value&&!operation.busy)setDialog(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm"/>
      <Dialog.Content data-prepayment-dialog={dialog==='cancel'?'CANCEL_PICKUP':'REVOKE_CONTACT'} onCloseAutoFocus={event=>{const target=openerRef.current;if(target?.isConnected){event.preventDefault();target.focus({preventScroll:true});}}} className="zipco-business-prepayment zipco-bpp-dialog fixed left-1/2 top-1/2 z-[1001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2">
        <div className="zipco-bpp-dtop"><span>{dialog==='cancel'?'Cancelar retiro':'Contacto'}</span><Dialog.Close className="zipco-bpp-dx" aria-label="Cerrar" disabled={operation.busy}><X size={18} aria-hidden="true"/></Dialog.Close></div>
        <span className="zipco-bpp-orb" data-tone={dialog==='cancel'?'danger':undefined} aria-hidden="true">{dialog==='cancel'?<X size={20}/>:<User size={20}/>}</span>
        <Dialog.Title className="zipco-bpp-dt">{dialog==='cancel'?'¿Cancelar el retiro?':'¿Retirar tu permiso de contacto?'}</Dialog.Title>
        <Dialog.Description className="zipco-bpp-dd">{dialog==='cancel'?'Elige el motivo. Se avisará a la otra parte y la solicitud quedará en Historial.':'Solo se retirará tu permiso para futuras entregas de contacto. No cancela el pedido ni puede retirar números ya vistos o mensajes externos.'}</Dialog.Description>
        {dialog==='cancel'&&<ReservationReasonChoices options={PICKUP_CANCEL_REASONS} value={reason} onChange={setReason} disabled={operation.busy}/>}
        {operation.error&&<p role="alert" className="zipco-bpp-derr">{operation.error}</p>}
        <div className="zipco-bpp-dyn"><button type="button" className="zipco-bpp-dy" data-tone={dialog==='cancel'?'danger':undefined} disabled={operation.busy||(dialog==='cancel'&&Array.from(reason.trim()).length<3)} onClick={()=>void submit()}>{operation.busy?'Guardando…':dialog==='cancel'?'Cancelar retiro':'Retirar permiso'}</button><button type="button" className="zipco-bpp-dn" disabled={operation.busy} onClick={()=>setDialog(null)}>Volver</button></div>
      </Dialog.Content></Dialog.Portal></Dialog.Root>;
const dialogs=selectedReasons?auroraDialogs:legacyDialogs;
if(render){
  // Piezas visibles reales (no solo «existe un nodo»). Los avisos de contacto y el error de disponibilidad van juntos en `alerts`.
  const contactVisible=showContactControls&&!!(contactCopy||authorizeBtn||revokeBtn);
  const contactAlerts=showContactControls&&!!(contactMsg||restoreBtn||retryBtn),alertsVisible=contactAlerts||!!opError;
  return <>{render({
    reservation,instructions,
    contact:showContactControls?<>{contactCopy}{authorizeBtn}{revokeBtn}</>:null,
    cancel:cancelBtn,
    alerts:alertsVisible?<>{showContactControls&&<>{contactMsg}{restoreBtn}{retryBtn}</>}{opError}</>:null,
    has:{reservation:!!reservation,instructions:pickup,contact:contactVisible,cancel:!!cancelBtn,alerts:alertsVisible},
  })}{dialogs}</>;
}
return <section className="mt-3 space-y-2 text-xs" aria-label="Opciones de esta solicitud">
    {reservation}
    {instructions}
    {showContactControls&&<>
    {contactCopy}
    {authorizeBtn}
    {contactMsg}
    {restoreBtn}
    {retryBtn}
    {revokeBtn}
    </>}
    {cancelBtn}
    {opError}
    {dialogs}
  </section>;

}
