import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSharedAgreement } from './sharedAgreementRead';
import { readAgreement } from '../api/requestProcessApi';
import { agreementFixture } from '../fixtures/requestProcessFixtures';
vi.mock('../api/requestProcessApi', () => ({ readAgreement: vi.fn() }));
afterEach(() => vi.mocked(readAgreement).mockReset());
describe('agenda and real card shared agreement read', () => {
  it('shares one read and one consumer abort cannot cancel the other', async () => {
    let finish!: (value: typeof agreementFixture) => void;
    vi.mocked(readAgreement).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const abort = new AbortController();
    const card = readSharedAgreement(7, 'agreement-test', 'shared-session', abort.signal).catch(e => e.name);
    const agenda = readSharedAgreement(7, 'agreement-test', 'shared-session');
    expect(readAgreement).toHaveBeenCalledTimes(1);
    const underlying = vi.mocked(readAgreement).mock.calls[0][3]!;
    abort.abort(); expect(underlying.aborted).toBe(false);
    finish(agreementFixture);
    expect(await card).toBe('AbortError'); expect(await agenda).toEqual(agreementFixture);
    await readSharedAgreement(7, 'agreement-test', 'shared-session');
    expect(readAgreement).toHaveBeenCalledTimes(1);
  });
  it('isolates sessions, agreement identity and explicit retries', async () => {
    vi.mocked(readAgreement).mockResolvedValue(agreementFixture);
    await readSharedAgreement(7, 'agreement-test', 'identity-a');
    await readSharedAgreement(7, 'agreement-test', 'identity-b');
    await readSharedAgreement(7, 'changed-agreement', 'identity-a');
    await readSharedAgreement(7, 'agreement-test', 'identity-a', undefined, true);
    expect(readAgreement).toHaveBeenCalledTimes(4);
  });
  it('does not cache failures and aborts the network when all consumers leave', async () => {
    vi.mocked(readAgreement).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(agreementFixture);
    await expect(readSharedAgreement(7, 'agreement-test', 'retry-session')).rejects.toThrow('network');
    await readSharedAgreement(7, 'agreement-test', 'retry-session');
    expect(readAgreement).toHaveBeenCalledTimes(2);
    vi.mocked(readAgreement).mockImplementation(() => new Promise(() => {}));
    const abort = new AbortController();
    const pending = readSharedAgreement(7, 'agreement-test', 'aborted-session', abort.signal);
    const underlying = vi.mocked(readAgreement).mock.calls[2][3]!;
    abort.abort(); await expect(pending).rejects.toHaveProperty('name', 'AbortError');
    expect(underlying.aborted).toBe(true);
  });
});
