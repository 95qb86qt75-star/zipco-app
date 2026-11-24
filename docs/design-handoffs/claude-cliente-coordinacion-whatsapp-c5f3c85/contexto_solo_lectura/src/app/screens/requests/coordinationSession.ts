// Session credentials exist only in memory here; they never enter an intention or URL.
export type CoordinationSession = { userId: string; token: string; businessId: string | null; revision: number };
let current: CoordinationSession | null = null;
let revision = 0;
const listeners = new Set<() => void>();

export function readCoordinationSession(): CoordinationSession | null {
  if (typeof localStorage === 'undefined') return null;
  const userId = localStorage.getItem('zipco-user-id');
  const token = localStorage.getItem('zipco-token');
  const businessId = localStorage.getItem('zipco-business-id');
  if (!userId || !token) { if (current) revision++; current = null; return null; }
  if (!current || current.userId !== userId || current.token !== token || current.businessId !== businessId)
    current = { userId, token, businessId, revision: ++revision };
  return current;
}

export function notifyCoordinationSessionChange() {
  current = null; revision++;
  listeners.forEach((listener) => listener());
}

export function subscribeCoordinationSession(listener: () => void) {
  const check = () => { readCoordinationSession(); listener(); };
  listeners.add(listener);
  window.addEventListener('storage', check);
  window.addEventListener('zipco-session-changed', check);
  window.addEventListener('focus', check);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', check);
    window.removeEventListener('zipco-session-changed', check);
    window.removeEventListener('focus', check);
  };
}

export function operationScope(session: CoordinationSession, business: boolean) {
  return `${session.userId}:${business ? 'business' : 'customer'}`;
}
