import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {readCoordinationSession,subscribeCoordinationSession} from '../../application/intents/coordinationSession';
import {dismissReservationWhatsappNavigation,getReservationWhatsappNavigation,markReservationWhatsappOpened,
  recordReservationWhatsappDeparture,refreshReservationWhatsappReturn,subscribeReservationWhatsappNavigation} from '../../application/reservationWhatsappNavigation';

export default function ReservationWhatsappNavigationHost(){
  const value=React.useSyncExternalStore(subscribeReservationWhatsappNavigation,getReservationWhatsappNavigation,()=>null);
  const [visible,setVisible]=React.useState(false);
  const title=React.useRef<HTMLHeadingElement>(null);
  const opener=React.useRef<HTMLElement|null>(null);
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
  const aurora=value.business&&value.appearance==='business-prepayment';
  const close=<button type="button" className={aurora?`zipco-bpp-dn${value.status==='checking'?' col-span-2':''}`:'mt-3 min-h-11 w-full rounded-xl border p-3 font-bold'} onClick={dismissReservationWhatsappNavigation}>{aurora?'Volver':'Volver a ZIPCO'}</button>;
  const access=value.status==='failed'?<button type="button" className={aurora?'zipco-bpp-dy':'mt-3 min-h-11 w-full rounded-xl border p-3 font-bold'} onClick={()=>void refreshReservationWhatsappReturn(true)}>Comprobar estado</button>
    :value.status==='checking'?null:<a href={value.url} target="_blank" rel="noopener noreferrer" onClick={event=>{if(!markReservationWhatsappOpened())event.preventDefault();}}
      className={aurora?'zipco-bpp-dy flex items-center justify-center text-center no-underline':'mt-4 flex min-h-12 items-center justify-center rounded-xl bg-teal-700 p-3 text-center font-bold text-white'}>Abrir WhatsApp</a>;
  return <Dialog.Root open={visible} onOpenChange={open=>{if(!open)dismissReservationWhatsappNavigation();}}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[1500] bg-slate-950/60"/>
    <Dialog.Content aria-describedby="reservation-whatsapp-description" onOpenAutoFocus={event=>{event.preventDefault();opener.current=aurora?(value.returnFocus??(document.activeElement instanceof HTMLElement?document.activeElement:null)):null;title.current?.focus();}}
      onCloseAutoFocus={event=>{if(aurora&&opener.current?.isConnected){event.preventDefault();opener.current.focus({preventScroll:true});}}}
      className={aurora?'zipco-business-prepayment zipco-bpp-dialog fixed top-1/2 left-1/2 z-[1501] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2':'fixed bottom-4 left-1/2 z-[1501] max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-auto rounded-3xl bg-white p-5 text-slate-950 shadow-xl'}>
      {aurora&&<div className="zipco-bpp-dtop"><span>Aclarar la reserva</span><Dialog.Close className="zipco-bpp-dx" aria-label="Cerrar"><X size={18} aria-hidden="true"/></Dialog.Close></div>}
      <Dialog.Title ref={title} tabIndex={-1} className={aurora?'zipco-bpp-dt':'text-lg font-extrabold'}>{value.status==='checking'?'Actualizando tu solicitud':aurora?'Aclarar la reserva por WhatsApp':'Continuar en WhatsApp'}</Dialog.Title>
      <Dialog.Description id="reservation-whatsapp-description" className={aurora?'zipco-bpp-dd':'mt-2 text-sm'}>WhatsApp se abrirá aparte. Tu solicitud permanece en ZIPCO.</Dialog.Description>
      {value.receipt&&<p className="mt-2 text-sm">Adjunta el comprobante en la conversación. No se envía automáticamente.</p>}
      {aurora&&<p className="zipco-bpp-wa-note">Puedes aclarar el pago y el apartado con el cliente. Abrir WhatsApp no confirma que recibiste el pago ni que apartaste el pedido.</p>}
      {value.status==='failed'?<div role="alert" className={aurora?'zipco-bpp-derr':'mt-3 text-sm'}><p>{value.error}</p>{!aurora&&access}</div>
      :value.status==='checking'?<p role="status" className={aurora?'zipco-bpp-dd':'mt-3 text-sm'}>Consultando el estado guardado, sin reenviar acciones…</p>
      :<>{!aurora&&access}{value.attempted&&<p className={aurora?'zipco-bpp-dd':'mt-2 text-xs'}>Si no se abrió, vuelve a tocar el enlace. No se repetirá la reserva.</p>}</>}
      {aurora?<div className="zipco-bpp-dyn">{access}{close}</div>:close}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
