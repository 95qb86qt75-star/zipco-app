import * as React from 'react';
import {Bell,Check,ChevronDown,ChevronRight,Hourglass,Info,Lock,MapPin,Package,ShoppingBag,AlertTriangle} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import type {ReactNode,Ref} from 'react';
import WhatsAppMark from "../../../shared/icons/WhatsAppMark";
import ProductPreviewControl from "../../../shared/product-preview/ProductPreviewControl";
import { DetailReveal } from "../../shared/layout/DetailReveal";
import StatusRail from "../../../shared/feedback/StatusRail";
import ReadyPanel, { type ReadyModel } from "../../../shared/feedback/ReadyPanel";

/** Elementos que conservan su propio clic: tocar la cabecera NO debe plegar la tarjeta cuando el toque cae sobre ellos. */
const OWN_CLICK='button,a,input,textarea,select,summary,[role="button"],[role="tab"],[role="dialog"]';

const RAIL_COPY={you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'}};


/* ============================================================================================================
   Diseño «Nuevo · Lista» (tablero NegW18). Marco COMPARTIDO por retiro local (A/B/C) y WhatsApp (D/E).
   Clases propias `.zipco-nv-*` (hoja customer-pickup.css, bloque «Nuevo · Lista»). No usa DetailReveal ni StatusRail:
   el pliegue es CSS (grid 0fr→1fr) y el contenido plegado queda `inert` (no enfocable, no leído).
   ============================================================================================================ */
export type NvVariant='A'|'B'|'C';
/** «Solicitud finalizada»: FlowCardView lo provee para que también lo vea la tarjeta de WhatsApp (que recibe su modelo de CustomerCoordinationCard, sin cambios). */
export const NvDoneContext=React.createContext<{label:string;out:boolean;requestFinished?:boolean}|null>(null);
const HAND_NV=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M18 11v-1a2 2 0 0 0-4 0v1"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>;
export type NvFrameProps={
 id:number;detailId:string;tone:'ok'|'cy'|'wait';pill:string;
 modality:{kind:'pickup'|'wa';label:string};
 name:string;itemsText:string;quantity:number;price:number|null;
 steps:[string,string,string];subs:[string,string,string];
 message:{closed:string;open:string};
 expanded:boolean;onToggle:()=>void;busy?:boolean;recovery?:ReactNode;
 /** «Solicitud finalizada»: reemplaza la tarjeta por la franja de confirmación (luego `out` la encoge hacia Historial). */
 done?:{label:string;out:boolean;requestFinished?:boolean}|null;
 articleRef?:Ref<HTMLElement>;articleProps?:Record<string,unknown>;
 children:ReactNode;
};
export function NvCardFrame({id,detailId,tone,pill,modality,name,itemsText,quantity,price,steps,subs,message,expanded,onToggle,busy=false,recovery,done:doneProp,articleRef,articleProps,children}:NvFrameProps){
 const ctxDone=React.useContext(NvDoneContext),done=doneProp??ctxDone;
 const foldRef=useRef<HTMLDivElement>(null),[hasAlert,setHasAlert]=useState(false);
 // El contenido plegado no es enfocable ni se lee (inert); un `role="alert"` dentro del detalle nunca queda oculto: se avisa en la franja roja.
 useEffect(()=>{const el=foldRef.current;if(el)el.inert=!expanded||busy;},[expanded,busy]);
 useEffect(()=>{
  const el=foldRef.current;if(!el)return;
  const sync=()=>setHasAlert(!!el.querySelector('[role="alert"]'));
  sync();const mo=new MutationObserver(sync);mo.observe(el,{childList:true,characterData:true,subtree:true});return()=>mo.disconnect();
 },[]);
 const OWN=OWN_CLICK;
 const fromHeader=(e:React.MouseEvent<HTMLElement>)=>{
  if((e.target as HTMLElement).closest(OWN))return;
  if(typeof window!=='undefined'&&window.getSelection?.()?.toString())return;
  onToggle();
 };
 if(done)return <article ref={articleRef} id={`order-${id}`} tabIndex={-1} className="zipco-nv-wrap scroll-mb-36" {...articleProps}>
  <div className={'zipco-nv-h-ok'+(done.out?' out':'')} role="status"><span className="zipco-nv-h-ic"><Check size={20} strokeWidth={3} aria-hidden="true"/></span><div><b>{done.requestFinished?'Solicitud finalizada':'Seguimiento cerrado'}</b><p>{done.label} · pasando a <u>Historial</u></p></div></div>
 </article>;
 const unknown=price===null;
 return <article ref={articleRef} id={`order-${id}`} tabIndex={-1} className="zipco-nv-x-c scroll-mb-36" data-ver="l" data-open={expanded} data-tone={tone} data-pickup-design="nv" aria-busy={busy} {...articleProps}>
  <div className="zipco-nv-x-hd" onClick={fromHeader}>
   <div className="zipco-nv-x-top">
    <span className="zipco-nv-x-pill"><i aria-hidden="true"><Hourglass size={13} strokeWidth={2.8}/></i><b>{pill}</b></span>
    <button type="button" className="zipco-nv-x-tg" aria-expanded={expanded} aria-controls={detailId} onClick={e=>{e.stopPropagation();onToggle();}}><span className="zipco-nv-x-hand">{HAND_NV}</span><span>{expanded?'Ocultar':'Ver detalle'}</span><span className="zipco-nv-x-chv" aria-hidden="true"><ChevronDown size={14}/></span></button>
   </div>
   <div className="zipco-nv-x-id">
    <span className="zipco-nv-x-th"><ProductPreviewControl thumbnailLoading="eager" fallback={<ShoppingBag size={22} aria-hidden="true"/>}/><b>{quantity}×</b></span>
    <div className="zipco-nv-x-who"><small>NEGOCIO</small><h3>{name}</h3>
     <span className="zipco-nv-x-pc">{itemsText}</span>{' '}
     {modality.kind==='pickup'?<span className="zipco-nv-x-pc zipco-nv-x-md"><MapPin size={11} aria-hidden="true"/>{modality.label}</span>:<span className="zipco-nv-x-pc zipco-nv-x-md zipco-nv-x-wa"><WhatsAppMark className="h-3 w-3"/>{modality.label}</span>}
    </div>
    <div className="zipco-nv-x-tot"><b data-u={unknown}>{unknown?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></div>
   </div>
   <div className="zipco-nv-x-rail" role="group" aria-label="Estado de la solicitud">
    {([['done',<Check size={14} strokeWidth={3}/>],['wait',<Hourglass size={14}/>],['lock',<Lock size={14}/>]] as const).flatMap(([k,ic],i)=>{
     const step=<div className="zipco-nv-x-step" key={k}><span className="zipco-nv-x-nd" data-k={k} aria-hidden="true">{ic}</span><span><b>{steps[i]}</b><em className="zipco-nv-x-sub" data-k={k}>{subs[i]}</em></span></div>;
     return i<2?[step,<span key={k+'-ln'} className={'zipco-nv-x-ln'+(i===0?' on':'')}/>]:[step];
    })}
   </div>
   <p className="zipco-nv-x-info"><Info size={14} aria-hidden="true"/><span><span className="zipco-nv-i-c">{message.closed}</span><span className="zipco-nv-i-o">{message.open}</span></span></p>
   <button type="button" className="zipco-nv-x-cta" aria-expanded={false} aria-controls={detailId} onClick={e=>{e.stopPropagation();onToggle();}}><span>Ver detalle y opciones</span><ChevronRight size={16} aria-hidden="true"/></button>
  </div>
  {busy&&<p className="zipco-nv-x-bzs" role="status"><i className="zipco-nv-x-sp" aria-hidden="true"/>Guardando…</p>}
  {recovery}
  {hasAlert&&!expanded&&<div className="zipco-nv-x-at" role="alert"><AlertTriangle size={18} aria-hidden="true"/><p>Hay un aviso que requiere tu atención.</p><button type="button" onClick={onToggle}>Ver detalle</button></div>}
  <div className="zipco-nv-x-fold" data-open={expanded} data-fold ref={foldRef} aria-hidden={!expanded}><div className="zipco-nv-x-fi"><div className="zipco-nv-x-det" id={detailId}>{children}</div></div></div>
 </article>;
}

/* ============================================================================================================
   «Producto recibido» (tablero NegW19) · tarjeta del CLIENTE con retiro local: A reserva sin pago · B reserva con pago previo · C sin reserva.
   Solo cuando el cliente YA declaró la recepción (customerReceipt.status==='RECEIVED_PENDING_FINALIZATION') y falta finalizar.
   - El botón «Finalizar esta solicitud» es el ReadyPanel REAL (model.onFinish → FINALIZE_REQUEST): no hay ventana nueva ni cierre local.
   - StatusRail es el real (Aceptaste → Listo → Recibido). Solo se le aplican estilos acotados en customer-pickup.css.
   - El pliegue es CSS y el contenido plegado queda `inert`; un role="alert" dentro del detalle nunca queda oculto (franja de aviso).
   - Mientras la acción viaja, ReadyPanel bloquea el botón y muestra «Guardando…». El aviso «Solicitud finalizada» solo aparece con stage==='finishing',
     que el controlador activa DESPUÉS de la respuesta verificada del servidor (el toast «Solicitud finalizada» sigue siendo el del controlador).
   ============================================================================================================ */
export type NvReceivedProps={variant:NvVariant;quantity:number;itemsText:string};
const RECEIVED_SUBTITLE='Solo falta finalizar la solicitud.';
function NvReceivedCard({id,name,price,expanded,onToggle,ready,busy=false,recovery,children,nvr}:{id:number;name:string;price:number|null;expanded:boolean;onToggle:()=>void;ready:ReadyModel;busy?:boolean;recovery?:ReactNode;children:ReactNode;nvr:NvReceivedProps}){
 const foldRef=useRef<HTMLDivElement>(null),[hasAlert,setHasAlert]=useState(false);
 const detailId=`receipt-detail-${id}`;
 useEffect(()=>{const el=foldRef.current;if(el)el.inert=!expanded||busy;},[expanded,busy]);
 useEffect(()=>{
  const el=foldRef.current;if(!el)return;
  const sync=()=>setHasAlert(!!el.querySelector('[role="alert"]'));
  sync();const mo=new MutationObserver(sync);mo.observe(el,{childList:true,characterData:true,subtree:true});return()=>mo.disconnect();
 },[]);
 const fromHeader=(e:React.MouseEvent<HTMLElement>)=>{
  if((e.target as HTMLElement).closest(OWN_CLICK))return;
  if(typeof window!=='undefined'&&window.getSelection?.()?.toString())return;
  onToggle();
 };
 // Éxito ya verificado por el servidor (el controlador pone stage='finishing' después de la respuesta): confirmación breve; luego la lista la regrupa en Historial.
 if(ready.stage==='finishing')return <article id={`order-${id}`} tabIndex={-1} className="zipco-nv-wrap scroll-mb-36">
  <div className="zipco-nv-h-ok" role="status"><span className="zipco-nv-h-ic"><Check size={20} strokeWidth={3} aria-hidden="true"/></span><div><b>Solicitud finalizada</b><p>Pasó a Historial.</p></div></div>
 </article>;
 const unknown=price===null,v=nvr.variant;
 const model:ReadyModel={...ready,subtitle:ready.subtitle??RECEIVED_SUBTITLE};
 return <article id={`order-${id}`} tabIndex={-1} className="zipco-nv-x-c zipco-nv-rc scroll-mb-36" data-ver="l" data-open={expanded} data-tone="ok" data-pickup-design="nv-received" data-variant={v} aria-busy={busy||!!ready.busy}>
  <div className="zipco-nv-x-hd" onClick={fromHeader}>
   <div className="zipco-nv-x-top">
    <span className="zipco-nv-x-pill"><i aria-hidden="true"><Check size={13} strokeWidth={3}/></i><b>Producto recibido</b></span>
    <button type="button" className="zipco-nv-x-tg" aria-expanded={expanded} aria-controls={detailId} onClick={e=>{e.stopPropagation();onToggle();}}><span className="zipco-nv-x-hand">{HAND_NV}</span><span>{expanded?'Ocultar':'Ver detalle'}</span><span className="zipco-nv-x-chv" aria-hidden="true"><ChevronDown size={14}/></span></button>
   </div>
   <div className="zipco-nv-x-id">
    <span className="zipco-nv-x-th"><ProductPreviewControl thumbnailLoading="eager" fallback={<ShoppingBag size={22} aria-hidden="true"/>}/><b>{nvr.quantity}×</b></span>
    <div className="zipco-nv-x-who"><small>NEGOCIO</small><h3>{name}</h3><span className="zipco-nv-x-pc">{nvr.itemsText}</span></div>
    <div className="zipco-nv-x-tot"><b data-u={unknown}>{unknown?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></div>
   </div>
   <div className="zipco-nv-rc-chips">
    <span className="zipco-nv-rc-chip"><MapPin size={12} aria-hidden="true"/>Retiro en el local</span>
    {v==='A'&&<span className="zipco-nv-rc-chip" data-k="ok"><Check size={12} strokeWidth={3} aria-hidden="true"/>Reserva sin pago previo</span>}
    {v==='B'&&<span className="zipco-nv-rc-chip" data-k="cy"><Check size={12} strokeWidth={3} aria-hidden="true"/>Reserva con pago previo</span>}
    {v==='C'&&<span className="zipco-nv-rc-chip"><Info size={12} aria-hidden="true"/>Retiro sin reserva</span>}
   </div>
  </div>
  <div className="zipco-nv-rc-now"><ReadyPanel model={model} tone="light" kind="pickup"/>{recovery}</div>
  {busy&&!ready.busy&&<p className="zipco-nv-x-bzs" role="status"><i className="zipco-nv-x-sp" aria-hidden="true"/>Guardando…</p>}
  {hasAlert&&!expanded&&<div className="zipco-nv-x-at" role="alert"><AlertTriangle size={18} aria-hidden="true"/><p>Hay un aviso que requiere tu atención.</p><button type="button" onClick={onToggle}>Ver detalle</button></div>}
  <div className="zipco-nv-x-fold" data-open={expanded} data-fold ref={foldRef} aria-hidden={!expanded}><div className="zipco-nv-x-fi"><div className="zipco-nv-x-det" id={detailId}>
   <StatusRail theme="light" stage="received" copy={{you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:ready.deliveryDeclared?'Entregado':'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'}}}/>
   {children}
  </div></div></div>
 </article>;
}

export default function CustomerPickupCard({id,name,product,price,expanded,onToggle,ready,busy=false,recovery,children,lineDesign=false,confirmedFreeDesign=false,arrivalDesign=false,nv=null,nvReceived=null}:{id:number;name:string;product:string;price:number|null;expanded:boolean;onToggle:()=>void;ready?:ReadyModel;busy?:boolean;recovery?:ReactNode;children:ReactNode;lineDesign?:boolean;confirmedFreeDesign?:boolean;arrivalDesign?:boolean;
 /** Diseño «Nuevo · Lista» para A (reserva sin pago confirmada), B (reserva con pago confirmada) y C (sin reserva). Lo decide CustomerReceiptFlowCardView; con `ready` (pedido listo/recibido) NUNCA se usa. */
 nv?:null|{variant:NvVariant;quantity:number;itemsText:string;done?:{label:string;out:boolean;requestFinished?:boolean}|null};
 /** «Producto recibido» (tablero NegW19) para A/B/C. Lo decide CustomerReceiptFlowCardView; exige `ready` en etapa received/finishing. Otras combinaciones conservan la composición anterior. */
 nvReceived?:NvReceivedProps|null}){
 const previousStage=useRef(ready?.stage);
 useEffect(()=>{
  // ReadyPanel changes owner when this variant first receives the product.
  // Preserve its existing focus transfer to the finalization control.
  if(nvReceived&&ready?.stage==='received'&&previousStage.current==='ready')document.getElementById(`order-${id}`)?.querySelector<HTMLButtonElement>('.zipco-own-cta')?.focus({preventScroll:true});
  previousStage.current=ready?.stage;
 },[ready?.stage,nvReceived,id]);
 const received=ready?.stage==='received'||ready?.stage==='finishing';
 const total=<span className="zipco-pickup-c-total"><b data-unknown={price===null}>{price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></span>;

 // «Producto recibido»: nuevo diseño para A/B/C (ver NvReceivedCard).
 if(nvReceived&&ready&&received)return <NvReceivedCard id={id} name={name} price={price} expanded={expanded} onToggle={onToggle} ready={ready} busy={busy} recovery={recovery} nvr={nvReceived}>{children}</NvReceivedCard>;
 // Diseño «Nuevo · Lista»: A/B/C. `ready` (listo/recibido) conserva siempre la composición anterior.
 if(nv&&!ready){
  const c=nv.variant==='C';
  return <NvCardFrame id={id} detailId={`receipt-detail-${id}`} tone={c?'cy':'ok'} pill={c?'Retiro sin reserva':'Reserva confirmada'} modality={{kind:'pickup',label:'Retiro en el local'}} name={name} itemsText={nv.itemsText} quantity={nv.quantity} price={price}
   steps={[c?'Aceptado':'Confirmado','Preparando','Retiro']} subs={['Tu solicitud fue aceptada','En proceso','Pendiente']}
   message={c?{closed:'El producto no está reservado y puede agotarse. Revisa las instrucciones del negocio.',open:'El producto no está reservado y puede agotarse. Revisa las instrucciones del negocio.'}:{closed:'El negocio está preparando tu pedido. Cuando avise que está listo, lo verás aquí.',open:'El negocio está preparando tu pedido. Cuando avise que está listo, lo verás aquí.'}}
   expanded={expanded} onToggle={onToggle} busy={busy} recovery={recovery} done={nv.done}>{children}</NvCardFrame>;
 }
 // «Pedido listo» / «Producto recibido»: se conserva la composición anterior tal cual (fuera del alcance del rediseño).
 // Variantes con cabecera «de línea»: pago previo pendiente (`lineDesign`) y reserva sin pago previo confirmada (`confirmedFreeDesign`).
 // Ambas las decide el contenedor con datos del servidor; `lineDesign` tiene prioridad y «pedido listo / recibido» (`ready`) conserva siempre la composición anterior.
 const design:'line'|'confirmed'|null=ready?null:lineDesign?'line':confirmedFreeDesign||arrivalDesign?'confirmed':null;
 if(!design)return <article id={`order-${id}`} tabIndex={-1} className="zipco-pickup-c scroll-mb-36" data-ready={!!ready} data-leaving={ready?.stage==='finishing'} aria-busy={busy}>
  <button type="button" className="zipco-pickup-c-head" aria-expanded={expanded} aria-controls={`receipt-detail-${id}`} onClick={onToggle}>
   <span className="zipco-pickup-c-tile"><Package size={22}/></span>
   <span style={{flex:1,minWidth:0}}><b className="zipco-pickup-c-name">{name}</b><span className="zipco-pickup-c-meta"><span className="zipco-pickup-c-prod">{product}</span><b className="zipco-pickup-c-pill">{received?'Producto recibido':ready?.deliveryDeclared?'Entrega declarada':ready?'¡pedido listo!':'Pendiente de retiro'}</b></span></span>
   <span className="zipco-pickup-c-total"><b>{price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></span><span className="zipco-own-chv" data-open={expanded}><ChevronDown size={16}/></span>
  </button>
  <StatusRail theme="light" stage={received?'received':ready?'ready':'wait'} copy={{you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:ready?.deliveryDeclared?'Entregado':'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:ready?.deliveryDeclared?'Por confirmar':'¡Listo!',received:'Recibido'}}}/>
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
    <span className="zipco-pickup-c-state"><i aria-hidden="true">{design==='confirmed'?<Check size={13} strokeWidth={3.2}/>:<Hourglass size={13} strokeWidth={2.8}/>}</i><b>{arrivalDesign?'Retiro en el local':design==='confirmed'?'Pendiente de retiro':'Esperando al negocio'}</b></span>
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
