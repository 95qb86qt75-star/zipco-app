import { useEffect, useRef, useState } from 'react';
import { BusinessClosureError, closureBody, readBusinessClosureResult, sendBusinessClosure, type ClosureIntent, type ClosureReceipt } from '../api/businessClosureApi';
import { knownBusinessClosureHeaders } from '../api/businessClosureCapabilities';
import { refreshCoordinationOrder } from '../api/coordinationApi';
import { readCoordinationSession, subscribeCoordinationSession } from './intents/coordinationSession';
import { businessClosureLocks, closureSlot, confirmClosureIntent, readClosureIntent, writeClosureIntent } from './intents/businessClosureIntent';
import { DELIVERY_BLOCK_COPY, type BusinessClosureReason, type DeliveryBlock } from '../domain/businessClosure';
import type { BusinessProgressCardModel } from '../cards/business/progress/application/useBusinessProgressCardController';

export default function useBusinessClosure(model:BusinessProgressCardModel){
  const {order,process,embedded,service,operation,pending,recoveryOnly,refresh}=model;
  const session=useRef(readCoordinationSession()).current;
  const slot=session?.businessId&&process?closureSlot(session.userId,session.businessId,process.id):'';
  const mounted=useRef(true),intent=useRef<ClosureIntent|null>(null),receipt=useRef<ClosureReceipt|null>(null);
  const [busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[message,setMessage]=useState('');
  const [block,setBlock]=useState<DeliveryBlock|null>(null),[storageBlocked,setStorageBlocked]=useState(false);
  const [,revision]=useState(0);
  const active=()=>mounted.current&&session!==null&&readCoordinationSession()===session;
  useEffect(()=>{
    mounted.current=true;
    try{
      intent.current=slot?readClosureIntent(sessionStorage,slot):null;
      if(intent.current&&(intent.current.orderId!==order.id||intent.current.processId!==process?.id||intent.current.agreementPublicId!==process?.agreementPublicId))throw Error('Identity mismatch');
      setUncertain(!!intent.current);
    }catch{setStorageBlocked(true);setMessage('No pudimos recuperar el envío. Conserva esta sesión y comprueba el pedido antes de continuar.');}
    const unsubscribe=subscribeCoordinationSession(()=>{if(!active())revision(v=>v+1);});
    return()=>{mounted.current=false;unsubscribe();};
  },[slot]);
  useEffect(()=>{setBlock(null);},[process?.version]);
  const eligible=active()&&!embedded&&!service&&order.recordState==='available'&&!!process?.agreementPublicId&&
    !process.localPickupInformation&&!process.businessClosure&&process.state==='IN_PROGRESS'&&
    (!process.customerReceipt||process.customerReceipt.status==='AWAITING_RECEIPT')&&!!knownBusinessClosureHeaders(session!.token)['X-Business-Order-Closure-Contract'];
  const canDeliver=!!eligible&&!!process?.allowedActions.includes('BUSINESS_DECLARE_DELIVERY');
  const canClose=!!eligible&&!!process?.allowedActions.includes('BUSINESS_CLOSE_WITHOUT_DELIVERY');
  const deliveryBlock=block??process?.businessClosureOptions?.deliveryBlock??null;
  const blocked=busy||operation.busy||!!pending||!!recoveryOnly||storageBlocked;
  const publish=()=>{
    if(!active()||!receipt.current)return;
    window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:receipt.current}));
    window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));refresh();
  };
  const settle=async(result:ClosureReceipt)=>{
    if(!active()||!session||!process)return false;
    receipt.current=result;
    // Confirm durably before cleanup: a cleanup failure must never permit resending.
    try{confirmClosureIntent(sessionStorage,slot,intent.current!);intent.current=null;setUncertain(false);}
    catch{setStorageBlocked(true);setMessage('El cierre fue confirmado. No repitas el envío; actualiza el pedido.');}
    try{
      const latest=await refreshCoordinationOrder(order.id,true,session.token,session.businessId);
      if(!active())return false;
      if(!latest?.requestProcess||latest.requestProcess.version<result.requestProcess.version||latest.requestProcess.businessClosure?.eventId!==result.requestProcess.businessClosure?.eventId)throw Error('Read not reconciled');
      receipt.current={orderId:order.id,orderStatus:latest.status as ClosureReceipt['orderStatus'],requestProcess:latest.requestProcess};
    }catch{if(active())setMessage('El cierre fue confirmado. Actualiza el pedido; no lo vuelvas a enviar.');}
    return active();
  };
  const run=async(kind:'DELIVERED'|'NOT_COMPLETED',reason?:BusinessClosureReason,detail?:string):Promise<'saved'|'failed'|'unknown'>=>{
    if(!active()||!process||!session||blocked||intent.current||businessClosureLocks.has(slot)||
      (kind==='DELIVERED'?!canDeliver:!canClose))return 'failed';
    businessClosureLocks.add(slot);setBusy(true);setMessage('');
    try{
      const body=closureBody(kind==='DELIVERED'?'BUSINESS_DECLARE_DELIVERY':'BUSINESS_CLOSE_WITHOUT_DELIVERY',process.version,reason,detail);
      const next:ClosureIntent={key:crypto.randomUUID(),action:kind==='DELIVERED'?'BUSINESS_DECLARE_DELIVERY':'BUSINESS_CLOSE_WITHOUT_DELIVERY',body,processId:process.id,orderId:order.id,agreementPublicId:process.agreementPublicId!};
      try{writeClosureIntent(sessionStorage,slot,next);}catch{setStorageBlocked(true);setMessage('No se pudo guardar la protección del envío. No enviamos el cierre.');return 'failed';}
      intent.current=next;
      const result=await sendBusinessClosure(next,process,session.token);
      return await settle(result)?'saved':'unknown';
    }catch(error){
      if(!active())return 'unknown';
      if(!intent.current){setMessage(error instanceof Error?error.message:'No enviamos el cierre. Revisa sus datos.');return 'failed';}
      const definitive=error instanceof BusinessClosureError&&[400,401,403,404,409].includes(error.status)&&error.code!=='IDEMPOTENCY_KEY_REUSED';
      setMessage(error instanceof Error?error.message:'No sabemos si se guardó. Comprueba el estado antes de continuar.');
      if(error instanceof BusinessClosureError&&error.block)setBlock(error.block);
      if(definitive){
        try{sessionStorage.removeItem(slot);intent.current=null;}catch{setStorageBlocked(true);setUncertain(true);return 'unknown';}
        return 'failed';
      }
      setUncertain(true);return 'unknown';
    }finally{businessClosureLocks.delete(slot);if(active())setBusy(false);}
  };
  const check=async():Promise<boolean>=>{
    if(!active()||busy||!process||!session||businessClosureLocks.has(slot))return false;
    businessClosureLocks.add(slot);setBusy(true);
    try{
      if(!intent.current){await operation.update();return false;}
      const result=await readBusinessClosureResult(intent.current,process,session.token);
      if(!active())return false;
      if(!result){setUncertain(true);setMessage('Todavía no hay un recibo confirmado. Conservamos el envío original; no lo reenvíes.');return false;}
      return await settle(result);
    }catch{if(active())setMessage('No pudimos comprobar el cierre. Conservamos la clave y las condiciones originales.');return false;}
    finally{businessClosureLocks.delete(slot);if(active())setBusy(false);}
  };
  return {available:!!eligible&&(canDeliver||canClose||!!intent.current),canDeliver,canClose,blocked,uncertain,message,
    deliveryBlock,blockMessage:deliveryBlock?DELIVERY_BLOCK_COPY[deliveryBlock.cause]:null,
    reasonCodes:process?.businessClosureOptions?.reasonCodes??[],run,check,publish};
}
