import * as React from 'react';
import {useEffect,useId,useRef,useState} from 'react';
import {ChevronDown,ChevronRight,ChevronUp,CircleCheck,Hourglass,MapPin,MessageCircle,ShieldCheck,Ticket,X} from 'lucide-react';
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

/** Bloque real de ReservationPanel (no se copia ni se reescribe) dentro de una fila plegable.
 *  Plegado: solo se ven la línea de estado y la línea de importe del propio panel; el resto sigue montado y queda `inert`.
 *  Un error del panel (`role="alert"`) abre la fila y la mantiene abierta; sus controles nunca quedan ocultos.
 *  Altura plegada y desplegada: se miden del DOM real (no hay alturas fijas). */
function ReservationFold({children}:{children:ReactNode}){
 const id=useId(),[open,setOpen]=useState(false),[alert,setAlert]=useState(false),[size,setSize]=useState<{cut:number;full:number}|null>(null);
 const tone='pending'; // This composition is selected by the structured pending-prepayment state.
 const priorInert=useRef(new Map<HTMLElement,boolean>());
 const wrap=useRef<HTMLDivElement>(null),expanded=open||alert,expandedRef=useRef(expanded);expandedRef.current=expanded;
 useEffect(()=>{
  const body=wrap.current;if(!body)return;
  const panel=()=>body.querySelector<HTMLElement>('[data-reservation-panel]');
  const sync=()=>{
   const p=panel();if(!p||p.offsetHeight===0)return; // pestaña oculta: se vuelve a medir al mostrarse (ResizeObserver)
   const kids=Array.from(p.children) as HTMLElement[];
   const amount=(kids[1]?.tagName==='P'?kids[1]:kids[1]?.querySelector<HTMLElement>('p'))??kids[0];
   const top=body.getBoundingClientRect().top,cut=Math.ceil(amount.getBoundingClientRect().bottom-top)+2,full=Math.ceil(p.scrollHeight);
   setSize(prev=>prev&&prev.cut===cut&&prev.full===full?prev:{cut,full});
   const hasAlert=!!p.querySelector('[role="alert"]');setAlert(prev=>prev===hasAlert?prev:hasAlert);
   const hidden=!(expandedRef.current||hasAlert);
   kids.forEach(n=>{
    const after=!!(amount.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING)&&!n.contains(amount);
    if(after&&hidden){if(!priorInert.current.has(n))priorInert.current.set(n,n.inert);n.inert=true;}else if(priorInert.current.has(n)){n.inert=priorInert.current.get(n)!;priorInert.current.delete(n);}
   });
  };
  sync();
  const ro=new ResizeObserver(sync),mo=new MutationObserver(sync);
  mo.observe(body,{childList:true,characterData:true,subtree:true});
  ro.observe(body);const p=panel();if(p){ro.observe(p);mo.observe(p,{childList:true,characterData:true,subtree:true});}
  return()=>{ro.disconnect();mo.disconnect();for(const [node,inert] of priorInert.current)node.inert=inert;priorInert.current.clear();};
 },[expanded]);
 return <div className="zipco-pk-row zipco-pk-res" data-tone={tone}>
  <span className="zipco-pk-ico" data-kind="reserva" aria-hidden="true">{tone==='pending'?<Hourglass size={15} strokeWidth={2.4}/>:<Ticket size={15} strokeWidth={2.4}/>}</span>
  <div className="zipco-pk-bd">
   <p className="zipco-pk-ey">RESERVA</p>
   <div ref={wrap} id={id} className="zipco-pk-fold" data-open={expanded} data-measured={!!size} style={size?({'--pk-cut':size.cut+'px','--pk-full':size.full+'px'} as React.CSSProperties):undefined}>{children}</div>
   {!alert&&<button type="button" className="zipco-pk-more" aria-expanded={expanded} aria-controls={id} onClick={()=>setOpen(v=>!v)}><span>{expanded?'Ocultar detalle de la reserva':'Ver detalle de la reserva'}</span><span className="zipco-pk-more-chv" data-open={expanded}><ChevronDown size={14}/></span></button>}
  </div>
 </div>;
}

/** Detalle de «Retiro en el local» del cliente: pestañas «Cómo retirar» / «Contacto y opciones».
 *  - Las dos pestañas están SIEMPRE montadas (la inactiva solo lleva `hidden`): no se pierden motivos, diálogos, reserva ni recuperación.
 *  - Los avisos y la recuperación (`parts.alerts`) viven fuera de las pestañas y se ven siempre.
 *  - Los errores propios de ReservationPanel (no modificado) viven dentro de su pestaña: si aparece uno nuevo en la pestaña oculta, se cambia a ella.
 *  - Las pestañas solo existen si ambas tienen contenido visible real; si no, se apila todo sin barra (nada vacío).
 *  - Cada botón sigue dependiendo de lo que el servidor permite: `onContact`/`parts.*` ya vienen filtrados por permisos. */
