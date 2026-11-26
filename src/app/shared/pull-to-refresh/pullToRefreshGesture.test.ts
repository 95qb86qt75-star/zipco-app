import { describe, expect, it } from 'vitest';
import { classifyPull, dampenPull, PULL_REFRESH_MAX, PULL_REFRESH_THRESHOLD, shouldRefreshOnRelease } from './pullToRefreshGesture';

describe('pull to refresh gesture', () => {
  it('waits until the finger moved enough to know the direction', () => {
    expect(classifyPull(3, 5)).toBe('pending');
  });

  it('only owns mostly-downward movements', () => {
    expect(classifyPull(2, 20)).toBe('pull');
    expect(classifyPull(0, -20)).toBe('ignore');
    expect(classifyPull(30, 12)).toBe('ignore');
    expect(classifyPull(-30, 12)).toBe('ignore');
  });

  it('adds resistance and caps the travel', () => {
    expect(dampenPull(-10)).toBe(0);
    expect(dampenPull(40)).toBe(20);
    expect(dampenPull(1000)).toBe(PULL_REFRESH_MAX);
  });

  it('refreshes only after reaching the threshold', () => {
    expect(shouldRefreshOnRelease(PULL_REFRESH_THRESHOLD - 1)).toBe(false);
    expect(shouldRefreshOnRelease(PULL_REFRESH_THRESHOLD)).toBe(true);
    expect(shouldRefreshOnRelease(dampenPull(PULL_REFRESH_THRESHOLD * 2))).toBe(true);
  });
});
