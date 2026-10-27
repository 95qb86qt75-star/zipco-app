import {definitiveHoursRejection} from './serviceHoursPolicy';
import { ProposalError, type ProposalBody, type ProposalReceipt } from './proposalApi';
import { PROPOSAL_PATHS, type ProposalAction } from './proposalContract';
import type { RequestProcessSummary } from './requestProcess';

export const CHECK_PROPOSAL_MESSAGE = 'No pudimos comprobar si tu propuesta anterior se envió. Conservamos lo que escribiste. Comprueba el estado del pedido antes de enviar otra propuesta.';

type Saved = { key: string; fingerprint: string; version: number; proposalId: number; action: ProposalAction; confirmed: boolean };
type Intent = Saved & { receipt?: ProposalReceipt; running?: Promise<ProposalReceipt>; uncertain?: boolean };
const storageName = 'zipco-proposal-intents-v1';
export function createProposalIntents(storage?: Pick<Storage, 'getItem' | 'setItem'>,
  uuid = () => crypto.randomUUID().toLowerCase(), hash = async (value: string) =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('')) {
  const memory = new Map<string, Intent>();
  const rows = (): Record<string, Saved> => {
    try {
      const value: unknown = JSON.parse(storage?.getItem(storageName) ?? '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
      for (const row of Object.values(value)) {
        if (!row || typeof row !== 'object' || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(row.key) ||
          !/^[\da-f]{64}$/.test(row.fingerprint) || !Number.isSafeInteger(row.version) || row.version < 1 ||
          !Number.isSafeInteger(row.proposalId) || row.proposalId < 1 || !Object.hasOwn(PROPOSAL_PATHS, row.action) || typeof row.confirmed !== 'boolean') throw Error();
      }
      return value as Record<string, Saved>;
    } catch { throw new ProposalError('No se pudo recuperar la operación pendiente. No se enviará una nueva.', 0); }
  };
  const persist = (id: string, intent: Saved) => {
    if (storage) storage.setItem(storageName, JSON.stringify({ ...rows(), [id]: { key: intent.key, fingerprint: intent.fingerprint,
      version: intent.version, proposalId: intent.proposalId, action: intent.action, confirmed: intent.confirmed } }));
  };
  return {
    // Only an explicit, fresh authorized read may recover a late initial
    // alternative. The original version/proposal gate remains on the next POST.
    recoverLateAlternative(scope: string, processId: number, process: RequestProcessSummary) {
      const id = `${scope}:${processId}`, intent: Intent | undefined = memory.get(id) ?? rows()[id];
      if (!intent || intent.running || intent.confirmed || intent.receipt || intent.action !== 'PROPOSE_ALTERNATIVE' ||
        process.id !== processId || process.version !== intent.version || process.currentProposalId !== intent.proposalId ||
        process.flowContract !== 'AVAILABILITY_V3' || process.state !== 'AWAITING_BUSINESS_RESPONSE' ||
        process.agreementPublicId !== null || process.availability || process.lateInitialResponse?.status !== 'STILL_NEEDED' ||
        !process.allowedActions.includes('PROPOSE_ALTERNATIVE')) return false;
      const saved = rows(); delete saved[id]; storage?.setItem(storageName, JSON.stringify(saved)); memory.delete(id);
      return true;
    },
    async run(scope: string, processId: number, action: ProposalAction, body: ProposalBody, send: (key: string) => Promise<ProposalReceipt>) {
      const id = `${scope}:${processId}`;
      // Past-date consent is the sole permitted amendment to this acceptance intention.
      const { acceptPastSchedule: _, ...exact } = body;
      const fingerprint = await hash(JSON.stringify({ action, body: exact }));
      const restored = memory.has(id) ? undefined : rows()[id];
      let intent: Intent | undefined = memory.get(id) ?? (restored ? { ...restored, uncertain: true } : undefined);
      if (intent && (intent.version !== body.expectedVersion || intent.proposalId !== body.proposalId)) intent = undefined;
      if (intent && intent.fingerprint !== fingerprint) throw new ProposalError(CHECK_PROPOSAL_MESSAGE, 0, 'CHECK_PROPOSAL_REQUIRED', true);
      if (intent?.confirmed) {
        if (intent.receipt) return intent.receipt;
        throw new ProposalError('La operación ya fue confirmada. Actualiza el estado; no se enviará nuevamente.', 0, 'ALREADY_CONFIRMED', true);
      }
      if (intent?.running) return intent.running;
      if (!intent) intent = { key: uuid(), fingerprint, version: body.expectedVersion, proposalId: body.proposalId, action, confirmed: false };
      try { persist(id, intent); } catch { throw new ProposalError('No se pudo proteger el reintento. No enviamos la operación; conserva el formulario y vuelve a intentar.', 0); }
      const current = intent; memory.set(id, current);
      current.running = send(current.key).then(receipt => {
        current.receipt = receipt; current.confirmed = true;
        // If storage fails after success, the in-memory receipt remains final.
        try { persist(id, current); } catch { /* Recovery read must precede any later action. */ }
        return receipt;
      }).catch(error => {
        // Definitive DTO validation failures did not commit; corrected data are a new intention.
        if (error instanceof ProposalError && (error.status === 400 || definitiveHoursRejection(error.status,error.code)) && !current.uncertain) {
          try { const saved = rows(); delete saved[id]; storage?.setItem(storageName, JSON.stringify(saved)); memory.delete(id); }
          catch { current.uncertain = true; }
        } else current.uncertain = true;
        throw error;
      }).finally(() => { current.running = undefined; });
      return current.running;
    },
  };
}
let shared: ReturnType<typeof createProposalIntents> | undefined;
export const proposalIntents = () => shared ??= createProposalIntents(typeof sessionStorage === 'undefined' ? undefined : sessionStorage);
