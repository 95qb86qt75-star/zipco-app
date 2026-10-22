import { beforeEach,afterEach,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({cleanups:[] as Array<()=>void>}));
vi.mock('react',()=>({useRef:(current:unknown)=>({current}),useEffect:(effect:()=>undefined|(()=>void))=>{const cleanup=effect();if(cleanup)state.cleanups.push(cleanup);}}));
import useStartWorkPrompt from './useStartWorkPrompt';
import { dismissWhatsappReturn,markWhatsappOpened,recordWhatsappDeparture } from './whatsappReturn';
let doc:EventTarget&{hidden:boolean;querySelector:ReturnType<typeof vi.fn>};let values:Map<string,string>;
beforeEach(()=>{
 vi.useFakeTimers();state.cleanups=[];values=new Map([['zipco-user-id','12'],['zipco-token','synthetic'],['zipco-business-id','8']]);
 vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k),get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null});
 vi.stubGlobal('window',new EventTarget());doc=Object.assign(new EventTarget(),{hidden:false,querySelector:vi.fn(()=>null)});vi.stubGlobal('document',doc);
});
afterEach(()=>{state.cleanups.forEach(cleanup=>cleanup());vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
it('opens only after four visible seconds, without performing a business action',()=>{
 const open=vi.fn();useStartWorkPrompt({key:'timer-1',enabled:true,blocked:false,onOpen:open});vi.advanceTimersByTime(3999);expect(open).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(open).toHaveBeenCalledOnce();
});
it('cancels when leaving early and starts a full delay on return',()=>{
 const open=vi.fn();useStartWorkPrompt({key:'timer-2',enabled:true,blocked:false,onOpen:open});vi.advanceTimersByTime(2000);
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));vi.advanceTimersByTime(5000);expect(open).not.toHaveBeenCalled();doc.hidden=false;window.dispatchEvent(new Event('focus'));vi.advanceTimersByTime(3999);expect(open).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(open).toHaveBeenCalledOnce();
});
it.each([{enabled:false,blocked:false},{enabled:true,blocked:true}])('does not open without permission or while busy/covered: %j',options=>{
 const open=vi.fn();useStartWorkPrompt({key:'timer-denied',...options,onOpen:open});vi.advanceTimersByTime(10000);expect(open).not.toHaveBeenCalled();
});
it('does not ask while navigation is opened or dismissed and only returns after departure',()=>{
 const key='zipco-wa-return:v1:12:8:20:7:agreement-test';markWhatsappOpened(key);const open=vi.fn();useStartWorkPrompt({key,enabled:true,blocked:false,onOpen:open});vi.advanceTimersByTime(5000);expect(open).not.toHaveBeenCalled();
 recordWhatsappDeparture();vi.advanceTimersByTime(4000);expect(open).toHaveBeenCalledOnce();dismissWhatsappReturn(key);window.dispatchEvent(new Event('focus'));vi.advanceTimersByTime(10000);expect(open).toHaveBeenCalledOnce();
});
it('does not stack a second sheet and cleans up pending timers',()=>{
 const first=vi.fn(),second=vi.fn();useStartWorkPrompt({key:'timer-owner-first',enabled:true,blocked:false,onOpen:first});useStartWorkPrompt({key:'timer-owner-second',enabled:true,blocked:false,onOpen:second});vi.advanceTimersByTime(4000);expect(first).toHaveBeenCalledOnce();expect(second).not.toHaveBeenCalled();
});
it('does not show a question in another account or on top of another dialog',()=>{
 const open=vi.fn();doc.querySelector.mockReturnValue({} as any);useStartWorkPrompt({key:'timer-modal',enabled:true,blocked:false,onOpen:open});vi.advanceTimersByTime(4000);expect(open).not.toHaveBeenCalled();doc.querySelector.mockReturnValue(null);values.set('zipco-user-id','another');window.dispatchEvent(new Event('focus'));vi.advanceTimersByTime(5000);expect(open).not.toHaveBeenCalled();
});
it('invalidates an open question when the account changes',()=>{
 const open=vi.fn(),invalidate=vi.fn();useStartWorkPrompt({key:'timer-session-open',enabled:true,blocked:false,onOpen:open,onInvalidate:invalidate});vi.advanceTimersByTime(4000);expect(open).toHaveBeenCalledOnce();
 values.set('zipco-user-id','other-account');window.dispatchEvent(new Event('zipco-session-changed'));expect(invalidate).toHaveBeenCalledOnce();
});
