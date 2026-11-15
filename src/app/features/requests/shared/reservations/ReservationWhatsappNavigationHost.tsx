import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {readCoordinationSession,subscribeCoordinationSession} from '../../application/intents/coordinationSession';
import {dismissReservationWhatsappNavigation,getReservationWhatsappNavigation,markReservationWhatsappOpened,
  recordReservationWhatsappDeparture,refreshReservationWhatsappReturn,subscribeReservationWhatsappNavigation} from '../../application/reservationWhatsappNavigation';

export default function ReservationWhatsappNavigationHost(){
  const value=React.useSyncExternalStore(subscribeReservationWhatsappNavigation,getReservationWhatsappNavigation,()=>null);
  const [visible,setVisible]=React.useState(false);
  const title=React.useRef<HTMLHeadingElement>(null);
  // Let the existing acceptance dialog/hologram finish before offering the external link.
  React.useEffect(()=>{
    if(!value){setVisible(false);return;}
    if(visible)return;
    const check=()=>{if(!document.querySelector('[role="dialog"],[role="alertdialog"],.zipco-ah,.zipco-d-hs'))setVisible(true);};
    check();const timer=setInterval(check,150);return()=>clearInterval(timer);
  },[!!value,visible]);
  React.useEffect(()=>{
    if(!value)return;
    const session=value.session;
    const resume=()=>{if(!document.hidden)void refreshReservationWhatsappReturn();};
    const visibility=()=>{if(document.hidden)recordReservationWhatsappDeparture();else resume();};
    const off=subscribeCoordinationSession(()=>{if(readCoordinationSession()!==session)dismissReservationWhatsappNavigation();});
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',recordReservationWhatsappDeparture);
    window.addEventListener('blur',recordReservationWhatsappDeparture);window.addEventListener('focus',resume);window.addEventListener('pageshow',resume);
    return()=>{off();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',recordReservationWhatsappDeparture);
      window.removeEventListener('blur',recordReservationWhatsappDeparture);window.removeEventListener('focus',resume);window.removeEventListener('pageshow',resume);};
  },[value?.session]);
  if(!value)return null;
  return <Dialog.Root open={visible} onOpenChange={open=>{if(!open)dismissReservationWhatsappNavigation();}}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[1500] bg-slate-950/60"/>
    <Dialog.Content aria-describedby="reservation-whatsapp-description" onOpenAutoFocus={event=>{event.preventDefault();title.current?.focus();}}
      className="fixed bottom-4 left-1/2 z-[1501] max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-auto rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
      <Dialog.Title ref={title} tabIndex={-1} className="text-lg font-extrabold">{value.status==='checking'?'Actualizando tu solicitud':'Continuar en WhatsApp'}</Dialog.Title>
      <Dialog.Description id="reservation-whatsapp-description" className="mt-2 text-sm">WhatsApp se abrirá aparte. Tu solicitud permanece en ZIPCO.</Dialog.Description>
      {value.receipt&&<p className="mt-2 text-sm">Adjunta el comprobante en la conversación. No se envía automáticamente.</p>}
      {value.status==='failed'?<div role="alert" className="mt-3 text-sm"><p>{value.error}</p><button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 font-bold" onClick={()=>void refreshReservationWhatsappReturn(true)}>Comprobar estado</button></div>
      :value.status==='checking'?<p role="status" className="mt-3 text-sm">Consultando el estado guardado, sin reenviar acciones…</p>
      :<><a href={value.url} target="_blank" rel="noopener noreferrer" onClick={event=>{if(!markReservationWhatsappOpened())event.preventDefault();}}
        className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-teal-700 p-3 text-center font-bold text-white">Abrir WhatsApp</a>
        {value.attempted&&<p className="mt-2 text-xs">Si no se abrió, vuelve a tocar el enlace. No se repetirá la reserva.</p>}</>}
      <button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 font-bold" onClick={dismissReservationWhatsappNavigation}>Volver a ZIPCO</button>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
