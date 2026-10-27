import {useEffect,useState} from 'react';
import {readResponseAdvisory,responseHoursText,hoursWhen,type ResponseAdvisory} from './serviceHoursAdvisory';
export default function BusinessResponseHoursNotice({businessId,date,time,active=true}:{businessId?:number|null;date?:string|null;time?:string|null;active?:boolean}){
  const [value,setValue]=useState<ResponseAdvisory|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!active||!businessId)return;
    const token=localStorage.getItem('zipco-token');if(!token)return;
    const controller=new AbortController();let sequence=0;setValue(null);setFailed(false);
    const load=()=>{if(document.visibilityState==='hidden')return;const current=++sequence;void readResponseAdvisory(businessId,token,date&&time?{date,time}:undefined,controller.signal).then(v=>{if(current===sequence&&!controller.signal.aborted&&localStorage.getItem('zipco-token')===token){setValue(v);setFailed(false);}}).catch(e=>{if(current===sequence&&!controller.signal.aborted&&localStorage.getItem('zipco-token')===token){setValue(null);setFailed(true);if(e.status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));}});};
    load();document.addEventListener('visibilitychange',load);
    return()=>{controller.abort();document.removeEventListener('visibilitychange',load);};
  },[active,businessId,date,time,retry]);
  const text=value?responseHoursText(value):failed?'No pudimos determinar el horario informado. Puedes continuar.':null;
  if(!active||!text)return null;
  const window=value?.requested?.advisory.todayWindow??value?.current.todayWindow;
  return <aside role="note" data-response-hours className="my-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
    <p>{text}</p>{window&&<p className="mt-1">Horario informado: {hoursWhen(window.opensAt)} a {hoursWhen(window.closesAt)}.</p>}
    {failed&&<button type="button" className="mt-2 font-bold underline" onClick={()=>setRetry(v=>v+1)}>Revisar horario</button>}
  </aside>;
}
