import {createPortal} from 'react-dom';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Check,Clock3,LoaderCircle} from 'lucide-react';
import {readCoordinationSession,subscribeCoordinationSession} from './coordinationSession';
import {getStatusChange,getStatusNotice,closeStatusNotice,projectStatusOrders,registerStatusPage,subscribeStatusChanges,statusResultCopy,isStatusArrival,markStatusArrival,type StatusOrder} from './statusChangePresentation';
import type {StatusView} from './requestStatusGrouping';
import ProductPreviewControl from './ProductPreviewControl';
import './status-change.css';
function useStatusRevision(){const[,setRevision]=useState(0);useEffect(()=>subscribeStatusChanges(()=>setRevision(v=>v+1)),[]);}
export function useStatusChangeRecords<T extends StatusOrder>(orders:T[],business:boolean){useStatusRevision();return projectStatusOrders(orders,business);}
export function useCardStatusChange(order:StatusOrder,business:boolean){useStatusRevision();return getStatusChange(order,business);}
export default function StatusChangeFlow({order,business,children}:{order:StatusOrder;business:boolean;children:ReactNode}){
  const change=useCardStatusChange(order,business),copy=change?.result?statusResultCopy(change.result,change.source):null;
  const arriving=isStatusArrival(order,business),root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!arriving||!root.current)return;
    const container=root.current;let previous:HTMLElement|null=null;
    const focus=()=>{
      const target=container.querySelector<HTMLElement>('[id^="order-"]');
      if(!target||target===previous||previous&&document.activeElement!==document.body)return;
      if(!target.hasAttribute("tabindex"))target.tabIndex=-1;
      target.scrollIntoView({block:"center",behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});target.focus({preventScroll:true});previous=target;
    };
    focus();const observer=new MutationObserver(focus);observer.observe(container,{childList:true,subtree:true});return()=>observer.disconnect();
  },[arriving]);
  return <div ref={root} data-arrival={arriving||undefined} className="zipco-status-flow" data-status-order={`${business}:${order.id}:${order.requestProcess?.id}`} data-stage={change?.stage}>
    <div className="zipco-status-flow-inner">
      {change&&<article role="status" aria-label={copy?.title??'Guardando respuesta'} className="zipco-status-result" data-amber={copy?.amber} style={change.height?{minHeight:change.height}:undefined}>
        <span className="zipco-status-product"><ProductPreviewControl/></span>
        <div><small>ESTADO DEL PEDIDO</small><h4>{copy?.title??'Guardando respuesta…'}</h4><p>{copy?.description??'Espera mientras comprobamos el resultado.'}</p></div>
        <span className="zipco-status-result-icon">{change.stage==='saving'?<LoaderCircle className="zipco-flow-spinner"/>:copy?.amber?<Clock3/>:<Check/>}<small>{change.stage==='saving'?'Guardando':copy?.amber?'Pendiente':'Listo'}</small></span>
      </article>}
      <div hidden={!!change} {...(change?{inert:''}:{})}>{children}</div>
    </div>
  </div>;
}
export function StatusChangeHost({business,view,orders}:{business:boolean;view:StatusView;orders:boolean}){
  useStatusRevision();const owner=useRef({});
  useEffect(()=>{const session=readCoordinationSession(),off=registerStatusPage(owner.current,business,view,orders);const sessionOff=subscribeCoordinationSession(()=>{if(readCoordinationSession()!==session)off();});return()=>{sessionOff();off();};},[business,view,orders]);
  const notice=getStatusNotice();
  if(!notice||notice.business!==business||!orders)return null;
  return createPortal(<div className="zipco-status-toast" role="status" data-amber={notice.amber}>
    <span className="zipco-status-toast-icon" aria-hidden="true">{notice.amber?<Clock3/>:<Check/>}</span>
    <div><b>{notice.title}</b><p>{notice.description}</p></div>
    <button type="button" aria-label={`Ver pedido en ${notice.view==='active'?'En curso':notice.view==='coordination'?'Por coordinar':notice.view==='ready'?'Listo y notificado':notice.view==='history'?'Historial':'su pestaña'}`} onClick={()=>{window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:notice.business,view:notice.view,explicit:true}}));markStatusArrival(notice.orderId,notice.business);closeStatusNotice();}}>Ver</button>
  </div>,document.body);
}