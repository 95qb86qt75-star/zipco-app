import { describe, expect, it, vi } from 'vitest';
import { readRegistrationInventory, safeNotificationInventoryItem } from './qaNotificationInventory';

const origin='https://zipco.test',token='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const notice={data:{qaTraceId:token,qaBuild:'a'.repeat(40),qaRevision:'notification-click-attempt-v10',
  url:'/?open=requests-customer&orderId=91',eventKey:'requests-customer:order-91-availability-17',orderId:91,processId:777,
  body:'private-body',endpoint:'private-endpoint',keys:{auth:'private-key'}},title:'private-title',tag:'order-91-availability-17'};
describe('QA registration and notification inventory',()=>{
  it('links the displayed banner code using only allowlisted diagnostic data',()=>{
    const report=safeNotificationInventoryItem(notice,origin);
    expect(report).toEqual({correlationId:token,bannerCode:'aaaaaaaa',presentedBuild:'a'.repeat(40),presentedRevision:'notification-click-attempt-v10',hasTarget:true,hasEvent:true});
    expect(JSON.stringify(report)).not.toMatch(/private|order-91|orderId|processId|endpoint|keys|url/);
  });
  it.each([null,{}, {url:'https://other.test/?open=requests-customer&orderId=91'}, {qaTraceId:'order-91',qaBuild:'private',qaRevision:'private'}])('keeps old and malformed notices readable without exposing data',data=>{
    expect(safeNotificationInventoryItem({data},origin)).toMatchObject({correlationId:null,presentedBuild:null,presentedRevision:null,hasTarget:false,hasEvent:false});
  });
  it('rejects event identity mismatching the actual destination',()=>{
    expect(safeNotificationInventoryItem({data:{...notice.data,eventKey:'requests-customer:order-92-availability-17'}},origin).hasEvent).toBe(false);
  });
  it('ties the inventory to its active controller without exporting scope or script URLs',async()=>{
    const active={scriptURL:origin+'/sw.js'} as ServiceWorker;
    const getNotifications=vi.fn(async()=>Array.from({length:25},()=>notice));
    const registration={scope:origin+'/',active,getNotifications} as unknown as ServiceWorkerRegistration;
    const report=await readRegistrationInventory(registration,origin,active);
    expect(report).toMatchObject({sameOrigin:true,rootScope:true,activeIsController:true,expectedActiveScript:true,notificationCount:25,notificationsAvailable:true});
    expect(report.notifications).toHaveLength(20);expect(getNotifications).toHaveBeenCalledOnce();
    expect(JSON.stringify(report)).not.toContain(origin);
  });
  it('does not inspect a different origin or assume an absent inventory means absent push',async()=>{
    const getNotifications=vi.fn();
    const report=await readRegistrationInventory({scope:'https://other.test/',active:null,getNotifications} as any,origin,null);
    expect(report.notificationsAvailable).toBe(false);expect(getNotifications).not.toHaveBeenCalled();
  });
  it('reports inventory failure without serializing exception messages',async()=>{
    const report=await readRegistrationInventory({scope:origin+'/',active:null,getNotifications:async()=>{throw Error('private-subscription');}} as any,origin,null);
    expect(report).toMatchObject({notificationsAvailable:false,notificationCount:null});expect(JSON.stringify(report)).not.toContain('private');
  });
});
