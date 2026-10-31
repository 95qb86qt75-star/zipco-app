import {useContext,useState,type ReactNode} from 'react';
import {Check,ChevronDown,LockKeyhole,MoreHorizontal} from 'lucide-react';
import {DetailReveal} from './AvailabilityWaitingCard';
import {BusinessCoordinationDisclosure} from './businessCoordinationDisclosure';
import WhatsAppMark from './WhatsAppMark';
import useCoordinationMotion from './useCoordinationMotion';

/** Fused business layout; callbacks and permissions remain in BusinessCoordinationCard. */
export default function BusinessPendingCoordinationDetail({covered,authorized,canOpen,canAuthorize,busy,phase,acceptedAt,
  conditions,recovery,error,consent,onOpen,onAuthorize,onUpdate,options}:{
  covered:boolean;authorized:boolean;canOpen:boolean;canAuthorize:boolean;busy:boolean;phase:string;
  acceptedAt?:string|null;conditions:ReactNode;recovery?:ReactNode;error:string;consent:ReactNode;
  onOpen:()=>void;onAuthorize:()=>void;onUpdate:()=>void;options:ReactNode;
}){
  const layout=useContext(BusinessCoordinationDisclosure),[more,setMore]=useState(false);
  const motionRef=useCoordinationMotion(covered);
  const waiting=phase==='loading'||phase==='requesting';
  return <article ref={motionRef} className="zipco-business-pending-detail" data-coordination-embedded="true" data-coordination-role="business">
    {error&&<p role="alert">{error}</p>}
    {!authorized&&<p className="zipco-business-pending-consent">{consent}</p>}
    <div className="zipco-business-pending-actions">
      {recovery||<button type="button" className="zipco-co-go zipco-business-pending-open" disabled={busy||waiting||(authorized?!canOpen:!canAuthorize)} onClick={authorized?onOpen:onAuthorize}>
        <WhatsAppMark className="h-5 w-5"/>{phase==='loading'?'Preparando WhatsApp…':phase==='requesting'?'Autorizando contacto…':authorized?'Abrir WhatsApp':'Autorizo comenzar coordinación'}
      </button>}
      {!recovery&&!waiting&&(authorized?!canOpen:!canAuthorize)&&<button type="button" className="zipco-co-go2" disabled={busy} onClick={onUpdate}>Actualizar estado del contacto</button>}
      {!busy&&!waiting&&!recovery&&layout?.secondaryAction}
    </div>
    <DetailReveal expanded={layout?.expanded===true}><div id={layout?.detailId} className="zipco-business-pending-main">
      {conditions}
      <section className="zipco-co-co2" aria-label="Pasos del pedido">
        <div className="zipco-co-co2-top">
          <span className="zipco-co-co2-orb"><Check size={24} strokeWidth={3} aria-hidden="true"/></span>
          <div><div className="zipco-co-co2-t">Pedido aceptado</div><div className="zipco-co-co2-s">Falta acordar el pago y la entrega.</div></div>
        </div>
        <div className="zipco-co-steps">
          <div className="zipco-co-st done"><span className="zipco-co-sd"><Check size={13} strokeWidth={3.4}/></span><div className="zipco-co-sb"><div className="zipco-co-sl">Pedido aceptado</div>{acceptedAt&&<div className="zipco-co-sm">{new Date(acceptedAt).toLocaleDateString('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'short'})}</div>}</div></div>
          <div className={'zipco-co-st'+(authorized?' done':'')}><span className="zipco-co-sd">{authorized?<Check size={13} strokeWidth={3.4}/>:<LockKeyhole size={13}/>}</span><div className="zipco-co-sb"><div className="zipco-co-sl">{authorized?'Contacto autorizado':'Contacto por autorizar'}</div><div className="zipco-co-sm">{authorized?'Puedes coordinar por WhatsApp.':'Autoriza compartir tu teléfono para este pedido.'}</div></div></div>
          <div className="zipco-co-st last"><span className="zipco-co-sd on"><WhatsAppMark className="h-3.5 w-3.5"/></span><div className="zipco-co-sb"><div className="zipco-co-sl">Coordinación pendiente</div><div className="zipco-co-sm">Confirma «Ya coordinamos» cuando lo hayan acordado.</div></div></div>
        </div>
      </section>
      <button type="button" className="zipco-business-pending-more" aria-expanded={more} aria-controls={layout?.detailId+'-options'} onClick={()=>setMore(v=>!v)}><MoreHorizontal size={17}/>Más opciones<ChevronDown size={15}/></button>
      <DetailReveal expanded={more}><div id={layout?.detailId+'-options'} className="zipco-business-pending-options">{options}</div></DetailReveal>
      <p className="zipco-business-pending-legal">ZIPCO no recibe ni verifica pagos.</p>
    </div></DetailReveal>
  </article>;
}
