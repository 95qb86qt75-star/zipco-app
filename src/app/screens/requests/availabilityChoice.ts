import {BUSINESS_CONTACT_VERSION,type FulfillmentChoice,type AvailabilityPlan} from './availabilityContract';
import type {AvailabilityDesignChoice} from './availability-design/AvailabilityDesign';
import {isSimpleOffer,simpleOfferInput} from './simplifiedReservationContract';
export function fulfillmentFromChoice(choice:AvailabilityDesignChoice):FulfillmentChoice{
  const consent={accepted:true as const,textVersion:BUSINESS_CONTACT_VERSION};
  return choice.channel==='whatsapp'?{path:'WHATSAPP',businessContactConsent:consent}:{path:'LOCAL_PICKUP',
    customerMessage:choice.instructions.message,scheduleOrAddress:choice.instructions.scheduleOrAddress,
    allowCustomerWhatsapp:choice.instructions.allowsContact,...(choice.instructions.allowsContact?{businessContactConsent:consent}:{}),...(choice.instructions.reservationOffer?{reservationOffer:isSimpleOffer(choice.instructions.reservationOffer)?simpleOfferInput(choice.instructions.reservationOffer):choice.instructions.reservationOffer}:{})};
}
// A final proposal keeps the current immutable plan; confirmation records the
// business's own consent again when that same plan permits contact.
export function fulfillmentFromPlan(plan:AvailabilityPlan|undefined):FulfillmentChoice|undefined{
  if(!plan)return undefined;
  if(plan.path==='WHATSAPP')return fulfillmentFromChoice({channel:'whatsapp'});
  if(!plan.customerMessage)return undefined;
  return fulfillmentFromChoice({channel:'pickup',instructions:{message:plan.customerMessage,
    scheduleOrAddress:plan.scheduleOrAddress??'',allowsContact:plan.allowCustomerWhatsapp,...(plan.reservationOffer?{reservationOffer:plan.reservationOffer}:{})}});
}
