import { readAgreement } from '../api/requestProcessApi';
import type { AgreementReadDto } from '../domain/agreement';

type Flight = {
  controller: AbortController; readers: number; settled: boolean;
  expires: number; promise: Promise<AgreementReadDto>;
};
const reads = new Map<string, Flight>();
const REUSE_MS = 60_000;

/** Session-scoped, bounded reuse of immutable accepted conditions. Never cache errors.
 * A list and its mounted cards share the read; cancelling one consumer cannot cancel another.
 */
export function readSharedAgreement(processId: number, publicId: string | null, token: string,
  signal?: AbortSignal, force = false): Promise<AgreementReadDto> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  const key = JSON.stringify([token, processId, publicId]);
  const now = Date.now();
  for (const [k, value] of reads) if (value.settled && value.expires <= now) reads.delete(k);
  let flight = force ? undefined : reads.get(key);
  if (!flight || flight.controller.signal.aborted) {
    const controller = new AbortController();
    const entry: Flight = { controller, readers: 0, settled: false, expires: Infinity,
      promise: readAgreement(processId, publicId, token, controller.signal) };
    flight = entry;
    reads.set(key, entry);
    entry.promise.then(() => {
      entry.settled = true; entry.expires = Date.now() + REUSE_MS;
      // Keep the cache bounded without interrupting active readers.
      for (const [k, value] of reads) {
        if (reads.size <= 128) break;
        if (value.settled) reads.delete(k);
      }
    }, () => {
      entry.settled = true;
      if (reads.get(key) === entry) reads.delete(key);
    });
  }
  const entry = flight;
  entry.readers++;
  return new Promise((resolve, reject) => {
    let done = false;
    const release = () => {
      if (done) return false;
      done = true; signal?.removeEventListener('abort', abort);
      entry.readers--;
      if (!entry.settled && entry.readers === 0) {
        entry.controller.abort();
        if (reads.get(key) === entry) reads.delete(key);
      }
      return true;
    };
    const abort = () => { if (release()) reject(new DOMException('Aborted', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    entry.promise.then(value => { if (release()) resolve(value); }, error => { if (release()) reject(error); });
  });
}
