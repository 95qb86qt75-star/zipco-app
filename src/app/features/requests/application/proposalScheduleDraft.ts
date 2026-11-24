import type { ProposalRead } from '../domain/proposalContract';

type ScheduleDraft = { counterId: number; mode: 'FREE' | 'PREPAYMENT'; note: string;
  contact: boolean; choice: 'NONE' | 'REQUEST_RESERVATION' };
const key = (userId: string, processId: number) => `zipco-schedule-draft:${userId}:${processId}`;

// Draft only: never an authorization, accepted agreement, or source of offer IDs.
// It is private to this browser tab/user/process and is not sent automatically.
export function saveProposalScheduleDraft(userId: string, processId: number, draft: ScheduleDraft) {
  try { sessionStorage.setItem(key(userId, processId), JSON.stringify(draft)); } catch { /* Current form state remains available. */ }
}
export function readProposalScheduleDraft(userId: string, read: ProposalRead): ScheduleDraft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key(userId, read.process.id)) ?? 'null');
    const plan = read.proposals.at(-1)?.availability ?? read.process.availability;
    if (!draft || !Number.isSafeInteger(draft.counterId) || !read.proposals.some(p => p.id === draft.counterId && p.type === 'CUSTOMER_COUNTER') ||
      !['FREE', 'PREPAYMENT'].includes(draft.mode) || plan?.reservationOffer?.mode !== draft.mode ||
      typeof draft.note !== 'string' || Array.from(draft.note).length > 300 || typeof draft.contact !== 'boolean' ||
      !['NONE', 'REQUEST_RESERVATION'].includes(draft.choice)) return null;
    return { ...draft, contact: plan.allowCustomerWhatsapp === true && draft.contact };
  } catch { return null; }
}
