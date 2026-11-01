import * as React from 'react';
import {Info,MapPin} from 'lucide-react';

/** Única implementación del bloque «Retiro en el local» (mensaje e indicaciones reales del negocio).
 *  variant="default": markup y clases idénticos a los que tenía AvailabilityPostActionsView (otros consumidores no cambian).
 *  variant="customer": presentación de la tarjeta del cliente (clases zipco-pickup-*, estilos acotados a .zipco-pickup-c).
 *  El texto es libre: no se convierte en hora, no se inventa una dirección y no se sustituye por ejemplos. */
export default function PickupInstructions({message,scheduleOrAddress,notReservation,variant='default'}:{
  message:React.ReactNode;scheduleOrAddress?:React.ReactNode;
  /** true cuando la solicitud NO tiene reserva: se muestra «No es una reserva ni un pago verificado.» */
  notReservation:boolean;variant?:'default'|'customer';
}){
  if(variant==='customer')return <section className="zipco-pickup-how" aria-label="Retiro en el local">
    <p className="zipco-pickup-how-t"><MapPin size={16} aria-hidden="true"/><b>Retiro en el local</b></p>
    <p className="zipco-pickup-how-m">{message}</p>
    {scheduleOrAddress&&<p className="zipco-pickup-how-w">{scheduleOrAddress}</p>}
    {notReservation&&<p className="zipco-pickup-how-n"><Info size={13} aria-hidden="true"/>No es una reserva ni un pago verificado.</p>}
  </section>;
  return <div className="rounded-xl border border-teal-300/40 p-3"><p className="font-bold">Retiro en el local</p><p>{message}</p>{scheduleOrAddress&&<p>{scheduleOrAddress}</p>}{notReservation&&<p className="mt-1">No es una reserva ni un pago verificado.</p>}</div>;
}
