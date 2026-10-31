import * as React from 'react';
import {useEffect,useRef,type ReactNode} from 'react';
import { ChevronDown, ShoppingBag } from 'lucide-react';

import { type CoordinationCardModel } from "../../../shared/coordination/coordinationCardModel";


import { scrollToRequestOrder } from "../../../../application/motion/requestSummaryScroll";

import { type RailCopy, type RailStage } from "../../../../shared/feedback/StatusRail";
import { type ReadyModel } from "../../../../shared/feedback/ReadyPanel";

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */

/** Textos NUEVOS del carril y de la línea de estado (modo ownPending, diseño CliU15). Reemplazar por el texto ya definido en el código si existe uno equivalente.
 *  «En curso · esperando al negocio» (texto existente) se conserva como texto solo para lector de pantalla mientras se espera. */
const OWN_RAIL:RailCopy={
  you:{label:'TÚ',text:'Avisaste'},
  business:{label:'NEGOCIO',waiting:'Esperando',ready:'Avisó listo'},
  third:{label:'PEDIDO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'},
};
const OWN_STATE={waiting:'esperando',ready:'¡pedido listo!',received:'recibido'};
const OWN_SR_WAITING='En curso · esperando al negocio';
export function useCustomerCoordinationCardController({id,name,price,quantity,model,description,items,ready,preparing=false,children}:{
  id:number;name:string;price:number|null;quantity:number;model:CoordinationCardModel;description:string;
  items:{name:string;quantity:number}[];
  /** Solo se usa en modo ownPending. undefined = el negocio aún no avisó que el pedido está listo. */
  ready?:ReadyModel;
  preparing?:boolean;
  children:ReactNode;
}){

  const {mode,busy}=model,confirm=mode==='confirm',closed=mode==='declined',own=mode==='ownPending';
  const readyModel=own?ready:undefined,isReady=!!readyModel,leaving=readyModel?.stage==='finishing';
  const railStage:RailStage=!readyModel?'wait':readyModel.stage==='ready'?'ready':'received';
  const card=useRef<HTMLElement>(null),revealRequested=useRef(false),leaveDone=useRef(false);
  // La salida hacia Historial avisa UNA sola vez: por animationend o, si no hay animación (movimiento reducido), por este temporizador de respaldo.
  const finishLeave=()=>{if(leaveDone.current)return;leaveDone.current=true;readyModel?.onLeaveEnd?.();};
  useEffect(()=>{
    if(!leaving){leaveDone.current=false;return;}
    const t=window.setTimeout(finishLeave,window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:1300);
    return()=>window.clearTimeout(t);
  },[leaving]);
  const toggle=()=>{revealRequested.current=!model.expanded;model.onToggle();};
  const reveal=()=>{
    if(!revealRequested.current||!card.current)return;revealRequested.current=false;
    const scroller=card.current.closest<HTMLElement>('[data-requests-scroll]'),body=card.current.querySelector<HTMLElement>('.zipco-avw-query-body');
    if(scroller&&body&&body.getBoundingClientRect().bottom>scroller.getBoundingClientRect().bottom-12)
      scrollToRequestOrder(card.current,window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true);
  };
  const total=price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL');
  // La banda conserva la pregunta; solo cambia en «confirmar» y «falta coordinar». El estado transitorio va en la línea bajo el producto.
  const title=confirm?<>¿Devolver a <em className="zipco-avw-customer-am">Por coordinar</em>?</>:closed?'Coordinación pendiente':<>¿Coordinación lista por <em>WhatsApp</em>?</>;
  const status=busy?'Guardando respuesta…':confirm?'Solo Devolver guarda':'';
  const itemsText=items.length===1?items[0].quantity+'× '+items[0].name:items.length?items.length+' productos':'Producto del pedido';
  const product=<span className="zipco-avw-customer-product"><ShoppingBag size={12}/>{itemsText}</span>;
  const detail=<button type="button" className="zipco-avw-query-detail" aria-expanded={model.expanded}
    aria-controls={'coordination-detail-'+id} onClick={toggle}><svg className="zipco-avw-detail-hand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>{model.expanded?'Ocultar':'Detalle'}</button>;
  const chevron=<button type="button" className="zipco-own-chv" aria-expanded={model.expanded} aria-controls={'coordination-detail-'+id}
    aria-label={model.expanded?'Ocultar detalle':'Ver detalle'} onClick={toggle}><ChevronDown size={16} strokeWidth={2.6}/></button>;

return {OWN_RAIL,OWN_SR_WAITING,OWN_STATE,busy,card,chevron,children,closed,confirm,description,detail,finishLeave,id,isReady,itemsText,leaving,mode,model,name,own,preparing,product,quantity,railStage,readyModel,reveal,status,title,toggle,total};
}
export type CustomerCoordinationCardModel=ReturnType<typeof useCustomerCoordinationCardController>;
