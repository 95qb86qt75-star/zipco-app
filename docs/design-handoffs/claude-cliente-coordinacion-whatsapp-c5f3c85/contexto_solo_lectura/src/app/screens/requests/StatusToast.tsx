import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,Clock3,X} from 'lucide-react';
import {getStatusToast,hideStatusToast,subscribeStatusToast,type StatusToastItem} from './statusToast.ts';
import {readCoordinationSession,subscribeCoordinationSession} from './coordinationSession';
import './status-toast.css';
const DURATION=4500;
/** One instance at app layout; the coordinator supplies verified destinations. */
export default function StatusToast(){
 const[item,setItem]=useState<StatusToastItem|null>(getStatusToast);
 useEffect(()=>subscribeStatusToast(setItem),[]);
 useEffect(()=>subscribeCoordinationSession(()=>{if(item&&item.session!==readCoordinationSession())hideStatusToast(item.key);}),[item]);
 useEffect(()=>{if(!item)return;const t=window.setTimeout(()=>{if(hideStatusToast(item.key))item.onDismiss?.();},DURATION);return()=>window.clearTimeout(t);},[item]);
 if(!item||item.session!==readCoordinationSession())return null;
 const tone=item.tone??'green';
 const dismiss=()=>{if(hideStatusToast(item.key))item.onDismiss?.();};
 return createPortal(<div key={item.key} className="zipco-toast" data-tone={tone} role="status" aria-live="polite">
   <span className="zipco-toast-icon" aria-hidden="true">{tone==='green'?<Check size={18} strokeWidth={3}/>:<Clock3 size={18}/>}</span>
   <div className="zipco-toast-text"><b>{item.title}</b><small>{item.line}</small></div>
   {item.onAction&&<button type="button" className="zipco-toast-action" onClick={()=>{if(getStatusToast()?.key!==item.key)return;item.onAction?.();hideStatusToast(item.key);}}>{item.actionLabel??'Ver'}</button>}
   <button type="button" className="zipco-toast-close" aria-label="Cerrar aviso" onClick={dismiss}><X size={14}/></button>
   <i className="zipco-toast-bar" style={{animationDuration:DURATION+'ms'}}/>
 </div>,document.body);
}
