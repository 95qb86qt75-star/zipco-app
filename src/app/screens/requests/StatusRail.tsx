import {useEffect,useRef} from 'react';
import {Bell,Check,Hourglass,LockKeyhole} from 'lucide-react';

/** Carril de progreso «Tú → Negocio → Pedido listo» (diseño CliU15). Solo presentación: no decide nada ni llama al backend.
 *  Tarjeta del cliente (tema oscuro) y tarjeta de «Retiro en el local» (tema claro). */
export type RailStage='wait'|'ready'|'received';
export type RailCopy={
  you:{label:string;text:string};
  business:{label:string;waiting:string;ready:string};
  third:{label:string;waiting:string;ready:string;received:string};
};

export default function StatusRail({theme='dark',stage,copy,className}:{theme?:'dark'|'light';stage:RailStage;copy:RailCopy;className?:string}){
  // La animación «pop» solo corre cuando la etapa CAMBIA mientras la tarjeta está montada (no al cargar la lista).
  const prev=useRef(stage),changed=prev.current!==stage;
  useEffect(()=>{prev.current=stage;},[stage]);
  const ready=stage!=='wait',received=stage==='received';
  return <div className={'zipco-own-rail'+(className?' '+className:'')} data-theme={theme} data-stage={stage} role="group" aria-label="Estado de la solicitud">
    <div className="zipco-own-step">
      <span className="zipco-own-node" data-kind="done" aria-hidden="true"><Check size={14} strokeWidth={3.4}/></span>
      <span className="zipco-own-steptx"><small>{copy.you.label}</small><b>{copy.you.text}</b></span>
    </div>
    <span className="zipco-own-line" aria-hidden="true"><i style={{width:'100%'}}/></span>
    <div className="zipco-own-step">
      <span className="zipco-own-node" data-kind={ready?'done':'wait'} data-pop={ready&&changed&&!received} aria-hidden="true">{ready?<Check size={14} strokeWidth={3.4}/>:<Hourglass size={13} strokeWidth={3}/>}</span>
      <span className="zipco-own-steptx"><small>{copy.business.label}</small><b>{ready?copy.business.ready:copy.business.waiting}</b></span>
    </div>
    <span className="zipco-own-line" aria-hidden="true"><i style={{width:ready?'100%':'0'}}/></span>
    <div className="zipco-own-step">
      <span className="zipco-own-node" data-kind={received?'done':ready?'bell':'lock'} data-pop={received&&changed} aria-hidden="true">{received?<Check size={14} strokeWidth={3.4}/>:ready?<Bell size={14} strokeWidth={2.4}/>:<LockKeyhole size={12} strokeWidth={2.6}/>}</span>
      <span className="zipco-own-steptx"><small>{copy.third.label}</small><b>{received?copy.third.received:ready?copy.third.ready:copy.third.waiting}</b></span>
    </div>
  </div>;
}
