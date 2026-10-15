import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCreateOrderPayload } from './createOrderApi';
import { resolveOrderDelivery, selectOrderMoment, type OrderMoment } from './orderMoment';
import { PAST_SCHEDULE_MESSAGE } from './requests/requestProcessErrors';

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
const now = new Date('2026-10-16T01:30:25Z'); // Oct 15, 22:30 in Santiago.
const details = { businessId: 5, items: [{ catalogItemId: 7, quantity: 2 }],
  note: 'Nota de prueba', referencePhoto: 'https://example.test/reference.jpg' };

describe('order delivery moment contract', () => {
  it('keeps the immediate payload, removing incompatible date/time', () => {
    const delivery = resolveOrderDelivery({ moment: 'now', date: '2026-11-10', time: '15:00' }, now);
    expect(buildCreateOrderPayload({ ...details, ...delivery })).toEqual({
      ...details, needNow: true, deliveryDate: null, deliveryTime: null,
    });
  });
  it('sends today in Santiago and the future time, without scheduledFor or new fields', () => {
    const delivery = resolveOrderDelivery({ moment: 'today', date: '2026-11-10', time: '23:00' }, now);
    expect(buildCreateOrderPayload({ ...details, ...delivery })).toEqual({
      ...details, needNow: false, deliveryDate: '2026-10-15', deliveryTime: '23:00',
    });
  });
  it.each(['00:10', '22:00', '22:30'])('rejects passed time %s without rolling to tomorrow', (time) => {
    expect(() => resolveOrderDelivery({ moment: 'today', date: '', time }, now)).toThrow(PAST_SCHEDULE_MESSAGE);
  });
  it('does not invent a minimum lead time', () => {
    expect(resolveOrderDelivery({ moment: 'today', date: '', time: '22:31' }, now).deliveryTime).toBe('22:31');
  });
  it('keeps Programar date and time unchanged', () => {
    const delivery = resolveOrderDelivery({ moment: 'schedule', date: '2026-11-12', time: '12:20' }, now);
    expect(buildCreateOrderPayload({ ...details, ...delivery })).toEqual({
      ...details, needNow: false, deliveryDate: '2026-11-12', deliveryTime: '12:20',
    });
  });
  it.each(['now', 'today', 'schedule'] as const)('clears incompatible values when switching to %s', (moment) => {
    for (const previous of ['now', 'today', 'schedule'] as OrderMoment[]) {
      const draft = { ...details, moment: previous, date: '2026-12-20', time: '19:30' };
      expect({ ...draft, ...selectOrderMoment(moment) }).toEqual({ ...details, moment, date: '', time: '' });
    }
  });
  it.each(['UTC', 'Asia/Tokyo', 'Pacific/Honolulu'])('ignores device timezone %s', (timezone) => {
    vi.stubEnv('TZ', timezone);
    expect(resolveOrderDelivery({ moment: 'today', date: '', time: '23:00' }, now).deliveryDate).toBe('2026-10-15');
  });
  it('uses the Chilean winter offset as well as summer time', () => {
    expect(resolveOrderDelivery({ moment: 'today', date: '', time: '22:00' }, new Date('2026-06-02T01:30:00Z')))
      .toEqual({ needNow: false, deliveryDate: '2026-06-01', deliveryTime: '22:00' });
  });
  it('resolves the current date at submission after local midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-16T02:58:00Z'));
    const selection = { ...selectOrderMoment('today'), time: '23:59' };
    expect(resolveOrderDelivery(selection).deliveryDate).toBe('2026-10-15');
    vi.setSystemTime(new Date('2026-10-16T03:01:00Z'));
    expect(resolveOrderDelivery(selection).deliveryDate).toBe('2026-10-16');
  });
  it.each(['', '25:00', '12:60'])('requires a valid time for today (%s)', (time) => {
    expect(() => resolveOrderDelivery({ moment: 'today', date: '', time }, now)).toThrow('Selecciona la hora para hoy.');
  });
  it('requires a mode and complete programming', () => {
    expect(() => resolveOrderDelivery({ moment: null, date: '', time: '' }, now)).toThrow('Selecciona cuándo');
    expect(() => resolveOrderDelivery({ moment: 'schedule', date: '', time: '23:00' }, now)).toThrow('Selecciona una fecha y hora.');
  });
});
