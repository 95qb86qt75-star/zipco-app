import { afterEach, describe, expect, it, vi } from 'vitest';

const origin='https://zipco.test',token='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const notice={data:{qaTraceId:token,qaBuild:'a'.repeat(40),qaRevision:'notification-click-attempt-v10',url:'/?open=requests-customer&orderId=91',eventKey:'requests-customer:order-91-availability-17'},title:'private-title',tag:'order-91-availability-17'};
function environment(delayWrite?:Promise<void>){
  const rows=new Map<string,Response>();
  vi.stubGlobal('caches',{open:async()=>({put:async(key:string,r:Response)=>{await delayWrite;rows.set(key,r.clone());},
    match:async(key:string)=>rows.get(key)?.clone(),keys:async()=>[...rows.keys()].map(k=>new Request(k)),delete:async(key:string)=>rows.delete(key)})});
  const worker=(revision='notification-click-attempt-v10')=>({scriptURL:origin+'/sw.js',postMessage:(message:any,ports:any[])=>{
    if(message.type==='ZIPCO_NOTIFICATION_WORKER_VERSION')ports[0].postMessage({revision,build:'a'.repeat(40),traceEnabled:true});
    if(message.type==='ZIPCO_QA_CLICK_TRACE_READ')ports[0].postMessage({entries:[],storageAvailable:true});
  }});
  const controller=worker(),other=worker('notification-click-attempt-v9');
  const root={scope:origin+'/',active:controller,getNotifications:async()=>[notice]};
  const nested={scope:origin+'/other/',active:other,getNotifications:async()=>[]};
  vi.stubGlobal('navigator',{standalone:true,serviceWorker:{controller,getRegistration:async()=>root,getRegistrations:async()=>[root,nested]}});
  vi.stubGlobal('window',{location:{origin,hostname:'zipco.test'},matchMedia:()=>({matches:false})});
  return {controller,root,nested};
}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.resetModules();});
describe('QA copy of click trace',()=>{
  it('distinguishes the controller and registration active builds, and copies only sanitized worker evidence', async () => {
    const pageBuild = 'a'.repeat(40), oldBuild = 'b'.repeat(40);
    vi.stubEnv('QA_LOAD_DIAGNOSTICS_VERSION', pageBuild);
    const fakeWorker = (build: string) => ({ postMessage: (message: any, ports: MessagePort[]) => {
      ports[0].postMessage(message.type === 'ZIPCO_NOTIFICATION_WORKER_VERSION'
        ? { revision: 'ios-click-trace-v4', build, traceEnabled: true }
        : { storageAvailable: true, entries: [{ at: Date.now(), source: 'worker', stage: 'click-received', build,
          hasTarget: true, orderId: 99, url: '/?orderId=99', token: 'private' }] });
    } });
    vi.stubGlobal('navigator', { serviceWorker: { controller: fakeWorker(oldBuild),
      getRegistration: async () => ({ active: fakeWorker(pageBuild) }) } });
    vi.stubGlobal('window', { location: new URL('https://zipco.test/') });
    vi.stubGlobal('caches', { open: async () => ({ match: async () => undefined }) });
    const result = await (await import('./qaNotificationClickTrace')).readClickTrace();
    expect(result.frontendVersion).toBe(pageBuild);
    expect(result.localRetention).toEqual({policy:'causal-first-v1',maxEntriesPerSource:50,maxContextEntriesPerSource:10,ttlMs:3600000,controllerPolicyConfirmed:false,missingStagesAreInconclusive:true});
    expect(result.controllingWorker.build).toBe(oldBuild);
    expect(result.activeWorker.build).toBe(pageBuild);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].stage).toBe('click-received');
    expect(JSON.stringify(result)).not.toMatch(/private|orderId|token/);
  });
  it('waits for an already requested lazy page record before exporting',async()=>{
    let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
    environment(gate);vi.stubEnv('QA_NOTIFICATION_TRACE','1');
    const {traceNotificationClick}=await import('./notificationClickTrace');
    traceNotificationClick('toast-click',{hasTarget:true},token);
    const {readClickTrace}=await import('./qaNotificationClickTrace');
    let complete=false;const pending=readClickTrace().then(value=>{complete=true;return value;});
    await new Promise(resolve=>setTimeout(resolve,20));expect(complete).toBe(false);
    release();const report=await pending;
    expect(report.pageFlushCompleted).toBe(true);
    expect(report.entries).toContainEqual(expect.objectContaining({stage:'toast-click',correlationId:token}));
  });
  it('distinguishes the controller from another registration and reads pending local notices only',async()=>{
    environment();const {readClickTrace}=await import('./qaNotificationClickTrace');
    const report=await readClickTrace();
    expect(report.copiedAt).toBeGreaterThan(0);expect(report.registrationCount).toBe(2);
    expect(report.registrationReports[0]).toMatchObject({rootScope:true,activeIsController:true,traceReadFromController:true,notificationCount:1,notifications:[{bannerCode:'aaaaaaaa'}]});
    expect(report.registrationReports[1]).toMatchObject({rootScope:false,activeIsController:false,traceReadFromController:false,notificationCount:0,worker:{revision:'notification-click-attempt-v9'}});
    expect(JSON.stringify(report)).not.toMatch(/private-title|order-91|orderId|endpoint|scriptURL|https:\/\//);
  });
  it('falls back to the known root registration when enumeration is unavailable',async()=>{
    environment();Object.assign(navigator.serviceWorker,{getRegistrations:async()=>{throw Error('private');}});
    const report=await (await import('./qaNotificationClickTrace')).readClickTrace();
    expect(report.registrationEnumerationAvailable).toBe(false);expect(report.registrationReports).toHaveLength(1);
    expect(JSON.stringify(report)).not.toContain('private');
  });
});
