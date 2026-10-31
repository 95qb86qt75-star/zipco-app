
import { useEffect, useRef, useState } from 'react';




import type { CustomerAcceptedProgressProps } from "../customerAcceptedProgressProps";
import { type ReadyModel } from "../../../../shared/feedback/ReadyPanel";



import { coordinationAllowed } from "../../../../api/coordinationApi";
import useCoordination from "../../../../application/useCoordination";
import useCoordinationMotion from "../../../../application/motion/useCoordinationMotion";
import { readCoordinationSession } from "../../../../application/intents/coordinationSession";
import { showStatusToast } from "../../../../shared/feedback/statusToast";
import { markStatusArrival } from "../../../../shared/feedback/statusChangePresentation";
import { presentCustomerProgress } from "../customerProgressFeedback";

/** One product presentation; existing v2 and legacy controllers keep their semantics. */

/** One product presentation; existing v2 and legacy controllers keep their semantics. */

export function useCustomerReceiptFlowCardController(props:CustomerAcceptedProgressProps&{coordinationPending?:boolean}){

 const {order,businessName,price,accepted,acceptedAt,conditionsTitle,conditionsSubtitle,conditionsWhen,conditionsSummary,explanation,negotiated,refresh,notificationOpen=0,onInspect,coordinationPending=false}=props;
 const [expanded,setExpanded]=useState(false),[sheet,setSheet]=useState<'cond'|'agree'|null>(null),[finishing,setFinishing]=useState(false);
 const [legacyConfirm,setLegacyConfirm]=useState<'ACK_READY_NOTICE'|'CONFIRM_RECEIPT'|null>(null);
 const mounted=useRef(true),session=useRef(readCoordinationSession()),lock=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(notificationOpen>0)setExpanded(true);},[notificationOpen]);
 const operation=useCoordination(order,false,refresh,false,undefined,async (action,key)=>{
   if(action==='ACK_READY_NOTICE'||action==='CONFIRM_RECEIPT'){
    setLegacyConfirm(null);await presentCustomerProgress(action,key,Date.now(),()=>{});
   }
  if(!['FINALIZE_REQUEST','CONFIRM_RECEIPT'].includes(action)||!mounted.current||readCoordinationSession()!==session.current)return;
  setFinishing(true);
  await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:950));
 });
 const process=order.requestProcess,received=process?.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION',ready=process?.state==='READY';
 const pickup=process?.availability?.path==='LOCAL_PICKUP',pending=operation.pending(),recovery=operation.needsUpdate||operation.restored()||!!operation.storageWarning();
 const motion=useCoordinationMotion(sheet!==null);
 const toast=(view:'active'|'history'|'ready')=>showStatusToast({tone:'green',title:view==='ready'?'Aviso confirmado':view==='active'?'Producto recibido':'Solicitud finalizada',line:view==='ready'?'Pendiente de recepción.':view==='active'?'Pendiente de finalizar. El pedido sigue en En curso.':'Ya la encuentras en Historial.',actionLabel:'Ver',onAction:()=>{window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:false,view,explicit:true}}));markStatusArrival(order.id,false);}});
 const submit=async(action:'DECLARE_PRODUCT_RECEIVED'|'FINALIZE_REQUEST'|'ACK_READY_NOTICE'|'CONFIRM_RECEIPT',retry=false)=>{
  if(lock.current||operation.busy||recovery||!retry&&pending)return;
  lock.current=true;
  const ok=retry?await operation.retry():await operation.run(action);
  const verified=operation.currentOrder()?.requestProcess;
  if(readCoordinationSession()===session.current){
   if(ok&&verified&&(action==='FINALIZE_REQUEST'||action==='CONFIRM_RECEIPT'?verified.state==='COMPLETED':action==='ACK_READY_NOTICE'?verified.readyNoticeAcknowledged===true:verified.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION')){setLegacyConfirm(null);toast(action==='FINALIZE_REQUEST'||action==='CONFIRM_RECEIPT'?'history':action==='ACK_READY_NOTICE'?'ready':'active');}
   else if(mounted.current)setFinishing(false);
  }
  lock.current=false;
 };
 const update=async()=>{await operation.update();if(readCoordinationSession()!==session.current)return;const verified=operation.currentOrder()?.requestProcess;if(verified?.customerReceipt?.status==='RECEIVED_PENDING_FINALIZATION')toast('active');else if(verified?.customerReceipt?.status==='FINALIZED')toast('history');};
 const blocked=operation.busy||!!pending||!!recovery||order.recordState!=='available';
 const v2=!!process?.customerReceipt;
 const receiveAction=v2?'DECLARE_PRODUCT_RECEIVED':process?.readyNoticeAcknowledged===true?'CONFIRM_RECEIPT':'ACK_READY_NOTICE';
 const receive=()=>{if(v2)void submit('DECLARE_PRODUCT_RECEIVED');else setLegacyConfirm(receiveAction as 'ACK_READY_NOTICE'|'CONFIRM_RECEIPT');};
 const model:ReadyModel|undefined=ready?{stage:finishing?'finishing':received?'received':'ready',busy:operation.busy,disabled:blocked||!coordinationAllowed(process,false,received?'FINALIZE_REQUEST':receiveAction),error:operation.message,...(!v2?{title:process?.readyNoticeAcknowledged?'Aviso confirmado':'Tu pedido se encuentra listo',subtitle:process?.readyNoticeAcknowledged?'Confirma la recepción solo cuando ya tengas el producto.':'Confirma que viste el aviso; esto no confirma la recepción.',confirmLabel:process?.readyNoticeAcknowledged?'Confirmar recepción':'Confirmar aviso'}:{}),onConfirmReceipt:receive,onFinish:()=>void submit('FINALIZE_REQUEST')}:undefined;

return {accepted,acceptedAt,blocked,businessName,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,coordinationPending,expanded,explanation,legacyConfirm,model,motion,negotiated,onInspect,operation,order,pending,pickup,price,process,ready,received,recovery,refresh,setExpanded,setLegacyConfirm,setSheet,sheet,submit,update};
}
export type CustomerReceiptFlowCardModel=ReturnType<typeof useCustomerReceiptFlowCardController>;
