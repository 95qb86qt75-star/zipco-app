import {describe,it,expect,vi,afterEach} from 'vitest';
import {normalizeRequestProcess} from './requestProcess';
import {statusViewFor,countStatusViews} from './requestStatusGrouping';
import {informationWaiting,informationActive,informationAcknowledged} from '../fixtures/localPickupInformationFixtures';
import {availabilityWaiting,pickupPlan} from '../fixtures/availabilityFixtures';
import {simpleReserved,simplePaidPending} from '../fixtures/simplifiedReservationFixtures';
import {coordinationAllowed,coordinationBody,sendCoordination} from '../api/coordinationApi';
import {availabilityAllowed} from '../api/availabilityApi';
import {participantHeaders,knownParticipantHeaders} from '../api/participantContractHeaders';
import {createCoordinationIntents} from '../application/intents/coordinationIntent';
import {LOCAL_PICKUP_INFORMATION_CONTRACT as contract} from './localPickupInformation';
const key='123e4567-e89b-42d3-a456-426614174000',action='ACK_LOCAL_PICKUP_INFORMATION' as const;
afterEach(()=>vi.unstubAllGlobals());
describe('local pickup information negotiated contract',()=>{
 it.each([informationWaiting,informationActive,informationAcknowledged])('validates and groups $localPickupInformation.status separately by participant',p=>{
  expect(normalizeRequestProcess(p)).toEqual(p);
  expect(statusViewFor('orders','accepted',p,false,true)).toBe('history');
  expect(statusViewFor('orders','accepted',p,false,false)).toBe(p===informationWaiting?'waiting':p===informationActive?'active':'history');
  expect(countStatusViews([{status:'accepted',requestProcess:p}],'orders',true)).toMatchObject({history:1,active:0,waiting:0});
 });
 it.each(['state','plan','identity','date','ack','action','physical'])('rejects inconsistent %s without falling back to an ordinary order',kind=>{
  const p=structuredClone(informationActive);
  if(kind==='state')p.state='READY';if(kind==='plan')p.availability!.path='WHATSAPP';if(kind==='identity')p.localPickupInformation!.availabilityConfirmationId++;
  if(kind==='date')p.localPickupInformation!.informedAt='tomorrow';if(kind==='ack')p.localPickupInformation!.acknowledgedAt='2026-11-04T04:05:00.000Z';if(kind==='action')p.allowedActions.push('MARK_READY');if(kind==='physical')p.customerReceipt={contract:'customer-receipt-finalization-v2',status:'AWAITING_RECEIPT',declarationId:null,declaredAt:null,finalizedAt:null};
  expect(normalizeRequestProcess(p)).toBeNull();
 });
 it('does not infer information from legacy NONE, FREE without a chosen reservation, paid reservations or WhatsApp',()=>{
  const old={...informationActive,localPickupInformation:undefined,allowedActions:['MARK_READY' as const]};
  expect(normalizeRequestProcess(old)?.localPickupInformation).toBeUndefined();expect(statusViewFor('orders','accepted',old,false,true)).toBe('active');
  for(const p of [simpleReserved,simplePaidPending,availabilityWaiting])expect(normalizeRequestProcess(p)?.localPickupInformation).toBeUndefined();
 });
 it('offers the new action only to the participant customer while awaiting the acknowledgement',()=>{
  expect(coordinationAllowed(informationActive,false,action)).toBe(true);
  for(const p of [informationWaiting,informationAcknowledged,{...informationActive,allowedActions:[]}])expect(coordinationAllowed(p,false,action)).toBe(false);
  expect(coordinationAllowed(informationActive,true,action)).toBe(false);
  for(const forbidden of ['MARK_READY','DECLARE_PRODUCT_RECEIVED','FINALIZE_REQUEST'] as const)expect(coordinationAllowed({...informationActive,allowedActions:[forbidden]},true,forbidden)).toBe(false);
  expect(availabilityAllowed({...informationActive,allowedActions:['CANCEL_PICKUP']},false,'CANCEL_PICKUP')).toBe(false);
 });
 it('negotiates existing consultations even when creation is disabled and validates the exact acknowledgement receipt',async()=>{
  const token=crypto.randomUUID(),calls:Array<{url:string;init?:RequestInit}>=[];
  vi.stubGlobal('fetch',vi.fn(async(url,init)=>{calls.push({url:String(url),init});return new Response(JSON.stringify(String(url).endsWith('/request-process-capabilities')?{localPickupInformation:{contract,enabled:true,creationEnabled:false}}:{orderId:20,orderStatus:'accepted',requestProcess:informationAcknowledged}));}));
  expect(await participantHeaders(token,true)).toHaveProperty('X-Local-Pickup-Information-Contract',contract);
  expect(knownParticipantHeaders(token)).toHaveProperty('X-Local-Pickup-Information-Contract',contract);
  const body=coordinationBody(action,4);
  const result=await sendCoordination(7,20,action,body,token,key,undefined,123,informationActive.flowContract,informationActive);
  expect(result.result.requestProcess.localPickupInformation?.status).toBe('ACKNOWLEDGED');
  const post=calls.find(c=>c.init?.method==='POST')!;
  expect(post.url).toMatch(/ack-local-pickup-information$/);expect(JSON.parse(post.init!.body as string)).toEqual({expectedVersion:4,confirmationAccepted:true});
  expect(post.init!.headers).toMatchObject({'Idempotency-Key':key,'X-Local-Pickup-Information-Contract':contract});
 });
 it('rejects a successful HTTP response with a wrong consultation identity',async()=>{
  const token=crypto.randomUUID();vi.stubGlobal('fetch',vi.fn(async url=>new Response(JSON.stringify(String(url).endsWith('/request-process-capabilities')?{localPickupInformation:{contract,enabled:true,creationEnabled:false}}:{orderId:20,orderStatus:'accepted',requestProcess:{...informationAcknowledged,localPickupInformation:{...informationAcknowledged.localPickupInformation!,availabilityConfirmationId:99}}}))));
  await expect(sendCoordination(7,20,action,coordinationBody(action,4),token,key,undefined,123,informationActive.flowContract,informationActive)).rejects.toThrow('acuse');
 });
 it('persists the exact acknowledgement and UUID after an uncertain send; recovery never automatically resends',async()=>{
  const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}};
  const first=createCoordinationIntents(()=>key,storage),body=coordinationBody(action,4),send=vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce({ok:true});
  await expect(first.run('customer',7,action,body,send)).rejects.toThrow();
  const restored=createCoordinationIntents(()=>crypto.randomUUID(),storage);expect(restored.read('customer',7)).toEqual({action,body,key});expect(restored.needsReconciliation('customer',7)).toBe(true);expect(send).toHaveBeenCalledTimes(1);
  restored.allowReconciledRetry('customer',7);await restored.run('customer',7,action,body,send,true);
  expect(send.mock.calls[1][0].key).toBe(key);expect(data.size).toBe(0);
 });
});
