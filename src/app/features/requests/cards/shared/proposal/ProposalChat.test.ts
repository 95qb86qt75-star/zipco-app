import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import ProposalChat, { comparisonRows } from "./ProposalChat";
import { normalizeProposals } from "../../../domain/proposalContract";
import { proposalsFixture } from "../../../fixtures/proposalFixtures";

beforeEach(() => { vi.stubGlobal('React', React); });
const read = (sequence = 1) => { const value = proposalsFixture(sequence); return normalizeProposals(value, value.process.id)!; };
const render = (value = read(), business = false, canCounter = true, turn: 'mine' | 'wait' | 'closed' = 'mine') => renderToStaticMarkup(
  React.createElement(ProposalChat, { read: value, business, canCounter, turn, closedText: 'El cliente rechazó la propuesta · Historial' }));

it('business design preserves snapshot order, own message and comparison without changing data', () => {
  const value = read(2); value.proposals[1].subjectSnapshot.proposalMessage = 'Ofrezco estas condiciones.';
  const before = JSON.stringify(value);
  const html = renderToStaticMarkup(React.createElement(ProposalChat, { read: value, business: true, businessDesign: true, turn: 'mine' }));
  expect(html).toContain('zipco-bz-chat'); expect(html).toContain('El cliente pidió'); expect(html).toContain('El cliente contrapone');
  expect(html).toContain('“Ofrezco estas condiciones.”');
  expect(html.indexOf('data-proposal-sequence="0"')).toBeLessThan(html.indexOf('data-proposal-sequence="1"'));
  expect(html.indexOf('data-proposal-sequence="1"')).toBeLessThan(html.indexOf('data-proposal-sequence="2"'));
  expect(JSON.stringify(value)).toBe(before);
});

it('business design flag has no effect on the customer composition', () => {
  const value = read(2);
  const withFlag = renderToStaticMarkup(React.createElement(ProposalChat, { read: value, business: false, businessDesign: true, turn: 'mine', canCounter: true, closedText: 'El cliente rechazó la propuesta · Historial' }));
  expect(withFlag).toBe(render(value));
});

it('marks the waiting customer counter as sent without changing proposal data', () => {
  const value = read(2), before = JSON.stringify(value);
  const html = renderToStaticMarkup(React.createElement(ProposalChat, { read: value, business: false, waitingDesign: true, turn: 'wait' }));
  expect(html).toContain('zipco-wt-chat'); expect(html).toContain('Enviada');
  expect(html).toContain('Esperando respuesta del negocio');
  expect(html).not.toContain('Te toca responder');
  expect(html).not.toContain('Esperando la respuesta de la otra parte');
  expect(html).toContain('data-proposal-sequence="2"');
  expect(JSON.stringify(value)).toBe(before);
});

it.each([true, false])('does not activate waiting styling for another turn or the business (%s)', business => {
  const value = read(2), props = { read: value, business, businessDesign: business, turn: 'mine' as const };
  const original = renderToStaticMarkup(React.createElement(ProposalChat, props));
  expect(renderToStaticMarkup(React.createElement(ProposalChat, { ...props, waitingDesign: true }))).toBe(original);
});

it('places the customer plan after the turn and before counter guidance',()=>{
 const html=renderToStaticMarkup(React.createElement(ProposalChat,{read:read(),business:false,turn:'mine',canCounter:true,plan:React.createElement('p',null,'Condiciones vigentes')}));
 expect(html.indexOf('Te toca responder')).toBeLessThan(html.indexOf('Condiciones vigentes'));
 expect(html.indexOf('Condiciones vigentes')).toBeLessThan(html.indexOf('Si haces una contrapropuesta'));
 expect(html).toContain('zipco-pz-ev');
 expect(render(read(),true)).not.toContain('zipco-pz-ev');
});

it('keeps ordered immutable snapshots and correct actor labels for both viewers', () => {
  const value = read(3), before = JSON.stringify(value);
  const customer = render(value), business = render(value, true);
  expect(customer.indexOf('Tú pediste')).toBeLessThan(customer.indexOf('El negocio responde'));
  expect(customer.indexOf('Tú contrapropusiste')).toBeLessThan(customer.indexOf('Propuesta final del negocio'));
  expect(business).toContain('El cliente pidió'); expect(business).toContain('Tu propuesta final');
  expect(customer).toContain('Ver detalle');
  expect(JSON.stringify(value)).toBe(before);
});

