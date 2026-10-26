import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({cleanups:[] as Array<()=>void>}));
vi.mock('react',()=>({useRef:(current:unknown)=>({current}),useEffect:(effect:()=>undefined|(()=>void))=>{const cleanup=effect();if(cleanup)state.cleanups.push(cleanup);}}));
import usePaymentConfirmationReminder,{paymentReminderEligible} from './usePaymentConfirmationReminder';
import {simplePaidPending,simpleReserved} from './simplifiedReservationFixtures';
import {paidRequested} from './reservationFixtures';
import type {BusinessRequest} from './types';
const order=(p=simplePaidPending)=>({id:20,recordState:'available',requestProcess:p} as BusinessRequest);
let values:Map<string,string>,markers:Map<string,string>,doc:EventTarget&{hidden:boolean;querySelector:ReturnType<typeof vi.fn>};
beforeEach(()=>{
  vi.useFakeTimers();state.cleanups=[];values=new Map([['zipco-user-id','2'],['zipco-token','synthetic'],['zipco-business-id','5']]);markers=new Map();
  const storage=(m:Map<string,string>)=>({getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>m.set(k,v),removeItem:(k:string)=>m.delete(k)});
  vi.stubGlobal('localStorage',storage(values));vi.stubGlobal('sessionStorage',storage(markers));vi.stubGlobal('window',new EventTarget());doc=Object.assign(new EventTarget(),{hidden:false,querySelector:vi.fn(()=>null)});vi.stubGlobal('document',doc);
});
afterEach(()=>{state.cleanups.forEach(f=>f());vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
function setup(p=simplePaidPending,business=true){const open=vi.fn(),update=vi.fn().mockResolvedValue(order(p)),invalidate=vi.fn();const release=usePaymentConfirmationReminder({order:order(p),business,blocked:false,update,onOpen:open,onInvalidate:invalidate});return {open,update,invalidate,release};}
const depart=()=>{doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));};
it('does not show on initial render; rereads once after a real return without a POST',async()=>{
  const t=setup();await vi.advanceTimersByTimeAsync(5000);expect(t.update).not.toHaveBeenCalled();depart();await vi.advanceTimersByTimeAsync(3999);expect(t.open).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(1);expect(t.update).toHaveBeenCalledOnce();expect(t.open).toHaveBeenCalledOnce();expect([...markers.values()].join('')).not.toContain('synthetic');
});
it('does not repeat for focus/pageshow or dismiss within the same visit/version',async()=>{
  const t=setup();depart();await vi.advanceTimersByTimeAsync(4000);t.release();for(let i=0;i<3;i++){window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));}await vi.advanceTimersByTimeAsync(8000);expect(t.open).toHaveBeenCalledOnce();expect(t.update).toHaveBeenCalledOnce();
});
it.each([[simpleReserved,true],[paidRequested,true],[simplePaidPending,false]] as const)('never prompts free/V2/customer cases %#',async(p,business)=>{
  const t=setup(p,business);depart();await vi.advanceTimersByTimeAsync(5000);expect(t.open).not.toHaveBeenCalled();expect(paymentReminderEligible(order(p),business)).toBe(false);
});
it('does not offer confirmation after refreshed permissions were removed',async()=>{
  const t=setup();t.update.mockResolvedValue(order({...simplePaidPending,reservationFollowUp:{...simplePaidPending.reservationFollowUp!,allowedActions:[],paymentConfirmationReminder:{eligible:false,reservationId:801,expectedVersion:4}}}));depart();await vi.advanceTimersByTimeAsync(4000);expect(t.update).toHaveBeenCalledOnce();expect(t.open).not.toHaveBeenCalled();
});
it('does not open on another order, covered dialog or failed read',async()=>{
  const t=setup();t.update.mockResolvedValue({...order(),requestProcess:{...simplePaidPending,id:99}});depart();await vi.advanceTimersByTimeAsync(4000);expect(t.open).not.toHaveBeenCalled();doc.querySelector.mockReturnValue({});depart();await vi.advanceTimersByTimeAsync(4000);expect(t.update).toHaveBeenCalledOnce();
});
it('drops pending reminder when the account changes',async()=>{
  const t=setup();depart();values.set('zipco-user-id','other');window.dispatchEvent(new Event('zipco-session-changed'));await vi.advanceTimersByTimeAsync(5000);expect(t.open).not.toHaveBeenCalled();expect(t.invalidate).toHaveBeenCalledOnce();
});
