import {afterEach,expect,it,vi} from 'vitest';
import {normalizeRequestProcess,orderNotificationState} from './requestProcess';
import {coordinationProcess} from './requestProcessFixtures';
import {coordinationAllowed,coordinationBody,sendCoordination} from './coordinationApi';
import {createCoordinationIntents} from './coordinationIntent';
import {readWhatsappCoordinationCapability} from './whatsappCoordinationCapability';
import {whatsappCoordinationNotice} from '../../notifications/whatsappCoordinationNotice';
import {canonicalPresentationKey,presentationKey} from '../../notifications/notificationDelivery';
const contract='whatsapp-coordination-v1' as const;
const pending={contract,confirmationId:123,initiatedBy:'CUSTOMER' as const,initiatedAt:'2026-10-29T18:00:00Z',status:'PENDING' as const,respondedBy:null,respondedAt:null};
const process={...coordinationProcess,state:'IN_PROGRESS',version:8,coordination:{customerContactAuthorized:true,businessContactAuthorized:true},whatsappCoordination:pending,allowedActions:['RESPOND_WHATSAPP_COORDINATION'] as const};
const reply=(decision:boolean)=>({...pending,status:decision?'CONFIRMED' as const:'DECLINED' as const,respondedBy:'BUSINESS' as const,respondedAt:'2026-10-29T18:01:00Z'});
const key='12345678-1234-4234-8234-123456789abc';
afterEach(()=>vi.unstubAllGlobals());
it('preserves legacy summaries without inventing a declaration',()=>{expect(normalizeRequestProcess(coordinationProcess)?.whatsappCoordination).toBeUndefined();});
it.each(['PENDING','CONFIRMED','DECLINED','EXPIRED'] as const)('reads authoritative %s including expired questions',status=>{const c=['PENDING','EXPIRED'].includes(status)?{...pending,status}:{...reply(status==='CONFIRMED'),status};expect(normalizeRequestProcess({...process,whatsappCoordination:c})?.whatsappCoordination).toEqual(c);});
it.each([{confirmationId:0},{contract:'invented'},{initiatedAt:'bad'},{status:'invented'},{respondedBy:'CUSTOMER'},{respondedAt:'2026-10-29T18:01:00Z'}])('fails closed on malformed bilateral data %j',patch=>{expect(normalizeRequestProcess({...process,whatsappCoordination:{...pending,...patch}})).toBeNull();});
it.each([false,true])('allows either first participant and restricts response to the counterpart (%s)',business=>{
 const p={...process,state:'COORDINATING',whatsappCoordination:undefined,allowedActions:['CONFIRM_WHATSAPP_COORDINATION'] as const};expect(coordinationAllowed(p,business,'CONFIRM_WHATSAPP_COORDINATION')).toBe(true);
 expect(coordinationAllowed({...p,allowedActions:[]},business,'CONFIRM_WHATSAPP_COORDINATION')).toBe(false);
 const incoming={...process,whatsappCoordination:{...pending,initiatedBy:business?'CUSTOMER' as const:'BUSINESS' as const}};
 expect(coordinationAllowed(incoming,business,'RESPOND_WHATSAPP_COORDINATION')).toBe(true);expect(coordinationAllowed(incoming,!business,'RESPOND_WHATSAPP_COORDINATION')).toBe(false);
 expect(coordinationAllowed({...incoming,state:'READY'},business,'RESPOND_WHATSAPP_COORDINATION')).toBe(false);
 expect(coordinationAllowed({...incoming,whatsappCoordination:{...incoming.whatsappCoordination,status:'EXPIRED'}},business,'RESPOND_WHATSAPP_COORDINATION')).toBe(false);
});
it('does not permit legacy START_WORK to bypass an existing declaration',()=>{expect(coordinationAllowed({...process,state:'COORDINATING',allowedActions:['START_WORK']},true,'START_WORK')).toBe(false);});
it.each([true,false])('sends exact decision %s with all contracts and validates its round',async decision=>{
 const result={orderId:20,orderStatus:'accepted',requestProcess:{...process,version:9,state:decision?'IN_PROGRESS':'COORDINATING',whatsappCoordination:reply(decision),allowedActions:[]}};
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));vi.stubGlobal('fetch',fetcher);
 const body=coordinationBody('RESPOND_WHATSAPP_COORDINATION',8,undefined,undefined,process,decision);
 expect(body).toEqual({expectedVersion:8,confirmationId:123,coordinationAccepted:decision});
 const actual=await sendCoordination(7,20,'RESPOND_WHATSAPP_COORDINATION',body,'synthetic',key,undefined,123,'AVAILABILITY_V3');
 expect(actual.result.requestProcess.whatsappCoordination?.status).toBe(decision?'CONFIRMED':'DECLINED');
 const [url,options]=fetcher.mock.calls[0];expect(url).toContain('/request-processes/7/actions/respond-whatsapp-coordination');expect(options.headers).toMatchObject({'Idempotency-Key':key,'X-Whatsapp-Coordination-Contract':contract,'X-Process-Contract':'availability-v3'});expect(JSON.parse(options.body)).toEqual(body);
});
it('sends first explicit declaration without a phone, role or invented status',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:{...process,allowedActions:[]}})));vi.stubGlobal('fetch',fetcher);
 const body=coordinationBody('CONFIRM_WHATSAPP_COORDINATION',7);
 expect(body).toEqual({expectedVersion:7,confirmationAccepted:true});
 await sendCoordination(7,20,'CONFIRM_WHATSAPP_COORDINATION',body,'synthetic',key);expect(fetcher.mock.calls[0][0]).toContain('/confirm-whatsapp-coordination');
});
it('rejects a receipt belonging to a different confirmation round',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:20,orderStatus:'accepted',requestProcess:{...process,version:9,whatsappCoordination:{...reply(true),confirmationId:124}}}))));
 await expect(sendCoordination(7,20,'RESPOND_WHATSAPP_COORDINATION',{expectedVersion:8,confirmationId:123,coordinationAccepted:true},'synthetic',key)).rejects.toThrow('comprobar');
});
it.each([undefined,{contract,enabled:false},{contract:'other',enabled:true},{contract,enabled:true}])('requires exact enabled capability (%j)',async value=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({whatsappCoordination:value}))));expect(await readWhatsappCoordinationCapability('synthetic')).toBe(value?.contract===contract&&value?.enabled===true);});
it('keeps an uncertain No and recovers the original key/body without sending automatically',async()=>{
 const saved=new Map<string,string>();const storage={getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>{saved.set(k,v);},removeItem:(k:string)=>{saved.delete(k);}};
 const first=createCoordinationIntents(()=>key,storage),body=coordinationBody('RESPOND_WHATSAPP_COORDINATION',8,undefined,undefined,process,false),sender=vi.fn().mockRejectedValue(Error('network'));
 await expect(first.run('actor',7,'RESPOND_WHATSAPP_COORDINATION',body,sender)).rejects.toThrow('network');
 const restored=createCoordinationIntents(()=>{throw Error('new key forbidden');},storage);expect(restored.read('actor',7)).toEqual({action:'RESPOND_WHATSAPP_COORDINATION',body,key});expect(restored.needsReconciliation('actor',7)).toBe(true);expect(sender).toHaveBeenCalledOnce();
 restored.allowReconciledRetry('actor',7);const retry=vi.fn(async intent=>intent);expect(await restored.run('actor',7,'RESPOND_WHATSAPP_COORDINATION',body,retry,true)).toEqual({action:'RESPOND_WHATSAPP_COORDINATION',body,key});expect(restored.read('actor',7)).toBeNull();
});
it.each(['confirmed','accepted','declined'])('recognizes new %s event identity only for the concrete order',kind=>{
 const event='requests-customer:order-20-coordination-coordination-'+kind+'-9';expect(canonicalPresentationKey(event)).toBe(event);
 expect(presentationKey(event.split(':')[1],'/?open=requests-customer&orderId=20','https://zipco.test')).toBe(event);
 expect(presentationKey(event.split(':')[1],'/?open=requests-customer&orderId=21','https://zipco.test')).toBeNull();
});
it('notifies the other participant from GET and distinguishes Yes/No in the same state',()=>{
 const order={id:20,status:'accepted',requestProcess:normalizeRequestProcess(process)!};expect(whatsappCoordinationNotice(order,true)?.key).toBe('order-20-coordination-coordination-confirmed-8');expect(whatsappCoordinationNotice(order,false)).toBeNull();
 const accepted={...order,requestProcess:{...order.requestProcess,version:9,whatsappCoordination:reply(true)}};expect(orderNotificationState(accepted)).not.toBe(orderNotificationState(order));expect(whatsappCoordinationNotice(accepted,false)?.notice[0]).toBe('Coordinación confirmada');
 expect(whatsappCoordinationNotice({...accepted,requestProcess:{...accepted.requestProcess,state:'READY'}},false)).toBeNull();
});
