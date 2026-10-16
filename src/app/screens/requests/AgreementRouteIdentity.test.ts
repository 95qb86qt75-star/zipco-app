import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useSyncExternalStore: (_subscribe: unknown, read: () => unknown) => read(),
}));
import AgreementRoute from './AgreementRoute';
import { notifyCoordinationSessionChange } from './coordinationSession';
let values: Map<string, string>;
beforeEach(() => {
  values = new Map([['zipco-user-id', 'user-a'], ['zipco-token', 'token-a']]);
  vi.stubGlobal('React', React);
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null });
  vi.stubGlobal('window', { location: { pathname: '/solicitudes/procesos/7/acuerdo' } });
  notifyCoordinationSessionChange();
});
afterEach(() => vi.unstubAllGlobals());
describe('private agreement component identity', () => {
  it('replaces the page and its cached conditions when another authenticated user arrives', () => {
    const first = AgreementRoute({ children: 'login' });
    values.set('zipco-user-id', 'user-b'); values.set('zipco-token', 'token-b');
    const next = AgreementRoute({ children: 'login' });
    expect(next.key).not.toBe(first.key);
    expect(next.props.session.userId).toBe('user-b');
    expect(first.props.session.userId).toBe('user-a');
  });
  it('returns to login on logout and remounts even when the same user logs in again', () => {
    const first = AgreementRoute({ children: 'login' });
    values.delete('zipco-token'); notifyCoordinationSessionChange();
    expect(AgreementRoute({ children: 'login' }).props.children).toBe('login');
    values.set('zipco-token', 'token-a'); notifyCoordinationSessionChange();
    expect(AgreementRoute({ children: 'login' }).key).not.toBe(first.key);
  });
});
