import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronRight, ClipboardCheck, PackageCheck, CircleX } from 'lucide-react';
import type useBusinessClosure from '../../../application/useBusinessClosure';
import { BUSINESS_CLOSURE_REASONS, type BusinessClosureReason } from '../../../domain/businessClosure';
import type { BusinessProgressCardModel } from './application/useBusinessProgressCardController';

type Contract=ReturnType<typeof useBusinessClosure>;
export const CloseRequestContext=React.createContext<Contract|null>(null);
export function useCloseRequestAvailable(embedded?:boolean){
  const contract=React.useContext(CloseRequestContext);
  return {available:!!contract?.available&&!embedded,busy:!!contract?.blocked||!!contract?.uncertain};
}
const OPEN='zipco:close-request-open',CLOSED='zipco:close-request-closed',SAVED='zipco:close-request-saved';
type Step='pick'|'delivered'|'notDone'|'saving'|'failed'|'unknown';
export function CloseRequest({model}:{model:BusinessProgressCardModel}){
  const contract=React.useContext(CloseRequestContext)!;
  const {client,conditionsSummary,embedded,motionRef,order,price,setFolded}=model;
  const [open,setOpen]=React.useState(false),[step,setStep]=React.useState<Step>('pick');
  const [reason,setReason]=React.useState<BusinessClosureReason|null>(null),[detail,setDetail]=React.useState('');
  const title=React.useRef<HTMLHeadingElement>(null),trigger=React.useRef<HTMLElement|null>(null),lock=React.useRef(false);
  const kind=React.useRef<'DELIVERED'|'NOT_COMPLETED'>('DELIVERED');
  const enabled=contract.available&&!embedded,saving=step==='saving'||contract.blocked;
  const prepaid=order.requestProcess?.reservation?.mode==='PREPAYMENT';
  const show=React.useCallback(()=>{
    trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setStep(contract.uncertain?'unknown':'pick');setOpen(true);
  },[contract.uncertain]);
  const leave=(saved=false)=>{
    setOpen(false);
    if(!saved){motionRef.current?.dispatchEvent(new CustomEvent(CLOSED,{bubbles:true}));return;}
    // List reads already reconciled. Only the visible row presentation may wait for its own animation.
    let claimed=false,finished=false;
    const complete=()=>{if(finished)return;finished=true;contract.publish();};
    motionRef.current?.dispatchEvent(new CustomEvent(SAVED,{bubbles:true,detail:{complete,claim:()=>{claimed=true;}}}));
    if(!claimed)complete();
  };
  React.useEffect(()=>{
    const node=motionRef.current;if(!enabled||!node)return;
    node.addEventListener(OPEN,show);return()=>node.removeEventListener(OPEN,show);
  },[enabled,motionRef,show]);
  if(!enabled)return null;
  const send=async()=>{
    if(lock.current||saving||contract.uncertain)return;
    lock.current=true;setStep('saving');
    try{
      const outcome=await contract.run(kind.current,reason??undefined,detail);
      if(outcome==='saved')leave(true);else setStep(outcome==='unknown'?'unknown':'failed');
    }finally{lock.current=false;}
  };
  const check=async()=>{if(lock.current)return;lock.current=true;try{if(await contract.check())leave(true);}finally{lock.current=false;}};
  const choose=(value:'DELIVERED'|'NOT_COMPLETED')=>{kind.current=value;setStep(value==='DELIVERED'?'delivered':'notDone');};
  const openReservation=()=>{
    leave();setFolded(false);
    if(!contract.deliveryBlock?.reservationId||contract.deliveryBlock.reservationId!==order.requestProcess?.reservation?.id){void model.operation.update();return;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const panel=motionRef.current?.querySelector<HTMLElement>('[data-reservation-details]');
      panel?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      panel?.focus({preventScroll:true});
    }));
  };
  const heading=step==='pick'?'Cerrar solicitud':step==='notDone'?'¿No se concretó?':step==='saving'?'Guardando…':
    step==='failed'||step==='unknown'?'No pudimos confirmar el resultado':'Finalizar solicitud';
  return <>
    <button type="button" className="zipco-cr-open" aria-haspopup="dialog" onClick={show}>
      <span className="zipco-cr-open-ic" aria-hidden="true"><ClipboardCheck size={18}/></span>
      <span className="zipco-cr-open-tx"><b>Cerrar solicitud</b><small>Ya entregué · No se concretó</small></span><ChevronRight size={15}/>
    </button>
    <Dialog.Root open={open} onOpenChange={value=>{if(!value&&!saving)leave();}}>
      <Dialog.Portal>
        <Dialog.Overlay className="zipco-cr-ov"/>
        <Dialog.Content className="zipco-cr-sheet" aria-describedby={undefined}
          onOpenAutoFocus={event=>{event.preventDefault();title.current?.focus();}}
          onCloseAutoFocus={event=>{
            event.preventDefault();
            const previous=trigger.current;
            const fallback=motionRef.current?.querySelector<HTMLElement>('.zipco-co-colrow[data-folded="true"],.zipco-cr-open');
            (previous?.isConnected&&previous.getClientRects().length&&!previous.closest('[inert]')?previous:fallback)?.focus({preventScroll:true});
          }}
          onEscapeKeyDown={event=>{if(saving)event.preventDefault();}}
          onInteractOutside={event=>{if(saving)event.preventDefault();}}>
          <div className="zipco-cr-hd"><span className="zipco-cr-orb" aria-hidden="true"><ClipboardCheck size={22}/></span>
            <div><Dialog.Title ref={title} tabIndex={-1} className="zipco-cr-t">{heading}</Dialog.Title>
              <p className="zipco-cr-s">{step==='pick'?'¿Qué pasó con este pedido?':null}</p></div></div>
          <p className="zipco-cr-sum"><b>{client}</b>{conditionsSummary?` · ${conditionsSummary}`:''}{price!==null?` · $${price.toLocaleString('es-CL')}`:''}</p>
          {contract.message&&<p className="zipco-cr-note is-err" role="alert">{contract.message}</p>}
          {step==='pick'&&<>
            <div className={contract.blockMessage?'zipco-cr-delivery-block':undefined}
              role={contract.blockMessage?'group':undefined} aria-label={contract.blockMessage?'Entrega bloqueada por la reserva':undefined}>
            <button type="button" className="zipco-cr-opt is-ok" disabled={!contract.canDeliver||!!contract.deliveryBlock||saving}
              aria-describedby={contract.blockMessage?`closure-reservation-block-${order.id}`:undefined} onClick={()=>choose('DELIVERED')}>
              <span className="zipco-cr-opt-ic" aria-hidden="true"><PackageCheck size={20}/></span>
              <span className="zipco-cr-opt-tx"><b>Ya entregué el pedido</b><small>El cliente vino y lo recibió, aunque no avisé que estaba listo.</small></span><ChevronRight size={16}/>
            </button>
            {contract.blockMessage&&<><p id={`closure-reservation-block-${order.id}`} className="zipco-cr-note is-warn">{contract.blockMessage}</p><button className="zipco-cr-ghost zipco-cr-reserve" type="button" onClick={openReservation}>Revisar reserva</button></>}
            </div>
            <button type="button" className="zipco-cr-opt is-no" disabled={!contract.canClose||saving} onClick={()=>choose('NOT_COMPLETED')}>
              <span className="zipco-cr-opt-ic" aria-hidden="true"><CircleX size={20}/></span><span className="zipco-cr-opt-tx"><b>No se concretó</b><small>El pedido no se entregó y quiero cerrar la solicitud.</small></span><ChevronRight size={16}/>
            </button><button type="button" className="zipco-cr-ghost" onClick={()=>leave()}>Volver</button>
          </>}
          {step==='delivered'&&<>
            <p className="zipco-cr-note is-info">Declaras que entregaste el pedido. Pasará a tu Historial como «Entrega declarada». El cliente aún debe confirmar recepción y finalizar. No acredita pago ni devolución.</p>
            <button type="button" className="zipco-cr-go" disabled={!contract.canDeliver||saving} onClick={()=>void send()}>Finalizar solicitud</button>
          </>}
          {step==='notDone'&&<>
            <p className="zipco-cr-note is-info">La solicitud pasará a Historial para ambos como «No se concretó · Declarado por el negocio».</p>
            {prepaid&&<p className="zipco-cr-note is-warn">Las aclaraciones de pago seguirán accesibles. Esto no declara devolución de dinero.</p>}
            <div className="zipco-cr-rs" role="group" aria-label="Motivo obligatorio">
              {contract.reasonCodes.map(code=><button key={code} type="button" className="zipco-cr-chip" aria-pressed={reason===code} onClick={()=>setReason(code)}>{BUSINESS_CLOSURE_REASONS[code]}</button>)}
            </div>
            {reason==='OTHER'&&<label className="zipco-cr-reason">Explica el motivo (3–1000 caracteres)<textarea value={detail} maxLength={1000} onChange={event=>setDetail(event.target.value)}/></label>}
            <button type="button" className="zipco-cr-go" disabled={!contract.canClose||saving||!reason||reason==='OTHER'&&detail.trim().length<3} onClick={()=>void send()}>Finalizar solicitud</button>
          </>}
          {(step==='delivered'||step==='notDone')&&<button className="zipco-cr-ghost" type="button" onClick={()=>setStep('pick')}>Volver</button>}
          {step==='saving'&&<p className="zipco-cr-note is-info" role="status">Guardando… no cierres esta ventana.</p>}
          {step==='failed'&&<><button className="zipco-cr-go" type="button" disabled={saving} onClick={()=>void check()}>Actualizar estado</button><button className="zipco-cr-ghost" type="button" onClick={()=>setStep('pick')}>Revisar opciones</button></>}
          {step==='unknown'&&<><p className="zipco-cr-note is-info">Conservamos el envío original. No lo reenvíes hasta verificar el resultado.</p><button className="zipco-cr-go" type="button" disabled={saving} onClick={()=>void check()}>Comprobar estado</button></>}
          {(step==='failed'||step==='unknown')&&<button className="zipco-cr-ghost" type="button" disabled={saving} onClick={()=>leave()}>Cerrar</button>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
