import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {normalizeBusinessOrdersPayload} from './orderNormalization';
import {coordinationProcess,rawOrder} from './requestProcessFixtures';
import {countStatusViews} from './requestStatusGrouping';
let api:typeof import('./statusChangePresentation'),identity:Map<string,string>;
const source=()=>normalizeBusinessOrdersPayload([{...rawOrder,status:'accepted',requestProcess:{...coordinationProcess,state:'COORDINATING',version:7}}])[0];
const advance=(state='IN_PROGRESS',version=8)=>{const s=source();return {...s,requestProcess:{...s.requestProcess!,state,version}};};
beforeEach(async()=>{vi.resetModules();vi.useFakeTimers();identity=new Map([['zipco-user-id','12'],['zipco-token','synthetic'],['zipco-business-id','1']]);vi.stubGlobal('localStorage',{getItem:(k:string)=>identity.get(k)??null});api=await import('./statusChangePresentation');});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
it('does nothing outside a matching requests page',()=>{expect(api.beginStatusChange(source(),true)).toBeNull();api.registerStatusPage({},false,'coordination',true);expect(api.beginStatusChange(source(),true)).toBeNull();});
it('keeps a visual source while counts use real updated records, then exits and offers Ver',()=>{api.registerStatusPage({},true,'coordination',true);const old=source(),fresh=advance(),c=api.beginStatusChange(old,true)!;expect(c.stage).toBe('saving');expect(api.completeStatusChange(c,fresh)).toBe(true);expect(api.projectStatusOrders([fresh],true)[0].requestProcess?.state).toBe('COORDINATING');expect(countStatusViews([fresh],'orders',true).active).toBe(1);vi.advanceTimersByTime(1499);expect(c.stage).toBe('success');vi.advanceTimersByTime(1);expect(c.stage).toBe('exiting');vi.advanceTimersByTime(500);expect(api.getStatusChange(old,true)).toBeUndefined();expect(api.getStatusNotice()).toMatchObject({view:'active',orderId:20});expect(api.projectStatusOrders([fresh],true)[0]).toBe(fresh);});
it('does not exit or invent a count change for an initial negative in the same category',()=>{api.registerStatusPage({},true,'coordination',true);const c=api.beginStatusChange(source(),true)!,fresh={...advance('COORDINATING'),requestProcess:{...advance('COORDINATING').requestProcess!,whatsappCoordinationInitialDecline:{contract:'whatsapp-coordination-initial-decline-v1' as const,id:3,declinedBy:'BUSINESS' as const,declinedAt:'2026-10-30T18:00:00Z',recordedVersion:8,active:true}}};api.completeStatusChange(c,fresh);vi.advanceTimersByTime(1500);expect(api.getStatusChange(source(),true)).toBeUndefined();expect(api.getStatusNotice()).toMatchObject({view:'coordination',title:'Sigue en Por coordinar'});expect(countStatusViews([fresh],'orders',true).coordination).toBe(1);});
it('rejects older reads and fails without a success notice',()=>{api.registerStatusPage({},true,'coordination',true);const old=source(),c=api.beginStatusChange(old,true)!;expect(api.completeStatusChange(c,advance('IN_PROGRESS',6))).toBe(false);expect(api.getStatusNotice()).toBeNull();expect(api.getStatusChange(old,true)).toBeUndefined();});
it('keeps the latest server destination if Ready arrives during presentation',()=>{api.registerStatusPage({},true,'coordination',true);const c=api.beginStatusChange(source(),true)!;api.completeStatusChange(c,advance());const ready={...advance('READY',9),status:'ready' as const};api.projectStatusOrders([ready],true);vi.advanceTimersByTime(2000);expect(api.getStatusNotice()).toMatchObject({view:'ready',title:'Pedido listo y notificado'});});
it('clears a visual operation on failure without changing records or retrying',()=>{api.registerStatusPage({},true,'coordination',true);const c=api.beginStatusChange(source(),true)!;api.failStatusChange(c);expect(api.projectStatusOrders([source()],true)).toHaveLength(1);expect(api.getStatusNotice()).toBeNull();});
it('does not retain a source after navigation or account change',()=>{const off=api.registerStatusPage({},true,'coordination',true),c=api.beginStatusChange(source(),true)!;api.completeStatusChange(c,advance());off();api.registerStatusPage({},true,'active',true);vi.advanceTimersByTime(2500);expect(api.getStatusNotice()).toBeNull();expect(api.projectStatusOrders([advance()],true)[0].requestProcess?.state).toBe('IN_PROGRESS');identity.set('zipco-token','other');expect(api.beginStatusChange(advance(),true)).toBeNull();});
it('does not duplicate a concurrent presentation for the same process',()=>{api.registerStatusPage({},true,'coordination',true);expect(api.beginStatusChange(source(),true)).not.toBeNull();expect(api.beginStatusChange(source(),true)).toBeNull();});
it('waits for existing holograms and pauses a visible notice until they end',async()=>{
 const gate=await import('./statusOverlay'),owner={};api.registerStatusPage({},true,'coordination',true);
 gate.setStatusOverlay(owner,true);const c=api.beginStatusChange(source(),true)!;api.completeStatusChange(c,advance());
 vi.advanceTimersByTime(6000);expect(c.stage).toBe('success');expect(api.getStatusNotice()).toBeNull();
 gate.setStatusOverlay(owner,false);vi.advanceTimersByTime(500);expect(api.getStatusNotice()?.orderId).toBe(20);
 gate.setStatusOverlay(owner,true);vi.advanceTimersByTime(10000);expect(api.getStatusNotice()).toBeNull();
 gate.setStatusOverlay(owner,false);expect(api.getStatusNotice()?.orderId).toBe(20);vi.advanceTimersByTime(4500);expect(api.getStatusNotice()).toBeNull();
});
it('queues simultaneous results without replacing the first order notice',()=>{
 api.registerStatusPage({},true,'coordination',true);const a=source(),b={...source(),id:21,requestProcess:{...source().requestProcess!,id:8}};
 api.completeStatusChange(api.beginStatusChange(a,true),advance());
 api.completeStatusChange(api.beginStatusChange(b,true),{...b,requestProcess:{...b.requestProcess,state:'IN_PROGRESS',version:8}});
 vi.advanceTimersByTime(2000);expect(api.getStatusNotice()?.orderId).toBe(20);api.closeStatusNotice();expect(api.getStatusNotice()?.orderId).toBe(21);api.closeStatusNotice();expect(api.getStatusNotice()).toBeNull();
});
it('highlights only the explicit destination order in the same session and role',()=>{
 api.registerStatusPage({},true,'coordination',true);api.markStatusArrival(20,true);
 expect(api.isStatusArrival(source(),true)).toBe(true);expect(api.isStatusArrival(source(),false)).toBe(false);
 vi.advanceTimersByTime(2400);expect(api.isStatusArrival(source(),true)).toBe(false);
 api.markStatusArrival(20,true);identity.set('zipco-token','another');expect(api.isStatusArrival(source(),true)).toBe(false);
});
