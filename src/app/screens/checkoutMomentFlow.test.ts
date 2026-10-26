import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from './profile/business-config/types';

const state = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0, create: vi.fn(), toast: vi.fn(),capabilities:vi.fn() }));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.values)) state.values[index] = typeof initial === 'function' ? initial() : initial;
    return [state.values[index], (next: unknown) => {
      state.values[index] = typeof next === 'function' ? next(state.values[index]) : next;
    }];
  },
  useRef: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.values)) state.values[index] = { current: initial };
    return state.values[index];
  },
  useEffect: () => undefined,
}));
vi.mock('./createOrderApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('./createOrderApi')>(), createOrder: state.create,
}));
vi.mock('./Toast', () => ({ showAppToast: state.toast }));
vi.mock('./requests/ActionHologram', () => ({ announceAction: vi.fn() }));
vi.mock('./requests/reservationCapabilities',()=>({readReservationCapabilities:state.capabilities}));
import { ConsultationDesignSheet } from './requests/availability-design/AvailabilityDesign';
import CheckoutScreen from './CheckoutScreen';
import ServiceCheckoutScreen from './ServiceCheckoutScreen';
import OrderMomentSelector from './OrderMomentSelector';
import { PAST_SCHEDULE_MESSAGE } from './requests/requestProcessErrors';
import { CreateOrderError } from './createOrderApi';
import { RETRY_ORIGINAL_ORDER_MESSAGE } from './orderCreationIntent';

type View = React.ReactElement<{
  children?: React.ReactNode; type?: string; value?: string;
  onClick?: () => unknown; onChange?: (event: { target: { value: string; files?: File[] } }) => unknown;
}>;
function elements(node: React.ReactNode): View[] {
  return React.Children.toArray(node).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === OrderMomentSelector) return elements(OrderMomentSelector(child.props as React.ComponentProps<typeof OrderMomentSelector>));
    const view = child as View;
    return [view, ...elements(view.props.children)];
  });
}
function text(node: React.ReactNode): string {
  return React.Children.toArray(node).map((child) => React.isValidElement(child)
    ? text((child as View).props.children) : String(child)).join('');
}
const photo = 'https://res.cloudinary.com/test/image/upload/reference.jpg';
const item: CatalogItem = { id: 7, businessId: 5, name: 'Producto', description: 'Prueba', kind: 'product',
  pricingMode: 'fixed_price', priceClp: 1000, startingPriceClp: null, imageUrl: '', isActive: true,
  displayOrder: 0, createdAt: '', updatedAt: '' };
const noop = () => undefined;

