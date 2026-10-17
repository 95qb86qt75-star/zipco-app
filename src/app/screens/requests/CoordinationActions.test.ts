import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, run: vi.fn(), retry: vi.fn(), busy: false,
  needsUpdate: false, warning: '', update: vi.fn() }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useState: (initial: unknown) => {
    const index = hooks.cursor++; if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [hooks.slots[index], (value: unknown) => { hooks.slots[index] = value; }];
  },
}));
vi.mock('./useCoordination', () => ({ default: () => ({ run: hooks.run, retry: hooks.retry, busy: hooks.busy, message: '', pending: () => null,
  needsUpdate: hooks.needsUpdate, restored: () => false, storageWarning: () => hooks.warning, update: hooks.update }) }));
import CoordinationActions from './CoordinationActions';
import { normalizeBusinessOrdersPayload, normalizeMyOrdersPayload } from './orderNormalization';
import { rawOrder, coordinationProcess } from './requestProcessFixtures';
type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function nodes(root: React.ReactNode): Node[] {
  return React.Children.toArray(root).flatMap((child) => React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
}
const raw = { ...rawOrder, status: 'accepted', customerName: 'Cliente de prueba', businessName: 'Negocio de prueba', requestProcess: {
  ...coordinationProcess, coordination: { customerContactAuthorized: false, businessContactAuthorized: false },
  allowedActions: ['AUTHORIZE_CONTACT', 'OPEN_WHATSAPP', 'START_WORK', 'ANNUL_COORDINATION'],
} };
const render = (business: boolean, service = false, input = raw) => {
  hooks.cursor = 0;
  const order = business ? normalizeBusinessOrdersPayload([input])[0] : normalizeMyOrdersPayload([input])[0];
  return CoordinationActions({ order, business, service, refresh: vi.fn() });
};
const click = (view: React.ReactNode, text: string) => {
  const button = nodes(view).find((node) => node.type === 'button' && renderToStaticMarkup(node).includes(text))!;
  return (button.props.onClick as () => unknown)();
};
beforeEach(() => { hooks.slots = []; hooks.cursor = 0; hooks.busy = false; hooks.needsUpdate = false; hooks.warning = '';
  hooks.update.mockReset(); hooks.run.mockReset().mockResolvedValue(true); vi.stubGlobal('React', React); });
afterEach(() => vi.unstubAllGlobals());
describe('coordination presentation and deliberate consent', () => {
  it('explains missing customer consent only to the business when explicitly false', () => {
    const message = 'Esperando autorización de contacto del cliente.';
    expect(renderToStaticMarkup(render(true))).toContain(message);
    expect(renderToStaticMarkup(render(false))).not.toContain(message);
    for (const coordination of [undefined, { customerContactAuthorized: true, businessContactAuthorized: false }]) {
      const input = { ...raw, requestProcess: { ...raw.requestProcess, coordination } };
      expect(renderToStaticMarkup(render(true, false, input))).not.toContain(message);
    }
    expect(hooks.run).not.toHaveBeenCalled();
  });
  it('shows approved customer copy and Ahora no dispatches nothing', () => {
    let view = render(false);
    expect(renderToStaticMarkup(view)).toContain('¿Autorizas compartir con Negocio de prueba el teléfono de tu perfil');
    click(view, 'Ahora no'); view = render(false);
    expect(renderToStaticMarkup(view)).not.toContain('Autorizar contacto para este pedido');
    expect(hooks.run).not.toHaveBeenCalled();
    click(view, 'Revisar autorización de contacto');
    click(render(false), 'Autorizo iniciar coordinación');
    expect(hooks.run).toHaveBeenCalledWith('AUTHORIZE_CONTACT', 'COORDINATION_NOT_REACHED', '');
  });
  it('keeps the glass authorization button exclusive to allowed customer consent', () => {
    const html = renderToStaticMarkup(render(false));
    expect(html).toContain('zipco-contact-consent'); expect(html).toContain('Autorizo iniciar coordinación');
    expect(html).toContain('Solo para este pedido y este negocio.');
    expect(html).not.toContain('Tu número estará protegido');
    expect(renderToStaticMarkup(render(true))).not.toContain('Autorizo iniciar coordinación');
    expect(renderToStaticMarkup(render(false, false, { ...raw, requestProcess: { ...raw.requestProcess, allowedActions: [] } })))
      .not.toContain('Autorizo iniciar coordinación');
    expect(hooks.run).not.toHaveBeenCalled();
  });
  it('authorizes only on deliberate click, never opens WhatsApp or starts work from the new label', () => {
    const view = render(false); expect(hooks.run).not.toHaveBeenCalled();
    click(view, 'Autorizo iniciar coordinación');
    expect(hooks.run).toHaveBeenCalledOnce();
    expect(hooks.run).toHaveBeenCalledWith('AUTHORIZE_CONTACT', 'COORDINATION_NOT_REACHED', '');
  });
  it('keeps the new authorization button disabled while an operation is in progress', () => {
    hooks.busy = true;
    const view = render(false);
    const button = nodes(view).find((node) => node.type === 'button' && node.props.className === 'zipco-contact-consent')!;
    expect(button.props.disabled).toBe(true);
  });
  it.each([false, true])('keeps both transparent customer controls and their busy lock (busy=%s)', (busy) => {
    hooks.busy = busy;
    const view = render(false);
    const buttons = nodes(view).filter((node) => node.type === 'button' && node.props.className?.toString().includes('zipco-coordination-glass'));
    expect(buttons).toHaveLength(2);
    expect(buttons.every((node) => node.props.disabled === busy)).toBe(true);
    expect(renderToStaticMarkup(view)).toContain('zipco-coordination-glass-danger');
    expect(renderToStaticMarkup(render(true))).not.toContain('zipco-coordination-glass');
    expect(hooks.run).not.toHaveBeenCalled();
  });
  it.each([true, false])('requires the business confirmation before sharing (service=%s)', (service) => {
    let view = render(true, service); click(view, 'Coordinar por WhatsApp');
    expect(hooks.run).not.toHaveBeenCalled(); view = render(true, service);
    const html = renderToStaticMarkup(view);
    expect(html).toContain(service ? 'la realización del servicio' : 'la entrega');
    expect(html).toContain('Compartirás con Cliente de prueba el teléfono de tu perfil');
    expect(html).toContain('ZIPCO no procesa ni verifica pagos.');
    click(view, 'Continuar a WhatsApp'); expect(hooks.run).toHaveBeenCalledWith('OPEN_WHATSAPP', 'COORDINATION_NOT_REACHED', '');
  });
  it('never presents business start to the customer or later legacy actions', () => {
    expect(renderToStaticMarkup(render(false))).not.toContain('comenzar pedido');
    const html = renderToStaticMarkup(render(true));
    expect(html).toContain('Coordinación lista — comenzar pedido');
    expect(html).not.toMatch(/Proponer alternativa|Rechazar pedido|Marcar como listo|Confirmar recepción/);
  });
  it('offers annulment reasons and requires trimmed Other details', () => {
    click(render(false), 'Anular solicitud'); let view = render(false);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('No logramos coordinar los detalles.'); expect(html).toContain('La otra parte no responde.');
    const select = nodes(view).find((node) => node.type === 'select')!;
    (select.props.onChange as (event: unknown) => void)({ target: { value: 'OTHER' } }); view = render(false);
    const textarea = nodes(view).find((node) => node.type === 'textarea')!;
    expect(textarea.props.maxLength).toBe(1000); expect(textarea.props.required).toBe(true);
    expect(nodes(view).find((node) => node.type === 'button' && node.props.type === 'submit')?.props.disabled).toBe(true);
    (textarea.props.onChange as (event: unknown) => void)({ target: { value: 'Motivo de prueba' } }); view = render(false);
    const form = nodes(view).find((node) => node.type === 'form')!;
    (form.props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn() });
    expect(hooks.run).toHaveBeenCalledWith('ANNUL_COORDINATION', 'OTHER', 'Motivo de prueba');
  });
  it('hides annulment during work and disables controls while updating', () => {
    hooks.busy = true;
    const view = render(true, false, { ...raw, requestProcess: { ...raw.requestProcess, state: 'IN_PROGRESS' } });
    expect(renderToStaticMarkup(view)).not.toContain('Anular solicitud');
    expect(nodes(view).filter((node) => node.type === 'button').every((node) => node.props.disabled)).toBe(true);
  });
  it.each(['reload', 'storage'])('offers only read-only recovery after confirmed success (%s)', (failure) => {
    hooks.needsUpdate = failure === 'reload'; hooks.warning = failure === 'storage' ? 'No se pudo limpiar el almacenamiento.' : '';
    const view = render(true); const html = renderToStaticMarkup(view);
    expect(html).toContain('Actualizar estado');
    expect(html).not.toContain('Coordinar por WhatsApp'); expect(html).not.toContain('comenzar pedido');
    click(view, 'Actualizar estado'); expect(hooks.update).toHaveBeenCalledOnce();
    expect(hooks.run).not.toHaveBeenCalled();
  });
});
