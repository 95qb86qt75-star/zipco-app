import { beforeEach,afterEach,expect,it,vi } from 'vitest';
import { rawOrder,coordinationProcess } from './requestProcessFixtures';
import { normalizeBusinessOrdersPayload,normalizeMyOrdersPayload } from './orderNormalization';
let api:typeof import('./whatsappReturn');let values:Map<string,string>;
beforeEach(async()=>{
 vi.resetModules();vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
 values=new Map([['zipco-user-id','12'],['zipco-token','synthetic'],['zipco-business-id','8']]);
 vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,v:string)=>values.set(key,v),removeItem:(key:string)=>values.delete(key),get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null});
 vi.stubGlobal('window',new EventTarget());api=await import('./whatsappReturn');
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
const order=()=>normalizeBusinessOrdersPayload([{...rawOrder,status:'accepted',requestProcess:coordinationProcess}])[0];
it('requires leaving after a verified navigation attempt and only stores UI metadata',()=>{
 const key=api.whatsappReturnKey(order())!;expect(api.shouldAskWhatsappReturn(key)).toBe(true);
 api.markWhatsappOpened(key);expect(api.shouldAskWhatsappReturn(key)).toBe(false);
 expect(JSON.parse(values.get(key)!)).toEqual({state:'opened',at:Date.now(),page:expect.any(String)});
 api.recordWhatsappDeparture();expect(api.shouldAskWhatsappReturn(key)).toBe(true);
});
it('scopes markers to account, business, process, agreement and excludes customer views',()=>{
 const first=api.whatsappReturnKey(order())!;api.markWhatsappOpened(first);
 values.set('zipco-user-id','99');const second=api.whatsappReturnKey(order())!;expect(second).not.toBe(first);api.recordWhatsappDeparture();
 expect(JSON.parse(values.get(first)!).state).toBe('opened');values.set('zipco-user-id','12');values.set('zipco-business-id','77');expect(api.whatsappReturnKey(order())).not.toBe(first);
 expect(api.whatsappReturnKey(normalizeMyOrdersPayload([{...rawOrder,status:'accepted',requestProcess:coordinationProcess}])[0])).toBeNull();
});
it('silences dismissal for 30 minutes and resets after another explicit WhatsApp attempt',()=>{
 const key=api.whatsappReturnKey(order())!;api.dismissWhatsappReturn(key);vi.advanceTimersByTime(1799999);expect(api.shouldAskWhatsappReturn(key)).toBe(false);
 vi.advanceTimersByTime(1);expect(api.shouldAskWhatsappReturn(key)).toBe(true);api.markWhatsappOpened(key);expect(api.shouldAskWhatsappReturn(key)).toBe(false);
 api.clearWhatsappReturn(key);expect(api.shouldAskWhatsappReturn(key)).toBe(true);
});
it('falls back to memory when marker storage is blocked and ignores malformed storage',()=>{
 const key=api.whatsappReturnKey(order())!;localStorage.setItem=(k:string,v:string)=>{if(k.startsWith('zipco-wa-return:'))throw Error('blocked');values.set(k,v);};
 api.markWhatsappOpened(key);expect(api.shouldAskWhatsappReturn(key)).toBe(false);api.recordWhatsappDeparture();expect(api.shouldAskWhatsappReturn(key)).toBe(true);
 values.set(key,'{"state":"dismissed","at":"invalid"}');expect(api.shouldAskWhatsappReturn(key)).toBe(true);
});
it('recovers an old-page attempt and never blocks indefinitely after restart',()=>{
 const key=api.whatsappReturnKey(order())!;values.set(key,JSON.stringify({state:'opened',at:Date.now(),page:'old-page'}));expect(api.shouldAskWhatsappReturn(key)).toBe(true);
});
it('allows only one owner to hold a question and cannot release another card claim',()=>{
 const first={},second={};expect(api.claimWhatsappAsk('first',first)).toBe(true);expect(api.claimWhatsappAsk('second',second)).toBe(false);
 api.releaseWhatsappAsk(second);expect(api.claimWhatsappAsk('second',second)).toBe(false);api.releaseWhatsappAsk(first);expect(api.claimWhatsappAsk('second',second)).toBe(true);
});

it('tracks a customer return without requiring a business identity and isolates the participant',()=>{
 values.delete('zipco-business-id');const customer=normalizeMyOrdersPayload([{...rawOrder,status:'accepted',requestProcess:coordinationProcess}])[0];const key=api.whatsappReturnKey(customer,false)!;expect(key).toContain('customer:12:');expect(api.hasWhatsappReturn(key)).toBe(false);api.markWhatsappOpened(key);expect(api.shouldAskWhatsappReturn(key)).toBe(false);api.recordWhatsappDeparture();expect(api.shouldAskWhatsappReturn(key)).toBe(true);values.set('zipco-user-id','99');expect(api.whatsappReturnKey(customer,false)).not.toBe(key);
});

it('holds only the initiating card during verification, without storing an access or broadcasting a business event',()=>{
 const key=api.whatsappReturnKey(order())!,changed=vi.fn(),event=vi.spyOn(window,'dispatchEvent');
 const unsubscribe=api.subscribeWhatsappPresentation(changed),release=api.holdWhatsappPresentation(key);
 expect(api.isWhatsappPresentationHeld(key)).toBe(true);expect(api.isWhatsappPresentationHeld(key+'-other')).toBe(false);
 expect(values.has(key)).toBe(false);expect(event).not.toHaveBeenCalled();
 release();expect(api.isWhatsappPresentationHeld(key)).toBe(false);expect(changed).toHaveBeenCalledTimes(2);
 unsubscribe();
});

it('keeps a verified navigation attempt held until departure, but never requires a local marker for the counterpart',()=>{
 const key=api.whatsappReturnKey(order())!,release=api.holdWhatsappPresentation(key);
 api.markWhatsappOpened(key);release();expect(api.isWhatsappPresentationHeld(key)).toBe(true);
 api.recordWhatsappDeparture();expect(api.isWhatsappPresentationHeld(key)).toBe(false);
 expect(api.isWhatsappPresentationHeld(key+'-counterpart')).toBe(false);
 values.set(key,JSON.stringify({state:'opened',at:Date.now(),page:'old-page'}));expect(api.isWhatsappPresentationHeld(key)).toBe(false);
});

it('does not let an obsolete cleanup release a newer launch and clears a failed navigation',()=>{
 const key=api.whatsappReturnKey(order())!,old=api.holdWhatsappPresentation(key),current=api.holdWhatsappPresentation(key);
 old();expect(api.isWhatsappPresentationHeld(key)).toBe(true);
 api.markWhatsappOpened(key);api.clearWhatsappReturn(key);current();expect(api.isWhatsappPresentationHeld(key)).toBe(false);
});
