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
vi.mock('../../notifications/unreadInteractions', async original => ({
  ...await original<typeof import('../../notifications/unreadInteractions')>(), markInteractionRead: vi.fn(),
}));
import ProcessOrderCard from './ProcessOrderCard';
import AcceptGlassButton from './AcceptGlassButton';
import ProcessHistoryCard from './ProcessHistoryCard';
import CoordinationActions from './CoordinationActions';
import BusinessCoordinationCard from './BusinessCoordinationCard';
import PendingCancellationActions from './PendingCancellationActions';
import PendingRejectionActions from './PendingRejectionActions';
import ProposalNegotiation from './ProposalNegotiation';
import { rejectPendingOrder, rejectedPendingOrder } from './pendingRejectionFixtures';
import { cancelPendingOrder, cancelledPendingOrder } from './pendingCancellationFixtures';
import OrderReferencePhoto from './OrderReferencePhoto';
import { OrderCardDisclosure } from './OrderCardPanels';
import { CustomerOrderHeader } from './OrderCardHeaders';
import { AuroraProposalHeader } from './OrderCardAurora';
import { AcceptedConditionsPanel, AgreementContent } from './AcceptedConditions';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { agreementFixture, coordinationProcess, pendingProcess, rawOrder } from './requestProcessFixtures';

