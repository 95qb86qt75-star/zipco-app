import * as React from 'react';
import {ChevronDown,Package} from 'lucide-react';
import type {ReactNode} from 'react';
import { DetailReveal } from "../../shared/layout/DetailReveal";
import StatusRail from "../../../shared/feedback/StatusRail";
import ReadyPanel, { type ReadyModel } from "../../../shared/feedback/ReadyPanel";

export default function CustomerPickupCard({id,name,product,price,expanded,onToggle,ready,busy=false,recovery,children}:{id:number;name:string;product:string;price:number|null;expanded:boolean;onToggle:()=>void;ready?:ReadyModel;busy?:boolean;recovery?:ReactNode;children:ReactNode}){
 const received=ready?.stage==='received'||ready?.stage==='finishing';
 return <article id={`order-${id}`} tabIndex={-1} className="zipco-pickup-c scroll-mb-36" data-ready={!!ready} data-leaving={ready?.stage==='finishing'} aria-busy={busy}>
  <button type="button" className="zipco-pickup-c-head" aria-expanded={expanded} aria-controls={`receipt-detail-${id}`} onClick={onToggle}>
   <span className="zipco-pickup-c-tile"><Package size={22}/></span>
   <span style={{flex:1,minWidth:0}}><b className="zipco-pickup-c-name">{name}</b><span className="zipco-pickup-c-meta"><span className="zipco-pickup-c-prod">{product}</span><b className="zipco-pickup-c-pill">{received?'Producto recibido':ready?'¡pedido listo!':'Pendiente de retiro'}</b></span></span>
   <span className="zipco-pickup-c-total"><b>{price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></span><span className="zipco-own-chv" data-open={expanded}><ChevronDown size={16}/></span>
  </button>
  <StatusRail theme="light" stage={received?'received':ready?'ready':'wait'} copy={{you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'}}}/>
  <ReadyPanel model={ready} tone="light" kind="pickup"/>{recovery}
  <DetailReveal expanded={expanded}><div id={`receipt-detail-${id}`} className="zipco-receipt-local-detail">{children}</div></DetailReveal>
 </article>;
}
