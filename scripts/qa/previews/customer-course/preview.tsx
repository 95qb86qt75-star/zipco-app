// Development-only design sandbox. No orders, authentication, storage or API calls.
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import CustomerPickupCard from "/src/app/features/requests/cards/customer/local-pickup/CustomerPickupCard";
import CustomerReceiptDetails from "/src/app/features/requests/cards/customer/progress/CustomerReceiptDetails";
import { ConditionsSheet } from "/src/app/features/requests/shared/conditions/CoordinationSheets";
import { agreementFixture } from "/src/app/features/requests/fixtures/requestProcessFixtures";
import '/src/styles/index.css';

import './preview.css';
import CustomerCoordinationCard from "/src/app/features/requests/cards/customer/whatsapp/CustomerCoordinationCard";
import { ProductPreviewScope } from "/src/app/features/requests/shared/product-preview/ProductPreviewControl";
import ReadyPanel, { type ReadyModel, type ReadyStage } from "/src/app/features/requests/shared/feedback/ReadyPanel";
import StatusRail from "/src/app/features/requests/shared/feedback/StatusRail";

function PickupPreview(){
 const [stage,setStage]=useState<'waiting'|ReadyStage|'history'>('waiting'),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>>(),locked=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(stage!=='finishing')return;const id=setTimeout(()=>setStage('history'),matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000);return()=>clearTimeout(id);},[stage]);
 const simulate=(next:ReadyStage)=>{if(locked.current)return;locked.current=true;setBusy(true);timer.current=setTimeout(()=>{locked.current=false;setBusy(false);setStage(next);},650);};
 const ready:ReadyModel|undefined=['waiting','history'].includes(stage)?undefined:{stage:stage as ReadyStage,busy,onConfirmReceipt:()=>simulate('received'),onFinish:()=>simulate('finishing')};
 return <section data-pickup-preview>
  <h2 className="course-preview-label">Opción 2 · Retiro en el local</h2>
  {stage!=='history'?<CustomerPickupCard id={900002} name="Negocio de demostración" product="1× Producto de demostración" price={5000} expanded={open} onToggle={()=>setOpen(v=>!v)} ready={ready} busy={busy}><PreviewDetails/></CustomerPickupCard>:<p role="status" className="course-preview-history">Retiro de demostración finalizado.</p>}
  <div className="course-preview-controls"><button data-pickup-reset onClick={()=>{clearTimeout(timer.current);locked.current=false;setBusy(false);setStage('waiting');setOpen(false);}}>Reiniciar retiro</button><button data-pickup-ready disabled={stage!=='waiting'} onClick={()=>{setOpen(false);setStage('ready');}}>Simular retiro listo</button></div>
 </section>;
}

function PreviewDetails(){
 const [open,setOpen]=useState(false);
 return <><CustomerReceiptDetails summary="1× Producto de demostración · Lo antes posible" onConditions={()=>setOpen(true)}/><ConditionsSheet fullAgreement open={open} onOpenChange={setOpen} accepted={agreementFixture} title="Producto de demostración" subtitle="Datos ficticios de la vista local" when="Lo antes posible"/></>;
}
function Preview(){
 const [stage,setStage]=useState<'waiting'|ReadyStage|'history'>('waiting');
 const [expanded,setExpanded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[fail,setFail]=useState(false),[toast,setToast]=useState(false);
 const lock=useRef(false),timer=useRef<ReturnType<typeof setTimeout>>();
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const reset=()=>{clearTimeout(timer.current);lock.current=false;setStage('waiting');setExpanded(false);setBusy(false);setError('');setToast(false);};
 const simulate=(next:ReadyStage)=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  timer.current=setTimeout(()=>{lock.current=false;setBusy(false);if(fail){setError('Simulación: no se pudo guardar. Puedes reintentar.');return;}setStage(next);},650);
 };
 const ready:ReadyModel|undefined=stage==='waiting'||stage==='history'?undefined:{stage,busy,error,onConfirmReceipt:()=>simulate('received'),onFinish:()=>simulate('finishing'),onLeaveEnd:()=>{setStage('history');setToast(true);}};
 const preview={contract:'order-product-preview-v1' as const,proposalId:1,items:[{lineIndex:0,catalogItemId:1,source:'CATALOG' as const,name:'Producto de demostración',description:'Ejemplo visual sin pedido asociado.',quantity:1,unitPriceClp:5000,subtotalClp:5000,imageUrl:null}]};
 return <main className="course-preview">
  <aside className="course-preview-notice"><strong>Vista de prueba · datos ficticios</strong><p>Los botones simulan el diseño. No modifican solicitudes ni confirman recepciones reales.</p></aside>
  <h1>Solicitudes</h1>
  <h2 className="course-preview-label">Opción 1 · Coordinación por WhatsApp</h2>
  <section className="course-preview-controls" aria-label="Controles de demostración">
   <button onClick={reset}>Reiniciar</button>
   <button disabled={stage!=='waiting'} onClick={()=>{setExpanded(false);setStage('ready');}}>Simular pedido listo</button>
   <label><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/> Simular error</label>
  </section>
  <nav className="course-preview-tabs" aria-label="Categorías simuladas"><span>En curso <b>{stage==='history'?0:1}</b></span><span className={toast?'zipco-tab-bump':''}>Historial <b>{stage==='history'?1:0}</b></span></nav>
  <div data-requests-scroll>
   {stage!=='history'?<ProductPreviewScope preview={preview} processId={1} proposalId={1} enabled>
    <CustomerCoordinationCard id={900001} name="Negocio de demostración" price={5000} quantity={1} items={[{name:'Producto de demostración',quantity:1}]} description="Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda." ready={ready}
     model={{mode:'ownPending',busy:false,expanded,attention:false,canYes:false,canNo:false,error:'',onToggle:()=>setExpanded(v=>!v),onYes:()=>{},onNo:()=>{},onCancel:()=>{},onReturn:()=>{}}}><PreviewDetails/></CustomerCoordinationCard>
   </ProductPreviewScope>:<p role="status" className="course-preview-history">Solicitud de demostración finalizada.</p>}
  </div>
  <PickupPreview/>
  {toast&&<div role="status" className="course-preview-toast"><strong>Solicitud finalizada · simulación</strong><button onClick={()=>{setToast(false);document.querySelector('.course-preview-history')?.scrollIntoView({behavior:'smooth'});}}>Ver</button></div>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
