import { buildCreateOrderPayload, CreateOrderError, type CreatedOrder, type CreateOrderPayload } from './createOrderApi';
import { resolveOrderDelivery, type OrderMomentSelection } from './orderMoment';

type OrderDetails = Omit<CreateOrderPayload, 'needNow' | 'deliveryDate' | 'deliveryTime'>;
type CreationDraft = { identity: string; selection: OrderMomentSelection; details: OrderDetails };
type PendingIntent = {
  identity: string;
  signature: string;
  selection: OrderMomentSelection;
  key: string;
  payload: CreateOrderPayload;
  uncertain: boolean;
};
type SendOrder = (payload: CreateOrderPayload, key: string) => Promise<CreatedOrder>;

export const RETRY_ORIGINAL_ORDER_MESSAGE =
  'Hay un envío anterior sin confirmar. Reintentaremos ese pedido con sus condiciones originales; los cambios actuales no se enviarán.';

export class OrderSelectionError extends Error {}

// Lives in the checkout ref, just like the previous key. No contact data, tokens
// or order snapshots are added to browser storage. Never reset on a rerender.
export function createOrderCreationIntent(uuid = () => crypto.randomUUID()) {
  let pending: PendingIntent | null = null;
  let inFlight = false;
  let confirmed = false;

  return {
    hasPending() { return pending !== null; },
    pendingPayload() { return pending?.payload ?? null; },
    isBlocked() { return inFlight || confirmed; },
    async submit(draft: CreationDraft, send: SendOrder, notify: (message: string) => void) {
      if (inFlight || confirmed) return null;
      inFlight = true;
      try {
        const signature = JSON.stringify(draft);
        if (pending) {
          if (pending.identity !== draft.identity) {
            throw new CreateOrderError('Hay un pedido sin confirmar de otra sesión o negocio. Vuelve al pedido original antes de continuar.', null);
          }
          if (pending.signature !== signature) notify(RETRY_ORIGINAL_ORDER_MESSAGE);
        } else {
          let delivery: ReturnType<typeof resolveOrderDelivery>;
          try { delivery = resolveOrderDelivery(draft.selection); }
          catch (error) {
            throw new OrderSelectionError(error instanceof Error ? error.message : 'Selecciona cuándo lo necesitas.');
          }
          // Copy every mutable input before any await; this exact snapshot is
          // reused even if local time passes or the editable form changes.
          const payload = buildCreateOrderPayload({
            ...draft.details, items: draft.details.items.map((item) => ({ ...item })), ...delivery,
          });
          payload.items.forEach(Object.freeze);
          Object.freeze(payload.items);
          if (payload.customerContactPreference) Object.freeze(payload.customerContactPreference);
          Object.freeze(payload);
          pending = { identity: draft.identity, signature,
            selection: Object.freeze({ ...draft.selection }), key: uuid(), payload, uncertain: false };
        }
        try {
          const result = await send(pending.payload, pending.key);
          pending = null;
          confirmed = true;
          return result;
        } catch (error) {
          // A rejection of a later retry cannot disprove an earlier uncertain
          // creation. Preserve that original intention until success confirms it.
          if (error instanceof CreateOrderError && error.outcome === 'not-created' && !pending.uncertain) pending = null;
          else pending.uncertain = true;
          throw error;
        }
      } finally { inFlight = false; }
    },
  };
}
