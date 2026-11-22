import {afterEach,it,expect,vi} from 'vitest';
import {scheduleProcess,requestedSchedule,scheduleRequestId} from '../fixtures/availabilityScheduleFixtures';
import {SCHEDULE_REVIEW_CONTRACT} from '../domain/availabilityScheduleReview';
import {sendAvailabilitySchedule,readAvailabilityScheduleResult,validScheduleIntent,readScheduleIntent,writeScheduleIntent,scheduleSlot,scheduleOrderStatus,type ScheduleIntent,type ScheduleRenewBody} from './availabilityScheduleApi';
const cap={availabilityScheduleReview:{contract:SCHEDULE_REVIEW_CONTRACT,enabled:true}};
const request=():ScheduleIntent=>({key:crypto.randomUUID(),processId:scheduleProcess().id,orderId:10,business:false,action:'REQUEST_AVAILABILITY_SCHEDULE',
  body:{expectedVersion:2,proposalId:123,availabilityConfirmationId:31,sourceTermsVersion:'a'.repeat(64),schedule:requestedSchedule,note:'Otra fecha por favor'}});
const renewal=():ScheduleIntent=>({key:crypto.randomUUID(),processId:scheduleProcess().id,orderId:10,business:true,action:'RENEW_AVAILABILITY_SCHEDULE',
  body:{expectedVersion:3,proposalId:123,availabilityConfirmationId:31,scheduleRequestId,decision:'CONFIRM_REQUESTED_SCHEDULE',fulfillment:{path:'LOCAL_PICKUP',customerMessage:'Puedes retirar en esa fecha.',allowCustomerWhatsapp:false,reservationOffer:{mode:'FREE',hoursPolicy:'ADVISORY_ONLY'}}}});