beforeEach(() => {
  state.values = []; state.cursor = 0; state.create.mockReset().mockResolvedValue({ id: 1, total: 1000 }); state.toast.mockReset();
  state.capabilities.mockReset().mockResolvedValue({reservationCreationEnabled:false});
  vi.stubGlobal('React', React);
  vi.stubGlobal('localStorage', { getItem: () => 'test' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ secure_url: photo }))));
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-16T01:30:25Z'));
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe.each(['product', 'service'] as const)('%s checkout moment integration', (kind) => {
  const render = () => {
    state.cursor = 0;
    return elements(kind === 'product'
      ? CheckoutScreen({ business: { id: 5, userId: 9 }, currentUserId: 8, selectedProducts: [7], products: [item],
        onBack: noop, onOrderComplete: noop, onCatalogConflict: noop, onSessionExpired: noop })
      : ServiceCheckoutScreen({ service: { id: 7 }, provider: { id: 5, userId: 9 }, activeTab: 'home',
        setActiveTab: noop, onBack: noop }));
  };
  const button = (label: string) => render().find((view) => view.type === 'button' && text(view.props.children).trim() === label)!;
  const input = (type: string) => render().find((view) => view.type === 'input' && view.props.type === type)!;
  const sheet = () => render().find(view => view.type === ConsultationDesignSheet)!.props as React.ComponentProps<typeof ConsultationDesignSheet>;
  const submit = () => {
    if (kind === 'product') {
      if (!sheet().open) button('Requiero este producto').props.onClick!();
      return sheet().onSend();
    }
    return (button('Reintentar envío') ?? button('Solicitar Servicio')).props.onClick!();
  };

  if (kind === 'product') {
    it('selects V3 only with its own flag and never falls back after an uncertain creation',async()=>{
      state.capabilities.mockResolvedValue({reservationCreationEnabled:true,simplifiedReservationCreationEnabled:true});state.create.mockRejectedValueOnce(new TypeError('network'));
      button('Ahora').props.onClick!();await submit();const first=state.create.mock.calls[0][0];expect(first.expectedFlow).toBe('AVAILABILITY_V3');expect(first.url).toMatch(/availability-reservation-v3-requests$/);
      state.capabilities.mockResolvedValue({reservationCreationEnabled:true,simplifiedReservationCreationEnabled:false});await submit();expect(state.capabilities).toHaveBeenCalledOnce();expect(state.create.mock.calls[1][0].url).toBe(first.url);expect(state.create.mock.calls[1][0].idempotencyKey).toBe(first.idempotencyKey);
    });
    it('creates V2 only when the authenticated capability is enabled and freezes the route on retry',async()=>{
      state.capabilities.mockResolvedValue({reservationCreationEnabled:true});state.create.mockRejectedValueOnce(new TypeError('network'));
      button('Ahora').props.onClick!();await submit();
      expect(state.create.mock.calls[0][0].url).toMatch(/\/orders\/availability-reservation-requests$/);
      expect(state.create.mock.calls[0][0].expectedFlow).toBe('AVAILABILITY_V2');
      state.capabilities.mockResolvedValue({reservationCreationEnabled:false});await submit();
      expect(state.capabilities).toHaveBeenCalledOnce();expect(state.create.mock.calls[1][0].url).toBe(state.create.mock.calls[0][0].url);expect(state.create.mock.calls[1][0].idempotencyKey).toBe(state.create.mock.calls[0][0].idempotencyKey);
    });
    it('keeps S2 creation when reservations are disabled',async()=>{button('Ahora').props.onClick!();await submit();expect(state.create.mock.calls[0][0].expectedFlow).toBe('AVAILABILITY_V1');expect(state.create.mock.calls[0][0].url).toMatch(/\/orders\/availability-requests$/);});
    it('opens the real review without posting and saves an explicit unchecked preference', async () => {
      button('Ahora').props.onClick!();
      button('Requiero este producto').props.onClick!();
      expect(state.create).not.toHaveBeenCalled();
      expect(sheet().open).toBe(true);
      expect(sheet().contact).toBe(true);
      sheet().onContactChange(false);
      await submit();
      expect(state.create.mock.calls[0][0].payload.customerContactPreference).toEqual({ allowed: false, textVersion: 'availability-customer-whatsapp-v1' });
      expect(sheet().open).toBe(false);
    });

    it('keeps the review open after failure and locks the original preference for retry', async () => {
      state.create.mockRejectedValueOnce(new TypeError('network'));
      button('Ahora').props.onClick!();
      await submit();
      expect(sheet().open).toBe(true);
      expect(sheet().error).toBeTruthy();
      expect(sheet().contactLocked).toBe(true);
      expect(sheet().contact).toBe(true);
      await submit();
      expect(state.create.mock.calls[1][0].payload).toEqual(state.create.mock.calls[0][0].payload);
    });
  }

  it('switches modes without retaining date/time and preserves note, photo and items', async () => {
    if (kind === 'product') button('Agregar nota opcional').props.onClick!();
    render().find((view) => view.type === 'textarea')!.props.onChange!({ target: { value: 'Nota conservada' } });
    if (kind === 'product') button('Agregar foto de referencia').props.onClick!();
    await input('file').props.onChange!({ target: { value: '', files: [new File(['test'], 'photo.png', { type: 'image/png' })] } });
    button('Programar').props.onClick!();
    input('date').props.onChange!({ target: { value: '2026-12-20' } });
    if (kind === 'product') { button('15:00').props.onClick!(); button('15:10').props.onClick!(); }
    else input('time').props.onChange!({ target: { value: '15:10' } });
    button('Hoy').props.onClick!();
    expect(render().some((view) => view.props.type === 'date')).toBe(false);
    expect(input('time').props.value).toBe('');
    input('time').props.onChange!({ target: { value: '23:00' } });
    button('Hoy').props.onClick!();
    expect(input('time').props.value).toBe('23:00');
    button('Ahora').props.onClick!();
    expect(render().some((view) => view.props.type === 'date' || view.props.type === 'time')).toBe(false);
    button('Hoy').props.onClick!();
    expect(input('time').props.value).toBe('');
    button('Programar').props.onClick!();
    expect(input('date').props.value).toBe('');
    button('Hoy').props.onClick!();
    input('time').props.onChange!({ target: { value: '23:00' } });
    await submit();
    expect(state.create).toHaveBeenCalledOnce();
    expect(state.create.mock.calls[0][0].payload).toEqual({ businessId: 5, items: [{ catalogItemId: 7, quantity: 1 }],
      note: 'Nota conservada', referencePhoto: photo, needNow: false, deliveryDate: '2026-10-15', deliveryTime: '23:00',
      ...(kind === 'product' ? { customerContactPreference: { allowed: true, textVersion: 'availability-customer-whatsapp-v1' } } : {}) });
  });

  it('blocks a passed time before dispatching and does not roll to tomorrow', async () => {
    button('Hoy').props.onClick!();
    input('time').props.onChange!({ target: { value: '22:00' } });
    await submit();
    expect(state.create).not.toHaveBeenCalled();
    expect(state.toast).toHaveBeenCalledWith(PAST_SCHEDULE_MESSAGE, 'warning');
  });

  it('submits the unchanged immediate contract', async () => {
    button('Ahora').props.onClick!();
    await submit();
    expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({
      needNow: true, deliveryDate: null, deliveryTime: null,
    }) }));
  });

  it('submits Programar using the existing date/time controls', async () => {
    button('Programar').props.onClick!();
    input('date').props.onChange!({ target: { value: '2026-12-20' } });
    if (kind === 'product') { button('15:00').props.onClick!(); button('15:10').props.onClick!(); }
    else input('time').props.onChange!({ target: { value: '15:10' } });
    await submit();
    expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({
      needNow: false, deliveryDate: '2026-12-20', deliveryTime: '15:10',
    }) }));
  });

  it.each(['2026-10-16T02:31:00Z', '2026-10-16T03:01:00Z'])('retries exactly the same intent after network loss at %s', async (instant) => {
    state.create.mockRejectedValueOnce(new CreateOrderError('Red no disponible', null));
    button('Hoy').props.onClick!();
    input('time').props.onChange!({ target: { value: '23:00' } });
    await submit();
    const original = state.create.mock.calls[0][0];
    expect(original.idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    vi.setSystemTime(new Date(instant));
    await submit();
    const retry = state.create.mock.calls[1][0];
    expect(JSON.stringify(retry.payload)).toBe(JSON.stringify(original.payload));
    expect(retry.idempotencyKey).toBe(original.idempotencyKey);
    expect(retry.payload.deliveryDate).toBe('2026-10-15');
  });

  it('resolves the original before edits can create another order', async () => {
    state.create.mockRejectedValueOnce(new TypeError('network'));
    button('Hoy').props.onClick!();
    input('time').props.onChange!({ target: { value: '23:00' } });
    await submit();
    const original = state.create.mock.calls[0][0];
    button('Ahora').props.onClick!();
    if (kind === 'product') button('Agregar nota opcional').props.onClick!();
    render().find((view) => view.type === 'textarea')!.props.onChange!({ target: { value: 'Nota cambiada' } });
    await submit();
    expect(state.create.mock.calls[1][0].payload).toEqual(original.payload);
    expect(state.create.mock.calls[1][0].idempotencyKey).toBe(original.idempotencyKey);
    expect(state.toast).toHaveBeenCalledWith(RETRY_ORIGINAL_ORDER_MESSAGE, 'warning');
  });

  it('blocks double tap during submission and stale handlers after success', async () => {
    let finish!: (value: unknown) => void;
    state.create.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    button('Ahora').props.onClick!();
    const savedSubmit = kind === 'product' ? sheet().onSend : button('Solicitar Servicio').props.onClick!;
    const first = savedSubmit();
    await savedSubmit();
    expect(state.create).toHaveBeenCalledOnce();
    finish({ id: 1, total: 1000 }); await first;
    await savedSubmit();
    expect(state.create).toHaveBeenCalledOnce();
  });

  it('allows a corrected first-attempt rejection with a fresh key', async () => {
    state.create.mockRejectedValueOnce(new CreateOrderError('Revisa los datos', 400, 'not-created'));
    button('Hoy').props.onClick!();
    input('time').props.onChange!({ target: { value: '23:00' } });
    await submit();
    const key = state.create.mock.calls[0][0].idempotencyKey;
    input('time').props.onChange!({ target: { value: '23:10' } });
    await submit();
    expect(state.create.mock.calls[1][0].idempotencyKey).not.toBe(key);
    expect(state.create.mock.calls[1][0].payload.deliveryTime).toBe('23:10');
  });
});
