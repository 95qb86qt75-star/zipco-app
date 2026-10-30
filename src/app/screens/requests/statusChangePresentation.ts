import type {BusinessRequest,MyOrder} from './types';
import {readCoordinationSession,type CoordinationSession} from './coordinationSession';
import {statusViewFor,type StatusView} from './requestStatusGrouping';
import {statusOverlayVisible,subscribeStatusOverlay} from './statusOverlay';
export type StatusOrder=BusinessRequest|MyOrder;
export type StatusChange={key:string;source:StatusOrder;business:boolean;session:CoordinationSession;stage:'saving'|'success'|'exiting';result?:StatusOrder;destination?:StatusView;timer?:ReturnType<typeof setTimeout>;releaseOverlay?:()=>void;height?:number;inlineSaving?:boolean};
export type StatusNotice={id:number;orderId:number;business:boolean;view:StatusView;title:string;description:string;amber:boolean};
const changes=new Map<string,StatusChange>(),listeners=new Set<()=>void>();
let page:{owner:object;session:CoordinationSession;business:boolean;view:StatusView;orders:boolean}|null=null;
let notice:StatusNotice|null=null,noticeTimer:ReturnType<typeof setTimeout>|undefined,serial=0;
let arrival:{orderId:number;business:boolean;session:CoordinationSession}|null=null,arrivalTimer:ReturnType<typeof setTimeout>|undefined;
const notify=()=>listeners.forEach(callback=>callback());
function pumpNotices(){
  clearTimeout(noticeTimer);
  if(statusOverlayVisible()){notify();return;}
  if(notice)noticeTimer=setTimeout(()=>{notice=null;pumpNotices();},4500);
  notify();
}
subscribeStatusOverlay(pumpNotices);
export function markStatusArrival(orderId:number,business:boolean){
  const session=readCoordinationSession();if(!session)return;
  arrival={orderId,business,session};clearTimeout(arrivalTimer);
  arrivalTimer=setTimeout(()=>{arrival=null;notify();},2400);notify();
}
export function isStatusArrival(order:StatusOrder,business:boolean){return arrival?.session===readCoordinationSession()&&arrival?.business===business&&arrival?.orderId===order.id;}
export const subscribeStatusChanges=(callback:()=>void)=>{listeners.add(callback);return()=>{listeners.delete(callback);};};
export const statusChangeKey=(order:StatusOrder,business:boolean)=>`${business}:${order.id}:${order.requestProcess?.id}`;
export function registerStatusPage(owner:object,business:boolean,view:StatusView,orders:boolean){
  const session=readCoordinationSession();
  if(!session)return()=>{};
  if(page&&(page.session!==session||page.business!==business||page.view!==view||page.orders!==orders)){changes.forEach(c=>{clearTimeout(c.timer);c.releaseOverlay?.();});changes.clear();notice=null;clearTimeout(noticeTimer);}
  page={owner,session,business,view,orders};
  return()=>{if(page?.owner===owner){page=null;changes.forEach(c=>{clearTimeout(c.timer);c.releaseOverlay?.();});changes.clear();notice=null;clearTimeout(noticeTimer);notify();}};
}
export function beginStatusChange(order:StatusOrder,business:boolean,inlineSaving=false):StatusChange|null{
  const session=readCoordinationSession();
  if(!page?.orders||!session||page.session!==session||page.business!==business||order.recordState!=='available'||!order.requestProcess||statusViewFor('orders',order.status,order.requestProcess,false,business)!==page.view)return null;
  const key=statusChangeKey(order,business);if(changes.has(key))return null;
  const root=typeof document!=='undefined'?document.querySelector('[data-status-order="'+key+'"]'):null;
  const change:StatusChange={key,source:order,business,session,stage:'saving',inlineSaving,height:root?.getBoundingClientRect().height};changes.set(key,change);notify();return change;
}
export function getStatusChange(order:StatusOrder,business:boolean){const change=changes.get(statusChangeKey(order,business));return change?.session===readCoordinationSession()?change:undefined;}
export function failStatusChange(change:StatusChange|null){if(change&&changes.get(change.key)===change){clearTimeout(change.timer);change.releaseOverlay?.();changes.delete(change.key);notify();}}
export function projectStatusOrders<T extends StatusOrder>(orders:T[],business:boolean):T[]{
  const live=readCoordinationSession(),active=[...changes.values()].filter(c=>c.business===business&&c.session===live);
  if(!active.length)return orders;
  const copy=[...orders];for(const c of active){const index=copy.findIndex(o=>o.id===c.source.id);if(index<0)copy.push(c.source as T);else {const latest=copy[index];if(c.result&&latest.requestProcess&&latest.requestProcess.version>(c.result.requestProcess?.version??0)){c.result=latest;c.destination=statusViewFor('orders',latest.status,latest.requestProcess,false,business)??c.destination;}copy[index]=c.source as T;}}return copy;
}
export function getStatusNotice(){return page?.session===readCoordinationSession()&&!statusOverlayVisible()?notice:null;}
export function closeStatusNotice(){notice=null;pumpNotices();}
export function statusResultCopy(result:StatusOrder,source?:StatusOrder){
  const p=result.requestProcess,view=statusViewFor('orders',result.status,p,false,false);
  if(p?.lateInitialResponse?.status==='AWAITING_CUSTOMER')return {title:'Consulta enviada',description:'El cliente debe responder si a\u00fan lo necesita.',amber:false};
  if(p?.lateInitialResponse?.status==='STILL_NEEDED')return {title:'Respuesta enviada',description:'Falta acordar una nueva hora.',amber:true};
  if(p?.whatsappCoordinationInitialDecline?.active)return {title:'Falta coordinar',description:'Sigue en Por coordinar.',amber:true};
  if(view==='coordination')return {title:'Falta coordinar',description:statusViewFor('orders',source?.status??'',source?.requestProcess)==='active'?'Volvió a Por coordinar.':'Ya puedes coordinar el pedido.',amber:true};
  if(view==='active')return {title:p?.whatsappCoordination?'Coordinación lista':'Pedido en curso',description:'El pedido está En curso.',amber:false};
  if(view==='ready')return {title:'Pedido listo y notificado',description:'Ya lo encuentras en Listo y notificado.',amber:false};
  if(view==='waiting')return {title:'Respuesta enviada',description:'El pedido está en Esperando respuesta.',amber:false};
  if(view==='history')return {title:result.status==='completed'?'Pedido completado':'Solicitud finalizada',description:'Ya la encuentras en Historial.',amber:false};
  return {title:'Respuesta guardada',description:'Revisa el estado actualizado del pedido.',amber:false};
}
export function completeStatusChange(change:StatusChange|null,latest:StatusOrder|null){
  if(!change)return false;
  const p=latest?.requestProcess,previous=change.source.requestProcess;
  if(changes.get(change.key)!==change||readCoordinationSession()!==change.session||!latest||latest.recordState!=='available'||latest.id!==change.source.id||!p||p.id!==previous?.id||p.version<previous.version){failStatusChange(change);return false;}
  const destination=statusViewFor('orders',latest.status,p,false,change.business);if(!destination){failStatusChange(change);return false;}
  change.result=latest;change.destination=destination;change.stage='success';notify();
  const remove=()=>{
    if(changes.get(change.key)!==change||readCoordinationSession()!==change.session)return;
    const root=typeof document!=='undefined'?document.querySelector(`[data-status-order="${change.key}"]`):null;
    const moveFocus=!!root&&(root.contains(document.activeElement)||document.activeElement===document.body),list=root?.closest<HTMLElement>('[data-requests-scroll]');
    changes.delete(change.key);
    const current=change.result??latest,target=change.destination??destination;
    const copy=statusResultCopy(current,change.source);
    const next:StatusNotice={id:++serial,orderId:current.id!,business:change.business,view:target,...copy};
    if(target==='coordination'){
      next.title=statusViewFor('orders',change.source.status,previous,false,change.business)==='active'?'Volvió a Por coordinar':'Sigue en Por coordinar';
      if(!change.business)next.description='Avisamos al negocio que aún falta coordinar.';
    }
    if(target==='active'){next.title='Pedido en curso';next.description=change.business?'Ya lo encuentras en la pestaña En curso.':current.requestProcess?.whatsappCoordination?.status==='PENDING'?'Avisamos al negocio. Falta que confirme.':'El pedido está En curso.';}
    notice=next;pumpNotices();
    if(moveFocus&&list){if(!list.hasAttribute('tabindex'))list.setAttribute('tabindex','-1');list.focus({preventScroll:true});}
  };
  const advance=()=>{
    if(changes.get(change.key)!==change)return;
    if(statusOverlayVisible()){change.releaseOverlay=subscribeStatusOverlay(()=>{if(!statusOverlayVisible()){change.releaseOverlay?.();change.releaseOverlay=undefined;advance();}});return;}
    if(change.destination===statusViewFor('orders',change.source.status,previous,false,change.business)){remove();return;}
    change.stage='exiting';notify();change.timer=setTimeout(remove,typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:500);
  };
  change.timer=setTimeout(advance,1500);return true;
}
