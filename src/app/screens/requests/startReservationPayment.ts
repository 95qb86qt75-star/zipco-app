import {refreshCoordinationOrder} from './coordinationApi';
import {readCoordinationSession,operationScope} from './coordinationSession';
import {reservationAllowed,sendReservationAction} from './reservationApi';
import {reservationIntents} from './reservationIntent';
import {simplifiedReservationFlow} from './simplifiedReservationContract';

/** Called only after an explicit customer reservation decision was confirmed. */
export async function startReservationPayment(orderId:number,session:NonNullable<ReturnType<typeof readCoordinationSession>>,signal:AbortSignal){
  const latest=await refreshCoordinationOrder(orderId,false,session.token,session.businessId,signal),p=latest?.requestProcess;
  if(signal.aborted||readCoordinationSession()!==session||!latest||!simplifiedReservationFlow(p)||!p?.reservation||p.reservation.mode!=='PREPAYMENT'||p.reservation.confirmedAt||!reservationAllowed(p,false,'OPEN_RESERVATION_WHATSAPP'))return {latest,navigation:null};
  const marker=`zipco-payment-start:v3:${session.userId}:${p.id}:${p.reservation.id}`;
  // One automatic attempt per explicit reservation; the card retains recovery.
  if(sessionStorage.getItem(marker))return {latest,navigation:null};
  sessionStorage.setItem(marker,'attempted');
  const scope=operationScope(session,false);let navigation:string|null=null;
  const receipt=await reservationIntents().run(scope,p.id,'OPEN_RESERVATION_WHATSAPP',{expectedVersion:p.version,reservationId:p.reservation.id,purpose:'RECEIPT'},async key=>{
    if(signal.aborted||readCoordinationSession()!==session)throw Error('La sesión cambió. No abrimos WhatsApp.');
    const result=await sendReservationAction(p,orderId,false,'OPEN_RESERVATION_WHATSAPP',{expectedVersion:p.version,reservationId:p.reservation!.id,purpose:'RECEIPT'},session.token,key,signal);navigation=result.navigation;return result.receipt;
  });
  const verified=await refreshCoordinationOrder(orderId,false,session.token,session.businessId,signal),current=verified?.requestProcess;
  if(signal.aborted||readCoordinationSession()!==session||!current||current.id!==p.id||current.reservation?.id!==p.reservation.id||current.agreementPublicId!==p.agreementPublicId||current.version<receipt.requestProcess.version)throw Error('La reserva fue registrada. Actualiza su tarjeta para recuperar WhatsApp; no vuelvas a solicitarla.');
  await reservationIntents().reconcile(scope,current.id,current.version);
  return {latest:verified,navigation:reservationAllowed(current,false,'OPEN_RESERVATION_WHATSAPP')&&current.state==='IN_PROGRESS'?navigation:null};
}
