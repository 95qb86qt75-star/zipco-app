import { useCallback, useEffect, useRef, useState } from 'react';
import { readCoordinationSession, subscribeCoordinationSession } from '../screens/requests/coordinationSession';
import { observationApi, ObservationError, sanitizeObservationSession, type ObservationSession } from './qaPushObservationApi';

const storageKey='zipco-qa-push-observation-session-v1';
const restore = () => {
  try {
    const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
    const session=readCoordinationSession();
    if(saved?.owner===session?.userId){
      const clean=sanitizeObservationSession(saved.session);
      if(clean&&Date.parse(clean.expiresAt)>Date.now())return clean;
    }
  }catch{/* Storage is optional. */}
  return null;
};

export default function QaPushObservationPanel({ active }: { active:boolean }) {
  const [session,setSession]=useState<ObservationSession|null>(restore);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const [polling,setPolling]=useState(true),[visible,setVisible]=useState(document.visibilityState==='visible');
  const pending=useRef<AbortController|null>(null),generation=useRef(0),mounted=useRef(true);
  const sessionRef=useRef(session);sessionRef.current=session;
  const owner=useRef(readCoordinationSession());
  const persist = useCallback((value:ObservationSession|null) => {
    sessionRef.current=value;setSession(value);
    try {
      if(value)sessionStorage.setItem(storageKey,JSON.stringify({owner:readCoordinationSession()?.userId,session:value}));
      else sessionStorage.removeItem(storageKey);
    }catch{/* Do not send anything to recover browser storage. */}
  },[]);
  useEffect(()=>{
    mounted.current=true;
    const check=()=>{
      const current=readCoordinationSession();
      if(owner.current!==current){
        owner.current=current;generation.current++;pending.current?.abort();pending.current=null;
        setBusy(false);persist(null);setError('');setStatus('');setPolling(false);
      }
    };
    const unsubscribe=subscribeCoordinationSession(check);
    const visibility=()=>setVisible(document.visibilityState==='visible');
    document.addEventListener('visibilitychange',visibility);
    return()=>{mounted.current=false;generation.current++;pending.current?.abort();unsubscribe();document.removeEventListener('visibilitychange',visibility);};
  },[persist]);

  const operate=useCallback(async(kind:'open'|'read'|'stop')=>{
    const credentials=readCoordinationSession(),current=sessionRef.current;
    if(!credentials){setError('Inicia sesión para usar el diagnóstico remoto.');return false;}
    if(pending.current||kind!=='open'&&!current)return false;
    if(kind==='read'&&current&&Date.parse(current.expiresAt)<=Date.now()){
      setPolling(false);setError('La sesión venció. No se puede concluir que faltara un clic.');return false;
    }
    const controller=new AbortController(),version=generation.current;
    pending.current=controller;setBusy(true);setError('');setStatus('');
    try{
      const value=kind==='open'?await observationApi.open(credentials.token,controller.signal):kind==='read'
        ?await observationApi.read(credentials.token,current!.sessionId,controller.signal):await observationApi.stop(credentials.token,current!.sessionId,controller.signal);
      if(!mounted.current||version!==generation.current||readCoordinationSession()!==credentials)return false;
      persist(value);setPolling(kind!=='stop');
      setStatus(kind==='stop'?'Observación detenida y comprobantes revocados.':kind==='open'?'Esperando el próximo aviso legítimo. No se envió ninguna notificación.':'Diagnóstico remoto actualizado.');
      return true;
    }catch(cause){
      if(!controller.signal.aborted&&mounted.current&&version===generation.current){
        setPolling(false);setError(cause instanceof ObservationError?cause.message:'No se confirmó la operación. No se reintentó.');
      }
      return false;
    }finally{if(pending.current===controller){pending.current=null;if(mounted.current)setBusy(false);}}
  },[persist]);

  useEffect(()=>{
    if(!active||!visible||!session?.sessionId||!polling){pending.current?.abort();return;}
    let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,reads=0;
    const tick=async()=>{
      if(stopped)return;
      if(!await operate('read')||stopped)return;
      if(++reads>=6){setPolling(false);setStatus('Actualización automática finalizada. Puedes consultar manualmente.');return;}
      timer=setTimeout(()=>void tick(),10000);
    };
    // A mutation already in flight owns its request; polling starts afterwards.
    timer=setTimeout(()=>void tick(),10000);
    return()=>{stopped=true;clearTimeout(timer);pending.current?.abort();};
  },[active,visible,session?.sessionId,polling,operate]);

  return <section className="mt-3 space-y-2 rounded border border-sky-300 p-3" aria-label="Observación remota push QA">
    <h4 className="font-bold">Observación remota push QA</h4>
    <p className="text-xs">Activación voluntaria durante una hora. Observa los próximos avisos legítimos; no envía notificaciones ni cambia pedidos. Los datos viven en una sola instancia de backend y se pierden al reiniciarla o desplegar.</p>
    {!session?<button type="button" disabled={busy} className="min-h-11 rounded border px-3" onClick={()=>void operate('open')}>Observar próximo aviso legítimo</button>:<>
      <p className="text-xs">{session.state==='OBSERVING'?'Observando entregas':'Esperando un aviso legítimo'} · vence {new Date(session.expiresAt).toLocaleTimeString('es-CL')} · {session.deliveries.length}/20 entregas</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} className="min-h-11 rounded border px-3" onClick={()=>void operate('read')}>Consultar ahora</button>
        <button type="button" disabled={busy} className="min-h-11 rounded border px-3" onClick={()=>void operate('stop')}>Detener y revocar</button>
        <button type="button" className="min-h-11 rounded border px-3" onClick={()=>{
          void navigator.clipboard.writeText(JSON.stringify(sanitizeObservationSession(session),null,2)).then(()=>setStatus('Diagnóstico remoto copiado sin comprobantes ni credenciales.')).catch(()=>setStatus('No se pudo copiar.'));
        }}>Copiar diagnóstico remoto</button>
      </div>
      <p className="text-xs">La ausencia de una etapa puede deberse a red, vencimiento o pérdida de la sesión; no demuestra por sí sola que faltó el clic.</p>
      {session.deliveries.map(delivery=><div key={delivery.traceId} className="rounded border p-2 text-xs">
        <b>QA {delivery.traceId.slice(0,8)}</b>
        <ol>{delivery.events.map((event,i)=><li key={i}>{event.stage} · {event.source==='server'?'servidor':'reportado por cliente'} · {new Date(event.receivedAt).toLocaleTimeString('es-CL')}</li>)}</ol>
      </div>)}
    </>}
    {busy&&<p role="status">Consultando diagnóstico…</p>}
    {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
    {status&&<p role="status" className="text-xs">{status}</p>}
  </section>;
}
