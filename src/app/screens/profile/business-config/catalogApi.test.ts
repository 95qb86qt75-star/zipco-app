import { describe, expect, it, vi } from 'vitest';
import {
  createCatalogItem,
  getManagedCatalog,
  getPublicCatalog,
  reorderCatalogItems,
  setCatalogItemActive,
  updateCatalogItem
} from './catalogApi';

const item = {
  id: 1, businessId: 2, name: 'Torta', description: 'Torta de chocolate', kind: 'product',
  pricingMode: 'fixed_price', priceClp: 12000, startingPriceClp: null,
  imageUrl: 'https://res.cloudinary.com/zipco/image/upload/catalog/torta.jpg', isActive: true, displayOrder: 0,
  createdAt: '2026-09-14T10:00:00.000Z', updatedAt: '2026-09-14T10:00:00.000Z'
};
const payload = {
  name: 'Torta', description: 'Torta de chocolate', kind: 'product' as const,
  pricingMode: 'fixed_price' as const, priceClp: 12000, startingPriceClp: null,
  imageUrl: 'https://res.cloudinary.com/zipco/image/upload/catalog/torta.jpg'
};
const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('catalog API', () => {
  it('loads public catalog without authorization', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response([item]));
    await getPublicCatalog(2, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringMatching(/\/businesses\/2\/catalog-items$/), {});
  });

  it('loads managed catalog with authorization', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response([item]));
    await getManagedCatalog(2, 'token-test', fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringMatching(/\/businesses\/2\/catalog-items\/manage$/), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-test' }) }));
  });

  it('creates and updates with strict write payloads', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(item)).mockResolvedValueOnce(response(item));
    await createCatalogItem(2, 'token-test', payload, fetchImpl);
    await updateCatalogItem(2, 1, 'token-test', payload, fetchImpl);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(payload) });
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ method: 'PATCH', body: JSON.stringify(payload) });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).not.toHaveProperty('isActive');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).not.toHaveProperty('displayOrder');
  });

  it('changes status with a boolean and reorders with all IDs', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response({ ...item, isActive: false })).mockResolvedValueOnce(response([item]));
    await setCatalogItemActive(2, 1, 'token-test', false, fetchImpl);
    await reorderCatalogItems(2, 'token-test', [1], fetchImpl);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: 'PATCH', body: '{"isActive":false}' });
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: '{"itemIds":[1]}' });
  });

  it.each([400, 401, 403, 404, 500])('returns controlled HTTP errors for %s', async (status) => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('internal', { status }));
    await expect(getManagedCatalog(2, 'secret-token', fetchImpl)).rejects.toMatchObject({ status });
  });

  it('handles network and invalid successful responses without logging secrets', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(getManagedCatalog(2, 'secret-token', vi.fn().mockRejectedValue(new Error('network')))).rejects.toMatchObject({ status: null });
    await expect(getManagedCatalog(2, 'secret-token', vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })))).rejects.toThrow('formato valido');
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
