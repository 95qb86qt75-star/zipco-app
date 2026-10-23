/**
 * Puente entre la tarjeta "En curso" (que dispara el aviso) y la tarjeta "Listo" (que nace tras el refresh).
 * Al confirmarse MARK_READY el pedido sale de "En curso" y su tarjeta se desmonta; la NUEVA instancia (estado READY) necesita saber
 * que el negocio acaba de avisar para (a) abrirse con la animación de "Pedido notificado" y (b) plegarse sola cuando termina el holograma.
 * Es memoria de módulo (no localStorage): solo importa dentro de la misma sesión de pantalla, y vence a los 15 s.
 */
import { announceAction } from './ActionHologram';
import { readCoordinationSession } from './coordinationSession';
const WINDOW_MS = 15000;
const marks = new Map<string, number>();
let markedSession = readCoordinationSession();
function key(orderId: number, agreement: string) {
  const session = readCoordinationSession();
  if (session !== markedSession) { marks.clear(); markedSession = session; }
  return session ? `${orderId}:${agreement}` : '';
}
export const markJustNotified = (orderId: number, agreement: string) => {
  const id = key(orderId, agreement);
  for (const [entry, at] of marks) if (Date.now() - at > WINDOW_MS) marks.delete(entry);
  if (id) marks.set(id, Date.now());
};
/** No consume la marca (React StrictMode renderiza dos veces). */
export const wasJustNotified = (orderId: number, agreement: string) => {
  const id = key(orderId, agreement); const at = marks.get(id);
  if (at === undefined) return false;
  if (Date.now() - at > WINDOW_MS) { marks.delete(id); return false; }
  return true;
};

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
// Verified feedback survives card/category unmounts, but never session changes.
export async function presentReadyNotification(orderId: number, agreement: string, noticeKey: string,
  startedAt: number, onSent: () => void) {
  const session = readCoordinationSession(); if (!session) return;
  await wait(Math.max(0, 1100 - (Date.now() - startedAt)));
  if (readCoordinationSession() !== session) return;
  onSent();
  await wait(700);
  if (readCoordinationSession() !== session) return;
  markJustNotified(orderId, agreement);
  announceAction('ready', { key: noticeKey });
  await wait(600);
  if (readCoordinationSession() === session) {
    window.dispatchEvent(new Event('zipco-requests-refresh'));
  }
}
