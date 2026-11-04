import * as React from 'react';
import {useState} from 'react';
import {Check,ChevronDown,Store} from 'lucide-react';
import type {BusinessRequest,MyOrder} from '../../../domain/types';
import useCoordination from '../../../application/useCoordination';
import {coordinationAllowed} from '../../../api/coordinationApi';
import {informationView} from '../../../domain/localPickupInformation';
import ProductPreviewControl from '../../../shared/product-preview/ProductPreviewControl';
import {DetailReveal} from '../layout/DetailReveal';
import AvailabilityPostActions from '../availability/AvailabilityPostActions';
import PickupInstructions from '../availability/PickupInstructions';
import OrderReferencePhoto from '../../../shared/photos/OrderReferencePhoto';
import {safePhoto} from '../../../domain/agreement';
import {formatDeliverySchedule} from '../../../domain/utils';
import './local-pickup-information.css';

/** Informational consultation only. No physical receipt/preparing/completion controls. */
export default function LocalPickupInformationCard({order,business,refresh}:{order:BusinessRequest|MyOrder;business:boolean;refresh:()=>void}){
 const [expanded,setExpanded]=useState(false);
 const operation=useCoordination(order,business,refresh,true);
 const process=order.requestProcess,info=process?.localPickupInformation,plan=process?.availability;
 if(!info||!plan)return null;
 const history=informationView(process,business)==='history',done=info.status==='ACKNOWLEDGED';
 const name='customerName'in order?order.customerName:order.businessName;
 const pending=operation.pending(),blocked=operation.busy||!!pending||operation.needsUpdate;
 const acknowledge=coordinationAllowed(process,false,'ACK_LOCAL_PICKUP_INFORMATION');
 return <article id={`order-${order.id}`} tabIndex={-1} className="zipco-information-card" data-information-status={info.status}>
  <div className="zipco-information-mod"><Store size={16}/>RETIRO DIRECTO · SIN RESERVA</div>
  <h3>{business?'Disponibilidad informada':done?'Indicaciones recibidas':'Indicaciones para ir al local'}</h3>
  <div className="zipco-information-header"><ProductPreviewControl/><strong>{name}</strong><b>{order.total===null?'Total por comprobar':`$${order.total.toLocaleString('es-CL')}`}</b></div>
  <p>{business?'Ya informaste la disponibilidad. No necesitas preparar ni enviar otro aviso.':done?'Confirmaste que recibiste las indicaciones para ir al local.':'Lee las indicaciones del negocio. Puedes acudir por orden de llegada, sin reserva.'}</p>
  {!business&&!history&&<>
   {acknowledge&&!pending&&!operation.needsUpdate&&<button type="button" className="zipco-information-primary" disabled={blocked} onClick={()=>void operation.run('ACK_LOCAL_PICKUP_INFORMATION')}>{operation.busy?'Guardando…':<><Check size={18}/>Confirmo recepción</>}</button>}
   <p className="zipco-information-help">Confirmas que recibiste las indicaciones, no el producto ni un pago.</p>
  </>}
  {(operation.message||pending||operation.needsUpdate)&&<div className="zipco-information-recovery" role="alert">
   {operation.message&&<p>{operation.message}</p>}
   {pending&&<p>Hay un envío pendiente de comprobar. No se repetirá automáticamente.</p>}
   <button type="button" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>
   {pending&&!operation.restored()&&!operation.needsUpdate&&<button type="button" disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button>}
  </div>}
  <button type="button" className="zipco-information-toggle" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Ocultar indicaciones':'Ver indicaciones y productos'}<ChevronDown size={16}/></button>
  <DetailReveal expanded={expanded}><div className="zipco-information-detail">
   <PickupInstructions message={plan.customerMessage} scheduleOrAddress={plan.scheduleOrAddress} notReservation/>
   {order.products.state==='available'&&<ul>{order.products.items.map((item,index)=><li key={index}>{item.quantity}× {item.name}<b>${(item.price*item.quantity).toLocaleString('es-CL')}</b></li>)}</ul>}
   {order.note&&<p>Nota: {order.note}</p>}
   <p>{formatDeliverySchedule(order,business?'business':'customer')}</p>
   {order.referencePhoto&&safePhoto(order.referencePhoto)&&<OrderReferencePhoto src={order.referencePhoto} business={business}/>}
   <p>ZIPCO no procesa ni verifica pagos. Esta consulta no acredita compra ni entrega.</p>
  </div></DetailReveal>
  {!business&&!history&&<>
   {coordinationAllowed(process,false,'OPEN_WHATSAPP')&&<button type="button" disabled={blocked} onClick={()=>void operation.run('OPEN_WHATSAPP')}>Contacto opcional · Escribir al negocio</button>}
   <AvailabilityPostActions order={order} business={false} refresh={refresh} render={parts=><>{parts?.contact}{parts?.alerts}</>}/>
  </>}
 </article>;
}
