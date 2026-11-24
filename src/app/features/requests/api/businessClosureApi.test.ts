import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {closureBody,verifyClosureReceipt,sendBusinessClosure,readBusinessClosureResult,type ClosureIntent} from './businessClosureApi';
import {declaredClosure} from '../fixtures/businessClosureFixtures';
import {coordinationProcess} from '../fixtures/requestProcessFixtures';
import {readClosureIntent,writeClosureIntent,confirmClosureIntent} from '../application/intents/businessClosureIntent';
const key='00000000-0000-4000-8000-000000000001';
const p={...coordinationProcess,state:'IN_PROGRESS'};
const intent:ClosureIntent={key,processId:7,orderId:20,agreementPublicId:p.agreementPublicId!,action:'BUSINESS_DECLARE_DELIVERY',body:{expectedVersion:2,deliveryDeclared:true}};
const result={orderId:20,orderStatus:'ready',requestProcess:{...p,state:'READY',version:3,businessClosure:declaredClosure}};
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status});
let calls:Array<{url:string;options:RequestInit}>=[];
beforeEach(()=>{calls=[];vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit={})=>{
 calls.push({url,options});if(url.includes('capabilities'))return json({businessOrderClosure:{contract:'business-order-closure-v1',enabled:true}});
 return url.includes('business-closure-result')?json({recorded:true,result,currentVersion:5}):json(result);
}));});
afterEach(()=>vi.unstubAllGlobals());
describe('business closure transport and durable intention',()=>{
 it('sends exact delivery payload with original idempotency key and negotiated header',async()=>{
  const receipt=await sendBusinessClosure(intent,p,'token-closure-api');expect(receipt.requestProcess.businessClosure?.status).toBe('DELIVERY_DECLARED');
  const call=calls.find(c=>c.options.method==='POST')!;
  expect(call.url).toMatch(/\/actions\/declare-delivery$/);expect(JSON.parse(call.options.body as string)).toEqual({expectedVersion:2,deliveryDeclared:true});
  expect(call.options.headers).toMatchObject({'X-Business-Order-Closure-Contract':'business-order-closure-v1','Idempotency-Key':key});
 });
 it('recovers by dedicated GET even if currentVersion is later than the receipt',async()=>{
  expect(await readBusinessClosureResult(intent,p,'token-closure-api')).toBeTruthy();
  const call=calls.find(c=>c.url.includes('business-closure-result'))!;expect(call.url).not.toContain(key);expect(call.options.headers).toMatchObject({'Idempotency-Key':key});
 });
 it('recorded false is not a confirmed failure',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>json({recorded:false,currentVersion:2})));
  expect(await readBusinessClosureResult(intent,p,'token-closure-api')).toBeNull();
 });
 it('validates exact reasons and omits detail for other codes',()=>{
  expect(closureBody('BUSINESS_CLOSE_WITHOUT_DELIVERY',2,'CUSTOMER_DID_NOT_COLLECT','unused')).toEqual({expectedVersion:2,closureConfirmed:true,reasonCode:'CUSTOMER_DID_NOT_COLLECT'});
  expect(()=>closureBody('BUSINESS_CLOSE_WITHOUT_DELIVERY',2,'OTHER','hi')).toThrow();
  expect(closureBody('BUSINESS_CLOSE_WITHOUT_DELIVERY',2,'OTHER','  Una razón  ')).toMatchObject({reasonDetail:'Una razón'});
 });
 it.each([{orderId:999},{orderStatus:'accepted'},{requestProcess:{...result.requestProcess,id:8}},{requestProcess:{...result.requestProcess,version:4}},{requestProcess:{...result.requestProcess,agreementPublicId:'other'}}])('rejects mismatching success %o',patch=>expect(()=>verifyClosureReceipt({...result,...patch},intent)).toThrow());
 it('exposes a typed reservation block instead of invoking payment confirmation',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>json({code:'BUSINESS_DELIVERY_RESERVATION_BLOCKED',cause:'RESERVATION_CONFIRMATION_REQUIRED',reservationId:123,target:'RESERVATION_DETAILS'},409)));
  await expect(sendBusinessClosure(intent,p,'token-closure-api')).rejects.toMatchObject({block:{reservationId:123,target:'RESERVATION_DETAILS'}});
 });
 it('persists exactly the original body and key; a confirmed tombstone survives failed cleanup',()=>{
  const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:()=>{throw Error('blocked');}} as unknown as Storage;
  writeClosureIntent(storage,'slot',intent);expect(readClosureIntent(storage,'slot')).toEqual(intent);
  expect(()=>confirmClosureIntent(storage,'slot',intent)).toThrow();expect(readClosureIntent(storage,'slot')?.confirmed).toBe(true);
 });
});
