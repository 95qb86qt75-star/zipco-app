import {ChevronRight,CircleCheck} from 'lucide-react';
import type {ReactNode} from 'react';
import WhatsAppMark from './WhatsAppMark';

/** Shared by the real card and isolated design preview; callbacks own all actions. */
export default function CustomerReceiptDetails({summary,onConditions,onContact,blocked=false,children}:{summary:string;onConditions:()=>void;onContact?:()=>void;blocked?:boolean;children?:ReactNode}){
 return <div className="zipco-receipt-details">
  <button type="button" className="zipco-co-strip2" onClick={onConditions}><span className="zipco-co-strip2-ic"><CircleCheck size={16}/></span><span style={{minWidth:0,flex:1}}><div className="zipco-co-strip2-l">Condiciones aceptadas</div><div className="zipco-co-strip2-v">{summary}</div></span><span className="zipco-co-strip2-go"><ChevronRight size={16}/></span></button>
  <p className="mt-3 text-xs">ZIPCO no procesa ni verifica pagos.</p>
  {onContact&&<button type="button" className="zipco-co-go2" disabled={blocked} onClick={onContact}><WhatsAppMark className="h-4 w-4"/> Escribir al negocio</button>}
  {children}
 </div>;
}
