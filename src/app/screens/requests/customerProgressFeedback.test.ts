import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const h=vi.hoisted(()=>({session:{} as object|null,announce:vi.fn()}));
vi.mock('./ActionHologram',()=>({announceAction:h.announce}));
vi.mock('./coordinationSession',()=>({readCoordinationSession:()=>h.session}));
import { presentCustomerProgress } from './customerProgressFeedback';
let dispatch:ReturnType<typeof vi.fn>;
beforeEach(()=>{vi.useFakeTimers();h.session={};h.announce.mockReset();dispatch=vi.fn();vi.stubGlobal('window',{dispatchEvent:dispatch});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('keeps verified receipt visible before the global hologram and publishes after it starts',async()=>{
 const show=vi.fn(),task=presentCustomerProgress('CONFIRM_RECEIPT','receipt',Date.now(),show);
 await vi.advanceTimersByTimeAsync(1099);expect(show).not.toHaveBeenCalled();expect(h.announce).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(1);expect(show).toHaveBeenCalledTimes(1);expect(h.announce).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(100);expect(h.announce).toHaveBeenCalledWith('clientReceived',{key:'receipt'});expect(dispatch).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(600);await task;expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type:'zipco-requests-refresh'}));
});
it('does not add another 1.1 seconds after a slow confirmed action',async()=>{
 const show=vi.fn(),task=presentCustomerProgress('ACK_READY_NOTICE','ack',Date.now()-2000,show);
 await vi.advanceTimersByTimeAsync(0);await task;expect(show).toHaveBeenCalledTimes(1);expect(h.announce).toHaveBeenCalledWith('clientAck',{key:'ack'});
});
it.each([0,1100,1200])('never announces or refreshes into a changed session at %sms',async ms=>{
 const task=presentCustomerProgress('CONFIRM_RECEIPT','receipt',Date.now(),vi.fn());
 await vi.advanceTimersByTimeAsync(ms);h.session={};h.announce.mockClear();dispatch.mockClear();await vi.advanceTimersByTimeAsync(2000);await task;
 expect(h.announce).not.toHaveBeenCalled();expect(dispatch).not.toHaveBeenCalled();
});
