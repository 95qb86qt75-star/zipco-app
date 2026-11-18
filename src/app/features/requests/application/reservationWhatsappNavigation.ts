import {whatsappUrl,refreshCoordinationOrder} from '../api/coordinationApi';
import {readCoordinationSession,type CoordinationSession} from './intents/coordinationSession';
import {statusViewFor} from '../domain/requestStatusGrouping';
import {RequestProcessError} from '../domain/requestProcessErrors';

type Input={orderId:number;business:boolean;session:CoordinationSession;url:string;processId:number;minVersion:number;receipt?:boolean;appearance?:'business-prepayment';returnFocus?:HTMLElement};
export type ReservationWhatsappNavigation=Input&{attempted:boolean;departed:boolean;resumed:boolean;status:'ready'|'checking'|'failed';error:string};
let current:ReservationWhatsappNavigation|null=null;
let controller:AbortController|undefined;
const listeners=new Set<()=>void>();
const change=(next:ReservationWhatsappNavigation|null)=>{current=next;listeners.forEach(fn=>fn());};
export const getReservationWhatsappNavigation=()=>current;
export const subscribeReservationWhatsappNavigation=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function dismissReservationWhatsappNavigation(){controller?.abort();controller=undefined;change(null);}
/** URL is memory-only. A native link click, never an async popup, opens the authorized destination. */
export function offerReservationWhatsapp(input:Input){
  if(!whatsappUrl(input.url)||readCoordinationSession()!==input.session)return false;
  controller?.abort();controller=undefined;
  change({...input,attempted:false,departed:false,resumed:false,status:'ready',error:''});return true;
}
export function markReservationWhatsappOpened(){
  if(!current||readCoordinationSession()!==current.session){dismissReservationWhatsappNavigation();return false;}
  change({...current,attempted:true,departed:false,resumed:false});return true;
}
export function recordReservationWhatsappDeparture(){if(current?.attempted&&!current.departed)change({...current,departed:true});}
/** Only authenticated GET on return. Never replays acceptance, reservation or opening commands. */
export async function refreshReservationWhatsappReturn(manual=false){
  const captured=current;
  if(!captured||captured.status==='checking'||!manual&&(!captured.attempted||!captured.departed||captured.resumed))return;
  if(readCoordinationSession()!==captured.session){dismissReservationWhatsappNavigation();return;}
  const abort=new AbortController();controller=abort;
  const checking={...captured,status:'checking' as const,resumed:true,error:''};change(checking);
  const timer=setTimeout(()=>abort.abort(),10000);
  try{
    const latest=await refreshCoordinationOrder(captured.orderId,captured.business,captured.session.token,captured.session.businessId,abort.signal);
    if(current!==checking)return;
    if(readCoordinationSession()!==captured.session){dismissReservationWhatsappNavigation();return;}
    if(!latest?.requestProcess||latest.id!==captured.orderId||latest.requestProcess.id!==captured.processId||latest.requestProcess.version<captured.minVersion)throw Error('Unverified read');
    window.dispatchEvent(new CustomEvent('zipco-process-receipt',{detail:{orderId:latest.id,orderStatus:latest.status,requestProcess:latest.requestProcess}}));
    if(captured.receipt&&!captured.business)window.dispatchEvent(new CustomEvent('zipco-reservation-receipt-return',{detail:{orderId:captured.orderId,processId:captured.processId}}));
    window.dispatchEvent(new Event('zipco-requests-refresh'));
    window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:captured.business,
      view:statusViewFor('orders',latest.status,latest.requestProcess,false,captured.business),explicit:true}}));
    dismissReservationWhatsappNavigation();
  }catch(error){
    if(current===checking){
      if(readCoordinationSession()!==captured.session)dismissReservationWhatsappNavigation();
      else if(error instanceof RequestProcessError&&error.status===401){dismissReservationWhatsappNavigation();window.dispatchEvent(new Event('zipco-coordination-session-expired'));}
      else change({...checking,status:'failed',error:'No pudimos actualizar tu solicitud al volver. No repetimos ninguna operación. Comprueba el estado cuando tengas conexión.'});
    }
  }finally{clearTimeout(timer);if(controller===abort)controller=undefined;}
}
