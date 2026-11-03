import * as React from 'react';
import {createContext,useContext,useState,type ReactNode,type RefObject} from 'react';
import {Check,CircleCheck,ChevronRight,ChevronUp,MoreHorizontal,LockKeyhole} from 'lucide-react';
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import type { AcceptedSummary } from "../../../shared/conditions/CoordinationSheets";
import { CustomerCoordinationDisclosure } from "./customerCoordinationDisclosure";
import { DetailReveal } from "../../shared/layout/DetailReveal";
/** «Falta coordinar»: lo entrega CustomerCoordinationQuestionCard (modo declined, según quién respondió) y este detalle lo dibuja bajo el recorrido. */
export const CustomerDeclinedNote=createContext<ReactNode>(null);
const day=(iso:string)=>new Date(iso).toLocaleDateString('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'short'}).replace('.','');

/** Detalle compacto del cliente (diseño aprobado: detalle A). Se despliega dentro de la tarjeta; sin cambios de lógica. */
export default function CustomerCoordinationDetail({motionRef,accepted,name,acceptedAt,authorized,phase,canOpen,canAuthorize,busy,recovery,error,onAuthorize,onOpen,onConditions,onUpdate,options}:{
  motionRef:RefObject<HTMLElement|null>;accepted:AcceptedSummary;name:string;acceptedAt?:string|null;authorized:boolean;
  phase:string;canOpen:boolean;canAuthorize:boolean;busy:boolean;recovery?:ReactNode;error?:string;onAuthorize:()=>void;onOpen:()=>void;onConditions:()=>void;onUpdate:()=>void;options:ReactNode;
}){
  const [more,setMore]=useState(false);
  const disclosure=useContext(CustomerCoordinationDisclosure),note=useContext(CustomerDeclinedNote);
  const accepted_day=acceptedAt?day(acceptedAt):'';
  const waiting=phase==='loading'||phase==='requesting';
  const openLabel=phase==='loading'?'Preparando WhatsApp…':phase==='requesting'?'Autorizando contacto…':authorized?(disclosure?'Abrir WhatsApp':'Iniciar coordinación por WhatsApp'):(disclosure?'Autorizo iniciar coordinación':'Autorizo iniciar coordinación');
  const openControl=<>{recovery||<button type="button" className="zipco-customer-coordination-open" disabled={busy||phase==='loading'||authorized&&!canOpen||!authorized&&!canAuthorize}
      onClick={authorized?onOpen:onAuthorize}><WhatsAppMark className="h-5 w-5"/>{disclosure?<span className="zipco-customer-declined-open-text"><span>{openLabel}</span>{!waiting&&<small>{authorized?'Acuerda pago y entrega con el negocio':'Comparte tu teléfono solo para este pedido'}</small>}</span>:openLabel}{disclosure&&(waiting||busy)&&<span className="zipco-customer-declined-spin" aria-hidden="true"/>}</button>}
    {!recovery&&(authorized&&!canOpen||!authorized&&!canAuthorize)&&<button type="button" className={'zipco-customer-coordination-open'+(disclosure?' zipco-customer-declined-update':'')} disabled={busy} onClick={onUpdate}>Actualizar estado del contacto</button>}</>;
  const items=accepted.subjectSnapshot.items;
  const optionsId='zipco-customer-options-'+accepted.requestProcessId;
  // Saved negative: route and note stay visible; the single detail card (conditions, steps, footer) is the folded part.
  const declinedCard=disclosure?<>
    <section className="zipco-customer-declined-card" aria-label="Pasos del pedido">
      <button type="button" className="zipco-customer-conditions zipco-customer-declined-cond" aria-haspopup="dialog" onClick={onConditions}><span className="ic"><CircleCheck size={16} aria-hidden="true"/></span><span className="tx"><b>Condiciones aceptadas</b><small>Revisa el acuerdo de este pedido</small></span><span className="go"><ChevronRight size={15} strokeWidth={2.8} aria-hidden="true"/></span></button>
      {items.length>1&&<div className="zipco-customer-declined-products">{items.map((item,i)=><div key={i}>
        <span>{item.quantity}×</span><b>{item.nameSnapshot}</b><strong>{'$'+item.subtotalClp.toLocaleString('es-CL')}</strong>
        {i===0&&<em>Por coordinar</em>}
      </div>)}</div>}
      <ol className="zipco-customer-declined-steps">
        <li data-done="true"><span><Check size={12} strokeWidth={3.4}/></span><div><b>Aceptado</b>{accepted_day&&<small>{accepted_day}</small>}</div></li>
        <li data-done={authorized} data-current={!authorized}><span>{authorized?<Check size={12} strokeWidth={3.4}/>:<LockKeyhole size={12}/>}</span><div><b>{authorized?'Autorizada':'Autorizar'}</b><small>{authorized?'Confirmada':'Pendiente'}</small></div></li>
        <li data-current={authorized} data-live={canOpen&&phase==='ready'&&!busy&&!recovery}><span><WhatsAppMark className="h-3.5 w-3.5"/></span><div><b>WhatsApp</b><small>{canOpen?'Ahora':'Pendiente'}</small></div></li>
      </ol>
      <p className="zipco-customer-declined-agree">Acuerda pago y entrega con {name}. <b>ZIPCO no recibe ni verifica pagos.</b></p>
    </section>
    <div className="zipco-customer-declined-foot">
      <p>ZIPCO no procesa ni verifica pagos.</p>
      <button type="button" className="zipco-customer-declined-more" aria-expanded={more} aria-controls={optionsId} onClick={()=>setMore(v=>!v)}><MoreHorizontal size={16} strokeWidth={2.6} aria-hidden="true"/>Más opciones<ChevronUp size={13} strokeWidth={2.6} aria-hidden="true"/></button>
    </div>
    {/* Mismo plegado animado con inert; las opciones reales siguen montadas (conservan formularios y errores al plegar). */}
    <div ref={el=>{if(el)el.inert=!more;}} className="zipco-customer-coordination-fold zipco-customer-declined-fold" data-open={more} aria-hidden={!more}><div className="zipco-customer-coordination-fold-in">
      <div id={optionsId} className="zipco-customer-coordination-options zipco-customer-declined-options">{options}</div>
    </div></div>
  </>:null;
  const details=<>
    <div className="zipco-customer-coordination-products">{accepted.subjectSnapshot.items.map((item,i)=><div key={i}>
      <span>{item.quantity}×</span><b>{item.nameSnapshot}</b><strong>{'$'+item.subtotalClp.toLocaleString('es-CL')}</strong>
      {i===0&&<em>{disclosure?'Por coordinar':'Coordinando'}</em>}
    </div>)}</div>
    <ol className="zipco-customer-coordination-steps" aria-label="Pasos de coordinación">
      <li data-done="true"><span><Check size={13} strokeWidth={3.4}/></span><b>Aceptado</b>{accepted_day&&<small>{accepted_day}</small>}</li>
      <li data-done={authorized}><span>{authorized?<Check size={13} strokeWidth={3.4}/>:<LockKeyhole size={12}/>}</span><b>{authorized?'Autorizada':'Autorizar'}</b><small>{authorized?'Confirmada':'Pendiente'}</small></li>
      <li data-current={authorized} data-live={canOpen&&phase==='ready'&&!busy&&!recovery}><span><WhatsAppMark className="h-3.5 w-3.5"/></span><b>WhatsApp</b><small>{canOpen?'Ahora':'Pendiente'}</small></li>
    </ol>
    <p>Acuerda pago y entrega con {name}. <b>ZIPCO no recibe ni verifica pagos.</b></p>
    {!disclosure&&openControl}
    <div className="zipco-customer-coordination-controls">
      <button type="button" className="zipco-customer-conditions" aria-haspopup="dialog" onClick={onConditions}><CircleCheck size={15} aria-hidden="true"/>Condiciones aceptadas<ChevronRight size={13} aria-hidden="true"/></button>
      <button type="button" aria-expanded={more} aria-controls={'zipco-customer-options-'+accepted.requestProcessId} onClick={()=>setMore(v=>!v)}><MoreHorizontal size={16}/>Más opciones</button>
    </div>
    {/* Plegado animado (mismo patrón que DetailReveal); inert cuando está cerrado. */}
    <div className="zipco-customer-coordination-fold" data-open={more} aria-hidden={!more} {...(!more?{inert:''}:{})}><div className="zipco-customer-coordination-fold-in">
      <div id={'zipco-customer-options-'+accepted.requestProcessId} className="zipco-customer-coordination-options">{options}<p>ZIPCO no procesa ni verifica pagos.</p></div>
    </div></div>
  </>;
  return <article ref={motionRef} className="zipco-customer-coordination-detail" data-coordination-embedded="true" data-coordination-role="customer">
    {error&&<p role="alert">{error}</p>}
    {disclosure&&<ol className="zipco-customer-declined-track" aria-label="Recorrido del pedido">
      <li data-done="true"><i aria-hidden="true"><Check size={12} strokeWidth={3.4}/></i><b>Aceptado</b></li>
      <li data-done={authorized} data-current={!authorized}><i aria-hidden="true">{authorized?<Check size={12} strokeWidth={3.4}/>:<LockKeyhole size={11} strokeWidth={2.6}/>}</i><b>{authorized?'Autorizada':'Autorizar'}<span className="zipco-customer-declined-sr">{authorized?' · confirmada':' · pendiente'}</span></b></li>
      <li data-current={authorized}><i aria-hidden="true"><WhatsAppMark className="h-3 w-3"/></i><b>WhatsApp</b></li>
    </ol>}
    {disclosure&&note}
    {disclosure&&<div className="zipco-customer-declined-actions">{openControl}{!busy&&!recovery&&disclosure.secondaryAction}</div>}
    {disclosure?<DetailReveal expanded={disclosure.expanded} onOpened={disclosure.onOpened}><div id={disclosure.detailId} className="zipco-customer-coordination-main">{declinedCard}</div></DetailReveal>:details}
  </article>;
}