function CustomerPickupLineDetails({summary,onConditions,onContact,blocked=false,parts}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;parts:AvailabilityPostActionParts|null}){
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
 const tabBtn=(i:0|1,label:string,icon:ReactNode)=><button type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={active===i} aria-controls={`${id}-panel-${i}`} tabIndex={active===i?0:-1} className="zipco-pickup-tab" onClick={()=>setTab(i)} onKeyDown={onKey}>{icon}{label}</button>;
 const collapse=(e:React.MouseEvent<HTMLButtonElement>)=>{const toggle=e.currentTarget.closest('.zipco-pickup-c')?.querySelector<HTMLButtonElement>('.zipco-pickup-c-toggle,.zipco-pickup-c-head');toggle?.click();toggle?.focus({preventScroll:true});};
 const hide=(i:0|1)=>tabbed&&active!==i;
 return <div className="zipco-receipt-details zipco-pickup-det" data-tabbed={tabbed}>
  {has?.alerts&&<div className="zipco-pickup-alerts">{parts?.alerts}</div>}
  {tabbed&&<div className="zipco-pickup-tabs" role="tablist" aria-label="Detalle del retiro">{tabBtn(0,'Cómo retirar',<MapPin size={14} strokeWidth={2.4} aria-hidden="true"/>)}{tabBtn(1,'Contacto y opciones',<MessageCircle size={14} strokeWidth={2.4} aria-hidden="true"/>)}</div>}
  <div ref={panels[0]} id={`${id}-panel-0`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-0`}:{})} hidden={hide(0)}>
   <div className="zipco-pk-line">
    {has?.instructions&&<div className="zipco-pk-row"><span className="zipco-pk-ico" data-kind="nota" aria-hidden="true"><MapPin size={15} strokeWidth={2.4}/></span><div className="zipco-pk-bd">{React.isValidElement<{variant?:'default'|'customer'|'customer-line'}>(parts?.instructions)?React.cloneElement(parts.instructions,{variant:'customer-line'}):parts?.instructions}</div></div>}
    {has?.reservation&&<ReservationFold>{parts?.reservation}</ReservationFold>}
    <button type="button" className="zipco-pk-row zipco-pk-cd" aria-haspopup="dialog" onClick={onConditions}><span className="zipco-pk-ico" data-kind="cond" aria-hidden="true"><CircleCheck size={15} strokeWidth={2.4}/></span><span className="zipco-pk-bd"><small className="zipco-pk-ey">CONDICIONES ACEPTADAS</small><b>{summary}</b></span><span className="zipco-pk-go" aria-hidden="true"><ChevronRight size={16}/></span></button>
   </div>
   <p className="zipco-pickup-pay">ZIPCO no procesa ni verifica pagos.</p>
  </div>
  {secondHas&&<div ref={panels[1]} id={`${id}-panel-1`} className="zipco-pickup-panel" {...(tabbed?{role:'tabpanel','aria-labelledby':`${id}-tab-1`}:{})} hidden={hide(1)}>
   <div className="zipco-pk-line">
    {onContact&&<button type="button" className="zipco-co-go2 zipco-pickup-wa zipco-pk-row zipco-pk-cd" disabled={blocked} onClick={onContact}><span className="zipco-pk-ico" data-kind="wa" aria-hidden="true"><WhatsAppMark className="h-4 w-4"/></span><span className="zipco-pk-bd"><small className="zipco-pk-ey">CONTACTO OPCIONAL</small><b>Escribir al negocio</b></span><span className="zipco-pk-go" aria-hidden="true"><ChevronRight size={16}/></span></button>}
    {has?.contact&&<div className="zipco-pk-row"><span className="zipco-pk-ico" data-kind="perm" aria-hidden="true"><ShieldCheck size={15} strokeWidth={2.4}/></span><div className="zipco-pk-bd">{parts?.contact}</div></div>}
    {has?.cancel&&<div className="zipco-pk-row zipco-pk-cx"><span className="zipco-pk-ico" data-kind="cancel" aria-hidden="true"><X size={15} strokeWidth={2.6}/></span><div className="zipco-pk-bd">{parts?.cancel}</div></div>}
   </div>
  </div>}
  <button type="button" className="zipco-pk-hide" onClick={collapse}>Ocultar detalle<ChevronUp size={14} aria-hidden="true"/></button>
 </div>;
}

function StandardPickupDetails({summary,onConditions,onContact,blocked=false,parts}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;parts:AvailabilityPostActionParts|null}){
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

export function CustomerPickupDetails({lineDesign=false,...props}:React.ComponentProps<typeof StandardPickupDetails>&{lineDesign?:boolean}){return lineDesign?<CustomerPickupLineDetails {...props}/>:<StandardPickupDetails {...props}/>;}
