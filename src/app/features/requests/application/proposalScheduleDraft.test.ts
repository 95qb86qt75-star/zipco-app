import { afterEach, expect, it, vi } from 'vitest';
import { readProposalScheduleDraft, saveProposalScheduleDraft } from './proposalScheduleDraft';
import type { ProposalRead } from '../domain/proposalContract';

afterEach(() => vi.unstubAllGlobals());
function setup() {
  const storage = new Map<string, string>();
  vi.stubGlobal('sessionStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v) });
  const read = { process: { id: 1 }, proposals: [{ id: 105, type: 'CUSTOMER_COUNTER' },
    { id: 106, type: 'BUSINESS_FINAL', availability: { path: 'LOCAL_PICKUP', allowCustomerWhatsapp: true, reservationOffer: { mode: 'FREE' } } }] } as unknown as ProposalRead;
  const draft = { counterId: 105, mode: 'FREE' as const, choice: 'REQUEST_RESERVATION' as const, note: 'A mi nombre', contact: false };
  saveProposalScheduleDraft('customer-1', 1, draft);
  return { read, draft, storage };
}
it('restores a matching participant draft without granting contact', () => {
  const { read, draft } = setup(); expect(readProposalScheduleDraft('customer-1', read)).toEqual(draft);
});
it('isolates participant and process', () => {
  const { read } = setup(); expect(readProposalScheduleDraft('other', read)).toBeNull();
  read.process.id = 2; expect(readProposalScheduleDraft('customer-1', read)).toBeNull();
});
it('requires the originating counter to exist in the authorized history', () => {
  const { read } = setup(); read.proposals.shift(); expect(readProposalScheduleDraft('customer-1', read)).toBeNull();
});
it('does not restore a choice against an incompatible new offer', () => {
  const { read } = setup(); read.proposals.at(-1)!.availability!.reservationOffer = { mode: 'NONE' };
  expect(readProposalScheduleDraft('customer-1', read)).toBeNull();
});
it('removes contact choice when final does not allow it', () => {
  const { read, draft } = setup(); saveProposalScheduleDraft('customer-1', 1, { ...draft, contact: true });
  read.proposals.at(-1)!.availability!.allowCustomerWhatsapp = false;
  expect(readProposalScheduleDraft('customer-1', read)?.contact).toBe(false);
});
it('survives unavailable browser storage without faking persistence', () => {
  const { read, draft } = setup(); vi.stubGlobal('sessionStorage', { getItem: () => { throw Error(); }, setItem: () => { throw Error(); } });
  expect(() => saveProposalScheduleDraft('customer-1', 1, draft)).not.toThrow();
  expect(readProposalScheduleDraft('customer-1', read)).toBeNull();
});
