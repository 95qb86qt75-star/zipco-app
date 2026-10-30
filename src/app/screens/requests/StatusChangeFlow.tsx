import {showStatusToast,hideStatusToast} from './statusToast.ts';
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
  const presentation=change&&!(change.inlineSaving&&change.stage==='saving');
  const arriving=isStatusArrival(order,business),root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!arriving||!root.current)return;
    const container=root.current;let previous:HTMLElement|null=null;
    const focus=()=>{
      const target=container.querySelector<HTMLElement>('[id^="order-"]');
      if(!target||target===previous||previous&&document.activeElement!==document.body)return;
      if(!target.hasAttribute("tabindex"))target.tabIndex=-1;
      previous?.removeAttribute("data-arrived");target.dataset.arrived="true";
      target.scrollIntoView({block:"center",behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});target.focus({preventScroll:true});previous=target;
    };
    focus();const observer=new MutationObserver(focus);observer.observe(container,{childList:true,subtree:true});return()=>{observer.disconnect();previous?.removeAttribute("data-arrived");};
  },[arriving]);
  return <div ref={root} data-arrival={arriving||undefined} className="zipco-status-flow" data-status-order={`${business}:${order.id}:${order.requestProcess?.id}`} data-stage={change?.stage}>
    <div className="zipco-status-flow-inner">
      {presentation&&change&&<article role="status" aria-label={copy?.title??'Guardando respuesta'} className="zipco-status-result" data-amber={copy?.amber} style={change.height?{minHeight:change.height}:undefined}>
        <span className="zipco-status-product"><ProductPreviewControl/></span>
        <div><small>ESTADO DEL PEDIDO</small><h4>{copy?.title??'Guardando respuesta…'}</h4><p>{copy?.description??'Espera mientras comprobamos el resultado.'}</p></div>
        <span className="zipco-status-result-icon">{change.stage==='saving'?<LoaderCircle className="zipco-flow-spinner"/>:copy?.amber?<Clock3/>:<Check/>}<small>{change.stage==='saving'?'Guardando':copy?.amber?'Pendiente':'Listo'}</small></span>
      </article>}
      <div hidden={!!presentation} {...(presentation?{inert:''}:{})}>{children}</div>
    </div>
  </div>;
}
export function StatusChangeHost({business,view,orders}:{business:boolean;view:StatusView;orders:boolean}){
  useStatusRevision();const owner=useRef({});
  useEffect(()=>{const session=readCoordinationSession(),off=registerStatusPage(owner.current,business,view,orders);const sessionOff=subscribeCoordinationSession(()=>{if(readCoordinationSession()!==session)off();});return()=>{sessionOff();off();};},[business,view,orders]);
  const notice=getStatusNotice();
  useEffect(()=>{
    if(!notice||notice.business!==business||!orders)return;
    const key=showStatusToast({tone:notice.amber?'amber':'green',title:notice.title,line:notice.description,actionLabel:'Ver',
      onDismiss:()=>{if(getStatusNotice()?.id===notice.id)closeStatusNotice();},
      onAction:()=>{
        if(getStatusNotice()?.id!==notice.id)return;
        window.dispatchEvent(new CustomEvent('zipco-availability-view',{detail:{business:notice.business,view:notice.view,explicit:true}}));
        markStatusArrival(notice.orderId,notice.business);closeStatusNotice();
      }});
    return()=>{if(key!==undefined)hideStatusToast(key);};
  },[notice,business,orders]);
  return null;
}
