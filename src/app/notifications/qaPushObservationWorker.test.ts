import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createQaPushObservationWorker } from './qaPushObservationWorker.js';
import { safeNotificationInventoryItem } from './qaNotificationInventory';

const build='a'.repeat(40),traceId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',receipt='r'.repeat(43),origin='https://zipco.test';
const url='/?open=requests-customer&orderId=91';
const block=()=>({contract:'qa-push-observation-v1',traceId,receiptToken:receipt,reportUrl:'https://zipco-backend-qa.up.railway.app/qa/push-observations/events',expiresAt:new Date(Date.now()+3600000).toISOString()});
let serial=0;
const crypto={randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`};
const create=(send=vi.fn(async()=>({status:200})))=>({send,remote:createQaPushObservationWorker({workerBuild:build,workerRevision:'notification-click-attempt-v11',fetch:send,crypto})});
afterEach(()=>vi.useRealTimers());

describe('QA-only receipt reporter',()=>{
  it.each([undefined,null,{}, {...block(),reportUrl:'https://other.test/qa/push-observations/events'}, {...block(),reportUrl:'https://zipco-backend-qa.up.railway.app/qa/push-observations/events?x=1'}, {...block(),receiptToken:'JWT'}, {...block(),expiresAt:'2020-01-01T00:00:00.000Z'}])('ignores absent/invalid block without network or business side effects',value=>{
    const {remote,send}=create(),event={};const ctx=remote.begin(event,value,'push');remote.report(event,ctx,'PUSH_RECEIVED');expect(ctx).toBeNull();expect(send).not.toHaveBeenCalled();
  });
  it('uses one attempt per execution, exact body/transport and no raw flags',async()=>{
    const {remote,send}=create(),event={};const ctx=remote.begin(event,block(),'push');
    remote.report(event,ctx,'PUSH_RECEIVED',{hasTarget:true,orderId:91,body:'private-copy',receiptToken:'private'});
    remote.report(event,ctx,'SYSTEM_SHOWN');remote.report(event,ctx,'SYSTEM_SHOWN');await remote.flush(event);
    expect(send).toHaveBeenCalledTimes(2);
    const [target,request]=send.mock.calls[0];
    expect(target).toBe(block().reportUrl);expect(request).toMatchObject({credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',headers:{Authorization:`Bearer ${receipt}`}});
    const rows=send.mock.calls.map(([,r])=>JSON.parse(r.body));
    expect(rows[0]).toEqual({traceId,attemptId:ctx.attemptId,stage:'PUSH_RECEIVED',workerBuild:build,workerRevision:'notification-click-attempt-v11',hasTarget:true});
    expect(rows[1].attemptId).toBe(rows[0].attemptId);expect(JSON.stringify(rows)).not.toMatch(/receiptToken|private-copy|orderId|body|reportUrl/);
    const next=remote.begin({},block(),'click');expect(next.attemptId).not.toBe(ctx.attemptId);
  });
  it.each([401,410,429,404,400,413])('stops further reports for a receipt after HTTP %s',async status=>{
    const {remote,send}=create(vi.fn(async()=>({status}))),event={},ctx=remote.begin(event,block(),'push');
    remote.report(event,ctx,'PUSH_RECEIVED');await remote.flush(event);remote.report(event,ctx,'SYSTEM_SHOWN');
    expect(remote.begin({},block(),'click')).toBeNull();expect(send).toHaveBeenCalledTimes(1);
  });
  it.each(['throw','timeout'])('bounds %s failures without retries or propagation',async mode=>{
    vi.useFakeTimers();const send=vi.fn(()=>mode==='throw'?Promise.reject(Error('private')):new Promise(()=>{}));
    const {remote}=create(send as any),event={},ctx=remote.begin(event,block(),'push');remote.report(event,ctx,'PUSH_RECEIVED');
    const finished=remote.flush(event);await vi.advanceTimersByTimeAsync(1501);await expect(finished).resolves.toBeUndefined();expect(send).toHaveBeenCalledTimes(1);
  });
  it('reports page ACKs only for a posted client and the exact trace/attempt pair',async()=>{
    const {remote,send}=create(),click={},ctx=remote.begin(click,block(),'click');remote.bind(ctx,url);
    const meta=remote.metadata(url,{id:'client-1'}).qaObservationAck;
    expect(meta).toEqual({traceId,attemptId:ctx.attemptId});expect(JSON.stringify(meta)).not.toContain(receipt);
    const fire=async(data:any,source={id:'client-1'})=>{const event={data,source};remote.acknowledge(event);await remote.flush(event);};
    await fire({...meta,stage:'CARD_FOCUSED'},{id:'other'});await fire({...meta,attemptId:crypto.randomUUID(),stage:'CARD_FOCUSED'});
    expect(send).not.toHaveBeenCalled();await fire({...meta,stage:'APP_TARGET_ACCEPTED'});await fire({...meta,stage:'CARD_FOCUSED'});await fire({...meta,stage:'CARD_FOCUSED'});
    expect(send.mock.calls.map(([,r])=>JSON.parse(r.body).stage)).toEqual(['APP_TARGET_ACCEPTED','CARD_FOCUSED']);
  });
});

function worker(remote:any,cacheFails=false,existing:any[]=[]){
  const listeners=new Map<string,(event:any)=>void>(),shown:any[]=[],posted:any[]=[],launches:any[]=[];
  const client={id:'client-1',url:origin+'/',postMessage:(data:any)=>posted.push(data),focus:async()=>client};
  const cache={match:async()=>null,put:async()=>{},delete:async()=>true};
  runInNewContext(readFileSync(new URL('../../../public/push-sw.js',import.meta.url),'utf8'),{
    self:{crypto,location:{origin},navigator:{userAgent:'iPhone'},zipcoQaPushObservation:remote,
      clients:{matchAll:async()=>existing,openWindow:(target:string)=>{launches.push(target);return Promise.resolve(client);}},
      registration:{showNotification:async(title:string,options:any)=>shown.push({title,...options})},addEventListener:(type:string,fn:any)=>listeners.set(type,fn)},
    caches:{open:async()=>{if(cacheFails)throw Error('Cache unavailable');return cache;}},URL,Request,Response,Date,
    setTimeout:(fn:any)=>{queueMicrotask(fn);},clearTimeout:()=>{},
  });
  const fire=(type:string,payload:any)=>{let pending:Promise<any>=Promise.resolve();listeners.get(type)!({...payload,waitUntil:(p:Promise<any>)=>pending=p});return pending;};
  return {fire,shown,posted,launches,client};
}
describe('worker v11 integration without storage dependency',()=>{
  it('preserves receipt in Notification.data across restart; never puts it in navigation, inventory or URL',async()=>{
    const first=create(),sw=worker(first.remote,true);
    await sw.fire('push',{data:{json:()=>({title:'Confirmation',url,tag:'order-91-availability-17',qaObservation:block()})}});
    expect(sw.shown[0].title).toContain('QA aaaaaaaa');expect(sw.shown[0].data.qaObservation.receiptToken).toBe(receipt);
    expect(JSON.stringify(safeNotificationInventoryItem(sw.shown[0],origin))).not.toContain(receipt);
    const next=create(),restarted=worker(next.remote,true);
    await restarted.fire('notificationclick',{notification:{...sw.shown[0],close(){}}});
    expect(restarted.launches).toHaveLength(1);expect(JSON.stringify(restarted.launches)).not.toContain(receipt);
    expect(JSON.stringify(restarted.posted)).not.toMatch(/receiptToken|reportUrl|qaObservation":/);
    const meta=restarted.posted.find(p=>p.type==='ZIPCO_NOTIFICATION_NAVIGATE').qaObservationAck;
    expect(meta.traceId).toBe(traceId);
    await restarted.fire('message',{data:{type:'ZIPCO_QA_OBSERVATION_ACK',...meta,stage:'CARD_FOCUSED'},source:restarted.client});
    const stages=next.send.mock.calls.map(([,r])=>JSON.parse(r.body).stage);
    expect(stages).toEqual(expect.arrayContaining(['CLICK_RECEIVED','TARGET_NORMALIZED','LAUNCH_REQUESTED','NAVIGATION_POSTED','CARD_FOCUSED']));
  });
  it('opens synchronously even when observation network never resolves and reports early failures',async()=>{
    vi.useFakeTimers();const {remote,send}=create(vi.fn(()=>new Promise(()=>{})) as any),sw=worker(remote,true);
    const work=sw.fire('notificationclick',{notification:{data:{url,qaObservation:block()},tag:'order-91-availability-17',close(){}}});
    expect(sw.launches).toHaveLength(1);await vi.advanceTimersByTimeAsync(1501);await work;expect(send).toHaveBeenCalled();
    const successful=create(),broken=worker(successful.remote);
    await expect(broken.fire('notificationclick',{notification:{data:{url:'http://[',qaObservation:block()},close(){}}})).rejects.toThrow();
    expect(successful.send.mock.calls.map(([,r])=>JSON.parse(r.body).stage)).toEqual(['CLICK_RECEIVED','CLICK_FAILED']);
  });
  it.each(['begin','report','bind','metadata','posted','flush'])('continues navigation if the optional %s helper throws synchronously',async method=>{
    const sw=worker({[method](){throw Error('private-diagnostic');}},true);
    await expect(sw.fire('notificationclick',{notification:{data:{url,qaObservation:block()},tag:'order-91-availability-17',close(){}}})).resolves.toBeDefined();
    expect(sw.launches).toHaveLength(1);
    expect(new URL(sw.launches[0]).searchParams.get('orderId')).toBe('91');
    expect(sw.posted.some(p=>p.type==='ZIPCO_NOTIFICATION_NAVIGATE')).toBe(true);
    expect(JSON.stringify(sw.posted)).not.toContain(receipt);
  });
  it('removes the entire private block when forwarding a foreground push',async()=>{
    // The non-Apple branch forwards data; run that source with a synthetic UA.
    const source=readFileSync(new URL('../../../public/push-sw.js',import.meta.url),'utf8');
    let handler:any,work:any;const postMessage=vi.fn();
    runInNewContext(source,{self:{location:{origin},navigator:{userAgent:'Android'},clients:{matchAll:async()=>[{visibilityState:'visible',focused:true,postMessage}]},addEventListener:(t:string,fn:any)=>{if(t==='push')handler=fn;}}});
    handler({data:{json:()=>({url,qaObservation:block()})},waitUntil:(p:any)=>work=p});await work;
    expect(postMessage).toHaveBeenCalledWith({url});expect(JSON.stringify(postMessage.mock.calls)).not.toContain(receipt);
  });
});
