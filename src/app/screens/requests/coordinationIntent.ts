import { RequestProcessError } from './requestProcessErrors';
import { coordinationBody, type CoordinationAction, type CoordinationBody } from './coordinationApi';

export type CoordinationIntent = { action: CoordinationAction; body: CoordinationBody; key: string };
export const coordinationStorageWarning = 'La operación quedó resuelta, pero no se pudo limpiar el almacenamiento. No repitas la acción. Actualiza el estado; no se garantiza recuperar esta confirmación si recargas o cierras la aplicación.';
// Only the exact request body and UUID are stored, never contacts or navigation URLs.
export function createCoordinationIntents(uuid = () => crypto.randomUUID(), storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  const pending = new Map<string, CoordinationIntent>();
  const busy = new Set<string>();
  const confirmed = new Set<string>();
  const retired = new Set<string>();
  const warnings = new Map<string, string>();
  const restored = new Set<string>();
  const slot = (scope: string, id: number) => `zipco-coordination:${scope}:${id}`;
  const read = (scope: string, id: number): CoordinationIntent | null => {
    const name = slot(scope, id);
    if (pending.has(name)) return pending.get(name)!;
    const saved = storage?.getItem(name);
    if (!saved) return null;
    try {
      const intent = JSON.parse(saved) as CoordinationIntent & { confirmed?: boolean };
      if (!intent || !['AUTHORIZE_CONTACT', 'OPEN_WHATSAPP', 'START_WORK', 'ANNUL_COORDINATION'].includes(intent.action) ||
        !intent.body || !Number.isSafeInteger(intent.body.expectedVersion) || intent.body.expectedVersion < 1 ||
        (intent.confirmed !== undefined && typeof intent.confirmed !== 'boolean') ||
        typeof intent.key !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(intent.key) ||
        JSON.stringify(intent.body) !== JSON.stringify(coordinationBody(intent.action, intent.body.expectedVersion, intent.body.reasonCode, intent.body.reasonDetail))) throw new Error();
      if (intent.confirmed === true || retired.has(`${name}:${intent.key}`)) {
        // Preserve protection against stale controls after storage cleanup. WhatsApp
        // remains repeatable as a new deliberate access, never as a cleaned retry.
        if (intent.action !== 'OPEN_WHATSAPP') confirmed.add(`${name}:${intent.action}:${JSON.stringify(intent.body)}`);
        retired.add(`${name}:${intent.key}`); warnings.set(name, coordinationStorageWarning); return null;
      }
      restored.add(name); pending.set(name, intent); return intent;
    } catch { throw new RequestProcessError('No se pudo recuperar la operación pendiente. Actualiza el pedido antes de continuar.', 409, true); }
  };
  const retire = (name: string, intent: CoordinationIntent | null) => {
    if (intent) retired.add(`${name}:${intent.key}`);
    pending.delete(name);
    restored.delete(name);
    // A durable tombstone protects a confirmed record if removal fails. No result or URL is stored.
    try { if (intent) storage?.setItem(name, JSON.stringify({ ...intent, confirmed: true })); } catch { /* Removal can still succeed. */ }
    try { storage?.removeItem(name); warnings.delete(name); }
    catch { warnings.set(name, coordinationStorageWarning); }
  };
  return {
    read,
    needsReconciliation(scope: string, id: number) { return restored.has(slot(scope, id)); },
    allowReconciledRetry(scope: string, id: number) { restored.delete(slot(scope, id)); },
    warning(scope: string, id: number) { return warnings.get(slot(scope, id)) ?? ''; },
    retryCleanup(scope: string, id: number) {
      const name = slot(scope, id);
      if (!warnings.has(name)) return;
      try { storage?.removeItem(name); warnings.delete(name); } catch { warnings.set(name, coordinationStorageWarning); }
    },
    clear(scope: string, id: number, resolved = false) {
      const name = slot(scope, id);
      let intent: CoordinationIntent | null = null;
      try { intent = read(scope, id); } catch { /* Caller already reconciled this slot with the server. */ }
      if (resolved && intent && intent.action !== 'OPEN_WHATSAPP') confirmed.add(`${name}:${intent.action}:${JSON.stringify(intent.body)}`);
      retire(name, intent);
    },
    async run<T>(scope: string, id: number, action: CoordinationAction, body: CoordinationBody,
      send: (intent: CoordinationIntent) => Promise<T>, retry = false, canCommit = () => true): Promise<T | null> {
      const name = slot(scope, id);
      if (busy.has(name) || !canCommit()) return null;
      if (warnings.has(name)) throw new RequestProcessError(coordinationStorageWarning, 0);
      busy.add(name);
      try {
        let intent = read(scope, id);
        if (warnings.has(name)) throw new RequestProcessError(coordinationStorageWarning, 0);
        if (restored.has(name)) throw new RequestProcessError('Se recuperó una operación anterior. Actualiza su estado antes de reintentar.', 0);
        if (retry && !intent) return null;
        if (intent && !retry) throw new RequestProcessError('Primero reintenta la operación pendiente sin cambiar sus condiciones.', 0);
        const signature = `${name}:${action}:${JSON.stringify(body)}`;
        if (!intent && confirmed.has(signature)) return null;
        if (!intent) {
          intent = { action, body: JSON.parse(JSON.stringify(body)), key: uuid() };
          try { storage?.setItem(name, JSON.stringify(intent)); }
          catch { throw new RequestProcessError('No se pudo preparar la operación segura. Intenta nuevamente.', 0); }
          pending.set(name, intent);
        }
        try {
          const result = await send(intent);
          // A request abandoned locally may have committed on the server. Preserve its
          // original intention for reconciliation instead of applying late effects.
          if (!canCommit()) return null;
          confirmed.add(`${name}:${intent.action}:${JSON.stringify(intent.body)}`);
          // OPEN_WHATSAPP can be repeated deliberately after confirmed completion.
          if (intent.action === 'OPEN_WHATSAPP') confirmed.delete(`${name}:${intent.action}:${JSON.stringify(intent.body)}`);
          retire(name, intent);
          return result;
        } catch (error) {
          // Conflicts require authoritative refresh; callers explicitly clear only after that refresh.
          if (error instanceof RequestProcessError && error.status === 409 && error.refreshConditions)
            throw error;
          throw error;
        }
      } finally { busy.delete(name); }
    },
  };
}

export const uncertainCoordinationMessage = 'No se pudo confirmar la operación. Reintenta la solicitud pendiente; se conservarán sus condiciones originales.';
