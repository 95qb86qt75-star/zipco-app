import { afterEach, beforeEach, expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({root:{dataset:{} as Record<string,string>},cleanup:undefined as undefined|(()=>void)}));
vi.mock('react',()=>({useRef:()=>({current:state.root}),useEffect:(effect:()=>()=>void)=>{state.cleanup=effect();}}));
import useCoordinationMotion from './useCoordinationMotion';
let observe: (entries:Array<{isIntersecting:boolean;intersectionRatio:number}>)=>void;
let media:EventTarget&{matches:boolean};let doc:EventTarget&{hidden:boolean};const disconnect=vi.fn();
beforeEach(()=>{state.root={dataset:{}};disconnect.mockReset();media=Object.assign(new EventTarget(),{matches:false});doc=Object.assign(new EventTarget(),{hidden:false});
 vi.stubGlobal('document',doc);vi.stubGlobal('window',{matchMedia:()=>media});vi.stubGlobal('IntersectionObserver',class{constructor(cb:typeof observe){observe=cb;}observe(){}disconnect=disconnect;});});
afterEach(()=>{state.cleanup?.();vi.unstubAllGlobals();});
it('animates only visible foreground content and stops for reduced motion and cleanup',()=>{
 useCoordinationMotion(false);expect(state.root.dataset.coordinationMotion).toBe('idle');
 observe([{isIntersecting:true,intersectionRatio:1}]);expect(state.root.dataset.coordinationMotion).toBe('active');
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));expect(state.root.dataset.coordinationMotion).toBe('idle');
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));expect(state.root.dataset.coordinationMotion).toBe('active');
 media.matches=true;media.dispatchEvent(new Event('change'));expect(state.root.dataset.coordinationMotion).toBe('idle');
 media.matches=false;media.dispatchEvent(new Event('change'));observe([{isIntersecting:false,intersectionRatio:0}]);expect(state.root.dataset.coordinationMotion).toBe('idle');
 state.cleanup?.();expect(disconnect).toHaveBeenCalledOnce();expect(state.root.dataset.coordinationMotion).toBe('idle');state.cleanup=undefined;
});
it('keeps decoration paused while a sheet covers the card',()=>{
 useCoordinationMotion(true);observe([{isIntersecting:true,intersectionRatio:1}]);expect(state.root.dataset.coordinationMotion).toBe('idle');
});
