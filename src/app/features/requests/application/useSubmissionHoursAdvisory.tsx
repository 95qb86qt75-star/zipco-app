import * as React from 'react';
import {useEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {hoursWhen} from '../api/serviceHoursAdvisory';
import {readRequestedMomentAdvisory,RequestedHoursError,requestedHoursMessage,sameRequestedMoment,type RequestedMoment,type RequestedMomentAdvisory} from '../api/requestedMomentAdvisory';

// Drafts remain only in this tab's memory and are scoped to credentials/business.
const drafts=new Map<string,unknown>();
export const hoursDraftKey=(kind:string,id:number)=>JSON.stringify([kind,localStorage.getItem('zipco-token'),localStorage.getItem('zipco-user-id'),id]);
export const readHoursDraft=<T,>(key:string)=>drafts.get(key) as T|undefined;
export function saveHoursDraft(key:string,value:unknown){if(drafts.size>=20)drafts.delete(drafts.keys().next().value!);drafts.set(key,value);}
export const clearHoursDraft=(key:string)=>{drafts.delete(key);};
export function focusSubmissionSchedule(node:HTMLElement|null){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(node?.isConnected){node.scrollIntoView({block:'center'});node.focus({preventScroll:true});}}));
}
type Context={businessId:number;key:string;selection:()=>RequestedMoment};
type Pending={advisory:RequestedMomentAdvisory|null;checking:boolean;message?:string;canContinue:boolean};
type Job={resolve:(v:boolean)=>void;id:number;token:string;user:string|null;selection:RequestedMoment;key:string;controller?:AbortController};

export default function useSubmissionHoursAdvisory(onChooseSchedule:()=>void,onExpired:()=>void,context:Context){
  const [pending,setPending]=useState<Pending|null>(null);
  const latest=useRef({context,onChooseSchedule,onExpired});latest.current={context,onChooseSchedule,onExpired};
  const job=useRef<Job|null>(null),sequence=useRef(0);
  const current=(value:Job)=>{
    if(job.current!==value||localStorage.getItem('zipco-token')!==value.token||localStorage.getItem('zipco-user-id')!==value.user||
      latest.current.context.businessId!==value.id||latest.current.context.key!==value.key)return false;
    try{return sameRequestedMoment(latest.current.context.selection(),value.selection);}catch{return false;}
  };
  const finish=(proceed:boolean)=>{
    const captured=job.current,valid=!!captured&&current(captured);
    job.current=null;sequence.current++;captured?.controller?.abort();setPending(null);captured?.resolve(proceed&&valid);
  };
  const inspect=async()=>{
    const captured=job.current;if(!captured)return;
    if(!current(captured)){finish(false);return;}
    captured.controller?.abort();const controller=new AbortController();captured.controller=controller;
    const read=++sequence.current;
    const timer=setTimeout(()=>controller.abort(),10000);
    setPending({advisory:null,checking:true,canContinue:false});
    try{
      const advisory=await readRequestedMomentAdvisory(captured.id,captured.token,captured.selection,controller.signal);
      if(job.current!==captured||sequence.current!==read)return;
      if(!current(captured)){finish(false);return;}
      if(document.visibilityState==='hidden')return;
      if(advisory.status!=='OUTSIDE_SERVICE_HOURS'){finish(true);return;}
      setPending({advisory,checking:false,canContinue:true});
    }catch(error){
      if(job.current!==captured||sequence.current!==read)return;
      if(!current(captured)){finish(false);return;}
      if(error instanceof RequestedHoursError&&error.status===401){finish(false);latest.current.onExpired();return;}
      const blocked=error instanceof RequestedHoursError&&([400,403,404].includes(error.status)||error.code==='ADVISORY_CONTRACT_MISMATCH');
      setPending({advisory:null,checking:false,canContinue:!blocked,
        message:blocked?(error as Error).message:'No pudimos comprobar el horario solicitado. Puedes reintentar o enviar sin verificarlo.'});
    }finally{clearTimeout(timer);}
  };
  useEffect(()=>{if(job.current&&!current(job.current))finish(false);},[context.businessId,context.key]);
  useEffect(()=>{
    const resume=()=>{if(document.visibilityState==='visible'&&job.current)void inspect();};
    const changed=()=>{if(job.current&&!current(job.current))finish(false);};
    document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);
    window.addEventListener('storage',changed);window.addEventListener('zipco-session-changed',changed);
    return()=>{document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);
      window.removeEventListener('storage',changed);window.removeEventListener('zipco-session-changed',changed);
      const captured=job.current;job.current=null;sequence.current++;captured?.controller?.abort();captured?.resolve(false);};
  },[]);
  const check=(id:number,token:string,selection:RequestedMoment)=>{
    if(job.current)return Promise.resolve(false);
    return new Promise<boolean>(resolve=>{
      job.current={id,token,user:localStorage.getItem('zipco-user-id'),selection:{...selection},key:latest.current.context.key,resolve};void inspect();
    });
  };
  const chooseSchedule=()=>{
    const captured=job.current,sameSession=!!captured&&localStorage.getItem('zipco-token')===captured.token&&localStorage.getItem('zipco-user-id')===captured.user;
    finish(false);if(sameSession)latest.current.onChooseSchedule();
  };
  const advisory=pending?.advisory;
  const dialog=<Dialog.Root open={!!pending} onOpenChange={open=>{if(!open)finish(false);}}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[1800] bg-black/50 backdrop-blur-sm"/>
    <Dialog.Content aria-busy={pending?.checking} className="fixed left-1/2 top-1/2 z-[1801] max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl bg-white p-5 text-slate-950">
      <Dialog.Title className="text-lg font-bold">{pending?.checking?'Revisando horario':advisory?'Fuera del horario informado':'Revisar horario solicitado'}</Dialog.Title>
      <Dialog.Description className="mt-3 text-sm">{pending?.checking?'Estamos consultando el horario para el momento que elegiste.':advisory?requestedHoursMessage(advisory):pending?.message}</Dialog.Description>
      {advisory?.mode==='SCHEDULED'&&<p className="mt-2 text-sm">Solicitado para: {hoursWhen(advisory.evaluatedAt)} · Hora de Chile.</p>}
      {advisory?.dayWindow&&<p className="mt-2 text-sm">Horario del día: {hoursWhen(advisory.dayWindow.opensAt)} a {hoursWhen(advisory.dayWindow.closesAt)}.</p>}
      {advisory?.nextWindow&&<p className="mt-2 text-sm">Próxima apertura informada: {hoursWhen(advisory.nextWindow.opensAt)}.</p>}
      {!pending?.checking&&job.current&&<>
        {!advisory&&<button type="button" className="mt-4 min-h-11 w-full rounded-xl border p-3 font-bold" onClick={()=>void inspect()}>Reintentar consulta</button>}
        {pending?.canContinue&&<button type="button" className="mt-4 min-h-11 w-full rounded-xl bg-teal-700 p-3 font-bold text-white" onClick={()=>finish(true)}>{advisory?'Enviar de todas formas':'Enviar sin verificar el horario'}</button>}
      </>}
      <button type="button" className="mt-3 min-h-11 w-full rounded-xl border p-3 font-bold" onClick={chooseSchedule}>Buscar otro horario</button>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
  return {check,dialog};
}
