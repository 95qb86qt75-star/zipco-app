// Synthetic S2 contract fixtures, never real account/order data.
import {pendingProcess,agreementFixture,rawOrder} from './requestProcessFixtures';
import type {RequestProcessSummary} from './requestProcess';
import type {AvailabilityPlan} from './availabilityContract';
export const availabilityInitial:RequestProcessSummary={...pendingProcess,flowContract:'AVAILABILITY_V1',allowedActions:['CONFIRM_AVAILABILITY','REJECT_PENDING_REQUEST','PROPOSE_ALTERNATIVE']};
export const whatsappPlan:AvailabilityPlan={availabilityConfirmationId:31,proposalId:123,path:'WHATSAPP',customerMessage:null,scheduleOrAddress:null,allowCustomerWhatsapp:true,confirmedAt:'2026-10-25T05:00:00.000Z'};
export const pickupPlan:AvailabilityPlan={...whatsappPlan,path:'LOCAL_PICKUP',customerMessage:'Acércate al local a pagar y retirar.',scheduleOrAddress:'Hasta las 19:00',allowCustomerWhatsapp:false};
export const availabilityWaiting:RequestProcessSummary={...availabilityInitial,state:'AWAITING_CUSTOMER_CONTINUATION',version:2,availability:whatsappPlan,allowedActions:['CONTINUE_REQUEST','DECLINE_REQUEST']};
export const availabilityAccepted:RequestProcessSummary={...availabilityWaiting,state:'COORDINATION_PENDING',version:4,agreementPublicId:agreementFixture.agreementPublicId,allowedActions:[],coordination:{customerContactAuthorized:false,businessContactAuthorized:true}};
export const availabilityRawOrder={...rawOrder,businessName:'Negocio S2 de prueba',customerName:'Cliente S2 de prueba',requestProcess:availabilityInitial};
export const availabilityConversation={process:availabilityWaiting,proposals:[{id:123,sequence:0,type:'ORIGINAL_REQUEST',authorActor:'CUSTOMER',authorUserId:1,createdAt:'2026-10-25T04:00:00.000Z',subjectSchemaVersion:1,
  subjectSnapshot:agreementFixture.subjectSnapshot,totalPriceClp:2000,scheduledFor:agreementFixture.scheduledFor,reservationAmountClp:null,availability:whatsappPlan}]};
