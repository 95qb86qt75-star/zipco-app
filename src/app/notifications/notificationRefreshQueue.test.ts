import { describe, expect, it, vi } from 'vitest';
import { createNotificationRefreshQueue } from './notificationRefreshQueue';
import { createCustomerOrderNotices } from './orderNotice';
import { parseOrders } from './BusinessNotificationMonitor';
import { orderNotificationState } from '../screens/requests/requestProcess';
import { pendingProcess, coordinationProcess } from '../screens/requests/requestProcessFixtures';

const pending = { id: 20, status: 'pending', requestProcess: pendingProcess };
const accepted = { id: 20, status: 'accepted', requestProcess: coordinationProcess };
const approved = ['Pedido aceptado', 'El negocio aceptó tu pedido. Falta coordinar los siguientes pasos.'];
const stalePush = { type: 'ORDER_ACCEPTED', orderId: 20, title: 'Antiguo', body: 'Preparando pedido', url: 'https://unknown.test' };

function harness(initial: unknown[], read: () => Promise<unknown>, hasBaseline = true) {
  let previous = new Map(parseOrders(initial).map((order) => [order.id, orderNotificationState(order)]));
  let baseline = hasBaseline;
  let current = parseOrders(initial);
  const emit = vi.fn();
  const notify = createCustomerOrderNotices((key, notice, id) => {
    // This assertion also guarantees notice selection uses the refreshed record.
    expect(current.find((order) => order.id === id)).toBeDefined();
    emit(key, notice, id);
  });
  const refresh = createNotificationRefreshQueue(async ({ pushedOrderIds }) => {
    current = parseOrders(await read());
    notify(current, previous, baseline, pushedOrderIds);
    previous = new Map(current.map((order) => [order.id, orderNotificationState(order)]));
    baseline = true;
    return true;
  });
  return { refresh, emit, current: () => current };
}

describe('verified acceptance notices from push, polling and foreground', () => {
  it('waits for the server and replaces stale push copy with the approved 2A notice', async () => {
    let resolve!: (value: unknown) => void;
    const read = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const app = harness([pending], read);
    const refreshing = app.refresh(false, stalePush);
    await Promise.resolve();
    expect(app.emit).not.toHaveBeenCalled();
    resolve([accepted]); await refreshing;
    expect(app.emit).toHaveBeenCalledOnce();
    expect(app.emit.mock.calls[0]).toEqual(['order-20-process:COORDINATION_PENDING', approved, 20]);
    expect(JSON.stringify(app.emit.mock.calls)).not.toContain(stalePush.body);
  });
  it('detects coordination through polling without any push', async () => {
    const app = harness([pending], vi.fn().mockResolvedValue([accepted]));
    await app.refresh();
    expect(app.emit).toHaveBeenCalledWith('order-20-process:COORDINATION_PENDING', approved, 20);
  });
  it('coalesces simultaneous push, polling and foreground without duplicate notices', async () => {
    const read = vi.fn().mockResolvedValue([accepted]); const app = harness([pending], read);
    await Promise.all([app.refresh(false, stalePush), app.refresh(), app.refresh(true)]);
    expect(read).toHaveBeenCalledOnce(); expect(app.emit).toHaveBeenCalledOnce();
    await app.refresh(false, stalePush); await app.refresh(true);
    expect(app.emit).toHaveBeenCalledOnce();
  });
  it('handles a push arriving during an in-flight poll without silently consuming the transition', async () => {
    let resolve!: (value: unknown) => void;
    const read = vi.fn().mockReturnValueOnce(new Promise((r) => { resolve = r; })).mockResolvedValue([accepted]);
    const app = harness([pending], read);
    const poll = app.refresh(); await Promise.resolve();
    const push = app.refresh(false, stalePush);
    resolve([accepted]); await Promise.all([poll, push]);
    expect(read).toHaveBeenCalledTimes(2); expect(app.emit).toHaveBeenCalledOnce();
    expect(app.emit.mock.calls[0][1]).toEqual(approved);
  });
  it('retains the legacy acceptance notice after a verified legacy response', async () => {
    const app = harness([{ id: 20, status: 'pending' }], vi.fn().mockResolvedValue([{ id: 20, status: 'accepted' }]));
    await app.refresh(false, stalePush);
    expect(app.emit).toHaveBeenCalledWith('order-20-accepted', ['Pedido aceptado', 'El negocio acepto tu pedido.'], 20);
  });
  it.each([null, {}, { type: 'UNKNOWN', title: 'internal', body: 'internal', url: 'https://unknown.test' },
    { type: 'UNKNOWN', orderId: {}, body: 'internal' }])('never displays arbitrary unknown payload text: %j', async (payload) => {
    const app = harness([pending], vi.fn().mockResolvedValue([pending]));
    await app.refresh(false, payload);
    expect(app.emit).not.toHaveBeenCalled();
  });
  it('uses only the authoritative state even if an unknown payload carries a valid order hint', async () => {
    const app = harness([pending], vi.fn().mockResolvedValue([accepted]));
    await app.refresh(false, { type: 'UNKNOWN', orderId: 20, title: 'internal', body: 'internal' });
    expect(app.emit.mock.calls[0][1]).toEqual(approved);
    expect(JSON.stringify(app.emit.mock.calls)).not.toContain('internal');
  });
  it('can verify a push before the initial baseline exists', async () => {
    const app = harness([], vi.fn().mockResolvedValue([accepted]), false);
    await app.refresh(false, stalePush);
    expect(app.emit.mock.calls[0][1]).toEqual(approved);
  });
  it('preserves the push hint after a failed read and emits only after a successful refresh', async () => {
    const read = vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce([accepted]);
    const app = harness([], read, false);
    await app.refresh(false, stalePush); expect(app.emit).not.toHaveBeenCalled();
    await app.refresh(); expect(app.emit.mock.calls[0][1]).toEqual(approved);
  });
});
