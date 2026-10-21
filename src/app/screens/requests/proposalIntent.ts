import { ProposalError, type ProposalBody, type ProposalReceipt } from './proposalApi';
import { PROPOSAL_PATHS, type ProposalAction } from './proposalContract';

type Saved = { key: string; fingerprint: string; version: number; proposalId: number; action: ProposalAction; confirmed: boolean };
type Intent = Saved & { receipt?: ProposalReceipt; running?: Promise<ProposalReceipt> };
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
    async run(scope: string, processId: number, action: ProposalAction, body: ProposalBody, send: (key: string) => Promise<ProposalReceipt>) {
      const id = `${scope}:${processId}`;
      // Past-date consent is the sole permitted amendment to this acceptance intention.
      const { acceptPastSchedule: _, ...exact } = body;
      const fingerprint = await hash(JSON.stringify({ action, body: exact }));
      let intent: Intent | undefined = memory.get(id) ?? rows()[id];
      if (intent && (intent.version !== body.expectedVersion || intent.proposalId !== body.proposalId)) intent = undefined;
      if (intent && intent.fingerprint !== fingerprint) throw new ProposalError('Hay una operación sin confirmar. Reintenta sus mismos datos o actualiza el estado antes de cambiarlos.', 0);
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
        if (error instanceof ProposalError && error.status === 400) {
          memory.delete(id); const saved = rows(); delete saved[id]; storage?.setItem(storageName, JSON.stringify(saved));
        }
        throw error;
      }).finally(() => { current.running = undefined; });
      return current.running;
    },
  };
}
let shared: ReturnType<typeof createProposalIntents> | undefined;
export const proposalIntents = () => shared ??= createProposalIntents(typeof sessionStorage === 'undefined' ? undefined : sessionStorage);
