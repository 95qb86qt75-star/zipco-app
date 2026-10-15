import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, agreement: null as unknown, retry: vi.fn() }));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[index], (next: unknown) => {
      hooks.slots[index] = typeof next === 'function' ? next(hooks.slots[index]) : next;
    }];
  },
}));
vi.mock('./useAgreement', () => ({ default: () => ({ state: hooks.agreement, retry: hooks.retry }) }));
import ProcessOrderCard from './ProcessOrderCard';
import OrderReferencePhoto from './OrderReferencePhoto';
import { OrderCardDisclosure } from './OrderCardPanels';
import { BusinessOrderHeader, CustomerOrderHeader } from './OrderCardHeaders';
import { AcceptedConditionsPanel, AgreementContent } from './AcceptedConditions';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { agreementFixture, coordinationProcess, pendingProcess, rawOrder } from './requestProcessFixtures';

type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function elements(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    const view = child as Node;
    return [view, ...elements(view.props.children)];
  });
}
const event = () => ({ stopPropagation: vi.fn() });
const props = { isUpdating: false, onRetry: vi.fn(), onAccept: vi.fn(), onOpen: vi.fn() };
const raw = { ...rawOrder, customerName: 'Cliente de prueba', customerImage: 'https://example.test/customer-profile.jpg',
  businessName: 'Negocio de prueba', businessImage: 'https://example.test/business-profile.jpg' };
