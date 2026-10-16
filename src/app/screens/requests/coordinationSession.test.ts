import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyCoordinationSessionChange, operationScope, readCoordinationSession, subscribeCoordinationSession } from './coordinationSession';
let values: Map<string, string>;
beforeEach(() => {
  values = new Map([['zipco-user-id', 'user-a'], ['zipco-token', 'token-a'], ['zipco-business-id', '1']]);
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null });
  const target = new EventTarget();
  vi.stubGlobal('window', target); notifyCoordinationSessionChange();
});
afterEach(() => { notifyCoordinationSessionChange(); vi.unstubAllGlobals(); });
describe('coordination session identity', () => {
  it('keeps a stable snapshot and changes identity for user, credentials or business scope', () => {
    const initial = readCoordinationSession()!;
    expect(readCoordinationSession()).toBe(initial);
    expect(operationScope(initial, true)).toBe('user-a:business');
    expect(operationScope(initial, false)).toBe('user-a:customer');
    for (const [key, value] of [['zipco-user-id', 'user-b'], ['zipco-token', 'token-b'], ['zipco-business-id', '2']]) {
      const previous = readCoordinationSession(); values.set(key, value);
      expect(readCoordinationSession()).not.toBe(previous);
    }
    expect(operationScope(readCoordinationSession()!, true)).not.toContain('token');
  });
  it('invalidates the original session even after logging in again with identical credentials', () => {
    const initial = readCoordinationSession(); const listener = vi.fn();
    const unsubscribe = subscribeCoordinationSession(listener);
    values.delete('zipco-token'); notifyCoordinationSessionChange();
    expect(readCoordinationSession()).toBeNull();
    values.set('zipco-token', 'token-a'); notifyCoordinationSessionChange();
    expect(readCoordinationSession()).not.toBe(initial); expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
  it('observes cross-tab changes and removes its listeners', () => {
    const listener = vi.fn(); const unsubscribe = subscribeCoordinationSession(listener);
    values.set('zipco-user-id', 'user-b'); window.dispatchEvent(new Event('storage'));
    expect(listener).toHaveBeenCalledOnce(); expect(readCoordinationSession()?.userId).toBe('user-b');
    unsubscribe(); window.dispatchEvent(new Event('storage')); expect(listener).toHaveBeenCalledOnce();
  });
});
