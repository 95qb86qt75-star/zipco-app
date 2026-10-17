import { describe, expect, it, vi } from 'vitest';
import { createCoordinationIntents } from './coordinationIntent';
import { coordinationBody } from './coordinationApi';
import { RequestProcessError } from './requestProcessErrors';

const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const body = coordinationBody('OPEN_WHATSAPP', 2);
const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
};
describe('coordination intention lifecycle', () => {
  it('keeps exact UUID and body after uncertain errors, including remount/recovery', async () => {
    const saved = storage(); const uuid = vi.fn(() => key);
    const first = createCoordinationIntents(uuid, saved);
    const send = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce('confirmed');
    await expect(first.run('user', 7, 'OPEN_WHATSAPP', body, send)).rejects.toThrow();
    const recovered = createCoordinationIntents(uuid, saved);
    recovered.read('user', 7);
    recovered.allowReconciledRetry('user', 7); // Caller has refreshed the unchanged server state.
    await recovered.run('user', 7, 'OPEN_WHATSAPP', { expectedVersion: 99, consentAccepted: true }, send, true);
    expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]); expect(uuid).toHaveBeenCalledOnce();
    expect(recovered.read('user', 7)).toBeNull();
  });
  it('blocks changed conditions while an original request is uncertain', async () => {
    const intents = createCoordinationIntents(() => key);
    const send = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(intents.run('user', 7, 'OPEN_WHATSAPP', body, send)).rejects.toThrow();
    await expect(intents.run('user', 7, 'START_WORK', { expectedVersion: 3 }, send)).rejects.toThrow('Primero reintenta');
    expect(send).toHaveBeenCalledOnce();
  });
  it('blocks double touch and stale repeat after confirmed start', async () => {
    const intents = createCoordinationIntents(() => key, storage());
    let finish!: (value: string) => void;
    const send = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const first = intents.run('user', 7, 'START_WORK', { expectedVersion: 2 }, send);
    expect(await intents.run('user', 7, 'START_WORK', { expectedVersion: 2 }, send)).toBeNull();
    finish('done'); await first;
    expect(await intents.run('user', 7, 'START_WORK', { expectedVersion: 2 }, send)).toBeNull();
    expect(send).toHaveBeenCalledOnce(); expect(intents.read('user', 7)).toBeNull();
  });
  it('allows deliberate repeated WhatsApp access with new keys and never persists navigation', async () => {
    const saved = storage(); const set = vi.spyOn(saved, 'setItem');
    const uuid = vi.fn().mockReturnValueOnce(key).mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    const intents = createCoordinationIntents(uuid, saved); const send = vi.fn().mockResolvedValue({ navigation: { url: 'https://wa.me/12345678?text=private' } });
    await intents.run('user', 7, 'OPEN_WHATSAPP', body, send); await intents.run('user', 7, 'OPEN_WHATSAPP', body, send);
    expect(send).toHaveBeenCalledTimes(2); expect(uuid).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(set.mock.calls)).not.toContain('wa.me');
  });
  it('does not automatically repeat conflicts; clearing after refresh allows a new intention', async () => {
    const uuid = vi.fn(() => key); const intents = createCoordinationIntents(uuid);
    const send = vi.fn().mockRejectedValueOnce(new RequestProcessError('Actualizar', 409, true)).mockResolvedValue('done');
    await expect(intents.run('user', 7, 'START_WORK', { expectedVersion: 2 }, send)).rejects.toThrow();
    expect(send).toHaveBeenCalledOnce(); intents.clear('user', 7);
    await intents.run('user', 7, 'START_WORK', { expectedVersion: 3 }, send);
    expect(uuid).toHaveBeenCalledTimes(2);
  });
  it('does not generate or send a new key from corrupt storage', async () => {
    const saved = storage(); saved.setItem('zipco-coordination:user:7', '{broken');
    const uuid = vi.fn(() => key); const send = vi.fn();
    await expect(createCoordinationIntents(uuid, saved).run('user', 7, 'START_WORK', { expectedVersion: 2 }, send)).rejects.toThrow('No se pudo recuperar');
    expect(uuid).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
  it.each(['START_WORK', 'MARK_READY', 'OPEN_WHATSAPP'] as const)('quarantines confirmed %s if removeItem fails, also after manager recreation', async (action) => {
    const saved = storage(); vi.spyOn(saved, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    const uuid = vi.fn(() => key); const send = vi.fn().mockResolvedValue('confirmed');
    const intentBody = coordinationBody(action, 2);
    const intents = createCoordinationIntents(uuid, saved);
    expect(await intents.run('user', 7, action, intentBody, send)).toBe('confirmed');
    expect(intents.read('user', 7)).toBeNull(); expect(intents.warning('user', 7)).toContain('no se pudo limpiar');
    await expect(intents.run('user', 7, action, intentBody, send)).rejects.toThrow('No repitas');
    const recreated = createCoordinationIntents(uuid, saved);
    expect(recreated.read('user', 7)).toBeNull();
    await expect(recreated.run('user', 7, action, intentBody, send, true)).rejects.toThrow('No repitas');
    expect(send).toHaveBeenCalledOnce(); expect(uuid).toHaveBeenCalledOnce();
    expect(JSON.parse(saved.getItem('zipco-coordination:user:7')!).confirmed).toBe(true);
  });
  it('retains memory confirmation and warns about reload when both tombstone write and removal fail', async () => {
    const saved = storage(); const originalSet = saved.setItem;
    vi.spyOn(saved, 'setItem').mockImplementation((key, value) => {
      if (JSON.parse(value).confirmed) throw new Error('denied'); originalSet(key, value);
    });
    vi.spyOn(saved, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    const uuid = vi.fn(() => key); const send = vi.fn().mockResolvedValue('done');
    const intents = createCoordinationIntents(uuid, saved);
    await intents.run('user', 7, 'OPEN_WHATSAPP', body, send);
    expect(intents.read('user', 7)).toBeNull();
    expect(intents.warning('user', 7)).toContain('no se garantiza');
    await expect(intents.run('user', 7, 'OPEN_WHATSAPP', body, send)).rejects.toThrow();
    expect(send).toHaveBeenCalledOnce(); expect(uuid).toHaveBeenCalledOnce();
  });
  it('does not send anything if the pending intention cannot be persisted', async () => {
    const saved = storage(); vi.spyOn(saved, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    const send = vi.fn();
    await expect(createCoordinationIntents(() => key, saved).run('user', 7, 'OPEN_WHATSAPP', body, send)).rejects.toThrow('preparar');
    expect(send).not.toHaveBeenCalled();
  });
  it('keeps an abandoned POST bound to its original scope for later reconciliation', async () => {
    const saved = storage(); const intents = createCoordinationIntents(() => key, saved);
    let active = true; let finish!: (result: string) => void;
    const request = intents.run('original', 7, 'OPEN_WHATSAPP', body, () => new Promise<string>((resolve) => { finish = resolve; }), false, () => active);
    active = false; saved.setItem('zipco-coordination:other:7', 'do-not-touch'); finish('server-confirmed');
    expect(await request).toBeNull(); expect(intents.read('original', 7)?.key).toBe(key);
    expect(saved.getItem('zipco-coordination:other:7')).toBe('do-not-touch');
  });
  it('does not retire an unrelated user intention even if its UUID happens to match', async () => {
    const saved = storage(); const intents = createCoordinationIntents(() => key, saved);
    await intents.run('first-user', 7, 'START_WORK', { expectedVersion: 2 }, async () => 'confirmed');
    saved.setItem('zipco-coordination:other-user:7', JSON.stringify({ action: 'OPEN_WHATSAPP', body, key }));
    expect(intents.read('other-user', 7)?.key).toBe(key);
    expect(intents.warning('other-user', 7)).toBe('');
  });
  it('blocks restored uncertain records until explicit reconciliation, also when confirmation could not be persisted', async () => {
    const saved = storage(); saved.setItem('zipco-coordination:user:7', JSON.stringify({ action: 'OPEN_WHATSAPP', body, key }));
    const uuid = vi.fn(() => key); const send = vi.fn(); const recreated = createCoordinationIntents(uuid, saved);
    await expect(recreated.run('user', 7, 'OPEN_WHATSAPP', body, send, true)).rejects.toThrow('Actualiza su estado');
    expect(send).not.toHaveBeenCalled(); expect(uuid).not.toHaveBeenCalled();
    expect(recreated.needsReconciliation('user', 7)).toBe(true);
  });
  it.each(['AUTHORIZE_CONTACT', 'START_WORK', 'MARK_READY', 'ANNUL_COORDINATION'] as const)('keeps the confirmed signature for %s after reconstruction and successful cleanup', async (action) => {
    const saved = storage();
    const remove = vi.spyOn(saved, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    const uuid = vi.fn(() => key); const send = vi.fn().mockResolvedValue('confirmed');
    const originalBody = coordinationBody(action, 2, 'COORDINATION_NOT_REACHED');
    await createCoordinationIntents(uuid, saved).run('user', 7, action, originalBody, send);
    const recreated = createCoordinationIntents(uuid, saved);
    expect(recreated.read('user', 7)).toBeNull();
    remove.mockRestore(); recreated.retryCleanup('user', 7);
    expect(recreated.warning('user', 7)).toBe('');
    expect(saved.getItem('zipco-coordination:user:7')).toBeNull();
    expect(await recreated.run('user', 7, action, originalBody, send)).toBeNull();
    expect(await recreated.run('user', 7, action, originalBody, send, true)).toBeNull();
    expect(uuid).toHaveBeenCalledOnce(); expect(send).toHaveBeenCalledOnce();
  });
  it('never replays a cleaned confirmed WhatsApp intention but allows a deliberate new access', async () => {
    const saved = storage();
    const remove = vi.spyOn(saved, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    const uuid = vi.fn().mockReturnValueOnce(key).mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    const send = vi.fn().mockResolvedValue('confirmed');
    await createCoordinationIntents(uuid, saved).run('user', 7, 'OPEN_WHATSAPP', body, send);
    const recreated = createCoordinationIntents(uuid, saved);
    recreated.read('user', 7); remove.mockRestore(); recreated.retryCleanup('user', 7);
    expect(await recreated.run('user', 7, 'OPEN_WHATSAPP', body, send, true)).toBeNull();
    expect(uuid).toHaveBeenCalledOnce(); expect(send).toHaveBeenCalledOnce();
    expect(await recreated.run('user', 7, 'OPEN_WHATSAPP', body, send)).toBe('confirmed');
    expect(uuid).toHaveBeenCalledTimes(2); expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].key).not.toBe(send.mock.calls[0][0].key);
  });
});
