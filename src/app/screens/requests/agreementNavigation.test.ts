import { describe, expect, it } from 'vitest';
import { agreementLink, agreementReturnLink, initialRequestViews, parseRequestStatusView } from './agreementNavigation';

describe('agreement local navigation round trip', () => {
  it.each([false, true])('keeps the origin category for the same participant (business=%s)', (business) => {
    for (const view of ['pending', 'coordination', 'waiting', 'active', 'ready', 'history'] as const) {
      const agreement = agreementLink(7, business, view === 'history', view);
      const query = agreement.slice(agreement.indexOf('?'));
      const destination = agreementReturnLink(query);
      const expectedKey = `${business ? 'my-business' : 'my-orders'}-orders`;
      expect(initialRequestViews(destination.slice(1))).toEqual({ [expectedKey]: view });
      expect(destination).toContain(`open=requests-${business ? 'business' : 'customer'}`);
      expect(agreement).toContain('/procesos/7/acuerdo');
    }
  });
  it('supports previously published history links without a view parameter', () => {
    expect(agreementReturnLink('?participant=business&volver=historial')).toBe('/?open=requests-business&view=history');
    expect(initialRequestViews('?open=requests-customer&view=history')).toEqual({ 'my-orders-orders': 'history' });
  });
  it('defaults safely for direct or unknown links without accepting an arbitrary destination', () => {
    expect(agreementReturnLink('')).toBe('/?open=requests-customer&view=pending');
    expect(agreementReturnLink('?participant=https://example.test&view=javascript:bad&returnTo=https://example.test'))
      .toBe('/?open=requests-customer&view=pending');
    for (const value of [null, '', 'COORDINATION_PENDING', 'https://example.test', '__proto__']) expect(parseRequestStatusView(value)).toBeUndefined();
    expect(initialRequestViews('?view=unknown')).toEqual({});
  });
  it('keeps the customer origin and discards unrelated query parameters', () => {
    const destination = agreementReturnLink('?participant=customer&view=coordination&unrelated=discard');
    expect(destination).toBe('/?open=requests-customer&view=coordination');
    expect(initialRequestViews(destination.slice(1))).not.toHaveProperty('my-business-orders');
  });
});
