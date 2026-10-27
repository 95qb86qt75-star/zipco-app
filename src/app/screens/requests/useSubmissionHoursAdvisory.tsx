import {useEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {HoursAdvisoryError,readSubmissionAdvisory,hoursWhen,type SubmissionAdvisory} from './serviceHoursAdvisory';

// Drafts remain only in this tab's memory and are scoped to credentials/business.
const drafts=new Map<string,unknown>();
export const hoursDraftKey=(kind:string,id:number)=>JSON.stringify([kind,localStorage.getItem('zipco-token'),localStorage.getItem('zipco-user-id'),id]);
export const readHoursDraft=<T,>(key:string)=>drafts.get(key) as T|undefined;
export function saveHoursDraft(key:string,value:unknown){if(drafts.size>=20)drafts.delete(drafts.keys().next().value!);drafts.set(key,value);}
export const clearHoursDraft=(key:string)=>{drafts.delete(key);};

export default function useSubmissionHoursAdvisory(onAlternative:()=>void,onExpired:()=>void){
  const [pending,setPending]=useState<{id:number;token:string;advisory:SubmissionAdvisory|null;failed:boolean;checking:boolean;blockedMessage?:string}|null>(null);
  const readSequence=useRef(0);
  const job=useRef<{resolve:(v:boolean)=>void;id:number;token:string;controller:AbortController}|null>(null);
  const finish=(value:boolean)=>{const current=job.current;job.current=null;current?.controller.abort();setPending(null);current?.resolve(value&&localStorage.getItem('zipco-token')===current.token);};
  const inspect=async()=>{
    const current=job.current;if(!current)return;
    const sequence=++readSequence.current;
    setPending({id:current.id,token:current.token,advisory:null,failed:false,checking:true});
    try{
      const advisory=await readSubmissionAdvisory(current.id,current.token,current.controller.signal);
      if(job.current!==current||current.controller.signal.aborted||sequence!==readSequence.current||document.visibilityState==='hidden')return;
      if(localStorage.getItem('zipco-token')!==current.token){finish(false);return;}
      if(advisory.status!=='OUTSIDE_SERVICE_HOURS'){finish(true);return;}
      setPending({id:current.id,token:current.token,advisory,failed:false,checking:false});
    }catch(e){
      if(job.current!==current||current.controller.signal.aborted||sequence!==readSequence.current)return;
      if(localStorage.getItem('zipco-token')!==current.token){finish(false);return;}
      if(e instanceof HoursAdvisoryError&&[401,403,404].includes(e.status)){
        finish(false);if(e.status===401)onExpired();else setPending({id:current.id,token:current.token,advisory:null,failed:true,checking:false,blockedMessage:e.message});
        return;
      }
      setPending({id:current.id,token:current.token,advisory:null,failed:true,checking:false});
    }
  };
  useEffect(()=>()=>{const current=job.current;job.current=null;current?.controller.abort();current?.resolve(false);},[]);
  useEffect(()=>{
    const resume=()=>{if(document.visibilityState==='visible'&&job.current)void inspect();};
    document.addEventListener('visibilitychange',resume);return()=>document.removeEventListener('visibilitychange',resume);
  });
  const check=(id:number,token:string)=>{
    if(job.current)return Promise.resolve(false);
    return new Promise<boolean>(resolve=>{job.current={id,token,resolve,controller:new AbortController()};void inspect();});
  };
  const a=pending?.advisory;
  const dialog=<Dialog.Root open={!!pending} onOpenChange={open=>{if(!open)finish(false);}}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[1800] bg-black/50 backdrop-blur-sm"/>
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[1801] max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl bg-white p-5 text-slate-950">
      <Dialog.Title className="text-lg font-bold">{pending?.checking?'Revisando horario':a?'Fuera del horario informado':'Horario no disponible'}</Dialog.Title>
      <Dialog.Description className="mt-3 text-sm">{pending?.blockedMessage??(pending?.checking?'Estamos consultando el horario informado del negocio.':a?`Estás enviando una solicitud fuera del horario informado de ${a.businessName}. Podrías recibir respuesta durante su próximo horario de atención.`:'No pudimos determinar el horario informado. No sabemos si el negocio está atendiendo.')}</Dialog.Description>
      {a?.todayWindow&&<p className="mt-2 text-sm">Horario informado: {hoursWhen(a.todayWindow.opensAt)} a {hoursWhen(a.todayWindow.closesAt)}.</p>}
      {a?.nextWindow&&<p className="mt-2 text-sm">Próxima apertura informada: {hoursWhen(a.nextWindow.opensAt)}.</p>}
      {!pending?.checking&&job.current&&<>
        {pending?.failed&&<button type="button" className="mt-4 w-full rounded-xl border p-3 font-bold" onClick={()=>void inspect()}>Reintentar consulta</button>}
        <button type="button" className="mt-4 w-full rounded-xl bg-teal-700 p-3 font-bold text-white" onClick={()=>finish(true)}>{a?'Enviar de todas formas':'Enviar sin verificar el horario'}</button>
      </>}
      <button type="button" className="mt-3 w-full rounded-xl border p-3 font-bold" onClick={()=>{const sameSession=pending?.token===localStorage.getItem('zipco-token');finish(false);if(sameSession)onAlternative();}}>Prefiero buscar otra opción</button>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
  return {check,dialog};
}
