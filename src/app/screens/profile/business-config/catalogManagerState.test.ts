import { describe, expect, it } from 'vitest';
import { appendCatalogItem, createCatalogOperationRunner, moveCatalogItemIds, replaceCatalogItem } from './catalogManagerState';
import type { CatalogItem } from './types';

const makeItem = (id: number, displayOrder: number): CatalogItem => ({
  id, businessId: 1, name: `Item ${id}`, description: `Descripcion ${id}`, kind: 'product',
  pricingMode: 'fixed_price', priceClp: 1000, startingPriceClp: null,
  imageUrl: `https://res.cloudinary.com/zipco/image/upload/catalog/${id}.jpg`, isActive: true, displayOrder,
  createdAt: '2026-09-14T10:00:00.000Z', updatedAt: '2026-09-14T10:00:00.000Z'
});

describe('catalog manager state', () => {
  it('appends using server order and replaces by ID', () => {
    const items = appendCatalogItem([makeItem(1, 0)], makeItem(2, 1));
    expect(items.map(({ id }) => id)).toEqual([1, 2]);
    expect(replaceCatalogItem(items, { ...items[0], name: 'Actualizado' })[0].name).toBe('Actualizado');
  });

  it('moves an item while including every ID exactly once', () => {
    const items = [makeItem(1, 0), makeItem(2, 1), makeItem(3, 2)];
    expect(moveCatalogItemIds(items, 2, -1)).toEqual([2, 1, 3]);
    expect(moveCatalogItemIds(items, 2, 1)).toEqual([1, 3, 2]);
    expect(moveCatalogItemIds(items, 1, -1)).toBeNull();
  });

  it('prevents a second status request while the first one is pending', async () => {
    const runner = createCatalogOperationRunner();
    let resolveFirst!: (value: string) => void;
    const firstRequest = new Promise<string>((resolve) => { resolveFirst = resolve; });
    let requestCount = 0;
    const request = () => { requestCount += 1; return firstRequest; };

    const first = runner.run('status', request);
    const second = runner.run('status', request);
    expect(requestCount).toBe(1);
    await expect(second).resolves.toBeNull();
    resolveFirst('ok');
    await expect(first).resolves.toBe('ok');
  });
});
