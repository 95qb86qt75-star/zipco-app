import { describe, expect, it } from 'vitest';
import { normalizeRequestProcess, processStatusLabel } from './requestProcess';
import { countStatusViews, filterByStatusView, statusViewFor } from './requestStatusGrouping';
import { getCustomerAttentionItems } from './requestAttentionSummary';
import { proposalsFixture } from '../fixtures/proposalFixtures';
import { agreementLink, agreementReturnLink } from '../application/agreementNavigation';

const process = (sequence: number, business = false) => normalizeRequestProcess(proposalsFixture(sequence, business).process)!;
describe('customer waiting for the business counter response', () => {
  it('separates the actor turn while retaining business categories', () => {
    const counter = process(2), final = process(3);
    expect(statusViewFor('orders', 'alternative_proposed', counter)).toBe('awaiting-business');
    expect(statusViewFor('orders', 'alternative_proposed', process(2, true), false, true)).toBe('waiting');
    for (const sequence of [1, 3]) expect(statusViewFor('orders', 'alternative_proposed', process(sequence))).toBe('waiting');
    expect(processStatusLabel({ requestProcess: counter })).toBe('Esperando respuesta del negocio');
    expect(processStatusLabel({ requestProcess: counter }, true)).toBe('Contrapropuesta por responder');
    expect(statusViewFor('orders', 'alternative_proposed', final)).toBe('waiting');
  });
  it('counts, filters and unread response alerts agree on who must act', () => {
    const records = [1, 2, 3].map(sequence => ({ id: sequence, status: 'alternative_proposed', requestProcess: process(sequence) }));
    expect(countStatusViews(records, 'orders')).toMatchObject({ waiting: 2, 'awaiting-business': 1 });
    expect(filterByStatusView(records, 'orders', 'awaiting-business').map(r => r.id)).toEqual([2]);
    expect(filterByStatusView(records, 'orders', 'waiting').map(r => r.id)).toEqual([1, 3]);
    expect(getCustomerAttentionItems(records, 'orders', new Set(['order:2'])).responses.map(r => r.id)).toEqual([1, 3]);
    expect(countStatusViews(records, 'orders', true)).toMatchObject({ waiting: 3, 'awaiting-business': 0 });
  });
  it('round trips the new local category through agreement navigation', () => {
    const link = agreementLink(7, false, false, 'awaiting-business');
    expect(agreementReturnLink(link.split('?')[1])).toBe('/?open=requests-customer&view=awaiting-business');
  });
});
