import {afterEach,beforeEach,expect,it,vi} from 'vitest';

const state=vi.hoisted(()=>({list:undefined as any,cleanup:undefined as undefined|(()=>void)}));
vi.mock('react',()=>({useRef:()=>({current:state.list}),useEffect:(effect:()=>()=>void)=>{state.cleanup=effect();}}));
import useRequestListMotion from './useRequestListMotion';

let doc:EventTarget&{hidden:boolean};
let scroller:EventTarget;
let cards:Array<{dataset:Record<string,string>}>;
let observe:(entries:Array<{target:typeof cards[number];isIntersecting:boolean;intersectionRatio:number}>)=>void;
const disconnect=vi.fn();
beforeEach(()=>{
  vi.useFakeTimers();disconnect.mockReset();scroller=new EventTarget();
  doc=Object.assign(new EventTarget(),{hidden:false});cards=[{dataset:{}},{dataset:{}}];
  state.list={dataset:{},closest:()=>scroller,querySelectorAll:()=>cards};
  vi.stubGlobal('document',doc);
  vi.stubGlobal('IntersectionObserver',class{
    constructor(callback:typeof observe){observe=callback;}
    observe(){}disconnect=disconnect;
  });
});
afterEach(()=>{state.cleanup?.();state.cleanup=undefined;vi.useRealTimers();vi.unstubAllGlobals();});

it('keeps visible cards active throughout scroll and momentum, retaining the gesture flag',()=>{
  useRequestListMotion([]);
  observe([{target:cards[0],isIntersecting:true,intersectionRatio:1}]);
  scroller.dispatchEvent(new Event('scroll'));
  expect(state.list.dataset.requestListScrolling).toBe('true');
  expect(state.list.dataset.requestListHidden).toBeUndefined();
  expect(cards[0].dataset.requestMotion).toBe('active');
  expect(cards[1].dataset.requestMotion).toBe('idle');
  vi.advanceTimersByTime(100);scroller.dispatchEvent(new Event('scroll'));vi.advanceTimersByTime(100);
  expect(state.list.dataset.requestListScrolling).toBe('true');
  expect(cards[0].dataset.requestMotion).toBe('active');
  vi.advanceTimersByTime(60);expect(state.list.dataset.requestListScrolling).toBeUndefined();
  scroller.dispatchEvent(new Event('scroll'));scroller.dispatchEvent(new Event('scrollend'));
  expect(state.list.dataset.requestListScrolling).toBeUndefined();
});

it('pauses background decoration independently of scrolling and clears observers and flags',()=>{
  useRequestListMotion([]);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));
  expect(state.list.dataset.requestListHidden).toBe('true');
  expect(state.list.dataset.requestListScrolling).toBeUndefined();
  scroller.dispatchEvent(new Event('scroll'));scroller.dispatchEvent(new Event('scrollend'));
  expect(state.list.dataset.requestListHidden).toBe('true');
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));
  expect(state.list.dataset.requestListHidden).toBeUndefined();
  observe([{target:cards[0],isIntersecting:false,intersectionRatio:0}]);
  expect(cards[0].dataset.requestMotion).toBe('idle');
  state.cleanup?.();state.cleanup=undefined;
  expect(disconnect).toHaveBeenCalledOnce();expect(state.list.dataset).toEqual({});
  expect(cards.map(card=>card.dataset)).toEqual([{},{}]);
  scroller.dispatchEvent(new Event('scroll'));doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));
  expect(state.list.dataset).toEqual({});
});
