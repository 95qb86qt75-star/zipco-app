import type { DevAuthSessionResponse } from './devAuthApi';

const SESSION_KEYS = [
  'zipco-token',
  'zipco-user-id',
  'zipco-business-id',
  'zipco-registration-complete',
  'zipco-user-phone'
] as const;

type SessionKey = (typeof SESSION_KEYS)[number];

function restore(storage: Storage, snapshot: Map<SessionKey, string | null>) {
  for (const key of SESSION_KEYS) {
    try {
      const value = snapshot.get(key) ?? null;
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    } catch {
      // Continue restoring the remaining keys without exposing session values.
    }
  }
}

export function persistDevSession(storage: Storage, session: DevAuthSessionResponse): void {
  const snapshot = new Map<SessionKey, string | null>();
  for (const key of SESSION_KEYS) snapshot.set(key, storage.getItem(key));

  try {
    storage.setItem('zipco-user-id', String(session.user.id));
    if (session.businessId === null) storage.removeItem('zipco-business-id');
    else storage.setItem('zipco-business-id', String(session.businessId));
    storage.setItem('zipco-registration-complete', 'true');
    storage.removeItem('zipco-user-phone');
    storage.setItem('zipco-token', session.access_token);
  } catch (error) {
    restore(storage, snapshot);
    throw error;
  }
}
