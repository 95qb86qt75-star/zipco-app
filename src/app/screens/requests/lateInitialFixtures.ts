// Synthetic records only; no real users, requests or credentials.
import {simpleInitial} from './simplifiedReservationFixtures';
import type {RequestProcessSummary} from './requestProcess';
import type {LateInitialView} from './lateInitialContract';
export function lateProcess(status:LateInitialView['status']='OUT_OF_TIME',business=true):RequestProcessSummary{
  const out=status==='OUT_OF_TIME',still=status==='STILL_NEEDED',closing=['NO_LONGER_NEEDED','BUSINESS_UNAVAILABLE'].includes(status);
  return {...simpleInitial,state:closing?'CLOSED':'AWAITING_BUSINESS_RESPONSE',version:out?1:status==='AWAITING_CUSTOMER'?2:3,serverNow:'2026-10-26T21:42:00.000Z',
    lateInitialResponse:{contract:'late-initial-v1',status,scheduledFor:'2026-10-26T20:45:00.000Z',serverNow:'2026-10-26T21:42:00.000Z',delaySeconds:3420,queryId:out?null:42,askedAt:out?null:'2026-10-26T21:40:00.000Z',answeredAt:still||status==='NO_LONGER_NEEDED'?'2026-10-26T21:41:00.000Z':null,requiresNewSchedule:still},
    allowedActions:closing?[]:business?out?['ASK_LATE_REQUEST_NEED','CLOSE_LATE_REQUEST_UNAVAILABLE']:still?['CLOSE_LATE_REQUEST_UNAVAILABLE','PROPOSE_ALTERNATIVE']:['CLOSE_LATE_REQUEST_UNAVAILABLE']:status==='AWAITING_CUSTOMER'?['CONFIRM_LATE_REQUEST_NEED','DECLINE_LATE_REQUEST_NEED']:['CANCEL_PENDING_REQUEST'],
    ...(closing?{closure:status==='NO_LONGER_NEEDED'?{reasonCode:'CUSTOMER_CANCELLED_BEFORE_RESPONSE',reasonDetail:null,actor:'CUSTOMER',actorUserId:1,closedAt:'2026-10-26T21:42:00.000Z'}:{reasonCode:'cannot_meet_schedule',reasonDetail:null,actor:'BUSINESS',actorUserId:2,closedAt:'2026-10-26T21:42:00.000Z'}}:{}),
  };
}
