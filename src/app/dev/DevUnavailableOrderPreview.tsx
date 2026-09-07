import MyOrderCard from '../screens/requests/MyOrderCard';
import { getActionableOrder, normalizeMyOrdersPayload } from '../screens/requests/orderNormalization';

const DEV_UNAVAILABLE_FIXTURE_MARKER = 'ZIPCO_DEV_UNAVAILABLE_FIXTURE_ONLY';

export function createUnavailablePreviewOrder() {
  const [order] = normalizeMyOrdersPayload([{
    fixtureMarker: DEV_UNAVAILABLE_FIXTURE_MARKER,
    id: 'invalid-development-id',
    status: 'invalid-development-status',
    createdAt: 'invalid-development-date',
    products: '{invalid-development-products',
    total: null,
    needNow: false
  }]);
  return order;
}

export function previewHasNoTransition(order: ReturnType<typeof createUnavailablePreviewOrder>) {
  return getActionableOrder(order) === null;
}

export function createPreviewCallbacks() {
  return {
    onAction: () => undefined,
    onRetry: () => undefined
  };
}

export default function DevUnavailableOrderPreview() {
  const order = createUnavailablePreviewOrder();
  const callbacks = createPreviewCallbacks();

  return (
    <section className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Vista aislada de datos inválidos
      </p>
      <MyOrderCard
        order={order}
        isUpdating={false}
        onAction={callbacks.onAction}
        onRetry={callbacks.onRetry}
      />
    </section>
  );
}
