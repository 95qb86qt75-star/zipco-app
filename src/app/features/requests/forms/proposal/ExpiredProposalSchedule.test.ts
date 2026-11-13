import { afterEach, expect, it, vi } from 'vitest';
import { chileToday, requestedScheduleLabel } from './ExpiredProposalSchedule';

afterEach(() => vi.useRealTimers());
it('suggests today in Chile across UTC midnight', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T01:30:00Z'));
  expect(chileToday()).toBe('2026-11-13');
});
it('labels a scheduled hour today without converting the local hour to UTC', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T01:30:00Z'));
  const label = requestedScheduleLabel({ mode: 'SCHEDULED', date: '2026-11-13', time: '23:59' });
  expect(label).toContain('Hoy'); expect(label).toContain('23:59');
});
it('preserves a future calendar date and its Chile-local time', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-14T01:30:00Z'));
  const label = requestedScheduleLabel({ mode: 'SCHEDULED', date: '2026-11-20', time: '15:00' });
  expect(label).toContain('20'); expect(label).toContain('2026'); expect(label).toContain('15:00');
  expect(label).not.toContain('Hoy');
});
it('keeps existing IMMEDIATE representation compatible and handles no choice', () => {
  expect(requestedScheduleLabel({ mode: 'IMMEDIATE' })).toBe('Lo antes posible');
  expect(requestedScheduleLabel(null)).toBe('');
});
