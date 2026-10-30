import {beforeEach,afterEach,expect,it,vi} from 'vitest';
let api:typeof import('./statusToast.ts'),identity:Map<string,string>;
beforeEach(async()=>{
 vi.resetModules();identity=new Map([['zipco-user-id','12'],['zipco-token','synthetic'],['zipco-business-id','1']]);
 vi.stubGlobal('localStorage',{getItem:(key:string)=>identity.get(key)??null});api=await import('./statusToast.ts');
});
afterEach(()=>vi.unstubAllGlobals());
it('replaces a notice and ignores a stale dismissal from the previous timer',()=>{
 const first=api.showStatusToast({title:'First',line:'Saved',onAction:vi.fn()})!;
 const second=api.showStatusToast({title:'Second',line:'Verified',tone:'amber'})!;
 expect(api.hideStatusToast(first)).toBe(false);expect(api.getStatusToast()?.key).toBe(second);
 expect(api.hideStatusToast(second)).toBe(true);expect(api.getStatusToast()).toBeNull();
});
it('replays the current notice once to a layout subscriber mounted after presentation',()=>{
 api.showStatusToast({title:'Verified',line:'Read current'});const listener=vi.fn(),off=api.subscribeStatusToast(listener);
 expect(listener).toHaveBeenCalledTimes(1);expect(listener.mock.calls[0][0]).toMatchObject({title:'Verified'});
 off();api.hideStatusToast();expect(listener).toHaveBeenCalledTimes(1);
});
it('never exposes an old notice to another session or shows one without a session',()=>{
 api.showStatusToast({title:'Private',line:'Old session'});identity.set('zipco-token','replacement');
 expect(api.getStatusToast()).toBeNull();identity.delete('zipco-token');
 expect(api.showStatusToast({title:'Not authenticated',line:'Hidden'})).toBeUndefined();expect(api.getStatusToast()).toBeNull();
});
