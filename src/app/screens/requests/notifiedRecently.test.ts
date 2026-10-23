import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ session: {} as object | null, announce: vi.fn() }));
vi.mock('./coordinationSession', () => ({ readCoordinationSession: () => state.session }));
vi.mock('./ActionHologram', () => ({ announceAction: state.announce }));
import { presentReadyNotification, wasJustNotified } from './notifiedRecently';
beforeEach(() => { state.session = {}; state.announce.mockReset(); vi.useFakeTimers(); vi.stubGlobal('window', { dispatchEvent: vi.fn() }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('verified ready presentation', () => {
  it('orders sent, global hologram, then refresh; the memory bridge is agreement/session scoped', async () => {
    const sent = vi.fn(); const promise = presentReadyNotification(20, 'accepted-a', 'verified-key', Date.now(), sent);
    await vi.advanceTimersByTimeAsync(1099); expect(sent).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); expect(sent).toHaveBeenCalledOnce(); expect(state.announce).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(700); expect(state.announce).toHaveBeenCalledWith('ready', { key: 'verified-key' });
    expect(wasJustNotified(20, 'accepted-a')).toBe(true); expect(wasJustNotified(20, 'other')).toBe(false);
    expect(window.dispatchEvent).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(600); await promise;
    expect(vi.mocked(window.dispatchEvent).mock.calls.map(([event]) => event.type)).toEqual(['zipco-requests-refresh']);
    state.session = {}; expect(wasJustNotified(20, 'accepted-a')).toBe(false);
  });
  it('does not emit success after a session change while the animation waits', async () => {
    const sent = vi.fn(); const promise = presentReadyNotification(20, 'a', 'k', Date.now(), sent);
    state.session = null; await vi.runAllTimersAsync(); await promise;
    expect(sent).not.toHaveBeenCalled(); expect(state.announce).not.toHaveBeenCalled(); expect(window.dispatchEvent).not.toHaveBeenCalled();
  });
});
