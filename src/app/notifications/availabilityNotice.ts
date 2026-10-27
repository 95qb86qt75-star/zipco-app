import {availabilityFlow} from '../screens/requests/availabilityContract';
import type {ProcessOrder} from '../screens/requests/requestProcess';
const positive=(v:number)=>Number.isInteger(v)&&v>0&&v<=2147483647;
export function availabilityNotice(order:{id:number}&ProcessOrder){
  const p=order.requestProcess,plan=p?.availability;
  // This state has no same-state mutation: confirm creates it; continuation,
  // decline and withdrawal leave it. Its version is the confirmation version.
  if(!p||!availabilityFlow(p)||p.state!=='AWAITING_CUSTOMER_CONTINUATION'||p.agreementPublicId||
    !plan||!['WHATSAPP','LOCAL_PICKUP'].includes(plan.path)||plan.proposalId!==p.currentProposalId||
    !positive(order.id)||!positive(p.id)||!positive(p.version)||!positive(plan.availabilityConfirmationId))return null;
  return {key:`order-${order.id}-availability-${p.version}`,
    notice:['El negocio confirmó disponibilidad','Revisa el camino propuesto y decide si continúas en ZIPCO.'] as const};
}
