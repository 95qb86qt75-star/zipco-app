import { useCallback, useEffect, useState } from 'react';
import type { AgreementReadDto } from './agreement';
import type { RequestProcessSummary } from './requestProcess';
import { readAgreement } from './requestProcessApi';
import { RequestProcessError } from './requestProcessErrors';

export type AgreementState =
  | { status: 'absent' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; agreement: AgreementReadDto };

export async function fetchAgreementState(
  process: Pick<RequestProcessSummary, 'id' | 'agreementPublicId' | 'flowContract' | 'availability'> | null | undefined,
  token: string | null, signal: AbortSignal, update: (state: AgreementState) => void,
) {
  if (!process?.id || !process.agreementPublicId) { update({ status: 'absent' }); return; }
  update({ status: 'loading' });
  if (!token) { update({ status: 'error', message: 'Tu sesión venció. Ingresa nuevamente.' }); return; }
  try {
    const agreement = await readAgreement(process.id, process.agreementPublicId, token, signal);
    if(process.flowContract==='AVAILABILITY_V1'&&(!agreement.availability||agreement.availability.availabilityConfirmationId!==process.availability?.availabilityConfirmationId))
      throw new Error('No se pudo verificar el camino del acuerdo.');
    if (!signal.aborted) update({ status: 'loaded', agreement });
  } catch (error) {
    if (!signal.aborted) update({ status: 'error', message: error instanceof RequestProcessError
      ? error.message : 'No se pudieron cargar las condiciones aceptadas. Revisa tu conexión e intenta nuevamente.' });
  }
}

export default function useAgreement(process: RequestProcessSummary | null | undefined) {
  const id = process?.id;
  const publicId = process?.agreementPublicId;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: AgreementState } | null>(null);
  const key = `${id}:${publicId}:${attempt}`;
  useEffect(() => {
    if (!id || !publicId) return;
    const controller = new AbortController();
    const token = localStorage.getItem('zipco-token');
    void fetchAgreementState({ id, agreementPublicId: publicId, flowContract:process?.flowContract, availability:process?.availability }, token, controller.signal,
      (state) => setResult({ key, state }));
    return () => controller.abort();
  }, [id, publicId, key]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const state: AgreementState = !id || !publicId ? { status: 'absent' }
    : result?.key === key ? result.state : { status: 'loading' };
  return { state, retry };
}
