import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAgreementState, type AgreementState } from './useAgreement';
import { coordinationProcess, pendingProcess, agreementFixture } from './requestProcessFixtures';

afterEach(() => vi.unstubAllGlobals());
describe('agreement loading lifecycle', () => {
  it('does not query legacy, invalid or unaccepted processes', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    for (const process of [undefined, null, pendingProcess]) {
      const update = vi.fn();
      await fetchAgreementState(process, 'test', new AbortController().signal, update);
      expect(update).toHaveBeenLastCalledWith({ status: 'absent' });
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps failure separate from absence and supports a successful retry', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('private network detail'))
      .mockResolvedValueOnce(new Response(JSON.stringify(agreementFixture)));
    vi.stubGlobal('fetch', fetch); const states: AgreementState[] = [];
    const update = (state: AgreementState) => { states.push(state); };
    await fetchAgreementState(coordinationProcess, 'test', new AbortController().signal, update);
    expect(states.map((state) => state.status)).toEqual(['loading', 'error']);
    expect(JSON.stringify(states)).not.toContain('private');
    await fetchAgreementState(coordinationProcess, 'test', new AbortController().signal, update);
    expect(states.map((state) => state.status)).toEqual(['loading', 'error', 'loading', 'loaded']);
  });
  it('ignores a stale response after unmount or a process change', async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((r) => { resolve = r; })));
    const update = vi.fn(); const controller = new AbortController();
    const pending = fetchAgreementState(coordinationProcess, 'test', controller.signal, update);
    controller.abort(); resolve(new Response(JSON.stringify(agreementFixture))); await pending;
    expect(update).toHaveBeenCalledTimes(1); expect(update).toHaveBeenCalledWith({ status: 'loading' });
  });
  it('reports missing session without making a request', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const update = vi.fn();
    await fetchAgreementState(coordinationProcess, null, new AbortController().signal, update);
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'error', message: expect.stringContaining('sesión') }));
    expect(fetch).not.toHaveBeenCalled();
  });
});
