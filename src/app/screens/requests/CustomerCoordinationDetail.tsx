import {useState,type ReactNode,type RefObject} from 'react';
import {Check,ChevronRight,MoreHorizontal,LockKeyhole} from 'lucide-react';
import WhatsAppMark from './WhatsAppMark';
import type {AcceptedSummary} from './CoordinationSheets';
const day=(iso:string)=>new Date(iso).toLocaleDateString('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'short'});

export default function CustomerCoordinationDetail({motionRef,accepted,name,acceptedAt,authorized,phase,canOpen,canAuthorize,busy,recovery,error,onAuthorize,onOpen,onConditions,onUpdate,options}:{
  motionRef:RefObject<HTMLElement|null>;accepted:AcceptedSummary;name:string;acceptedAt?:string|null;authorized:boolean;
  phase:string;canOpen:boolean;canAuthorize:boolean;busy:boolean;recovery?:ReactNode;error?:string;onAuthorize:()=>void;onOpen:()=>void;onConditions:()=>void;onUpdate:()=>void;options:ReactNode;
}){
  const [more,setMore]=useState(false);
  return <article ref={motionRef} className="zipco-customer-coordination-detail" data-coordination-embedded="true" data-coordination-role="customer">
    <div className="zipco-customer-coordination-products">{accepted.subjectSnapshot.items.map((item,i)=><div key={i}>
      <span>{item.quantity}×</span><b>{item.nameSnapshot}</b><strong>{'$'+item.subtotalClp.toLocaleString('es-CL')}</strong>
    </div>)}<small>Coordinando</small></div>
    <ol className="zipco-customer-coordination-steps" aria-label="Pasos de coordinación">
      <li data-done="true"><span><Check size={17}/></span><b>Aceptado</b>{acceptedAt&&<small>{day(acceptedAt)}</small>}</li>
      <li data-done={authorized}><span>{authorized?<Check size={17}/>:<LockKeyhole size={15}/>}</span><b>{authorized?'Autorizada':'Autorizar'}</b><small>{authorized?'Confirmada':'Pendiente'}</small></li>
      <li data-current={authorized}><span><WhatsAppMark className="h-4 w-4"/></span><b>WhatsApp</b><small>{canOpen?'Ahora':'Pendiente'}</small></li>
    </ol>
    <p>Acuerda pago y entrega con {name}. <b>ZIPCO no recibe ni verifica pagos.</b></p>
    {error&&<p role="alert">{error}</p>}
    {recovery||<button type="button" className="zipco-customer-coordination-open" disabled={busy||phase==='loading'||authorized&&!canOpen||!authorized&&!canAuthorize}
      onClick={authorized?onOpen:onAuthorize}><WhatsAppMark className="h-5 w-5"/>{phase==='loading'?'Preparando WhatsApp…':phase==='requesting'?'Autorizando contacto…':authorized?'Iniciar coordinación por WhatsApp':'Autorizo iniciar coordinación'}</button>}
    {!recovery&&(authorized&&!canOpen||!authorized&&!canAuthorize)&&<button type="button" className="zipco-customer-coordination-open" disabled={busy} onClick={onUpdate}>Actualizar estado del contacto</button>}
    <div className="zipco-customer-coordination-controls">
      <button type="button" aria-haspopup="dialog" onClick={onConditions}><Check size={15}/>Condiciones aceptadas<ChevronRight size={14}/></button>
      <button type="button" aria-expanded={more} onClick={()=>setMore(v=>!v)}><MoreHorizontal size={18}/>Más opciones</button>
    </div>
    {more&&<div className="zipco-customer-coordination-options">{options}<p>ZIPCO no procesa ni verifica pagos.</p></div>}
  </article>;
}
