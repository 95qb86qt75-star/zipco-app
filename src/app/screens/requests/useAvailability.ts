import {useEffect,useRef,useState} from 'react';
import type {BusinessRequest,MyOrder} from './types';
import {availabilityAllowed,AvailabilityError,sendAvailabilityAction,type AvailabilityBody} from './availabilityApi';
import type {AvailabilityAction} from './availabilityContract';
import {availabilityIntents,CHECK_AVAILABILITY_MESSAGE} from './availabilityIntent';
import {operationScope,readCoordinationSession,subscribeCoordinationSession} from './coordinationSession';
import {refreshCoordinationOrder} from './coordinationApi';
import {announceAction} from './ActionHologram';
import {simplifiedReservationFlow} from './simplifiedReservationContract';
import {startReservationPayment} from './startReservationPayment';
import {showAppToast} from '../Toast';

export default function useAvailability(order:BusinessRequest|MyOrder,business:boolean,refresh:()=>void){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[expired,setExpired]=useState(false);
  const [checking,setChecking]=useState(false),[message,setMessage]=useState('');
  const lock=useRef(false),alive=useRef(true),controllers=useRef(new Set<AbortController>());
  const session=useRef(readCoordinationSession()).current;
  const identity=useRef({id:order.id,process:order.requestProcess?.id,business}).current;
  const visible=useRef(order);visible.current=order;
  const active=()=>alive.current&&!!session&&readCoordinationSession()===session&&visible.current.id===identity.id&&visible.current.requestProcess?.id===identity.process;
  useEffect(()=>{alive.current=true;const off=subscribeCoordinationSession(()=>{if(!active()){controllers.current.forEach(c=>c.abort());setError('La sesión cambió. Vuelve a abrir el pedido.');}});return()=>{alive.current=false;off();controllers.current.forEach(c=>c.abort());};},[]);
  const publish=(receipt:{orderId:number;orderStatus:string;requestProcess:NonNullable<typeof order.requestProcess>})=>{
    window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:receipt}));window.dispatchEvent(new CustomEvent('zipco-requests-refresh'));refresh();
  };
  const update=async()=>{
    if(!active()||lock.current||order.id===null)return;lock.current=true;setBusy(true);setChecking(true);setError('');setMessage('');
    const controller=new AbortController();controllers.current.add(controller);
    try{const latest=await refreshCoordinationOrder(order.id,business,session!.token,session!.businessId,controller.signal);
      if(!active())return;
      if(!latest?.requestProcess||latest.id!==identity.id||latest.requestProcess.id!==identity.process||latest.requestProcess.version<(visible.current.requestProcess?.version??0))throw Error();
      await availabilityIntents().reconcile(operationScope(session!,business),latest.requestProcess.id,latest.requestProcess.version);
      if(!active())return;
      if(business&&latest.status==='pending'&&latest.requestProcess.state==='AWAITING_BUSINESS_RESPONSE'&&!latest.requestProcess.lateInitialResponse){
        await availabilityIntents().recoverConfirmation(operationScope(session!,true),latest.requestProcess.id,latest.requestProcess);
        if(availabilityIntents().hasPending(operationScope(session!,true),latest.requestProcess.id))throw Error('The current read cannot settle the recorded response');
      }
      if(!active())return;
      const text=latest.requestProcess.lateInitialResponse?'La hora solicitada ya pasó. Revisa la tarjeta Fuera de hora para continuar.':business&&latest.requestProcess.state==='AWAITING_BUSINESS_RESPONSE'?'El pedido sigue esperando tu respuesta. Revisa los datos y pulsa «Confirmar disponibilidad» cuando quieras enviarlos.':business&&latest.requestProcess.availability?'Tu respuesta ya está registrada. Comprobamos el estado del pedido sin reenviarla.':'Comprobamos el estado actual del pedido. No reenviamos ninguna respuesta.';
      setMessage(text);showAppToast(text,'info');
      publish({orderId:latest.id!,orderStatus:latest.status,requestProcess:latest.requestProcess});
    }catch{if(active())setError('No pudimos comprobar el pedido. Conservamos lo que escribiste y no reenviamos tu respuesta. Intenta «Comprobar pedido» nuevamente.');}
    finally{controllers.current.delete(controller);lock.current=false;if(active()){setBusy(false);setChecking(false);}}
  };
  const run=async(action:AvailabilityAction,details:Omit<AvailabilityBody,'expectedVersion'>={})=>{
    const process=order.requestProcess;
    if(!active()||lock.current||order.id===null||!process||!availabilityAllowed(process,business,action))return false;
    lock.current=true;setBusy(true);setError('');setMessage('');const controller=new AbortController();controllers.current.add(controller);
    try{
      const body:AvailabilityBody={expectedVersion:process.version,...details};
      await availabilityIntents().reconcile(operationScope(session!,business),process.id,process.version);
      const receipt=await availabilityIntents().run(operationScope(session!,business),process.id,action,body,
        key=>{if(!active()||controller.signal.aborted)throw Error('session changed');return sendAvailabilityAction(process,order.id!,business,action,body,session!.token,key,controller.signal);});
      if(!active())return false;
      let navigation:string|null=null;
      let finalReceipt=receipt;
      if(action==='CONTINUE_REQUEST'&&!business&&simplifiedReservationFlow(process)&&details.reservationChoice?.choice==='REQUEST_RESERVATION'&&process.availability?.reservationOffer?.mode==='PREPAYMENT'){
        try{const payment=await startReservationPayment(order.id!,session!,controller.signal);if(!active())return false;if(payment.latest?.requestProcess)finalReceipt={orderId:payment.latest.id!,orderStatus:payment.latest.status,requestProcess:payment.latest.requestProcess};navigation=payment.navigation;}
        catch{if(active())setError('La reserva fue registrada. Abre su tarjeta para coordinar el pago por WhatsApp.');}
      }
      if(!active())return false;
      publish(finalReceipt);setExpired(false);
      if(action!=='REVOKE_CONTACT_CONSENT')window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business,
        view:action==='CONFIRM_AVAILABILITY'?'waiting':action==='CONTINUE_REQUEST'?receipt.requestProcess.state==='IN_PROGRESS'?'active':'coordination':'history'}}));
      const text=action==='CONFIRM_AVAILABILITY'?{title:'Disponibilidad confirmada',description:'El cliente debe decidir si continúa con la compra.'}
        :action==='CONTINUE_REQUEST'?{title:'Solicitud confirmada',description:receipt.requestProcess.availability?.path==='LOCAL_PICKUP'?'El pedido quedó en curso, pendiente de retiro en el local.':'Ya puedes revisar el contacto e iniciar la coordinación.'}
        :action==='REVOKE_CONTACT_CONSENT'?{title:'Permiso de contacto retirado',description:'Se retiró tu propio permiso para futuras entregas de contacto.'}
        :{title:action==='DECLINE_REQUEST'?'Solicitud finalizada':action==='WITHDRAW_AVAILABILITY'?'Disponibilidad retirada':'Retiro cancelado',description:'La solicitud quedó en Historial.'};
      announceAction(action==='CONTINUE_REQUEST'?'accepted':action==='CONFIRM_AVAILABILITY'?'requestSent':action==='REVOKE_CONTACT_CONSENT'?'annulled':'annulled',{
        ...text,key:`availability:${process.id}:${receipt.requestProcess.version}:${action}`});if(navigation)window.location.assign(navigation);return true;
    }catch(e){if(active()){setError(e instanceof AvailabilityError?e.message:CHECK_AVAILABILITY_MESSAGE);
      if(e instanceof AvailabilityError&&e.code==='EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED')setExpired(true);
      if(e instanceof AvailabilityError&&e.status===401)window.dispatchEvent(new Event('zipco-coordination-session-expired'));}return false;}
    finally{controllers.current.delete(controller);lock.current=false;if(active())setBusy(false);}
  };
  return{busy,checking,error,message,expired,run,update};
}
