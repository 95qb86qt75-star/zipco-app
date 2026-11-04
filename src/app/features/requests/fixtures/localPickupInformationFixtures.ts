import {reservationWaiting} from './reservationFixtures';
import {availabilityAccepted,availabilityRawOrder} from './availabilityFixtures';
import {LOCAL_PICKUP_INFORMATION_CONTRACT as contract} from '../domain/localPickupInformation';
import type {RequestProcessSummary} from '../domain/requestProcess';
export const informationWaiting:RequestProcessSummary={...reservationWaiting,availability:{...reservationWaiting.availability!,reservationOffer:{mode:'NONE'}},localPickupInformation:{contract,status:'AWAITING_CUSTOMER_DECISION',availabilityConfirmationId:31,informedAt:'2026-11-04T04:00:00.000Z',acknowledgementId:null,acknowledgedAt:null},allowedActions:['CONTINUE_REQUEST','DECLINE_REQUEST']};
export const informationActive:RequestProcessSummary={...informationWaiting,state:'IN_PROGRESS',version:4,agreementPublicId:availabilityAccepted.agreementPublicId,reservationChoice:{offerId:31,choice:'NONE'},localPickupInformation:{...informationWaiting.localPickupInformation!,status:'AWAITING_CUSTOMER_ACK'},allowedActions:['ACK_LOCAL_PICKUP_INFORMATION']};
export const informationAcknowledged:RequestProcessSummary={...informationActive,version:5,localPickupInformation:{...informationActive.localPickupInformation!,status:'ACKNOWLEDGED',acknowledgementId:901,acknowledgedAt:'2026-11-04T04:05:00.000Z'},allowedActions:[]};
export const informationRaw={...availabilityRawOrder,status:'accepted',total:12000,requestProcess:informationActive};
