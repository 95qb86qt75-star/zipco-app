import { describe, expect, it } from 'vitest';
import {
  isRecord,
  parseCalendarDate,
  parseCancellationReason,
  parseIsoDate,
  parseNonNegativeNumber,
  parseOrderStatus,
  parsePositiveInteger,
  parseProducts,
  parseTime
} from './orderValueParsers';

describe('order value parsers', () => {
  it('recognizes records but excludes null and arrays', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
  });

  it.each(['pending', 'accepted', 'ready', 'completed', 'rejected', 'cancelled'])
  ('accepts the valid status %s', (status) => {
    expect(parseOrderStatus(status)).toBe(status);
  });

  it.each([null, undefined, '', 1, 'unknown'])('rejects invalid status %s', (status) => {
    expect(parseOrderStatus(status)).toBeNull();
  });

  it('accepts positive integer IDs and canonical digit strings', () => {
    expect(parsePositiveInteger(20)).toBe(20);
    expect(parsePositiveInteger('20')).toBe(20);
  });

  it.each(['20.0', '2e1', '+20', '', '0', '-1', 0, -1, 1.5])
  ('rejects ambiguous or invalid ID %s', (id) => {
    expect(parsePositiveInteger(id)).toBeNull();
  });

  it('normalizes non-negative totals from numbers and strings', () => {
    expect(parseNonNegativeNumber(3800)).toBe(3800);
    expect(parseNonNegativeNumber('3800.50')).toBe(3800.5);
    expect(parseNonNegativeNumber(-1)).toBeNull();
    expect(parseNonNegativeNumber('')).toBeNull();
  });

  it('validates ISO dates, calendar dates and times', () => {
    expect(parseIsoDate('2026-09-05T10:20:30.000Z')).toBe('2026-09-05T10:20:30.000Z');
    expect(parseIsoDate('2026-02-30T10:20:30.000Z')).toBeNull();
    expect(parseIsoDate('not-a-date')).toBeNull();
    expect(parseCalendarDate('2026-02-28')).toBe('2026-02-28');
    expect(parseCalendarDate('2026-02-30')).toBeNull();
    expect(parseTime('00:00')).toBe('00:00');
    expect(parseTime('23:59')).toBe('23:59');
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('9:30')).toBeNull();
  });

  it('accepts valid products, JSON and an empty array', () => {
    const product = { name: 'Producto', quantity: 1, price: '3800' };
    expect(parseProducts([product])).toEqual({
      state: 'available',
      items: [{ name: 'Producto', quantity: 1, price: 3800 }]
    });
    expect(parseProducts(JSON.stringify([product])).state).toBe('available');
    expect(parseProducts([])).toEqual({ state: 'available', items: [] });
  });

  it('marks malformed products as unavailable without partial data', () => {
    expect(parseProducts('{broken')).toEqual({ state: 'unavailable', items: [] });
    expect(parseProducts(null)).toEqual({ state: 'unavailable', items: [] });
    expect(parseProducts([{ name: '', quantity: 1, price: 10 }])).toEqual({
      state: 'unavailable', items: []
    });
    expect(parseProducts([
      { name: 'Válido', quantity: 1, price: 10 },
      { name: 'Inválido', quantity: 0, price: 10 }
    ])).toEqual({ state: 'unavailable', items: [] });
  });

  it('accepts only supported cancellation reasons', () => {
    expect(parseCancellationReason('selected_by_mistake')).toBe('selected_by_mistake');
    expect(parseCancellationReason('invented')).toBeNull();
  });
});