beforeEach(() => {
  hooks.slots = []; hooks.cursor = 0; hooks.agreement = { status: 'absent' }; hooks.retry.mockReset();
  Object.values(props).forEach((value) => { if (typeof value === 'function') value.mockClear(); });
  vi.stubGlobal('React', React); vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const render = (input: React.ComponentProps<typeof ProcessOrderCard>) => {
  hooks.cursor = 0; return ProcessOrderCard(input);
};

describe('reused 2A card design without legacy actions', () => {
  it.each([true, false])('labels the initial business card Nuevo pedido independently of unread state (%s)', (isUnread) => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const view = render({ ...props, order, business: true, isUnread });
    const header = elements(view).find((node) => node.type === BusinessOrderHeader)!;
    expect(header.props.statusLabel).toBe('Nuevo pedido');
    expect(header.props.isUnread).toBe(isUnread);
    expect(props.onOpen).not.toHaveBeenCalled();
    expect(order.requestProcess?.state).toBe('AWAITING_BUSINESS_RESPONSE');
  });

  it('shows the actual formatted total on the accept button and keeps the busy lock', () => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, total: 123456, requestProcess: pendingProcess }])[0];
    const html = renderToStaticMarkup(render({ ...props, order, business: true, expanded: true }));
    expect(html).toContain(`Aceptar pedido por $${order.total.toLocaleString('es-CL')}`);
    const busy = render({ ...props, order, business: true, expanded: true, isUpdating: true });
    expect(elements(busy).some((node) => node.type === 'button' && node.props.disabled === true)).toBe(true);
  });

  it('toggles the card body in both directions and preserves read tracking', () => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const bodyEvent = () => ({ target: { closest: () => null }, currentTarget: { classList: { remove: vi.fn() } } });
    let view = render({ ...props, order, business: true });
    (view.props.onClick as (event: unknown) => void)(bodyEvent());
    view = render({ ...props, order, business: true });
    expect(elements(view).some((node) => node.type === OrderCardDisclosure)).toBe(false);
    (view.props.onClick as (event: unknown) => void)(bodyEvent());
    expect(elements(render({ ...props, order, business: true })).some((node) => node.type === OrderCardDisclosure)).toBe(true);
    expect(props.onOpen).toHaveBeenCalledTimes(2);
    expect(props.onAccept).not.toHaveBeenCalled();
  });

  it.each(['button', 'a', '[role="dialog"]'])('does not toggle from a nested interactive target (%s)', (selector) => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const onToggle = vi.fn();
    const view = render({ ...props, order, business: true, onToggle });
    const closest = vi.fn((selectors: string) => selectors.includes(selector) ? {} : null);
    (view.props.onClick as (event: unknown) => void)({ target: { closest } });
    expect(onToggle).not.toHaveBeenCalled(); expect(props.onOpen).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' '])('supports keyboard body activation without hijacking child controls (%s)', (key) => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const onToggle = vi.fn();
    const view = render({ ...props, order, business: true, onToggle });
    expect(view.props.tabIndex).toBe(0);
    const currentTarget = { classList: { remove: vi.fn() } };
    const preventDefault = vi.fn();
    const keydown = view.props.onKeyDown as (event: unknown) => void;
    keydown({ key, target: {}, currentTarget, preventDefault });
    expect(onToggle).not.toHaveBeenCalled();
    keydown({ key: 'Escape', target: currentTarget, currentTarget, preventDefault });
    expect(onToggle).not.toHaveBeenCalled();
    keydown({ key, target: currentTarget, currentTarget, preventDefault });
    expect(onToggle).toHaveBeenCalledOnce(); expect(props.onOpen).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it.each([true, false])('restores the correct profile and unread label in the compact card (business=%s)', (business) => {
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0]
      : normalizeMyOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const view = render({ ...props, order, business, isUnread: true });
    const header = elements(view).find((node) => node.type === (business ? BusinessOrderHeader : CustomerOrderHeader))!;
    expect(header.props.image).toBe(business ? raw.customerImage : raw.businessImage);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('Nueva'); expect(html).toContain('zipco-open-panel');
    expect(html).not.toContain('Imagen adjunta'); expect(html).not.toContain('Cancelar pedido');
  });

  it('expands and collapses locally, marking the interaction read without dispatching an action', () => {
    const order = normalizeMyOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    let view = render({ ...props, order });
    const disclosure = elements(view).find((node) => node.type === OrderCardDisclosure)!;
    (disclosure.props.onOpen as () => void)();
    view = render({ ...props, order });
    expect(elements(view).some((node) => node.type === OrderReferencePhoto)).toBe(true);
    const collapse = elements(view).find((node) => node.type === 'button' && node.props['aria-expanded'] === true)!;
    (collapse.props.onClick as (event: unknown) => void)(event());
    expect(elements(render({ ...props, order })).some((node) => node.type === OrderCardDisclosure)).toBe(true);
    expect(props.onOpen).toHaveBeenCalledTimes(2); expect(props.onAccept).not.toHaveBeenCalled();
  });

  it('uses the existing controlled business expansion and keeps acceptance as its only action', () => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const onToggle = vi.fn();
    const compact = render({ ...props, order, business: true, expanded: false, onToggle });
    const disclosure = elements(compact).find((node) => node.type === OrderCardDisclosure)!;
    (disclosure.props.onOpen as () => void)(); expect(onToggle).toHaveBeenCalledOnce();
    const view = render({ ...props, order, business: true, expanded: true, onToggle });
    const accept = elements(view).find((node) => node.type === 'button' && node.props.disabled === false)!;
    (accept.props.onClick as (event: unknown) => void)(event()); expect(props.onAccept).toHaveBeenCalledOnce();
    expect(renderToStaticMarkup(view)).not.toMatch(/Rechazar pedido|Proponer alternativa|Marcar como listo|WhatsApp/);
    expect(elements(render({ ...props, order, business: true, expanded: true, isUpdating: true, onToggle })).some((node) => node.props.disabled === true)).toBe(true);
  });

  it.each([true, false])('uses agreement snapshots in the header and detail after acceptance (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0]
      : normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const view = render({ ...props, order, business, expanded: true });
    const header = elements(view).find((node) => node.type === (business ? BusinessOrderHeader : CustomerOrderHeader))!;
    expect(header.props.products).toMatchObject({ items: [{ name: 'Producto acordado' }] });
    const html = renderToStaticMarkup(view);
    for (const text of ['Coordinación pendiente', 'Condiciones aceptadas', 'Nota acordada', 'Imagen adjunta']) expect(html).toContain(text);
    for (const text of ['Nota de prueba', 'Producto de prueba', 'Preparación', 'Marcar como listo']) expect(html).not.toContain(text);
    const panel = elements(view).find((node) => node.type === AcceptedConditionsPanel)!;
    expect(panel.props.state).toBe(hooks.agreement);
  });

  it('retries an agreement error even while the card is collapsed', () => {
    hooks.agreement = { status: 'error', message: 'Error recuperable' };
    const order = normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const view = render({ ...props, order });
    expect(renderToStaticMarkup(view)).toContain('Error recuperable');
    const retry = elements(view).find((node) => node.type === 'button' && node.props.className?.toString().includes('rounded-xl border'))!;
    (retry.props.onClick as (event: unknown) => void)(event()); expect(hooks.retry).toHaveBeenCalledOnce();
  });

  it('keeps refreshing unknown and malformed processes without enabling acceptance', () => {
    for (const requestProcess of [{}, { ...pendingProcess, state: 'UNKNOWN' }, { ...pendingProcess, allowedActions: [] }]) {
      const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess }])[0];
      const html = renderToStaticMarkup(render({ ...props, order, business: true, expanded: true }));
      expect(html).not.toContain('Aceptar pedido'); expect(html).not.toContain('Rechazar pedido');
      if (!order.requestProcess || order.requestProcess.state === 'UNKNOWN') expect(html).toContain('Actualizar pedido');
    }
  });

  it('passes only the agreement reference to the shared viewer, never a profile or stale list photo', () => {
    const content = AgreementContent({ state: { status: 'loaded', agreement: agreementFixture }, retry: vi.fn() });
    const photo = elements(content).find((node) => node.type === OrderReferencePhoto)!;
    expect(photo.props.src).toBe(agreementFixture.subjectSnapshot.referencePhoto);
    expect(photo.props.src).not.toBe(raw.customerImage); expect(photo.props.src).not.toBe(raw.referencePhoto);
  });

  it('opens and closes the extracted reference viewer without propagating to the parent card', () => {
    const src = agreementFixture.subjectSnapshot.referencePhoto;
    const viewer = () => { hooks.cursor = 0; return OrderReferencePhoto({ src }); };
    let view = viewer();
    const open = elements(view).find((node) => node.type === 'button')!;
    const openEvent = event(); (open.props.onClick as (event: unknown) => void)(openEvent);
    expect(openEvent.stopPropagation).toHaveBeenCalledOnce();
    view = viewer();
    expect(elements(view).some((node) => node.props.src === src && node.props.alt === 'Foto de referencia')).toBe(true);
    const close = elements(view).find((node) => node.props['aria-label'] === 'Cerrar imagen')!;
    (close.props.onClick as (event: unknown) => void)(event());
    expect(elements(viewer()).some((node) => node.props.role === 'dialog')).toBe(false);
  });
});
