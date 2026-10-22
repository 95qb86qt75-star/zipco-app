import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { isRecord } from './orderValueParsers';
import { normalizeRequestProcess, positiveInteger } from './requestProcess';
import { readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';

export const PROPOSAL_SENT_EVENT = 'zipco-proposal-sent';
export type FlowFeedback = { title: string; description: string; kind?: 'alternative' | 'final' };

export function proposalSentFeedback(action: unknown, receipt: unknown) {
  if (!['PROPOSE_ALTERNATIVE', 'PROPOSE_FINAL'].includes(String(action)) || !isRecord(receipt) ||
    !positiveInteger(receipt.orderId) || receipt.orderStatus !== 'alternative_proposed') return null;
  const process = normalizeRequestProcess(receipt.requestProcess);
  if (!process || process.agreementPublicId !== null || process.state !==
    (action === 'PROPOSE_FINAL' ? 'AWAITING_CUSTOMER_FINAL_DECISION' : 'AWAITING_CUSTOMER_DECISION')) return null;
  return {
    key: `${receipt.orderId}:${process.id}:${process.currentProposalId}:${action}`,
    title: action === 'PROPOSE_FINAL' ? 'Propuesta final enviada al cliente' : 'Alternativa enviada al cliente',
    description: 'En Mi Negocio queda en «Esperando respuesta». El cliente la encontrará en «Por responder».',
  };
}

// Local success feedback only. This does not emit a push, toast or order action.
export function announceProposalSent(action: unknown, receipt: unknown) {
  if (proposalSentFeedback(action, receipt)) window.dispatchEvent(new CustomEvent(PROPOSAL_SENT_EVENT, { detail: { action, receipt } }));
}

export function subscribeProposalSentFeedback(show: Dispatch<SetStateAction<FlowFeedback | null>>) {
  const seen = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let session = readCoordinationSession();
  let activeMessage: FlowFeedback | null = null;
  const receive = (event: Event) => {
    const detail: unknown = (event as CustomEvent).detail;
    if (!isRecord(detail)) return;
    const feedback = proposalSentFeedback(detail.action, detail.receipt);
    if (!feedback || seen.has(feedback.key)) return;
    seen.add(feedback.key);
    if (seen.size > 100) seen.delete(seen.values().next().value!);
    if (timer) clearTimeout(timer);
    const message: FlowFeedback = { title: feedback.title, description: feedback.description, kind: detail.action === 'PROPOSE_FINAL' ? 'final' : 'alternative' };
    activeMessage = message; session = readCoordinationSession();
    show(message);
    timer = setTimeout(() => show(current => current === message ? null : current), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 2200 : 4300);
  };
  window.addEventListener(PROPOSAL_SENT_EVENT, receive);
  const unsubscribe = subscribeCoordinationSession(() => {
    const next = readCoordinationSession();
    if (next !== session) { session = next; seen.clear(); if (timer) clearTimeout(timer); const previous=activeMessage; activeMessage=null; show(current => current === previous ? null : current); }
  });
  return () => { window.removeEventListener(PROPOSAL_SENT_EVENT, receive); unsubscribe(); if (timer) clearTimeout(timer); };
}

export function useProposalSentFeedback(show: Dispatch<SetStateAction<FlowFeedback | null>>) {
  // React's state dispatcher is stable. Keep the listener alive when filtered
  // order cards unmount after receiving the successful POST receipt.
  useEffect(() => subscribeProposalSentFeedback(show), []);
}
