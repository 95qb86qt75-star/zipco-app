import * as React from 'react';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Check,ChevronDown,LockKeyhole,MoreHorizontal} from 'lucide-react';
import { DetailReveal } from "../../shared/layout/DetailReveal";
import { BusinessCoordinationDisclosure } from "./businessCoordinationDisclosure";
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import useCoordinationMotion from "../../../application/motion/useCoordinationMotion";

/** Aviso «falta coordinar»: lo entrega BusinessCoordinationWaitingCard (variante declined) y este detalle lo dibuja bajo el recorrido. */
export const BusinessPendingNote=createContext<ReactNode>(null);

/** Fused business layout; callbacks and permissions remain in BusinessCoordinationCard. */
export default function BusinessPendingCoordinationDetail({covered,authorized,canOpen,canAuthorize,busy,phase,acceptedAt,
  conditions,recovery,error,consent,onOpen,onAuthorize,onUpdate,options}:{
  covered:boolean;authorized:boolean;canOpen:boolean;canAuthorize:boolean;busy:boolean;phase:string;
  acceptedAt?:string|null;conditions:ReactNode;recovery?:ReactNode;error:string;consent:ReactNode;
  onOpen:()=>void;onAuthorize:()=>void;onUpdate:()=>void;options:ReactNode;
}){
  const layout=useContext(BusinessCoordinationDisclosure),note=useContext(BusinessPendingNote),[more,setMore]=useState(false);
  const motionRef=useCoordinationMotion(covered);
  const footRef=useRef<HTMLDivElement>(null),moreRef=useRef<HTMLButtonElement>(null),menuRef=useRef<HTMLDivElement>(null);
  const [hasOptions,setHasOptions]=useState(true),[position,setPosition]=useState({left:12,bottom:12,width:260,maxHeight:300});
  const [sourceInert,setSourceInert]=useState(false);
  const waiting=phase==='loading'||phase==='requesting';
  const optionsId=layout?.detailId+'-options';
  const menuVisible=more&&layout?.expanded===true&&!covered&&!busy&&!waiting&&!sourceInert&&hasOptions;
  useEffect(()=>{
    const root=motionRef.current;if(!root)return;
    const inspect=()=>setSourceInert(!!root.closest('[inert]'));
    const observer=new MutationObserver(inspect);let node:HTMLElement|null=root;
    while(node){observer.observe(node,{attributes:true,attributeFilter:['inert']});node=node.parentElement;}
    inspect();return()=>observer.disconnect();
  },[]);
  // Keep real controls mounted: closing the popover must not erase recovery/dialog state.
  useEffect(()=>{
    const menu=menuRef.current;if(!menu)return;
    const inspect=()=>setHasOptions(!!menu.textContent?.trim()||!!menu.querySelector('button,a,input,select,textarea'));
    inspect();const observer=new MutationObserver(inspect);observer.observe(menu,{childList:true,subtree:true,characterData:true});return()=>observer.disconnect();
  },[]);
  const placeMenu=()=>{
    const rect=moreRef.current?.getBoundingClientRect();if(!rect)return;
    const width=Math.min(280,window.innerWidth-24);
    setPosition({left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),bottom:Math.max(12,window.innerHeight-rect.top+6),width,maxHeight:Math.max(44,Math.min(320,rect.top-12))});
  };
  // Menú «Más opciones»: se cierra con Escape (devuelve el foco al botón) o al tocar fuera. No cierra con el pliegue del detalle.
  useEffect(()=>{
    if(!menuVisible)return;
    const modal=()=>!!document.querySelector('[role="dialog"],[role="alertdialog"]');
    const down=(event:PointerEvent)=>{if(!modal()&&!footRef.current?.contains(event.target as Node)&&!menuRef.current?.contains(event.target as Node))setMore(false);};
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!modal()){event.preventDefault();setMore(false);moreRef.current?.focus();}};
    const scroll=(event:Event)=>{if(!menuRef.current?.contains(event.target as Node)&&!modal())setMore(false);};
    document.addEventListener('pointerdown',down);document.addEventListener('keydown',key,true);
    window.addEventListener('resize',placeMenu);document.addEventListener('scroll',scroll,true);
    const frame=requestAnimationFrame(()=>menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled),a[href]')?.focus({preventScroll:true}));
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',placeMenu);document.removeEventListener('scroll',scroll,true);};
  },[menuVisible]);
  return <article ref={motionRef} className="zipco-business-pending-detail" data-coordination-embedded="true" data-coordination-role="business">
    <ol className="zipco-business-pending-track" aria-label="Recorrido del pedido">
      <li className="done"><i aria-hidden="true"><Check size={12} strokeWidth={3.4}/></i><b>Aceptado</b></li>
      <li className={authorized?'done':undefined}><i aria-hidden="true">{authorized?<Check size={12} strokeWidth={3.4}/>:<LockKeyhole size={11} strokeWidth={2.6}/>}</i><b>Contacto<span className="zipco-business-pending-sr">{authorized?' autorizado':' por autorizar'}</span></b></li>
      <li className="on" aria-current="step"><i aria-hidden="true"><WhatsAppMark className="h-3 w-3"/></i><b>WhatsApp</b></li>
    </ol>
    {note}
    {error&&<p role="alert" className="zipco-business-pending-error">{error}</p>}
    {!authorized&&<p className="zipco-business-pending-consent">{consent}</p>}
    <div className="zipco-business-pending-actions">
      {recovery||<button type="button" className="zipco-co-go zipco-business-pending-open" disabled={busy||waiting||(authorized?!canOpen:!canAuthorize)} onClick={authorized?onOpen:onAuthorize}>
        <WhatsAppMark className="h-5 w-5"/>
        <span className="zipco-business-pending-open-text"><span>{phase==='loading'?'Preparando WhatsApp…':phase==='requesting'?'Autorizando contacto…':authorized?'Abrir WhatsApp':'Autorizo comenzar coordinación'}</span>{!waiting&&<small>{authorized?'Coordina pago y entrega con el cliente':'Comparte tu teléfono solo para este pedido'}</small>}</span>
        {waiting&&<span className="zipco-business-pending-spin" aria-hidden="true"/>}
      </button>}
      {!recovery&&!waiting&&(authorized?!canOpen:!canAuthorize)&&<button type="button" className="zipco-co-go2" disabled={busy} onClick={onUpdate}>Actualizar estado del contacto</button>}
      {!busy&&!waiting&&!recovery&&layout?.secondaryAction}
    </div>
    <DetailReveal expanded={layout?.expanded===true}><div id={layout?.detailId} className="zipco-business-pending-main">
      <section className="zipco-business-pending-card" aria-label="Pasos del pedido">
        {conditions}
        <div className="zipco-co-co2">
          <div className="zipco-co-co2-top">
            <span className="zipco-co-co2-orb"><Check size={24} strokeWidth={3} aria-hidden="true"/></span>
            <div><div className="zipco-co-co2-t">Pedido aceptado</div><div className="zipco-co-co2-s">Falta acordar el pago y la entrega.</div></div>
          </div>
          <div className="zipco-co-steps">
            <div className="zipco-co-st done"><span className="zipco-co-sd"><Check size={13} strokeWidth={3.4}/></span><div className="zipco-co-sb"><div className="zipco-co-sl">Pedido aceptado</div>{acceptedAt&&<div className="zipco-co-sm">{new Date(acceptedAt).toLocaleDateString('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'short'})}</div>}</div></div>
            <div className={'zipco-co-st'+(authorized?' done':'')}><span className="zipco-co-sd">{authorized?<Check size={13} strokeWidth={3.4}/>:<LockKeyhole size={13}/>}</span><div className="zipco-co-sb"><div className="zipco-co-sl">{authorized?'Contacto autorizado':'Contacto por autorizar'}</div><div className="zipco-co-sm">{authorized?'Puedes coordinar por WhatsApp.':'Autoriza compartir tu teléfono para este pedido.'}</div></div></div>
            <div className="zipco-co-st last"><span className="zipco-co-sd on"><WhatsAppMark className="h-3.5 w-3.5"/></span><div className="zipco-co-sb"><div className="zipco-co-sl">Coordinación pendiente</div><div className="zipco-co-sm">Confirma «Ya coordinamos» cuando lo hayan acordado.</div></div></div>
          </div>
        </div>
      </section>
      <div className="zipco-business-pending-foot" ref={footRef}>
        <p className="zipco-business-pending-legal">ZIPCO no recibe ni verifica pagos.</p>
        {hasOptions&&<button type="button" ref={moreRef} className="zipco-business-pending-more" disabled={busy||waiting} aria-expanded={menuVisible} aria-controls={optionsId} onClick={()=>{placeMenu();setMore(v=>!v);}}><MoreHorizontal size={16} strokeWidth={2.6} aria-hidden="true"/>Más opciones<ChevronDown size={13} strokeWidth={2.6} aria-hidden="true"/></button>}
        {typeof document!=='undefined'&&createPortal(<div ref={menuRef} id={optionsId} className="zipco-business-pending-options" role="region" aria-label="Opciones de coordinación" hidden={!menuVisible} {...(!menuVisible?{inert:''}:{})} style={position}>{options}</div>,document.body)}
      </div>
    </div></DetailReveal>
  </article>;
}
