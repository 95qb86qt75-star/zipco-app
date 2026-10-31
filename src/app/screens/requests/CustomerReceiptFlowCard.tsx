import {useEffect,useRef,useState,type ComponentProps} from 'react';
import {ChevronDown,ChevronRight,CircleCheck,Package} from 'lucide-react';
import CustomerCoordinationCard from './CustomerCoordinationCard';
import type CustomerProgressCard from './CustomerProgressCard';
import ReadyPanel,{type ReadyModel} from './ReadyPanel';
import StatusRail from './StatusRail';
import {DetailReveal} from './AvailabilityWaitingCard';
import {ConditionsSheet} from './CoordinationSheets';
import AgreementSheet from './AgreementSheet';
import AvailabilityPostActions from './AvailabilityPostActions';
import WhatsAppMark from './WhatsAppMark';
import {coordinationAllowed} from './coordinationApi';
import useCoordination from './useCoordination';
import useCoordinationMotion from './useCoordinationMotion';
import {readCoordinationSession} from './coordinationSession';
import {showStatusToast} from './statusToast';
import {markStatusArrival} from './statusChangePresentation';

/** v2 receipt actions use the existing durable intent/reconciliation controller. */
export default function CustomerReceiptFlowCard(props:ComponentProps<typeof CustomerProgressCard>){
 const {order,businessName,price,accepted,acceptedAt,conditionsTitle,conditionsSubtitle,conditionsWhen,conditionsSummary,explanation,negotiated,refresh,notificationOpen=0,onInspect}=props;
 const [expanded,setExpanded]=useState(false),[sheet,setSheet]=useState<'cond'|'agree'|null>(null),[finishing,setFinishing]=useState(false);
 const mounted=useRef(true),session=useRef(readCoordinationSession()),lock=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(notificationOpen>0)setExpanded(true);},[notificationOpen]);
 const operation=useCoordination(order,false,refresh,false,undefined,async action=>{
  if(action!=='FINALIZE_REQUEST'||!mounted.current||readCoordinationSession()!==session.current)return;
  setFinishing(true);
  await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:950));
 });
 const process=order.requestProcess,received=process?.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION',ready=process?.state==='READY';
 const pickup=process?.availability?.path==='LOCAL_PICKUP',pending=operation.pending(),recovery=operation.needsUpdate||operation.restored()||!!operation.storageWarning();
 const motion=useCoordinationMotion(sheet!==null);
 const toast=(view:'active'|'history')=>showStatusToast({tone:'green',title:view==='active'?'Producto recibido':'Solicitud finalizada',line:view==='active'?'Pendiente de finalizar. El pedido sigue en En curso.':'Ya la encuentras en Historial.',actionLabel:'Ver',onAction:()=>{window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:false,view,explicit:true}}));markStatusArrival(order.id,false);}});
 const submit=async(action:'DECLARE_PRODUCT_RECEIVED'|'FINALIZE_REQUEST',retry=false)=>{
  if(lock.current||operation.busy||recovery||!retry&&pending)return;
  lock.current=true;
  const ok=retry?await operation.retry():await operation.run(action);
  const verified=operation.currentOrder()?.requestProcess;
  if(readCoordinationSession()===session.current){
   if(ok&&verified&&(action==='FINALIZE_REQUEST'?verified.state==='COMPLETED':verified.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION'))toast(action==='FINALIZE_REQUEST'?'history':'active');
   else if(mounted.current)setFinishing(false);
  }
  lock.current=false;
 };
 const update=async()=>{await operation.update();if(readCoordinationSession()!==session.current)return;const verified=operation.currentOrder()?.requestProcess;if(verified?.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION')toast('active');else if(verified?.customerReceipt?.status==='FINALIZED')toast('history');};
 const blocked=operation.busy||!!pending||!!recovery||order.recordState!=='available';
 const model:ReadyModel|undefined=ready?{stage:finishing?'finishing':received?'received':'ready',busy:operation.busy,disabled:blocked||!coordinationAllowed(process,false,received?'FINALIZE_REQUEST':'DECLARE_PRODUCT_RECEIVED'),error:operation.message,onConfirmReceipt:()=>void submit('DECLARE_PRODUCT_RECEIVED'),onFinish:()=>void submit('FINALIZE_REQUEST')}:undefined;
 const recoveryControls=(pending||recovery)&&!operation.busy?<div className="zipco-receipt-recovery"><p>{operation.storageWarning()||'Comprueba el estado del pedido antes de continuar.'}</p><button type="button" onClick={()=>void update()}>Actualizar estado</button>{pending&&!recovery&&['DECLARE_PRODUCT_RECEIVED','FINALIZE_REQUEST'].includes(pending.action)&&<button type="button" onClick={()=>void submit(pending.action as 'DECLARE_PRODUCT_RECEIVED'|'FINALIZE_REQUEST',true)}>Reintentar el mismo envío</button>}</div>:null;
 const subject=accepted.subjectSnapshot,items=subject.items.map(item=>({name:item.nameSnapshot,quantity:item.quantity})),quantity=items.reduce((sum,i)=>sum+i.quantity,0);
 const description=received?'Producto recibido · Pendiente de finalizar.':ready?'El negocio avisó que tu pedido está listo.':'El negocio está preparando tu pedido.';
 const details=<>
  <button type="button" className="zipco-co-strip2" onClick={()=>setSheet('cond')}><span className="zipco-co-strip2-ic"><CircleCheck size={16}/></span><span><span className="zipco-co-strip2-l">Condiciones aceptadas</span><span className="zipco-co-strip2-v">{conditionsSummary}</span></span><ChevronRight size={16}/></button>
  <p className="mt-3 text-xs">ZIPCO no procesa ni verifica pagos.</p>
  {coordinationAllowed(process,false,'OPEN_WHATSAPP')&&<button className="zipco-co-go2" disabled={blocked} onClick={()=>void operation.run('OPEN_WHATSAPP')}><WhatsAppMark className="h-4 w-4"/> Escribir al negocio</button>}
  <AvailabilityPostActions order={order} business={false} refresh={refresh}/>
 </>;
 const dialogs=<><ConditionsSheet fullAgreement open={sheet==='cond'} onOpenChange={value=>setSheet(value?'cond':null)} accepted={accepted} title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation} explanationLabel={negotiated?'Explicación de la propuesta aceptada':'Tu nota'} onOpenAgreement={()=>setSheet('agree')}/><AgreementSheet open={sheet==='agree'} onOpenChange={value=>setSheet(value?'agree':null)} processId={process?.id} client={businessName} perspective="customer" accepted={accepted} acceptedAt={acceptedAt}/></>;
 return <div ref={motion as React.RefObject<HTMLDivElement>}>
  {pickup?<article id={`order-${order.id}`} tabIndex={-1} className="zipco-pickup-c scroll-mb-36" data-ready={ready} data-leaving={finishing} aria-busy={operation.busy}>
   <button type="button" className="zipco-pickup-c-head" aria-expanded={expanded} aria-controls={`receipt-detail-${order.id}`} onClick={()=>{onInspect?.();setExpanded(v=>!v);}}><span className="zipco-pickup-c-tile"><Package size={22}/></span><span style={{flex:1,minWidth:0}}><b className="zipco-pickup-c-name">{businessName}</b><span className="zipco-pickup-c-state">{conditionsTitle} · <b>{received?'Producto recibido':ready?'¡pedido listo!':'Pendiente de retiro'}</b></span></span><span className="zipco-pickup-c-total"><b>{price===null?'Total por comprobar':'$'+price.toLocaleString('es-CL')}</b><small>ACORDADO</small></span><span className="zipco-own-chv" data-open={expanded}><ChevronDown size={16}/></span></button>
   <StatusRail theme="light" stage={received?'received':ready?'ready':'wait'} copy={{you:{label:'TÚ',text:'Aceptaste'},business:{label:'NEGOCIO',waiting:'Preparando',ready:'Listo'},third:{label:'RETIRO',waiting:'Pendiente',ready:'¡Listo!',received:'Recibido'}}}/>
   <ReadyPanel model={model} tone="light" kind="pickup"/>{recoveryControls}
   <DetailReveal expanded={expanded}><div id={`receipt-detail-${order.id}`} className="zipco-receipt-local-detail">{details}</div></DetailReveal>
  </article>:<CustomerCoordinationCard id={order.id} name={businessName} price={price} quantity={quantity} items={items} ready={model} preparing description={description} model={{mode:'ownPending',expanded,busy:operation.busy,attention:false,canYes:false,canNo:false,error:ready?'':operation.message,recovery:recoveryControls,onToggle:()=>{onInspect?.();setExpanded(v=>!v);},onYes:()=>{},onNo:()=>{},onReturn:()=>{},onCancel:()=>{}}}>{details}</CustomerCoordinationCard>}
  {dialogs}
 </div>;
}
