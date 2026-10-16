import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AgreementContent } from './AcceptedConditions';
import type { AgreementState } from './useAgreement';
import { readAgreement } from './requestProcessApi';
import { RequestProcessError } from './requestProcessErrors';
import { readCoordinationSession, subscribeCoordinationSession, notifyCoordinationSessionChange, type CoordinationSession } from './coordinationSession';

export function agreementRouteId(path: string): number | null {
  const match = /^\/solicitudes\/procesos\/([1-9]\d*)\/acuerdo\/?$/.exec(path);
  const id = match ? Number(match[1]) : 0;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export const agreementPath = (id: number) => `/solicitudes/procesos/${id}/acuerdo`;

export async function fetchSessionAgreement(id: number, session: CoordinationSession, signal: AbortSignal, update: (state: AgreementState) => void) {
  const active = () => !signal.aborted && readCoordinationSession() === session;
  if (!active()) return;
  update({ status: 'loading' });
  try {
    const agreement = await readAgreement(id, null, session.token, signal);
    if (active()) update({ status: 'loaded', agreement });
  } catch (error: unknown) {
    if (!active()) return;
    if (error instanceof RequestProcessError && error.status === 401) {
      localStorage.removeItem('zipco-token'); notifyCoordinationSessionChange(); return;
    }
    update({ status: 'error', message: error instanceof RequestProcessError ? error.message : 'No se pudieron cargar las condiciones aceptadas. Intenta nuevamente.' });
  }
}

function AgreementPage({ id, session }: { id: number; session: CoordinationSession }) {
  const [state, setState] = useState<AgreementState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetchSessionAgreement(id, session, controller.signal, setState);
    return () => controller.abort();
  }, [id, attempt, session]);
  const params = new URLSearchParams(window.location.search);
  const destination = params.get('volver') === 'historial' ? '&view=history' : '';
  const participant = params.get('participant') === 'business' ? 'business' : 'customer';
  return <main className="mx-auto min-h-screen max-w-lg space-y-4 bg-white p-4 text-slate-900">
    <a className="inline-flex min-h-12 items-center font-bold text-teal-700" href={`/?open=requests-${participant}${destination}`}>Volver a Solicitudes</a>
    <h1 className="text-xl font-black">Condiciones aceptadas</h1>
    <AgreementContent state={readCoordinationSession() === session ? state : { status: 'loading' }} retry={() => setAttempt((value) => value + 1)} business={participant === 'business'} />
  </main>;
}

// The validated relative path remains in the address bar through the existing login.
// No token, contact or WhatsApp URL is included in the destination.
export default function AgreementRoute({ children }: { children: ReactNode }) {
  const id = agreementRouteId(window.location.pathname);
  const session = useSyncExternalStore(subscribeCoordinationSession, readCoordinationSession, readCoordinationSession);
  return id && session ? <AgreementPage key={`${id}:${session.revision}`} id={id} session={session} /> : <>{children}</>;
}
