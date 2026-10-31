import {useEffect,useRef} from 'react';
import {Bell,Check} from 'lucide-react';

/** Bloque «Tu pedido se encuentra listo» (diseño CliU15). Va DENTRO de la tarjeta, bajo el carril, y se despliega con el mismo pliegue
 *  que usa la tarjeta (650 ms). NO hay capa sobre la tarjeta ni contenido inert: la foto, el nombre y el precio siguen visibles.
 *  Solo presentación: las acciones llegan por props. Se monta siempre; sin `model` queda cerrado. */
export type ReadyStage='ready'|'received'|'finishing';

export type ReadyModel={
  /** ready = campana + «Confirmar recepción» · received = check + «Finalizar esta solicitud» · finishing = la tarjeta se está yendo a Historial */
  stage:ReadyStage;
  /** true mientras la acción viaja al servidor: deshabilita el botón y muestra «Guardando…». */
  busy?:boolean;
  disabled?:boolean;
  /** Mensaje de error de la acción (bajo el botón, role="alert"). */
  error?:string;
  onConfirmReceipt:()=>void;
  onFinish:()=>void;
  /** Termina la animación de salida (stage==='finishing'): el padre refresca la lista y actualiza contadores. */
  onLeaveEnd?:()=>void;
};

/** Textos del bloque. Si en el código ya existe un texto equivalente, REEMPLAZAR estos valores por el existente. */
export const READY_COPY={
  title:'Tu pedido se encuentra listo',
  subtitle:{whatsapp:'El negocio avisó que ya puedes recibirlo.',pickup:'Ya puedes pasar a retirarlo al local.'},
  confirm:'Confirmar recepción',
  receivedTitle:'Recibiste tu pedido',
  receivedSub:'Solo falta cerrar la solicitud.',
  finishTitle:'Finalizar esta solicitud',
  finishSub:'Ya recibí conforme',
  saving:'Guardando…',
};

export default function ReadyPanel({model,tone='dark',kind='whatsapp'}:{model?:ReadyModel;tone?:'dark'|'light';kind?:'whatsapp'|'pickup'}){
  const final=useRef<HTMLButtonElement>(null),open=!!model,stage=model?.stage,received=stage==='received'||stage==='finishing';
  const busy=!!model?.busy,disabled=busy||!!model?.disabled||stage==='finishing';
  // Al pasar a «received» el botón se reemplaza: el foco debe seguirlo (teclado y lector de pantalla).
  const previousStage=useRef(stage);
  useEffect(()=>{if(stage==='received'&&previousStage.current!==stage)final.current?.focus({preventScroll:true});previousStage.current=stage;},[stage]);
  const saving=<span className="zipco-own-saving"><span className="zipco-own-spin" aria-hidden="true"/>{READY_COPY.saving}</span>;
  return <div className="zipco-own-fold" data-open={open} data-tone={tone} {...(open?{}:{inert:''})}>
    <div><div className="zipco-own-ac">
      {model&&<>
        <div className="zipco-own-msg" role="status">
          <span className="zipco-own-tile" data-tone={received?'ok':'bell'} aria-hidden="true">{received?<Check size={20} strokeWidth={3.2}/>:<Bell size={18} strokeWidth={2.3}/>}</span>
          <div><b>{received?READY_COPY.receivedTitle:READY_COPY.title}</b><small>{received?READY_COPY.receivedSub:READY_COPY.subtitle[kind]}</small></div>
        </div>
        {!received
          ?<button type="button" className="zipco-own-cta" disabled={disabled} onClick={model.onConfirmReceipt}>{busy?saving:<span className="zipco-own-ctarow"><Check size={18} strokeWidth={3}/>{READY_COPY.confirm}</span>}</button>
          :<button ref={final} type="button" className="zipco-own-cta" data-final="true" disabled={disabled} onClick={model.onFinish}>{busy?saving:<><span>{READY_COPY.finishTitle}</span><small>{READY_COPY.finishSub}</small></>}</button>}
        {model.error&&<p className="zipco-own-error" role="alert">{model.error}</p>}
      </>}
    </div></div>
  </div>;
}