it('compares CUSTOM whole-line price with the catalog unit price without losing the basis', () => {
  const value = read(2), rows = comparisonRows(value.proposals[2], value.proposals[1]);
  expect(rows.find(row => row.key === 'price:0')).toMatchObject({ value: '$10.001', old: '$1.500', basis: 'line', oldBasis: 'unit', changed: true });
});

it('shows every line description and unit price even when multiple lines have an unchanged total', () => {
  const value = read();
  for (const p of value.proposals) {
    p.subjectSnapshot.items.push({ ...p.subjectSnapshot.items[0], nameSnapshot: 'Segundo artículo', descriptionSnapshot: 'Detalle segundo', quantity: 1, unitPriceClpSnapshot: 500, subtotalClp: 500 });
    p.totalPriceClp += 500;
  }
  const rows = comparisonRows(value.proposals[1], value.proposals[0]);
  expect(rows.find(row => row.key === 'name:1')?.value).toBe('Segundo artículo');
  expect(rows.find(row => row.key === 'desc:1')?.value).toBe('Detalle segundo');
  expect(rows.find(row => row.key === 'price:1')).toMatchObject({ value: '$500', basis: 'unit', changed: false });
  expect(rows.find(row => row.key === 'qty:1')?.value).toBe('1');
  expect(rows.find(row => row.key === 'total:1')?.value).toBe('$500');
});

it('labels services and omits quantity, escaping customer and proposal text', () => {
  const value = read();
  for (const p of value.proposals) p.subjectSnapshot.orderType = 'service';
  value.proposals[1].subjectSnapshot.proposalMessage = '<script>inseguro</script>';
  const html = render(value);
  const rows = comparisonRows(value.proposals[1], value.proposals[0]);
  expect(rows.find(row => row.key === 'name:0')?.label).toBe('Servicio'); expect(rows.some(row => row.key.startsWith('qty:'))).toBe(false);
  expect(html).toContain('&lt;script&gt;inseguro&lt;/script&gt;'); expect(html).not.toContain('<script>');
});

it('only shows counter hint to the customer when allowed and a compact photo indicator while closed', () => {
  expect(render()).toContain('1 propuesta final'); expect(render(read(), true)).not.toContain('1 propuesta final');
  expect(render(read(), false, false)).not.toContain('1 propuesta final');
  expect(render(read(), false, true, 'wait')).toContain('Esperando la respuesta');
  expect(render(read(), false, true, 'closed')).toContain('rechazó la propuesta · Historial');
  expect(render(read(), true)).toContain('Incluye foto'); expect(render(read(2), false)).toContain('Incluye foto');
});

it('represents removing a description as a change and keeps floating details closed initially', () => {
  const value = read(); value.proposals[1].subjectSnapshot.items[0].descriptionSnapshot = '';
  const html = render(value);
  expect(comparisonRows(value.proposals[1], value.proposals[0]).find(row => row.key === 'desc:0')).toMatchObject({ old: 'Descripción sintética', value: 'Sin descripción', changed: true });
  expect(html).not.toContain('data-proposal-sheet'); expect(html).toContain('aria-expanded="false"');
  expect(html).toContain('Ver detalle de la propuesta'); expect(html).toContain('Ver detalle del pedido');
});

it('detects price basis and exact date changes even when short displayed values coincide', () => {
  const value = read(); const [previous, current] = value.proposals;
  current.subjectSnapshot.items[0] = { ...previous.subjectSnapshot.items[0], source: 'CUSTOM', subtotalClp: 1000 };
  previous.subjectSnapshot.needNow = current.subjectSnapshot.needNow = false;
  previous.scheduledFor = '2030-10-22T15:00:00Z'; current.scheduledFor = '2031-10-22T15:00:00Z';
  const rows = comparisonRows(current, previous);
  expect(rows.find(row => row.key === 'price:0')).toMatchObject({ value: '$1.000', old: '$1.000', changed: true });
  expect(rows.find(row => row.key === 'when')?.changed).toBe(true);
});
