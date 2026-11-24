import {describe,it,expect,vi} from 'vitest';
import {availabilityAccepted,pickupPlan} from '../fixtures/availabilityFixtures';
import {normalizeRequestProcess} from './requestProcess';
import {statusViewFor,countStatusViews} from './requestStatusGrouping';
import {PICKUP_CLOSURE_CONTRACT,PICKUP_CHOICES,normalizePickupClosureOptions,canFinishPickup} from './customerPickupClosure';
import {pickupIntent,sendPickupClosure,readPickupClosure,validPickupIntent} from '../api/customerPickupClosureApi';
const base={...availabilityAccepted,state:'IN_PROGRESS',availability:pickupPlan,allowedActions:['FINISH_CUSTOMER_PICKUP'],customerPickupClosureOptions:{choices:PICKUP_CHOICES,receiptBlock:null}};
const summary=(choice='WILL_COLLECT')=>({contract:PICKUP_CLOSURE_CONTRACT,choice,scope:choice==='RECEIVED'?'REQUEST':'CUSTOMER_FOLLOW_UP',eventId:300,closedAt:'2026-11-23T15:00:00.000Z',customerCategory:'HISTORY'});
const closed=(choice='WILL_COLLECT')=>({...base,version:base.version+3,state:choice==='RECEIVED'?'COMPLETED':'IN_PROGRESS',allowedActions:[],customerPickupClosureOptions:undefined,customerPickupClosure:summary(choice),...(choice==='RECEIVED'?{customerReceipt:{contract:'customer-receipt-finalization-v2',status:'FINALIZED',declarationId:302,declaredAt:'2026-11-23T14:59:00.000Z',finalizedAt:'2026-11-23T15:00:00.000Z'}}:{})});
describe('E225 persisted participant closure',()=>{
 it('normalizes permitted local choices and rejects invented or contradictory projections',()=>{
  const p=normalizeRequestProcess(base)!;expect(p).not.toBeNull();expect(canFinishPickup(p)).toBe(true);
  expect(normalizeRequestProcess({...base,availability:{...pickupPlan,path:'WHATSAPP'}})).toBeNull();
  expect(normalizeRequestProcess({...base,customerPickupClosureOptions:{choices:['GOING'],receiptBlock:null}})).toBeNull();
  expect(normalizeRequestProcess({...closed(),customerPickupClosure:summary('RECEIVED')})).toBeNull();
 });
 it.each(['WILL_COLLECT','ACKNOWLEDGED'])('groups %s in history only for customer, even after ready',choice=>{
  for(const state of ['IN_PROGRESS','READY']){
   const p=normalizeRequestProcess({...closed(choice),state})!;expect(p).not.toBeNull();
   expect(statusViewFor('orders',state==='READY'?'ready':'accepted',p,false,false)).toBe('history');
   expect(statusViewFor('orders',state==='READY'?'ready':'accepted',p,false,true)).toBe(state==='READY'?'ready':'active');
   expect(countStatusViews([{status:'accepted',requestProcess:p}],'orders').history).toBe(1);
  }
 });
 it('groups atomic received completion for both participants',()=>{const p=normalizeRequestProcess(closed('RECEIVED'))!;expect(p).not.toBeNull();for(const business of [false,true])expect(statusViewFor('orders','completed',p,false,business)).toBe('history');});
 it('retains receipt block without disabling unrelated choices',()=>{
  const options=normalizePickupClosureOptions({choices:PICKUP_CHOICES,receiptBlock:{code:'CUSTOMER_RECEIPT_RESERVATION_BLOCKED',cause:'RESERVATION_CLARIFICATION_REQUIRED',reservationId:17,target:'RESERVATION_DETAILS'}})!;
  expect(options.choices).toEqual(PICKUP_CHOICES);expect(options.receiptBlock?.reservationId).toBe(17);
  expect(normalizePickupClosureOptions({...options,choices:['RECEIVED','RECEIVED']})).toBeNull();
 });
 let seq=0;
 it.each(PICKUP_CHOICES)('sends one exact atomic %s command, then recovers the original UUID with authoritative current',async choice=>{
  const token='e225-'+(++seq),result=closed(choice),current={...result,version:result.version+4};
  const fetcher=vi.fn(async(url:string,init?:RequestInit)=>new Response(JSON.stringify(url.endsWith('/request-process-capabilities')?{customerPickupClosure:{contract:PICKUP_CLOSURE_CONTRACT,enabled:true}}:url.endsWith('/customer-pickup-result')?{recorded:true,result:{orderId:20,orderStatus:choice==='RECEIVED'?'completed':'accepted',requestProcess:result},current}:{orderId:20,orderStatus:choice==='RECEIVED'?'completed':'accepted',requestProcess:result}),{status:200}));
  vi.stubGlobal('fetch',fetcher);
  const intent=await pickupIntent(normalizeRequestProcess(base)!,20,choice,token);expect(validPickupIntent(intent)).toBe(true);
  const signal=new AbortController().signal;const saved=await sendPickupClosure(intent,token,signal);expect(saved.version).toBe(result.version);
  const recovered=await readPickupClosure(intent,token,signal);expect(recovered.recorded).toBe(true);expect(recovered.requestProcess.version).toBe(current.version);
  const post=fetcher.mock.calls.filter(([,i])=>i?.method==='POST');expect(post).toHaveLength(1);
  expect(JSON.parse(post[0][1]!.body as string)).toEqual({expectedVersion:base.version,confirmationAccepted:true,choice});
  expect((post[0][1]!.headers as Record<string,string>)['Idempotency-Key']).toBe(intent.key);
  const get=fetcher.mock.calls.find(([url])=>url.endsWith('/customer-pickup-result'))!;
  expect((get[1]!.headers as Record<string,string>)['Idempotency-Key']).toBe(intent.key);
  expect(get[1]!.body).toBeUndefined();vi.unstubAllGlobals();
 });
 it('does not treat recorded:false as success or accept extra intention fields',async()=>{
  const token='e225-'+(++seq);vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.endsWith('/request-process-capabilities')?{customerPickupClosure:{contract:PICKUP_CLOSURE_CONTRACT,enabled:true}}:{recorded:false,current:base}),{status:200})));
  const intent=await pickupIntent(normalizeRequestProcess(base)!,20,'ACKNOWLEDGED',token);
  expect((await readPickupClosure(intent,token,new AbortController().signal)).recorded).toBe(false);
  expect(validPickupIntent({...intent,body:{...intent.body,reason:'invented'}})).toBe(false);vi.unstubAllGlobals();
 });
 it('does not activate without the session capability',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('{}')));await expect(pickupIntent(normalizeRequestProcess(base)!,20,'RECEIVED','disabled-session')).rejects.toThrow('no está disponible');vi.unstubAllGlobals();});
 it('distinguishes an explicitly rejected POST from a failed result lookup',async()=>{
  const token='e225-rejection';vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(JSON.stringify(url.endsWith('/request-process-capabilities')?{customerPickupClosure:{contract:PICKUP_CLOSURE_CONTRACT,enabled:true}}:{code:'STALE_VERSION'}),{status:url.endsWith('/request-process-capabilities')?200:409})));
  const intent=await pickupIntent(normalizeRequestProcess(base)!,20,'ACKNOWLEDGED',token),signal=new AbortController().signal;
  await expect(sendPickupClosure(intent,token,signal)).rejects.toMatchObject({pickupRejected:true});
  try{await readPickupClosure(intent,token,signal);throw Error('expected rejection');}catch(e){expect((e as {pickupRejected?:boolean}).pickupRejected).toBeUndefined();}
  vi.unstubAllGlobals();
 });
});
