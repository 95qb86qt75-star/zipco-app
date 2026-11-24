import { when } from "../CoordinationVisualPrimitives";

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';






import type { BusinessRequest, MyOrder } from "../../../../domain/types";
import { ANNUL_REASONS, contactAuthorized, coordinationAllowed, type AnnulReason, type CoordinationAction } from "../../../../api/coordinationApi";
import useCoordination from "../../../../application/useCoordination";

import { AnnulSheet, ConditionsSheet, StartWorkSheet, type AcceptedSummary } from "../../../../shared/conditions/CoordinationSheets";

import useCoordinationMotion from "../../../../application/motion/useCoordinationMotion";
import { announceAction } from "../../../../shared/feedback/ActionHologram";
import { readCoordinationSession } from "../../../../application/intents/coordinationSession";
import { clearWhatsappReturn, dismissWhatsappReturn, whatsappReturnKey } from "../../../../application/whatsappReturn";
import useStartWorkPrompt from "../../../../application/useStartWorkPrompt";
import AgreementSheet from "../../../../shared/conditions/AgreementSheet";


import "../../../customer/whatsapp/initial/customer-initial-coordination.css";

/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
const LOAD_MS = 3900;
const LOAD_MS_REDUCED = 500;
export function useBusinessCoordinationCardController({ order, business = true, name, image, price, statusLabel, isUnread = false, negotiated, acceptedAt, accepted,
  conditionsTitle, conditionsSubtitle, conditionsWhen, conditionsSummary, explanation, onInspect, refresh, notificationOpen = 0,embedded=false }: {
  order: BusinessRequest | MyOrder; business?: boolean; name: string; image?: string; price: number | null; statusLabel: string; isUnread?: boolean;
  /** true for a negotiated agreement; false for the accepted original order. */
  negotiated: boolean; acceptedAt?: string | null; accepted: AcceptedSummary;
  conditionsTitle: string; conditionsSubtitle: string; conditionsWhen: string; conditionsSummary: string; explanation?: string | null;
  onInspect?: () => void; refresh: () => void;
  embedded?:boolean;notificationOpen?: number;
}){

  const [latest, setLatest] = useState<BusinessRequest | MyOrder | null>(null);
  const current = latest?.requestProcess && latest.requestProcess.id === order.requestProcess?.id &&
    latest.requestProcess.agreementPublicId === order.requestProcess?.agreementPublicId &&
    latest.requestProcess.version > (order.requestProcess?.version ?? 0) ? latest : order;
  const process = current.requestProcess;
  const cardSession=useRef(readCoordinationSession());
  const currentStatus = useRef({ process, business });
  currentStatus.current = { process, business };
  const operation = useCoordination(current, business, refresh, 'coordination-steps');
  const [sheet, setSheet] = useState<'cond' | 'anul' | 'start' | 'agree' | 'steps' | null>(null);
  const motionRef = useCoordinationMotion(sheet !== null);
  const [storedFolded, setFolded] = useState(notificationOpen === 0);
  const folded=embedded?false:storedFolded;
  useEffect(() => { if (notificationOpen > 0) setFolded(false); }, [notificationOpen]);
  const [deferred, setDeferred] = useState(false);
  const [reason, setReason] = useState<AnnulReason>('COORDINATION_NOT_REACHED');
  const [detail, setDetail] = useState('');
  const authorized = contactAuthorized(process, business);
  type Phase = 'idle' | 'requesting' | 'loading' | 'ready';
  const [animationPhase, setPhase] = useState<Phase>(authorized ? 'ready' : 'idle');
  const phase = authorized ? animationPhase === 'loading' ? 'loading' : 'ready'
    : animationPhase === 'requesting' && operation.busy ? 'requesting' : 'idle';
  const [fresh, setFresh] = useState(false); // true = el negocio autorizó en ESTA sesión (con animación); false = ya venía autorizado
  const timer = useRef<number | undefined>(undefined);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);
  const requestLock = useRef(false);
  const refocus = useRef(false);
  const stepsTrigger=useRef<HTMLButtonElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; window.clearTimeout(timer.current); window.clearTimeout(feedbackTimer.current); }; }, []);

  const allowed = (action: CoordinationAction) => current.recordState === 'available' && coordinationAllowed(process, business, action);
  const run = (action: CoordinationAction) => operation.run(action, reason, detail);
  const pending = operation.pending();
  const recoveryOnly = operation.needsUpdate || operation.storageWarning() || operation.restored();
  const counterpartPending = process?.coordination?.[business ? 'customerContactAuthorized' : 'businessContactAuthorized'] === false;
  const canOpen = allowed('OPEN_WHATSAPP');
  const client = name || (business ? 'el cliente' : 'el negocio');
  const returnKey = business ? whatsappReturnKey(current) : null;
  const canStart = business && !embedded && !process?.allowedActions.includes('DECLINE_WHATSAPP_COORDINATION') && !process?.allowedActions.includes('CONFIRM_WHATSAPP_COORDINATION') && !process?.whatsappCoordination && readCoordinationSession()===cardSession.current && process?.state === 'COORDINATING' && allowed('START_WORK');
  const releaseStart = useStartWorkPrompt({key:returnKey,enabled:canStart,
    blocked:sheet!==null||operation.busy||Boolean(recoveryOnly)||Boolean(pending)||phase==='loading'||phase==='requesting',
    onOpen:()=>setSheet(value=>value??'start'),onInvalidate:()=>setSheet(value=>value==='start'?null:value)});
  useEffect(()=>{if(sheet==='start'&&!canStart&&!operation.busy){releaseStart();setSheet(null);}},[sheet,canStart,operation.busy]);
  useEffect(()=>{
    const root=motionRef.current;if(!root)return;
    const row=root.querySelector<HTMLButtonElement>('.zipco-co-colrow');
    if(folded&&(refocus.current||root.querySelector('.zipco-co-fb')?.contains(document.activeElement))){refocus.current=false;row?.focus({preventScroll:true});}
    else if(!folded&&document.activeElement===row)root.querySelector<HTMLButtonElement>('.zipco-co-strip2')?.focus({preventScroll:true});
  },[folded]);
  const startLock = useRef(false);
  const closeStart = () => { if(operation.busy)return; if(returnKey)dismissWhatsappReturn(returnKey);releaseStart();setSheet(null); };
  const start = async () => {
    if(startLock.current||!canStart||operation.busy||recoveryOnly||pending)return;
    startLock.current=true;
    try{ if(await run('START_WORK')){if(returnKey)clearWhatsappReturn(returnKey);releaseStart();if(mounted.current)setSheet(null);} }
    finally{startLock.current=false;}
  };

  // Consent and navigation remain separate. No local unlock substitutes for server consent.
  const unlock = async () => {
    if (requestLock.current || phase !== 'idle' || operation.busy || !allowed('AUTHORIZE_CONTACT') || recoveryOnly || pending) return;
    requestLock.current = true;
    setPhase('requesting');
    let ok = false;
    try { ok = await run('AUTHORIZE_CONTACT'); } finally { requestLock.current = false; }
    if (!mounted.current) return;
    const verified = operation.currentOrder();
    if (!ok || !verified || verified.id !== order.id || verified.requestProcess?.id !== process?.id ||
      verified.requestProcess?.agreementPublicId !== process?.agreementPublicId || !contactAuthorized(verified.requestProcess, business)) {
      setPhase('idle'); setFresh(false); return;
    }
    setLatest(verified); setFresh(true); setPhase('loading');
    window.clearTimeout(timer.current);
    window.clearTimeout(feedbackTimer.current);
    const session = readCoordinationSession();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => {
      if (!mounted.current || readCoordinationSession() !== session) return;
      setPhase('ready');
      feedbackTimer.current = window.setTimeout(() => {
        const current = currentStatus.current;
        if (mounted.current && readCoordinationSession() === session && current.business === business &&
          current.process?.id === verified.requestProcess!.id && current.process.agreementPublicId === verified.requestProcess!.agreementPublicId &&
          contactAuthorized(current.process, business))
          announceAction('authorized', { key: `${business}:${verified.requestProcess!.id}:${verified.requestProcess!.version}:AUTHORIZE_CONTACT` });
      }, reduced ? 0 : 2900);
    }, reduced ? LOAD_MS_REDUCED : LOAD_MS);
  };
  const go = async () => {
    if (operation.busy || !authorized || phase !== 'ready' || !canOpen || recoveryOnly || pending) return;
    window.clearTimeout(feedbackTimer.current);
    await run('OPEN_WHATSAPP');
  };
  const annul = async () => {
    if (operation.busy || !allowed('ANNUL_COORDINATION') || recoveryOnly || pending) return;
    window.clearTimeout(feedbackTimer.current);
    if (await run('ANNUL_COORDINATION') && mounted.current) { setSheet(null); setDetail(''); }
  };

  const dialogs=<>
    <ConditionsSheet open={sheet === 'cond'} onOpenChange={value => setSheet(value ? 'cond' : null)} accepted={accepted}
      title={conditionsTitle} subtitle={conditionsSubtitle} when={conditionsWhen} explanation={explanation}
      explanationLabel={negotiated ? 'Explicación de la propuesta aceptada' : 'Nota del cliente'}
      fullAgreement={business} onOpenAgreement={() => setSheet('agree')} />
    <AgreementSheet open={sheet === 'agree'} onOpenChange={value => setSheet(value ? 'agree' : null)} processId={process?.id}
      perspective={business ? 'business' : 'customer'} client={client} accepted={accepted} acceptedAt={acceptedAt} />
    <AnnulSheet open={sheet === 'anul'} onOpenChange={value => setSheet(value ? 'anul' : null)} busy={operation.busy}
      reasons={Object.entries(ANNUL_REASONS) as Array<[string, string]>} reason={reason} onReason={value => { setReason(value as AnnulReason); setDetail(''); }}
      detail={detail} onDetail={setDetail} onConfirm={() => void annul()} />
    {business&&<StartWorkSheet open={sheet==='start'&&canStart} onOpenChange={value=>{if(!value)closeStart();}}
      busy={operation.busy} client={client} service={accepted.subjectSnapshot.orderType==='service'} error={operation.message}
      recovery={recoveryOnly?<button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.update()}>Actualizar estado</button>
        :pending?<button type="button" className="zipco-co-go2" disabled={operation.busy} onClick={()=>void operation.retry()}>Reintentar operación pendiente</button>:undefined}
      onConfirm={()=>void start()}/>}
  </>;

return {accepted,acceptedAt,allowed,authorized,business,canOpen,client,conditionsSummary,counterpartPending,deferred,dialogs,embedded,folded,fresh,go,image,isUnread,motionRef,negotiated,onInspect,operation,order,pending,phase,price,process,recoveryOnly,refocus,refresh,setDeferred,setFolded,setSheet,sheet,statusLabel,stepsTrigger,unlock};
}
export type BusinessCoordinationCardModel=ReturnType<typeof useBusinessCoordinationCardController>;
