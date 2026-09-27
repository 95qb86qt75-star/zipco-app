import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuote, respondQuote, updateQuoteStatus } from './quoteApi';

afterEach(() => vi.restoreAllMocks());

describe('quote API contract', () => {
  it('sends the authenticated idempotent customer request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    await createQuote({ businessId: 2, catalogItemId: 3, message: 'Detalle', needNow: true }, 'token', '3c2233e0-cda1-4b70-8db4-66fc1d08bf72');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/quotes$/), expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token' }) }));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ businessId: 2, catalogItemId: 3, idempotencyKey: '3c2233e0-cda1-4b70-8db4-66fc1d08bf72' });
  });

  it('uses separate owner-response and customer-status endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ id: 9 }), { status: 200 }));
    await respondQuote(9, 25000, 'Incluye materiales', 'token');
    await updateQuoteStatus(9, 'accepted', 'token');
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/quotes\/9\/respond$/);
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/quotes\/9\/status$/);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ status: 'accepted' });
  });
});
