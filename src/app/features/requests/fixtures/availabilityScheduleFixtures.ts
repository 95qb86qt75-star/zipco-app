// Synthetic contract evidence only; never a real QA account or order.
import {simpleWaiting,simpleFree} from './simplifiedReservationFixtures';
import {normalizeRequestProcess,type RequestProcessSummary} from '../domain/requestProcess';
import {SCHEDULE_REVIEW_CONTRACT,type AvailabilityScheduleReview} from '../domain/availabilityScheduleReview';
export const scheduleRequestId='00000000-0000-4000-8000-000000000221';
export const requestedSchedule={mode:'SCHEDULED' as const,date:'2099-11-24',time:'14:00'};
export const scheduleRequest={scheduleRequestId,sourceProposalId:simpleWaiting.currentProposalId,sourceOfferId:simpleWaiting.availability!.availabilityConfirmationId,
  sourceTermsVersion:'a'.repeat(64),requestedSchedule,requestedFor:'2099-11-24T17:00:00.000Z',note:'Otra fecha por favor',requestedAt:'2026-11-21T20:00:00Z',requestedVersion:3};
export function scheduleProcess(phase:AvailabilityScheduleReview['phase']='EXPIRED_OFFER',business=false):RequestProcessSummary{
  const pending=phase==='AWAITING_BUSINESS',renewed=phase==='RENEWED_OFFER';
  const offer={...simpleFree,simplified:{...simpleFree.simplified,termsVersion:(renewed?'b':'a').repeat(64),hoursPolicy:'ADVISORY_ONLY' as const,opensAt:null,closesAt:null,holdMinutes:null,
    scheduledFor:renewed?scheduleRequest.requestedFor:'2026-11-20T13:10:00Z'}};
  const canRequest=!business&&!pending&&!renewed,canRenew=business&&pending;
  const raw={...simpleWaiting,serverNow:'2026-11-21T20:00:00Z',state:renewed?'AWAITING_CUSTOMER_DECISION':'AWAITING_CUSTOMER_CONTINUATION',version:renewed?4:pending?3:2,
    currentProposalId:renewed?124:simpleWaiting.currentProposalId,
    availability:{...simpleWaiting.availability!,...(renewed?{customerMessage:'Puedes retirar en esa fecha.',scheduleOrAddress:null}:{}),proposalId:renewed?124:simpleWaiting.currentProposalId,availabilityConfirmationId:renewed?32:simpleWaiting.availability!.availabilityConfirmationId,reservationOffer:offer},
    allowedActions:business?(canRenew?['RENEW_AVAILABILITY_SCHEDULE','WITHDRAW_AVAILABILITY']:renewed?[]:['WITHDRAW_AVAILABILITY']):
      (canRequest?['CONTINUE_REQUEST','DECLINE_REQUEST','REQUEST_AVAILABILITY_SCHEDULE']:pending?['DECLINE_REQUEST']:['ACCEPT_PROPOSAL','REJECT_PROPOSAL','COUNTER_PROPOSAL']),
    ...(renewed?{proposalSummary:{type:'BUSINESS_PROPOSAL',subjectSchemaVersion:2,totalPriceClp:2000,scheduledFor:scheduleRequest.requestedFor}}:{}),
    availabilityScheduleReview:{contract:SCHEDULE_REVIEW_CONTRACT,phase,request:pending||renewed?scheduleRequest:null,canRequest,canRenew,reservationAvailable:renewed,
      blockingReason:pending?'AVAILABILITY_SCHEDULE_REVIEW_PENDING':renewed?null:'RESERVATION_SCHEDULE_EXPIRED',categories:{customer:pending?'AWAITING_BUSINESS':'WAITING_RESPONSE',business:pending?'PENDING':'WAITING_RESPONSE'}}};
  const p=normalizeRequestProcess(raw);if(!p)throw Error('Invalid synthetic E221 process');return p;
}
