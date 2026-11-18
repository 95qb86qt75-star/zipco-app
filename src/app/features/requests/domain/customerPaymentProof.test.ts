import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {simplePaidPending} from '../fixtures/simplifiedReservationFixtures';
import {normalizeRequestProcess,type RequestProcessSummary} from './requestProcess';
import {normalizeCustomerPaymentProof,rememberPaymentProofCapability,PAYMENT_PROOF_CONTRACT} from './customerPaymentProof';
import {statusViewFor,countStatusViews} from './requestStatusGrouping';
import {sendPaymentProof,readPaymentProofResult,type PaymentProofIntent} from '../api/customerPaymentProofApi';
import {readProofIntent,writeProofIntent,proofSlot} from '../application/intents/paymentProofIntent';

const cap={customerPaymentProof:{contract:PAYMENT_PROOF_CONTRACT,enabled:true}};
const projection=(declared=false)=>({contract:PAYMENT_PROOF_CONTRACT,reservationId:801,
  declaration:declared?{eventId:991,actor:'CUSTOMER',declaredAt:'2026-11-18T12:00:00Z',declaredVersion:5}:null,
  canDeclare:!declared,blockingReason:declared?'PAYMENT_PROOF_ALREADY_DECLARED':null,
  categories:{customer:declared?'AWAITING_BUSINESS':'WAITING_RESPONSE',business:'WAITING_RESPONSE'}});
function process(declared=false):RequestProcessSummary{
  const version=declared?5:4;
  return normalizeRequestProcess({...simplePaidPending,version,allowedActions:declared?[]:['DECLARE_PAYMENT_PROOF_SENT'],
    reservationFollowUp:{...simplePaidPending.reservationFollowUp,paymentConfirmationReminder:{eligible:true,reservationId:801,expectedVersion:version}},
    customerPaymentProof:projection(declared)})!;
}
const intent=():PaymentProofIntent=>({key:'00000000-0000-4000-8000-000000000001',processId:process().id,orderId:10,agreementPublicId:process().agreementPublicId!,body:{expectedVersion:4,reservationId:801,proofSentDeclared:true}});
beforeEach(()=>{vi.stubGlobal('localStorage',{getItem:()=> 'proof-test'});rememberPaymentProofCapability('proof-test',cap);});
afterEach(()=>vi.unstubAllGlobals());
it('normalizes the additive projection without changing legacy reservation fields',()=>{
  expect(process()).not.toBeNull();expect(process().customerPaymentProof?.canDeclare).toBe(true);
  expect(process(true).reservation).toEqual(process().reservation);
  expect(normalizeRequestProcess(simplePaidPending)).not.toBeNull();
});
it('rejects malformed recognized declarations, mismatched reservations and unauthorized action data',()=>{
  for(const patch of [{reservationId:3},{canDeclare:true,declaration:projection(true).declaration},{categories:{customer:'HISTORY',business:'WAITING_RESPONSE'}}]){
    expect(normalizeRequestProcess({...process(),customerPaymentProof:{...projection(),...patch}})).toBeNull();
  }
  expect(normalizeCustomerPaymentProof({...projection(),contract:'future'},4)).toBeUndefined();
  expect(normalizeCustomerPaymentProof({...projection(true),declaration:{...projection(true).declaration,declaredVersion:9}},5)).toBeNull();
});
it('uses a single role-aware grouping for lists and counters and preserves terminal categories',()=>{
  const before=process(),after=process(true);
  expect(statusViewFor('orders','accepted',before,false,false)).toBe('waiting');
  expect(statusViewFor('orders','accepted',after,false,false)).toBe('awaiting-business');
  expect(statusViewFor('orders','accepted',after,false,true)).toBe('waiting');
  expect(countStatusViews([{status:'accepted',requestProcess:after}],'orders')['awaiting-business']).toBe(1);
  expect(statusViewFor('orders','ready',{...after,state:'READY'},false,false)).toBe('ready');
  expect(statusViewFor('orders','completed',{...after,state:'COMPLETED'},false,false)).toBe('history');
  expect(statusViewFor('orders','accepted',{...after,customerPaymentProof:{...after.customerPaymentProof!,categories:{customer:'IN_PROGRESS',business:'IN_PROGRESS'}}},false,false)).toBe('active');
});
it('requires the current session capability and preserves old grouping without adoption',()=>{
  rememberPaymentProofCapability('other',cap);
  expect(statusViewFor('orders','accepted',process(true),false,false)).toBe('active');
});
it('stores only the original UUID and immutable command fields, with separate participant slots',()=>{
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  const slot=proofSlot('1',process().id);writeProofIntent(store,slot,intent());
  expect(readProofIntent(store,slot)).toEqual(intent());expect(readProofIntent(store,proofSlot('2',process().id))).toBeNull();
  data.set(slot,'{}');expect(()=>readProofIntent(store,slot)).toThrow();
  expect(()=>writeProofIntent({...store,setItem:()=>{}},'missing',intent())).toThrow();
});
it('posts only the exact declaration DTO with all negotiated headers and the original UUID',async()=>{
  const calls:{url:string;options:RequestInit}[]=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit={})=>{
    calls.push({url,options});return Response.json(url.includes('capabilities')?cap:{orderId:10,orderStatus:'accepted',requestProcess:process(true)});
  }));
  const result=await sendPaymentProof(intent(),process(),'proof-test',new AbortController().signal);
  const post=calls.find(c=>c.options.method==='POST')!;
  expect(post.url).toContain('/actions/declare-payment-proof-sent');expect(JSON.parse(String(post.options.body))).toEqual(intent().body);
  expect(post.options.headers).toMatchObject({'Idempotency-Key':intent().key,'X-Customer-Payment-Proof-Contract':PAYMENT_PROOF_CONTRACT,'X-Process-Contract':'availability-v3'});
  expect(result.requestProcess.customerPaymentProof?.declaration).not.toBeNull();
});
it('recovers the current later state instead of replaying the historical receipt',async()=>{
  const after=process(true),current={...after,state:'READY',version:6,customerPaymentProof:{...after.customerPaymentProof!,categories:null},reservationFollowUp:{...after.reservationFollowUp!,paymentConfirmationReminder:{eligible:true,reservationId:801,expectedVersion:6}}};
  const calls:RequestInit[]=[];
  vi.stubGlobal('fetch',vi.fn(async(_url:string,options:RequestInit={})=>{calls.push(options);return Response.json({recorded:true,result:{orderId:10,orderStatus:'accepted',requestProcess:after},currentVersion:6,currentRequestProcess:current});}));
  const result=await readPaymentProofResult(intent(),process(),'proof-test',new AbortController().signal);
  expect(result.requestProcess.state).toBe('READY');expect(calls.every(c=>c.method!=='POST')).toBe(true);
});
it('recorded false remains uncertain and malformed or cross-order receipts are rejected',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({recorded:false,currentVersion:4,currentRequestProcess:process()})));
  expect((await readPaymentProofResult(intent(),process(),'proof-test',new AbortController().signal)).recorded).toBe(false);
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({orderId:999,orderStatus:'accepted',requestProcess:process(true)})));
  await expect(sendPaymentProof(intent(),process(),'proof-test',new AbortController().signal)).rejects.toThrow();
});
