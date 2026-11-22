import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {scheduleProcess,scheduleRequest,requestedSchedule} from '../fixtures/availabilityScheduleFixtures';
import {normalizeRequestProcess} from './requestProcess';
import {rememberScheduleReviewCapability,knownScheduleReviewHeaders,SCHEDULE_REVIEW_CONTRACT,validRequestedSchedule} from './availabilityScheduleReview';
import {statusViewFor,countStatusViews} from './requestStatusGrouping';
beforeEach(()=>{vi.stubGlobal('localStorage',{getItem:()=> 'e221-contract-test'});rememberScheduleReviewCapability('e221-contract-test',{availabilityScheduleReview:{contract:SCHEDULE_REVIEW_CONTRACT,enabled:true}});});
afterEach(()=>vi.unstubAllGlobals());
it.each(['EXPIRED_OFFER','AWAITING_BUSINESS','RENEWED_OFFER'] as const)('normalizes the opt-in phase %s for both participants',phase=>{
  for(const business of [false,true])expect(scheduleProcess(phase,business).availabilityScheduleReview?.phase).toBe(phase);
});
it('uses server categories consistently for lists and counters',()=>{
  const p=scheduleProcess('AWAITING_BUSINESS');
  expect(statusViewFor('orders','pending',p,false,false)).toBe('awaiting-business');
  expect(statusViewFor('orders','pending',p,false,true)).toBe('pending');
  expect(countStatusViews([{status:'pending',requestProcess:p}],'orders').waiting).toBe(0);
  expect(countStatusViews([{status:'pending',requestProcess:p}],'orders',true).pending).toBe(1);
  expect(statusViewFor('orders','alternative_proposed',scheduleProcess('RENEWED_OFFER'))).toBe('waiting');
});
it('does not activate the new UI or grouping for an unnegotiated session',()=>{
  rememberScheduleReviewCapability('e221-contract-test',{});
  expect(knownScheduleReviewHeaders('e221-contract-test')).toEqual({});
  expect(statusViewFor('orders','pending',scheduleProcess('AWAITING_BUSINESS'))).toBe('waiting');
  expect(knownScheduleReviewHeaders('another-session')).toEqual({});
});
it.each([{phase:'OTHER'},{categories:{customer:'HISTORY',business:'PENDING'}},{canRenew:true},{reservationAvailable:true},{request:null}])('rejects inconsistent pending summaries %j',patch=>{
  const p=scheduleProcess('AWAITING_BUSINESS');expect(normalizeRequestProcess({...p,availabilityScheduleReview:{...p.availabilityScheduleReview,...patch}})).toBeNull();
});
it.each([{sourceOfferId:999},{sourceTermsVersion:'b'.repeat(64)},{requestedVersion:99},{requestedFor:'2099-11-24T18:00:00Z'},{scheduleRequestId:'bad'}])('rejects mismatched request provenance %j',patch=>{
  const p=scheduleProcess('AWAITING_BUSINESS');expect(normalizeRequestProcess({...p,availabilityScheduleReview:{...p.availabilityScheduleReview,request:{...scheduleRequest,...patch}}})).toBeNull();
});
it('preserves legacy and fails closed on new actions without a summary',()=>{
  const p=scheduleProcess();expect(normalizeRequestProcess({...p,availabilityScheduleReview:undefined,allowedActions:['CONTINUE_REQUEST']})).not.toBeNull();
  expect(normalizeRequestProcess({...p,availabilityScheduleReview:undefined})).toBeNull();
  expect(normalizeRequestProcess({...p,flowContract:'AVAILABILITY_V2'})).toBeNull();
});
it('validates Chile civil dates, not the device timezone or free text',()=>{
  expect(validRequestedSchedule(requestedSchedule)).toBe(true);
  for(const s of [{...requestedSchedule,date:'2099-02-30'},{...requestedSchedule,time:'25:00'},{mode:'IMMEDIATE'},{...requestedSchedule,extra:1}])expect(validRequestedSchedule(s)).toBe(false);
});
