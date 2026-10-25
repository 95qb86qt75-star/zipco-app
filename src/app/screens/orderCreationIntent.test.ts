import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrderCreationIntent, RETRY_ORIGINAL_ORDER_MESSAGE } from './orderCreationIntent';
import { CreateOrderError, type CreatedOrder } from './createOrderApi';

const result: CreatedOrder = { id: 1, total: 2000, items: [] };
const draft = () => ({ identity: 'customer:8/business:5',
  selection: { moment: 'today' as const, date: '', time: '23:59' },
  details: { businessId: 5, items: [{ catalogItemId: 7, quantity: 2 }], note: 'Nota', referencePhoto: null },
});
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-16T02:58:00Z')); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('creation intention lifecycle', () => {
  it('copies and freezes contact intent and replays it after edits without changing the key', async () => {
    const controller = createOrderCreationIntent(() => 'same-key');
    const preference = { allowed: true, textVersion: 'availability-customer-whatsapp-v1' as const };
    const input = { ...draft(), details: { ...draft().details, customerContactPreference: preference } };
    const send = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(result);
    await expect(controller.submit(input, send, vi.fn())).rejects.toThrow();
    preference.allowed = false;
    expect(Object.isFrozen(controller.pendingPayload()?.customerContactPreference)).toBe(true);
    await controller.submit(input, send, vi.fn());
    expect(send.mock.calls[1][0].customerContactPreference.allowed).toBe(true);
    expect(send.mock.calls[1][0]).toBe(send.mock.calls[0][0]);
    expect(send.mock.calls[1][1]).toBe('same-key');
  });
  it.each(['2026-10-16T02:59:30Z', '2026-10-16T03:01:00Z'])('replays identical body and key after %s without resolving the date again', async (instant) => {
    const uuid = vi.fn(() => 'original-key');
    const controller = createOrderCreationIntent(uuid);
    const send = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(result);
    await expect(controller.submit(draft(), send, vi.fn())).rejects.toThrow();
    const originalBody = JSON.stringify(send.mock.calls[0][0]);
    vi.setSystemTime(new Date(instant));
    // A second date resolution would call Intl again (and fail this test).
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => { throw new Error('date resolved again'); });
    await expect(controller.submit(draft(), send, vi.fn())).resolves.toBe(result);
    expect(JSON.stringify(send.mock.calls[1][0])).toBe(originalBody);
    expect(send.mock.calls[1][0].deliveryDate).toBe('2026-10-15');
    expect(send.mock.calls[1][1]).toBe('original-key');
    expect(uuid).toHaveBeenCalledOnce();
  });

  it('blocks simultaneous calls and all repeat submissions after success, clearing pending', async () => {
    let finish!: (order: CreatedOrder) => void;
    const send = vi.fn(() => new Promise<CreatedOrder>((resolve) => { finish = resolve; }));
    const controller = createOrderCreationIntent(() => 'key');
    const first = controller.submit(draft(), send, vi.fn());
    expect(controller.hasPending()).toBe(true);
    await expect(controller.submit(draft(), send, vi.fn())).resolves.toBeNull();
    finish(result); await first;
    expect(controller.hasPending()).toBe(false);
    expect(controller.isBlocked()).toBe(true);
    await expect(controller.submit(draft(), send, vi.fn())).resolves.toBeNull();
    expect(send).toHaveBeenCalledOnce();
  });

  it.each([400, 401, 403, 404, 422])('releases a first-attempt definitive rejection (%s) and allocates a new key', async (status) => {
    const uuid = vi.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2');
    const controller = createOrderCreationIntent(uuid);
    const send = vi.fn().mockRejectedValueOnce(new CreateOrderError('Rechazo', status, 'not-created')).mockResolvedValueOnce(result);
    await expect(controller.submit(draft(), send, vi.fn())).rejects.toThrow();
    expect(controller.hasPending()).toBe(false);
    const corrected = draft(); corrected.details.note = 'Corregida';
    await controller.submit(corrected, send, vi.fn());
    expect(send.mock.calls[0][1]).toBe('key-1'); expect(send.mock.calls[1][1]).toBe('key-2');
  });

  it('never releases an earlier uncertain creation on a subsequent validation/auth rejection', async () => {
    const controller = createOrderCreationIntent(() => 'key');
    const send = vi.fn().mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new CreateOrderError('Hora pasada', 400, 'not-created')).mockResolvedValueOnce(result);
    await expect(controller.submit(draft(), send, vi.fn())).rejects.toThrow();
    await expect(controller.submit(draft(), send, vi.fn())).rejects.toThrow();
    expect(controller.hasPending()).toBe(true);
    await controller.submit(draft(), send, vi.fn());
    expect(send.mock.calls[2]).toEqual(send.mock.calls[0]);
  });

  it.each([408, 409, 429, 500, 503, 200, null])('preserves all uncertain outcomes (%s)', async (status) => {
    const controller = createOrderCreationIntent(() => 'key');
    const send = vi.fn().mockRejectedValueOnce(new CreateOrderError('No confirmado', status)).mockResolvedValueOnce(result);
    await expect(controller.submit(draft(), send, vi.fn())).rejects.toThrow();
    expect(controller.hasPending()).toBe(true);
    await controller.submit(draft(), send, vi.fn());
    expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
  });

  it('replays the original immutable snapshot after editing all conditions', async () => {
    const controller = createOrderCreationIntent(() => 'key'); const notify = vi.fn();
    const send = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(result);
    const form = draft();
    await expect(controller.submit(form, send, notify)).rejects.toThrow();
    form.details.items[0].quantity = 5; form.details.note = 'Modificada'; form.selection.time = '12:00';
    await controller.submit(form, send, notify);
    expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
    expect(send.mock.calls[1][0]).toMatchObject({ note: 'Nota', items: [{ quantity: 2 }], deliveryTime: '23:59' });
    expect(notify).toHaveBeenCalledWith(RETRY_ORIGINAL_ORDER_MESSAGE);
  });

  it('does not replay into another user/business context or allocate another key', async () => {
    const uuid = vi.fn(() => 'key'); const controller = createOrderCreationIntent(uuid);
    const send = vi.fn().mockRejectedValue(new Error('network'));
    await expect(controller.submit(draft(), send, vi.fn())).rejects.toThrow();
    await expect(controller.submit({ ...draft(), identity: 'other-user' }, send, vi.fn())).rejects.toThrow('otra sesión');
    expect(send).toHaveBeenCalledOnce(); expect(uuid).toHaveBeenCalledOnce();
  });

  it('validates the first selection before generating or saving any key', async () => {
    const uuid = vi.fn(() => 'key'); const controller = createOrderCreationIntent(uuid); const send = vi.fn();
    const form = draft(); form.selection.time = '12:00';
    await expect(controller.submit(form, send, vi.fn())).rejects.toThrow('ya pasaron');
    expect(uuid).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled(); expect(controller.hasPending()).toBe(false);
  });
});
