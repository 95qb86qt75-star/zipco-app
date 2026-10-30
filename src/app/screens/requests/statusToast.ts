import {readCoordinationSession} from './coordinationSession';
export type StatusToastTone='green'|'amber'|'rose';
export type StatusToastInput={title:string;line:string;tone?:StatusToastTone;actionLabel?:string;onAction?:()=>void;onDismiss?:()=>void};
export type StatusToastItem=StatusToastInput&{key:number;session:NonNullable<ReturnType<typeof readCoordinationSession>>};
type Listener=(item:StatusToastItem|null)=>void;
const listeners=new Set<Listener>();let seq=0,current:StatusToastItem|null=null;
export function getStatusToast(){return current?.session===readCoordinationSession()?current:null;}
/** Local presentation only, after the verified action and its exit animation. */
export function showStatusToast(input:StatusToastInput){
 const session=readCoordinationSession();if(!session)return;
 current={...input,key:++seq,session};listeners.forEach(l=>l(current));return current.key;
}
/** A stale timer/action cannot dismiss a replacement notice. */
export function hideStatusToast(key?:number){if(key!==undefined&&current?.key!==key)return false;current=null;listeners.forEach(l=>l(null));return true;}
export function subscribeStatusToast(l:Listener){listeners.add(l);l(getStatusToast());return()=>{listeners.delete(l);};}