afterEach(()=>vi.unstubAllGlobals());
function mockFetch(result:unknown,status=200){const fn=vi.fn(async(url:string)=>new Response(JSON.stringify(url.endsWith('capabilities')?cap:result),{status:url.endsWith('capabilities')?200:status}));vi.stubGlobal('fetch',fn);return fn;}
it('posts the explicit request with negotiated headers and UUID, without accepting or reserving',async()=>{
  const i=request(),fetcher=mockFetch({orderId:10,orderStatus:'pending',requestProcess:scheduleProcess('AWAITING_BUSINESS')});
  expect((await sendAvailabilitySchedule(i,scheduleProcess(),crypto.randomUUID(),new AbortController().signal)).requestProcess.state).toBe('AWAITING_CUSTOMER_CONTINUATION');
  const [url,init]=fetcher.mock.calls.find(c=>c[0].includes('/actions/'))! as unknown as [string,RequestInit];
  expect(url).toContain('/actions/request-availability-schedule');expect(JSON.parse(init.body as string)).toEqual(i.body);
  expect(init.headers).toMatchObject({'X-Availability-Schedule-Contract':SCHEDULE_REVIEW_CONTRACT,'Idempotency-Key':i.key,'X-Service-Hours-Contract':'service-hours-advisory-v1'});
  expect(i.body).not.toHaveProperty('reservationChoice');
});
it('renews only with explicit conditions and receives a new proposal before acceptance',async()=>{
  const i=renewal();mockFetch({orderId:10,orderStatus:'alternative_proposed',requestProcess:scheduleProcess('RENEWED_OFFER',true)});
  const r=await sendAvailabilitySchedule(i,scheduleProcess('AWAITING_BUSINESS',true),crypto.randomUUID(),new AbortController().signal);
  expect(r.requestProcess.currentProposalId).not.toBe(i.body.proposalId);expect(r.requestProcess.reservation).toBeUndefined();
});
it('rejects a renewal missing explicit mode/amount/contact, or a disguised date override',()=>{
  const i=renewal(),b=i.body as ScheduleRenewBody;
  expect(validScheduleIntent({...i,body:{...b,schedule:requestedSchedule}})).toBe(false);
  expect(validScheduleIntent({...i,body:{...b,fulfillment:{...b.fulfillment,reservationOffer:{mode:'PREPAYMENT'}}}})).toBe(false);
  expect(validScheduleIntent({...i,body:{...b,decision:'PROPOSE_OTHER_SCHEDULE'}})).toBe(false);
  expect(validScheduleIntent({...i,body:{...b,decision:'PROPOSE_OTHER_SCHEDULE',schedule:requestedSchedule}})).toBe(true);
});
it('recovers the original receipt while returning the newer current state, without a POST',async()=>{
  const i=request(),current=scheduleProcess('RENEWED_OFFER');
  const f=mockFetch({recorded:true,result:{orderId:10,orderStatus:'pending',requestProcess:scheduleProcess('AWAITING_BUSINESS')},currentVersion:4,currentRequestProcess:current});
  const r=await readAvailabilityScheduleResult(i,crypto.randomUUID(),new AbortController().signal);
  expect(r.recorded&&r.requestProcess.currentProposalId).toBe(124);
  expect(f.mock.calls.find(c=>c[0].endsWith('availability-schedule-result'))?.[1]).toMatchObject({method:'GET',headers:{'Idempotency-Key':i.key}});
});
it('treats only ACTION_RESULT_NOT_FOUND as an uncertain missing receipt',async()=>{
  mockFetch({code:'ACTION_RESULT_NOT_FOUND'},404);expect(await readAvailabilityScheduleResult(request(),crypto.randomUUID(),new AbortController().signal)).toEqual({recorded:false});
  mockFetch({code:'NOT_FOUND'},404);await expect(readAvailabilityScheduleResult(request(),crypto.randomUUID(),new AbortController().signal)).rejects.toThrow();
});
it('recovers a saved request after closure and uses the current history status',async()=>{
  const current={...scheduleProcess('RENEWED_OFFER'),state:'CLOSED',version:5,allowedActions:[],availabilityScheduleReview:undefined,
    closure:{reasonCode:'CUSTOMER_REJECTED_PROPOSAL',reasonDetail:null,actor:'CUSTOMER',actorUserId:1,closedAt:'2026-11-21T21:00:00Z'}};
  mockFetch({recorded:true,result:{orderId:10,orderStatus:'pending',requestProcess:scheduleProcess('AWAITING_BUSINESS')},currentVersion:5,currentRequestProcess:current});
  const r=await readAvailabilityScheduleResult(request(),crypto.randomUUID(),new AbortController().signal);
  expect(r.recorded&&scheduleOrderStatus(r.requestProcess)).toBe('rejected');
});
it('rejects an unrelated receipt or old state instead of showing success',async()=>{
  mockFetch({orderId:99,orderStatus:'pending',requestProcess:scheduleProcess('AWAITING_BUSINESS')});
  await expect(sendAvailabilitySchedule(request(),scheduleProcess(),crypto.randomUUID(),new AbortController().signal)).rejects.toThrow('verificar');
});
it('verifies the explicit renewed amount and refuses a different offer in a success response',async()=>{
  const i=renewal(),body=i.body as ScheduleRenewBody;
  body.fulfillment={path:'LOCAL_PICKUP',customerMessage:'Puedes retirar en esa fecha.',allowCustomerWhatsapp:true,businessContactConsent:{accepted:true,textVersion:'availability-business-whatsapp-v1'},reservationOffer:{mode:'PREPAYMENT',requiredAmountClp:3000,hoursPolicy:'ADVISORY_ONLY'}};
  const p=scheduleProcess('RENEWED_OFFER',true);p.availability={...p.availability!,allowCustomerWhatsapp:true,reservationOffer:{...p.availability!.reservationOffer!,mode:'PREPAYMENT',requiredAmountClp:3000,paymentKind:'DEPOSIT'}};
  mockFetch({orderId:10,orderStatus:'alternative_proposed',requestProcess:p});
  expect((await sendAvailabilitySchedule(i,scheduleProcess('AWAITING_BUSINESS',true),crypto.randomUUID(),new AbortController().signal)).requestProcess.reservation).toBeUndefined();
  p.availability.reservationOffer={...p.availability.reservationOffer,mode:'PREPAYMENT',requiredAmountClp:2500,paymentKind:'DEPOSIT'};
  mockFetch({orderId:10,orderStatus:'alternative_proposed',requestProcess:p});
  await expect(sendAvailabilitySchedule(i,scheduleProcess('AWAITING_BUSINESS',true),crypto.randomUUID(),new AbortController().signal)).rejects.toThrow('condiciones nuevas');
});
it('fails closed when the capability is absent and sends no action',async()=>{
  const f=vi.fn(async()=>new Response('{}'));vi.stubGlobal('fetch',f);
  await expect(sendAvailabilitySchedule(request(),scheduleProcess(),crypto.randomUUID(),new AbortController().signal)).rejects.toThrow('sesión');
  expect(f.mock.calls.some(c=>String(c[0]).includes('/actions/'))).toBe(false);
});
it('keeps a server failure uncertain with copy about the request, never a false acceptance',async()=>{
  mockFetch({code:'TEMPORARY_FAILURE'},503);
  await expect(sendAvailabilitySchedule(request(),scheduleProcess(),crypto.randomUUID(),new AbortController().signal)).rejects.toMatchObject({status:503,message:'No pudimos confirmar el envío. Comprueba su estado antes de reintentar.'});
});
it('persists the exact UUID/body per participant and fails before sending if storage is unavailable',()=>{
  const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v)};
  const i=request(),slot=scheduleSlot('one',i.processId,false);writeScheduleIntent(storage,slot,i);
  expect(readScheduleIntent(storage,slot)).toEqual(i);expect(readScheduleIntent(storage,scheduleSlot('two',i.processId,false))).toBeNull();
  expect(()=>writeScheduleIntent({...storage,setItem:()=>{throw Error('Storage unavailable');}},slot,i)).toThrow();
  map.set(slot,'{}');expect(()=>readScheduleIntent(storage,slot)).toThrow('anterior');
});
