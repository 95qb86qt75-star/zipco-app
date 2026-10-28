import { describe, expect, it, vi } from 'vitest';
import { createObservationApi, OBSERVATION_CONTRACT, sanitizeObservationSession } from './qaPushObservationApi';
const base='https://zipco-backend-qa.up.railway.app',id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const session=()=>({contract:OBSERVATION_CONTRACT,sessionId:id,expiresAt:new Date(Date.now()+3600000).toISOString(),state:'WAITING_FOR_LEGITIMATE_PUSH',storage:'VOLATILE_SINGLE_INSTANCE',deliveries:[]});
describe('QA observation session API',()=>{
  it('only opens explicitly, uses owner JWT on sessions and sends the exact contract',async()=>{
    const fetch=vi.fn(async()=>new Response(JSON.stringify(session()),{status:201}));const api=createObservationApi({enabled:true,apiBase:base,fetch});
    expect(fetch).not.toHaveBeenCalled();await api.open('synthetic-jwt');
    expect(fetch).toHaveBeenCalledExactlyOnceWith(base+'/qa/push-observations/sessions',expect.objectContaining({method:'POST',body:'{"contract":"qa-push-observation-v1"}',cache:'no-store',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer synthetic-jwt'}}));
  });
  it.each([false,true])('rejects unsupported environment/base without any request (enabled=%s)',async enabled=>{
    const fetch=vi.fn();const api=createObservationApi({enabled,apiBase:enabled?'https://production.test':base,fetch});
    await expect(api.open('jwt')).rejects.toMatchObject({code:'QA_PUSH_OBSERVATIONS_DISABLED'});expect(fetch).not.toHaveBeenCalled();
  });
  it('reads and stops the exact session without adding owner/order data',async()=>{
    const fetch=vi.fn(async(_u:any,init:any)=>new Response(JSON.stringify(init.method==='DELETE'?{contract:OBSERVATION_CONTRACT,sessionId:id,state:'STOPPED'}:session())));
    const api=createObservationApi({enabled:true,apiBase:base,fetch});await api.read('jwt',id);await api.stop('jwt',id);
    expect(fetch.mock.calls.map(([u])=>u)).toEqual([base+'/qa/push-observations/sessions/'+id,base+'/qa/push-observations/sessions/'+id]);
    expect(fetch.mock.calls.every(([,init])=>!('body'in init))).toBe(true);
  });
  it.each([[404,'QA_PUSH_OBSERVATIONS_DISABLED'],[410,'SESSION_UNAVAILABLE'],[429,'QA_PUSH_OBSERVATION_RATE_LIMIT'],[401,'private-message']])('handles HTTP %s with no retry or commercial logout',async(status,code)=>{
    const fetch=vi.fn(async()=>new Response(JSON.stringify({code,message:'private'}),{status}));const api=createObservationApi({enabled:true,apiBase:base,fetch});
    try{await api.read('jwt',id);throw Error('Expected failure');}catch(error:any){expect(error.httpStatus).toBe(status);expect(error.message).not.toContain('private');}
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('never exports unexpected server fields or diagnostic receipts',()=>{
    const raw={...session(),receiptToken:'private',userId:91,deliveries:[{traceId:id,endpoint:'private',events:[{stage:'PROVIDER_ACCEPTED',source:'server',receivedAt:new Date().toISOString(),raw:'private'},
      {stage:'CLICK_RECEIVED',source:'client-reported/server-received',receivedAt:new Date().toISOString(),traceId:id,attemptId:id,workerBuild:'a'.repeat(40),workerRevision:'notification-click-attempt-v11',hasTarget:true,receiptToken:'private'}]}]};
    const clean=sanitizeObservationSession(raw);expect(clean?.deliveries[0].events).toHaveLength(2);
    expect(JSON.stringify(clean)).not.toMatch(/private|userId|receiptToken|endpoint|raw/);
  });
  it('rejects a mismatched session or malformed remote row instead of showing misleading evidence',async()=>{
    expect(sanitizeObservationSession({...session(),deliveries:[{traceId:id,events:[{stage:'CARD_FOCUSED',source:'client-reported/server-received'}]}]})).toBeNull();
    const api=createObservationApi({enabled:true,apiBase:base,fetch:async()=>new Response(JSON.stringify({...session(),sessionId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}))});
    await expect(api.read('jwt',id)).rejects.toMatchObject({code:'INVALID_RESPONSE'});
  });
});
