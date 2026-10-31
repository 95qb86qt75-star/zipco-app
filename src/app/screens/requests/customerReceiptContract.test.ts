import {afterEach,describe,it,expect,vi} from 'vitest';
import {CUSTOMER_RECEIPT_CONTRACT as contract,customerReceiptHeaders,normalizeCustomerReceipt} from './customerReceiptContract';
import {normalizeRequestProcess} from './requestProcess';
import {coordinationProcess} from './requestProcessFixtures';
import {coordinationAllowed,coordinationBody,sendCoordination} from './coordinationApi';
import {countStatusViews,statusViewFor} from './requestStatusGrouping';
import {createCoordinationIntents} from './coordinationIntent';
import {paidRequested,reservationRequested} from './reservationFixtures';
import {presentationKey} from '../../notifications/notificationDelivery';
const awaiting={contract,status:'AWAITING_RECEIPT',declarationId:null,declaredAt:null,finalizedAt:null};
const received={contract,status:'RECEIVED_PENDING_FINALIZATION',declarationId:321,declaredAt:'2026-10-31T15:00:00Z',finalizedAt:null};
const finalized={...received,status:'FINALIZED',finalizedAt:'2026-10-31T15:05:00Z'};
afterEach(()=>vi.unstubAllGlobals());
describe('receipt finalization v2',()=>{
 it.each([reservationRequested,paidRequested])('preserves existing reservation fields and fulfilled receipt grouping',base=>{
  const reservation={...base.reservation!,status:'FULFILLED',effectiveStatus:'FULFILLED',confirmedAt:'2026-10-25T20:00:00Z',confirmedByUserId:12,...(base.reservation?.mode==='PREPAYMENT'?{paymentReceiptDeclaration:{actorUserId:12,declaredAt:'2026-10-25T20:00:00Z',amountClp:1000}}:{})};
  const process=normalizeRequestProcess({...base,state:'READY',allowedActions:['FINALIZE_REQUEST'],customerReceipt:received,reservation});
  expect(process).not.toBeNull();expect(process?.reservation).toEqual(reservation);expect(statusViewFor('orders','ready',process)).toBe('active');expect(coordinationAllowed(process,false,'FINALIZE_REQUEST')).toBe(true);
 });
 it.each(['receipt-declared','request-finalized'])('recognizes a distinct contracted notice %s for the exact order',event=>{
  expect(presentationKey(`order-20-coordination-${event}-8`,'/?open=requests-business&orderId=20','https://zipco.test')).toBe(`requests-business:order-20-coordination-${event}-8`);
  expect(presentationKey(`order-20-coordination-${event}-8`,'/?open=requests-business&orderId=21','https://zipco.test')).toBeNull();
 });
 it.each([[awaiting,'READY'],[received,'READY'],[finalized,'COMPLETED']])('normalizes the actual receipt phase', (value,state)=>expect(normalizeCustomerReceipt(value,state as string)).toEqual(value));
 it.each([{...received,declarationId:0},{...received,declaredAt:null},{...received,finalizedAt:'2026-10-31T16:00:00Z'},{...awaiting,declarationId:1},{...finalized,finalizedAt:'2020-01-01T00:00:00Z'}])('fails closed for contradictory receipt fields',value=>expect(normalizeCustomerReceipt(value,value.status==='FINALIZED'?'COMPLETED':'READY')).toBeNull());
 it('keeps legacy completed requests without fabricated receipt dates',()=>expect(normalizeRequestProcess({...coordinationProcess,state:'COMPLETED'})).not.toHaveProperty('customerReceipt'));
 it('uses one grouping rule for counts and both roles',()=>{
  const process=normalizeRequestProcess({...coordinationProcess,state:'READY',customerReceipt:received})!;
  for(const business of [false,true]){expect(statusViewFor('orders','ready',process,false,business)).toBe('active');expect(countStatusViews([{status:'ready',requestProcess:process}],'orders',business)).toMatchObject({active:1,ready:0,history:0});}
  expect(statusViewFor('orders','completed',{...process,state:'COMPLETED',customerReceipt:normalizeCustomerReceipt(finalized,'COMPLETED')!})).toBe('history');
 });
 it('respects actor, phase and server permissions independently from ACK/contact',()=>{
  const process=normalizeRequestProcess({...coordinationProcess,state:'READY',readyNoticeAcknowledged:false,customerReceipt:awaiting,allowedActions:['DECLARE_PRODUCT_RECEIVED']})!;
  expect(coordinationAllowed(process,false,'DECLARE_PRODUCT_RECEIVED')).toBe(true);expect(coordinationAllowed(process,true,'DECLARE_PRODUCT_RECEIVED')).toBe(false);expect(coordinationAllowed({...process,allowedActions:[]},false,'DECLARE_PRODUCT_RECEIVED')).toBe(false);
  const pending={...process,customerReceipt:normalizeCustomerReceipt(received,'READY')!,allowedActions:['FINALIZE_REQUEST','ACK_READY_NOTICE','CONFIRM_RECEIPT','MARK_READY'] as typeof process.allowedActions};
  expect(coordinationAllowed(pending,false,'FINALIZE_REQUEST')).toBe(true);for(const action of ['ACK_READY_NOTICE','CONFIRM_RECEIPT','MARK_READY'] as const)expect(coordinationAllowed(pending,action==='MARK_READY',action)).toBe(false);
 });
 it.each(['DECLARE_PRODUCT_RECEIVED','FINALIZE_REQUEST'] as const)('sends exact contract/body for %s and validates the receipt',async action=>{
  const summary=action==='FINALIZE_REQUEST'?finalized:received;
  const fetcher=vi.fn(async(url:string)=>new Response(JSON.stringify(url.endsWith('capabilities')?{customerReceiptFinalization:{contract,enabled:true}}:{orderId:20,orderStatus:action==='FINALIZE_REQUEST'?'completed':'ready',requestProcess:{...coordinationProcess,state:action==='FINALIZE_REQUEST'?'COMPLETED':'READY',version:3,readyNoticeAcknowledged:false,customerReceipt:summary}})));
  vi.stubGlobal('fetch',fetcher);const token='receipt-'+action;
  const body=coordinationBody(action,2);expect(body).toEqual({expectedVersion:2,confirmationAccepted:true});
  const result=await sendCoordination(7,20,action,body,token,'18ce26bf-086c-4d47-9ad4-850c57ed9890');expect(result.result.requestProcess.customerReceipt).toEqual(summary);
  expect(fetcher.mock.calls.at(-1)![1]).toMatchObject({headers:{'X-Customer-Receipt-Contract':contract,'Idempotency-Key':'18ce26bf-086c-4d47-9ad4-850c57ed9890'},body:JSON.stringify(body)});
 });
 it.each([{}, {customerReceiptFinalization:{contract,enabled:false}}])('does not offer v2 when capability is unavailable',async payload=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(payload))));expect(await customerReceiptHeaders(crypto.randomUUID(),true)).toEqual({});});
 it('recovers the same stored intention and keeps separate UUIDs for the two steps',async()=>{
  const saved=new Map<string,string>(),storage={getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>{saved.set(key,value);},removeItem:(key:string)=>{saved.delete(key);}};
  const keys=['18ce26bf-086c-4d47-9ad4-850c57ed9890','18ce26bf-086c-4d47-9ad4-850c57ed9891'];let i=0;const store=createCoordinationIntents(()=>keys[i++],storage);
  await expect(store.run('customer',7,'DECLARE_PRODUCT_RECEIVED',coordinationBody('DECLARE_PRODUCT_RECEIVED',2),async()=>{throw Error('network');})).rejects.toThrow();
  const restored=createCoordinationIntents(()=>{throw Error('New UUID not allowed');},storage);const intent=restored.read('customer',7)!;expect(intent.key).toBe(keys[0]);expect(intent.action).toBe('DECLARE_PRODUCT_RECEIVED');
  restored.allowReconciledRetry('customer',7);await restored.run('customer',7,intent.action,intent.body,async retry=>{expect(retry).toEqual(intent);return true;},true);
  await store.run('other',7,'FINALIZE_REQUEST',coordinationBody('FINALIZE_REQUEST',3),async next=>{expect(next.key).toBe(keys[1]);return true;});
 });
});
