import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, agreement: null as unknown, retry: vi.fn() }));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useEffect: () => undefined,
  useRef: (current: unknown) => ({ current }),
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[index], (next: unknown) => {
      hooks.slots[index] = typeof next === 'function' ? next(hooks.slots[index]) : next;
    }];
  },
}));
vi.mock('react-dom', async (original) => ({ ...await original<typeof import('react-dom')>(), createPortal: (children: React.ReactNode) => children }));
vi.mock('./useAgreement', () => ({ default: () => ({ state: hooks.agreement, retry: hooks.retry }) }));
import ProcessOrderCard from './ProcessOrderCard';
import ProcessHistoryCard from './ProcessHistoryCard';
import CoordinationActions from './CoordinationActions';
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
  it.each([true, false])('keeps the immutable agreement accessible in completed history (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const input = { ...raw, status: 'completed', requestProcess: { ...coordinationProcess, state: 'COMPLETED', version: 4,
      readyNoticeAcknowledged: true, allowedActions: [] } };
    const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
    hooks.slots = [true]; hooks.cursor = 0;
    const html = renderToStaticMarkup(ProcessHistoryCard({ order }));
    for (const text of ['Completado', 'Condiciones aceptadas', 'Producto acordado', 'Nota acordada', 'Abrir acuerdo']) expect(html).toContain(text);
    expect(html).not.toMatch(/Nota de prueba|Confirmar recepción|Coordinar por WhatsApp|reseña|pago realizado/);
  });
  it.each([true, false])('presents acknowledged READY as pending pickup without hiding its agreement (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const input = { ...raw, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY', version: 3,
      readyNoticeAcknowledged: true, allowedActions: ['CONFIRM_RECEIPT'] } };
    const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
    const html = renderToStaticMarkup(render({ ...props, order, business, expanded: true }));
    expect(html).toContain('Pendiente de retiro'); expect(html).toContain('Nota acordada');
    expect(html).not.toContain('Completado');
  });
  it.each([true, false])('retains immutable agreement and ready status in each participant view (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const input = { ...raw, status: 'ready', requestProcess: { ...coordinationProcess, state: 'READY', version: 3 } };
    const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
    const view = render({ ...props, order, business, expanded: true });
    const html = renderToStaticMarkup(view);
    expect(html).toContain('Pedido listo'); expect(html).toContain('Nota acordada');
    expect(html).not.toContain('Nota de prueba'); expect(html).not.toContain('Confirmar entrega');
    const header = elements(view).find((node) => node.type === (business ? BusinessOrderHeader : CustomerOrderHeader))!;
    expect(header.props.products).toMatchObject({ items: [{ name: 'Producto acordado' }] });
    expect(elements(view).find((node) => node.type === AcceptedConditionsPanel)?.props.returnView).toBe('ready');
  });
  it.each([true, false])('carries the displayed process category into the agreement link (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    for (const [state, viewName] of [['COORDINATION_PENDING', 'coordination'], ['COORDINATING', 'coordination'], ['IN_PROGRESS', 'active'], ['READY', 'ready']]) {
      const input = { ...raw, status: 'accepted', requestProcess: { ...coordinationProcess, state } };
      const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
      const view = render({ ...props, order, business, expanded: true, onToggle: vi.fn() });
      const panel = elements(view).find((node) => node.type === AcceptedConditionsPanel)!;
      expect(panel.props.returnView).toBe(viewName);
      expect(renderToStaticMarkup(panel)).toContain(`participant=${business ? 'business' : 'customer'}&amp;view=${viewName}`);
    }
  });
  it('opens customer conditions inside their summary before consent, retaining mounted actions when closed', () => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const compact = render({ ...props, order });
    const summary = elements(compact).find((node) => node.type === 'section' && node.props['aria-label'] === 'Condiciones aceptadas')!;
    const disclosure = elements(summary).find((node) => node.type === OrderCardDisclosure)!;
    expect(disclosure.props.integrated).toBe(true);
    expect(elements(compact).some((node) => node.type === CoordinationActions)).toBe(true);
    (disclosure.props.onOpen as () => void)();
    const expanded = render({ ...props, order });
    const nodes = elements(expanded);
    const panel = nodes.find((node) => node.type === AcceptedConditionsPanel)!;
    expect(panel.props.embedded).toBe(true); expect(panel.props.state).toBe(hooks.agreement);
    expect(nodes.indexOf(panel)).toBeLessThan(nodes.findIndex((node) => node.type === CoordinationActions));
    expect(elements(nodes.find((node) => node.type === 'section')!).some((node) => node.type === AcceptedConditionsPanel && node.props.embedded === true)).toBe(true);
    (nodes.find((node) => node.type === OrderCardDisclosure)!.props.onOpen as () => void)();
    const closed = elements(render({ ...props, order }));
    expect(closed.some((node) => node.type === AcceptedConditionsPanel)).toBe(false);
    expect(closed.find((node) => node.type === CoordinationActions)?.key).toBe(nodes.find((node) => node.type === CoordinationActions)?.key);
  });
  it('renders compact agreement data and the original photo without a second card or total panel', () => {
    const panel = AcceptedConditionsPanel({ state: { status: 'loaded', agreement: agreementFixture }, retry: vi.fn(), embedded: true });
    expect(panel.type).toBe('div');
    const content = elements(panel).find((node) => node.type === AgreementContent)!;
    expect(content.props.compact).toBe(true);
    const view = AgreementContent({ state: { status: 'loaded', agreement: agreementFixture }, retry: vi.fn(), compact: true });
    expect(elements(view).find((node) => node.type === OrderReferencePhoto)?.props.src).toBe(agreementFixture.subjectSnapshot.referencePhoto);
    const html = renderToStaticMarkup(panel);
    for (const text of ['Producto acordado', 'Descripción acordada', 'Subtotal', 'Fecha y hora:', 'Nota acordada', 'Imagen adjunta', 'Abrir acuerdo']) expect(html).toContain(text);
    expect(html).not.toContain('>Total:<'); expect(html).not.toContain('<h4');
    expect(html).not.toContain(raw.note); expect(html).not.toContain(raw.referencePhoto);
  });
  it.each([true, false])('adds the accepted total caption only in the new customer summary (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0]
      : normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const view = render({ ...props, order, business });
    const disclosure = elements(view).find((node) => node.type === OrderCardDisclosure)!;
    expect(disclosure.props.acceptedSummary).toBe(!business);
    const html = renderToStaticMarkup(disclosure);
    expect(html.includes('Precio total')).toBe(!business);
    expect(html.match(/\$2\.000/g)).toHaveLength(1);
    expect(disclosure.props.price).toBe(agreementFixture.totalPriceClp);
  });
  it.each([false, true])('shows the customer total once, in the disclosure, and status in the header (accepted=%s)', (accepted) => {
    hooks.agreement = accepted ? { status: 'loaded', agreement: agreementFixture } : { status: 'absent' };
    const order = normalizeMyOrdersPayload([{ ...raw, status: accepted ? 'accepted' : 'pending', requestProcess: accepted ? coordinationProcess : pendingProcess }])[0];
    const view = render({ ...props, order });
    const header = elements(view).find((node) => node.type === CustomerOrderHeader)!;
    expect(header.props.statusInCorner).toBe(true);
    const headerHtml = renderToStaticMarkup(header);
    expect(headerHtml).toContain(accepted ? 'Coordinación pendiente' : 'Pendiente de respuesta');
    expect(headerHtml).not.toContain('$');
    const html = renderToStaticMarkup(view);
    expect(html.match(/\$2\.000/g)).toHaveLength(1);
    expect(elements(view).find((node) => node.type === OrderCardDisclosure)?.props.price).toBe(2000);
  });
  it('preserves the historical customer header price when no corner status is requested', () => {
    const html = renderToStaticMarkup(React.createElement(CustomerOrderHeader, { name: raw.businessName, image: raw.businessImage,
      products: { state: 'available', items: [] }, total: 2000, status: React.createElement('span', null, 'Estado histórico') }));
    expect(html).toContain('$2.000'); expect(html).toContain('Estado histórico');
  });
  it.each([true, false])('uses participant-specific pending labels and photo context (business=%s)', (business) => {
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0]
      : normalizeMyOrdersPayload([{ ...raw, requestProcess: pendingProcess }])[0];
    const compact = render({ ...props, order, business });
    const disclosure = elements(compact).find((node) => node.type === OrderCardDisclosure)!;
    expect(disclosure.props.title).toBe(business ? 'Pedido del cliente' : 'Tu pedido');
    expect(disclosure.props.hint).toBe(business ? 'Revisar y responder' : 'Revisar pedido');
    const expanded = render({ ...props, order, business, expanded: true, onToggle: vi.fn() });
    expect(elements(expanded).find((node) => node.type === OrderReferencePhoto)?.props.business).toBe(business);
  });

  it('keeps actions before expanded conditions and mounted independently of the disclosure', () => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    let view = render({ ...props, order, business: true });
    const disclosure = elements(view).find((node) => node.type === OrderCardDisclosure)!;
    expect(disclosure.props.title).toBe('Condiciones aceptadas');
    expect(disclosure.props.price).toBe(agreementFixture.totalPriceClp);
    expect(elements(view).some((node) => node.type === CoordinationActions)).toBe(true);
    expect(elements(view).some((node) => node.type === AcceptedConditionsPanel)).toBe(false);
    (disclosure.props.onOpen as () => void)();
    view = render({ ...props, order, business: true });
    const nodes = elements(view);
    expect(nodes.findIndex((node) => node.type === CoordinationActions)).toBeLessThan(nodes.findIndex((node) => node.type === AcceptedConditionsPanel));
    expect(nodes.find((node) => node.type === OrderCardDisclosure)?.props.expanded).toBe(true);
  });

  it.each([true, false])('uses the approved photo subtitle before and after acceptance (business=%s)', (business) => {
    const expected = business ? 'El cliente agregó una foto de referencia.' : 'Agregaste una foto de referencia.';
    expect(renderToStaticMarkup(React.createElement(OrderReferencePhoto, { src: raw.referencePhoto, business }))).toContain(expected);
    const content = AgreementContent({ state: { status: 'loaded', agreement: agreementFixture }, retry: vi.fn(), business });
    expect(renderToStaticMarkup(content)).toContain(expected);
    expect(elements(content).find((node) => node.type === OrderReferencePhoto)?.props.src).toBe(agreementFixture.subjectSnapshot.referencePhoto);
  });

  it.each(['loading', 'absent', 'error'] as const)('never fills compact conditions from stale list data (%s)', (status) => {
    hooks.agreement = status === 'error' ? { status, message: 'Error recuperable' } : { status };
    const order = normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const compact = render({ ...props, order, business: true });
    expect(elements(compact).find((node) => node.type === OrderCardDisclosure)?.props.price).toBeNull();
    expect(elements(compact).some((node) => node.type === CoordinationActions)).toBe(false);
    const expanded = render({ ...props, order, business: true, expanded: true, onToggle: vi.fn() });
    const html = renderToStaticMarkup(expanded);
    expect(html).not.toContain(raw.note); expect(html).not.toContain(raw.referencePhoto);
    expect(html).not.toContain('Producto de prueba');
    expect(html).toContain(status === 'loading' ? 'Cargando condiciones' : status === 'absent' ? 'Actualiza el pedido' : 'Reintentar');
  });

  it.each([true, false])('propagates photo context through accepted conditions and history links (business=%s)', (business) => {
    const panel = AcceptedConditionsPanel({ state: { status: 'loaded', agreement: agreementFixture }, retry: vi.fn(), business, history: true });
    expect(elements(panel).find((node) => node.type === AgreementContent)?.props.business).toBe(business);
    const html = renderToStaticMarkup(panel);
    expect(html).toContain(business ? 'El cliente agregó una foto de referencia.' : 'Agregaste una foto de referencia.');
    expect(html).toContain(`participant=${business ? 'business' : 'customer'}&amp;volver=historial`);
  });
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
    vi.stubGlobal('document', { body: {} });
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
