import {BUSINESS_CONTACT_VERSION,type FulfillmentChoice} from './availabilityContract';
import type {AvailabilityDesignChoice} from './availability-design/AvailabilityDesign';
export function fulfillmentFromChoice(choice:AvailabilityDesignChoice):FulfillmentChoice{
  const consent={accepted:true as const,textVersion:BUSINESS_CONTACT_VERSION};
  return choice.channel==='whatsapp'?{path:'WHATSAPP',businessContactConsent:consent}:{path:'LOCAL_PICKUP',
    customerMessage:choice.instructions.message,scheduleOrAddress:choice.instructions.scheduleOrAddress,
    allowCustomerWhatsapp:choice.instructions.allowsContact,...(choice.instructions.allowsContact?{businessContactConsent:consent}:{})};
}
