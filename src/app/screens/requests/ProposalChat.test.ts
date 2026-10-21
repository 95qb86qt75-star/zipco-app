import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import ProposalChat from './ProposalChat';
import { normalizeProposals } from './proposalContract';
import { proposalsFixture } from './proposalFixtures';

beforeEach(() => { vi.stubGlobal('React', React); });
const read = (sequence = 1) => { const value = proposalsFixture(sequence); return normalizeProposals(value, value.process.id)!; };
const render = (value = read(), business = false, canCounter = true, turn: 'mine' | 'wait' | 'closed' = 'mine') => renderToStaticMarkup(
  React.createElement(ProposalChat, { read: value, business, canCounter, turn, closedText: 'El cliente rechazó la propuesta · Historial' }));

it('keeps ordered immutable snapshots and correct actor labels for both viewers', () => {
  const value = read(3), before = JSON.stringify(value);
  const customer = render(value), business = render(value, true);
  expect(customer.indexOf('Tú pediste')).toBeLessThan(customer.indexOf('El negocio responde'));
  expect(customer.indexOf('Tú contrapropusiste')).toBeLessThan(customer.indexOf('Propuesta final del negocio'));
  expect(business).toContain('El cliente pidió'); expect(business).toContain('Tu propuesta final');
  expect(customer).toContain('Descripción sintética'); expect(customer).toContain('Ver detalle');
  expect(JSON.stringify(value)).toBe(before);
});

it('compares CUSTOM whole-line price with the catalog unit price without losing the basis', () => {
  const html = render(read(2));
  expect(html).toContain('$10.001 total de la opción'); expect(html).toContain('$1.500 por unidad');
  expect(html).toContain('Cambió'); expect(html).toContain('Se mantuvo');
});

it('shows every line description and unit price even when multiple lines have an unchanged total', () => {
  const value = read();
  for (const p of value.proposals) {
    p.subjectSnapshot.items.push({ ...p.subjectSnapshot.items[0], nameSnapshot: 'Segundo artículo', descriptionSnapshot: 'Detalle segundo', quantity: 1, unitPriceClpSnapshot: 500, subtotalClp: 500 });
    p.totalPriceClp += 500;
  }
  const html = render(value);
  expect(html).toContain('Segundo artículo'); expect(html).toContain('Detalle segundo'); expect(html).toContain('$500 por unidad');
  expect(html).toContain('2. Cantidad'); expect(html).toContain('2. Total de esta línea');
});

it('labels services and omits quantity, escaping customer and proposal text', () => {
  const value = read();
  for (const p of value.proposals) p.subjectSnapshot.orderType = 'service';
  value.proposals[1].subjectSnapshot.proposalMessage = '<script>inseguro</script>';
  const html = render(value);
  expect(html).toContain('Servicio'); expect(html).not.toContain('Cantidad');
  expect(html).toContain('&lt;script&gt;inseguro&lt;/script&gt;'); expect(html).not.toContain('<script>');
});

it('only shows counter hint to the customer when allowed and shows real photo authors', () => {
  expect(render()).toContain('1 propuesta final'); expect(render(read(), true)).not.toContain('1 propuesta final');
  expect(render(read(), false, false)).not.toContain('1 propuesta final');
  expect(render(read(), false, true, 'wait')).toContain('Esperando la respuesta');
  expect(render(read(), false, true, 'closed')).toContain('rechazó la propuesta · Historial');
  expect(render()).toContain('Foto del negocio'); expect(render(read(2), true)).toContain('Foto del cliente');
});
