import { describe, expect, it } from 'vitest';
import { getCatalogItemAction, getCatalogPricingCounts, getPublicCatalogPriceLabel, selectionAfterCatalogChange, toggleCatalogSelection } from './catalogItemPresentation';
import type { CatalogItem } from './profile/business-config/types';

const item = (id: number, kind: CatalogItem['kind'], pricingMode: CatalogItem['pricingMode']): CatalogItem => ({ id, businessId: 1, name: 'Item', description: 'Descripción', kind, pricingMode, priceClp: pricingMode === 'fixed_price' ? 100 : null, startingPriceClp: null, imageUrl: 'https://res.cloudinary.com/x/image/upload/a.jpg', isActive: true, displayOrder: 0, createdAt: '2026-09-14T00:00:00.000Z', updatedAt: '2026-09-14T00:00:00.000Z' });

describe('catalog item presentation', () => {
  it('counts catalog items by their pricing mode', () => {
    expect(getCatalogPricingCounts([
      item(1, 'product', 'fixed_price'),
      item(2, 'service', 'fixed_price'),
      item(3, 'product', 'quote'),
      item(4, 'service', 'view')
    ])).toEqual({ fixed_price: 2, quote: 1, view: 1 });
  });
  it('maps every temporary action', () => {
    expect(getCatalogItemAction(item(1, 'product', 'fixed_price'))).toBe('order');
    expect(getCatalogItemAction(item(1, 'product', 'quote'))).toBe('quote-soon');
    expect(getCatalogItemAction(item(1, 'service', 'fixed_price'))).toBe('service-soon');
    expect(getCatalogItemAction(item(1, 'service', 'quote'))).toBe('quote-soon');
    expect(getCatalogItemAction(item(1, 'service', 'view'))).toBe('view');
  });
  it('does not select pending actions and caps distinct items at 20', () => {
    expect(toggleCatalogSelection([], item(1, 'product', 'quote'))).toEqual([]);
    const full = Array.from({ length: 20 }, (_, index) => index + 1);
    expect(toggleCatalogSelection(full, item(21, 'product', 'fixed_price'))).toEqual(full);
  });
  it('omits price text for view items while preserving other price labels', () => {
    expect(getPublicCatalogPriceLabel(item(1, 'product', 'view'))).toBeNull();
    expect(getPublicCatalogPriceLabel(item(2, 'product', 'fixed_price'))).toBe('$100');
    expect(getPublicCatalogPriceLabel(item(3, 'product', 'quote'))).toBe('A cotizar');
  });
  it('removes stale, duplicate and non-orderable selections', () => {
    expect(selectionAfterCatalogChange([1, 1, 2, 3], [item(1, 'product', 'fixed_price'), item(2, 'service', 'fixed_price')])).toEqual([1]);
  });
});
