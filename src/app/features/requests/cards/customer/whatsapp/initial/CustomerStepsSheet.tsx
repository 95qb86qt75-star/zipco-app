import * as React from 'react';
import { type ReactNode, type RefObject } from 'react';


import * as Dialog from '@radix-ui/react-dialog';
import { useStatusOverlay } from "../../../../shared/feedback/statusOverlay";








import useCoordinationMotion from "../../../../application/motion/useCoordinationMotion";







import "./customer-initial-coordination.css";

/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
export default function CustomerStepsSheet({open,onClose,restoreFocus,triggerRef,children}:{open:boolean;onClose:()=>void;restoreFocus:boolean;triggerRef:RefObject<HTMLButtonElement|null>;children:ReactNode}){
  useStatusOverlay(open);
  const motion=useCoordinationMotion(!open);
  return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose();}}><Dialog.Portal>
    <Dialog.Overlay className="zipco-ci-bg"/>
    <Dialog.Content ref={motion} className="zipco-ci-sh" data-customer-steps-sheet aria-describedby={undefined}
      onCloseAutoFocus={event=>{event.preventDefault();if(restoreFocus)triggerRef.current?.focus({preventScroll:true});}}>
      <div className="zipco-ci-gr" aria-hidden="true"/>
      <Dialog.Title className="sr-only">Pasos y opciones de coordinación</Dialog.Title>{children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
