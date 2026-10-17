import { describe, expect, it } from 'vitest';
import { businessOrderTabs } from './orderTabs';

const counts = { pending: 3, coordination: 0, waiting: 2, active: 1, ready: 0 };
describe('approved business order tabs', () => {
  it('uses Listos for new or mixed READY orders without promising notification delivery', () => {
    expect(businessOrderTabs({ ...counts, ready: 2 }, 4, true).find((tab) => tab.key === 'ready'))
      .toEqual({ key: 'ready', label: 'Listos', count: 2 });
  });
  it('keeps the approved order even without coordination orders', () => {
    expect(businessOrderTabs(counts, 4).map((tab) => tab.label)).toEqual([
      'Pendientes', 'Por coordinar', 'Esperando respuesta', 'En curso', 'Historial',
    ]);
    expect(businessOrderTabs(counts, 4).map((tab) => tab.count)).toEqual([3, 0, 2, 1, 4]);
  });
  it('preserves the conditional legacy ready tab and internal filter keys', () => {
    const tabs = businessOrderTabs({ ...counts, ready: 2 }, 4);
    expect(tabs.map((tab) => tab.label)).toEqual([
      'Pendientes', 'Por coordinar', 'Esperando respuesta', 'En curso', 'Listo y notificado', 'Historial',
    ]);
    expect(tabs.map((tab) => tab.key)).toEqual(['pending', 'coordination', 'waiting', 'active', 'ready', 'history']);
  });
});
