import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { announceProposalSent, proposalSentFeedback, PROPOSAL_SENT_EVENT, subscribeProposalSentFeedback, type FlowFeedback } from './proposalSentFeedback';
import { proposalsFixture } from './proposalFixtures';
const receipt = (sequence = 1) => ({ orderId: 20, orderStatus: 'alternative_proposed', requestProcess: proposalsFixture(sequence).process });
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('window', new EventTarget()); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it.each([['PROPOSE_ALTERNATIVE', 1], ['PROPOSE_FINAL', 3]] as const)('explains both actual category names after %s', (action, sequence) => {
  const feedback = proposalSentFeedback(action, receipt(sequence))!;
  expect(feedback.title).toContain('enviada al cliente');
  expect(feedback.description).toBe('En Mi Negocio queda en «Esperando respuesta». El cliente la encontrará en «Por responder».');
  expect(proposalSentFeedback(action, { ...receipt(sequence), orderStatus: 'pending' })).toBeNull();
});
it.each(['COUNTER_PROPOSAL', 'ACCEPT_PROPOSAL', 'REJECT_PROPOSAL', 'UNKNOWN'])('does not create send-success feedback for %s', action => {
  const receive = vi.fn(); window.addEventListener(PROPOSAL_SENT_EVENT, receive);
  announceProposalSent(action, receipt()); expect(receive).not.toHaveBeenCalled();
});
it('ignores invalid/unconfirmed receipts and mismatched creation states', () => {
  expect(proposalSentFeedback('PROPOSE_ALTERNATIVE', null)).toBeNull();
  expect(proposalSentFeedback('PROPOSE_ALTERNATIVE', receipt(0))).toBeNull();
  expect(proposalSentFeedback('PROPOSE_ALTERNATIVE', receipt(3))).toBeNull();
  expect(proposalSentFeedback('PROPOSE_FINAL', receipt(1))).toBeNull();
});
it('presents success once per proposal, survives card removal and cleans its timer/listener', () => {
  let current: FlowFeedback | null = null;
  const show = vi.fn(value => { current = typeof value === 'function' ? value(current) : value; });
  const dispose = subscribeProposalSentFeedback(show);
  announceProposalSent('PROPOSE_ALTERNATIVE', receipt());
  expect(current?.title).toBe('Alternativa enviada al cliente');
  vi.advanceTimersByTime(2700); announceProposalSent('PROPOSE_ALTERNATIVE', receipt()); expect(show).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(1600); expect(current).toBeNull();
  announceProposalSent('PROPOSE_FINAL', receipt(3)); expect(current?.title).toContain('final');
  dispose(); const calls = show.mock.calls.length;
  vi.runAllTimers(); announceProposalSent('PROPOSE_FINAL', { ...receipt(3), orderId: 21 }); expect(show).toHaveBeenCalledTimes(calls);
  expect(fetch).not.toHaveBeenCalled();
});
it('does not clear another existing flow hologram when the send-success timer ends', () => {
  let current: FlowFeedback | null = null;
  const show = (value: any) => { current = typeof value === 'function' ? value(current) : value; };
  const dispose = subscribeProposalSentFeedback(show); announceProposalSent('PROPOSE_ALTERNATIVE', receipt());
  const other = { title: 'Otra confirmación', description: 'Otro flujo existente' }; current = other;
  vi.advanceTimersByTime(2800); expect(current).toBe(other); dispose();
});
