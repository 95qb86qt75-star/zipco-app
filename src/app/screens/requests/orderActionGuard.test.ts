import { describe, expect, it } from 'vitest';
import { createOrderOperationGuard } from './orderActionGuard';

describe('order operation guard', () => {
  it('blocks a second submission until the first one finishes', () => {
    const guard = createOrderOperationGuard();
    expect(guard.begin(19)).toBe(true);
    expect(guard.begin(19)).toBe(false);
    expect(guard.has(19)).toBe(true);
    guard.end(19);
    expect(guard.begin(19)).toBe(true);
  });

  it('allows different orders concurrently', () => {
    const guard = createOrderOperationGuard();
    expect(guard.begin(19)).toBe(true);
    expect(guard.begin(20)).toBe(true);
  });
});
