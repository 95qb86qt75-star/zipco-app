



import { receiptPending } from "../../../../domain/customerReceiptContract";
import { useEffect, useRef, useState } from 'react';

import type { BusinessRequest } from "../../../../domain/types";
import { coordinationAllowed } from "../../../../api/coordinationApi";
import useCoordination from "../../../../application/useCoordination";
import { type AcceptedSummary } from "../../../../shared/conditions/CoordinationSheets";

import { type SlidePhase } from "../SlideToNotify";
import { presentReadyNotification, wasJustNotified } from "../notifiedRecently";
import useCoordinationMotion from "../../../../application/motion/useCoordinationMotion";

/**
 * Tarjeta del NEGOCIO para pedidos en IN_PROGRESS y READY (diseño R, aprobado). Reemplaza el bloque genérico
 * ("Condiciones aceptadas" + CoordinationActions) SOLO para el negocio y SOLO en esos dos estados.
 *  - IN_PROGRESS: "Preparando el pedido" + tracker + "Desliza para avisar" (única acción permitida: MARK_READY).
 *  - READY: "Pedido notificado" + estado de la confirmación del cliente (ack) + tarjeta plegable.
 * Línea de tiempo del aviso (t0 = el negocio completa el deslizamiento): ver INSTRUCCIONES §Secuencia.
 */

/**
 * Tarjeta del NEGOCIO para pedidos en IN_PROGRESS y READY (diseño R, aprobado). Reemplaza el bloque genérico
 * ("Condiciones aceptadas" + CoordinationActions) SOLO para el negocio y SOLO en esos dos estados.
 *  - IN_PROGRESS: "Preparando el pedido" + tracker + "Desliza para avisar" (única acción permitida: MARK_READY).
 *  - READY: "Pedido notificado" + estado de la confirmación del cliente (ack) + tarjeta plegable.
 * Línea de tiempo del aviso (t0 = el negocio completa el deslizamiento): ver INSTRUCCIONES §Secuencia.
 */
const FOLD_AFTER_MOUNT_MS = 3200;
export function useBusinessProgressCardController({ order, name, image, price, statusLabel, isUnread = false, accepted, acceptedAt,
  conditionsTitle, conditionsSubtitle, conditionsWhen, conditionsSummary, explanation, negotiated, refresh, notificationOpen = 0, onInspect,embedded=false }: {
  order: BusinessRequest; name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean;
  accepted: AcceptedSummary & { scheduledFor?: string | null }; acceptedAt?: string | null;
  conditionsTitle: string; conditionsSubtitle: string; conditionsWhen: string; conditionsSummary: string; explanation?: string | null;
  embedded?:boolean;negotiated: boolean; refresh: () => void; notificationOpen?: number; onInspect?: () => void;

}){

  const process = order.requestProcess;
  const ready = process?.state === 'READY';
  const received=receiptPending(process);
  const service = accepted.subjectSnapshot.orderType === 'service';
  const client = name || 'el cliente';

  // Verified feedback is sequenced before the hook publishes the new list state.
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const startedAt = useRef(0);
  const notifyLock = useRef(false);
  const operation = useCoordination(order, true, refresh, false, key =>
    presentReadyNotification(order.id, accepted.agreementPublicId, key, startedAt.current,
      () => { if (mounted.current) setPhase('sent'); }));

  const [sheet, setSheet] = useState<'cond' | 'agree' | null>(null);
  const [phase, setPhase] = useState<SlidePhase>('work');
  const fresh = useRef(ready && wasJustNotified(order.id, accepted.agreementPublicId)).current;
  const [storedFolded, setFolded] = useState(!fresh && notificationOpen === 0);
  const folded=embedded?false:storedFolded;
  useEffect(() => { if (notificationOpen > 0) setFolded(false); }, [notificationOpen]);
  const motionRef = useCoordinationMotion(folded || sheet !== null);
  useEffect(() => {
    if (!fresh || notificationOpen > 0) return;
    const id = window.setTimeout(() => setFolded(true), FOLD_AFTER_MOUNT_MS);
    return () => window.clearTimeout(id);
  }, [fresh, notificationOpen]);
  useEffect(() => {
    const root = motionRef.current; if (!root) return;
    const row = root.querySelector<HTMLButtonElement>('.zipco-co-colrow');
    if (folded && root.querySelector('.zipco-co-fb')?.contains(document.activeElement)) row?.focus({ preventScroll: true });
    else if (!folded && document.activeElement === row) root.querySelector<HTMLButtonElement>('.zipco-co-strip2')?.focus({ preventScroll: true });
  }, [folded]);

  const allowed = order.recordState === 'available' && coordinationAllowed(process, true, 'MARK_READY');
  // An in-flight durable intent is the active send, not a recovery prompt.
  const pending = operation.busy ? null : operation.pending();
  const recoveryOnly = operation.needsUpdate || operation.storageWarning() || operation.restored();
  const ack = process?.readyNoticeAcknowledged;

  const notify = async () => {
    if (notifyLock.current || phase !== 'work' || !allowed || operation.busy || pending || recoveryOnly) return;
    notifyLock.current = true;
    setPhase('sending'); startedAt.current = Date.now();
    const ok = await operation.run('MARK_READY');
    if (mounted.current && (!ok || !operation.currentOrder())) setPhase('work');
    notifyLock.current = false;
  };

  const noteId = `ec-note-${order.id}`;
  const title = received?'Producto recibido · Pendiente de finalizar':ready ? (service ? 'Servicio listo' : 'Pedido notificado') : process?.availability?.path === 'LOCAL_PICKUP' ? 'Pendiente de retiro en el local' : 'Preparando el pedido';
  const colTitle = title;
  const colSub = received?'El cliente debe finalizar la solicitud.':!ready ? 'Falta avisar al cliente · toca para abrir'
    : service ? 'Cliente avisado · toca para abrir'
      : ack === true ? 'Cliente confirmó · pendiente de retiro' : ack === false ? 'Esperando confirmación · toca para abrir' : 'Actualiza el estado del aviso · toca para abrir';


return {accepted,acceptedAt,ack,allowed,client,colSub,colTitle,conditionsSubtitle,conditionsSummary,conditionsTitle,conditionsWhen,embedded,explanation,folded,image,isUnread,motionRef,negotiated,noteId,notify,onInspect,operation,order,pending,phase,price,process,ready,received,recoveryOnly,refresh,service,setFolded,setSheet,sheet,statusLabel,title};
}
export type BusinessProgressCardModel=ReturnType<typeof useBusinessProgressCardController>;
