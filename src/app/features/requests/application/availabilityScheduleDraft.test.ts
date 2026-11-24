import {afterEach,it,expect,vi} from 'vitest';
import {scheduleProcess} from '../fixtures/availabilityScheduleFixtures';
import {saveScheduleDraft,readScheduleDraft,scheduleDraftSlot,type AvailabilityScheduleDraft} from './availabilityScheduleDraft';
afterEach(()=>vi.unstubAllGlobals());
it('preserves editable choices only for the same participant and origin, without restoring consent',()=>{
  const store=new Map(),p=scheduleProcess(),slot=scheduleDraftSlot('one',p,false);
  vi.stubGlobal('sessionStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)});
  const draft:AvailabilityScheduleDraft={date:'2099-11-24',time:'14:00',note:'Mi nota',decision:'CONFIRM_REQUESTED_SCHEDULE',mode:'PREPAYMENT',amount:'2500',message:'Retira en esa fecha',address:'Local',contact:true};
  saveScheduleDraft(slot,p,draft);expect(readScheduleDraft(slot,p)).toEqual(draft);
  expect(readScheduleDraft(scheduleDraftSlot('two',p,false),p)).toEqual({});
  expect(readScheduleDraft(slot,{...p,version:9})).toEqual({});
  expect(readScheduleDraft(slot,{...p,currentProposalId:999})).toEqual({});
  expect(store.get(slot)).not.toContain('accepted');expect(store.get(slot)).not.toContain('token');
});
it('does not prevent editing if optional draft storage is unavailable',()=>{
  vi.stubGlobal('sessionStorage',{getItem:()=>{throw Error('Denied');}});expect(readScheduleDraft('slot',scheduleProcess())).toEqual({});
});
