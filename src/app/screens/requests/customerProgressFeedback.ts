import { announceAction } from './ActionHologram';
import { readCoordinationSession } from './coordinationSession';
import type { CustomerReceiptAction } from './CustomerReceiptDialog';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
// Runs only after the existing POST + authoritative read have been verified.
// Global feedback survives a card unmount; it never crosses an identity change.
export async function presentCustomerProgress(action: CustomerReceiptAction, key: string, startedAt: number,
  onVerified: () => void) {
  const session = readCoordinationSession(); if (!session) return;
  await wait(Math.max(0, 1100 - (Date.now() - startedAt)));
  if (readCoordinationSession() !== session) return;
  onVerified();
  if (action === 'CONFIRM_RECEIPT') await wait(100);
  if (readCoordinationSession() !== session) return;
  announceAction(action === 'ACK_READY_NOTICE' ? 'clientAck' : 'clientReceived', { key });
  if (action === 'CONFIRM_RECEIPT') await wait(600);
  if (readCoordinationSession() === session) window.dispatchEvent(new Event('zipco-requests-refresh'));
}
