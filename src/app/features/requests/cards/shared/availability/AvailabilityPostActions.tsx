import * as React from 'react';
import AvailabilityPostActionsView,{type AvailabilityPostActionParts} from './AvailabilityPostActionsView';
import {useAvailabilityPostActionsController} from './application/useAvailabilityPostActionsController';
type Props=Parameters<typeof useAvailabilityPostActionsController>[0]&{
  /** Opcional (cliente con retiro local). Si no se pasa, el comportamiento es el de siempre. Recibe `null` cuando no hay flujo de
   *  disponibilidad, para que quien lo usa siga mostrando lo suyo (condiciones, WhatsApp). Debe devolver elementos; no ejecutar hooks. */
  render?:(parts:AvailabilityPostActionParts|null)=>React.ReactNode;
};
/** Composition only; the view owns presentation and the controller owns commands. */
export default function AvailabilityPostActions({render,...props}:Props){
const model=useAvailabilityPostActionsController(props);
if(model===null)return render?<>{render(null)}</>:null;
return <AvailabilityPostActionsView model={model} render={render}/>;
}