type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function elements(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    const view = child as Node;
    return [view, ...elements(view.props.children), ...elements(view.props.agreementDetails as React.ReactNode)];
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
  it('folds pending business responses without unmounting them, keeps their order and never submits on disclosure', () => {
    const order = normalizeBusinessOrdersPayload([{ ...rejectPendingOrder, requestProcess: {
      ...rejectPendingOrder.requestProcess, allowedActions: [...rejectPendingOrder.requestProcess.allowedActions, 'PROPOSE_ALTERNATIVE'],
    } }])[0];
    const responses = (view: React.ReactNode) => elements(view).find(node => node.props.className === 'zipco-pending-business-responses')!;
    const folded = render({ ...props, order, business: true });
    expect(responses(folded).props).toMatchObject({ 'data-expanded': false, 'aria-hidden': true, inert: '' });
    const retained = elements(responses(folded)).filter(node => node.type === ProposalNegotiation || node.type === PendingRejectionActions);
    expect(retained).toHaveLength(2);
    (elements(folded).find(node => node.type === OrderCardDisclosure)!.props.onOpen as () => void)();
    const expanded = render({ ...props, order, business: true });
    expect(responses(expanded).props).toMatchObject({ 'data-expanded': true, 'aria-hidden': false });
    expect(responses(expanded).props.inert).toBeUndefined();
    const nodes = elements(expanded);
    const hide = nodes.find(node => node.props.className === 'zipco-hide-order-detail')!;
    const orderOf = [AcceptGlassButton, ProposalNegotiation, PendingRejectionActions].map(type => nodes.findIndex(node => node.type === type));
    expect(orderOf[0]).toBeLessThan(orderOf[1]); expect(orderOf[1]).toBeLessThan(orderOf[2]); expect(orderOf[2]).toBeLessThan(nodes.indexOf(hide));
    (hide.props.onClick as (e: unknown) => void)(event());
    const closed = render({ ...props, order, business: true });
    expect(responses(closed).props).toMatchObject({ 'data-expanded': false, 'aria-hidden': true, inert: '' });
    expect(elements(responses(closed)).filter(node => node.type === ProposalNegotiation || node.type === PendingRejectionActions).map(node => node.key))
      .toEqual(retained.map(node => node.key));
    expect(props.onAccept).not.toHaveBeenCalled(); expect(props.onRetry).not.toHaveBeenCalled();
  });
  it('renders valid Backend 772b78a pending business actions without the guard card', () => {
    const order = normalizeBusinessOrdersPayload([rejectPendingOrder])[0];
    const view = render({ ...props, order, business: true, expanded: true, onToggle: vi.fn() });
    expect(elements(view).find(node => node.type === PendingRejectionActions)?.props.order).toBe(order);
    const accept = elements(view).find(node => node.type === AcceptGlassButton)!;
    expect(accept).toBeDefined(); (accept.props.onClick as (e: unknown) => void)(event()); expect(props.onAccept).toHaveBeenCalledOnce();
    expect(elements(view).some(node => node.props.children === 'Actualizar pedido')).toBe(false);
    expect(elements(render({ ...props, order, business: false })).some(node => node.type === PendingRejectionActions)).toBe(false);
  });

  it.each([false, true])('shows rejected original request and escaped reason without agreement (business=%s)', business => {
    const input = { ...rejectedPendingOrder, requestProcess: { ...rejectedPendingOrder.requestProcess, closure: {
      ...rejectedPendingOrder.requestProcess.closure, reasonCode: 'other', reasonDetail: '<script>synthetic</script>',
    } } };
    const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
    const history = () => { hooks.cursor = 0; return ProcessHistoryCard({ order }); };
    const view = history(); expect(renderToStaticMarkup(view)).toContain('Rechazada');
    expect(renderToStaticMarkup(view)).toContain('Otro motivo');
    (elements(view).find(node => node.type === 'button')!.props.onClick as () => void)();
    const html = renderToStaticMarkup(history());
    expect(html).toContain('Solicitud original'); expect(html).toContain('Nota de prueba');
    expect(html).toContain('&lt;script&gt;synthetic&lt;/script&gt;');
    expect(html).not.toContain('Condiciones aceptadas'); expect(html).not.toContain('Abrir acuerdo');
  });
  it('mounts pending cancellation only on the customer card, independently of its disclosure', () => {
    const order = normalizeMyOrdersPayload([cancelPendingOrder])[0];
    for (const expanded of [false, true]) {
      expect(elements(render({ ...props, order, business: false, expanded, onToggle: vi.fn() }))
        .some(node => node.type === PendingCancellationActions)).toBe(true);
      expect(elements(render({ ...props, order, business: true, expanded, onToggle: vi.fn() }))
        .some(node => node.type === PendingCancellationActions)).toBe(false);
    }
  });

  it.each([false, true])('keeps original cancelled request details in history without an agreement (business=%s)', business => {
    const order = business ? normalizeBusinessOrdersPayload([cancelledPendingOrder])[0] : normalizeMyOrdersPayload([cancelledPendingOrder])[0];
    const history = () => { hooks.cursor = 0; return ProcessHistoryCard({ order }); };
    const view = history();
    expect(renderToStaticMarkup(view)).toContain('Anulada por el cliente');
    const open = elements(view).find(node => node.type === 'button')!;
    expect(open.props.children).toBe('Ver solicitud');
    (open.props.onClick as () => void)();
    const expanded = history();
    expect(elements(expanded).some(node => node.type === AcceptedConditionsPanel)).toBe(false);
    const html = renderToStaticMarkup(expanded);
    expect(html).toContain('Solicitud original'); expect(html).toContain('Producto de prueba'); expect(html).toContain('Nota de prueba');
    expect(html).not.toContain('Condiciones aceptadas'); expect(html).not.toContain('Abrir acuerdo');
  });
  it.each(['COORDINATION_PENDING', 'COORDINATING', 'IN_PROGRESS', 'READY'])('compacts business %s agreement without repeating its title or total and keeps actions accessible', (state) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = normalizeBusinessOrdersPayload([{ ...raw, status: state === 'READY' ? 'ready' : 'accepted', requestProcess: { ...coordinationProcess, state } }])[0];
    const view = render({ ...props, order, business: true, expanded: true, onToggle: vi.fn() });
    const nodes = elements(view);
    const summary = nodes.find((node) => node.type === 'section' && node.props['aria-label'] === 'Condiciones aceptadas')!;
    const panel = elements(summary).find((node) => node.type === AcceptedConditionsPanel)!;
    expect(panel.props).toMatchObject({ business: true, embedded: true, state: hooks.agreement });
    const html = renderToStaticMarkup(view);
    expect(html.match(/Condiciones aceptadas/g)).toHaveLength(2); // Region label and the single disclosure title.
    expect(html).not.toContain('>Total:<');
    expect(html.toLowerCase()).toContain('acordado');
    for (const text of ['Producto acordado', 'Descripción acordada', 'Subtotal', 'Fecha y hora:', 'Nota acordada', 'Imagen adjunta', 'El cliente agregó una foto de referencia.', 'Abrir acuerdo']) expect(html).toContain(text);
    expect(html).not.toContain('Agregaste una foto de referencia.');
    expect(html).not.toContain(raw.note); expect(html).not.toContain(raw.referencePhoto);
    if (view.type === BusinessCoordinationCard) expect(view.props.accepted).toBe(agreementFixture);
    else expect(nodes.indexOf(panel)).toBeLessThan(nodes.findIndex((node) => node.type === CoordinationActions));
    const compact = elements(render({ ...props, order, business: true, expanded: false, onToggle: vi.fn() }));
    expect(compact.some((node) => node.type === AcceptedConditionsPanel)).toBe(false);
    expect(compact.find((node) => node.type === CoordinationActions || node.type === BusinessCoordinationCard)?.props.order).toBe(order);
  });
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
  it.each([true, false])('never labels the old request total as agreed while a history agreement is unavailable (business=%s)', business => {
    const input = { ...raw, status: 'completed', requestProcess: { ...coordinationProcess, state: 'COMPLETED', allowedActions: [] } };
    const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
    hooks.agreement = { status: 'absent' }; hooks.cursor = 0;
    let header = elements(ProcessHistoryCard({ order })).find(node => node.type === AuroraProposalHeader)!;
    expect(header.props.price).toBeNull();
    hooks.agreement = { status: 'loaded', agreement: { ...agreementFixture, totalPriceClp: 3500 } }; hooks.cursor = 0;
    header = elements(ProcessHistoryCard({ order })).find(node => node.type === AuroraProposalHeader)!;
    expect(header.props.price).toBe(3500); expect(header.props.items).toMatchObject([{ name: 'Producto acordado' }]);
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
    const header = elements(view).find((node) => node.type === AuroraProposalHeader)!;
    expect(header.props.items).toMatchObject([{ name: 'Producto acordado' }]);
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
  it.each([false,true])('keeps the shared coordination card mounted when opening and hiding accepted conditions (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const input = { ...raw, status: 'accepted', requestProcess: coordinationProcess };
    const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
    const compact = render({ ...props, order, business });
    expect(compact.type).toBe(BusinessCoordinationCard); expect(compact.props.business).toBe(business);
    const key=compact.key;
    (compact.props.onOpenAgreement as () => void)();
    const expanded = render({ ...props, order, business });
    expect(expanded.type).toBe(BusinessCoordinationCard); expect(expanded.key).toBe(key);
    const nodes = elements(expanded);
    const panel = nodes.find((node) => node.type === AcceptedConditionsPanel)!;
    expect(panel.props.embedded).toBe(true); expect(panel.props.state).toBe(hooks.agreement);
    expect(elements(nodes.find((node) => node.type === 'section')!).some((node) => node.type === AcceptedConditionsPanel && node.props.embedded === true)).toBe(true);
    (nodes.find((node) => node.type === 'button' && node.props.children === 'Ocultar condiciones')!.props.onClick as (event:unknown) => void)(event());
    const closedView = render({ ...props, order, business });
    const closed = elements(closedView);
    expect(closed.some((node) => node.type === AcceptedConditionsPanel)).toBe(false);
    expect(closedView.type).toBe(BusinessCoordinationCard);expect(closedView.key).toBe(key);
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
  it.each([true, false])('shows the accepted total once above the conditions for both participants (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0]
      : normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const view = render({ ...props, order, business });
    if (view.type === BusinessCoordinationCard) {
      expect(view.type).toBe(BusinessCoordinationCard);
      expect(view.props.price).toBe(agreementFixture.totalPriceClp);
      expect(view.props.accepted).toBe(agreementFixture);
      expect(view.props.conditionsTitle).toContain('Producto acordado');
      return;
    }
    const disclosure = elements(view).find((node) => node.type === OrderCardDisclosure)!;
    expect(disclosure.props.acceptedSummary).toBe(true);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('Acordado');
    expect(html.match(/\$2\.000/g)).toHaveLength(1);
    expect(disclosure.props.price).toBeNull();
  });
  it.each([false, true])('shows the customer total once with its status in the Aurora header (accepted=%s)', (accepted) => {
    hooks.agreement = accepted ? { status: 'loaded', agreement: agreementFixture } : { status: 'absent' };
    const order = normalizeMyOrdersPayload([{ ...raw, status: accepted ? 'accepted' : 'pending', requestProcess: accepted ? coordinationProcess : pendingProcess }])[0];
    const view = render({ ...props, order });
    if(accepted){
      expect(view.type).toBe(BusinessCoordinationCard);expect(view.props.business).toBe(false);
      expect(view.props.price).toBe(agreementFixture.totalPriceClp);expect(view.props.statusLabel).toBe('Coordinación pendiente');
      return;
    }
    const header = elements(view).find((node) => node.type === AuroraProposalHeader)!;
    expect(header.props.priceLabel).toBe(accepted ? 'Acordado' : 'Solicitado');
    const headerHtml = renderToStaticMarkup(header);
    expect(headerHtml).toContain(accepted ? 'Coordinación pendiente' : 'Pendiente de respuesta');
    expect(headerHtml).toContain('$2.000');
    const html = renderToStaticMarkup(view);
    expect(html.match(/\$2\.000/g)).toHaveLength(1);
    expect(elements(view).find((node) => node.type === OrderCardDisclosure)?.props.price).toBeNull();
  });
  it('preserves the historical customer header price when no corner status is requested', () => {
    const html = renderToStaticMarkup(React.createElement(CustomerOrderHeader, { name: raw.businessName, image: raw.businessImage,
      products: { state: 'available', items: [] }, total: 2000, status: React.createElement('span', null, 'Estado histórico') }));
    expect(html).toContain('$2.000'); expect(html).toContain('Estado histórico');
  });
  it.each([true, false])('uses participant-specific pending labels and photo context (business=%s)', (business) => {
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0]
      : normalizeMyOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const compact = render({ ...props, order, business });
    const disclosure = elements(compact).find((node) => node.type === OrderCardDisclosure)!;
    expect(disclosure.props.title).toBe(business ? 'Pedido del cliente' : 'Tu pedido');
    expect(disclosure.props.hint).toBe(business ? 'Revisar y responder' : 'Revisar pedido');
    const expanded = render({ ...props, order, business, expanded: true, onToggle: vi.fn() });
    expect(elements(expanded).find((node) => node.type === OrderReferencePhoto)?.props.business).toBe(business);
  });

  it('routes business coordination through the O card and opens the immutable full detail without replacing its identity', () => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    let view = render({ ...props, order, business: true });
    expect(view.type).toBe(BusinessCoordinationCard);
    const identity = view.key;
    expect(view.props.price).toBe(agreementFixture.totalPriceClp);
    expect(elements(view).some((node) => node.type === AcceptedConditionsPanel)).toBe(false);
    (view.props.onOpenAgreement as () => void)();
    view = render({ ...props, order, business: true });
    expect(view.type).toBe(BusinessCoordinationCard); expect(view.key).toBe(identity);
    expect(elements(view).find(node=>node.type===AcceptedConditionsPanel)?.props.state).toBe(hooks.agreement);
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
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const view = render({ ...props, order, business: true, isUnread });
    const header = elements(view).find((node) => node.type === AuroraProposalHeader)!;
    expect(header.props.statusLabel).toBe('Nuevo pedido');
    expect(header.props.isUnread).toBe(isUnread);
    expect(props.onOpen).not.toHaveBeenCalled();
    expect(order.requestProcess?.state).toBe('AWAITING_BUSINESS_RESPONSE');
  });

  it('shows the actual formatted total on the accept button and keeps the busy lock', () => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, total: 123456, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const html = renderToStaticMarkup(render({ ...props, order, business: true, expanded: true }));
    expect(html).toContain(`aria-label="Aceptar pedido por $${order.total.toLocaleString('es-CL')}"`);
    const busy = render({ ...props, order, business: true, expanded: true, isUpdating: true });
    expect(elements(busy).find((node) => node.type === AcceptGlassButton)?.props).toMatchObject({ disabled: true, label: 'Guardando…', price: null });
  });

  it('toggles the card body in both directions and preserves read tracking', () => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
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
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const onToggle = vi.fn();
    const view = render({ ...props, order, business: true, onToggle });
    const closest = vi.fn((selectors: string) => selectors.includes(selector) ? {} : null);
    (view.props.onClick as (event: unknown) => void)({ target: { closest } });
    expect(onToggle).not.toHaveBeenCalled(); expect(props.onOpen).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' '])('supports keyboard body activation without hijacking child controls (%s)', (key) => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
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
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0]
      : normalizeMyOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const view = render({ ...props, order, business, isUnread: true });
    const header = elements(view).find((node) => node.type === AuroraProposalHeader)!;
    expect(header.props.image).toBe(business ? raw.customerImage : raw.businessImage);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('Nueva'); expect(html).toContain('zipco-open-panel');
    if (business) expect(elements(view).find(node => node.props.className === 'zipco-pending-business-responses')?.props)
      .toMatchObject({ 'aria-hidden': true, inert: '' });
    else expect(html).not.toContain('Imagen adjunta');
    expect(html).not.toContain('Cancelar pedido');
  });

  it('expands and collapses locally, marking the interaction read without dispatching an action', () => {
    const order = normalizeMyOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
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

  it('uses the existing controlled business expansion and retains acceptance with local alternative preparation', () => {
    const order = normalizeBusinessOrdersPayload([{ ...raw, requestProcess: { ...pendingProcess, allowedActions: [...pendingProcess.allowedActions, 'PROPOSE_ALTERNATIVE'] } }])[0];
    const onToggle = vi.fn();
    const compact = render({ ...props, order, business: true, expanded: false, onToggle });
    const disclosure = elements(compact).find((node) => node.type === OrderCardDisclosure)!;
    (disclosure.props.onOpen as () => void)(); expect(onToggle).toHaveBeenCalledOnce();
    const view = render({ ...props, order, business: true, expanded: true, onToggle });
    const accept = elements(view).find((node) => node.type === AcceptGlassButton && node.props.disabled === false)!;
    (accept.props.onClick as (event: unknown) => void)(event()); expect(props.onAccept).toHaveBeenCalledOnce();
    expect(renderToStaticMarkup(view)).toContain('Proponer alternativa');
    expect(renderToStaticMarkup(view)).not.toMatch(/Rechazar pedido|Marcar como listo|WhatsApp/);
    expect(elements(render({ ...props, order, business: true, expanded: true, isUpdating: true, onToggle })).some((node) => node.props.disabled === true)).toBe(true);
  });

  it.each([true, false])('uses agreement snapshots in the header and detail after acceptance (business=%s)', (business) => {
    hooks.agreement = { status: 'loaded', agreement: agreementFixture };
    const order = business ? normalizeBusinessOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0]
      : normalizeMyOrdersPayload([{ ...raw, status: 'accepted', requestProcess: coordinationProcess }])[0];
    const view = render({ ...props, order, business, expanded: true });
    expect(view.props.conditionsTitle).toContain('Producto acordado');
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
