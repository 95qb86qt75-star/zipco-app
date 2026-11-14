import { describe, expect, it } from 'vitest';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { rawOrder } from '../fixtures/requestProcessFixtures';
import { agendaGroupOf, applyAgendaFilters, buildAgendaEntries, countAgendaOptions, describeSchedule, modalityOf, sortByAttention, validSchedule } from './businessAgenda';
import type { AgreedSchedule } from './businessAgenda';

const now = Date.parse('2026-11-14T03:15:00Z'); // 00:15 Santiago; server/host timezone is irrelevant.
const order = normalizeBusinessOrdersPayload([{ ...rawOrder, customerName: 'Prueba' }])[0];
describe('business agenda from agreed conditions', () => {
  it.each([
    [{ kind: 'asap' }, 'asap'], [{ kind: 'unverified' }, 'unverified'],
    [{ kind: 'scheduled', at: '2026-11-14T02:59:00Z' }, 'past'],
    [{ kind: 'scheduled', at: '2026-11-14T03:00:00Z' }, 'today'],
    [{ kind: 'scheduled', at: '2026-11-15T03:00:00Z' }, 'tomorrow'],
    [{ kind: 'scheduled', at: '2026-11-16T04:20:00Z' }, 'upcoming'],
  ])('groups %j as %s using Santiago days', (schedule, group) => {
    expect(agendaGroupOf(schedule as AgreedSchedule, now)).toBe(group);
  });
  it('keeps an earlier hour today in Today instead of closing or relabeling the order', () => {
    expect(agendaGroupOf({ kind: 'scheduled', at: '2026-11-14T03:01:00Z' }, now)).toBe('today');
  });
  it('never substitutes original dates when agreement is missing, invalid, or fails', () => {
    for (const resolve of [() => undefined as never, () => ({ kind: 'scheduled', at: 'invalid' }) as AgreedSchedule,
      () => { throw new Error('read failure'); }]) {
      expect(buildAgendaEntries([order], resolve, now)[0].group).toBe('unverified');
    }
    expect(validSchedule({ kind: 'unknown' })).toEqual({ kind: 'unverified' });
  });
  it('sorts by agreed time, combines filters and counts against the other filter', () => {
    const entries = buildAgendaEntries([order, { ...order, id: 21 }, { ...order, id: 22 }],
      o => o.id === 20 ? { kind: 'scheduled', at: '2026-11-16T04:20:00Z' }
        : o.id === 21 ? { kind: 'asap' } : { kind: 'scheduled', at: '2026-11-14T16:00:00Z' }, now);
    entries[0].modality = 'reserved'; entries[1].modality = 'whatsapp'; entries[2].modality = 'reserved';
    expect(sortByAttention(entries).map(e => e.order.id)).toEqual([21, 22, 20]);
    expect(applyAgendaFilters(entries, { date: 'today', type: 'reserved' }).map(e => e.order.id)).toEqual([22]);
    const counts = countAgendaOptions(entries, { date: 'today', type: 'reserved' });
    expect(counts.date.all).toBe(2); expect(counts.type.all).toBe(2); expect(counts.type.whatsapp).toBe(1);
  });
  it('distinguishes explicit choices and never assumes missing choice means no reservation', () => {
    const sample = (path: string, choice?: string, information = false) => ({ ...order,
      requestProcess: { availability: { path }, reservationChoice: choice ? { choice } : undefined,
        localPickupInformation: information ? {} : undefined } }) as never;
    expect(modalityOf(sample('WHATSAPP'))).toBe('whatsapp');
    expect(modalityOf(sample('LOCAL_PICKUP', 'NONE'))).toBe('pickup');
    expect(modalityOf(sample('LOCAL_PICKUP', 'REQUEST_RESERVATION'))).toBe('reserved');
    expect(modalityOf(sample('LOCAL_PICKUP'))).toBe('other');
    expect(modalityOf(sample('LOCAL_PICKUP', 'NONE', true))).toBe('other');
  });
  it('shows 01:20 in Chile independently from the date of creation', () => {
    expect(describeSchedule({ kind: 'scheduled', at: '2026-11-16T04:20:00Z' }, 'upcoming').bottom).toBe('01:20');
  });
});
