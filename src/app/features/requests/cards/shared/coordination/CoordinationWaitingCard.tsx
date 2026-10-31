import * as React from 'react';
import CustomerCoordinationCard from '../../customer/whatsapp/CustomerCoordinationCard';
import BusinessCoordinationWaitingCard from '../../business/coordination/BusinessCoordinationWaitingCard';
import type {CoordinationWaitingCardProps} from './coordinationCardModel';
/** Selects one canonical participant design, keeping shared state outside presentation. */
export function CoordinationWaitingCard({business=true,items=[],...props}:CoordinationWaitingCardProps){
const {mode}=props.model,own=mode==='ownPending',closed=mode==='declined',confirm=mode==='confirm';
  const description=own?'Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.':closed?'Se indicó que todavía falta coordinar. El pedido sigue en Por coordinar.':confirm?'Solo Devolver guarda tu respuesta y avisa a la otra parte.':'Confirma si ya acordaron el pago y la entrega de este pedido por WhatsApp.';
return business?<BusinessCoordinationWaitingCard {...props} items={items} description={description}/>:<CustomerCoordinationCard {...props} items={items} description={description}/>;
}
