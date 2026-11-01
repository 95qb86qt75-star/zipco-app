import * as React from 'react';
import {useEffect,useId,useRef,useState} from 'react';
import {ChevronRight,CircleCheck} from 'lucide-react';
import type {ReactNode} from 'react';
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import type {AvailabilityPostActionParts} from "../../shared/availability/AvailabilityPostActionsView";

/** Franja «Condiciones aceptadas»: mismo markup y clases de siempre, compartido por las dos presentaciones. */
function ConditionsStrip({summary,onConditions}:{summary:string;onConditions:()=>void}){
 return <button type="button" className="zipco-co-strip2" onClick={onConditions}><span className="zipco-co-strip2-ic"><CircleCheck size={16}/></span><span style={{minWidth:0,flex:1}}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{summary}</div></span><span className="zipco-co-strip2-go"><ChevronRight size={16}/></span></button>;
}

/** Shared by the real card and isolated design preview; callbacks own all actions. (Sin cambios para WhatsApp ni vista previa.) */
export default function CustomerReceiptDetails({summary,onConditions,onContact,blocked=false,children}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;children?:ReactNode}){
 return <div className="zipco-receipt-details">
  <ConditionsStrip summary={summary} onConditions={onConditions}/>
  <p className="mt-3 text-xs">ZIPCO no procesa ni verifica pagos.</p>
  {onContact&&<button type="button" className="zipco-co-go2" disabled={blocked} onClick={onContact}><WhatsAppMark className="h-4 w-4"/> Escribir al negocio</button>}
  {children}
 </div>;
}

/** Detalle de «Retiro en el local» del cliente: pestañas «Cómo retirar» / «Contacto y opciones».
 *  - Las dos pestañas están SIEMPRE montadas (la inactiva solo lleva `hidden`): no se pierden motivos, diálogos, reserva ni recuperación.
 *  - Los avisos y la recuperación (`parts.alerts`) viven fuera de las pestañas y se ven siempre.
 *  - Los errores propios de ReservationPanel (no modificado) viven dentro de su pestaña: si aparece uno nuevo en la pestaña oculta, se cambia a ella.
 *  - Las pestañas solo existen si ambas tienen contenido visible real; si no, se apila todo sin barra (nada vacío).
 *  - Cada botón sigue dependiendo de lo que el servidor permite: `onContact`/`parts.*` ya vienen filtrados por permisos. */
export function CustomerPickupDetails({summary,onConditions,onContact,blocked=false,parts}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;parts:AvailabilityPostActionParts|null}){
 const id=useId(),[tab,setTab]=useState<0|1>(0);
 const has=parts?.has;
 const firstHas=!!(has?.instructions||has?.reservation);
 const secondHas=!!(onContact||has?.contact||has?.cancel);
 const tabbed=firstHas&&secondHas;
 const active:0|1=tabbed?tab:0;
 const activeRef=useRef(active);activeRef.current=active;
 const panels=[useRef<HTMLDivElement>(null),useRef<HTMLDivElement>(null)];
  const seen=useRef<string[]|null>(null);
 useEffect(()=>{
  if(!tabbed){seen.current=null;return;}
   const errors=()=>panels.map(p=>Array.from(p.current?.querySelectorAll('[role="alert"]')??[]).map(node=>node.textContent?.trim()??'').filter(Boolean).join('\n'));
   seen.current=errors();
  const watch=()=>{
    const now=errors(),before=seen.current??now;seen.current=now;
    const changed=[0,1].find(i=>!!now[i]&&now[i]!==before[i]&&i!==activeRef.current);
    if(changed!==undefined){
     const focused=document.activeElement,previous=activeRef.current;
     const moveFocus=panels[previous].current?.contains(focused)||document.getElementById(`${id}-tab-${previous}`)===focused;
     setTab(changed as 0|1);
     if(moveFocus)document.getElementById(`${id}-tab-${changed}`)?.focus({preventScroll:true});
    }
  };
  const mo=new MutationObserver(watch);
   panels.forEach(p=>{if(p.current)mo.observe(p.current,{childList:true,characterData:true,subtree:true});});
  return()=>mo.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[tabbed]);
 const onKey=(e:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'&&e.key!=='Home'&&e.key!=='End')return;
   e.preventDefault();const next:0|1=e.key==='Home'?0:e.key==='End'?1:active===0?1:0;setTab(next);
  document.getElementById(`${id}-tab-${next}`)?.focus();
 };
 const tabBtn=(i:0|1,label:string)=><button type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={active===i} aria-controls={`${id}-panel-${i}`} tabIndex={active===i?0:-1} className="zipco-pickup-tab" onClick={()=>setTab(i)} onKeyDown={onKey}>{label}</button>;
 const hide=(i:0|1)=>tabbed&&active!==i;
 return <div className="zipco-receipt-details zipco-pickup-det" data-tabbed={tabbed}>
  {has?.alerts&&<div className="zipco-pickup-alerts">{parts?.alerts}</div>}
  {tabbed&&<div className="zipco-pickup-tabs" role="tablist" aria-label="Detalle del retiro">{tabBtn(0,'Cómo retirar')}{tabBtn(1,'Contacto y opciones')}</div>}
  <div ref={panels[0]} id={`${id}-panel-0`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-0`}:{})} hidden={hide(0)}>
   {parts?.instructions}
   {parts?.reservation}
   <ConditionsStrip summary={summary} onConditions={onConditions}/>
   <p className="zipco-pickup-pay">ZIPCO no procesa ni verifica pagos.</p>
  </div>
  {secondHas&&<div ref={panels[1]} id={`${id}-panel-1`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-1`}:{})} hidden={hide(1)}>
   {onContact&&<><p className="zipco-pickup-k">CONTACTO OPCIONAL</p><button type="button" className="zipco-co-go2 zipco-pickup-wa" disabled={blocked} onClick={onContact}><WhatsAppMark className="h-4 w-4"/> Escribir al negocio</button></>}
   {parts?.contact}
   {parts?.cancel}
  </div>}
 </div>;
}
