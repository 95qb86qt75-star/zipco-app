import { describe, expect, it } from 'vitest';
import { persistDevSession } from './devSessionStorage';
import type { DevAuthSessionResponse } from './devAuthApi';

const session: DevAuthSessionResponse = {
  access_token: 'local-jwt',
  user: { id: 2, name: 'Owner', email: 'dev.business-owner@zipco.local', role: 'user' },
  businessId: 1
};

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failOnceOn: string | null = null;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failOnceOn === key) {
      this.failOnceOn = null;
      throw new Error('storage failure');
    }
    this.values.set(key, value);
  }
}

describe('dev session persistence', () => {
  it('persists the strict session and removes an old phone', () => {
    const storage = new MemoryStorage();
    storage.setItem('zipco-user-phone', '+56 old');
    persistDevSession(storage, session);
    expect(storage.getItem('zipco-token')).toBe('local-jwt');
    expect(storage.getItem('zipco-user-id')).toBe('2');
    expect(storage.getItem('zipco-business-id')).toBe('1');
    expect(storage.getItem('zipco-registration-complete')).toBe('true');
    expect(storage.getItem('zipco-user-phone')).toBeNull();
  });

  it('removes a previous business for an account without one', () => {
    const storage = new MemoryStorage();
    storage.setItem('zipco-business-id', '99');
    persistDevSession(storage, { ...session, businessId: null });
    expect(storage.getItem('zipco-business-id')).toBeNull();
  });

  it('restores every previous value if a write fails', () => {
    const storage = new MemoryStorage();
    const previous = {
      'zipco-token': 'old-token',
      'zipco-user-id': '35',
      'zipco-business-id': '50',
      'zipco-registration-complete': 'true',
      'zipco-user-phone': '+56 old'
    };
    Object.entries(previous).forEach(([key, value]) => storage.setItem(key, value));
    storage.failOnceOn = 'zipco-registration-complete';
    expect(() => persistDevSession(storage, session)).toThrow('storage failure');
    Object.entries(previous).forEach(([key, value]) => expect(storage.getItem(key)).toBe(value));
  });
});
