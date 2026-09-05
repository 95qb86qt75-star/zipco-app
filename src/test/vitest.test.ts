import { describe, expect, it } from 'vitest';

describe('test infrastructure', () => {
  it('executes TypeScript tests', () => {
    const statuses = ['pending', 'accepted', 'ready'] as const;

    expect(statuses).toContain('ready');
  });
});
