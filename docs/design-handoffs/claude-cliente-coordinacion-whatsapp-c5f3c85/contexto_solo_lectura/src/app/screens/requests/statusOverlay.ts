import {useEffect,useRef} from 'react';
import {readCoordinationSession} from './coordinationSession';
const overlays=new Map<object,ReturnType<typeof readCoordinationSession>>(),listeners=new Set<()=>void>();
export function setStatusOverlay(owner:object,visible:boolean){
  if(visible)overlays.set(owner,readCoordinationSession());else overlays.delete(owner);
  listeners.forEach(listener=>listener());
}
export function statusOverlayVisible(){const session=readCoordinationSession();return [...overlays.values()].some(value=>value===session);}
export function subscribeStatusOverlay(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
/** Presentation only: no mutation, navigation or server event. */
export function useStatusOverlay(visible=true){
  const owner=useRef({});
  useEffect(()=>{if(visible)setStatusOverlay(owner.current,true);return()=>setStatusOverlay(owner.current,false);},[visible]);
}
