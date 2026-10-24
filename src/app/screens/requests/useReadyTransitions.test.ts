import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const h = vi.hoisted(() => ({ slots: [] as any[], index: 0, effects: [] as (() => void)[],
  announce: vi.fn(() => 19), dismiss: vi.fn(), mark: vi.fn(), clear: vi.fn(), session: {} as object | null, listener: undefined as undefined | (() => void) }));
vi.mock('react', () => ({
  useRef(value: unknown) { const i=h.index++; return h.slots[i] ??= {current:value}; },
  useState(value: unknown) { const i=h.index++; if (!(i in h.slots)) h.slots[i]=value;
    return [h.slots[i],(next:any)=>{h.slots[i]=typeof next==='function'?next(h.slots[i]):next;}]; },
  useEffect(effect:()=>void|(()=>void), deps:unknown[]) { const i=h.index++, prior=h.slots[i];
    if (!prior || deps.some((v,j)=>v!==prior.deps[j])) h.effects.push(()=>{prior?.cleanup?.();h.slots[i]={deps,cleanup:effect()};}); },
}));
vi.mock('./ActionHologram',()=>({announceAction:h.announce,dismissAction:h.dismiss,actionHologramDuration:()=>4300}));
vi.mock('./readyArrival',()=>({markJustReady:h.mark,clearReadyArrival:h.clear}));
vi.mock('./coordinationSession',()=>({readCoordinationSession:()=>h.session,subscribeCoordinationSession:(fn:()=>void)=>{h.listener=fn;return()=>{h.listener=undefined;};}}));
import useReadyTransitions from './useReadyTransitions';
import { normalizeMyOrdersPayload } from './orderNormalization';
import { rawOrder, coordinationProcess } from './requestProcessFixtures';
const records = (state='IN_PROGRESS',version=5,agreement='agreement-test',id=20,orderType='product') => normalizeMyOrdersPayload([{...rawOrder,id,orderType,requestProcess:{...coordinationProcess,state,version,agreementPublicId:agreement}}]);
let onReady:ReturnType<typeof vi.fn>;
const render=(orders=records(),active=true,loaded=true,navigationKey='active')=>{
  h.index=0;const result=useReadyTransitions(orders,onReady,{active,loaded,navigationKey});
  h.effects.splice(0).forEach(fn=>fn());return result;
};
const unmount=()=>h.slots.forEach(slot=>slot?.cleanup?.());
beforeEach(()=>{h.slots=[];h.effects=[];h.index=0;h.session={};vi.clearAllMocks();onReady=vi.fn();vi.useFakeTimers();vi.stubGlobal('document',{visibilityState:'visible'});});
afterEach(()=>{unmount();vi.useRealTimers();vi.unstubAllGlobals();});
it('does not replay already ready on first load, refresh or navigation',()=>{
 render(records('READY',6));render(records('READY',6),true,true,'ready');expect(h.announce).not.toHaveBeenCalled();expect(h.mark).not.toHaveBeenCalled();
});
it('announces once and coordinates Listos, chip and tip at 4.3 and 7.9 seconds',async()=>{
 render();const ready=records('READY',6);render(ready);expect(h.announce).toHaveBeenCalledTimes(1);expect(h.mark).toHaveBeenCalledWith(20,'agreement-test',Date.now()+4300);
 await vi.advanceTimersByTimeAsync(4299);expect(onReady).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(1);expect(onReady).toHaveBeenCalledExactlyOnceWith(20);expect(render(ready,true,true,'ready')).toEqual({chipBump:true,tip:true});
 await vi.advanceTimersByTimeAsync(1600);expect(render(ready,true,true,'ready')).toEqual({chipBump:false,tip:true});
 await vi.advanceTimersByTimeAsync(2000);expect(render(ready,true,true,'ready')).toEqual({chipBump:false,tip:false});expect(h.announce).toHaveBeenCalledTimes(1);
});
it('respects an explicit category choice during the hologram',async()=>{
 render();const ready=records('READY',6);render(ready);render(ready,true,true,'pending');await vi.advanceTimersByTimeAsync(4300);
 expect(onReady).not.toHaveBeenCalled();expect(render(ready,true,true,'pending').tip).toBe(true);
});
it.each(['version','agreement','inactive','hidden','unavailable'] as const)('does not invent a transition from %s',scenario=>{
 render();if(scenario==='hidden')document.visibilityState='hidden';
 render(records('READY',scenario==='version'?5:6,scenario==='agreement'?'new-agreement':'agreement-test'),scenario!=='inactive',scenario!=='unavailable');
 expect(h.announce).not.toHaveBeenCalled();
});
it.each(['session','unmount','inactive','unavailable','completed'] as const)('suppresses late navigation after %s',async scenario=>{
 render();render(records('READY',6));
 if(scenario==='session'){h.session={};h.listener?.();}
 if(scenario==='unmount')unmount();
 if(scenario==='inactive')render(records('READY',6),false);
 if(scenario==='unavailable')render(records('READY',6),true,false);
 if(scenario==='completed')render(records('COMPLETED',7));
 await vi.advanceTimersByTimeAsync(8000);expect(onReady).not.toHaveBeenCalled();
 if(scenario!=='completed')expect(h.dismiss).toHaveBeenCalledWith(19);
});
it('coalesces simultaneous and arriving ready orders during one hologram',async()=>{
 render([...records(),...records('IN_PROGRESS',5,'agreement-two',21)]);
 render([...records('READY',6),...records('IN_PROGRESS',5,'agreement-two',21)]);
 await vi.advanceTimersByTimeAsync(1000);render([...records('READY',6),...records('READY',6,'agreement-two',21)]);
 expect(h.announce).toHaveBeenCalledTimes(1);expect(h.mark).toHaveBeenCalledTimes(2);
 await vi.advanceTimersByTimeAsync(3300);expect(onReady).toHaveBeenCalledTimes(1);
});
it('uses service wording without suggesting product acknowledgment',()=>{
 render(records('IN_PROGRESS',5,'agreement-test',20,'service'));render(records('READY',6,'agreement-test',20,'service'));
 expect(h.announce).toHaveBeenCalledWith('clientReady',expect.objectContaining({title:'¡Tu servicio está listo!'}));
});
