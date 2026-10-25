import {useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type {BusinessRequest,MyOrder} from './types';
import {availabilityAllowed} from './availabilityApi';
import {availabilityFlow,CONTACT_COPY} from './availabilityContract';
import useAvailability from './useAvailability';
import useCoordination from './useCoordination';
import {coordinationAllowed,contactAuthorized} from './coordinationApi';
import ReservationPanel from './ReservationPanel';

export default function AvailabilityPostActions({order,business,refresh}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void}){
  const operation=useAvailability(order,business,refresh),contact=useCoordination(order,business,refresh);
  const [dialog,setDialog]=useState<'cancel'|'revoke'|null>(null),[reason,setReason]=useState('');
  if(!availabilityFlow(order.requestProcess))return null;
  const process=order.requestProcess;
  const showContactControls=process?.state!=='READY'&&process?.reservation?.mode!=='PREPAYMENT';
  const canCancel=availabilityAllowed(process,business,'CANCEL_PICKUP'),canRevoke=showContactControls&&availabilityAllowed(process,business,'REVOKE_CONTACT_CONSENT');
  const canAuthorize=['IN_PROGRESS','READY'].includes(process?.state??'')&&coordinationAllowed(process,business,'AUTHORIZE_CONTACT')&&!contactAuthorized(process,business);
  const hasContact=canAuthorize||coordinationAllowed(process,business,'OPEN_WHATSAPP');
  const submit=async()=>{
    if(dialog==='cancel'&&(Array.from(reason.trim()).length<3||Array.from(reason.trim()).length>1000))return;
    if(await operation.run(dialog==='cancel'?'CANCEL_PICKUP':'REVOKE_CONTACT_CONSENT',dialog==='cancel'?{reasonDetail:reason.trim()}:{}))setDialog(null);
  };
  return <section className="mt-3 space-y-2 text-xs" aria-label="Opciones de esta solicitud">
    {process?.reservation&&<ReservationPanel order={order} business={business} refresh={refresh}/>}
    {process?.availability?.path==='LOCAL_PICKUP'&&<div className="rounded-xl border border-teal-300/40 p-3"><p className="font-bold">Retiro en el local</p><p>{process.availability.customerMessage}</p>{process.availability.scheduleOrAddress&&<p>{process.availability.scheduleOrAddress}</p>}<p className="mt-1">{process.reservation?'Los pagos y el apartado se muestran en el seguimiento de reserva. ZIPCO no verifica transferencias.':'No es una reserva ni un pago verificado.'}</p></div>}
    {showContactControls&&<>
    {hasContact&&<p>{CONTACT_COPY}</p>}
    {canAuthorize&&<button type="button" className="w-full rounded-xl border p-3 font-bold" disabled={contact.busy||!!contact.pending()||contact.needsUpdate||contact.restored()||!!contact.storageWarning()} onClick={()=>void contact.run('AUTHORIZE_CONTACT')}>Autorizo compartir mi teléfono para este pedido</button>}
    {contact.message&&<p role="alert">{contact.message}</p>}
    {(contact.restored()||contact.storageWarning())&&<button type="button" className="w-full rounded-xl border p-3" disabled={contact.busy} onClick={()=>void contact.update()}>Actualizar permiso de contacto</button>}
    {contact.pending()?.action==='AUTHORIZE_CONTACT'&&!contact.restored()&&!contact.busy&&<button type="button" className="w-full rounded-xl border p-3" onClick={()=>void contact.retry()}>Reintentar mi autorización pendiente</button>}
    {canRevoke&&<button type="button" className="w-full rounded-xl border p-3" disabled={operation.busy} onClick={()=>setDialog('revoke')}>Retirar mi permiso de contacto</button>}
    </>}
    {canCancel&&<button type="button" className="w-full rounded-xl border border-rose-300 p-3 font-bold" disabled={operation.busy} onClick={()=>setDialog('cancel')}>Cancelar retiro</button>}
    {operation.error&&<div role="alert"><p>{operation.error}</p><button type="button" className="rounded-xl border p-2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button></div>}
    <Dialog.Root open={dialog!==null} onOpenChange={value=>{if(!value&&!operation.busy)setDialog(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm"/>
      <Dialog.Content className="zipco-action-dialog fixed left-1/2 top-1/2 z-[1001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
        <Dialog.Title className="text-xl font-bold">{dialog==='cancel'?'¿Cancelar el retiro?':'¿Retirar tu permiso de contacto?'}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm">{dialog==='cancel'?'Indica el motivo. Se avisará a la otra parte y la solicitud quedará en Historial.':'Solo se retirará tu permiso para futuras entregas de contacto. No cancela el pedido ni puede retirar números ya vistos o mensajes externos.'}</Dialog.Description>
        {dialog==='cancel'&&<label className="mt-3 block text-sm">Motivo<textarea disabled={operation.busy} value={reason} onChange={e=>setReason(Array.from(e.target.value).slice(0,1000).join(''))} className="mt-1 min-h-24 w-full rounded-xl border p-3"/><span>Entre 3 y 1000 caracteres.</span></label>}
        {operation.error&&<p role="alert">{operation.error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className="rounded-xl border p-3" disabled={operation.busy} onClick={()=>setDialog(null)}>Volver</button><button type="button" className="rounded-xl bg-rose-700 p-3 font-bold text-white" disabled={operation.busy||(dialog==='cancel'&&Array.from(reason.trim()).length<3)} onClick={()=>void submit()}>{operation.busy?'Guardando…':'Confirmar'}</button></div>
      </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
