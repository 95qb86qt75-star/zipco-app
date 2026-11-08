import * as React from 'react';
import {Bell,Check,ChevronDown,Hourglass,Package} from 'lucide-react';
import type {ReactNode} from 'react';
import { DetailReveal } from "../../shared/layout/DetailReveal";
import StatusRail from "../../../shared/feedback/StatusRail";
import ReadyPanel, { type ReadyModel } from "../../../shared/feedback/ReadyPanel";

/** Elementos que conservan su propio clic: tocar la cabecera NO debe plegar la tarjeta cuando el toque cae sobre ellos. */
const OWN_CLICK='button,a,input,textarea,select,summary,[role="button"],[role="tab"],[role="dialog"]';

const RAIL_COPY={you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'}};

export default function CustomerPickupCard({id,name,product,price,expanded,onToggle,ready,busy=false,recovery,children,lineDesign=false,confirmedFreeDesign=false}:{id:number;name:string;product:string;price:number|null;expanded:boolean;onToggle:()=>void;ready?:ReadyModel;busy?:boolean;recovery?:ReactNode;children:ReactNode;lineDesign?:boolean;confirmedFreeDesign?:boolean}){
 const received=ready?.stage==='received'||ready?.stage==='finishing';
 const total=<span className="zipco-pickup-c-total"><b data-unknown={price===null}>{price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></span>;

 // «Pedido listo» / «Producto recibido»: se conserva la composición anterior tal cual (fuera del alcance del rediseño).
 // Variantes con cabecera «de línea»: pago previo pendiente (`lineDesign`) y reserva sin pago previo confirmada (`confirmedFreeDesign`).
 // Ambas las decide el contenedor con datos del servidor; `lineDesign` tiene prioridad y «pedido listo / recibido» (`ready`) conserva siempre la composición anterior.
 const design:'line'|'confirmed'|null=ready?null:lineDesign?'line':confirmedFreeDesign?'confirmed':null;
 if(!design)return <article id={`order-${id}`} tabIndex={-1} className="zipco-pickup-c scroll-mb-36" data-ready={!!ready} data-leaving={ready?.stage==='finishing'} aria-busy={busy}>
  <button type="button" className="zipco-pickup-c-head" aria-expanded={expanded} aria-controls={`receipt-detail-${id}`} onClick={onToggle}>
   <span className="zipco-pickup-c-tile"><Package size={22}/></span>
   <span style={{flex:1,minWidth:0}}><b className="zipco-pickup-c-name">{name}</b><span className="zipco-pickup-c-meta"><span className="zipco-pickup-c-prod">{product}</span><b className="zipco-pickup-c-pill">{received?'Producto recibido':ready?'¡pedido listo!':'Pendiente de retiro'}</b></span></span>
   <span className="zipco-pickup-c-total"><b>{price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></span><span className="zipco-own-chv" data-open={expanded}><ChevronDown size={16}/></span>
  </button>
  <StatusRail theme="light" stage={received?'received':ready?'ready':'wait'} copy={{you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'}}}/>
  <ReadyPanel model={ready} tone="light" kind="pickup"/>{recovery}
  <DetailReveal key="pickup-detail" expanded={expanded}><div id={`receipt-detail-${id}`} className="zipco-receipt-local-detail">{children}</div></DetailReveal>
 </article>;
 // Pago previo pendiente: «Esperando al negocio». Reserva sin pago previo confirmada: «Pendiente de retiro».
 // Toda la cabecera pliega/despliega con un toque; el botón «Ver detalle» sigue siendo el control accesible (aria-expanded/aria-controls).
 const toggleFromHeader=(e:React.MouseEvent<HTMLElement>)=>{
  if((e.target as HTMLElement).closest(OWN_CLICK))return;
  if(typeof window!=='undefined'&&window.getSelection()?.toString())return;
  onToggle();
 };
 return <article id={`order-${id}`} tabIndex={-1} className="zipco-pickup-c scroll-mb-36" data-ready={false} data-stage="wait" data-pickup-design="line" data-pickup-tone={design==='confirmed'?'confirmed':undefined} aria-busy={busy}>
  <div className="zipco-pickup-c-hd" onClick={toggleFromHeader}>
   <div className="zipco-pickup-c-top">
    <span className="zipco-pickup-c-state"><i aria-hidden="true">{design==='confirmed'?<Check size={13} strokeWidth={3.2}/>:<Hourglass size={13} strokeWidth={2.8}/>}</i><b>{design==='confirmed'?'Pendiente de retiro':'Esperando al negocio'}</b></span>
    <button type="button" className="zipco-pickup-c-toggle" data-open={expanded} aria-expanded={expanded} aria-controls={`receipt-detail-${id}`} onClick={e=>{e.stopPropagation();onToggle();}}>
     <span className="zipco-pickup-c-hand" aria-hidden="true"><svg width="24" height="28" viewBox="0 -5 24 29" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><g className="zipco-pickup-c-w1" stroke="#f59e0b"><path d="M6.2 1.2a3.4 3.4 0 0 1 3.6 0"/></g><g className="zipco-pickup-c-w2" stroke="#f59e0b"><path d="M4.2 -1.4a6.6 6.6 0 0 1 7.6 0"/></g><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M18 11v-1a2 2 0 0 0-4 0v1"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg></span>
     <span>{expanded?'Ocultar':'Ver detalle'}</span>
     <span className="zipco-pickup-c-chv" data-open={expanded}><ChevronDown size={14}/></span>
    </button>
   </div>
   <div className="zipco-pickup-c-id">
    <span className="zipco-pickup-c-tile"><Package size={23}/></span>
    <div className="zipco-pickup-c-who"><small>NEGOCIO</small><b className="zipco-pickup-c-name">{name}</b><span className="zipco-pickup-c-prod zipco-pickup-c-chip">{product}</span></div>
    {total}
   </div>
   <StatusRail theme="light" stage="wait" copy={RAIL_COPY}/>
  </div>
  <ReadyPanel model={ready} tone="light" kind="pickup"/>{recovery}
  <DetailReveal key="pickup-detail" expanded={expanded}><div id={`receipt-detail-${id}`} className="zipco-receipt-local-detail">{children}</div></DetailReveal>
 </article>;
}
